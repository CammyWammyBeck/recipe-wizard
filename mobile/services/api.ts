// API service for handling recipe generation and data persistence
import { RecipeGenerationRequest, RecipeGenerationResponse, SavedRecipeData, ConversationEntry } from '../types/api';
import { PreferencesService } from './preferences';
import * as SecureStore from 'expo-secure-store';

// Configuration - Multiple fallback options for different environments
const getApiBaseUrl = () => {
  // Environment variable takes priority
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  
  // Try different URLs based on platform
  const possibleUrls = [
    'http://192.168.20.7:8000',  // Your local network IP
    'http://localhost:8000',     // Local development
    'http://127.0.0.1:8000',     // Localhost alternative
    'http://10.0.2.2:8000',      // Android emulator
  ];
  
  return possibleUrls[0]; // Default to network IP
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
      // Load user preferences to enhance the prompt
      const preferences = await PreferencesService.loadPreferences();
      const preferencesContext = PreferencesService.generatePromptContext(preferences);
      
      // Enhance the request with user preferences
      const enhancedRequest = {
        ...request,
        prompt: request.prompt + preferencesContext,
        preferences: preferences,
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
      const response = await fetch(`${this.baseUrl}/api/recipes/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication headers
        },
        body: JSON.stringify(recipeData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error saving recipe:', error);
      throw new Error('Failed to save recipe. Please try again.');
    }
  }

  /**
   * Get user's conversation history
   */
  async getConversationHistory(limit: number = 20, offset: number = 0): Promise<ConversationEntry[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/recipes/history?limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw new Error('Failed to load conversation history. Please try again.');
    }
  }

  /**
   * Get user's saved recipes
   */
  async getSavedRecipes(limit: number = 20, offset: number = 0): Promise<SavedRecipeData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/recipes/saved?limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching saved recipes:', error);
      throw new Error('Failed to load saved recipes. Please try again.');
    }
  }

  /**
   * Delete a saved recipe
   */
  async deleteRecipe(recipeId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          // TODO: Add authentication headers
        },
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