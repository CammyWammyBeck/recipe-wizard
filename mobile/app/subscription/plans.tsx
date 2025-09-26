import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/ThemeProvider';
import { usePremium } from '../../contexts/PremiumContext';
import { HeaderComponent } from '../../components/HeaderComponent';
import { Button } from '../../components/Button';
import { PACKAGE_TYPE } from 'react-native-purchases';

interface PlanFeature {
  icon: string;
  title: string;
  description: string;
}

interface SubscriptionPlan {
  id: string;
  title: string;
  price: string;
  period: string;
  originalPrice?: string;
  savings?: string;
  popular?: boolean;
  features: PlanFeature[];
}

export default function SubscriptionPlansScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const {
    isPremium,
    offerings,
    purchaseInfo,
    purchasePackage,
    restorePurchases,
    refreshPurchases
  } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    // Auto-select the first available package
    if (offerings.length > 0 && offerings[0].packages.length > 0) {
      const firstPackage = offerings[0].packages[0];
      setSelectedPlan(firstPackage.identifier);
    }
  }, [offerings]);

  // Convert Revenue Cat offerings to our plan format
  const getPlansFromOfferings = (): SubscriptionPlan[] => {
    if (offerings.length === 0) {
      return [];
    }

    const baseFeatures = [
      {
        icon: 'lightbulb',
        title: 'AI Recipe Ideas',
        description: 'Get personalized recipe suggestions'
      },
      {
        icon: 'cart',
        title: 'Smart Shopping Lists',
        description: 'Organized grocery lists with categories'
      },
      {
        icon: 'history',
        title: 'Complete Recipe History',
        description: 'Access all your previous recipes'
      },
      {
        icon: 'pencil',
        title: 'Recipe Modification',
        description: 'Edit and customize recipes'
      },
    ];

    const yearlyFeatures = [
      ...baseFeatures,
      {
        icon: 'star',
        title: 'Priority Support',
        description: 'Get help faster with priority customer support'
      },
      {
        icon: 'update',
        title: 'Early Access',
        description: 'Be first to try new features and updates'
      },
    ];

    return offerings[0].packages.map((pkg) => {
      const isYearly = pkg.packageType === PACKAGE_TYPE.ANNUAL;
      const isMonthly = pkg.packageType === PACKAGE_TYPE.MONTHLY;

      let period = 'period';
      let title = pkg.product.title;

      if (isMonthly) {
        period = 'month';
        title = title || 'Monthly Premium';
      } else if (isYearly) {
        period = 'year';
        title = title || 'Yearly Premium';
      }

      // Calculate savings for yearly plan
      const originalPrice = pkg.product.introPrice?.priceString;
      const savings = pkg.product.introPrice ?
        `Save with intro offer` : undefined;

      return {
        id: pkg.identifier,
        title,
        price: pkg.product.priceString,
        period,
        originalPrice,
        savings,
        popular: isYearly,
        features: isYearly ? yearlyFeatures : baseFeatures,
      };
    });
  };

  const plans = getPlansFromOfferings();

  const handleSubscribe = async (planId: string) => {
    if (offerings.length === 0) {
      Alert.alert('Error', 'No subscription plans available at the moment. Please try again later.');
      return;
    }

    // Find the package from Revenue Cat offerings
    const packageToPurchase = offerings[0].packages.find(pkg =>
      pkg.product.identifier === planId || pkg.product.identifier.startsWith(planId)
    );
    if (!packageToPurchase) {
      Alert.alert('Error', 'Selected plan not found. Please try again.');
      return;
    }

    try {
      setIsLoading(true);

      const success = await purchasePackage(packageToPurchase);

      if (success) {
        // Navigate to success screen
        router.push('/subscription/payment-success');
      } else {
        Alert.alert('Purchase Failed', 'The purchase could not be completed. Please try again.');
      }
    } catch (error) {
      console.error('Purchase error:', error);

      // Navigate to failure screen with error details
      router.push({
        pathname: '/subscription/payment-failure',
        params: {
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsRestoring(true);

      const success = await restorePurchases();

      if (success) {
        Alert.alert(
          'Restore Successful',
          'Your purchases have been restored successfully.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'No previous purchases were found to restore.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(
        'Restore Failed',
        'Failed to restore purchases. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const renderPlanCard = (plan: SubscriptionPlan) => (
    <View
      key={plan.id}
      style={{
        marginBottom: theme.spacing.lg,
        borderRadius: theme.borderRadius.xl,
        borderWidth: selectedPlan === plan.id ? 3 : 2,
        borderColor: selectedPlan === plan.id
          ? theme.colors.wizard.primary
          : theme.colors.theme.border,
        backgroundColor: selectedPlan === plan.id
          ? theme.colors.wizard.primary + '10'
          : theme.colors.theme.surface,
        overflow: 'hidden',
      }}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <View style={{
          backgroundColor: theme.colors.wizard.primary,
          paddingVertical: theme.spacing.xs,
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: theme.typography.fontSize.bodySmall,
            fontWeight: theme.typography.fontWeight.bold,
            color: '#ffffff',
          }}>
            MOST POPULAR
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={() => setSelectedPlan(plan.id)}
        style={{ padding: theme.spacing.lg }}
        activeOpacity={0.8}
      >
        {/* Plan Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing.lg,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: theme.typography.fontSize.titleLarge,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.theme.text,
              marginBottom: theme.spacing.xs,
            }}>
              {plan.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{
                fontSize: theme.typography.fontSize.headlineMedium,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.wizard.primary,
              }}>
                {plan.price}
              </Text>
              <Text style={{
                fontSize: theme.typography.fontSize.bodyMedium,
                color: theme.colors.theme.textSecondary,
                marginLeft: theme.spacing.xs,
              }}>
                /{plan.period}
              </Text>
            </View>
            {plan.originalPrice && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xs }}>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodySmall,
                  color: theme.colors.theme.textTertiary,
                  textDecorationLine: 'line-through',
                  marginRight: theme.spacing.sm,
                }}>
                  {plan.originalPrice}
                </Text>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodySmall,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.status.success,
                }}>
                  {plan.savings}
                </Text>
              </View>
            )}
          </View>

          <View style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: selectedPlan === plan.id
              ? theme.colors.wizard.primary
              : theme.colors.theme.border,
            backgroundColor: selectedPlan === plan.id
              ? theme.colors.wizard.primary
              : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {selectedPlan === plan.id && (
              <MaterialCommunityIcons
                name="check"
                size={16}
                color="#ffffff"
              />
            )}
          </View>
        </View>

        {/* Features */}
        <View style={{ gap: theme.spacing.md }}>
          {plan.features.map((feature, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}
            >
              <MaterialCommunityIcons
                name={feature.icon as any}
                size={20}
                color={theme.colors.wizard.primary}
                style={{ marginRight: theme.spacing.md, marginTop: 2 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.theme.text,
                  marginBottom: theme.spacing.xs,
                }}>
                  {feature.title}
                </Text>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodySmall,
                  color: theme.colors.theme.textSecondary,
                  lineHeight: 18,
                }}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.theme.background }} edges={['top']}>
      <HeaderComponent
        title="Premium Plans"
        subtitle="Choose the plan that works for you"
        rightContent={
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={theme.colors.theme.text}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing.lg,
        }}
      >
        {/* Current Status */}
        {isPremium && (
          <View style={{
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.wizard.primary + '20',
            borderRadius: theme.borderRadius.lg,
            borderWidth: 2,
            borderColor: theme.colors.wizard.primary,
            marginBottom: theme.spacing.lg,
            alignItems: 'center',
          }}>
            <MaterialCommunityIcons
              name="crown"
              size={32}
              color={theme.colors.wizard.primary}
              style={{ marginBottom: theme.spacing.sm }}
            />
            <Text style={{
              fontSize: theme.typography.fontSize.titleMedium,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.theme.text,
              marginBottom: theme.spacing.xs,
            }}>
              You're Already Premium!
            </Text>
            <Text style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.textSecondary,
              textAlign: 'center',
              marginBottom: theme.spacing.sm,
            }}>
              {purchaseInfo?.productId ?
                `Active: ${purchaseInfo.productId}` :
                'You can change your plan or manage your subscription below.'
              }
            </Text>
            {purchaseInfo?.expirationDate && (
              <Text style={{
                fontSize: theme.typography.fontSize.bodySmall,
                color: theme.colors.theme.textTertiary,
                textAlign: 'center',
              }}>
                {purchaseInfo.willRenew ? 'Renews' : 'Expires'}: {new Date(purchaseInfo.expirationDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {/* Loading state for empty offerings */}
        {offerings.length === 0 && (
          <View style={{
            padding: theme.spacing.xl,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MaterialCommunityIcons
              name="loading"
              size={32}
              color={theme.colors.theme.textSecondary}
              style={{ marginBottom: theme.spacing.md }}
            />
            <Text style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.textSecondary,
              textAlign: 'center',
            }}>
              Loading subscription plans...
            </Text>
          </View>
        )}

        {/* Plans */}
        {plans.map(renderPlanCard)}

        {/* Subscribe Button */}
        {plans.length > 0 && (
          <Button
            onPress={() => handleSubscribe(selectedPlan)}
            variant="primary"
            leftIcon="crown"
            loading={isLoading}
            style={{ marginBottom: theme.spacing.md }}
          >
            {isPremium ? 'Change Plan' : `Start ${plans.find(p => p.id === selectedPlan)?.title}`}
          </Button>
        )}

        {/* Restore Purchases Button */}
        <Button
          onPress={handleRestorePurchases}
          variant="secondary"
          leftIcon="refresh"
          loading={isRestoring}
          style={{ marginBottom: theme.spacing.lg }}
        >
          Restore Purchases
        </Button>

        {/* Terms */}
        <View style={{
          padding: theme.spacing.md,
          backgroundColor: theme.colors.theme.surface,
          borderRadius: theme.borderRadius.lg,
          borderWidth: 1,
          borderColor: theme.colors.theme.border,
          marginBottom: theme.spacing['2xl'],
        }}>
          <Text style={{
            fontSize: theme.typography.fontSize.bodySmall,
            color: theme.colors.theme.textTertiary,
            textAlign: 'center',
            lineHeight: 18,
          }}>
            {offerings.length === 0 ?
              'Loading subscription options from the app store...' :
              'Subscriptions are managed through your device\'s app store. You can cancel anytime from your App Store or Google Play account settings. Terms and conditions apply.'
            }
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}