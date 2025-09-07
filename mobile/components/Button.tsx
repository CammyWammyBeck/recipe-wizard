import React from 'react';
import { 
  TouchableOpacity, 
  TouchableOpacityProps, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  ActivityIndicator 
} from 'react-native';
import { useAppTheme } from '../constants/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  leftIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  variant = 'primary',
  size = 'medium',
  children,
  leftIcon,
  rightIcon,
  loading = false,
  fullWidth = false,
  disabled,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const { theme, isDark } = useAppTheme();
  
  // Size configurations
  const sizeConfig = {
    small: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      fontSize: theme.typography.fontSize.labelMedium,
      iconSize: 16,
      borderRadius: theme.borderRadius.lg,
    },
    medium: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      fontSize: theme.typography.fontSize.labelLarge,
      iconSize: 20,
      borderRadius: theme.borderRadius.xl,
    },
    large: {
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing['2xl'],
      fontSize: theme.typography.fontSize.titleMedium,
      iconSize: 24,
      borderRadius: theme.borderRadius.xl,
    },
  };
  
  const config = sizeConfig[size];
  
  // Variant styles
  const getVariantStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      paddingVertical: config.paddingVertical,
      paddingHorizontal: config.paddingHorizontal,
      borderRadius: config.borderRadius,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: size === 'large' ? 56 : size === 'medium' ? 48 : 40,
    };
    
    if (disabled || loading) {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.theme.border,
        opacity: 0.6,
      };
    }
    
    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.wizard.primary,
          ...theme.shadows.wizard.glow,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.theme.surface,
          borderWidth: 1,
          borderColor: theme.colors.theme.border,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.colors.wizard.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return baseStyle;
    }
  };
  
  const getTextColor = (): string => {
    if (disabled || loading) {
      return theme.colors.theme.textDisabled;
    }
    
    switch (variant) {
      case 'primary':
        return '#ffffff';
      case 'outline':
        return theme.colors.wizard.primary;
      case 'ghost':
        return theme.colors.wizard.primary;
      case 'secondary':
      default:
        return theme.colors.theme.text;
    }
  };
  
  const buttonStyle = [
    getVariantStyle(),
    fullWidth && { width: '100%' },
    style,
  ];
  
  const textColor = getTextColor();
  
  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={textColor}
          style={{ marginRight: theme.spacing.sm }}
        />
      )}
      
      {leftIcon && !loading && (
        <MaterialCommunityIcons
          name={leftIcon}
          size={config.iconSize}
          color={textColor}
          style={{ marginRight: theme.spacing.sm }}
        />
      )}
      
      <Text
        style={[
          {
            color: textColor,
            fontSize: config.fontSize,
            fontWeight: theme.typography.fontWeight.semibold,
            fontFamily: theme.typography.fontFamily.body,
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
      
      {rightIcon && !loading && (
        <MaterialCommunityIcons
          name={rightIcon}
          size={config.iconSize}
          color={textColor}
          style={{ marginLeft: theme.spacing.sm }}
        />
      )}
    </TouchableOpacity>
  );
}