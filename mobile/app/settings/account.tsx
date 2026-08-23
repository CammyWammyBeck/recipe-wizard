import React, { useState, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAppTheme } from '../../constants/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import {
  SettingsScreen,
  SettingsSection,
  SettingsRow,
} from '../../components/settings';
import { Button } from '../../components/Button';

export default function AccountScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { user, logout, deleteAccount } = useAuth();

  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const busy = signingOut || deletingAccount;

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            setSigningOut(true);
            await logout();
            // Land in guest mode, not a sign-in wall — the user has already
            // onboarded, so index.tsx's routing sends them straight back to
            // the prompt tab.
            router.replace('/(tabs)/prompt');
          } catch (error) {
            console.error('Sign out error:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  }, [logout, router]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account?',
      'This will permanently delete your account, all your saved recipes, your shopping list, preferences, and recipe history. This cannot be undone.\n\nIf you have an active subscription, cancel it in your device Subscription settings before deleting, otherwise you will continue to be billed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Last chance. Your account and all associated data will be deleted immediately.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, delete my account',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setDeletingAccount(true);
                      await deleteAccount();
                      // Land in guest mode, matching sign-out — the account is
                      // gone, not "signed out", so we deliberately don't set
                      // justSignedOut (its "sign back in to see your saved
                      // recipes" banner would be misleading: there's nothing
                      // left to sign back in to).
                      router.replace('/(tabs)/prompt');
                    } catch (error) {
                      console.error('Delete account error:', error);
                      Alert.alert(
                        'Deletion failed',
                        error instanceof Error
                          ? error.message
                          : 'Could not delete your account. Please try again or email privacy@cameronbeck.dev.'
                      );
                    } finally {
                      setDeletingAccount(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [deleteAccount, router]);

  if (!user) {
    return (
      <SettingsScreen title="Account" subtitle="Not signed in">
        <SettingsSection label="Guest">
          <View style={{ padding: theme.spacing.lg }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.bodyMedium,
                color: theme.colors.theme.textSecondary,
                fontFamily: theme.typography.fontFamily.body,
                lineHeight: 20,
                marginBottom: theme.spacing.lg,
              }}
            >
              You're using Recipe Wizard as a guest. Create an account to save
              your recipes permanently, unlock premium features, and sync across
              devices.
            </Text>
            <Button
              onPress={() => router.push('/auth/signup')}
              variant="primary"
              leftIcon="account-plus"
              style={{ marginBottom: theme.spacing.md }}
            >
              Create an Account
            </Button>
            <Button
              onPress={() => router.push('/auth/signin')}
              variant="outline"
              leftIcon="login"
            >
              Sign In
            </Button>
          </View>
        </SettingsSection>
      </SettingsScreen>
    );
  }

  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username || 'User';

  return (
    <SettingsScreen title="Account" subtitle={user.email}>
      <SettingsSection label="Signed in as">
        <SettingsRow title={displayName} icon="account" />
        <SettingsRow title="Email" icon="email" value={user.email} showDivider />
      </SettingsSection>

      <SettingsSection label="Session">
        <View style={{ padding: theme.spacing.lg }}>
          <Button
            onPress={handleSignOut}
            variant="outline"
            disabled={busy}
            loading={signingOut}
            leftIcon="logout"
          >
            {signingOut ? 'Signing Out...' : 'Sign Out'}
          </Button>
        </View>
      </SettingsSection>

      <SettingsSection
        label="Danger zone"
        footer="Deleting your account permanently removes your recipes, shopping list, preferences and history. This cannot be undone."
      >
        <View style={{ padding: theme.spacing.lg }}>
          <Button
            onPress={handleDeleteAccount}
            variant="outline"
            disabled={busy}
            loading={deletingAccount}
            leftIcon="delete-forever"
            style={{
              borderColor: theme.colors.status.error,
              backgroundColor: theme.colors.status.error + '10',
            }}
            textStyle={{ color: theme.colors.status.error }}
          >
            {deletingAccount ? 'Deleting account...' : 'Delete Account'}
          </Button>
        </View>
      </SettingsSection>
    </SettingsScreen>
  );
}
