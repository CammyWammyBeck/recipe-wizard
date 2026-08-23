import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../constants/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { usePremium } from '../../contexts/PremiumContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { HeaderComponent } from '../../components/HeaderComponent';
import { PremiumBadge } from '../../components/PremiumBadge';
import {
  SettingsSection,
  SettingsRow,
  SelectionGroup,
} from '../../components/settings';

const SERVING_OPTIONS = [1, 2, 4, 6, 8].map((n) => ({
  value: n,
  label: String(n),
}));

const DIFFICULTY_OPTIONS = [
  { value: 'easy' as const, label: 'Easy' },
  { value: 'medium' as const, label: 'Medium' },
  { value: 'hard' as const, label: 'Hard' },
];

const UNIT_OPTIONS = [
  { value: 'metric' as const, label: 'Metric' },
  { value: 'imperial' as const, label: 'Imperial' },
];

const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Light' },
  { value: 'dark' as const, label: 'Dark' },
  { value: 'system' as const, label: 'Auto' },
];

/** Truncates only when it actually needs to — the old code always appended '…'. */
function truncate(text: string, max: number): string {
  const collapsed = text.trim().replace(/\s+/g, ' ');
  return collapsed.length > max ? `${collapsed.slice(0, max).trimEnd()}…` : collapsed;
}

function initialsFor(
  user: { firstName?: string; lastName?: string; username?: string; email?: string } | null
): string {
  if (!user) return '?';
  const { firstName, lastName, username, email } = user;
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  const fallback = firstName || username || email || '';
  return fallback.slice(0, 2).toUpperCase() || '?';
}

export default function ProfileScreen() {
  const { theme, themeMode, setThemeMode, isDark } = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const { preferences, loading, saving, lastSaved, setPreference } =
    usePreferences();

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.theme.background }}
        edges={['top']}
      >
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text
            style={{
              color: theme.colors.theme.textSecondary,
              fontSize: theme.typography.fontSize.bodyMedium,
              fontFamily: theme.typography.fontFamily.body,
            }}
          >
            Loading preferences...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const dietaryCount = preferences.dietaryRestrictions.length;
  const allergenCount = preferences.allergens.length;
  const instructions = preferences.additionalPreferences ?? '';

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.theme.background }}
      edges={['top']}
    >
      <HeaderComponent
        title="Profile & Settings"
        subtitle="Customize your cooking experience"
        rightContent={<PremiumBadge size="small" />}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing['4xl'],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity */}
        <TouchableOpacity
          onPress={() => router.push('/settings/account')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            user ? `Account, signed in as ${user.email}` : 'Sign in or create an account'
          }
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.xl,
            borderRadius: theme.borderRadius.xl,
            backgroundColor: theme.colors.theme.surface,
            borderWidth: 1,
            borderColor: theme.colors.theme.border,
            ...theme.shadows.surface,
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: theme.spacing.lg,
              backgroundColor: user
                ? theme.colors.wizard.primary
                : theme.colors.theme.backgroundSecondary,
            }}
          >
            {user ? (
              <Text
                style={{
                  fontSize: theme.typography.fontSize.titleMedium,
                  fontWeight: theme.typography.fontWeight.semibold,
                  fontFamily: theme.typography.fontFamily.body,
                  color: '#ffffff',
                }}
              >
                {initialsFor(user)}
              </Text>
            ) : (
              <MaterialCommunityIcons
                name="account-outline"
                size={26}
                color={theme.colors.theme.textSecondary}
              />
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: theme.typography.fontSize.titleMedium,
                fontWeight: theme.typography.fontWeight.semibold,
                fontFamily: theme.typography.fontFamily.body,
                color: theme.colors.theme.text,
              }}
            >
              {user
                ? user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username || 'User'
                : 'Guest'}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontSize: theme.typography.fontSize.bodySmall,
                color: theme.colors.theme.textSecondary,
                fontFamily: theme.typography.fontFamily.body,
                marginTop: 2,
              }}
            >
              {user ? user.email : 'Sign in to save recipes and sync devices'}
            </Text>

            <View
              style={{
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: theme.spacing.sm,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 3,
                borderRadius: theme.borderRadius.full,
                backgroundColor: isPremium
                  ? theme.colors.wizard.primary + '1A'
                  : theme.colors.theme.backgroundSecondary,
              }}
            >
              <MaterialCommunityIcons
                name={isPremium ? 'crown' : 'crown-outline'}
                size={13}
                color={
                  isPremium
                    ? theme.colors.wizard.primary
                    : theme.colors.theme.textTertiary
                }
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  fontSize: theme.typography.fontSize.labelSmall,
                  fontWeight: theme.typography.fontWeight.semibold,
                  fontFamily: theme.typography.fontFamily.body,
                  color: isPremium
                    ? theme.colors.wizard.primary
                    : theme.colors.theme.textTertiary,
                }}
              >
                {isPremium ? 'Premium' : 'Free plan'}
              </Text>
            </View>
          </View>

          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={theme.colors.theme.textTertiary}
          />
        </TouchableOpacity>

        {/* Subscription */}
        <SettingsSection label="Subscription">
          <SettingsRow
            title={isPremium ? 'Manage Subscription' : 'Upgrade to Premium'}
            subtitle={
              isPremium
                ? 'Billing, change plan, or cancel'
                : 'Shopping lists, recipe ideas, and modifications'
            }
            icon={isPremium ? 'cog' : 'crown'}
            onPress={() =>
              router.push(isPremium ? '/subscription/manage' : '/subscription/plans')
            }
          />
          {isPremium && (
            <SettingsRow
              title="Payment History"
              icon="receipt"
              showDivider
              onPress={() => router.push('/subscription/payment-history')}
            />
          )}
        </SettingsSection>

        {/* Recipe defaults */}
        <SettingsSection label="Recipe defaults">
          <View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
            <View>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  fontWeight: theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily.body,
                  color: theme.colors.theme.text,
                  marginBottom: theme.spacing.sm,
                }}
              >
                Servings
              </Text>
              <SelectionGroup
                accessibilityLabel="Default servings"
                options={SERVING_OPTIONS}
                selectedValue={preferences.defaultServings}
                onChange={(v) => setPreference('defaultServings', v)}
              />
            </View>

            <View>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  fontWeight: theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily.body,
                  color: theme.colors.theme.text,
                  marginBottom: theme.spacing.sm,
                }}
              >
                Difficulty
              </Text>
              <SelectionGroup
                accessibilityLabel="Preferred difficulty"
                options={DIFFICULTY_OPTIONS}
                selectedValue={preferences.preferredDifficulty ?? 'easy'}
                onChange={(v) => setPreference('preferredDifficulty', v)}
              />
            </View>

            <View>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  fontWeight: theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily.body,
                  color: theme.colors.theme.text,
                  marginBottom: theme.spacing.sm,
                }}
              >
                Units
              </Text>
              <SelectionGroup
                accessibilityLabel="Measurement units"
                options={UNIT_OPTIONS}
                selectedValue={preferences.units}
                onChange={(v) => setPreference('units', v)}
              />
            </View>
          </View>
        </SettingsSection>

        {/* Food preferences */}
        <SettingsSection label="Food preferences">
          <SettingsRow
            title="Dietary Restrictions"
            icon="food-apple"
            value={dietaryCount > 0 ? `${dietaryCount} selected` : 'None'}
            onPress={() => router.push('/settings/dietary')}
          />
          <SettingsRow
            title="Allergens"
            icon="alert-circle"
            value={allergenCount > 0 ? `${allergenCount} selected` : 'None'}
            showDivider
            onPress={() => router.push('/settings/allergens')}
          />
          <SettingsRow
            title="Custom Instructions"
            icon="text-box"
            subtitle={instructions ? truncate(instructions, 60) : undefined}
            value={instructions ? undefined : 'None'}
            showDivider
            onPress={() => router.push('/settings/instructions')}
          />
        </SettingsSection>

        {/* Shopping */}
        <SettingsSection label="Shopping">
          <SettingsRow
            title="Grocery Categories"
            subtitle="Order your shopping list to match your store"
            icon="format-list-bulleted"
            value={String(preferences.groceryCategories.length)}
            onPress={() => router.push('/settings/categories')}
          />
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection label="Appearance">
          <View style={{ padding: theme.spacing.lg }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.bodyMedium,
                fontWeight: theme.typography.fontWeight.medium,
                fontFamily: theme.typography.fontFamily.body,
                color: theme.colors.theme.text,
                marginBottom: theme.spacing.sm,
              }}
            >
              Theme
              {themeMode === 'system' && (
                <Text
                  style={{
                    fontWeight: theme.typography.fontWeight.regular,
                    color: theme.colors.theme.textSecondary,
                  }}
                >
                  {`  ·  currently ${isDark ? 'dark' : 'light'}`}
                </Text>
              )}
            </Text>
            <SelectionGroup
              accessibilityLabel="App theme"
              options={THEME_OPTIONS}
              selectedValue={themeMode}
              onChange={setThemeMode}
            />
          </View>
        </SettingsSection>

        {/* About */}
        <SettingsSection label="About">
          <SettingsRow
            title="About Recipe Wizard"
            subtitle="Privacy, support, and version"
            icon="information"
            onPress={() => router.push('/settings/about')}
          />
        </SettingsSection>

        {/* Save status */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 20,
          }}
        >
          {(saving || lastSaved) && (
            <>
              <MaterialCommunityIcons
                name={saving ? 'cloud-upload-outline' : 'check-circle-outline'}
                size={14}
                color={theme.colors.theme.textTertiary}
                style={{ marginRight: theme.spacing.xs }}
              />
              <Text
                style={{
                  fontSize: theme.typography.fontSize.bodySmall,
                  color: theme.colors.theme.textTertiary,
                  fontFamily: theme.typography.fontFamily.body,
                }}
              >
                {saving ? 'Saving...' : 'Preferences saved'}
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
