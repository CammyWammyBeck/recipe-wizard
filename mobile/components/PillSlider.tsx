import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useAppTheme } from '../constants/ThemeProvider';

export interface PillSliderOption {
  label: string;
  value: string;
}

interface PillSliderProps {
  options: [PillSliderOption, PillSliderOption];
  selectedValue: string;
  onValueChange: (value: string) => void;
  style?: any;
}

export function PillSlider({ options, selectedValue, onValueChange, style }: PillSliderProps) {
  const { theme } = useAppTheme();
  
  const isFirstSelected = selectedValue === options[0].value;
  
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: theme.colors.theme.backgroundSecondary,
          borderRadius: theme.borderRadius['2xl'],
          padding: 4,
          alignSelf: 'center',
        },
        style,
      ]}
    >
      {options.map((option, index) => {
        const isSelected = selectedValue === option.value;
        
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onValueChange(option.value)}
            style={{
              flex: 1,
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
              borderRadius: theme.borderRadius.xl,
              backgroundColor: isSelected 
                ? theme.colors.wizard.primary 
                : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.bodyLarge,
                fontWeight: theme.typography.fontWeight.semibold,
                color: isSelected 
                  ? 'white'
                  : theme.colors.theme.text,
                fontFamily: theme.typography.fontFamily.body,
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}