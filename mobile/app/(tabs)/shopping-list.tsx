import React, { useState, useEffect } from 'react';
import { ScrollView, View, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { Text, Portal, Dialog, Button, Provider as PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/ThemeProvider';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { ShoppingListItem } from '../../types/api';
import { apiService } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { CheckboxItem } from '../../components/CheckboxItem';
import { HeaderComponent } from '../../components/HeaderComponent';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ShoppingListScreen() {
  const { theme } = useAppTheme();
  const { isOnline } = useNetworkStatus();
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearDialogVisible, setClearDialogVisible] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

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
        // Try to load from API
        const response = await apiService.getShoppingList();
        setShoppingList(response.items);

        // Cache the data for offline use
        await AsyncStorage.setItem('cached_shopping_list', JSON.stringify(response.items));
      } else {
        // Load from cache when offline
        const cachedData = await AsyncStorage.getItem('cached_shopping_list');
        if (cachedData) {
          setShoppingList(JSON.parse(cachedData));
        }
      }
    } catch (error) {
      console.error('Error loading shopping list:', error);

      // Try to load from cache as fallback
      try {
        const cachedData = await AsyncStorage.getItem('cached_shopping_list');
        if (cachedData) {
          setShoppingList(JSON.parse(cachedData));
        }
      } catch (cacheError) {
        console.error('Error loading cached shopping list:', cacheError);
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

  if (shoppingList.length === 0) {
    return (
      <PaperProvider>
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
    <PaperProvider>
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
                            <Text style={{ fontWeight: '600' }}>
                              {item.consolidatedDisplay}
                            </Text>
                            {' '}
                            {item.ingredientName}
                            {item.recipeBreakdown.length > 1 && (
                              <Text style={{
                                fontSize: theme.typography.fontSize.bodySmall,
                                color: theme.colors.theme.textTertiary,
                                fontWeight: '400',
                              }}>
                                {' '}(from {item.recipeBreakdown.length} recipes)
                              </Text>
                            )}
                          </Text>
                        </View>

                        {/* Dropdown arrow for multiple recipes */}
                        {item.recipeBreakdown.length > 1 && (
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
                        )}
                      </TouchableOpacity>

                      {/* Expanded recipe breakdown */}
                      {expandedItems.has(item.id) && item.recipeBreakdown.length > 1 && (
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
                                color: theme.colors.theme.textSecondary,
                                flex: 1,
                              }}>
                                <Text style={{ fontWeight: '600' }}>{recipe.quantity}</Text>
                                {' for '}
                                <Text style={{ fontStyle: 'italic' }}>{recipe.recipeTitle}</Text>
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