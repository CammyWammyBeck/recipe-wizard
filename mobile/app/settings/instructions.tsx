import React from 'react';
import { View, Text } from 'react-native';

import { useAppTheme } from '../../constants/ThemeProvider';
import { usePreferences } from '../../contexts/PreferencesContext';
import { SettingsScreen, SettingsSection } from '../../components/settings';
import { TextInput } from '../../components/TextInput';

const MAX_LENGTH = 500;

export default function CustomInstructionsScreen() {
  const { theme } = useAppTheme();
  const { preferences, setPreference } = usePreferences();

  const value = preferences.additionalPreferences ?? '';

  return (
    <SettingsScreen
      title="Custom Instructions"
      subtitle="Applied to every recipe"
    >
      <SettingsSection
        label="Your instructions"
        footer="These are included in every recipe generation. Keep them short and specific — long instructions can crowd out your other preferences."
      >
        <View style={{ padding: theme.spacing.md }}>
          <TextInput
            placeholder="e.g. I prefer one-pot meals, low sodium, and Mediterranean flavours..."
            value={value}
            onChangeText={(text) =>
              setPreference('additionalPreferences', text.slice(0, MAX_LENGTH))
            }
            multiline
            numberOfLines={6}
            maxLength={MAX_LENGTH}
            textAlignVertical="top"
            style={{ height: 160, paddingTop: theme.spacing.md }}
          />

          <Text
            style={{
              fontSize: theme.typography.fontSize.bodySmall,
              color: theme.colors.theme.textTertiary,
              fontFamily: theme.typography.fontFamily.body,
              textAlign: 'right',
              marginTop: theme.spacing.xs,
            }}
          >
            {value.length} / {MAX_LENGTH}
          </Text>
        </View>
      </SettingsSection>
    </SettingsScreen>
  );
}
