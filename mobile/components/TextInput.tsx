import React, { useState, useMemo, useCallback, forwardRef } from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useAppTheme } from '../constants/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type TextInputVariant = 'default' | 'filled' | 'outlined';
type TextInputSize = 'small' | 'medium' | 'large';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onRightIconPress?: () => void;
  variant?: TextInputVariant;
  size?: TextInputSize;
  containerStyle?: ViewStyle;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInputInternal({
  label,
  helperText,
  errorText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'default',
  size = 'medium',
  style,
  containerStyle,
  onFocus,
  onBlur,
  ...props
}, ref) {
  const { theme, isDark } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  
  const hasError = Boolean(errorText);
  
  // Memoize size configuration to prevent re-calculations
  const config = useMemo(() => {
    const sizeConfig = {
      small: {
        fontSize: theme.typography.fontSize.bodySmall,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        iconSize: 16,
        borderRadius: theme.borderRadius.md,
        minHeight: 40,
      },
      medium: {
        fontSize: theme.typography.fontSize.bodyLarge,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        iconSize: 20,
        borderRadius: theme.borderRadius.lg,
        minHeight: 48,
      },
      large: {
        fontSize: theme.typography.fontSize.titleSmall,
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
        iconSize: 24,
        borderRadius: theme.borderRadius.xl,
        minHeight: 56,
      },
    };
    return sizeConfig[size];
  }, [size, theme]);
  
  // Memoize styles to prevent unnecessary re-renders
  const inputContainerStyle = useMemo(() => {
    const baseStyle: ViewStyle = {
      borderRadius: config.borderRadius,
      minHeight: config.minHeight,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
    };
    
    // Color and state styling
    if (hasError) {
      return {
        ...baseStyle,
        backgroundColor: variant === 'filled' ? theme.colors.status.error + '10' : theme.colors.theme.surface,
        borderColor: theme.colors.status.error,
      };
    }
    
    if (isFocused) {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.theme.surface,
        borderColor: theme.colors.wizard.primary,
        borderWidth: 2,
      };
    }
    
    // Default state
    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.theme.backgroundSecondary,
          borderColor: theme.colors.theme.border,
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderColor: theme.colors.theme.border,
        };
      case 'default':
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.colors.theme.surface,
          borderColor: theme.colors.theme.border,
        };
    }
  }, [config, hasError, isFocused, variant, theme]);
  
  // Memoize text colors
  const textColor = useMemo(() => {
    if (props.editable === false) {
      return theme.colors.theme.textDisabled;
    }
    return theme.colors.theme.text;
  }, [props.editable, theme.colors.theme.textDisabled, theme.colors.theme.text]);
  
  const placeholderColor = useMemo(() => {
    return theme.colors.theme.textTertiary;
  }, [theme.colors.theme.textTertiary]);
  
  // Memoize input styles
  const inputStyle = useMemo((): TextStyle => ({
    flex: 1,
    fontSize: config.fontSize,
    fontFamily: theme.typography.fontFamily.body,
    color: textColor,
    paddingVertical: config.paddingVertical,
    paddingHorizontal: leftIcon ? theme.spacing.sm : config.paddingHorizontal,
    paddingRight: rightIcon ? theme.spacing.sm : config.paddingHorizontal,
    textAlignVertical: props.multiline ? 'top' : 'center',
  }), [config, textColor, leftIcon, rightIcon, theme.spacing, theme.typography.fontFamily.body, props.multiline]);
  
  // Memoize focus handlers
  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  }, [onFocus]);
  
  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  }, [onBlur]);
  
  const handleRightIconPress = useCallback(() => {
    onRightIconPress?.();
  }, [onRightIconPress]);
  
  return (
    <View style={containerStyle}>
      {label && (
        <Text
          style={{
            fontSize: theme.typography.fontSize.labelMedium,
            fontWeight: theme.typography.fontWeight.medium,
            color: hasError ? theme.colors.status.error : theme.colors.theme.textSecondary,
            marginBottom: theme.spacing.xs,
            fontFamily: theme.typography.fontFamily.body,
          }}
        >
          {label}
        </Text>
      )}
      
      <View style={inputContainerStyle}>
        {leftIcon && (
          <View style={{ paddingLeft: config.paddingHorizontal }}>
            <MaterialCommunityIcons
              name={leftIcon}
              size={config.iconSize}
              color={hasError ? theme.colors.status.error : theme.colors.theme.textTertiary}
            />
          </View>
        )}
        
        <RNTextInput
          style={[inputStyle, style]}
          placeholderTextColor={placeholderColor}
          onFocus={handleFocus}
          onBlur={handleBlur}
          ref={ref}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity
            style={{ paddingRight: config.paddingHorizontal }}
            onPress={handleRightIconPress}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={rightIcon}
              size={config.iconSize}
              color={hasError ? theme.colors.status.error : theme.colors.theme.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {(helperText || errorText) && (
        <Text
          style={{
            fontSize: theme.typography.fontSize.bodySmall,
            color: hasError ? theme.colors.status.error : theme.colors.theme.textTertiary,
            marginTop: theme.spacing.xs,
            fontFamily: theme.typography.fontFamily.body,
          }}
        >
          {errorText || helperText}
        </Text>
      )}
    </View>
  );
});
