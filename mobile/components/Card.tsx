import React from 'react';
import {
  View,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '../constants/ThemeProvider';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';

interface CardProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: CardVariant;
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  onPress?: () => void;
}

export function Card({
  variant = 'default',
  children,
  style,
  contentStyle,
  onPress,
  ...props
}: CardProps) {
  const { theme, isDark } = useAppTheme();
  
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
    };
    
    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.theme.surface,
          ...theme.shadows.surfaceLarge,
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.theme.surface,
          borderWidth: 1,
          borderColor: theme.colors.theme.border,
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.theme.backgroundSecondary,
        };
      case 'default':
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.colors.theme.surface,
          ...theme.shadows.surface,
        };
    }
  };
  
  const cardStyle = [getCardStyle(), style];
  
  // If onPress is provided, use TouchableOpacity, otherwise use View
  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
        {...props}
      >
        <View style={contentStyle}>
          {children}
        </View>
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={cardStyle}>
      <View style={contentStyle}>
        {children}
      </View>
    </View>
  );
}

// Card sub-components for better composition
interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardHeader({ children, style }: CardHeaderProps) {
  const { theme } = useAppTheme();
  
  return (
    <View
      style={[
        {
          marginBottom: theme.spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardContent({ children, style }: CardContentProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardFooter({ children, style }: CardFooterProps) {
  const { theme } = useAppTheme();
  
  return (
    <View
      style={[
        {
          marginTop: theme.spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}