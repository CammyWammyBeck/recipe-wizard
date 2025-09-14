import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/ThemeProvider';
import { HeaderComponent } from '../../components/HeaderComponent';
import { Button } from '../../components/Button';

export default function PaymentFailureScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Get failure details from params
  const planTitle = params.planTitle as string || 'Premium Plan';
  const planPrice = params.planPrice as string || '$4.99';
  const reason = params.reason as string || 'Payment could not be processed. Please try again.';

  // Animation states
  const [errorScale] = useState(new Animated.Value(0));
  const [contentOpacity] = useState(new Animated.Value(0));
  const [shakeAnimation] = useState(new Animated.Value(0));

  // Common failure reasons and solutions
  const failureReasons = [
    {
      issue: 'Card Declined',
      solutions: [
        'Check that your card details are correct',
        'Ensure your card has sufficient funds',
        'Contact your bank to authorize the payment',
        'Try a different payment method',
      ]
    },
    {
      issue: 'Expired Card',
      solutions: [
        'Check your card expiry date',
        'Use a different card that hasn\'t expired',
        'Update your payment method',
      ]
    },
    {
      issue: 'Network Error',
      solutions: [
        'Check your internet connection',
        'Try again in a few moments',
        'Switch to a different network if possible',
      ]
    },
  ];

  useEffect(() => {
    // Animate error icon with shake effect
    Animated.sequence([
      Animated.timing(errorScale, {
        toValue: 1.1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 1,
        duration: 300,
        easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
        useNativeDriver: true,
      }),
      Animated.timing(errorScale, {
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
  }, [errorScale, contentOpacity, shakeAnimation]);

  const handleTryAgain = () => {
    router.back();
  };

  const handleTryDifferentMethod = () => {
    router.push({
      pathname: '/subscription/plans',
    });
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'In a production app, this would open a support contact form, live chat, or email client.',
      [
        {
          text: 'OK',
          style: 'default',
        },
      ]
    );
  };

  const shakeInterpolation = shakeAnimation.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -5, 5, -3, 0],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.theme.background }} edges={['top']}>
      <HeaderComponent
        title="Payment Failed"
        subtitle="Let's try again"
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
        {/* Error Animation */}
        <View style={{
          alignItems: 'center',
          marginBottom: theme.spacing['2xl'],
        }}>
          <View style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: theme.colors.status.error + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.lg,
          }}>
            <Animated.View
              style={{
                transform: [
                  { scale: errorScale },
                  { translateX: shakeInterpolation },
                ],
              }}
            >
              <MaterialCommunityIcons
                name="alert-circle"
                size={60}
                color={theme.colors.status.error}
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
              fontSize: theme.typography.fontSize.headlineMedium,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.theme.text,
              textAlign: 'center',
              marginBottom: theme.spacing.sm,
            }}>
              Payment Failed
            </Text>
            <Text style={{
              fontSize: theme.typography.fontSize.bodyLarge,
              color: theme.colors.theme.textSecondary,
              textAlign: 'center',
              lineHeight: 24,
            }}>
              We couldn't process your payment for {planTitle}
            </Text>
          </Animated.View>
        </View>

        {/* Failure Details */}
        <Animated.View
          style={{
            opacity: contentOpacity,
            width: '100%',
            marginBottom: theme.spacing.xl,
          }}
        >
          <View style={{
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.status.error + '10',
            borderRadius: theme.borderRadius.lg,
            borderWidth: 1,
            borderColor: theme.colors.status.error + '30',
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: theme.spacing.md,
            }}>
              <MaterialCommunityIcons
                name="information"
                size={20}
                color={theme.colors.status.error}
                style={{ marginRight: theme.spacing.sm }}
              />
              <Text style={{
                fontSize: theme.typography.fontSize.titleSmall,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.theme.text,
              }}>
                What went wrong?
              </Text>
            </View>
            <Text style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.text,
              lineHeight: 20,
            }}>
              {reason}
            </Text>
          </View>
        </Animated.View>

        {/* Common Solutions */}
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
          }}>
            How to Fix This
          </Text>

          <View style={{ gap: theme.spacing.lg }}>
            {failureReasons.map((reason, index) => (
              <View key={index}>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.theme.text,
                  marginBottom: theme.spacing.sm,
                }}>
                  {reason.issue}:
                </Text>
                <View style={{ gap: theme.spacing.sm }}>
                  {reason.solutions.map((solution, solutionIndex) => (
                    <View
                      key={solutionIndex}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        paddingLeft: theme.spacing.md,
                      }}
                    >
                      <Text style={{
                        fontSize: theme.typography.fontSize.bodyMedium,
                        color: theme.colors.wizard.primary,
                        marginRight: theme.spacing.sm,
                      }}>
                        •
                      </Text>
                      <Text style={{
                        fontSize: theme.typography.fontSize.bodyMedium,
                        color: theme.colors.theme.textSecondary,
                        lineHeight: 20,
                        flex: 1,
                      }}>
                        {solution}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Subscription Summary */}
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
              fontSize: theme.typography.fontSize.titleSmall,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.theme.text,
              marginBottom: theme.spacing.md,
            }}>
              Attempted Purchase
            </Text>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: theme.typography.fontSize.bodyMedium,
                color: theme.colors.theme.textSecondary,
              }}>
                {planTitle}
              </Text>
              <Text style={{
                fontSize: theme.typography.fontSize.bodyMedium,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.theme.text,
              }}>
                {planPrice}
              </Text>
            </View>
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
            onPress={handleTryAgain}
            variant="primary"
            leftIcon="refresh"
          >
            Try Again
          </Button>

          <Button
            onPress={handleTryDifferentMethod}
            variant="outline"
            leftIcon="credit-card"
          >
            Try Different Payment Method
          </Button>

          <Button
            onPress={handleContactSupport}
            variant="outline"
            leftIcon="help-circle"
          >
            Contact Support
          </Button>

          <Button
            onPress={() => router.replace('/(tabs)')}
            variant="secondary"
          >
            Continue Without Premium
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
            Development Mode: This is a simulated payment failure (10% chance). No actual payment was attempted.
          </Text>
        </View>

        <View style={{ marginBottom: theme.spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}