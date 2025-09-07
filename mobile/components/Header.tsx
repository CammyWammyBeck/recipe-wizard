import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useAppTheme } from '../constants/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onRightPress?: () => void;
  leftIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onLeftPress?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  variant?: 'default' | 'large' | 'wizard';
}

export function Header({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightIcon,
  onRightPress,
  leftIcon,
  onLeftPress,
  style,
  titleStyle,
  variant = 'default',
}: HeaderProps) {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  
  const getTitleStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.theme.text,
      textAlign: 'center',
      flex: 1,
    };
    
    switch (variant) {
      case 'large':
        return {
          ...baseStyle,
          fontSize: theme.typography.fontSize.headlineMedium,
          fontFamily: theme.typography.fontFamily.heading,
        };
      case 'wizard':
        return {
          ...baseStyle,
          fontSize: theme.typography.fontSize.headlineSmall,
          fontFamily: theme.typography.fontFamily.wizard,
          textShadowColor: theme.colors.wizard.primary,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 8,
        };
      case 'default':
      default:
        return {
          ...baseStyle,
          fontSize: theme.typography.fontSize.titleLarge,
          fontFamily: theme.typography.fontFamily.body,
        };
    }
  };
  
  const getContainerStyle = (): ViewStyle => {
    return {
      paddingTop: insets.top,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      backgroundColor: variant === 'wizard' 
        ? 'transparent' 
        : theme.colors.theme.background,
      borderBottomWidth: variant === 'wizard' ? 0 : 1,
      borderBottomColor: theme.colors.theme.borderLight,
    };
  };
  
  const iconColor = variant === 'wizard' 
    ? theme.colors.wizard.primary 
    : theme.colors.theme.textSecondary;
    
  const iconSize = variant === 'large' ? 28 : 24;
  
  return (
    <View style={[getContainerStyle(), style]}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 44,
        }}
      >
        {/* Left side */}
        <View style={{ width: 44, alignItems: 'flex-start' }}>
          {showBackButton && (
            <TouchableOpacity
              onPress={onBackPress}
              style={{
                padding: theme.spacing.sm,
                borderRadius: theme.borderRadius.md,
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={iconSize}
                color={iconColor}
              />
            </TouchableOpacity>
          )}
          {leftIcon && !showBackButton && (
            <TouchableOpacity
              onPress={onLeftPress}
              style={{
                padding: theme.spacing.sm,
                borderRadius: theme.borderRadius.md,
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={leftIcon}
                size={iconSize}
                color={iconColor}
              />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Title and subtitle */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[getTitleStyle(), titleStyle]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                fontSize: theme.typography.fontSize.bodySmall,
                color: theme.colors.theme.textTertiary,
                fontFamily: theme.typography.fontFamily.body,
                marginTop: theme.spacing.xs,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>
        
        {/* Right side */}
        <View style={{ width: 44, alignItems: 'flex-end' }}>
          {rightIcon && (
            <TouchableOpacity
              onPress={onRightPress}
              style={{
                padding: theme.spacing.sm,
                borderRadius: theme.borderRadius.md,
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={rightIcon}
                size={iconSize}
                color={iconColor}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}