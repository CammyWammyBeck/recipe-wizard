import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/ThemeProvider';

interface SettingsScreenProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /**
   * Wrap children in a ScrollView. Turn this off for screens that own their own
   * scrolling list — nesting a FlatList inside a same-orientation ScrollView
   * breaks layout measurement (and, for the reorder screen, drag itself).
   */
  scroll?: boolean;
  rightContent?: React.ReactNode;
}

/**
 * Shared chrome for every `app/settings/*` screen: safe area, a back header,
 * and optional scrolling. The root stack sets `headerShown: false` for all
 * routes, so screens supply their own header — this matches how the existing
 * `subscription/*` screens work.
 */
export function SettingsScreen({
  title,
  subtitle,
  children,
  scroll = true,
  rightContent,
}: SettingsScreenProps) {
  const { theme } = useAppTheme();
  const router = useRouter();

  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing['4xl'],
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1 }}>{children}</View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.theme.background }}
      edges={['top']}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.theme.border,
          backgroundColor: theme.colors.theme.background,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: theme.spacing.xs,
          }}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={30}
            color={theme.colors.theme.text}
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize.titleLarge,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.theme.text,
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
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {rightContent}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
