import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences, DEFAULT_USER_PREFERENCES } from '../types/api';
import { API_BASE_URL } from './config';
import AuthService from './auth';

// Shape of the backend /api/users/preferences payload (snake_case)
interface BackendPreferences {
  units?: string;
  grocery_categories?: string[];
  default_servings?: number;
  preferred_difficulty?: string | null;
  max_cook_time?: number | null;
  max_prep_time?: number | null;
  dietary_restrictions?: string[];
  allergens?: string[];
  dislikes?: string[];
  additional_preferences?: string;
  theme_preference?: string;
}

function toBackend(prefs: UserPreferences): BackendPreferences {
  return {
    units: prefs.units,
    grocery_categories: prefs.groceryCategories,
    default_servings: prefs.defaultServings,
    preferred_difficulty: prefs.preferredDifficulty ?? null,
    max_cook_time: prefs.maxCookTime ?? null,
    max_prep_time: prefs.maxPrepTime ?? null,
    dietary_restrictions: prefs.dietaryRestrictions,
    allergens: prefs.allergens,
    dislikes: prefs.dislikes,
    additional_preferences: prefs.additionalPreferences,
    theme_preference: prefs.themePreference,
  };
}

function fromBackend(payload: BackendPreferences): Partial<UserPreferences> {
  const mapped: Partial<UserPreferences> = {};
  if (payload.units === 'metric' || payload.units === 'imperial') mapped.units = payload.units;
  if (Array.isArray(payload.grocery_categories)) mapped.groceryCategories = payload.grocery_categories;
  if (typeof payload.default_servings === 'number') mapped.defaultServings = payload.default_servings;
  if (payload.preferred_difficulty === 'easy' || payload.preferred_difficulty === 'medium' || payload.preferred_difficulty === 'hard') {
    mapped.preferredDifficulty = payload.preferred_difficulty;
  }
  if (typeof payload.max_cook_time === 'number') mapped.maxCookTime = payload.max_cook_time;
  if (typeof payload.max_prep_time === 'number') mapped.maxPrepTime = payload.max_prep_time;
  if (Array.isArray(payload.dietary_restrictions)) mapped.dietaryRestrictions = payload.dietary_restrictions;
  if (Array.isArray(payload.allergens)) mapped.allergens = payload.allergens;
  if (Array.isArray(payload.dislikes)) mapped.dislikes = payload.dislikes;
  if (typeof payload.additional_preferences === 'string') mapped.additionalPreferences = payload.additional_preferences;
  if (payload.theme_preference === 'light' || payload.theme_preference === 'dark' || payload.theme_preference === 'system') {
    mapped.themePreference = payload.theme_preference;
  }
  return mapped;
}

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
   * Pull preferences from the backend and merge into local storage.
   *
   * Called after auth so a freshly-installed app picks up the user's saved
   * allergens, dietary restrictions, etc. Silently no-ops when offline or
   * unauthenticated — the local copy remains the source of truth in that case.
   */
  static async syncFromBackend(): Promise<UserPreferences | null> {
    try {
      const token = await AuthService.getStoredToken();
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/api/users/preferences`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        return null;
      }

      const payload: BackendPreferences = await response.json();
      const mapped = fromBackend(payload);

      const local = await this.loadPreferences();
      const merged: UserPreferences = {
        ...local,
        ...mapped,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
      if (merged.themePreference) {
        await AsyncStorage.setItem('@theme_preference', merged.themePreference);
      }

      return merged;
    } catch (error) {
      console.warn('⚠️ Preferences sync from backend failed (non-fatal):', error);
      return null;
    }
  }

  /**
   * Push preferences to the backend. Fire-and-forget — failures are logged
   * but do not interrupt the UI, since the local copy is already persisted.
   */
  static async saveToBackend(preferences: UserPreferences): Promise<void> {
    try {
      const token = await AuthService.getStoredToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/users/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(toBackend(preferences)),
      });

      if (!response.ok) {
        console.warn(`⚠️ Preferences save to backend returned ${response.status}`);
      }
    } catch (error) {
      console.warn('⚠️ Preferences save to backend failed (non-fatal):', error);
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