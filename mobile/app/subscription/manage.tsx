import React, { useState } from 'react';
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
import { ExpandableCard } from '../../components/ExpandableCard';

export default function ManageSubscriptionScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { isPremium } = usePremium();
  const [isLoading, setIsLoading] = useState(false);

  // Mock subscription data
  const mockSubscription = {
    plan: 'Monthly Premium',
    price: '$4.99',
    nextBilling: '2025-10-14',
    status: 'Active',
    features: [
      'AI Recipe Ideas',
      'Smart Shopping Lists',
      'Complete Recipe History',
      'Recipe Modification',
    ],
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your premium subscription? You\'ll lose access to all premium features at the end of your current billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Development Mode',
              'This is a placeholder for subscription cancellation. In production, this would integrate with your payment processor.',
            );
          },
        },
      ],
    );
  };

  const handleUpdatePayment = () => {
    Alert.alert(
      'Update Payment',
      'This is a placeholder for payment method updates. In production, this would integrate with your payment processor.',
    );
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
            <TouchableOpacity onPress={() => router.back()}>
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
        subtitle="Premium Active"
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
          gap: theme.spacing.lg,
        }}
      >
        {/* Current Plan */}
        <ExpandableCard
          title="Current Plan"
          subtitle={`${mockSubscription.plan} • ${mockSubscription.price}/month`}
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
                  {mockSubscription.plan}
                </Text>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  color: theme.colors.theme.textSecondary,
                }}>
                  Next billing: {mockSubscription.nextBilling}
                </Text>
              </View>
              <View style={{
                backgroundColor: theme.colors.status.success,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.xs,
                borderRadius: theme.borderRadius.md,
              }}>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodySmall,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: '#ffffff',
                }}>
                  {mockSubscription.status}
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
              {mockSubscription.features.map((feature, index) => (
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
                Development Mode: Payment management will be handled through your device's app store (App Store or Google Play) in production.
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