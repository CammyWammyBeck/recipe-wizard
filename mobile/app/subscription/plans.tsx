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
  const { isPremium, setPremiumStatus } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  const plans: SubscriptionPlan[] = [
    {
      id: 'monthly',
      title: 'Monthly Premium',
      price: '$4.99',
      period: 'month',
      features: [
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
      ],
    },
    {
      id: 'yearly',
      title: 'Yearly Premium',
      price: '$49.99',
      period: 'year',
      originalPrice: '$59.88',
      savings: 'Save $9.89',
      popular: true,
      features: [
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
      ],
    },
  ];

  const handleSubscribe = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    // Navigate to payment screen with plan details
    router.push({
      pathname: '/subscription/payment',
      params: {
        planId: plan.id,
        planTitle: plan.title,
        planPrice: plan.price,
        planPeriod: plan.period,
      }
    });
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
            }}>
              You can change your plan or manage your subscription below.
            </Text>
          </View>
        )}

        {/* Plans */}
        {plans.map(renderPlanCard)}

        {/* Subscribe Button */}
        <Button
          onPress={() => handleSubscribe(selectedPlan)}
          variant="primary"
          leftIcon="crown"
          loading={isLoading}
          style={{ marginBottom: theme.spacing.lg }}
        >
          {isPremium ? 'Change Plan' : `Start ${plans.find(p => p.id === selectedPlan)?.title}`}
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
            Development Mode: This is a mock subscription flow. In production, payments will be processed through your device's app store. Terms and conditions apply.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}