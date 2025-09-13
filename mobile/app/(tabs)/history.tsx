import React, { useState, useEffect } from 'react';
import { View, Text, StatusBar, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../constants/ThemeProvider';
import { SavedRecipeData } from '../../types/api';
import { apiService } from '../../services/api';
import { SavedRecipesSection } from '../../components/SavedRecipesSection';
import { AllHistorySection } from '../../components/AllHistorySection';
import { HeaderComponent } from '../../components/HeaderComponent';

export default function HistoryScreen() {
  const { theme, isDark } = useAppTheme();
  const router = useRouter();

  const [savedRecipes, setSavedRecipes] = useState<SavedRecipeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load saved recipes
  useEffect(() => {
    const loadSavedRecipes = async () => {
      try {
        setIsLoading(true);
        const recipes = await apiService.getSavedRecipes();
        setSavedRecipes(recipes || []);
        setError(null);
      } catch (error) {
        console.error('Error loading saved recipes:', error);
        setError('Failed to load saved recipes');
        setSavedRecipes([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedRecipes();
  }, []);

  const handleDeleteRecipe = async (recipeId: string) => {
    try {
      await apiService.unsaveRecipe(recipeId);
      setSavedRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
    } catch (error) {
      console.error('Error removing saved recipe:', error);
      // Could add error toast here
    }
  };

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.theme.background}
        translucent
      />

      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.colors.theme.background,
        }}
        edges={['top']}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          <HeaderComponent
            title="Recipe History"
            subtitle="Your saved recipes and cooking history"
          />

          {/* Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.xl,
              paddingTop: theme.spacing.xl,
              paddingBottom: theme.spacing.xl,
              gap: theme.spacing.xl,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Saved Recipes Section */}
            <SavedRecipesSection
              savedRecipes={savedRecipes}
              onDeleteRecipe={handleDeleteRecipe}
              isLoading={isLoading}
              error={error}
            />

            {/* All History Section */}
            <AllHistorySection />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}