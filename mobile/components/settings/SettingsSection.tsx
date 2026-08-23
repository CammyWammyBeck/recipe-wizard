import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useAppTheme } from '../../constants/ThemeProvider';

interface SettingsSectionProps {
  /** Small-caps group label rendered above the card. */
  label?: string;
  /** Explanatory copy rendered below the card. */
  footer?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * A labelled group of settings rows. The label sits outside the card (rather
 * than being another row inside it) so groups read as headings rather than as
 * more tappable content.
 */
export function SettingsSection({
  label,
  footer,
  children,
  style,
}: SettingsSectionProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[{ marginBottom: theme.spacing.xl }, style]}>
      {label && (
        <Text
          style={{
            fontSize: theme.typography.fontSize.labelMedium,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.theme.textTertiary,
            fontFamily: theme.typography.fontFamily.body,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            marginBottom: theme.spacing.sm,
            marginLeft: theme.spacing.xs,
          }}
        >
          {label}
        </Text>
      )}

      <View
        style={{
          backgroundColor: theme.colors.theme.surface,
          borderRadius: theme.borderRadius.xl,
          borderWidth: 1,
          borderColor: theme.colors.theme.border,
          ...theme.shadows.surface,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>

      {footer && (
        <Text
          style={{
            fontSize: theme.typography.fontSize.bodySmall,
            color: theme.colors.theme.textTertiary,
            fontFamily: theme.typography.fontFamily.body,
            lineHeight: 18,
            marginTop: theme.spacing.sm,
            marginHorizontal: theme.spacing.xs,
          }}
        >
          {footer}
        </Text>
      )}
    </View>
  );
}
