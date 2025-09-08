import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, TextInput, useAppTheme, ExpandableCard } from '../components';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { PreferencesService } from '../services/preferences';
import { UserPreferences } from '../types/api';
import {
  getRandomHeroSubtitle,
  getRandomHeroTitle,
  getRandomSuggestion,
  getRandomSuggestions,
} from '../constants/copy';

export default function PromptScreen() {
  const { theme, isDark, setThemeMode, themeMode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Creating magic...');
  const [error, setError] = useState<string | null>(null);
  const [servings, setServings] = useState<number>(4);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | undefined>(undefined);

  // Initialize per-recipe overrides from saved preferences
  useEffect(() => {
    (async () => {
      const prefs: UserPreferences = await PreferencesService.loadPreferences();
      setServings(prefs.defaultServings || 4);
      setDifficulty(prefs.preferredDifficulty);
    })();
  }, []);

  const handleCreateRecipe = async () => {
    if (!prompt.trim()) {
      setError('Please enter a recipe description');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMessage('Creating magic...');
    
    // Simulate dynamic loading messages (since we can't get real-time updates)
    const loadingMessages = [
      'Creating magic...',
      'Mixing ingredients...',
      'Perfecting the recipe...',
      'Adding final touches...'
    ];
    
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 2000);
    
    try {
      // Generate recipe using real API
      console.log('Creating recipe with prompt:', prompt);
      const recipeData = await apiService.generateRecipe({
        prompt,
        overrides: {
          defaultServings: servings,
          preferredDifficulty: difficulty,
        },
      });
      
      clearInterval(messageInterval);
      setIsLoading(false);
      
      // Navigate with the actual recipe data
      router.push({
        pathname: '/recipe-result',
        params: { 
          userPrompt: prompt,
          recipeData: JSON.stringify(recipeData),
          timestamp: Date.now().toString()
        }
      });
    } catch (error) {
      clearInterval(messageInterval);
      console.error('Recipe generation error:', error);
      setIsLoading(false);
      
      // Show error on this screen, don't navigate
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Unable to generate recipe. Please check your connection and try again.');
      }
    }
  };

  const handleThemeToggle = () => {
    if (themeMode === 'system') {
      setThemeMode(isDark ? 'light' : 'dark');
    } else {
      setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
    }
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  const handleHistory = () => {
    router.push('/history');
  };

  // Fresh randomized copy and suggestions per mount
  const [heroTitle, setHeroTitle] = useState<string>('What shall we cook today?');
  const [heroSubtitle, setHeroSubtitle] = useState<string>(
    "Tell me what you're craving and I'll create the perfect recipe for you ✨"
  );
  const [placeholder, setPlaceholder] = useState<string>('');
  const [suggestionPrompts, setSuggestionPrompts] = useState<
    { text: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[]
  >([]);

  const suggestionIcons = useMemo<
    ReadonlyArray<keyof typeof MaterialCommunityIcons.glyphMap>
  >(() => (
    ['lightbulb-on', 'chef-hat', 'bowl-mix', 'food-variant', 'silverware-fork-knife', 'fire', 'leaf', 'cookie']
  ), []);

  const refreshDynamicCopy = () => {
    setHeroTitle(getRandomHeroTitle());
    setHeroSubtitle(getRandomHeroSubtitle());

    const texts = getRandomSuggestions(8);
    const items = texts.map((t, idx) => ({
      text: t,
      icon: suggestionIcons[idx % suggestionIcons.length],
    }));
    setSuggestionPrompts(items);

    setPlaceholder(texts[Math.floor(Math.random() * texts.length)] || getRandomSuggestion());
  };

  useEffect(() => {
    refreshDynamicCopy();
  }, [suggestionIcons]);

  const handleSuggestionPress = (suggestion: string) => {
    setPrompt(suggestion);
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
        keyboardVerticalOffset={0}
      >
        {/* Background with subtle gradient */}
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
            onPress={handleProfile}
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
              name="account-circle"
              size={24}
              color={theme.colors.theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleHistory}
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
              name="bookmark-multiple"
              size={24}
              color={theme.colors.theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleThemeToggle}
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
        
        <ScrollView
          contentContainerStyle={{
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
              marginBottom: theme.spacing['4xl'],
            }}
          >
            {/* Magical Circle with Chef Hat */}
            <View
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: theme.colors.wizard.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: theme.spacing['2xl'],
                position: 'relative',
              }}
            >
              {/* Animated sparkles around the circle */}
              <View
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 20,
                }}
              >
                <MaterialCommunityIcons
                  name="star-four-points"
                  size={16}
                  color={theme.colors.wizard.accent}
                  style={{ opacity: 0.7 }}
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
                  size={12}
                  color={theme.colors.wizard.primaryLight}
                  style={{ opacity: 0.6 }}
                />
              </View>

              <View
                style={{
                  position: 'absolute',
                  top: 25,
                  left: 25,
                }}
              >
                <MaterialCommunityIcons
                  name="star-four-points"
                  size={14}
                  color={theme.colors.wizard.accent}
                  style={{ opacity: 0.5 }}
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
                fontSize: theme.typography.fontSize.displaySmall,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.theme.text,
                fontFamily: theme.typography.fontFamily.heading,
                textAlign: 'center',
                marginBottom: theme.spacing.md,
                lineHeight: theme.typography.fontSize.displaySmall * 1.2,
              }}
            >
              {heroTitle}
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
              {heroSubtitle}
            </Text>
          </View>

          {/* Enhanced Input Section */}
          <View
            style={{
              marginBottom: theme.spacing['3xl'],
              position: 'relative',
            }}
          >
            {/* Floating label */}
            {prompt.length > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -8,
                  left: theme.spacing.lg,
                  zIndex: 1,
                  backgroundColor: theme.colors.theme.background,
                  paddingHorizontal: theme.spacing.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.bodySmall,
                    color: theme.colors.wizard.primary,
                    fontWeight: theme.typography.fontWeight.medium,
                    fontFamily: theme.typography.fontFamily.body,
                  }}
                >
                  Your recipe idea
                </Text>
              </View>
            )}

            <View
              style={{
                borderRadius: theme.borderRadius['2xl'],
                borderWidth: 2,
                borderColor: prompt.length > 0 
                  ? theme.colors.wizard.primary 
                  : theme.colors.theme.border,
                backgroundColor: theme.colors.theme.surface,
                ...theme.shadows.surface,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Gradient border effect when focused */}
              {prompt.length > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: `linear-gradient(90deg, ${theme.colors.wizard.primary}, ${theme.colors.wizard.accent})`,
                  }}
                />
              )}

              <TextInput
                placeholder={placeholder || 'What sounds good today?'}
                value={prompt}
                onChangeText={(text) => {
                  setPrompt(text);
                  if (error) setError(null);
                }}
                multiline
                style={{
                  minHeight: 140,
                  fontSize: theme.typography.fontSize.bodyLarge,
                  textAlignVertical: 'top',
                  paddingTop: theme.spacing.xl,
                  paddingBottom: theme.spacing['4xl'],
                  lineHeight: theme.typography.fontSize.bodyLarge * 1.5,
                }}
                containerStyle={{ marginBottom: 0 }}
              />
              
              {/* Magic indicators */}
              <View
                style={{
                  position: 'absolute',
                  bottom: theme.spacing.lg,
                  right: theme.spacing.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <MaterialCommunityIcons
                  name="auto-fix"
                  size={24}
                  color={theme.colors.wizard.primary}
                  style={{
                    opacity: prompt ? 1 : 0.3,
                    marginRight: theme.spacing.sm,
                  }}
                />
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.bodySmall,
                    color: theme.colors.theme.textTertiary,
                    fontFamily: theme.typography.fontFamily.body,
                  }}
                >
                  {prompt.length}/500
                </Text>
              </View>
            </View>
          </View>

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

          {/* Recipe Options (non-persistent, collapsed by default) */}
          <ExpandableCard
            title="Recipe Options"
            subtitle={`${servings} servings${difficulty ? ` • ${difficulty}` : ''}`}
            icon="tune"
            defaultExpanded={false}
            compact
            style={{ marginBottom: theme.spacing.xl }}
          >
            {/* Servings selector */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.lg,
                backgroundColor: theme.colors.theme.backgroundSecondary,
                borderRadius: theme.borderRadius.xl,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
                borderWidth: 1,
                borderColor: theme.colors.theme.borderLight,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="account-group" size={18} color={theme.colors.theme.textSecondary} />
                <Text
                  style={{
                    marginLeft: theme.spacing.sm,
                    fontSize: theme.typography.fontSize.bodyLarge,
                    color: theme.colors.theme.text,
                    fontFamily: theme.typography.fontFamily.body,
                  }}
                >
                  Servings
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => setServings(prev => Math.max(1, prev - 1))}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.theme.surface,
                    borderWidth: 1,
                    borderColor: theme.colors.theme.border,
                    marginRight: theme.spacing.md,
                  }}
                >
                  <MaterialCommunityIcons name="minus" size={18} color={theme.colors.theme.text} />
                </TouchableOpacity>
                <Text
                  style={{
                    minWidth: 36,
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.titleMedium,
                    color: theme.colors.theme.text,
                    fontFamily: theme.typography.fontFamily.body,
                    fontWeight: theme.typography.fontWeight.semibold,
                  }}
                >
                  {servings}
                </Text>
                <TouchableOpacity
                  onPress={() => setServings(prev => Math.min(24, prev + 1))}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.wizard.primary + '25',
                    marginLeft: theme.spacing.md,
                  }}
                >
                  <MaterialCommunityIcons name="plus" size={18} color={theme.colors.wizard.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Difficulty selector */}
            <View
              style={{
                backgroundColor: theme.colors.theme.backgroundSecondary,
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing.sm,
                borderWidth: 1,
                borderColor: theme.colors.theme.borderLight,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.bodyLarge,
                  color: theme.colors.theme.text,
                  fontFamily: theme.typography.fontFamily.body,
                  marginBottom: theme.spacing.sm,
                  marginLeft: theme.spacing.sm,
                }}
              >
                Difficulty
              </Text>
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                {(['easy', 'medium', 'hard'] as const).map(level => {
                  const active = difficulty === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      onPress={() => setDifficulty(level)}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: theme.spacing.md,
                        borderRadius: theme.borderRadius.lg,
                        backgroundColor: active
                          ? theme.colors.wizard.primary + '25'
                          : theme.colors.theme.surface,
                        borderWidth: 1,
                        borderColor: active
                          ? theme.colors.wizard.primary
                          : theme.colors.theme.border,
                      }}
                    >
                      <MaterialCommunityIcons
                        name={level === 'easy' ? 'star-outline' : level === 'medium' ? 'star-half-full' : 'star'}
                        size={16}
                        color={active ? theme.colors.wizard.primary : theme.colors.theme.textSecondary}
                        style={{ marginRight: theme.spacing.xs }}
                      />
                      <Text
                        style={{
                          fontSize: theme.typography.fontSize.bodyMedium,
                          color: active ? theme.colors.wizard.primary : theme.colors.theme.text,
                          fontFamily: theme.typography.fontFamily.body,
                          fontWeight: active ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
                          textTransform: 'capitalize',
                        }}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ExpandableCard>

          {/* Enhanced Create Button */}
          <View style={{ marginBottom: theme.spacing['3xl'] }}>
            <Button
              variant="primary"
              size="large"
              fullWidth
              onPress={handleCreateRecipe}
              loading={isLoading}
              leftIcon="auto-fix"
              disabled={!prompt.trim()}
              style={{
                minHeight: 64,
                ...theme.shadows.wizard.glow,
              }}
            >
              {isLoading ? loadingMessage : 'Generate Recipe'}
            </Button>
          </View>

          {/* Enhanced Suggestions */}
          <View>
            <Text
              style={{
                fontSize: theme.typography.fontSize.titleLarge,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.theme.text,
                fontFamily: theme.typography.fontFamily.body,
                marginBottom: theme.spacing.lg,
                textAlign: 'center',
              }}
            >
              Or try one of these ideas
            </Text>
            
            <View
              style={{
                gap: theme.spacing.md,
              }}
            >
              {suggestionPrompts.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSuggestionPress(suggestion.text)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.colors.theme.backgroundSecondary,
                    borderRadius: theme.borderRadius.xl,
                    padding: theme.spacing.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.theme.borderLight,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: theme.colors.wizard.primary + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: theme.spacing.lg,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={suggestion.icon}
                      size={20}
                      color={theme.colors.wizard.primary}
                    />
                  </View>
                  
                  <Text
                    style={{
                      flex: 1,
                      fontSize: theme.typography.fontSize.bodyLarge,
                      color: theme.colors.theme.text,
                      fontFamily: theme.typography.fontFamily.body,
                      fontWeight: theme.typography.fontWeight.medium,
                    }}
                  >
                    {suggestion.text}
                  </Text>

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={theme.colors.theme.textTertiary}
                  />
                </TouchableOpacity>
              ))}
              <View style={{ marginTop: theme.spacing.lg }}>
                <Button
                  variant="secondary"
                  fullWidth
                  leftIcon="refresh"
                  onPress={refreshDynamicCopy}
                >
                  Refresh ideas
                </Button>
              </View>
            </View>
          </View>
        </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
