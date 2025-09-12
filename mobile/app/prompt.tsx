import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, Platform, KeyboardAvoidingView, Animated } from 'react-native';
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
  getRandomLoadingButtonText,
} from '../constants/copy';

export default function PromptScreen() {
  const { theme, isDark, setThemeMode, themeMode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [servings, setServings] = useState<number>(4);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | undefined>(undefined);
  
  // Progress visualization state
  const [currentAttempt, setCurrentAttempt] = useState(1); // 1, 2, or 3
  const [segmentProgress, setSegmentProgress] = useState(0); // 0-1 progress within current segment  
  const [currentButtonText, setCurrentButtonText] = useState('Generate Recipe');
  const [attemptStartTime, setAttemptStartTime] = useState<number | null>(null);
  const [isInErrorState, setIsInErrorState] = useState(false);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const textCyclingInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize per-recipe overrides from saved preferences
  useEffect(() => {
    (async () => {
      const prefs: UserPreferences = await PreferencesService.loadPreferences();
      setServings(prefs.defaultServings || 4);
      setDifficulty(prefs.preferredDifficulty);
    })();
  }, []);

  // Cycle button text every 3 seconds during loading
  useEffect(() => {
    // Clear any existing interval
    if (textCyclingInterval.current) {
      clearInterval(textCyclingInterval.current);
      textCyclingInterval.current = null;
    }

    if (!isLoading || isInErrorState) return;

    textCyclingInterval.current = setInterval(() => {
      // Only cycle text if still loading and not in error state
      if (isLoading && !isInErrorState) {
        setCurrentButtonText(getRandomLoadingButtonText());
      }
    }, 3000);

    return () => {
      if (textCyclingInterval.current) {
        clearInterval(textCyclingInterval.current);
        textCyclingInterval.current = null;
      }
    };
  }, [isLoading, isInErrorState]);

  // Progress animation within current segment
  useEffect(() => {
    if (!isLoading || !attemptStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - attemptStartTime;
      const maxTime = 20000; // 20 seconds max per attempt
      const progress = Math.min(elapsed / maxTime, 1);
      
      setSegmentProgress(progress);
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [isLoading, attemptStartTime]);

  // Reset progress state when loading starts/stops
  useEffect(() => {
    if (isLoading) {
      setCurrentAttempt(1);
      setSegmentProgress(0);
      setAttemptStartTime(Date.now());
      setCurrentButtonText(getRandomLoadingButtonText());
      setIsInErrorState(false); // Clear error state when starting new request
    } else {
      setCurrentAttempt(1);
      setSegmentProgress(0);
      setAttemptStartTime(null);
      // Don't automatically reset button text - let success/error handlers do it
    }
  }, [isLoading]);

  // Utility function to advance to next attempt
  const advanceToNextAttempt = () => {
    setCurrentAttempt(prev => Math.min(prev + 1, 3));
    setSegmentProgress(0);
    setAttemptStartTime(Date.now());
  };

  // Calculate total progress across all segments and animate
  const updateProgressAnimation = () => {
    const completedSegments = currentAttempt - 1;
    const currentSegmentProgress = segmentProgress / 3; // Each segment is 1/3 of total
    const totalProgress = (completedSegments / 3) + currentSegmentProgress;
    
    Animated.timing(progressAnimation, {
      toValue: totalProgress,
      duration: 300, // 0.3 second smooth transition
      useNativeDriver: false, // Width animations require false
    }).start();
  };

  // Update animation when progress changes
  useEffect(() => {
    if (isLoading) {
      updateProgressAnimation();
    } else {
      progressAnimation.setValue(0);
    }
  }, [currentAttempt, segmentProgress, isLoading]);

  const handleCreateRecipe = async () => {
    if (!prompt.trim()) {
      setCurrentButtonText('Please enter a recipe description');
      setTimeout(() => setCurrentButtonText('Generate Recipe'), 3000);
      return;
    }

    setIsLoading(true);
    
    try {
      // TEMPORARY: Force API failure for testing - remove this!
      if (prompt.toLowerCase().includes('test fail')) {
        console.log('Forcing API failure for testing');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        throw new Error('Something went wrong. Tap to retry.');
      }

      // Start async job
      console.log('Creating recipe with prompt:', prompt);
      const jobResponse = await apiService.startRecipeGeneration({
        prompt,
        overrides: {
          defaultServings: servings,
          preferredDifficulty: difficulty,
        },
      });
      
      console.log('🚀 Job started:', jobResponse.job_id);
      
      // Poll job until completion with attempt tracking
      const recipeData = await apiService.pollJobUntilComplete(
        jobResponse.job_id,
        (status) => {
          // Track attempts based on retry_count in status
          if (status.retry_count !== undefined) {
            const newAttempt = Math.min(status.retry_count + 1, 3);
            if (newAttempt > currentAttempt) {
              advanceToNextAttempt();
            }
          }
        }
      );
      
      // Success animation - quickly fill all remaining segments
      setCurrentAttempt(3);
      setSegmentProgress(1);
      
      // Wait for success animation, then navigate
      setTimeout(() => {
        setIsLoading(false);
        setCurrentButtonText('Generate Recipe'); // Reset on success
        
        // Navigate with the recipe data
        router.push({
          pathname: '/recipe-result',
          params: { 
            userPrompt: prompt,
            recipeData: JSON.stringify(recipeData),
            timestamp: Date.now().toString()
          }
        });
      }, 300); // 0.3 second success animation
      
    } catch (error) {
      console.error('Recipe generation error:', error);
      
      // IMMEDIATELY stop text cycling to prevent race condition
      if (textCyclingInterval.current) {
        clearInterval(textCyclingInterval.current);
        textCyclingInterval.current = null;
      }
      
      setIsLoading(false);
      setIsInErrorState(true);
      
      // Show error in button for retry
      if (error instanceof Error) {
        setCurrentButtonText(error.message);
      } else {
        setCurrentButtonText('Something went wrong. Tap to retry.');
      }
      
      // Reset progress to show error state
      setCurrentAttempt(1);
      setSegmentProgress(0);
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
            paddingBottom: Math.max(insets.bottom, theme.spacing.xl),
          }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentInsetAdjustmentBehavior="automatic"
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
                  
                  // Reset error state when user starts editing
                  if (isInErrorState) {
                    setIsInErrorState(false);
                    setCurrentButtonText('Generate Recipe');
                  }
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

          {/* Enhanced Create Button with Progress Bar */}
          <View style={{ marginBottom: theme.spacing['3xl'] }}>
            <TouchableOpacity
              onPress={handleCreateRecipe}
              disabled={(!prompt.trim() && currentButtonText === 'Generate Recipe') || 
                       (isLoading && !currentButtonText.includes('Tap to retry'))}
              style={{
                minHeight: 64,
                borderRadius: theme.borderRadius['2xl'],
                backgroundColor: !prompt.trim() 
                  ? theme.colors.theme.border 
                  : currentButtonText.includes('failed') || currentButtonText.includes('retry')
                    ? theme.colors.theme.surface // Neutral background for error state
                    : isLoading 
                      ? theme.colors.wizard.primary + '30' // Lighter background when loading
                      : theme.colors.wizard.primary,
                borderWidth: currentButtonText.includes('failed') || currentButtonText.includes('retry') ? 2 : 0,
                borderColor: currentButtonText.includes('failed') || currentButtonText.includes('retry') ? '#f59e0b' : 'transparent', // Orange border instead of red
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              
              {/* Progress Bar Fill */}
              {isLoading && (
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: theme.colors.wizard.primary,
                  }}
                />
              )}
              
              {/* Button Content */}
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: theme.spacing.xl,
                  paddingVertical: theme.spacing.lg,
                }}
              >
                {!isLoading && (
                  <MaterialCommunityIcons
                    name={currentButtonText.includes('failed') || currentButtonText.includes('retry') 
                      ? "refresh" 
                      : "auto-fix"}
                    size={24}
                    color={!prompt.trim() 
                      ? theme.colors.theme.textTertiary 
                      : currentButtonText.includes('failed') || currentButtonText.includes('retry')
                        ? '#f59e0b' // Orange icon for retry
                        : 'white'}
                    style={{ marginRight: theme.spacing.md }}
                  />
                )}
                
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.titleMedium,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: !prompt.trim() 
                      ? theme.colors.theme.textTertiary 
                      : currentButtonText.includes('failed') || currentButtonText.includes('retry')
                        ? '#f59e0b' // Orange text for retry state
                        : 'white',
                    fontFamily: theme.typography.fontFamily.body,
                    textAlign: 'center',
                  }}
                >
                  {currentButtonText}
                </Text>
              </View>
            </TouchableOpacity>
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
    </>
  );
}
