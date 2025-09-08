// API service for handling recipe generation and data persistence
import { RecipeGenerationRequest, RecipeGenerationResponse, SavedRecipeData, ConversationEntry } from '../types/api';
import { PreferencesService } from './preferences';
import { SavedRecipesService } from './savedRecipes';
import * as SecureStore from 'expo-secure-store';

// Configuration - Uses environment variable
const getApiBaseUrl = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  
  if (!apiUrl) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL environment variable is required. ' +
      'Please create a .env file in the mobile directory with: ' +
      'EXPO_PUBLIC_API_BASE_URL=http://YOUR_LOCAL_IP:8000'
    );
  }
  
  return apiUrl;
};

const API_BASE_URL = getApiBaseUrl();

class APIService {
  public baseUrl: string;  // Made public so AuthService can access it

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    console.log('🔧 API Service initialized with URL:', this.baseUrl);
  }

  /**
   * Get authentication headers for API requests
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('⚠️ Could not retrieve auth token:', error);
    }

    return headers;
  }

  /**
   * Generate a new recipe from user prompt
   */
  async generateRecipe(request: RecipeGenerationRequest): Promise<RecipeGenerationResponse> {
    try {
      // Load user preferences and send them to backend for LLM processing
      const preferences = await PreferencesService.loadPreferences();

      // Merge prompt-level overrides without persisting changes
      const { overrides, ...rest } = request as RecipeGenerationRequest & { overrides?: any };
      const mergedPreferences = {
        ...preferences,
        ...(overrides?.defaultServings !== undefined
          ? { defaultServings: overrides.defaultServings }
          : {}),
        ...(overrides?.preferredDifficulty !== undefined
          ? { preferredDifficulty: overrides.preferredDifficulty }
          : {}),
      };

      // Final payload sent to backend
      const enhancedRequest = {
        ...rest,
        preferences: mergedPreferences,
      };

      const url = `${this.baseUrl}/api/recipes/generate`;
      console.log('🚀 Making API request to:', url);
      console.log('📝 Request payload:', JSON.stringify(enhancedRequest, null, 2));
      
      const headers = await this.getAuthHeaders();
      console.log('🔑 Using auth headers:', Object.keys(headers));
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(enhancedRequest),
      });
      
      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating recipe:', error);
      throw new Error('Failed to generate recipe. Please try again.');
    }
  }

  /**
   * Get a specific recipe by ID
   */
  async getRecipe(recipeId: string): Promise<RecipeGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/recipes/${recipeId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching recipe:', error);
      throw new Error('Failed to load recipe. Please try again.');
    }
  }

  /**
   * Save a recipe to user's favorites
   */
  async saveRecipe(recipeData: RecipeGenerationResponse): Promise<SavedRecipeData> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/recipes/save/${recipeData.id}`, {
        method: 'POST',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Return the recipe data with saved metadata
      return {
        ...recipeData,
        savedAt: new Date().toISOString(),
        isFavorite: true
      };
    } catch (error) {
      console.error('Error saving recipe:', error);
      throw new Error('Failed to save recipe. Please try again.');
    }
  }

  /**
   * Remove a recipe from user's favorites
   */
  async unsaveRecipe(recipeId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/recipes/saved/${recipeId}`, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error unsaving recipe:', error);
      throw new Error('Failed to unsave recipe. Please try again.');
    }
  }

  /**
   * Check if a recipe is saved
   */
  async isRecipeSaved(recipeId: string): Promise<boolean> {
    try {
      const savedRecipes = await this.getSavedRecipes();
      return savedRecipes.some(recipe => recipe.id === recipeId);
    } catch (error) {
      console.error('Error checking if recipe is saved:', error);
      return false;
    }
  }

  /**
   * Get all saved recipes
   */
  async getSavedRecipes(): Promise<SavedRecipeData[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/recipes/saved`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.recipes || [];
    } catch (error) {
      console.error('Error fetching saved recipes:', error);
      throw new Error('Failed to load saved recipes. Please try again.');
    }
  }

  /**
   * Get user's conversation history
   */
  async getConversationHistory(limit: number = 20, offset: number = 0): Promise<ConversationEntry[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/recipes/history?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.recipes || [];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw new Error('Failed to load conversation history. Please try again.');
    }
  }

  /**
   * Delete a saved recipe
   */
  async deleteRecipe(recipeId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw new Error('Failed to delete recipe. Please try again.');
    }
  }

  /**
   * Check API health/connectivity
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000, // 5 second timeout
      } as any);
      
      return response.ok;
    } catch (error) {
      console.warn('API health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const apiService = new APIService();

// Export class for testing or custom instances
export default APIService;
