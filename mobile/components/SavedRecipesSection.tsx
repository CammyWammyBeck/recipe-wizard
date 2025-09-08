import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '../constants/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ExpandableCard } from './ExpandableCard';
import { SavedRecipeData } from '../types/api';

interface SavedRecipesSectionProps {
  savedRecipes: SavedRecipeData[];
  onDeleteRecipe: (recipeId: string) => void;
  isLoading?: boolean;
  error?: string | null;
  style?: ViewStyle;
}

export function SavedRecipesSection({
  savedRecipes,
  onDeleteRecipe,
  isLoading = false,
  error = null,
  style,
}: SavedRecipesSectionProps) {
  const { theme } = useAppTheme();
  const router = useRouter();

  const handleRecipePress = (recipe: SavedRecipeData) => {
    router.push({
      pathname: '/recipe-result',
      params: {
        recipeData: JSON.stringify(recipe),
        fromSavedRecipes: 'true'
      }
    });
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

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={{ 
          alignItems: 'center', 
          justifyContent: 'center',
          paddingVertical: theme.spacing['2xl']
        }}>
          <Text style={{
            fontSize: theme.typography.fontSize.bodyMedium,
            color: theme.colors.theme.textSecondary,
            fontFamily: theme.typography.fontFamily.body,
          }}>
            Loading saved recipes...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={{ 
          alignItems: 'center', 
          justifyContent: 'center',
          paddingVertical: theme.spacing['2xl']
        }}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={32}
            color={theme.colors.theme.textSecondary}
            style={{ marginBottom: theme.spacing.md }}
          />
          <Text style={{
            fontSize: theme.typography.fontSize.bodyMedium,
            color: theme.colors.theme.text,
            fontFamily: theme.typography.fontFamily.body,
            textAlign: 'center',
          }}>
            {error}
          </Text>
        </View>
      );
    }

    if (savedRecipes.length === 0) {
      return (
        <View style={{ 
          alignItems: 'center', 
          justifyContent: 'center',
          paddingVertical: theme.spacing['2xl']
        }}>
          <MaterialCommunityIcons
            name="star-outline"
            size={48}
            color={theme.colors.theme.textSecondary}
            style={{ marginBottom: theme.spacing.lg }}
          />
          <Text style={{
            fontSize: theme.typography.fontSize.titleSmall,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.theme.text,
            fontFamily: theme.typography.fontFamily.body,
            marginBottom: theme.spacing.sm,
          }}>
            No Saved Recipes Yet
          </Text>
          <Text style={{
            fontSize: theme.typography.fontSize.bodySmall,
            color: theme.colors.theme.textSecondary,
            fontFamily: theme.typography.fontFamily.body,
            textAlign: 'center',
            lineHeight: theme.typography.fontSize.bodySmall * 1.4,
          }}>
            Tap the star on any recipe to save it here!
          </Text>
        </View>
      );
    }

    return (
      <View style={{ gap: theme.spacing.md }}>
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
                onPress={() => onDeleteRecipe(recipe.id)}
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
    );
  };

  return (
    <ExpandableCard
      title="Saved Recipes"
      subtitle={`${savedRecipes.length} ${savedRecipes.length === 1 ? 'recipe' : 'recipes'} saved`}
      icon="star"
      defaultExpanded={true}
      style={style}
    >
      {renderContent()}
    </ExpandableCard>
  );
}