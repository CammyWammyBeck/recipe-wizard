import React, { useState, useEffect } from 'react';
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
import { apiService } from '../services/api';
import { SavedRecipeData } from '../types/api';

interface AllHistorySectionProps {
  style?: ViewStyle;
}

export function AllHistorySection({ style }: AllHistorySectionProps) {
  const { theme } = useAppTheme();
  const router = useRouter();

  const [allRecipes, setAllRecipes] = useState<SavedRecipeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all recipe history
  useEffect(() => {
    const loadRecipeHistory = async () => {
      try {
        setIsLoading(true);
        const recipes = await apiService.getConversationHistory();
        setAllRecipes(recipes || []);
        setError(null);
      } catch (error) {
        console.error('Error loading recipe history:', error);
        setError('Failed to load recipe history');
        setAllRecipes([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipeHistory();
  }, []);

  const handleRecipePress = (recipe: SavedRecipeData) => {
    router.push({
      pathname: '/recipe-result',
      params: {
        recipeData: JSON.stringify(recipe),
        fromHistory: 'true'
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
            Loading recipe history...
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

    if (allRecipes.length === 0) {
      return (
        <View style={{ 
          alignItems: 'center', 
          justifyContent: 'center',
          paddingVertical: theme.spacing['2xl']
        }}>
          <MaterialCommunityIcons
            name="history"
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
            No Recipe History Yet
          </Text>
          <Text style={{
            fontSize: theme.typography.fontSize.bodySmall,
            color: theme.colors.theme.textSecondary,
            fontFamily: theme.typography.fontFamily.body,
            textAlign: 'center',
            lineHeight: theme.typography.fontSize.bodySmall * 1.4,
          }}>
            Generate your first recipe to see it here!
          </Text>
        </View>
      );
    }

    return (
      <View style={{ gap: theme.spacing.md }}>
        {allRecipes.map((recipe) => (
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
                    Created {formatDate(recipe.generatedAt || recipe.savedAt)}
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

              <View style={{ marginLeft: theme.spacing.md }}>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={theme.colors.theme.textTertiary}
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ExpandableCard
      title="All History"
      subtitle={`${allRecipes.length} ${allRecipes.length === 1 ? 'recipe' : 'recipes'} generated`}
      icon="history"
      defaultExpanded={false}
      style={style}
    >
      {renderContent()}
    </ExpandableCard>
  );
}