import React, { useState, useEffect } from 'react';
import { View, Text, StatusBar, TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/ThemeProvider';
import { SavedRecipeData } from '../types/api';
import { apiService } from '../services/api';
import { SavedRecipesSection } from '../components/SavedRecipesSection';
import { AllHistorySection } from '../components/AllHistorySection';

export default function HistoryScreen() {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
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

  const handleBack = () => {
    router.back();
  };

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
                  fontSize: theme.typography.fontSize.titleLarge,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.theme.text,
                  fontFamily: theme.typography.fontFamily.body,
                }}
              >
                Recipe History
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  color: theme.colors.theme.textSecondary,
                  fontFamily: theme.typography.fontFamily.body,
                  marginTop: theme.spacing.xs,
                }}
              >
                Your saved favorites and complete recipe history
              </Text>
            </View>

            {/* History decoration */}
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.colors.wizard.primary + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons
                name="history"
                size={24}
                color={theme.colors.wizard.primary}
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
        </View>
      </KeyboardAvoidingView>
    </>
  );
}