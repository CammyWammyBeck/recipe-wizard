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
  compact?: boolean;
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
  compact = false,
}: ExpandableCardProps) {
  const { theme } = useAppTheme();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  // Safely render children: wrap raw strings/numbers in Text to avoid RN crashes
  const renderContent = () => {
    if (typeof children === 'string' || typeof children === 'number') {
      return (
        <Text
          style={{
            fontSize: theme.typography.fontSize.bodyMedium,
            color: theme.colors.theme.text,
            fontFamily: theme.typography.fontFamily.body,
            lineHeight: theme.typography.fontSize.bodyMedium * 1.4,
          }}
        >
          {children}
        </Text>
      );
    }

    if (Array.isArray(children)) {
      const allPrimitive = children.every(
        (child) => typeof child === 'string' || typeof child === 'number'
      );
      if (allPrimitive) {
        return (
          <View style={{ gap: theme.spacing.sm }}>
            {children.map((child, idx) => (
              <Text
                key={idx}
                style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  color: theme.colors.theme.text,
                  fontFamily: theme.typography.fontFamily.body,
                  lineHeight: theme.typography.fontSize.bodyMedium * 1.4,
                }}
              >
                {child as string | number}
              </Text>
            ))}
          </View>
        );
      }
    }

    return children;
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
            paddingVertical: compact ? theme.spacing.md : theme.spacing.lg,
            paddingHorizontal: compact ? theme.spacing.md : theme.spacing.lg,
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
              width: compact ? 28 : 40,
              height: compact ? 28 : 40,
              borderRadius: compact ? 14 : 20,
              backgroundColor: theme.colors.wizard.primary + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: compact ? theme.spacing.md : theme.spacing.lg,
            }}
          >
            <MaterialCommunityIcons
              name={icon}
              size={compact ? 16 : 20}
              color={theme.colors.wizard.primary}
            />
          </View>
        )}

        {/* Title and Subtitle */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: compact 
                ? theme.typography.fontSize.titleMedium 
                : theme.typography.fontSize.titleLarge,
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
                fontSize: compact 
                  ? theme.typography.fontSize.bodySmall 
                  : theme.typography.fontSize.bodyMedium,
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
            width: compact ? 28 : 32,
            height: compact ? 28 : 32,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={compact ? 20 : 24}
            color={theme.colors.theme.textTertiary}
          />
        </View>
      </TouchableOpacity>

      {/* Content */}
      {isExpanded && (
        <View
          style={[
            {
              padding: compact ? theme.spacing.md : theme.spacing.lg,
              paddingTop: 0,
            },
            contentStyle,
          ]}
        >
          {renderContent()}
        </View>
      )}
    </View>
  );
}
