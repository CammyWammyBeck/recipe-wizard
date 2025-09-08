import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '../constants/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IngredientsSection, Ingredient } from '../components/IngredientsSection';
import { RecipeSection, Recipe } from '../components/RecipeSection';
import { RecipeGenerationResponse } from '../types/api';
import { apiService } from '../services/api';


export default function RecipeResultScreen() {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [recipeData, setRecipeData] = useState<RecipeGenerationResponse | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

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
            {params.fromHistory && (
              <Text
                style={{
                  fontSize: theme.typography.fontSize.bodySmall,
                  color: theme.colors.wizard.primary,
                  fontFamily: theme.typography.fontFamily.body,
                  marginBottom: theme.spacing.xs,
                }}
              >
                From Saved Recipes
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
              {recipeData.retryCount && recipeData.retryCount > 0 && (
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
        >
          {/* Ingredients Section */}
          <IngredientsSection 
            ingredients={ingredients}
            onIngredientToggle={handleIngredientToggle}
          />

          {/* Recipe Section */}
          <RecipeSection recipe={recipeData.recipe} />
        </ScrollView>
      </View>
    </>
  );
}