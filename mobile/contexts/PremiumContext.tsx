import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { purchasesService, PurchaseInfo, OfferingInfo } from '../services/purchases';
import { Package } from 'react-native-purchases';

const PREMIUM_STORAGE_KEY = '@recipe_wizard_premium_status';

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  setPremiumStatus: (status: boolean) => Promise<void>;
  checkPremiumFeature: (featureName: string) => boolean;
  // Revenue Cat integration
  purchaseInfo: PurchaseInfo | null;
  offerings: OfferingInfo[];
  purchasePackage: (pkg: Package) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshPurchases: () => Promise<void>;
  initializePurchases: (userId?: string) => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

interface PremiumProviderProps {
  children: ReactNode;
}

export function PremiumProvider({ children }: PremiumProviderProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseInfo, setPurchaseInfo] = useState<PurchaseInfo | null>(null);
  const [offerings, setOfferings] = useState<OfferingInfo[]>([]);

  // Check environment variable for initial premium status
  const isEnvironmentPremium = Constants.expoConfig?.extra?.isPremium === 'true';

  useEffect(() => {
    initializeAndLoadStatus();
  }, []);

  const initializeAndLoadStatus = async () => {
    try {
      setIsLoading(true);

      // First, try to initialize Revenue Cat (will fallback to mock if keys not set)
      await initializePurchases();

      // Load status from Revenue Cat or fallback to local storage
      await refreshPurchases();
    } catch (error) {
      console.error('❌ Failed to initialize premium status:', error);
      // Fallback to legacy local storage method
      await loadLegacyPremiumStatus();
    } finally {
      setIsLoading(false);
    }
  };

  const loadLegacyPremiumStatus = async () => {
    try {
      const stored = await AsyncStorage.getItem(PREMIUM_STORAGE_KEY);

      if (stored !== null) {
        // Use stored preference if available
        const storedStatus = JSON.parse(stored);
        setIsPremium(storedStatus);
        // console.log(`📱 Premium status loaded from storage: ${storedStatus}`);
      } else {
        // If no stored preference, use environment variable as default
        setIsPremium(isEnvironmentPremium);
        // console.log(`🌍 Premium status from environment: ${isEnvironmentPremium}`);

        // Save the environment default to storage for future consistency
        if (isEnvironmentPremium) {
          await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(isEnvironmentPremium));
        }
      }
    } catch (error) {
      console.error('❌ Failed to load legacy premium status:', error);
      // Fallback to environment variable on error
      setIsPremium(isEnvironmentPremium);
    }
  };

  const setPremiumStatus = async (status: boolean) => {
    try {
      setIsPremium(status);
      await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(status));
      // console.log(`✅ Premium status updated: ${status}`);
    } catch (error) {
      console.error('❌ Failed to save premium status:', error);
      // Revert on error
      setIsPremium(!status);
      throw new Error('Failed to update premium status');
    }
  };

  const checkPremiumFeature = (featureName: string): boolean => {
    if (isLoading) {
      // During loading, allow access to avoid blocking UI
      return true;
    }

    const hasAccess = isPremium;
    // console.log(`🔐 Premium check for "${featureName}": ${hasAccess ? 'GRANTED' : 'DENIED'}`);
    return hasAccess;
  };

  // Revenue Cat integration methods
  const initializePurchases = async (userId?: string) => {
    try {
      await purchasesService.initialize(userId);
      // console.log('✅ Purchase service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize purchase service:', error);
      throw error;
    }
  };

  const refreshPurchases = async () => {
    try {
      let currentPurchaseInfo: PurchaseInfo;
      let currentOfferings: OfferingInfo[];

      // Use mock data if Revenue Cat is not properly configured
      if (purchasesService.isMockMode) {
        // console.log('🎭 Using mock purchase data');
        currentPurchaseInfo = await purchasesService.getMockPremiumStatus();
        currentOfferings = await purchasesService.getMockOfferings();
      } else {
        // console.log('💳 Using real Revenue Cat data');
        currentPurchaseInfo = await purchasesService.getPremiumStatus();
        currentOfferings = await purchasesService.getOfferings();
      }

      setPurchaseInfo(currentPurchaseInfo);
      setOfferings(currentOfferings);
      setIsPremium(currentPurchaseInfo.isActive);

      // Sync with local storage for consistency
      await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(currentPurchaseInfo.isActive));

      // console.log(`✅ Premium status refreshed: ${currentPurchaseInfo.isActive}`);
    } catch (error) {
      console.error('❌ Failed to refresh purchases:', error);
      // Don't throw - fall back to existing state
    }
  };

  const purchasePackage = async (pkg: Package): Promise<boolean> => {
    try {
      if (purchasesService.isMockMode) {
        // console.log('🎭 Simulating package purchase:', pkg.identifier);
        // Simulate purchase success
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock successful purchase
        const mockPurchaseInfo: PurchaseInfo = {
          isActive: true,
          productId: pkg.product.identifier,
          originalPurchaseDate: new Date().toISOString(),
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          willRenew: true,
          isInIntroOfferPeriod: false,
          isInGracePeriod: false,
        };

        setPurchaseInfo(mockPurchaseInfo);
        setIsPremium(true);
        await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(true));

        // console.log('✅ Mock purchase completed successfully');
        return true;
      } else {
        await purchasesService.purchasePackage(pkg);
        await refreshPurchases();
        // console.log('✅ Real purchase completed successfully');
        return true;
      }
    } catch (error) {
      console.error('❌ Purchase failed:', error);
      return false;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    try {
      if (purchasesService.isMockMode) {
        // console.log('🎭 Simulating purchase restoration');
        // For mock mode, just refresh current status
        await refreshPurchases();
        return true;
      } else {
        await purchasesService.restorePurchases();
        await refreshPurchases();
        // console.log('✅ Purchases restored successfully');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to restore purchases:', error);
      return false;
    }
  };

  const value: PremiumContextType = {
    isPremium,
    isLoading,
    setPremiumStatus,
    checkPremiumFeature,
    purchaseInfo,
    offerings,
    purchasePackage,
    restorePurchases,
    refreshPurchases,
    initializePurchases,
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium(): PremiumContextType {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}

// Convenience hook for checking specific premium features
export function usePremiumFeature(featureName: string): boolean {
  const { checkPremiumFeature } = usePremium();
  return checkPremiumFeature(featureName);
}

// Premium feature constants for consistent naming
export const PREMIUM_FEATURES = {
  AI_RECIPE_IDEAS: 'ai_recipe_ideas',
  SMART_SHOPPING_LISTS: 'smart_shopping_lists',
  COMPLETE_HISTORY: 'complete_history',
  RECIPE_MODIFICATION: 'recipe_modification',
} as const;