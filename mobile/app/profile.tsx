import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DragList, { DragListRenderItemInfo } from 'react-native-draglist';

import { useAppTheme } from '../constants/ThemeProvider';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { ExpandableCard } from '../components/ExpandableCard';
import { CheckboxItem } from '../components/CheckboxItem';
import { Header } from '../components/Header';
import { 
  UserPreferences, 
  DEFAULT_USER_PREFERENCES, 
  DEFAULT_GROCERY_CATEGORIES 
} from '../types/api';

const STORAGE_KEY = '@recipe_wizard_preferences';

// Common dietary restrictions and allergens
const COMMON_DIETARY_RESTRICTIONS = [
  'vegetarian', 'vegan', 'pescatarian', 'gluten-free', 'dairy-free', 
  'nut-free', 'low-carb', 'keto', 'paleo', 'halal', 'kosher'
];

const COMMON_ALLERGENS = [
  'nuts', 'peanuts', 'shellfish', 'fish', 'eggs', 'dairy', 'soy', 'gluten', 'sesame'
];

export default function ProfileScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { logout, user } = useAuth();
  
  // Refs for clearing TextInputs
  const categoryInputRef = useRef<any>(null);
  const dietaryInputRef = useRef<any>(null);
  const allergenInputRef = useRef<any>(null);
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    ...DEFAULT_USER_PREFERENCES,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Load preferences from storage
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedPreferences = JSON.parse(stored);
        setPreferences({
          ...DEFAULT_USER_PREFERENCES,
          ...parsedPreferences,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const updatedPreferences = {
        ...preferences,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPreferences));
      setPreferences(updatedPreferences);
      
      Alert.alert('Success', 'Preferences saved successfully!', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out', 
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              setSigningOut(true);
              await logout();
              router.replace('/');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setSigningOut(false);
            }
          }
        }
      ]
    );
  };

  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleArrayItem = useCallback((
    key: keyof Pick<UserPreferences, 'dietaryRestrictions' | 'allergens' | 'dislikes' | 'groceryCategories'>,
    item: string
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: prev[key].includes(item) 
        ? prev[key].filter(i => i !== item)
        : [...prev[key], item]
    }));
  }, []);

  const addCustomItem = (
    key: keyof Pick<UserPreferences, 'dietaryRestrictions' | 'allergens' | 'dislikes' | 'groceryCategories'>,
    item: string
  ) => {
    if (item.trim() && !preferences[key].includes(item.trim())) {
      setPreferences(prev => ({
        ...prev,
        [key]: [...prev[key], item.trim()]
      }));
    }
  };

  const removeCustomItem = (
    key: keyof Pick<UserPreferences, 'dietaryRestrictions' | 'allergens' | 'dislikes' | 'groceryCategories'>,
    item: string
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: prev[key].filter(i => i !== item)
    }));
  };

  const reorderCategories = useCallback((newOrder: string[]) => {
    setPreferences(prev => ({
      ...prev,
      groceryCategories: newOrder
    }));
  }, []);

  const onCategoriesReordered = useCallback((fromIndex: number, toIndex: number) => {
    const newOrder = [...preferences.groceryCategories];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    
    setPreferences(prev => ({
      ...prev,
      groceryCategories: newOrder
    }));
  }, [preferences.groceryCategories]);

  const renderCategoryItem = useCallback((
    info: DragListRenderItemInfo<string>
  ) => {
    const { item: category, onDragStart, onDragEnd, isActive } = info;
    
    return (
      <TouchableOpacity
        onPressIn={onDragStart}
        onPressOut={onDragEnd}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.md,
          backgroundColor: isActive 
            ? theme.colors.wizard.primary + '20'
            : theme.colors.theme.surface,
          borderRadius: theme.borderRadius.md,
          marginBottom: theme.spacing.sm,
          elevation: isActive ? 4 : 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isActive ? 0.15 : 0,
          shadowRadius: 4,
          borderWidth: isActive ? 2 : 1,
          borderColor: isActive 
            ? theme.colors.wizard.primary
            : theme.colors.theme.border,
        }}
      >
        {/* Drag Handle */}
        <View style={{ marginRight: theme.spacing.sm }}>
          <MaterialCommunityIcons
            name="drag-horizontal"
            size={20}
            color={isActive 
              ? theme.colors.wizard.primary
              : theme.colors.theme.textTertiary
            }
          />
        </View>
        
        <Text style={{
          color: isActive 
            ? theme.colors.wizard.primary
            : theme.colors.theme.text,
          fontSize: theme.typography.fontSize.bodyLarge,
          flex: 1,
          textTransform: 'capitalize',
          fontWeight: isActive ? '600' : '400',
        }}>
          {category.replace('-', ' ')}
        </Text>
        
        <TouchableOpacity
          onPress={() => removeCustomItem('groceryCategories', category)}
          style={{ 
            padding: theme.spacing.xs,
            marginLeft: theme.spacing.sm,
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons 
            name="close-circle" 
            size={20} 
            color={theme.colors.status.error} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [theme, removeCustomItem]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.theme.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.colors.theme.text, fontSize: 16 }}>
            Loading preferences...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.theme.background }}>
      <Header 
        title="Profile & Settings"
        showBackButton
        onBackPress={() => router.push('/prompt')}
      />
      
      <KeyboardAvoidingView 
        style={{ flex: 1, backgroundColor: theme.colors.theme.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          style={{ flex: 1, backgroundColor: theme.colors.theme.background }}
          contentContainerStyle={{ 
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.theme.background,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Units Preference */}
          <ExpandableCard
            title="Measurement Units"
            subtitle={preferences.units === 'metric' ? 'Metric (kg, ml, °C)' : 'Imperial (lbs, cups, °F)'}
            icon="scale-balance"
            defaultExpanded={false}
          >
            <View style={{ gap: theme.spacing.md }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: theme.spacing.md,
                  backgroundColor: preferences.units === 'metric' 
                    ? theme.colors.wizard.primary + '20' 
                    : theme.colors.theme.surface,
                  borderRadius: theme.borderRadius.lg,
                  borderWidth: preferences.units === 'metric' ? 2 : 1,
                  borderColor: preferences.units === 'metric' 
                    ? theme.colors.wizard.primary 
                    : theme.colors.theme.border,
                }}
                onPress={() => updatePreference('units', 'metric')}
              >
                <MaterialCommunityIcons 
                  name="scale-balance" 
                  size={24} 
                  color={preferences.units === 'metric' 
                    ? theme.colors.wizard.primary 
                    : theme.colors.theme.textSecondary
                  } 
                />
                <Text style={{
                  marginLeft: theme.spacing.md,
                  color: preferences.units === 'metric' 
                    ? theme.colors.wizard.primary 
                    : theme.colors.theme.text,
                  fontSize: theme.typography.fontSize.bodyLarge,
                  fontWeight: preferences.units === 'metric' ? '600' : '400',
                }}>
                  Metric (kg, ml, °C)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: theme.spacing.md,
                  backgroundColor: preferences.units === 'imperial' 
                    ? theme.colors.wizard.primary + '20' 
                    : theme.colors.theme.surface,
                  borderRadius: theme.borderRadius.lg,
                  borderWidth: preferences.units === 'imperial' ? 2 : 1,
                  borderColor: preferences.units === 'imperial' 
                    ? theme.colors.wizard.primary 
                    : theme.colors.theme.border,
                }}
                onPress={() => updatePreference('units', 'imperial')}
              >
                <MaterialCommunityIcons 
                  name="scale-balance" 
                  size={24} 
                  color={preferences.units === 'imperial' 
                    ? theme.colors.wizard.primary 
                    : theme.colors.theme.textSecondary
                  } 
                />
                <Text style={{
                  marginLeft: theme.spacing.md,
                  color: preferences.units === 'imperial' 
                    ? theme.colors.wizard.primary 
                    : theme.colors.theme.text,
                  fontSize: theme.typography.fontSize.bodyLarge,
                  fontWeight: preferences.units === 'imperial' ? '600' : '400',
                }}>
                  Imperial (lbs, cups, °F)
                </Text>
              </TouchableOpacity>
            </View>
          </ExpandableCard>

          {/* Grocery Categories */}
          <ExpandableCard
            title="Grocery Categories"
            subtitle={`${preferences.groceryCategories.length} categories`}
            icon="format-list-bulleted"
            defaultExpanded={false}
          >
            <View>
              <Text style={{
                color: theme.colors.theme.textSecondary,
                fontSize: theme.typography.fontSize.bodyMedium,
                marginBottom: theme.spacing.md,
              }}>
                Customize how ingredients are organized in your grocery lists. Drag to reorder.
              </Text>
              
              {preferences.groceryCategories.length > 0 && (
                <View style={{ marginBottom: theme.spacing.md }}>
                  <DragList
                    data={preferences.groceryCategories}
                    keyExtractor={(item, index) => `${item}-${index}`}
                    onReordered={onCategoriesReordered}
                    renderItem={renderCategoryItem}
                    scrollEnabled={false}
                  />
                </View>
              )}
              
              <TextInput
                ref={categoryInputRef}
                placeholder="Add custom category..."
                onSubmitEditing={(e) => {
                  addCustomItem('groceryCategories', e.nativeEvent.text);
                  categoryInputRef.current?.clear();
                }}
                style={{ marginTop: theme.spacing.md }}
              />
            </View>
          </ExpandableCard>

          {/* Recipe Preferences */}
          <ExpandableCard
            title="Recipe Preferences"
            subtitle={`${preferences.defaultServings} servings default`}
            icon="chef-hat"
            defaultExpanded={false}
          >
            <View style={{ gap: theme.spacing.lg }}>
              <View>
                <Text style={{
                  color: theme.colors.theme.text,
                  fontSize: theme.typography.fontSize.bodyLarge,
                  fontWeight: '600',
                  marginBottom: theme.spacing.sm,
                }}>
                  Default Servings: {preferences.defaultServings}
                </Text>
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                  {[1, 2, 4, 6, 8].map(num => (
                    <TouchableOpacity
                      key={num}
                      style={{
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.sm,
                        backgroundColor: preferences.defaultServings === num 
                          ? theme.colors.wizard.primary 
                          : theme.colors.theme.surface,
                        borderRadius: theme.borderRadius.md,
                        borderWidth: 1,
                        borderColor: preferences.defaultServings === num 
                          ? theme.colors.wizard.primary 
                          : theme.colors.theme.border,
                      }}
                      onPress={() => updatePreference('defaultServings', num)}
                    >
                      <Text style={{
                        color: preferences.defaultServings === num 
                          ? '#ffffff' 
                          : theme.colors.theme.text,
                        fontWeight: '600',
                      }}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text style={{
                  color: theme.colors.theme.text,
                  fontSize: theme.typography.fontSize.bodyLarge,
                  fontWeight: '600',
                  marginBottom: theme.spacing.sm,
                }}>
                  Preferred Difficulty
                </Text>
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                  {(['easy', 'medium', 'hard'] as const).map(difficulty => (
                    <TouchableOpacity
                      key={difficulty}
                      style={{
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.sm,
                        backgroundColor: preferences.preferredDifficulty === difficulty 
                          ? theme.colors.wizard.primary 
                          : theme.colors.theme.surface,
                        borderRadius: theme.borderRadius.md,
                        borderWidth: 1,
                        borderColor: preferences.preferredDifficulty === difficulty 
                          ? theme.colors.wizard.primary 
                          : theme.colors.theme.border,
                        flex: 1,
                        alignItems: 'center',
                      }}
                      onPress={() => updatePreference('preferredDifficulty', difficulty)}
                    >
                      <Text style={{
                        color: preferences.preferredDifficulty === difficulty 
                          ? '#ffffff' 
                          : theme.colors.theme.text,
                        fontWeight: '600',
                        textTransform: 'capitalize',
                      }}>
                        {difficulty}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ExpandableCard>

          {/* Dietary Restrictions */}
          <ExpandableCard
            title="Dietary Restrictions"
            subtitle={preferences.dietaryRestrictions.length > 0 
              ? preferences.dietaryRestrictions.join(', ') 
              : 'None selected'
            }
            icon="food-apple"
            defaultExpanded={false}
          >
            <View>
              <Text style={{
                color: theme.colors.theme.textSecondary,
                fontSize: theme.typography.fontSize.bodyMedium,
                marginBottom: theme.spacing.md,
              }}>
                Select all that apply to your diet
              </Text>
              
              {COMMON_DIETARY_RESTRICTIONS.map(restriction => (
                <CheckboxItem
                  key={restriction}
                  label={restriction.charAt(0).toUpperCase() + restriction.slice(1).replace('-', ' ')}
                  checked={preferences.dietaryRestrictions.includes(restriction)}
                  onPress={() => toggleArrayItem('dietaryRestrictions', restriction)}
                />
              ))}
              
              {preferences.dietaryRestrictions
                .filter(item => !COMMON_DIETARY_RESTRICTIONS.includes(item))
                .map(restriction => (
                  <View
                    key={restriction}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: theme.spacing.sm,
                    }}
                  >
                    <CheckboxItem
                      label={restriction}
                      checked={true}
                      onPress={() => removeCustomItem('dietaryRestrictions', restriction)}
                      style={{ flex: 1 }}
                    />
                    <TouchableOpacity
                      onPress={() => removeCustomItem('dietaryRestrictions', restriction)}
                      style={{ padding: theme.spacing.xs, marginLeft: theme.spacing.sm }}
                    >
                      <MaterialCommunityIcons 
                        name="close-circle" 
                        size={20} 
                        color={theme.colors.status.error} 
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              
              <TextInput
                ref={dietaryInputRef}
                placeholder="Add custom dietary restriction..."
                onSubmitEditing={(e) => {
                  addCustomItem('dietaryRestrictions', e.nativeEvent.text);
                  dietaryInputRef.current?.clear();
                }}
                style={{ marginTop: theme.spacing.md }}
              />
            </View>
          </ExpandableCard>

          {/* Allergens */}
          <ExpandableCard
            title="Allergens"
            subtitle={preferences.allergens.length > 0 
              ? preferences.allergens.join(', ') 
              : 'None selected'
            }
            icon="alert-circle"
            defaultExpanded={false}
          >
            <View>
              <Text style={{
                color: theme.colors.theme.textSecondary,
                fontSize: theme.typography.fontSize.bodyMedium,
                marginBottom: theme.spacing.md,
              }}>
                Ingredients to avoid due to allergies
              </Text>
              
              {COMMON_ALLERGENS.map(allergen => (
                <CheckboxItem
                  key={allergen}
                  label={allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                  checked={preferences.allergens.includes(allergen)}
                  onPress={() => toggleArrayItem('allergens', allergen)}
                />
              ))}
              
              {preferences.allergens
                .filter(item => !COMMON_ALLERGENS.includes(item))
                .map(allergen => (
                  <View
                    key={allergen}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: theme.spacing.sm,
                    }}
                  >
                    <CheckboxItem
                      label={allergen}
                      checked={true}
                      onPress={() => removeCustomItem('allergens', allergen)}
                      style={{ flex: 1 }}
                    />
                    <TouchableOpacity
                      onPress={() => removeCustomItem('allergens', allergen)}
                      style={{ padding: theme.spacing.xs, marginLeft: theme.spacing.sm }}
                    >
                      <MaterialCommunityIcons 
                        name="close-circle" 
                        size={20} 
                        color={theme.colors.status.error} 
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              
              <TextInput
                ref={allergenInputRef}
                placeholder="Add custom allergen..."
                onSubmitEditing={(e) => {
                  addCustomItem('allergens', e.nativeEvent.text);
                  allergenInputRef.current?.clear();
                }}
                style={{ marginTop: theme.spacing.md }}
              />
            </View>
          </ExpandableCard>

          {/* Additional Preferences */}
          <ExpandableCard
            title="Additional Preferences"
            subtitle={preferences.additionalPreferences ? 
              preferences.additionalPreferences.substring(0, 50) + '...' : 
              'Add custom instructions'
            }
            icon="text-box"
            defaultExpanded={false}
          >
            <View>
              <Text style={{
                color: theme.colors.theme.textSecondary,
                fontSize: theme.typography.fontSize.bodyMedium,
                marginBottom: theme.spacing.md,
              }}>
                Add any additional preferences, cooking styles, or instructions for the AI
              </Text>
              
              <TextInput
                placeholder="e.g., I prefer one-pot meals, low sodium recipes, or Mediterranean flavors..."
                value={preferences.additionalPreferences}
                onChangeText={(text) => updatePreference('additionalPreferences', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{ 
                  height: 120,
                  paddingTop: theme.spacing.md,
                }}
              />
              
              <Text style={{
                color: theme.colors.theme.textTertiary,
                fontSize: theme.typography.fontSize.bodySmall,
                marginTop: theme.spacing.sm,
                fontStyle: 'italic',
              }}>
                These preferences will be included in every recipe generation to personalize your results
              </Text>
            </View>
          </ExpandableCard>

          {/* Save Button */}
          <View style={{ marginTop: theme.spacing.xl }}>
            <Button
              onPress={savePreferences}
              variant="primary"
              disabled={saving}
              loading={saving}
              leftIcon="content-save"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </View>

          {/* Account Section */}
          <ExpandableCard
            title="Account"
            subtitle={user?.email || 'Not logged in'}
            icon="account"
            defaultExpanded={false}
            style={{ marginTop: theme.spacing.lg }}
          >
            <View>
              {user && (
                <View style={{ marginBottom: theme.spacing.lg }}>
                  <Text style={{
                    color: theme.colors.theme.textSecondary,
                    fontSize: theme.typography.fontSize.bodyMedium,
                    marginBottom: theme.spacing.sm,
                  }}>
                    Signed in as:
                  </Text>
                  <Text style={{
                    color: theme.colors.theme.text,
                    fontSize: theme.typography.fontSize.bodyLarge,
                    fontWeight: '600',
                    marginBottom: theme.spacing.xs,
                  }}>
                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || 'User'}
                  </Text>
                  <Text style={{
                    color: theme.colors.theme.textSecondary,
                    fontSize: theme.typography.fontSize.bodyMedium,
                  }}>
                    {user.email}
                  </Text>
                </View>
              )}
              
              <Button
                onPress={handleSignOut}
                variant="outline"
                disabled={signingOut}
                loading={signingOut}
                leftIcon="logout"
                style={{
                  borderColor: theme.colors.status.error,
                }}
                textStyle={{
                  color: theme.colors.status.error,
                }}
              >
                {signingOut ? "Signing Out..." : "Sign Out"}
              </Button>
            </View>
          </ExpandableCard>

          <View style={{ marginBottom: theme.spacing['2xl'] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
