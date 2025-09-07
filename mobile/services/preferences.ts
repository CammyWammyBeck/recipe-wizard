import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences, DEFAULT_USER_PREFERENCES } from '../types/api';

export class PreferencesService {
  private static readonly STORAGE_KEY = '@recipe_wizard_preferences';

  /**
   * Load user preferences from AsyncStorage
   */
  static async loadPreferences(): Promise<UserPreferences> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedPreferences = JSON.parse(stored);
        return {
          ...DEFAULT_USER_PREFERENCES,
          ...parsedPreferences,
          // Ensure grocery categories always has defaults if empty
          groceryCategories: parsedPreferences.groceryCategories?.length > 0 
            ? parsedPreferences.groceryCategories 
            : DEFAULT_USER_PREFERENCES.groceryCategories,
        };
      }
      return {
        ...DEFAULT_USER_PREFERENCES,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return {
        ...DEFAULT_USER_PREFERENCES,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Save user preferences to AsyncStorage
   */
  static async savePreferences(preferences: UserPreferences): Promise<void> {
    try {
      const updatedPreferences = {
        ...preferences,
        updatedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedPreferences));
      
      // Also update theme preference in separate storage for theme persistence
      if (preferences.themePreference) {
        await AsyncStorage.setItem('@theme_preference', preferences.themePreference);
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw new Error('Failed to save preferences');
    }
  }

  /**
   * Get theme preference specifically (used by theme provider)
   */
  static async getThemePreference(): Promise<'light' | 'dark' | 'system'> {
    try {
      const themePreference = await AsyncStorage.getItem('@theme_preference');
      if (themePreference && ['light', 'dark', 'system'].includes(themePreference)) {
        return themePreference as 'light' | 'dark' | 'system';
      }
      return 'system';
    } catch (error) {
      console.error('Failed to load theme preference:', error);
      return 'system';
    }
  }

  /**
   * Update theme preference and sync with main preferences
   */
  static async updateThemePreference(theme: 'light' | 'dark' | 'system'): Promise<void> {
    try {
      // Update theme-specific storage
      await AsyncStorage.setItem('@theme_preference', theme);
      
      // Also update in main preferences
      const preferences = await this.loadPreferences();
      await this.savePreferences({
        ...preferences,
        themePreference: theme,
      });
    } catch (error) {
      console.error('Failed to update theme preference:', error);
      throw error;
    }
  }

  /**
   * Generate LLM prompt context from user preferences
   */
  static generatePromptContext(preferences: UserPreferences): string {
    const context: string[] = [];

    // Units
    context.push(`Use ${preferences.units} measurements (${
      preferences.units === 'metric' 
        ? 'kg, g, ml, l, °C' 
        : 'lbs, oz, cups, tablespoons, °F'
    })`);

    // Servings
    context.push(`Recipe should serve ${preferences.defaultServings} people`);

    // Difficulty
    if (preferences.preferredDifficulty) {
      context.push(`Prefer ${preferences.preferredDifficulty} difficulty level recipes`);
    }

    // Time constraints
    if (preferences.maxCookTime) {
      context.push(`Maximum cooking time: ${preferences.maxCookTime} minutes`);
    }
    if (preferences.maxPrepTime) {
      context.push(`Maximum prep time: ${preferences.maxPrepTime} minutes`);
    }

    // Dietary restrictions
    if (preferences.dietaryRestrictions.length > 0) {
      context.push(`Dietary requirements: ${preferences.dietaryRestrictions.join(', ')}`);
    }

    // Allergens
    if (preferences.allergens.length > 0) {
      context.push(`MUST AVOID these allergens: ${preferences.allergens.join(', ')}`);
    }

    // Dislikes
    if (preferences.dislikes.length > 0) {
      context.push(`Avoid these ingredients: ${preferences.dislikes.join(', ')}`);
    }

    // Grocery categories
    if (preferences.groceryCategories.length > 0) {
      context.push(`Organize grocery list by these categories: ${preferences.groceryCategories.join(', ')}`);
    }

    // Additional preferences
    if (preferences.additionalPreferences.trim()) {
      context.push(`Additional preferences: ${preferences.additionalPreferences.trim()}`);
    }

    return context.length > 0 
      ? `\n\nUser Preferences:\n${context.map(item => `• ${item}`).join('\n')}` 
      : '';
  }

  /**
   * Clear all preferences (reset to defaults)
   */
  static async clearPreferences(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      await AsyncStorage.removeItem('@theme_preference');
    } catch (error) {
      console.error('Failed to clear preferences:', error);
      throw error;
    }
  }

  /**
   * Generate a unique ID for preferences
   */
  private static generateId(): string {
    return `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export preferences for backup/sharing
   */
  static async exportPreferences(): Promise<string> {
    try {
      const preferences = await this.loadPreferences();
      return JSON.stringify(preferences, null, 2);
    } catch (error) {
      console.error('Failed to export preferences:', error);
      throw error;
    }
  }

  /**
   * Import preferences from backup
   */
  static async importPreferences(preferencesJson: string): Promise<void> {
    try {
      const preferences = JSON.parse(preferencesJson) as UserPreferences;
      
      // Validate the structure
      const validatedPreferences = {
        ...DEFAULT_USER_PREFERENCES,
        ...preferences,
        updatedAt: new Date().toISOString(),
      };
      
      await this.savePreferences(validatedPreferences);
    } catch (error) {
      console.error('Failed to import preferences:', error);
      throw new Error('Invalid preferences format');
    }
  }
}