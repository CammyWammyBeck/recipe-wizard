import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/ThemeProvider';
import { SavedRecipeData } from '../types/api';
import { apiService } from '../services/api';

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

  const handleRecipePress = (recipe: SavedRecipeData) => {
    // Navigate to recipe result screen with saved recipe data
    router.push({
      pathname: '/recipe-result',
      params: {
        recipeData: JSON.stringify(recipe),
        fromHistory: 'true'
      }
    });
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Unknown date';
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
                Saved Recipes
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  color: theme.colors.theme.textSecondary,
                  fontFamily: theme.typography.fontFamily.body,
                  marginTop: theme.spacing.xs,
                }}
              >
                {savedRecipes.length} {savedRecipes.length === 1 ? 'recipe' : 'recipes'} saved
              </Text>
            </View>

            {/* Star decoration */}
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
                name="star"
                size={24}
                color={theme.colors.wizard.primary}
              />
            </View>
          </View>

          <KeyboardAwareScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.xl,
              paddingBottom: insets.bottom + theme.spacing.xl,
            }}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={{ 
                flex: 1, 
                alignItems: 'center', 
                justifyContent: 'center',
                paddingTop: theme.spacing['4xl']
              }}>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyLarge,
                  color: theme.colors.theme.textSecondary,
                  fontFamily: theme.typography.fontFamily.body,
                }}>
                  Loading saved recipes...
                </Text>
              </View>
            ) : error ? (
              <View style={{ 
                flex: 1, 
                alignItems: 'center', 
                justifyContent: 'center',
                paddingTop: theme.spacing['4xl']
              }}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={48}
                  color={theme.colors.theme.textSecondary}
                  style={{ marginBottom: theme.spacing.lg }}
                />
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyLarge,
                  color: theme.colors.theme.text,
                  fontFamily: theme.typography.fontFamily.body,
                  textAlign: 'center',
                }}>
                  {error}
                </Text>
              </View>
            ) : savedRecipes.length === 0 ? (
              <View style={{ 
                flex: 1, 
                alignItems: 'center', 
                justifyContent: 'center',
                paddingTop: theme.spacing['4xl']
              }}>
                <MaterialCommunityIcons
                  name="bookmark-outline"
                  size={64}
                  color={theme.colors.theme.textSecondary}
                  style={{ marginBottom: theme.spacing.lg }}
                />
                <Text style={{
                  fontSize: theme.typography.fontSize.titleMedium,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.theme.text,
                  fontFamily: theme.typography.fontFamily.body,
                  marginBottom: theme.spacing.sm,
                }}>
                  No Saved Recipes Yet
                </Text>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  color: theme.colors.theme.textSecondary,
                  fontFamily: theme.typography.fontFamily.body,
                  textAlign: 'center',
                  lineHeight: theme.typography.fontSize.bodyMedium * 1.4,
                }}>
                  Start generating recipes and tap the star{'\n'}to save your favorites!
                </Text>
              </View>
            ) : (
              <View style={{ gap: theme.spacing.lg }}>
                {savedRecipes.map((recipe) => (
                  <TouchableOpacity
                    key={recipe.id}
                    onPress={() => handleRecipePress(recipe)}
                    style={{
                      backgroundColor: theme.colors.theme.surface,
                      borderRadius: theme.borderRadius.xl,
                      padding: theme.spacing.lg,
                      ...theme.shadows.surface,
                    }}
                  >
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'flex-start',
                      marginBottom: theme.spacing.sm 
                    }}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: theme.typography.fontSize.titleSmall,
                            fontWeight: theme.typography.fontWeight.semibold,
                            color: theme.colors.theme.text,
                            fontFamily: theme.typography.fontFamily.body,
                            marginBottom: theme.spacing.xs,
                          }}
                          numberOfLines={2}
                        >
                          {recipe.recipe.title}
                        </Text>
                        
                        {recipe.recipe.description && (
                          <Text
                            style={{
                              fontSize: theme.typography.fontSize.bodyMedium,
                              color: theme.colors.theme.textSecondary,
                              fontFamily: theme.typography.fontFamily.body,
                              marginBottom: theme.spacing.sm,
                            }}
                            numberOfLines={2}
                          >
                            {recipe.recipe.description}
                          </Text>
                        )}

                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center',
                          gap: theme.spacing.md 
                        }}>
                          <Text
                            style={{
                              fontSize: theme.typography.fontSize.bodySmall,
                              color: theme.colors.theme.textSecondary,
                              fontFamily: theme.typography.fontFamily.body,
                            }}
                          >
                            Saved {formatDate(recipe.savedAt)}
                          </Text>
                          
                          <View style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center',
                            gap: theme.spacing.xs 
                          }}>
                            <MaterialCommunityIcons
                              name="clock-outline"
                              size={14}
                              color={theme.colors.theme.textSecondary}
                            />
                            <Text
                              style={{
                                fontSize: theme.typography.fontSize.bodySmall,
                                color: theme.colors.theme.textSecondary,
                                fontFamily: theme.typography.fontFamily.body,
                              }}
                            >
                              {(recipe.recipe.prepTime || 0) + (recipe.recipe.cookTime || 0)} min
                            </Text>
                          </View>

                          <View style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center',
                            gap: theme.spacing.xs 
                          }}>
                            <MaterialCommunityIcons
                              name="silverware-fork-knife"
                              size={14}
                              color={theme.colors.theme.textSecondary}
                            />
                            <Text
                              style={{
                                fontSize: theme.typography.fontSize.bodySmall,
                                color: theme.colors.theme.textSecondary,
                                fontFamily: theme.typography.fontFamily.body,
                              }}
                            >
                              {recipe.recipe.servings} servings
                            </Text>
                          </View>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleDeleteRecipe(recipe.id)}
                        style={{
                          padding: theme.spacing.sm,
                          marginLeft: theme.spacing.sm,
                        }}
                      >
                        <MaterialCommunityIcons
                          name="delete-outline"
                          size={20}
                          color={theme.colors.theme.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </KeyboardAwareScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}