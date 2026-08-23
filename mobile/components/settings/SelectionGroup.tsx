import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/ThemeProvider';

export interface SelectionOption<T extends string | number> {
  value: T;
  label: string;
  /** Only shown in the `list` layout. */
  description?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface SelectionGroupProps<T extends string | number> {
  options: SelectionOption<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
  /**
   * `segmented` — equal-width pills on one row, for short mutually-exclusive
   * values (servings, difficulty, units).
   * `list` — stacked full-width rows, for options that need a description.
   */
  layout?: 'segmented' | 'list';
  /** Announced as the radio group's label. */
  accessibilityLabel?: string;
  style?: ViewStyle;
}

/**
 * An accessible radio group. Replaces the hand-rolled selector blocks that were
 * duplicated for units, theme, servings and difficulty — each of which was
 * ~30 lines of inline styles with no accessibility roles at all.
 */
export function SelectionGroup<T extends string | number>({
  options,
  selectedValue,
  onChange,
  layout = 'segmented',
  accessibilityLabel,
  style,
}: SelectionGroupProps<T>) {
  const { theme } = useAppTheme();

  if (layout === 'segmented') {
    return (
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={accessibilityLabel}
        style={[
          {
            flexDirection: 'row',
            backgroundColor: theme.colors.theme.backgroundSecondary,
            borderRadius: theme.borderRadius.lg,
            padding: 4,
            gap: 4,
          },
          style,
        ]}
      >
        {options.map((option) => {
          const selected = option.value === selectedValue;
          return (
            <TouchableOpacity
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              style={{
                flex: 1,
                minHeight: 40,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: theme.spacing.sm,
                borderRadius: theme.borderRadius.md,
                backgroundColor: selected
                  ? theme.colors.wizard.primary
                  : 'transparent',
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  fontWeight: selected
                    ? theme.typography.fontWeight.semibold
                    : theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily.body,
                  color: selected ? '#ffffff' : theme.colors.theme.textSecondary,
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[{ gap: theme.spacing.sm }, style]}
    >
      {options.map((option) => {
        const selected = option.value === selectedValue;
        return (
          <TouchableOpacity
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityHint={option.description}
            accessibilityState={{ selected }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              minHeight: 56,
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.lg,
              backgroundColor: selected
                ? theme.colors.wizard.primary + '14'
                : theme.colors.theme.backgroundSecondary,
              borderWidth: 1,
              borderColor: selected
                ? theme.colors.wizard.primary
                : theme.colors.theme.border,
            }}
          >
            {option.icon && (
              <MaterialCommunityIcons
                name={option.icon}
                size={22}
                color={
                  selected
                    ? theme.colors.wizard.primary
                    : theme.colors.theme.textSecondary
                }
                style={{ marginRight: theme.spacing.md }}
              />
            )}

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.bodyLarge,
                  fontWeight: theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily.body,
                  color: selected
                    ? theme.colors.wizard.primary
                    : theme.colors.theme.text,
                }}
              >
                {option.label}
              </Text>
              {option.description && (
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.bodySmall,
                    color: theme.colors.theme.textSecondary,
                    fontFamily: theme.typography.fontFamily.body,
                    lineHeight: 17,
                    marginTop: 2,
                  }}
                >
                  {option.description}
                </Text>
              )}
            </View>

            <MaterialCommunityIcons
              name={selected ? 'check-circle' : 'circle-outline'}
              size={20}
              color={
                selected
                  ? theme.colors.wizard.primary
                  : theme.colors.theme.textTertiary
              }
              style={{ marginLeft: theme.spacing.sm }}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
