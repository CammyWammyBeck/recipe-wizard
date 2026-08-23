import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/ThemeProvider';

/** Minimum touch target: 44pt (iOS HIG) / 48dp (Material). */
export const SETTINGS_ROW_MIN_HEIGHT = 56;

interface SettingsRowProps {
  title: string;
  /** Secondary line under the title. */
  subtitle?: string;
  /** Current value, right-aligned before the chevron. */
  value?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  /** Tints the icon and title — used for destructive actions. */
  tintColor?: string;
  onPress?: () => void;
  /** Show a chevron. Defaults to true when `onPress` is provided. */
  showChevron?: boolean;
  /** Replaces the value/chevron area entirely (e.g. a switch or badge). */
  accessory?: React.ReactNode;
  /** Renders a hairline above this row. Set on every row but the first. */
  showDivider?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * One tappable row inside a `SettingsSection`. Dividers are inset to align with
 * the title text rather than spanning the full card width.
 */
export function SettingsRow({
  title,
  subtitle,
  value,
  icon,
  tintColor,
  onPress,
  showChevron,
  accessory,
  showDivider = false,
  disabled = false,
  style,
}: SettingsRowProps) {
  const { theme } = useAppTheme();

  const chevronVisible = showChevron ?? (!!onPress && !accessory);
  const titleColor = tintColor ?? theme.colors.theme.text;
  const iconColor = tintColor ?? theme.colors.wizard.primary;
  const dividerInset = icon
    ? theme.spacing.lg + 32 + theme.spacing.md
    : theme.spacing.lg;

  const content = (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: SETTINGS_ROW_MIN_HEIGHT,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {icon && (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: theme.borderRadius.md,
            backgroundColor: iconColor + '1A',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: theme.spacing.md,
          }}
        >
          <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: theme.typography.fontSize.bodyLarge,
            fontWeight: theme.typography.fontWeight.medium,
            color: titleColor,
            fontFamily: theme.typography.fontFamily.body,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: theme.typography.fontSize.bodySmall,
              color: theme.colors.theme.textSecondary,
              fontFamily: theme.typography.fontFamily.body,
              lineHeight: 17,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {accessory ??
        (value ? (
          <Text
            numberOfLines={1}
            style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.textSecondary,
              fontFamily: theme.typography.fontFamily.body,
              maxWidth: 150,
              marginLeft: theme.spacing.sm,
              textAlign: 'right',
            }}
          >
            {value}
          </Text>
        ) : null)}

      {chevronVisible && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={theme.colors.theme.textTertiary}
          style={{ marginLeft: theme.spacing.xs }}
        />
      )}
    </View>
  );

  return (
    <View>
      {showDivider && (
        <View
          style={{
            height: 1,
            backgroundColor: theme.colors.theme.border,
            marginLeft: dividerInset,
          }}
        />
      )}
      {onPress ? (
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={title}
          accessibilityHint={subtitle || value || undefined}
          accessibilityState={{ disabled }}
        >
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}
    </View>
  );
}
