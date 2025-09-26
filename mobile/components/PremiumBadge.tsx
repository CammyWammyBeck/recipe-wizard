import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../constants/ThemeProvider';
import { usePremium } from '../contexts/PremiumContext';

interface PremiumBadgeProps {
  style?: ViewStyle;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function PremiumBadge({
  style,
  onPress,
  size = 'medium'
}: PremiumBadgeProps) {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { isPremium, isLoading } = usePremium();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Default action: navigate to subscription management
      router.push('/subscription/manage');
    }
  };

  // Don't show anything while loading
  if (isLoading) {
    return null;
  }

  // Only show for premium users
  if (!isPremium) {
    return null;
  }

  const sizeConfig = {
    small: {
      iconSize: 16,
      fontSize: theme.typography.fontSize.bodySmall,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.md,
    },
    medium: {
      iconSize: 18,
      fontSize: theme.typography.fontSize.bodyMedium,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.lg,
    },
    large: {
      iconSize: 20,
      fontSize: theme.typography.fontSize.bodyLarge,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
    },
  };

  const config = sizeConfig[size];

  const badge = (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.wizard.primary,
          paddingHorizontal: config.paddingHorizontal,
          paddingVertical: config.paddingVertical,
          borderRadius: config.borderRadius,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
        },
        style,
      ]}
    >
      <MaterialCommunityIcons
        name="crown"
        size={config.iconSize}
        color="#ffffff"
        style={{ marginRight: theme.spacing.xs }}
      />
      <Text
        style={{
          fontSize: config.fontSize,
          fontWeight: theme.typography.fontWeight.semibold,
          color: '#ffffff',
        }}
      >
        Premium
      </Text>
    </View>
  );

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      {badge}
    </TouchableOpacity>
  );
}