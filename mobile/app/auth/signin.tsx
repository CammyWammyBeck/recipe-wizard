import React, { useState } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button, TextInput, useAppTheme } from '../../components';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function SignInScreen() {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setError('');
      console.log('Sign in attempted with:', { email, password });
      
      await login({ email, password });
      
      // Navigate to prompt screen after successful login
      console.log('✅ Login successful, navigating to prompt');
      router.replace('/prompt');
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    }
  };

  const handleSignUp = () => {
    router.push('/auth/signup');
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password
    console.log('Forgot password pressed');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.theme.background}
        translucent
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
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
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: insets.top + theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            paddingBottom: theme.spacing.lg,
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
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
              name="arrow-left"
              size={24}
              color={theme.colors.theme.textSecondary}
            />
          </TouchableOpacity>

          <View style={{ width: 40 }} />
        </View>
        
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: theme.spacing.xl,
            paddingBottom: insets.bottom + theme.spacing.xl + 200,
          }}
          showsVerticalScrollIndicator={false}
          extraScrollHeight={100}
          enableOnAndroid={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Section */}
          <View
            style={{
              alignItems: 'center',
              marginTop: theme.spacing.xl,
              marginBottom: theme.spacing['4xl'],
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
                marginBottom: theme.spacing['2xl'],
                position: 'relative',
              }}
            >
              {/* Sparkles */}
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
                  style={{ opacity: 0.7 }}
                />
              </View>
              
              <View
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
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
                  top: 20,
                  left: 20,
                }}
              >
                <MaterialCommunityIcons
                  name="star-four-points"
                  size={12}
                  color={theme.colors.wizard.accent}
                  style={{ opacity: 0.5 }}
                />
              </View>

              {/* Main Chef Hat Icon */}
              <MaterialCommunityIcons
                name="chef-hat"
                size={50}
                color={theme.colors.wizard.primary}
              />
            </View>

            <Text
              style={{
                fontSize: theme.typography.fontSize.displaySmall,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.theme.text,
                fontFamily: theme.typography.fontFamily.heading,
                textAlign: 'center',
                marginBottom: theme.spacing.md,
                lineHeight: theme.typography.fontSize.displaySmall * 1.2,
              }}
            >
              Welcome back!
            </Text>
            
            <Text
              style={{
                fontSize: theme.typography.fontSize.bodyLarge,
                color: theme.colors.theme.textSecondary,
                fontFamily: theme.typography.fontFamily.body,
                textAlign: 'center',
                lineHeight: theme.typography.fontSize.bodyLarge * 1.4,
              }}
            >
              Sign in to continue your culinary journey ✨
            </Text>
          </View>

          {/* Form */}
          <View style={{ marginBottom: theme.spacing['2xl'] }}>
            {/* Error Message */}
            {error && (
              <View
                style={{
                  backgroundColor: theme.colors.theme.surface,
                  borderLeftWidth: 4,
                  borderLeftColor: '#ef4444',
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.lg,
                  marginBottom: theme.spacing.lg,
                  ...theme.shadows.surface,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={20}
                    color="#ef4444"
                    style={{ marginRight: theme.spacing.sm }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: theme.typography.fontSize.bodyMedium,
                      color: theme.colors.theme.text,
                      fontFamily: theme.typography.fontFamily.body,
                    }}
                  >
                    {error}
                  </Text>
                </View>
              </View>
            )}

            <TextInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError('');
              }}
              leftIcon="email-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={{ marginBottom: theme.spacing.lg }}
            />

            <TextInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError('');
              }}
              leftIcon="lock-outline"
              rightIcon={showPassword ? "eye-off" : "eye"}
              onRightIconPress={() => setShowPassword(!showPassword)}
              secureTextEntry={!showPassword}
              containerStyle={{ marginBottom: theme.spacing.sm }}
            />

            <Button
              variant="ghost"
              size="small"
              onPress={handleForgotPassword}
              style={{ alignSelf: 'flex-end', marginBottom: theme.spacing.xl }}
            >
              Forgot Password?
            </Button>

            <Button
              variant="primary"
              size="large"
              fullWidth
              onPress={handleSignIn}
              loading={isLoading}
              rightIcon="arrow-right"
              style={{
                minHeight: 64,
                ...theme.shadows.wizard.glow,
              }}
            >
              Sign In
            </Button>
          </View>

          {/* Sign Up Link */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: theme.spacing['4xl'],
              paddingTop: theme.spacing['2xl'],
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.bodyMedium,
                color: theme.colors.theme.textSecondary,
                fontFamily: theme.typography.fontFamily.body,
                marginRight: theme.spacing.sm,
              }}
            >
              Don't have an account?
            </Text>
            
            <Button
              variant="ghost"
              size="small"
              onPress={handleSignUp}
            >
              Sign Up
            </Button>
          </View>
        </KeyboardAwareScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}