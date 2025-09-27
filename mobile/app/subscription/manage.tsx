import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/ThemeProvider';
import { usePremium } from '../../contexts/PremiumContext';
import { HeaderComponent } from '../../components/HeaderComponent';
import { Button } from '../../components/Button';
import { ExpandableCard } from '../../components/ExpandableCard';
import { purchasesService, PRODUCT_IDS } from '../../services/purchases';

export default function ManageSubscriptionScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { isPremium, purchaseInfo, refreshPurchases } = usePremium();
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Premium features list
  const premiumFeatures = [
    'AI Recipe Ideas',
    'Smart Shopping Lists',
    'Complete Recipe History',
    'Recipe Modification',
  ];

  // Get subscription data from Revenue Cat with real prices
  const loadSubscriptionData = async () => {
    if (!purchaseInfo || !purchaseInfo.isActive || !purchaseInfo.productId) {
      setSubscriptionData(null);
      setLoadingError(null);
      return;
    }

    try {
      setLoadingError(null);
      setIsLoading(true);

      // Get real product info from Revenue Cat offerings
      const productInfo = await purchasesService.getProductInfo(purchaseInfo.productId);

      let planName = 'Premium Subscription';
      let price = 'N/A';
      let period = 'month';

      if (productInfo) {
        planName = productInfo.planName;
        price = productInfo.price;
        period = productInfo.period;
      } else {
        // Fallback using exact product ID matching
        if (purchaseInfo.productId === PRODUCT_IDS.MONTHLY) {
          planName = 'Monthly Premium';
          price = '$4.99'; // Fallback price
          period = 'month';
        } else if (purchaseInfo.productId === PRODUCT_IDS.YEARLY) {
          planName = 'Yearly Premium';
          price = '$49.99'; // Fallback price
          period = 'year';
        }
      }

      // Format next billing date with user's locale
      let nextBilling = 'Unknown';
      if (purchaseInfo.expirationDate) {
        try {
          const expirationDate = new Date(purchaseInfo.expirationDate);
          if (!isNaN(expirationDate.getTime())) {
            nextBilling = expirationDate.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          }
        } catch (dateError) {
          console.warn('Failed to format expiration date:', dateError);
          nextBilling = 'Unknown';
        }
      }

      // Determine status
      let status = 'Active';
      if (purchaseInfo.isInGracePeriod) {
        status = 'Grace Period';
      } else if (!purchaseInfo.willRenew) {
        status = 'Expires Soon';
      }

      setSubscriptionData({
        plan: planName,
        price,
        period,
        nextBilling,
        status,
        willRenew: purchaseInfo.willRenew,
        isInGracePeriod: purchaseInfo.isInGracePeriod,
        originalPurchaseDate: purchaseInfo.originalPurchaseDate,
      });
    } catch (error) {
      console.error('Failed to load subscription data:', error);
      setLoadingError('Unable to load subscription details. Please try again.');
      setSubscriptionData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Refresh purchase info when component mounts
    refreshPurchases();
  }, [refreshPurchases]);

  useEffect(() => {
    // Load subscription data when purchase info changes
    loadSubscriptionData();
  }, [purchaseInfo]);

  const handleCancelSubscription = () => {
    const billingDate = subscriptionData?.nextBilling || 'the end of your current billing period';

    Alert.alert(
      'Cancel Subscription',
      `Are you sure you want to cancel your premium subscription?\n\n• You'll continue to have access until ${billingDate}\n• You can resubscribe anytime\n• Your recipes and data will be saved`,
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Continue to Cancel',
          style: 'destructive',
          onPress: () => {
            const instructions = Platform.OS === 'ios'
              ? 'To cancel your subscription:\n\n1. Go to Settings on your device\n2. Tap your Apple ID at the top\n3. Tap "Media & Purchases"\n4. Tap "Manage Subscriptions"\n5. Find Recipe Wizard and tap "Cancel"'
              : 'To cancel your subscription:\n\n1. Open Google Play Store\n2. Tap Menu → Subscriptions\n3. Find Recipe Wizard\n4. Tap "Cancel subscription"';

            Alert.alert(
              'Cancel Subscription',
              instructions,
              [
                { text: 'Not Now', style: 'cancel' },
                {
                  text: 'Open Settings',
                  onPress: async () => {
                    // Prefer store-native management URL from RevenueCat
                    try {
                      const url = await purchasesService.getManagementURL();
                      if (url) {
                        Linking.openURL(url);
                        return;
                      }
                    } catch {}
                    if (Platform.OS === 'ios') {
                      // Try multiple iOS deep link options in order of reliability
                      Linking.openURL('App-prefs:root=APPLE_ACCOUNT&path=SUBSCRIPTIONS')
                        .catch(() =>
                          Linking.openURL('https://apps.apple.com/account/subscriptions')
                            .catch(() =>
                              Linking.openURL('App-prefs:root=APPLE_ACCOUNT')
                                .catch(() =>
                                  Alert.alert(
                                    'Manual Steps Required',
                                    'Please go to Settings > [Your Name] > Media & Purchases > Manage Subscriptions on your device.',
                                    [{ text: 'OK' }]
                                  )
                                )
                            )
                        );
                    } else {
                      // Try Android deep link with better fallback
                      const packageName = 'com.cammybeck.recipewizard'; // Actual package name from app.json
                      Linking.openURL(`https://play.google.com/store/account/subscriptions?package=${packageName}`)
                        .catch(() =>
                          Linking.openURL('https://play.google.com/store/account/subscriptions')
                            .catch(() =>
                              Alert.alert(
                                'Manual Steps Required',
                                'Please go to Google Play Store > Menu > Subscriptions to manage your subscription.',
                                [{ text: 'OK' }]
                              )
                            )
                        );
                    }
                  }
                },
              ]
            );
          },
        },
      ],
    );
  };

  const handleUpdatePayment = () => {
    const title = 'Update Payment Method';
    const message = Platform.OS === 'ios'
      ? 'To update your payment method, please go to:\n\nSettings > Apple ID > Media & Purchases > Manage Payments'
      : 'To update your payment method, please go to:\n\nGoogle Play Store > Account > Payments & Subscriptions > Payment Methods';

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: async () => {
          // Prefer store-native management URL from RevenueCat
          try {
            const url = await purchasesService.getManagementURL();
            if (url) {
              Linking.openURL(url);
              return;
            }
          } catch {}
          if (Platform.OS === 'ios') {
            // Try iOS payment settings with fallbacks
            Linking.openURL('App-prefs:root=APPLE_ACCOUNT&path=MEDIA_AND_PURCHASES')
              .catch(() =>
                Linking.openURL('https://appleid.apple.com/account/manage')
                  .catch(() =>
                    Linking.openURL('App-prefs:root=APPLE_ACCOUNT')
                      .catch(() =>
                        Alert.alert(
                          'Manual Steps Required',
                          'Please go to Settings > [Your Name] > Media & Purchases > Manage Payments on your device.',
                          [{ text: 'OK' }]
                        )
                      )
                  )
              );
          } else {
            // Try Android payment settings with fallbacks
            Linking.openURL('https://play.google.com/store/paymentmethods')
              .catch(() =>
                Linking.openURL('https://payments.google.com/gp/w/u/0/home/paymentmethods')
                  .catch(() =>
                    Alert.alert(
                      'Manual Steps Required',
                      'Please go to Google Play Store > Account > Payments & Subscriptions > Payment Methods.',
                      [{ text: 'OK' }]
                    )
                  )
              );
          }
        }
      },
    ]);
  };

  const handleChangeplan = () => {
    router.push('/subscription/plans');
  };

  if (!isPremium) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.theme.background }} edges={['top']}>
        <HeaderComponent
          title="Manage Subscription"
          subtitle="No active subscription"
          rightContent={
            <TouchableOpacity onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/profile');
              }
            }}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.colors.theme.text}
              />
            </TouchableOpacity>
          }
        />

        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.spacing['2xl'],
        }}>
          <MaterialCommunityIcons
            name="crown-outline"
            size={80}
            color={theme.colors.theme.textTertiary}
            style={{ marginBottom: theme.spacing.xl }}
          />
          <Text style={{
            fontSize: theme.typography.fontSize.titleLarge,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.theme.text,
            textAlign: 'center',
            marginBottom: theme.spacing.md,
          }}>
            No Active Subscription
          </Text>
          <Text style={{
            fontSize: theme.typography.fontSize.bodyLarge,
            color: theme.colors.theme.textSecondary,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: theme.spacing['2xl'],
          }}>
            Subscribe to Premium to access all features and manage your subscription here.
          </Text>
          <Button
            onPress={handleChangeplan}
            variant="primary"
            leftIcon="crown"
          >
            View Premium Plans
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.theme.background }} edges={['top']}>
      <HeaderComponent
        title="Manage Subscription"
        subtitle={subscriptionData ? `${subscriptionData.status} • ${subscriptionData.plan}` : "Premium Active"}
        rightContent={
          <TouchableOpacity onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/profile');
            }
          }}>
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
          gap: theme.spacing.lg,
        }}
      >
        {/* Error Banner */}
        {loadingError && (
          <View style={{
            padding: theme.spacing.md,
            backgroundColor: theme.colors.status.error + '20',
            borderRadius: theme.borderRadius.lg,
            borderWidth: 1,
            borderColor: theme.colors.status.error + '40',
            marginBottom: theme.spacing.lg,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: theme.spacing.sm,
            }}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={20}
                color={theme.colors.status.error}
                style={{ marginRight: theme.spacing.sm }}
              />
              <Text style={{
                fontSize: theme.typography.fontSize.bodyMedium,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.theme.text,
                flex: 1,
              }}>
                {loadingError}
              </Text>
            </View>
            <Button
              onPress={loadSubscriptionData}
              variant="outline"
              size="small"
              leftIcon="refresh"
              style={{
                borderColor: theme.colors.status.error,
                alignSelf: 'flex-start',
              }}
              textStyle={{ color: theme.colors.status.error }}
            >
              Try Again
            </Button>
          </View>
        )}

        {/* Loading State */}
        {isLoading && !subscriptionData && (
          <View style={{
            padding: theme.spacing.xl,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MaterialCommunityIcons
              name="loading"
              size={32}
              color={theme.colors.wizard.primary}
              style={{ marginBottom: theme.spacing.md }}
            />
            <Text style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.textSecondary,
              textAlign: 'center',
            }}>
              Loading subscription details...
            </Text>
          </View>
        )}
        {/* Current Plan */}
        <ExpandableCard
          title="Current Plan"
          subtitle={subscriptionData ? `${subscriptionData.plan} • ${subscriptionData.price}/${subscriptionData.period}` : "Premium Plan"}
          icon="crown"
          defaultExpanded={true}
        >
          <View style={{ gap: theme.spacing.lg }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: theme.spacing.md,
              backgroundColor: theme.colors.wizard.primary + '20',
              borderRadius: theme.borderRadius.lg,
              borderWidth: 2,
              borderColor: theme.colors.wizard.primary,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyLarge,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.theme.text,
                  marginBottom: theme.spacing.xs,
                }}>
                  {subscriptionData?.plan || 'Premium Plan'}
                </Text>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  color: theme.colors.theme.textSecondary,
                }}>
                  {subscriptionData?.willRenew
                    ? `Next billing: ${subscriptionData.nextBilling}`
                    : `Expires: ${subscriptionData?.nextBilling || 'Unknown'}`
                  }
                </Text>
              </View>
              <View style={{
                backgroundColor: subscriptionData?.isInGracePeriod
                  ? theme.colors.status.warning
                  : !subscriptionData?.willRenew
                    ? theme.colors.status.error
                    : theme.colors.status.success,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.xs,
                borderRadius: theme.borderRadius.md,
              }}>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodySmall,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: '#ffffff',
                }}>
                  {subscriptionData?.status || 'Active'}
                </Text>
              </View>
            </View>

            <View>
              <Text style={{
                fontSize: theme.typography.fontSize.bodyMedium,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.theme.text,
                marginBottom: theme.spacing.md,
              }}>
                Included Features:
              </Text>
              {premiumFeatures.map((feature, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={16}
                    color={theme.colors.status.success}
                    style={{ marginRight: theme.spacing.sm }}
                  />
                  <Text style={{
                    fontSize: theme.typography.fontSize.bodyMedium,
                    color: theme.colors.theme.textSecondary,
                  }}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ExpandableCard>

        {/* Payment Management */}
        <ExpandableCard
          title="Payment & Billing"
          subtitle="Manage payment methods and billing"
          icon="credit-card"
          defaultExpanded={false}
        >
          <View style={{ gap: theme.spacing.md }}>
            <Button
              onPress={handleUpdatePayment}
              variant="outline"
              leftIcon="credit-card"
              loading={isLoading}
            >
              Update Payment Method
            </Button>

            <Button
              onPress={() => router.push('/subscription/payment-history')}
              variant="outline"
              leftIcon="receipt"
            >
              View Payment History
            </Button>

            <View style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.theme.surface,
              borderRadius: theme.borderRadius.lg,
              borderWidth: 1,
              borderColor: theme.colors.theme.border,
            }}>
              <Text style={{
                fontSize: theme.typography.fontSize.bodySmall,
                color: theme.colors.theme.textSecondary,
                fontStyle: 'italic',
                textAlign: 'center',
              }}>
                Manage your subscription through your device's app store (App Store or Google Play).
              </Text>
            </View>
          </View>
        </ExpandableCard>

        {/* Subscription Actions */}
        <ExpandableCard
          title="Subscription Actions"
          subtitle="Change plan or cancel subscription"
          icon="cog"
          defaultExpanded={false}
        >
          <View style={{ gap: theme.spacing.md }}>
            <Button
              onPress={handleChangeplan}
              variant="outline"
              leftIcon="arrow-up-circle"
            >
              Change Plan
            </Button>

            <Button
              onPress={handleCancelSubscription}
              variant="outline"
              leftIcon="cancel"
              textStyle={{ color: theme.colors.status.error }}
              style={{ borderColor: theme.colors.status.error }}
            >
              Cancel Subscription
            </Button>
          </View>
        </ExpandableCard>

        {/* Support */}
        <ExpandableCard
          title="Help & Support"
          subtitle="Get help with your subscription"
          icon="help-circle"
          defaultExpanded={false}
        >
          <View style={{ gap: theme.spacing.md }}>
            <Text style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.textSecondary,
              lineHeight: 20,
              marginBottom: theme.spacing.sm,
            }}>
              Need help with your subscription? We're here to assist you.
            </Text>

            <Button
              onPress={() => Alert.alert('Support', 'This would open a support contact form or email in production.')}
              variant="outline"
              leftIcon="email"
            >
              Contact Support
            </Button>
          </View>
        </ExpandableCard>

        <View style={{ marginBottom: theme.spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}
