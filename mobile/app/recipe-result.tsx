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

// Mock data factory - will be replaced by API calls
const getMockRecipeData = (userPrompt?: string): RecipeGenerationResponse => ({
  id: 'recipe-1',
  generatedAt: new Date().toISOString(),
  userPrompt: userPrompt || 'creamy chicken pasta with sundried tomatoes',
  recipe: {
    title: 'Creamy Chicken Pasta with Sun-Dried Tomatoes',
    description: 'A rich and creamy pasta dish featuring tender chicken breast, sun-dried tomatoes, fresh basil, and a luxurious cream sauce with parmesan and mozzarella cheese.',
    instructions: [
      'Bring a large pot of salted water to boil. Cook penne pasta according to package directions until al dente. Reserve 1 cup pasta water before draining.',
      'Season chicken breast with salt, pepper, and Italian seasoning. Heat 1 tbsp olive oil in a large skillet over medium-high heat.',
      'Cook chicken breast for 6-7 minutes per side until golden brown and cooked through (internal temp 165°F). Remove and let rest 5 minutes, then slice.',
      'In the same skillet, heat remaining olive oil. Add diced onion and cook for 3-4 minutes until softened. Add minced garlic and cook 1 minute more.',
      'Add sun-dried tomatoes and cook for 2 minutes. Pour in heavy cream and bring to a gentle simmer.',
      'Add grated parmesan cheese and mozzarella, stirring until melted and smooth. Season with salt and pepper to taste.',
      'Add cooked pasta and sliced chicken to the sauce. Toss to combine, adding pasta water as needed for consistency.',
      'Remove from heat and stir in fresh basil leaves. Serve immediately with additional parmesan cheese if desired.'
    ],
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    difficulty: 'medium',
    tips: [
      'Don\'t overcook the chicken - use a meat thermometer to ensure it reaches exactly 165°F for juicy results.',
      'Save some pasta water! The starchy water helps bind the sauce to the pasta perfectly.',
      'Fresh basil makes a huge difference - add it at the very end to preserve its bright flavor.',
      'For extra richness, add a splash of white wine when cooking the garlic and onions.'
    ]
  },
  ingredients: [
    // Produce
    { name: 'Roma tomatoes', amount: '4', unit: 'large', category: 'produce' },
    { name: 'Fresh basil', amount: '1', unit: 'bunch', category: 'produce' },
    { name: 'Garlic', amount: '3', unit: 'cloves', category: 'produce' },
    { name: 'Yellow onion', amount: '1', unit: 'medium', category: 'produce' },
    
    // Butchery
    { name: 'Chicken breast', amount: '1', unit: 'lb', category: 'butchery' },
    
    // Chilled
    { name: 'Heavy cream', amount: '1', unit: 'cup', category: 'chilled' },
    { name: 'Parmesan cheese', amount: '1', unit: 'cup', category: 'chilled' },
    { name: 'Mozzarella cheese', amount: '8', unit: 'oz', category: 'chilled' },
    
    // Dry goods
    { name: 'Penne pasta', amount: '1', unit: 'lb', category: 'dry-goods' },
    { name: 'Sun-dried tomatoes', amount: '1/2', unit: 'cup', category: 'dry-goods' },
    
    // Pantry
    { name: 'Olive oil', amount: '2', unit: 'tbsp', category: 'pantry' },
    { name: 'Salt', amount: '1', unit: 'tsp', category: 'pantry' },
    { name: 'Black pepper', amount: '1/2', unit: 'tsp', category: 'pantry' },
    { name: 'Italian seasoning', amount: '1', unit: 'tsp', category: 'pantry' },
  ]
});

export default function RecipeResultScreen() {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [recipeData, setRecipeData] = useState<RecipeGenerationResponse | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get recipe data from route params or load from API
  useEffect(() => {
    const loadRecipeData = async () => {
      try {
        // Check if recipe data was passed via navigation params
        if (params.recipeData && typeof params.recipeData === 'string') {
          const parsedData = JSON.parse(params.recipeData);
          setRecipeData(parsedData);
        } else if (params.recipeId) {
          // TODO: Load recipe from API using recipeId
          // const response = await api.getRecipe(params.recipeId as string);
          // setRecipeData(response);
          
          // For now, use mock data
          const mockData = getMockRecipeData(params.userPrompt as string);
          setRecipeData(mockData);
        } else {
          // Default to mock data for development
          const mockData = getMockRecipeData(params.userPrompt as string);
          setRecipeData(mockData);
        }
      } catch (error) {
        console.error('Error loading recipe data:', error);
        // Fallback to mock data
        const mockData = getMockRecipeData(params.userPrompt as string);
        setRecipeData(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipeData();
  }, [params.recipeData, params.recipeId, params.userPrompt]);

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
            <Text
              style={{
                fontSize: theme.typography.fontSize.bodyMedium,
                color: theme.colors.theme.textSecondary,
                fontFamily: theme.typography.fontFamily.body,
              }}
            >
              Ready in {(recipeData.recipe.prepTime || 0) + (recipeData.recipe.cookTime || 0)} minutes
            </Text>
          </View>

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