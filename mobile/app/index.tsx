import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../constants/ThemeProvider';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useAppTheme();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.theme.background
        }}
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.wizard.primary}
        />
      </View>
    );
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/prompt" />;
  } else {
    return <Redirect href="/auth/signin" />;
  }
}