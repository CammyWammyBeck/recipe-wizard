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
import { PremiumFeature } from './PremiumFeature';
import Constants from 'expo-constants';

interface AllHistorySectionProps {
  style?: ViewStyle;
}

export function AllHistorySection({ style }: AllHistorySectionProps) {
  const { theme } = useAppTheme();
  const router = useRouter();

  // Check premium status
  const isPremium = Constants.expoConfig?.extra?.isPremium ?? false;

  const [allRecipes, setAllRecipes] = useState<SavedRecipeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreRecipes, setHasMoreRecipes] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const RECIPES_PER_PAGE = 20;

  // Load initial recipe history
  useEffect(() => {
    loadRecipeHistory(true);
  }, []);

  const loadRecipeHistory = async (isInitialLoad: boolean = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
        setCurrentOffset(0);
      } else {
        setIsLoadingMore(true);
      }

      const offset = isInitialLoad ? 0 : currentOffset;
      const response = await apiService.getConversationHistoryWithPagination(RECIPES_PER_PAGE, offset);
      
      if (isInitialLoad) {
        setAllRecipes(response.recipes || []);
      } else {
        setAllRecipes(prev => [...prev, ...(response.recipes || [])]);
      }
      
      // Update pagination info from backend
      setTotalRecipes(response.pagination.total);
      setHasMoreRecipes(response.pagination.hasMore);
      
      if (!isInitialLoad) {
        setCurrentOffset(prev => prev + RECIPES_PER_PAGE);
      } else {
        setCurrentOffset(RECIPES_PER_PAGE);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error loading recipe history:', error);
      if (isInitialLoad) {
        setError('Failed to load recipe history');
        setAllRecipes([]);
      } else {
        setError('Failed to load more recipes');
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMoreRecipes) {
      loadRecipeHistory(false);
    }
  };

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
        
        {/* Load More Button */}
        {hasMoreRecipes && (
          isPremium ? (
            <TouchableOpacity
              onPress={handleLoadMore}
              disabled={isLoadingMore}
              style={{
                backgroundColor: theme.colors.theme.backgroundSecondary,
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing.lg,
                marginTop: theme.spacing.md,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isLoadingMore ? 0.7 : 1,
              }}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm
              }}>
                <MaterialCommunityIcons
                  name={isLoadingMore ? "loading" : "chevron-down"}
                  size={20}
                  color={theme.colors.wizard.primary}
                  style={isLoadingMore ? { transform: [{ rotate: '45deg' }] } : {}}
                />
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.bodyLarge,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.wizard.primary,
                    fontFamily: theme.typography.fontFamily.body,
                  }}
                >
                  {isLoadingMore ? 'Loading...' : 'Load More Recipes'}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <PremiumFeature
              featureName="Complete Recipe History"
              description="Access your full recipe history and load more recipes from your cooking journey. Never lose track of your favorite dishes!"
              mode="overlay"
              style={{ marginTop: theme.spacing.md }}
            >
              <TouchableOpacity
                disabled={true}
                style={{
                  backgroundColor: theme.colors.theme.backgroundSecondary,
                  borderRadius: theme.borderRadius.xl,
                  padding: theme.spacing.lg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.sm
                }}>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={20}
                    color={theme.colors.wizard.primary}
                  />
                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.bodyLarge,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.wizard.primary,
                      fontFamily: theme.typography.fontFamily.body,
                    }}
                  >
                    Load More Recipes
                  </Text>
                </View>
              </TouchableOpacity>
            </PremiumFeature>
          )
        )}
      </View>
    );
  };

  return (
    <ExpandableCard
      title="All History"
      subtitle={`${totalRecipes} ${totalRecipes === 1 ? 'recipe' : 'recipes'} generated`}
      icon="history"
      defaultExpanded={false}
      style={style}
    >
      {renderContent()}
    </ExpandableCard>
  );
}