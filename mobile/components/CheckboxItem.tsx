import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useAppTheme } from '../constants/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CheckboxItemProps {
  label: string;
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function CheckboxItem({
  label,
  checked,
  onPress,
  disabled = false,
  style,
  textStyle,
}: CheckboxItemProps) {
  const { theme, isDark } = useAppTheme();
  
  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      backgroundColor: checked 
        ? theme.colors.wizard.primary + '20' 
        : theme.colors.theme.surface,
      borderColor: checked 
        ? theme.colors.wizard.primary 
        : theme.colors.theme.border,
    };
    
    if (disabled) {
      return {
        ...baseStyle,
        opacity: 0.6,
      };
    }
    
    return baseStyle;
  };
  
  const getCheckboxStyle = (): ViewStyle => {
    return {
      width: 24,
      height: 24,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: checked 
        ? theme.colors.wizard.primary 
        : theme.colors.theme.border,
      backgroundColor: checked 
        ? theme.colors.wizard.primary 
        : 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.lg,
    };
  };
  
  const getTextColor = () => {
    if (disabled) {
      return theme.colors.theme.textDisabled;
    }
    if (checked) {
      return theme.colors.theme.text;
    }
    return theme.colors.theme.textSecondary;
  };
  
  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={getCheckboxStyle()}>
        {checked && (
          <MaterialCommunityIcons
            name="check"
            size={16}
            color="#ffffff"
          />
        )}
      </View>
      
      <Text
        style={[
          {
            flex: 1,
            fontSize: theme.typography.fontSize.bodyLarge,
            fontFamily: theme.typography.fontFamily.body,
            fontWeight: theme.typography.fontWeight.medium,
            color: getTextColor(),
            textDecorationLine: checked ? 'line-through' : 'none',
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}