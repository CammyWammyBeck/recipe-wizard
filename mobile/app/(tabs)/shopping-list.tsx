import React, { useState, useEffect } from 'react';
import { ScrollView, View, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { Text, Portal, Dialog, Button, Provider as PaperProvider, MD3Theme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/ThemeProvider';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { ShoppingListItem, SavedRecipeData } from '../../types/api';
import { apiService } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { CheckboxItem } from '../../components/CheckboxItem';
import { HeaderComponent } from '../../components/HeaderComponent';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumFeature } from '../../components/PremiumFeature';
import Constants from 'expo-constants';

export default function ShoppingListScreen() {
  const { theme, isDark } = useAppTheme();
  const { isOnline } = useNetworkStatus();

  // Check premium status
  const isPremium = Constants.expoConfig?.extra?.isPremium ?? false;

  // Create Paper-compatible theme
  const paperTheme: MD3Theme = {
    dark: isDark,
    version: 3,
    mode: 'adaptive',
    colors: {
      primary: theme.colors.wizard.primary,
      onPrimary: '#ffffff',
      primaryContainer: theme.colors.wizard.primary + '20',
      onPrimaryContainer: theme.colors.wizard.primary,
      secondary: theme.colors.wizard.accent,
      onSecondary: '#ffffff',
      secondaryContainer: theme.colors.wizard.accent + '20',
      onSecondaryContainer: theme.colors.wizard.accent,
      tertiary: theme.colors.wizard.accent,
      onTertiary: '#ffffff',
      tertiaryContainer: theme.colors.wizard.accent + '20',
      onTertiaryContainer: theme.colors.wizard.accent,
      error: theme.colors.status.error,
      onError: '#ffffff',
      errorContainer: theme.colors.status.error + '20',
      onErrorContainer: theme.colors.status.error,
      background: theme.colors.theme.background,
      onBackground: theme.colors.theme.text,
      surface: theme.colors.theme.surface,
      onSurface: theme.colors.theme.text,
      surfaceVariant: theme.colors.theme.backgroundSecondary,
      onSurfaceVariant: theme.colors.theme.textSecondary,
      outline: theme.colors.theme.border,
      outlineVariant: theme.colors.theme.borderLight,
      shadow: '#000000',
      scrim: '#000000',
      inverseSurface: isDark ? '#ffffff' : '#000000',
      inverseOnSurface: isDark ? '#000000' : '#ffffff',
      inversePrimary: theme.colors.wizard.primaryLight,
      elevation: {
        level0: 'transparent',
        level1: theme.colors.theme.backgroundSecondary,
        level2: theme.colors.theme.backgroundTertiary,
        level3: theme.colors.theme.surface,
        level4: theme.colors.theme.surface,
        level5: theme.colors.theme.surface,
      },
      surfaceDisabled: theme.colors.theme.textDisabled + '12',
      onSurfaceDisabled: theme.colors.theme.textDisabled,
      backdrop: 'rgba(0, 0, 0, 0.5)',
    } as any,
  } as MD3Theme;
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearDialogVisible, setClearDialogVisible] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipeData[]>([]);

  // Group items by category
  const itemsByCategory = shoppingList.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  const categories = Object.keys(itemsByCategory).sort();
  const totalItems = shoppingList.length;
  const completedItems = shoppingList.filter(item => item.isChecked).length;

  const toggleItemExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleRecipePress = async (recipeId: string, recipeTitle: string) => {
    try {
      // First, try to find the recipe in saved recipes
      const savedRecipe = savedRecipes.find(recipe => recipe.id === recipeId);

      if (savedRecipe) {
        // Navigate with full recipe data
        router.push({
          pathname: '/recipe-result',
          params: {
            recipeData: JSON.stringify(savedRecipe),
            fromShoppingList: 'true'
          }
        });
        return;
      }

      // If not in saved recipes, try to get from conversation history
      const conversationHistory = await apiService.getConversationHistory(50); // Get more entries to find the recipe
      const historyRecipe = conversationHistory.find(entry => entry.response.id === recipeId);

      if (historyRecipe) {
        // Navigate with full recipe data from history
        router.push({
          pathname: '/recipe-result',
          params: {
            recipeData: JSON.stringify(historyRecipe.response),
            fromShoppingList: 'true'
          }
        });
        return;
      }

      // If recipe not found in local data, show error
      console.warn('Recipe not found in local data:', recipeId, recipeTitle);
      // For now, just show alert - could implement a more user-friendly error
      alert(`Sorry, the recipe "${recipeTitle}" could not be found. It may have been removed from your history.`);

    } catch (error) {
      console.error('Error navigating to recipe:', error);
      alert(`Sorry, there was an error loading the recipe "${recipeTitle}".`);
    }
  };

  const toggleItemChecked = async (itemId: string) => {
    // Update local state immediately for responsive UI
    const updatedItems = shoppingList.map(item =>
      item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
    );
    setShoppingList(updatedItems);

    // Sync with backend when online
    if (isOnline) {
      try {
        const item = updatedItems.find(i => i.id === itemId);
        if (item) {
          await apiService.updateShoppingListItem(itemId, item.isChecked);
        }
      } catch (error) {
        console.error('Error syncing item check status:', error);
        // Revert local state on error
        setShoppingList(prev => prev.map(item =>
          item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
        ));
      }
    }

    // Update cache
    try {
      await AsyncStorage.setItem('cached_shopping_list', JSON.stringify(updatedItems));
    } catch (error) {
      console.error('Error updating cached shopping list:', error);
    }
  };

  const clearShoppingList = async () => {
    try {
      setClearDialogVisible(false);

      if (isOnline) {
        await apiService.clearShoppingList();
      }

      setShoppingList([]);
      // Clear cache
      await AsyncStorage.removeItem('cached_shopping_list');
    } catch (error) {
      console.error('Error clearing shopping list:', error);
      // Show error in dialog or toast here if needed
    }
  };

  // Load shopping list from API/cache
  useEffect(() => {
    loadShoppingList();
  }, []);

  // Also reload whenever the screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      loadShoppingList();
    }, [isOnline])
  );

  const loadShoppingList = async () => {
    try {
      setLoading(true);

      if (isOnline) {
        // Load both shopping list and saved recipes for navigation
        const [shoppingResponse, savedRecipesData] = await Promise.all([
          apiService.getShoppingList(),
          apiService.getSavedRecipes().catch(() => [])
        ]);

        setShoppingList(shoppingResponse.items);
        setSavedRecipes(savedRecipesData);

        // Cache the data for offline use
        await AsyncStorage.setItem('cached_shopping_list', JSON.stringify(shoppingResponse.items));
        await AsyncStorage.setItem('cached_saved_recipes', JSON.stringify(savedRecipesData));
      } else {
        // Load from cache when offline
        const [cachedShoppingList, cachedSavedRecipes] = await Promise.all([
          AsyncStorage.getItem('cached_shopping_list'),
          AsyncStorage.getItem('cached_saved_recipes')
        ]);

        if (cachedShoppingList) {
          setShoppingList(JSON.parse(cachedShoppingList));
        }
        if (cachedSavedRecipes) {
          setSavedRecipes(JSON.parse(cachedSavedRecipes));
        }
      }
    } catch (error) {
      console.error('Error loading shopping list:', error);

      // Try to load from cache as fallback
      try {
        const [cachedShoppingList, cachedSavedRecipes] = await Promise.all([
          AsyncStorage.getItem('cached_shopping_list'),
          AsyncStorage.getItem('cached_saved_recipes')
        ]);

        if (cachedShoppingList) {
          setShoppingList(JSON.parse(cachedShoppingList));
        }
        if (cachedSavedRecipes) {
          setSavedRecipes(JSON.parse(cachedSavedRecipes));
        }
      } catch (cacheError) {
        console.error('Error loading cached data:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadShoppingList();
    } finally {
      setRefreshing(false);
    }
  };

  // Helper function to get category icons (same as ingredients section)
  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('produce') || categoryLower.includes('fruit') || categoryLower.includes('vegetable')) {
      return 'carrot';
    } else if (categoryLower.includes('meat') || categoryLower.includes('protein') || categoryLower.includes('butchery')) {
      return 'food-steak';
    } else if (categoryLower.includes('dairy') || categoryLower.includes('chilled')) {
      return 'fridge';
    } else if (categoryLower.includes('bakery') || categoryLower.includes('bread')) {
      return 'bread-slice';
    } else if (categoryLower.includes('frozen')) {
      return 'snowflake';
    } else if (categoryLower.includes('pantry') || categoryLower.includes('canned') || categoryLower.includes('dry-goods')) {
      return 'sack';
    } else if (categoryLower.includes('spice') || categoryLower.includes('seasoning')) {
      return 'shaker';
    } else if (categoryLower.includes('beverage') || categoryLower.includes('drink')) {
      return 'cup';
    } else {
      return 'cart-outline';
    }
  };

  const getCategoryColor = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('produce') || categoryLower.includes('fruit') || categoryLower.includes('vegetable')) {
      return '#10b981'; // green
    } else if (categoryLower.includes('meat') || categoryLower.includes('protein') || categoryLower.includes('butchery')) {
      return '#ef4444'; // red
    } else if (categoryLower.includes('dairy') || categoryLower.includes('chilled')) {
      return '#3b82f6'; // blue
    } else if (categoryLower.includes('frozen')) {
      return '#06b6d4'; // cyan
    } else if (categoryLower.includes('pantry') || categoryLower.includes('canned') || categoryLower.includes('dry-goods')) {
      return '#8b5cf6'; // purple
    } else {
      return theme.colors.wizard.primary; // default
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.theme.background }} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialCommunityIcons
            name="cart-outline"
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
            Loading Shopping List
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.textSecondary,
              textAlign: 'center',
            }}
          >
            Getting your ingredients ready...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show premium lock screen for non-premium users
  if (!isPremium) {
    return (
      <PaperProvider theme={paperTheme}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.theme.background }} edges={['top']}>
          <HeaderComponent
            title="Shopping List"
            subtitle="Premium Feature"
            rightContent={
              <MaterialCommunityIcons
                name="crown"
                size={24}
                color={theme.colors.wizard.primary}
              />
            }
          />

          <PremiumFeature
            featureName="Smart Shopping Lists"
            description="Automatically combine ingredients from multiple recipes, organize by store categories, and keep track of what you need to buy. Never forget ingredients again!"
            mode="replace"
            style={{ margin: theme.spacing.lg, flex: 1 }}
          >
            <View />
          </PremiumFeature>
        </SafeAreaView>
      </PaperProvider>
    );
  }

  if (shoppingList.length === 0) {
    return (
      <PaperProvider theme={paperTheme}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.theme.background }} edges={['top']}>
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32
          }}>
            <MaterialCommunityIcons
              name="cart-outline"
              size={80}
              color={theme.colors.theme.textSecondary}
            />
            <Text
              style={{
                fontSize: theme.typography.fontSize.headlineMedium,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.theme.text,
                textAlign: 'center',
                marginTop: 16,
                marginBottom: 8
              }}
            >
              Your Shopping List is Empty
            </Text>
            <Text
              style={{
                fontSize: theme.typography.fontSize.bodyLarge,
                color: theme.colors.theme.textSecondary,
                textAlign: 'center',
                lineHeight: 24
              }}
            >
              Add recipes to your shopping list from the recipe screen to get started!
            </Text>
          </View>
        </SafeAreaView>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.theme.background }} edges={['top']}>
        <HeaderComponent
          title="Shopping List"
          subtitle={`${completedItems}/${totalItems} items completed`}
          rightContent={
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {!isOnline && (
                <MaterialCommunityIcons
                  name="wifi-off"
                  size={20}
                  color={theme.colors.theme.textSecondary}
                  style={{ marginRight: 16 }}
                />
              )}
              <TouchableOpacity
                onPress={() => setClearDialogVisible(true)}
                disabled={shoppingList.length === 0}
                style={{
                  opacity: shoppingList.length === 0 ? 0.5 : 1,
                }}
              >
                <MaterialCommunityIcons
                  name="delete-sweep"
                  size={24}
                  color={theme.colors.theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
          }
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.wizard.primary}
            />
          }
        >
          {categories.map(category => {
            const categoryItems = itemsByCategory[category];
            const categoryColor = getCategoryColor(category);
            const checkedInCategory = categoryItems.filter(item => item.isChecked).length;

            return (
              <View key={category} style={{ marginBottom: 32 }}>
                {/* Category Header */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: categoryColor + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <MaterialCommunityIcons
                      name={getCategoryIcon(category) as any}
                      size={16}
                      color={categoryColor}
                    />
                  </View>

                  <Text style={{
                    fontSize: theme.typography.fontSize.titleMedium,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.theme.text,
                    flex: 1,
                  }}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </Text>

                  <Text style={{
                    fontSize: theme.typography.fontSize.bodySmall,
                    color: theme.colors.theme.textTertiary,
                  }}>
                    {checkedInCategory}/{categoryItems.length}
                  </Text>
                </View>

                {/* Category Items */}
                <View style={{ gap: 8 }}>
                  {categoryItems.map(item => (
                    <View key={item.id}>
                      {/* Custom inline item with recipe breakdown */}
                      <TouchableOpacity
                        onPress={() => toggleItemChecked(item.id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: theme.spacing.md,
                          paddingHorizontal: theme.spacing.lg,
                          borderRadius: theme.borderRadius.lg,
                          borderWidth: 1,
                          backgroundColor: item.isChecked
                            ? categoryColor + '10'
                            : theme.colors.theme.backgroundSecondary,
                          borderColor: item.isChecked
                            ? categoryColor + '40'
                            : theme.colors.theme.borderLight,
                        }}
                      >
                        {/* Checkbox */}
                        <View style={{
                          width: 24,
                          height: 24,
                          borderRadius: theme.borderRadius.md,
                          borderWidth: 2,
                          borderColor: item.isChecked
                            ? theme.colors.wizard.primary
                            : theme.colors.theme.border,
                          backgroundColor: item.isChecked
                            ? theme.colors.wizard.primary
                            : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: theme.spacing.lg,
                        }}>
                          {item.isChecked && (
                            <MaterialCommunityIcons
                              name="check"
                              size={16}
                              color="#ffffff"
                            />
                          )}
                        </View>

                        {/* Ingredient text with recipe count */}
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            fontSize: theme.typography.fontSize.bodyLarge,
                            fontWeight: theme.typography.fontWeight.medium,
                            color: item.isChecked ? theme.colors.theme.textSecondary : theme.colors.theme.text,
                            textDecorationLine: item.isChecked ? 'line-through' : 'none',
                          }}>
                            <Text style={{
                              fontWeight: '600',
                              color: item.isChecked ? theme.colors.theme.textSecondary : theme.colors.theme.textSecondary,
                            }}>
                              {item.consolidatedDisplay}
                            </Text>
                            {' '}
                            {item.ingredientName}
                            {item.recipeBreakdown.length > 1 && (
                              <Text style={{
                                fontSize: theme.typography.fontSize.bodySmall,
                                color: theme.colors.theme.textSecondary,
                                fontWeight: '400',
                              }}>
                                {' '}(from {item.recipeBreakdown.length} recipes)
                              </Text>
                            )}
                          </Text>
                        </View>

                        {/* Dropdown arrow for recipe breakdown */}
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation(); // Prevent checkbox toggle
                            toggleItemExpanded(item.id);
                          }}
                          style={{
                            padding: 8,
                            borderRadius: 12,
                            backgroundColor: expandedItems.has(item.id)
                              ? theme.colors.wizard.primary + '15'
                              : 'transparent',
                          }}
                        >
                          <MaterialCommunityIcons
                            name={expandedItems.has(item.id) ? "chevron-up" : "chevron-down"}
                            size={20}
                            color={expandedItems.has(item.id) ? theme.colors.wizard.primary : theme.colors.theme.textTertiary}
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>

                      {/* Expanded recipe breakdown */}
                      {expandedItems.has(item.id) && (
                        <View style={{
                          marginTop: 4,
                          marginLeft: 40,
                          paddingLeft: 16,
                          paddingTop: 8,
                          paddingBottom: 8,
                          borderLeftWidth: 3,
                          borderLeftColor: categoryColor + '30',
                          backgroundColor: theme.colors.theme.backgroundTertiary,
                          borderRadius: 8,
                          marginRight: 8,
                        }}>
                          {item.recipeBreakdown.map((recipe, index) => (
                            <View
                              key={index}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 2,
                              }}
                            >
                              <MaterialCommunityIcons
                                name="chef-hat"
                                size={14}
                                color={categoryColor}
                                style={{ marginRight: 8 }}
                              />
                              <Text style={{
                                fontSize: theme.typography.fontSize.bodySmall,
                                color: theme.colors.theme.text,
                                flex: 1,
                              }}>
                                <Text style={{
                                  fontWeight: '600',
                                  color: theme.colors.theme.textSecondary,
                                }}>{recipe.quantity}</Text>
                                {' for '}
                                <TouchableOpacity
                                  onPress={() => handleRecipePress(recipe.recipeId, recipe.recipeTitle)}
                                  style={{
                                    borderRadius: 4,
                                    paddingHorizontal: 2,
                                  }}
                                >
                                  <Text style={{
                                    fontStyle: 'italic',
                                    color: theme.colors.wizard.primary,
                                    textDecorationLine: 'underline',
                                  }}>{recipe.recipeTitle}</Text>
                                </TouchableOpacity>
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Clear Confirmation Dialog */}
        <Portal>
          <Dialog visible={clearDialogVisible} onDismiss={() => setClearDialogVisible(false)}>
            <Dialog.Title>Clear Shopping List</Dialog.Title>
            <Dialog.Content>
              <Text style={{
                color: theme.colors.theme.textSecondary,
                fontSize: theme.typography.fontSize.bodyMedium
              }}>
                Are you sure you want to clear all {totalItems} items from your shopping list? This action cannot be undone.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setClearDialogVisible(false)}>Cancel</Button>
              <Button onPress={clearShoppingList}>Clear All</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </PaperProvider>
  );
}