import React, { useState } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, TextInput, useAppTheme } from '../../components';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function SignUpScreen() {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register, isLoading } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    // Basic validation
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setError('');
      // console.log('Sign up attempted with:', { name: name.trim(), email: email.trim() });
      
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || undefined;
      
      await register({
        email: email.trim(),
        password,
        firstName,
        lastName,
      });
      
      // Navigate to prompt screen after successful registration
      // console.log('✅ Registration successful, navigating to prompt');
      router.replace('/prompt');
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      setError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    }
  };

  const handleSignIn = () => {
    router.push('/auth/signin');
  };

  const handleBack = () => {
    router.back();
  };

  const passwordsMatch = password === confirmPassword || confirmPassword === '';

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
        keyboardVerticalOffset={0}
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
        
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: theme.spacing.xl,
            paddingBottom: insets.bottom + theme.spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Section */}
          <View
            style={{
              alignItems: 'center',
              marginTop: theme.spacing.md,
              marginBottom: theme.spacing['3xl'],
            }}
          >
            {/* Magical Circle with Chef Hat */}
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: theme.colors.wizard.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: theme.spacing.xl,
                position: 'relative',
              }}
            >
              {/* Sparkles */}
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 12,
                }}
              >
                <MaterialCommunityIcons
                  name="star-four-points"
                  size={12}
                  color={theme.colors.wizard.accent}
                  style={{ opacity: 0.7 }}
                />
              </View>
              
              <View
                style={{
                  position: 'absolute',
                  bottom: 10,
                  left: 10,
                }}
              >
                <MaterialCommunityIcons
                  name="star-four-points"
                  size={8}
                  color={theme.colors.wizard.primaryLight}
                  style={{ opacity: 0.6 }}
                />
              </View>

              <View
                style={{
                  position: 'absolute',
                  top: 15,
                  left: 15,
                }}
              >
                <MaterialCommunityIcons
                  name="star-four-points"
                  size={10}
                  color={theme.colors.wizard.accent}
                  style={{ opacity: 0.5 }}
                />
              </View>

              {/* Main Chef Hat Icon */}
              <MaterialCommunityIcons
                name="chef-hat"
                size={40}
                color={theme.colors.wizard.primary}
              />
            </View>

            <Text
              style={{
                fontSize: theme.typography.fontSize.headlineLarge,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.theme.text,
                fontFamily: theme.typography.fontFamily.heading,
                textAlign: 'center',
                marginBottom: theme.spacing.sm,
                lineHeight: theme.typography.fontSize.headlineLarge * 1.2,
              }}
            >
              Join Recipe Wizard
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
              Start creating amazing recipes with AI ✨
            </Text>
          </View>

          {/* Form */}
          <View style={{ marginBottom: theme.spacing.xl }}>
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
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError('');
              }}
              leftIcon="account-outline"
              autoCapitalize="words"
              containerStyle={{ marginBottom: theme.spacing.lg }}
            />

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
              placeholder="Create a password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError('');
              }}
              leftIcon="lock-outline"
              rightIcon={showPassword ? "eye-off" : "eye"}
              onRightIconPress={() => setShowPassword(!showPassword)}
              secureTextEntry={!showPassword}
              containerStyle={{ marginBottom: theme.spacing.lg }}
              helperText="Must be at least 8 characters"
            />

            <TextInput
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (error) setError('');
              }}
              leftIcon="lock-check-outline"
              rightIcon={showConfirmPassword ? "eye-off" : "eye"}
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
              secureTextEntry={!showConfirmPassword}
              containerStyle={{ marginBottom: theme.spacing['2xl'] }}
              errorText={!passwordsMatch ? "Passwords do not match" : undefined}
            />

            <Button
              variant="primary"
              size="large"
              fullWidth
              onPress={handleSignUp}
              loading={isLoading}
              disabled={!passwordsMatch}
              rightIcon="arrow-right"
              style={{
                minHeight: 64,
                ...theme.shadows.wizard.glow,
              }}
            >
              Create Account
            </Button>
          </View>

          {/* Terms */}
          <Text
            style={{
              fontSize: theme.typography.fontSize.bodySmall,
              color: theme.colors.theme.textTertiary,
              fontFamily: theme.typography.fontFamily.body,
              textAlign: 'center',
              marginBottom: theme.spacing.xl,
            }}
          >
            By creating an account, you agree to our{' '}
            <Text style={{ color: theme.colors.wizard.primary }}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text style={{ color: theme.colors.wizard.primary }}>
              Privacy Policy
            </Text>
          </Text>

          {/* Sign In Link */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: theme.spacing['4xl'],
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
              Already have an account?
            </Text>
            
            <Button
              variant="ghost"
              size="small"
              onPress={handleSignIn}
            >
              Sign In
            </Button>
          </View>
        </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}