import Purchases, {
  CustomerInfo,
  Offering,
  Package,
  INTRO_ELIGIBILITY_STATUS,
  PACKAGE_TYPE,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Revenue Cat API keys from environment variables
const REVENUE_CAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_IOS ||
                                'your_ios_api_key_here';

const REVENUE_CAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_ANDROID ||
                                   'your_android_api_key_here';

// Subscription product identifiers (these will be configured in Revenue Cat dashboard)
export const PRODUCT_IDS = {
  MONTHLY: 'recipe_wizard_monthly',
  YEARLY: 'recipe_wizard_yearly',
} as const;

// Entitlement identifier (this determines what features the user has access to)
export const ENTITLEMENT_ID = 'premium_features';

export interface PurchaseInfo {
  isActive: boolean;
  productId: string | null;
  originalPurchaseDate: string | null;
  expirationDate: string | null;
  willRenew: boolean;
  isInIntroOfferPeriod: boolean;
  isInGracePeriod: boolean;
}

export interface OfferingInfo {
  identifier: string;
  serverDescription: string;
  packages: Array<{
    identifier: string;
    packageType: PACKAGE_TYPE;
    originalPackage: Package; // Store the original Package object for purchases
    product: {
      identifier: string;
      description: string;
      title: string;
      price: string;
      priceString: string;
      currencyCode: string;
      introPrice?: {
        price: string;
        priceString: string;
        period: string;
        cycles: number;
      };
    };
  }>;
}

class PurchasesService {
  private isInitialized = false;

  async initialize(userId?: string): Promise<void> {
    try {
      // Check if running in Expo Go (Revenue Cat doesn't work in Expo Go)
      const isExpoGo = Constants.appOwnership === 'expo';

      if (isExpoGo) {
        if (__DEV__) { /* console.log('🔧 Expo Go detected - Revenue Cat disabled, using mock mode'); */ }
        this.isInitialized = true;
        return;
      }

      // Configure Revenue Cat with appropriate API key for platform
      const apiKey = Platform.OS === 'ios' ? REVENUE_CAT_API_KEY_IOS : REVENUE_CAT_API_KEY_ANDROID;

      // For now, use Android key for both platforms since we only have Android set up
      const actualApiKey = REVENUE_CAT_API_KEY_ANDROID;

      // Validate API key format
      if (!actualApiKey || actualApiKey === 'your_android_api_key_here') {
        throw new Error('Revenue Cat API key not configured');
      }


      // Set appropriate log level for production
      Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.INFO : LOG_LEVEL.WARN);

      // Initialize Revenue Cat
      await Purchases.configure({ apiKey: actualApiKey });

      // Set user ID if provided (for analytics and support)
      if (userId) {
        await Purchases.logIn(userId);
      }

      this.isInitialized = true;
      // console.log('✅ Revenue Cat initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Revenue Cat:', error);
      throw new Error('Failed to initialize purchase service');
    }
  }

  async getCurrentCustomerInfo(): Promise<CustomerInfo> {
    if (!this.isInitialized) {
      throw new Error('Purchases service not initialized');
    }

    try {
      // console.log('📞 Making RevenueCat API call: getCustomerInfo()');
      const customerInfo = await Purchases.getCustomerInfo();
      // console.log('✅ getCustomerInfo() success:', {
      //   originalAppUserId: customerInfo.originalAppUserId,
      //   activeEntitlements: Object.keys(customerInfo.entitlements.active),
      //   allEntitlements: Object.keys(customerInfo.entitlements.all),
      //   requestDate: customerInfo.requestDate
      // });
      return customerInfo;
    } catch (error: any) {
      console.error('❌ getCustomerInfo() failed:', {
        error: error.message,
        code: error.code,
        underlyingError: error.underlyingErrorMessage,
        fullError: error
      });
      throw error;
    }
  }

  async getPremiumStatus(): Promise<PurchaseInfo> {
    try {
      const customerInfo = await this.getCurrentCustomerInfo();
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

      if (entitlement) {
        return {
          isActive: true,
          productId: entitlement.productIdentifier,
          originalPurchaseDate: entitlement.originalPurchaseDate,
          expirationDate: entitlement.expirationDate,
          willRenew: entitlement.willRenew,
          isInIntroOfferPeriod: entitlement.isInIntroOfferPeriod,
          isInGracePeriod: entitlement.isInGracePeriod,
        };
      }

      return {
        isActive: false,
        productId: null,
        originalPurchaseDate: null,
        expirationDate: null,
        willRenew: false,
        isInIntroOfferPeriod: false,
        isInGracePeriod: false,
      };
    } catch (error) {
      console.error('❌ Failed to get premium status:', error);
      // Return inactive status on error to be safe
      return {
        isActive: false,
        productId: null,
        originalPurchaseDate: null,
        expirationDate: null,
        willRenew: false,
        isInIntroOfferPeriod: false,
        isInGracePeriod: false,
      };
    }
  }

  async getOfferings(): Promise<OfferingInfo[]> {
    if (!this.isInitialized) {
      throw new Error('Purchases service not initialized');
    }

    try {
      // console.log('📞 Making RevenueCat API call: getOfferings()');
      const offerings = await Purchases.getOfferings();

      // console.log('✅ getOfferings() raw response:', {
      //   currentOfferingId: offerings.current?.identifier,
      //   allOfferingsCount: Object.keys(offerings.all).length,
      //   allOfferingIds: Object.keys(offerings.all),
      //   fullResponse: offerings
      // });

      const processedOfferings = Object.values(offerings.all).map((offering: Offering) => {
        // console.log(`📦 Processing offering: ${offering.identifier}`, {
        //   description: offering.serverDescription,
        //   packagesCount: offering.availablePackages.length,
        //   packageIds: offering.availablePackages.map(p => p.identifier)
        // });

        return {
          identifier: offering.identifier,
          serverDescription: offering.serverDescription,
          packages: offering.availablePackages.map((pkg: Package) => {
            // console.log(`📦 Processing package: ${pkg.identifier}`, {
            //   productId: pkg.product.identifier,
            //   price: pkg.product.priceString,
            //   title: pkg.product.title
            // });

            return {
              identifier: pkg.identifier,
              packageType: pkg.packageType,
              originalPackage: pkg, // Store the original Package object
              product: {
                identifier: pkg.product.identifier,
                description: pkg.product.description,
                title: pkg.product.title,
                price: pkg.product.price.toString(),
                priceString: pkg.product.priceString,
                currencyCode: pkg.product.currencyCode,
                introPrice: pkg.product.introPrice ? {
                  price: pkg.product.introPrice.price.toString(),
                  priceString: pkg.product.introPrice.priceString,
                  period: pkg.product.introPrice.period,
                  cycles: pkg.product.introPrice.cycles,
                } : undefined,
              },
            };
          }),
        };
      });

      // console.log('✅ getOfferings() processed:', processedOfferings);
      return processedOfferings;
    } catch (error: any) {
      console.error('❌ getOfferings() failed:', {
        error: error.message,
        code: error.code,
        underlyingError: error.underlyingErrorMessage,
        fullError: error
      });
      throw error;
    }
  }

  async purchasePackage(packageToPurchase: Package): Promise<CustomerInfo> {
    if (!this.isInitialized) {
      throw new Error('Purchases service not initialized');
    }

    try {
      // console.log('🛒 Starting purchase process for:', packageToPurchase.product.identifier);

      // Ensure presentedOfferingContext is provided to avoid native NPE in RN bridge
      let pkgForPurchase: any = packageToPurchase as any;
      if (!pkgForPurchase.presentedOfferingContext) {
        try {
          const rcOfferings = await Purchases.getOfferings();
          // Try to locate the offering that contains this package
          const allOfferings: any[] = Object.values((rcOfferings as any).all || {});
          const containingOffering = allOfferings.find((off: any) =>
            Array.isArray(off?.availablePackages) &&
            off.availablePackages.some((p: any) => p?.identifier === packageToPurchase.identifier)
          );
          const offeringIdentifier = (containingOffering?.identifier) || (rcOfferings as any).current?.identifier || 'default';
          pkgForPurchase = {
            identifier: (packageToPurchase as any).identifier,
            presentedOfferingContext: { offeringIdentifier },
          } as any;
          // console.log('ℹ️ Injected presentedOfferingContext for purchase:', offeringIdentifier);
        } catch (ctxErr) {
          console.warn('⚠️ Failed to compute presentedOfferingContext, proceeding without. May crash on some SDKs.', ctxErr);
        }
      }

      const { customerInfo } = await Purchases.purchasePackage(pkgForPurchase as any);

      // console.log('✅ Purchase completed successfully');
      return customerInfo;
    } catch (error) {
      console.error('❌ Purchase failed:', error);

      // Robust error handling without instanceof (PurchasesError is a type, not a class)
      const err: any = error || {};
      const code = err.code;

      if (err.userCancelled || code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        throw new Error('Purchase was cancelled');
      }
      switch (code) {
        case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
          throw new Error('Payment is pending');
        case PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
          throw new Error('Product not available for purchase');
        case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
          throw new Error('Store connection problem');
        default:
          throw new Error(`Purchase failed: ${err.message || String(err)}`);
      }
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    if (!this.isInitialized) {
      throw new Error('Purchases service not initialized');
    }

    try {
      // console.log('🔄 Restoring purchases...');

      const customerInfo = await Purchases.restorePurchases();

      // console.log('✅ Purchases restored successfully');
      return customerInfo;
    } catch (error) {
      console.error('❌ Failed to restore purchases:', error);
      throw error;
    }
  }

  async checkTrialEligibility(productIds: string[]): Promise<Record<string, INTRO_ELIGIBILITY_STATUS>> {
    if (!this.isInitialized) {
      throw new Error('Purchases service not initialized');
    }

    try {
      const eligibility = await Purchases.checkTrialOrIntroDiscountEligibility(productIds);
      return eligibility;
    } catch (error) {
      console.error('❌ Failed to check trial eligibility:', error);
      throw error;
    }
  }

  async setUserID(userId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Purchases service not initialized');
    }

    try {
      await Purchases.logIn(userId);
      // console.log('✅ User ID set successfully:', userId);
    } catch (error) {
      console.error('❌ Failed to set user ID:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await Purchases.logOut();
      // console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Failed to logout:', error);
      throw error;
    }
  }

  // Mock implementation for testing when API keys are not set up
  async getMockPremiumStatus(): Promise<PurchaseInfo> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In development, return a mock status based on environment
    const isDevelopment = __DEV__ && Constants.expoConfig?.extra?.isPremium === 'true';

    return {
      isActive: isDevelopment,
      productId: isDevelopment ? PRODUCT_IDS.MONTHLY : null,
      originalPurchaseDate: isDevelopment ? new Date().toISOString() : null,
      expirationDate: isDevelopment ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      willRenew: isDevelopment,
      isInIntroOfferPeriod: false,
      isInGracePeriod: false,
    };
  }

  async getMockOfferings(): Promise<OfferingInfo[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return [
      {
        identifier: 'default',
        serverDescription: 'Recipe Wizard Premium Plans',
        packages: [
          {
            identifier: PRODUCT_IDS.MONTHLY,
            packageType: PACKAGE_TYPE.MONTHLY,
            originalPackage: {} as Package, // Mock package for development
            product: {
              identifier: PRODUCT_IDS.MONTHLY,
              description: 'Premium features including unlimited recipe generation and smart shopping lists',
              title: 'Recipe Wizard Premium Monthly',
              price: '4.99',
              priceString: '$4.99',
              currencyCode: 'USD',
              introPrice: {
                price: '0.99',
                priceString: '$0.99',
                period: 'P1W',
                cycles: 1,
              },
            },
          },
          {
            identifier: PRODUCT_IDS.YEARLY,
            packageType: PACKAGE_TYPE.ANNUAL,
            originalPackage: {} as Package, // Mock package for development
            product: {
              identifier: PRODUCT_IDS.YEARLY,
              description: 'Premium features including unlimited recipe generation and smart shopping lists',
              title: 'Recipe Wizard Premium Yearly',
              price: '49.99',
              priceString: '$49.99',
              currencyCode: 'USD',
              introPrice: {
                price: '9.99',
                priceString: '$9.99',
                period: 'P1M',
                cycles: 1,
              },
            },
          },
        ],
      },
    ];
  }

  // Check if we're using mock data (before real API keys are set up or in Expo Go)
  get isMockMode(): boolean {
    const isExpoGo = Constants.appOwnership === 'expo';
    const hasAndroidKey = REVENUE_CAT_API_KEY_ANDROID !== 'your_android_api_key_here' &&
                         REVENUE_CAT_API_KEY_ANDROID !== 'INSERT_KEY_HERE' &&
                         REVENUE_CAT_API_KEY_ANDROID.startsWith('goog_');

    // For now, we only need Android key to work (iOS can be placeholder)
    return isExpoGo || !hasAndroidKey;
  }
}

// Export singleton instance
export const purchasesService = new PurchasesService();
