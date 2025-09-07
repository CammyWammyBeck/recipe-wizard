import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useAppTheme } from '../constants/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ExpandableCardProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  style?: ViewStyle;
  headerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  onToggle?: (expanded: boolean) => void;
}

export function ExpandableCard({
  title,
  subtitle,
  icon,
  children,
  defaultExpanded = false,
  style,
  headerStyle,
  contentStyle,
  onToggle,
}: ExpandableCardProps) {
  const { theme } = useAppTheme();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.theme.surface,
          borderRadius: theme.borderRadius.xl,
          borderWidth: 1,
          borderColor: theme.colors.theme.border,
          ...theme.shadows.surface,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {/* Header */}
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.7}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.spacing.lg,
            backgroundColor: isExpanded 
              ? theme.colors.theme.backgroundSecondary 
              : 'transparent',
          },
          headerStyle,
        ]}
      >
        {/* Icon */}
        {icon && (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.wizard.primary + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: theme.spacing.lg,
            }}
          >
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color={theme.colors.wizard.primary}
            />
          </View>
        )}

        {/* Title and Subtitle */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize.titleLarge,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.theme.text,
              fontFamily: theme.typography.fontFamily.body,
              marginBottom: subtitle ? theme.spacing.xs : 0,
            }}
          >
            {title}
          </Text>
          
          {subtitle && (
            <Text
              style={{
                fontSize: theme.typography.fontSize.bodyMedium,
                color: theme.colors.theme.textSecondary,
                fontFamily: theme.typography.fontFamily.body,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Chevron */}
        <View
          style={{
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={theme.colors.theme.textTertiary}
          />
        </View>
      </TouchableOpacity>

      {/* Content */}
      {isExpanded && (
        <View
          style={[
            {
              padding: theme.spacing.lg,
              paddingTop: 0,
            },
            contentStyle,
          ]}
        >
          {children}
        </View>
      )}
    </View>
  );
}