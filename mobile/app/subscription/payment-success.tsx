import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/ThemeProvider';
import { usePremium } from '../../contexts/PremiumContext';
import { HeaderComponent } from '../../components/HeaderComponent';
import { Button } from '../../components/Button';

export default function PaymentSuccessScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isPremium, purchaseInfo, refreshPurchases } = usePremium();

  useEffect(() => {
    // Refresh purchase status to get latest information
    refreshPurchases();
  }, [refreshPurchases]);

  // Get payment details from Revenue Cat purchase info or fallback to params
  const planTitle = purchaseInfo?.productId || params.planTitle as string || 'Premium Plan';
  const planPrice = params.planPrice as string || 'Premium';
  const planPeriod = params.planPeriod as string || 'subscription';
  const paymentMethod = 'App Store';

  // Animation states
  const [checkmarkScale] = useState(new Animated.Value(0));
  const [contentOpacity] = useState(new Animated.Value(0));
  const [showConfetti, setShowConfetti] = useState(false);

  // Transaction details from Revenue Cat or mock
  const transactionId = purchaseInfo?.originalPurchaseDate ?
    'RC' + new Date(purchaseInfo.originalPurchaseDate).getTime().toString().slice(-8) :
    'TXN' + Math.random().toString(36).substr(2, 8).toUpperCase();

  const currentDate = purchaseInfo?.originalPurchaseDate ?
    new Date(purchaseInfo.originalPurchaseDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) :
    new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const nextBilling = purchaseInfo?.expirationDate ?
    new Date(purchaseInfo.expirationDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) :
    new Date(Date.now() + (planPeriod === 'year' ? 365 : 30) * 24 * 60 * 60 * 1000)
      .toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  useEffect(() => {
    // Animate checkmark
    Animated.sequence([
      Animated.timing(checkmarkScale, {
        toValue: 1.2,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(checkmarkScale, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // Animate content
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 500,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Show confetti effect
    setTimeout(() => setShowConfetti(true), 100);
  }, [checkmarkScale, contentOpacity]);

  const premiumFeatures = [
    {
      icon: 'lightbulb',
      title: 'AI Recipe Ideas',
      description: 'Personalized suggestions ready to use'
    },
    {
      icon: 'cart',
      title: 'Smart Shopping Lists',
      description: 'Organized grocery lists with categories'
    },
    {
      icon: 'history',
      title: 'Complete Recipe History',
      description: 'Access all your saved recipes'
    },
    {
      icon: 'pencil',
      title: 'Recipe Modification',
      description: 'Edit and customize any recipe'
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.theme.background }} edges={['top']}>
      <HeaderComponent
        title="Payment Successful"
        subtitle="Welcome to Premium!"
        rightContent={
          <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
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
          alignItems: 'center',
        }}
      >
        {/* Success Animation */}
        <View style={{
          alignItems: 'center',
          marginBottom: theme.spacing['2xl'],
        }}>
          <View style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: theme.colors.status.success + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.lg,
            position: 'relative',
          }}>
            {/* Confetti Effect */}
            {showConfetti && (
              <>
                {[...Array(8)].map((_, i) => (
                  <View
                    key={i}
                    style={{
                      position: 'absolute',
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: [
                        theme.colors.wizard.primary,
                        theme.colors.wizard.accent,
                        theme.colors.status.success,
                        theme.colors.status.warning,
                      ][i % 4],
                      top: 20 + Math.random() * 80,
                      left: 20 + Math.random() * 80,
                      opacity: 0.7,
                    }}
                  />
                ))}
              </>
            )}

            <Animated.View
              style={{
                transform: [{ scale: checkmarkScale }],
              }}
            >
              <MaterialCommunityIcons
                name="check"
                size={60}
                color={theme.colors.status.success}
              />
            </Animated.View>
          </View>

          <Animated.View
            style={{
              opacity: contentOpacity,
              alignItems: 'center',
            }}
          >
            <Text style={{
              fontSize: theme.typography.fontSize.headlineLarge,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.theme.text,
              textAlign: 'center',
              marginBottom: theme.spacing.sm,
            }}>
              Welcome to Premium!
            </Text>
            <Text style={{
              fontSize: theme.typography.fontSize.bodyLarge,
              color: theme.colors.theme.textSecondary,
              textAlign: 'center',
              lineHeight: 24,
            }}>
              Your subscription has been activated successfully
            </Text>
          </Animated.View>
        </View>

        {/* Subscription Details */}
        <Animated.View
          style={{
            opacity: contentOpacity,
            width: '100%',
            marginBottom: theme.spacing.xl,
          }}
        >
          <View style={{
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.theme.surface,
            borderRadius: theme.borderRadius.lg,
            borderWidth: 1,
            borderColor: theme.colors.theme.border,
          }}>
            <Text style={{
              fontSize: theme.typography.fontSize.titleMedium,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.theme.text,
              marginBottom: theme.spacing.lg,
              textAlign: 'center',
            }}>
              Subscription Details
            </Text>

            <View style={{ gap: theme.spacing.md }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  color: theme.colors.theme.textSecondary,
                }}>
                  Plan
                </Text>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.theme.text,
                }}>
                  {planTitle}
                </Text>
              </View>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  color: theme.colors.theme.textSecondary,
                }}>
                  Amount
                </Text>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.theme.text,
                }}>
                  {planPrice}/{planPeriod}
                </Text>
              </View>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  color: theme.colors.theme.textSecondary,
                }}>
                  Payment Method
                </Text>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.theme.text,
                }}>
                  {paymentMethod}
                </Text>
              </View>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  color: theme.colors.theme.textSecondary,
                }}>
                  Transaction ID
                </Text>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodySmall,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.theme.text,
                  fontFamily: 'monospace',
                }}>
                  {transactionId}
                </Text>
              </View>

              <View style={{
                height: 1,
                backgroundColor: theme.colors.theme.border,
                marginVertical: theme.spacing.sm,
              }} />

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  color: theme.colors.theme.textSecondary,
                }}>
                  Next Billing Date
                </Text>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.theme.text,
                }}>
                  {nextBilling}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Premium Features Now Available */}
        <Animated.View
          style={{
            opacity: contentOpacity,
            width: '100%',
            marginBottom: theme.spacing.xl,
          }}
        >
          <Text style={{
            fontSize: theme.typography.fontSize.titleMedium,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.theme.text,
            marginBottom: theme.spacing.lg,
            textAlign: 'center',
          }}>
            Your Premium Features
          </Text>

          <View style={{ gap: theme.spacing.md }}>
            {premiumFeatures.map((feature, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.wizard.primary + '10',
                  borderRadius: theme.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: theme.colors.wizard.primary + '30',
                }}
              >
                <MaterialCommunityIcons
                  name={feature.icon as any}
                  size={24}
                  color={theme.colors.wizard.primary}
                  style={{ marginRight: theme.spacing.md }}
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
                  }}>
                    {feature.description}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color={theme.colors.status.success}
                />
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          style={{
            opacity: contentOpacity,
            width: '100%',
            gap: theme.spacing.md,
          }}
        >
          <Button
            onPress={() => router.replace('/(tabs)/prompt')}
            variant="primary"
            leftIcon="chef-hat"
          >
            Start Cooking with Premium
          </Button>

          <Button
            onPress={() => router.push('/subscription/manage')}
            variant="outline"
            leftIcon="cog"
          >
            Manage Subscription
          </Button>

          <Button
            onPress={() => router.replace('/(tabs)')}
            variant="secondary"
          >
            Continue to App
          </Button>
        </Animated.View>

        {/* Development Notice */}
        <View style={{
          marginTop: theme.spacing.xl,
          padding: theme.spacing.md,
          backgroundColor: theme.colors.theme.surface,
          borderRadius: theme.borderRadius.lg,
          borderWidth: 1,
          borderColor: theme.colors.theme.border,
        }}>
          <Text style={{
            fontSize: theme.typography.fontSize.bodySmall,
            color: theme.colors.theme.textTertiary,
            textAlign: 'center',
            lineHeight: 18,
          }}>
            {purchaseInfo?.isActive && purchaseInfo.productId ?
              `Subscription active via Revenue Cat. Manage your subscription through your device's app store.` :
              'Development Mode: This is a simulated successful payment. In production, this would be processed through the app store.'
            }
          </Text>
        </View>

        <View style={{ marginBottom: theme.spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}