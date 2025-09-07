import React from 'react';
import {
  View,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useAppTheme } from '../constants/ThemeProvider';

interface InstructionStepProps {
  stepNumber: number;
  instruction: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function InstructionStep({
  stepNumber,
  instruction,
  style,
  textStyle,
}: InstructionStepProps) {
  const { theme, isDark } = useAppTheme();
  
  const getNumberBadgeStyle = (): ViewStyle => {
    return {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.wizard.primary + '30',
      borderWidth: 1,
      borderColor: theme.colors.wizard.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
      flexShrink: 0,
    };
  };
  
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: theme.spacing.lg,
        },
        style,
      ]}
    >
      <View style={getNumberBadgeStyle()}>
        <Text
          style={{
            fontSize: theme.typography.fontSize.labelMedium,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.wizard.primary,
            fontFamily: theme.typography.fontFamily.body,
          }}
        >
          {stepNumber}
        </Text>
      </View>
      
      <Text
        style={[
          {
            flex: 1,
            fontSize: theme.typography.fontSize.bodyLarge,
            fontFamily: theme.typography.fontFamily.body,
            color: theme.colors.theme.text,
            lineHeight: theme.typography.fontSize.bodyLarge * theme.typography.lineHeight.relaxed,
            paddingTop: 4, // Align with badge center
          },
          textStyle,
        ]}
      >
        {instruction}
      </Text>
    </View>
  );
}