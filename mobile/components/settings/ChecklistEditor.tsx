import React, { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TextInput as RNTextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../constants/ThemeProvider';
import { usePreferences, PreferenceListKey } from '../../contexts/PreferencesContext';
import { CheckboxItem } from '../CheckboxItem';
import { TextInput } from '../TextInput';
import { SettingsSection } from './SettingsSection';

interface ChecklistEditorProps {
  listKey: PreferenceListKey;
  /** Presets offered as checkboxes. */
  commonOptions: readonly string[];
  sectionLabel: string;
  customLabel: string;
  inputPlaceholder: string;
  footer?: string;
}

/** 'gluten-free' -> 'Gluten free'. Replaces every hyphen, not just the first. */
function humanize(value: string): string {
  const spaced = value.replace(/-/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * The shared body of the dietary-restrictions and allergens screens: a preset
 * checklist plus free-text additions. Both screens are the same interaction,
 * so they share this rather than duplicating ~80 lines each.
 */
export function ChecklistEditor({
  listKey,
  commonOptions,
  sectionLabel,
  customLabel,
  inputPlaceholder,
  footer,
}: ChecklistEditorProps) {
  const { theme } = useAppTheme();
  const { preferences, toggleListItem, addListItem, removeListItem } =
    usePreferences();
  const inputRef = useRef<RNTextInput>(null);

  const selected = preferences[listKey];
  const customItems = selected.filter((item) => !commonOptions.includes(item));

  const handleAdd = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      addListItem(listKey, trimmed);
      inputRef.current?.clear();
    },
    [addListItem, listKey]
  );

  return (
    <View>
      <SettingsSection label={sectionLabel}>
        <View style={{ padding: theme.spacing.md, gap: theme.spacing.xs }}>
          {commonOptions.map((option) => (
            <CheckboxItem
              key={option}
              label={humanize(option)}
              checked={selected.includes(option)}
              onPress={() => toggleListItem(listKey, option)}
            />
          ))}
        </View>
      </SettingsSection>

      <SettingsSection label={customLabel} footer={footer}>
        <View style={{ padding: theme.spacing.md }}>
          {customItems.length > 0 && (
            <View style={{ marginBottom: theme.spacing.md, gap: theme.spacing.sm }}>
              {customItems.map((item) => (
                <View
                  key={item}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    minHeight: 48,
                    paddingLeft: theme.spacing.md,
                    paddingRight: theme.spacing.xs,
                    borderRadius: theme.borderRadius.lg,
                    backgroundColor: theme.colors.theme.backgroundSecondary,
                    borderWidth: 1,
                    borderColor: theme.colors.theme.border,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontSize: theme.typography.fontSize.bodyMedium,
                      color: theme.colors.theme.text,
                      fontFamily: theme.typography.fontFamily.body,
                    }}
                  >
                    {item}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeListItem(listKey, item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item}`}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                      width: 40,
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={20}
                      color={theme.colors.status.error}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TextInput
            ref={inputRef}
            placeholder={inputPlaceholder}
            returnKeyType="done"
            autoCapitalize="none"
            onSubmitEditing={(e) => handleAdd(e.nativeEvent.text)}
          />
        </View>
      </SettingsSection>
    </View>
  );
}
