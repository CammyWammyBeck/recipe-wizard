import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '../constants/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IngredientsSection, Ingredient } from '../components/IngredientsSection';
import { RecipeSection, Recipe } from '../components/RecipeSection';
import { ExpandableCard } from '../components/ExpandableCard';
import { TextInput } from '../components/TextInput';
import { Button } from '../components/Button';
import { RecipeGenerationResponse } from '../types/api';
import { apiService } from '../services/api';
import { PreferencesService } from '../services/preferences';
import { getRandomLoadingButtonText } from '../constants/copy';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { PremiumFeature } from '../components/PremiumFeature';
import Constants from 'expo-constants';


export default function RecipeResultScreen() {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isOnline } = useNetworkStatus();

  // Check premium status
  const isPremium = Constants.expoConfig?.extra?.isPremium ?? false;

  const [recipeData, setRecipeData] = useState<RecipeGenerationResponse | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [modificationText, setModificationText] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);

  // Shopping list state
  const [isAddingToShoppingList, setIsAddingToShoppingList] = useState(false);
  const [addToShoppingListText, setAddToShoppingListText] = useState('Add to Shopping List');
  
  // Progress visualization state for modification
  const [modifyCurrentAttempt, setModifyCurrentAttempt] = useState(1);
  const [modifySegmentProgress, setModifySegmentProgress] = useState(0);
  const [modifyCurrentButtonText, setModifyCurrentButtonText] = useState('Update Recipe');
  const [modifyAttemptStartTime, setModifyAttemptStartTime] = useState<number | null>(null);
  const modifyProgressAnimation = useRef(new Animated.Value(0)).current;

  // Load user preferences for category order
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await PreferencesService.loadPreferences();
        setCategoryOrder(prefs.groceryCategories);
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  // Get recipe data from route params or load from API
  useEffect(() => {
    const loadRecipeData = async () => {
      try {
        // Check if recipe data was passed via navigation params
        if (params.recipeData && typeof params.recipeData === 'string') {
          const parsedData = JSON.parse(params.recipeData);
          setRecipeData(parsedData);
          setError(null);
        } else if (params.recipeId) {
          // Load recipe from API using recipeId
          const response = await apiService.getRecipe(params.recipeId as string);
          setRecipeData(response);
          setError(null);
        } else {
          // No valid recipe data - this shouldn't happen in normal flow
          console.warn('Recipe result screen accessed without valid data');
          router.back();
        }
      } catch (error) {
        console.error('Error loading recipe data:', error);
        // Navigate back to prompt with error - shouldn't normally happen
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipeData();
  }, [params.recipeData, params.recipeId]);

  // Convert API ingredients to UI ingredients with IDs and checked state
  useEffect(() => {
    if (recipeData?.ingredients) {
      const ingredientsWithState = recipeData.ingredients.map((ingredient, index) => ({
        ...ingredient,
        id: ingredient.id || `ingredient-${index}`,
        checked: false,
      }));
      setIngredients(ingredientsWithState);
    }
  }, [recipeData]);

  // Check if recipe is saved
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (recipeData?.id) {
        try {
          const saved = await apiService.isRecipeSaved(recipeData.id);
          setIsSaved(saved);
        } catch (error) {
          console.error('Error checking saved status:', error);
        }
      }
    };
    
    checkSavedStatus();
  }, [recipeData?.id]);

  // Modification progress visualization logic
  
  // Cycle button text every 3 seconds during modification
  useEffect(() => {
    if (!isModifying) return;

    const interval = setInterval(() => {
      setModifyCurrentButtonText(getRandomLoadingButtonText());
    }, 3000);

    return () => clearInterval(interval);
  }, [isModifying]);

  // Progress animation within current segment for modification
  useEffect(() => {
    if (!isModifying || !modifyAttemptStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - modifyAttemptStartTime;
      const maxTime = 20000; // 20 seconds max per attempt
      const progress = Math.min(elapsed / maxTime, 1);
      
      setModifySegmentProgress(progress);
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [isModifying, modifyAttemptStartTime]);

  // Reset modification progress state when loading starts/stops
  useEffect(() => {
    if (isModifying) {
      setModifyCurrentAttempt(1);
      setModifySegmentProgress(0);
      setModifyAttemptStartTime(Date.now());
      setModifyCurrentButtonText(getRandomLoadingButtonText());
    } else {
      setModifyCurrentAttempt(1);
      setModifySegmentProgress(0);
      setModifyAttemptStartTime(null);
      setModifyCurrentButtonText('Update Recipe');
    }
  }, [isModifying]);

  // Calculate total modification progress and animate
  const updateModifyProgressAnimation = () => {
    const completedSegments = modifyCurrentAttempt - 1;
    const currentSegmentProgress = modifySegmentProgress / 3;
    const totalProgress = (completedSegments / 3) + currentSegmentProgress;
    
    Animated.timing(modifyProgressAnimation, {
      toValue: totalProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Update modification animation when progress changes
  useEffect(() => {
    if (isModifying) {
      updateModifyProgressAnimation();
    } else {
      modifyProgressAnimation.setValue(0);
    }
  }, [modifyCurrentAttempt, modifySegmentProgress, isModifying]);

  // Utility function to advance to next modification attempt
  const advanceToNextModifyAttempt = () => {
    setModifyCurrentAttempt(prev => Math.min(prev + 1, 3));
    setModifySegmentProgress(0);
    setModifyAttemptStartTime(Date.now());
  };

  const handleIngredientToggle = (ingredientId: string, checked: boolean) => {
    setIngredients(prev => 
      prev.map(ingredient => 
        ingredient.id === ingredientId 
          ? { ...ingredient, checked }
          : ingredient
      )
    );
  };

  const handleBack = () => {
    router.back();
  };

  const handleSaveToggle = async () => {
    if (!recipeData) return;
    
    try {
      if (isSaved) {
        // Remove from saved recipes
        await apiService.unsaveRecipe(recipeData.id);
        setIsSaved(false);
      } else {
        // Save recipe
        await apiService.saveRecipe(recipeData);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Failed to toggle recipe save:', error);
      // Could add error toast here
    }
  };

  const handleAddToShoppingList = async () => {
    if (!recipeData) return;

    // Check network connectivity
    if (!isOnline) {
      Alert.alert(
        'No Internet Connection',
        'Please connect to the internet to add recipes to your shopping list.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsAddingToShoppingList(true);
      setAddToShoppingListText('Adding...');

      await apiService.addRecipeToShoppingList(recipeData.id);

      // Show success state
      setAddToShoppingListText('Added to Shopping List ✓');

      // Reset after 5 seconds
      setTimeout(() => {
        setAddToShoppingListText('Add to Shopping List');
        setIsAddingToShoppingList(false);
      }, 5000);

    } catch (error) {
      console.error('Failed to add to shopping list:', error);
      setIsAddingToShoppingList(false);
      setAddToShoppingListText('Add to Shopping List');

      Alert.alert(
        'Error',
        'Failed to add recipe to shopping list. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleModifyRecipe = async () => {
    if (!recipeData) return;

    if (!modificationText.trim()) {
      setModifyCurrentButtonText('Please enter modification request');
      setTimeout(() => setModifyCurrentButtonText('Update Recipe'), 3000);
      return;
    }

    try {
      setIsModifying(true);

      // Call the recipe modification API with attempt tracking
      const modifiedRecipe = await apiService.modifyRecipe(recipeData.id, modificationText.trim());

      // Success animation - quickly fill all remaining segments
      setModifyCurrentAttempt(3);
      setModifySegmentProgress(1);

      // Wait for success animation, then complete
      setTimeout(() => {
        setIsModifying(false);

        // Update the current recipe data with the modified version
        setRecipeData(modifiedRecipe);

        // Clear the modification text
        setModificationText('');

        // Show success message
        Alert.alert('Recipe Updated', 'Your recipe has been successfully modified!');
      }, 300); // 0.3 second success animation

    } catch (error) {
      console.error('Failed to modify recipe:', error);
      setIsModifying(false);

      // Show error in button for retry
      if (error instanceof Error) {
        setModifyCurrentButtonText('Something went wrong. Tap to retry.');
      } else {
        setModifyCurrentButtonText('Something went wrong. Tap to retry.');
      }

      // Reset progress to show error state
      setModifyCurrentAttempt(1);
      setModifySegmentProgress(0);
    }
  };

  // Loading state
  if (isLoading || !recipeData) {
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
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.wizard.primary} />
          <Text
            style={{
              marginTop: theme.spacing.lg,
              fontSize: theme.typography.fontSize.bodyLarge,
              color: theme.colors.theme.textSecondary,
              fontFamily: theme.typography.fontFamily.body,
            }}
          >
            Loading your recipe...
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.theme.background}
        translucent
      />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: theme.colors.theme.background,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
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
                marginRight: theme.spacing.lg,
              }}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={theme.colors.theme.textSecondary}
              />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              {Boolean(params.fromHistory || params.fromSavedRecipes) && (
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.bodySmall,
                    color: theme.colors.wizard.primary,
                    fontFamily: theme.typography.fontFamily.body,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  {params.fromSavedRecipes ? 'From Saved Recipes' : 'From History'}
                </Text>
              )}
              <Text
                style={{
                  fontSize: theme.typography.fontSize.titleMedium,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.theme.text,
                  fontFamily: theme.typography.fontFamily.body,
                  marginBottom: theme.spacing.xs,
                  lineHeight: theme.typography.fontSize.titleMedium * 1.2,
                }}
                numberOfLines={2}
              >
                {recipeData.recipe.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.bodyMedium,
                    color: theme.colors.theme.textSecondary,
                    fontFamily: theme.typography.fontFamily.body,
                  }}
                >
                  Ready in {(recipeData.recipe.prepTime || 0) + (recipeData.recipe.cookTime || 0)} minutes
                </Text>
                {Boolean(recipeData.retryCount && recipeData.retryCount > 0) && (
                  <View style={{
                    marginLeft: theme.spacing.md,
                    backgroundColor: theme.colors.wizard.primaryLight + '20',
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: theme.spacing.xs,
                    borderRadius: theme.borderRadius.full,
                  }}>
                    <Text style={{
                      fontSize: theme.typography.fontSize.bodySmall,
                      color: theme.colors.wizard.primary,
                      fontFamily: theme.typography.fontFamily.body,
                    }}>
                      Perfected ✨
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Save/Star Button */}
            <TouchableOpacity
              onPress={handleSaveToggle}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isSaved 
                  ? theme.colors.wizard.primary + '20' 
                  : theme.colors.theme.backgroundSecondary,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: theme.spacing.md,
              }}
            >
              <MaterialCommunityIcons
                name={isSaved ? "star" : "star-outline"}
                size={24}
                color={isSaved ? theme.colors.wizard.primary : theme.colors.theme.textSecondary}
              />
            </TouchableOpacity>

            {/* Sparkle decoration */}
            <View
              style={{
                position: 'relative',
                marginLeft: theme.spacing.md,
              }}
            >
              <MaterialCommunityIcons
                name="star-four-points"
                size={16}
                color={theme.colors.wizard.accent}
                style={{ opacity: 0.7 }}
              />
            </View>
          </View>

          {/* Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.xl,
              paddingBottom: insets.bottom + theme.spacing.xl,
              gap: theme.spacing.xl,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          {/* Ingredients Section */}
          <IngredientsSection
            ingredients={ingredients}
            onIngredientToggle={handleIngredientToggle}
            categoryOrder={categoryOrder}
            onAddToShoppingList={handleAddToShoppingList}
            addToShoppingListLoading={isAddingToShoppingList}
            addToShoppingListText={addToShoppingListText}
          />

          {/* Recipe Section */}
          <RecipeSection recipe={recipeData.recipe} />

          {/* Recipe Modification Section */}
          <PremiumFeature
            featureName="Recipe Modification"
            description="Customize any recipe to your exact preferences. Make it vegetarian, adjust spice levels, substitute ingredients, or modify cooking methods with AI-powered precision."
            mode="overlay"
          >
            <ExpandableCard
              title="Modify Recipe"
              subtitle="Tell me what you'd like to change"
              icon="pencil"
              defaultExpanded={false}
            >
            <Text
              style={{
                fontSize: theme.typography.fontSize.bodyMedium,
                color: theme.colors.theme.textSecondary,
                fontFamily: theme.typography.fontFamily.body,
                marginBottom: theme.spacing.lg,
                lineHeight: theme.typography.fontSize.bodyMedium * 1.4,
              }}
            >
              I'll adjust the recipe based on your request while keeping everything else the same.
            </Text>

            <TextInput
              placeholder="e.g., make it vegetarian, reduce salt, add more spice, use chicken instead of beef..."
              value={modificationText}
              onChangeText={(text) => {
                setModificationText(text);
                
                // Reset error state when user starts editing
                if (modifyCurrentButtonText.includes('failed') || modifyCurrentButtonText.includes('retry')) {
                  setModifyCurrentButtonText('Update Recipe');
                }
              }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                height: 100,
                paddingTop: theme.spacing.md,
              }}
            />

            <View style={{ marginTop: theme.spacing.lg }} />

            {/* Enhanced Modify Button with Progress Bar */}
            <TouchableOpacity
              onPress={handleModifyRecipe}
              disabled={(!modificationText.trim() && modifyCurrentButtonText === 'Update Recipe') || 
                       (isModifying && !modifyCurrentButtonText.includes('Tap to retry'))}
              style={{
                minHeight: 64,
                borderRadius: theme.borderRadius['2xl'],
                backgroundColor: !modificationText.trim() 
                  ? theme.colors.theme.border 
                  : modifyCurrentButtonText.includes('failed') || modifyCurrentButtonText.includes('retry')
                    ? theme.colors.theme.surface // Neutral background for error state
                    : isModifying 
                      ? theme.colors.wizard.primary + '30' // Lighter background when loading
                      : theme.colors.wizard.primary,
                borderWidth: modifyCurrentButtonText.includes('failed') || modifyCurrentButtonText.includes('retry') ? 2 : 0,
                borderColor: modifyCurrentButtonText.includes('failed') || modifyCurrentButtonText.includes('retry') ? '#f59e0b' : 'transparent',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              
              {/* Progress Bar Fill */}
              {isModifying && (
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: modifyProgressAnimation.interpolate({
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
                {!isModifying && (
                  <MaterialCommunityIcons
                    name={modifyCurrentButtonText.includes('failed') || modifyCurrentButtonText.includes('retry')
                      ? "refresh"
                      : "magic-staff"}
                    size={24}
                    color={!modificationText.trim() 
                      ? theme.colors.theme.textTertiary 
                      : modifyCurrentButtonText.includes('failed') || modifyCurrentButtonText.includes('retry')
                        ? '#f59e0b'
                        : 'white'}
                    style={{ marginRight: theme.spacing.md }}
                  />
                )}
                
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.titleMedium,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: !modificationText.trim() 
                      ? theme.colors.theme.textTertiary 
                      : modifyCurrentButtonText.includes('failed') || modifyCurrentButtonText.includes('retry')
                        ? '#f59e0b'
                        : 'white',
                    fontFamily: theme.typography.fontFamily.body,
                    textAlign: 'center',
                  }}
                >
                  {modifyCurrentButtonText}
                </Text>
              </View>
            </TouchableOpacity>
            </ExpandableCard>
          </PremiumFeature>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}