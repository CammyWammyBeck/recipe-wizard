import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useAppTheme } from '../constants/ThemeProvider';

interface HeaderComponentProps {
  title: string;
  subtitle: string;
  rightContent?: React.ReactNode;
  style?: ViewStyle;
}

export function HeaderComponent({
  title,
  subtitle,
  rightContent,
  style
}: HeaderComponentProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.xl,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.theme.border,
          backgroundColor: theme.colors.theme.background,
        },
        style
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: theme.typography.fontSize.headlineMedium,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.theme.text,
            lineHeight: theme.typography.fontSize.headlineMedium * 1.2,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: theme.typography.fontSize.bodyMedium,
            color: theme.colors.theme.textSecondary,
            marginTop: theme.spacing.xs,
            lineHeight: theme.typography.fontSize.bodyMedium * 1.3,
          }}
        >
          {subtitle}
        </Text>
      </View>

      {rightContent && (
        <View style={{ marginLeft: theme.spacing.md }}>
          {rightContent}
        </View>
      )}
    </View>
  );
}