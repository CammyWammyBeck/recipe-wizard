import React, { useCallback } from 'react';
import { Linking } from 'react-native';
import Constants from 'expo-constants';

import {
  SettingsScreen,
  SettingsSection,
  SettingsRow,
} from '../../components/settings';

const PRIVACY_POLICY_URL =
  'https://cameronbeck-dev.github.io/recipe-wizard/privacy-policy.html';
const DELETE_ACCOUNT_URL =
  'https://cameronbeck-dev.github.io/recipe-wizard/delete-account.html';
const SUPPORT_EMAIL = 'privacy@cameronbeck.dev';

export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const open = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {});
  }, []);

  return (
    <SettingsScreen title="About" subtitle={`Recipe Wizard ${version}`}>
      <SettingsSection label="Legal">
        <SettingsRow
          title="Privacy Policy"
          icon="shield-check"
          onPress={() => open(PRIVACY_POLICY_URL)}
        />
        <SettingsRow
          title="Request Account Deletion"
          subtitle="Web form, if you can't sign in"
          icon="account-remove"
          showDivider
          onPress={() => open(DELETE_ACCOUNT_URL)}
        />
      </SettingsSection>

      <SettingsSection label="Support">
        <SettingsRow
          title="Contact Support"
          subtitle={SUPPORT_EMAIL}
          icon="email"
          onPress={() => open(`mailto:${SUPPORT_EMAIL}`)}
        />
      </SettingsSection>

      <SettingsSection label="App">
        <SettingsRow title="Version" icon="information" value={version} />
      </SettingsSection>
    </SettingsScreen>
  );
}
