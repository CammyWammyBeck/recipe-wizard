import React, { useEffect } from 'react';
import { View, Text, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, useAppTheme } from '../components';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function WelcomeScreen() {
  const { theme, isDark, setThemeMode, themeMode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to prompt if user is authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('User is authenticated, redirecting to prompt');
      router.replace('/prompt');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleGetStarted = () => {
    router.push('/auth/signin');
  };

  const handleToggleTheme = () => {
    if (themeMode === 'system') {
      setThemeMode(isDark ? 'light' : 'dark');
    } else {
      setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
    }
  };

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.theme.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons
          name="chef-hat"
          size={60}
          color={theme.colors.wizard.primary}
        />
        <Text
          style={{
            fontSize: theme.typography.fontSize.bodyLarge,
            color: theme.colors.theme.textSecondary,
            fontFamily: theme.typography.fontFamily.body,
            marginTop: theme.spacing.md,
          }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  // Don't render welcome screen if authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.theme.background}
        translucent
      />
      
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.theme.background,
        }}
      >
        {/* Top Navigation Bar */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingTop: insets.top + theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            paddingBottom: theme.spacing.lg,
          }}
        >
          {/* Theme toggle */}
          <TouchableOpacity
            onPress={handleToggleTheme}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.theme.backgroundSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons
              name={isDark ? 'weather-sunny' : 'weather-night'}
              size={24}
              color={theme.colors.theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
        
        <View
          style={{
            flex: 1,
            paddingHorizontal: theme.spacing.xl,
            paddingBottom: insets.bottom + theme.spacing.lg,
          }}
        >
          {/* Hero Section */}
          <View
            style={{
              alignItems: 'center',
              flex: 1,
              justifyContent: 'center',
              paddingTop: theme.spacing.xl,
            }}
          >
            {/* Magical Circle with Chef Hat */}
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: theme.colors.wizard.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: theme.spacing.xl,
                position: 'relative',
              }}
            >
              {/* Animated sparkles around the circle */}
              <View
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 15,
                }}
              >
                <MaterialCommunityIcons
                  name="star-four-points"
                  size={14}
                  color={theme.colors.wizard.accent}
                  style={{ opacity: 0.8 }}
                />
              </View>
              
              <View
                style={{
                  position: 'absolute',
                  bottom: 15,
                  left: 15,
                }}
              >
                <MaterialCommunityIcons
                  name="star-four-points"
                  size={10}
                  color={theme.colors.wizard.primaryLight}
                  style={{ opacity: 0.6 }}
                />
              </View>

              <View
                style={{
                  position: 'absolute',
                  top: 25,
                  left: 20,
                }}
              >
                <MaterialCommunityIcons
                  name="star-four-points"
                  size={12}
                  color={theme.colors.wizard.accent}
                  style={{ opacity: 0.7 }}
                />
              </View>

              {/* Main Chef Hat Icon */}
              <MaterialCommunityIcons
                name="chef-hat"
                size={60}
                color={theme.colors.wizard.primary}
              />
            </View>

            <Text
              style={{
                fontSize: theme.typography.fontSize.displayMedium,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.theme.text,
                fontFamily: theme.typography.fontFamily.wizard,
                textAlign: 'center',
                marginBottom: theme.spacing.md,
                lineHeight: theme.typography.fontSize.displayMedium * 1.1,
                textShadowColor: theme.colors.wizard.primary + '30',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: isDark ? 12 : 0,
              }}
            >
              Recipe Wizard
            </Text>

            <Text
              style={{
                fontSize: theme.typography.fontSize.bodyLarge,
                color: theme.colors.theme.textSecondary,
                fontFamily: theme.typography.fontFamily.body,
                textAlign: 'center',
                marginBottom: theme.spacing.lg,
                lineHeight: theme.typography.fontSize.bodyLarge * 1.4,
                maxWidth: 280,
              }}
            >
              Create amazing recipes with just a few words ✨
            </Text>
          </View>

          {/* Get Started Button */}
          <View
            style={{
              paddingTop: theme.spacing.lg,
            }}
          >
            <Button
              variant="primary"
              size="large"
              fullWidth
              onPress={handleGetStarted}
              rightIcon="arrow-right"
              style={{
                minHeight: 64,
                ...theme.shadows.wizard.glow,
              }}
            >
              Get Started
            </Button>
          </View>
        </View>
      </View>
    </>
  );
}
