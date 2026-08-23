import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { Portal, Dialog, Text, Button as PaperButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/ThemeProvider';
import { ShoppingListRecipeSummary } from '../../types/api';
import { apiService } from '../../services/api';

interface RecipesInListSheetProps {
  visible: boolean;
  onDismiss: () => void;
  /** Called after a recipe is removed, with the rebuilt list from the server. */
  onRemoved: (recipeTitle: string) => void;
  onError: (message: string) => void;
}

function formatAddedAt(addedAt: string | null): string | null {
  if (!addedAt) return null;

  const added = new Date(addedAt);
  if (Number.isNaN(added.getTime())) return null;

  const days = Math.floor((Date.now() - added.getTime()) / 86_400_000);
  if (days <= 0) return 'Added today';
  if (days === 1) return 'Added yesterday';
  if (days < 7) return `Added ${days} days ago`;
  return `Added ${added.toLocaleDateString()}`;
}

export function RecipesInListSheet({ visible, onDismiss, onRemoved, onError }: RecipesInListSheetProps) {
  const { theme } = useAppTheme();
  const [recipes, setRecipes] = useState<ShoppingListRecipeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    setLoading(true);
    apiService
      .getShoppingListRecipes()
      .then(result => {
        if (!cancelled) setRecipes(result);
      })
      .catch(() => {
        if (!cancelled) onError('Could not load the recipes in your list.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  const handleRemove = async (recipe: ShoppingListRecipeSummary) => {
    setRemovingId(recipe.recipeId);
    try {
      await apiService.removeRecipeFromShoppingList(recipe.recipeId);
      setRecipes(prev => prev.filter(r => r.recipeId !== recipe.recipeId));
      onRemoved(recipe.recipeTitle);
    } catch {
      onError(`Could not remove "${recipe.recipeTitle}". Please try again.`);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Recipes in this list</Dialog.Title>
        <Dialog.Content>
          {loading ? (
            <View style={{ paddingVertical: theme.spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator color={theme.colors.wizard.primary} />
            </View>
          ) : recipes.length === 0 ? (
            <Text style={{ color: theme.colors.theme.textSecondary }}>
              No recipes have been added yet. Everything in your list was added by hand.
            </Text>
          ) : (
            <>
              <Text
                style={{
                  color: theme.colors.theme.textSecondary,
                  fontSize: theme.typography.fontSize.bodySmall,
                  marginBottom: theme.spacing.md,
                }}
              >
                Removing a recipe takes back only the ingredients it contributed. Anything you added
                yourself, or that another recipe also needs, stays.
              </Text>

              <ScrollView style={{ maxHeight: 320 }}>
                <View style={{ gap: theme.spacing.sm }}>
                  {recipes.map(recipe => {
                    const addedLabel = formatAddedAt(recipe.addedAt);
                    const isRemoving = removingId === recipe.recipeId;

                    return (
                      <View
                        key={recipe.recipeId}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: theme.spacing.sm,
                          paddingHorizontal: theme.spacing.md,
                          borderRadius: theme.borderRadius.md,
                          backgroundColor: theme.colors.theme.backgroundSecondary,
                          opacity: isRemoving ? 0.5 : 1,
                        }}
                      >
                        <MaterialCommunityIcons
                          name="chef-hat"
                          size={18}
                          color={theme.colors.wizard.primary}
                          style={{ marginRight: theme.spacing.md }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            numberOfLines={2}
                            style={{
                              color: theme.colors.theme.text,
                              fontWeight: theme.typography.fontWeight.medium,
                            }}
                          >
                            {recipe.recipeTitle}
                          </Text>
                          {addedLabel && (
                            <Text
                              style={{
                                color: theme.colors.theme.textTertiary,
                                fontSize: theme.typography.fontSize.labelSmall,
                              }}
                            >
                              {addedLabel}
                            </Text>
                          )}
                        </View>

                        <TouchableOpacity
                          onPress={() => handleRemove(recipe)}
                          disabled={isRemoving}
                          accessibilityLabel={`Remove ${recipe.recipeTitle} from shopping list`}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={{ padding: theme.spacing.xs }}
                        >
                          {isRemoving ? (
                            <ActivityIndicator size={18} color={theme.colors.theme.textTertiary} />
                          ) : (
                            <MaterialCommunityIcons
                              name="close-circle-outline"
                              size={22}
                              color={theme.colors.status.error}
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <PaperButton onPress={onDismiss}>Done</PaperButton>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
