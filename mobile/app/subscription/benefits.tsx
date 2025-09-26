import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/ThemeProvider';
import { usePremium } from '../../contexts/PremiumContext';
import { HeaderComponent } from '../../components/HeaderComponent';
import { Button } from '../../components/Button';
import { PremiumBadge } from '../../components/PremiumBadge';

interface BenefitShowcase {
  icon: string;
  title: string;
  description: string;
  longDescription: string;
  features: string[];
  color: string;
}

export default function PremiumBenefitsScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { isPremium } = usePremium();
  const { width } = Dimensions.get('window');

  const benefits: BenefitShowcase[] = [
    {
      icon: 'lightbulb',
      title: 'AI Recipe Ideas',
      description: 'Get personalized recipe suggestions',
      longDescription: 'Access the AI-powered recipe suggestion feature that helps you discover new meal ideas based on your preferences and available ingredients.',
      features: [
        'AI-powered recipe suggestions',
        'Creative prompt-based recipe generation',
        'Preference-based recommendations',
      ],
      color: theme.colors.wizard.primary,
    },
    {
      icon: 'cart',
      title: 'Smart Shopping Lists',
      description: 'Organized grocery lists with categories',
      longDescription: 'Automatically organize your grocery items by store categories with interactive checkboxes for efficient shopping.',
      features: [
        'Auto-categorized by grocery store sections (Produce, Dairy, Meat, etc.)',
        'Interactive checkboxes for easy shopping',
        'Organized ingredient lists from your recipes',
        'Shopping progress tracking',
      ],
      color: theme.colors.status.success,
    },
    {
      icon: 'history',
      title: 'Complete Recipe History',
      description: 'Access all your previous recipes',
      longDescription: 'View your complete cooking history beyond the recent recipes shown in the free version.',
      features: [
        'Access to your full recipe history',
        'View all previously generated recipes',
        'Quick access to past favorites',
      ],
      color: theme.colors.wizard.accent,
    },
    {
      icon: 'pencil',
      title: 'Recipe Modification',
      description: 'Edit and customize recipes',
      longDescription: 'Customize any generated recipe with AI-powered modifications to match your exact preferences and dietary needs.',
      features: [
        'AI-powered recipe customization',
        'Ingredient substitution suggestions',
        'Dietary preference adjustments',
        'Cooking method modifications',
      ],
      color: theme.colors.status.warning,
    },
  ];

  const renderBenefitCard = (benefit: BenefitShowcase, index: number) => (
    <View
      key={index}
      style={{
        width: width - (theme.spacing.lg * 2),
        marginRight: index < benefits.length - 1 ? theme.spacing.lg : 0,
        backgroundColor: theme.colors.theme.surface,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        borderWidth: 2,
        borderColor: benefit.color + '30',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      }}
    >
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
      }}>
        <View style={{
          width: 60,
          height: 60,
          backgroundColor: benefit.color + '20',
          borderRadius: 30,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: theme.spacing.md,
        }}>
          <MaterialCommunityIcons
            name={benefit.icon as any}
            size={30}
            color={benefit.color}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: theme.typography.fontSize.titleMedium,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.theme.text,
            marginBottom: theme.spacing.xs,
          }}>
            {benefit.title}
          </Text>
          <Text style={{
            fontSize: theme.typography.fontSize.bodyMedium,
            color: theme.colors.theme.textSecondary,
          }}>
            {benefit.description}
          </Text>
        </View>
      </View>

      {/* Long Description */}
      <Text style={{
        fontSize: theme.typography.fontSize.bodyLarge,
        color: theme.colors.theme.text,
        lineHeight: 24,
        marginBottom: theme.spacing.lg,
      }}>
        {benefit.longDescription}
      </Text>

      {/* Features List */}
      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text style={{
          fontSize: theme.typography.fontSize.bodyMedium,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.theme.text,
          marginBottom: theme.spacing.md,
        }}>
          Key Features:
        </Text>
        {benefit.features.map((feature, featureIndex) => (
          <View
            key={featureIndex}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              marginBottom: theme.spacing.sm,
            }}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={16}
              color={benefit.color}
              style={{ marginRight: theme.spacing.sm, marginTop: 2 }}
            />
            <Text style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.textSecondary,
              lineHeight: 20,
              flex: 1,
            }}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {/* Status */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
        backgroundColor: isPremium
          ? theme.colors.status.success + '20'
          : theme.colors.theme.backgroundSecondary,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: isPremium
          ? theme.colors.status.success
          : theme.colors.theme.border,
      }}>
        <MaterialCommunityIcons
          name={isPremium ? "check-circle" : "lock"}
          size={18}
          color={isPremium ? theme.colors.status.success : theme.colors.theme.textTertiary}
          style={{ marginRight: theme.spacing.sm }}
        />
        <Text style={{
          fontSize: theme.typography.fontSize.bodyMedium,
          fontWeight: theme.typography.fontWeight.semibold,
          color: isPremium
            ? theme.colors.status.success
            : theme.colors.theme.textTertiary,
        }}>
          {isPremium ? 'Available Now' : 'Premium Required'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.theme.background }} edges={['top']}>
      <HeaderComponent
        title="Premium Benefits"
        subtitle="Unlock the full cooking experience"
        rightContent={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <PremiumBadge size="small" />
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.colors.theme.text}
              />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing.lg,
        }}
      >
        {/* Hero Section */}
        <View style={{
          alignItems: 'center',
          padding: theme.spacing.xl,
          marginBottom: theme.spacing.lg,
        }}>
          <MaterialCommunityIcons
            name="crown"
            size={80}
            color={theme.colors.wizard.primary}
            style={{ marginBottom: theme.spacing.lg }}
          />
          <Text style={{
            fontSize: theme.typography.fontSize.headlineMedium,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.theme.text,
            textAlign: 'center',
            marginBottom: theme.spacing.md,
          }}>
            {isPremium ? 'Your Premium Features' : 'Unlock Premium Features'}
          </Text>
          <Text style={{
            fontSize: theme.typography.fontSize.bodyLarge,
            color: theme.colors.theme.textSecondary,
            textAlign: 'center',
            lineHeight: 24,
          }}>
            {isPremium
              ? 'You have access to all these amazing features. Explore what makes your cooking experience special.'
              : 'Transform your cooking with AI-powered features designed to make meal planning effortless and enjoyable.'
            }
          </Text>
        </View>

        {/* Benefits Cards Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.sm,
            paddingBottom: theme.spacing.lg,
          }}
          style={{ marginBottom: theme.spacing.lg }}
        >
          {benefits.map(renderBenefitCard)}
        </ScrollView>

        {/* Call to Action */}
        {!isPremium && (
          <View style={{
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.wizard.primary + '10',
            borderRadius: theme.borderRadius.xl,
            borderWidth: 2,
            borderColor: theme.colors.wizard.primary + '30',
            alignItems: 'center',
            marginBottom: theme.spacing.lg,
          }}>
            <Text style={{
              fontSize: theme.typography.fontSize.titleLarge,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.theme.text,
              textAlign: 'center',
              marginBottom: theme.spacing.md,
            }}>
              Ready to Upgrade?
            </Text>
            <Text style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.textSecondary,
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: theme.spacing.xl,
            }}>
              Join thousands of home cooks who've transformed their kitchen experience with Premium.
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing.md, width: '100%' }}>
              <Button
                onPress={() => router.push('/subscription/plans')}
                variant="primary"
                leftIcon="crown"
                style={{ flex: 1 }}
              >
                View Plans
              </Button>
              <Button
                onPress={() => router.back()}
                variant="outline"
                style={{ flex: 1 }}
              >
                Maybe Later
              </Button>
            </View>
          </View>
        )}

        {/* Premium User Actions */}
        {isPremium && (
          <View style={{
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.status.success + '10',
            borderRadius: theme.borderRadius.lg,
            borderWidth: 2,
            borderColor: theme.colors.status.success + '30',
            alignItems: 'center',
            marginBottom: theme.spacing.lg,
          }}>
            <MaterialCommunityIcons
              name="heart"
              size={32}
              color={theme.colors.status.success}
              style={{ marginBottom: theme.spacing.sm }}
            />
            <Text style={{
              fontSize: theme.typography.fontSize.titleMedium,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.theme.text,
              textAlign: 'center',
              marginBottom: theme.spacing.sm,
            }}>
              Thank You for Being Premium!
            </Text>
            <Text style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.textSecondary,
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: theme.spacing.lg,
            }}>
              Your support helps us continue improving Recipe Wizard for everyone.
            </Text>
            <Button
              onPress={() => router.push('/subscription/manage')}
              variant="outline"
              leftIcon="cog"
            >
              Manage Subscription
            </Button>
          </View>
        )}

        <View style={{ marginBottom: theme.spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}