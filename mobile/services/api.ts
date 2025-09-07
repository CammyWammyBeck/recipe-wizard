// API service for handling recipe generation and data persistence
import { RecipeGenerationRequest, RecipeGenerationResponse, SavedRecipeData, ConversationEntry } from '../types/api';

// Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

class APIService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate a new recipe from user prompt
   */
  async generateRecipe(request: RecipeGenerationRequest): Promise<RecipeGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/recipes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication headers when implemented
          // 'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(request),
      });

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