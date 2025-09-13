import React, { useState, useEffect } from 'react';
import { View, Text, StatusBar, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

  // Load saved recipes function
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

  // Load on component mount
  useEffect(() => {
    loadSavedRecipes();
  }, []);

  // Also reload whenever the screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      loadSavedRecipes();
    }, [])
  );

  const handleDeleteRecipe = async (recipeId: string) => {
    try {
      await apiService.unsaveRecipe(recipeId);
      setSavedRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
    } catch (error) {
      console.error('Error removing saved recipe:', error);
      // Could add error toast here
    }
  };

  // Loading screen
  if (isLoading) {
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
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <MaterialCommunityIcons
              name="book-open-variant"
              size={64}
              color={theme.colors.wizard.primary}
              style={{ marginBottom: 16 }}
            />
            <Text
              style={{
                fontSize: theme.typography.fontSize.headlineSmall,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.theme.text,
                marginBottom: 8,
              }}
            >
              Loading Recipe History
            </Text>
            <Text
              style={{
                fontSize: theme.typography.fontSize.bodyMedium,
                color: theme.colors.theme.textSecondary,
                textAlign: 'center',
              }}
            >
              Gathering your saved recipes...
            </Text>
          </View>
        </SafeAreaView>
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