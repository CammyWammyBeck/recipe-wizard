import React, { useState, useEffect } from 'react';
import { ScrollView, View, RefreshControl } from 'react-native';
import { Text, Card, Checkbox, Button, Portal, Dialog, Provider as PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/ThemeProvider';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { ShoppingListItem } from '../../types/api';
import { apiService } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

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
      setShoppingList([]);
      setClearDialogVisible(false);

      if (isOnline) {
        await apiService.clearShoppingList();
      }

      // Clear cache
      await AsyncStorage.removeItem('cached_shopping_list');
    } catch (error) {
      console.error('Error clearing shopping list:', error);
      // Could show error toast here
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.theme.background }}>
        <Text variant="bodyLarge" style={{ color: theme.colors.theme.text }}>Loading shopping list...</Text>
      </View>
    );
  }

  if (shoppingList.length === 0) {
    return (
      <PaperProvider>
        <View style={{ flex: 1, backgroundColor: theme.colors.theme.background }}>
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
              variant="headlineSmall"
              style={{
                color: theme.colors.theme.text,
                textAlign: 'center',
                marginTop: 16,
                marginBottom: 8
              }}
            >
              Your shopping list is empty
            </Text>
            <Text
              variant="bodyLarge"
              style={{
                color: theme.colors.theme.textSecondary,
                textAlign: 'center'
              }}
            >
              Add recipes to your shopping list from the recipe screen to get started!
            </Text>
          </View>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
    <View style={{ flex: 1, backgroundColor: theme.colors.theme.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.theme.border,
        backgroundColor: theme.colors.theme.backgroundSecondary,
      }}>
        <Text variant="headlineSmall" style={{ color: theme.colors.theme.text }}>
          Shopping List
        </Text>
        {!isOnline && (
          <MaterialCommunityIcons
            name="wifi-off"
            size={20}
            color={theme.colors.theme.textSecondary}
          />
        )}
        <Button
          mode="text"
          onPress={() => setClearDialogVisible(true)}
          disabled={shoppingList.length === 0}
        >
          Clear All
        </Button>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.wizard.primary}
          />
        }
      >
        
        
        {categories.map(category => (
          <Card key={category} style={{ marginBottom: 16 }}>
            <Card.Content>
              <Text
                variant="titleMedium"
                style={{
                  color: theme.colors.wizard.primary,
                  marginBottom: 12,
                  textTransform: 'capitalize'
                }}
              >
                {category.replace('-', ' ')}
              </Text>

              {itemsByCategory[category].map(item => (
                <View key={item.id}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 8,
                  }}>
                    <Checkbox
                      status={item.isChecked ? 'checked' : 'unchecked'}
                      onPress={() => toggleItemChecked(item.id)}
                    />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text
                        variant="bodyLarge"
                        style={{
                          color: item.isChecked ? theme.colors.theme.textSecondary : theme.colors.theme.text,
                          textDecorationLine: item.isChecked ? 'line-through' : 'none'
                        }}
                      >
                        {item.consolidatedDisplay} {item.ingredientName}
                      </Text>
                    </View>
                    <Button
                      mode="text"
                      compact
                      onPress={() => toggleItemExpanded(item.id)}
                    >
                      <MaterialCommunityIcons
                        name={expandedItems.has(item.id) ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={theme.colors.wizard.primary}
                      />
                    </Button>
                  </View>

                  {expandedItems.has(item.id) && (
                    <View style={{
                      marginLeft: 40,
                      paddingLeft: 12,
                      borderLeftWidth: 2,
                      borderLeftColor: theme.colors.theme.border,
                      marginBottom: 8
                    }}>
                      {item.recipeBreakdown.map((recipe, index) => (
                        <Text
                          key={index}
                          variant="bodyMedium"
                          style={{
                            color: theme.colors.theme.textSecondary,
                            marginBottom: 4
                          }}
                        >
                          {recipe.quantity} for {recipe.recipeTitle}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
      

      {/* Clear confirmation dialog */}
      <Portal>
        <Dialog visible={clearDialogVisible} onDismiss={() => setClearDialogVisible(false)}>
          <Dialog.Title>Clear Shopping List</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to clear all items from your shopping list? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearDialogVisible(false)}>Cancel</Button>
            <Button onPress={clearShoppingList}>Clear All</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
    </PaperProvider>
  );
}
