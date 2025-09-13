// API service for handling recipe generation and data persistence
import {
  RecipeGenerationRequest, RecipeGenerationResponse, RecipeModificationRequest,
  RecipeIdeaGenerationRequest, RecipeIdeasResponse,
  SavedRecipeData, ConversationEntry, RecipeJobCreateResponse, RecipeJobStatus,
  RecipeJobResult, RecipeJobError, PaginatedConversationResponse,
  ShoppingListResponse, AddRecipeToShoppingListRequest, UpdateShoppingListItemRequest
} from '../types/api';
import { PreferencesService } from './preferences';
import { SavedRecipesService } from './savedRecipes';
import AuthService from './auth';

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
   * Get authentication headers for API requests with automatic token refresh
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      const token = await AuthService.getStoredToken();
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('⚠️ Could not retrieve auth token:', error);
    }

    return headers;
  }

  /**
   * Make authenticated request with automatic token refresh on 401
   */
  private async makeAuthenticatedRequest(
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    let headers = await this.getAuthHeaders();
    
    // Merge with provided headers
    if (options.headers) {
      headers = { ...headers, ...options.headers };
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If 401, try to refresh token and retry once
    if (response.status === 401) {
      console.log('🔄 Received 401, attempting token refresh...');
      
      const refreshResult = await AuthService.refreshToken();
      
      if (refreshResult) {
        console.log('✅ Token refreshed, retrying request');
        
        // Update headers with new token
        headers['Authorization'] = `Bearer ${refreshResult.accessToken}`;
        
        // Retry the request with new token
        response = await fetch(url, {
          ...options,
          headers,
        });
      } else {
        console.log('❌ Token refresh failed');
        throw new Error('Authentication expired. Please log in again.');
      }
    }

    return response;
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
   * Modify an existing recipe based on user feedback
   */
  async modifyRecipe(recipeId: string, modificationPrompt: string): Promise<RecipeGenerationResponse> {
    try {
      // Load user preferences for context
      const preferences = await PreferencesService.loadPreferences();

      const request: RecipeModificationRequest = {
        recipeId,
        modificationPrompt,
      };

      // Enhanced request with preferences for better LLM context
      const enhancedRequest = {
        ...request,
        preferences,
      };

      const url = `${this.baseUrl}/api/recipes/modify`;
      console.log('🔄 Making recipe modification request to:', url);
      console.log('📝 Modification request payload:', JSON.stringify(enhancedRequest, null, 2));
      
      const headers = await this.getAuthHeaders();
      console.log('🔑 Using auth headers:', Object.keys(headers));
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(enhancedRequest),
      });
      
      console.log('📡 Modification response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error modifying recipe:', error);
      throw new Error('Failed to modify recipe. Please try again.');
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
   * Get user's conversation history with pagination info
   */
  async getConversationHistoryWithPagination(limit: number = 20, offset: number = 0): Promise<PaginatedConversationResponse> {
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
      return data;
    } catch (error) {
      console.error('Error fetching conversation history with pagination:', error);
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

  /**
   * Generate recipe ideas based on user prompt
   */
  async generateRecipeIdeas(request: RecipeIdeaGenerationRequest): Promise<RecipeIdeasResponse> {
    try {
      // Load user preferences and include them in request
      const preferences = await PreferencesService.loadPreferences();

      const enhancedRequest = {
        ...request,
        preferences,
        count: request.count || 5
      };

      const url = `${this.baseUrl}/api/recipes/generate-ideas`;
      console.log('🚀 Making recipe ideas request to:', url);
      console.log('📝 Request payload:', JSON.stringify(enhancedRequest, null, 2));
      
      const response = await this.makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(enhancedRequest),
      });
      
      console.log('📡 Ideas response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating recipe ideas:', error);
      throw new Error('Failed to generate recipe ideas. Please try again.');
    }
  }

  // ========================================
  // Async Job Processing Methods
  // ========================================

  /**
   * Start async recipe generation job
   */
  async startRecipeGeneration(request: RecipeGenerationRequest): Promise<RecipeJobCreateResponse> {
    try {
      const preferences = await PreferencesService.loadPreferences();

      // Merge prompt-level overrides without persisting changes (same logic as generateRecipe)
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

      const requestWithPrefs = { ...rest, preferences: mergedPreferences };

      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/api/jobs/recipes/generate`, {
        method: 'POST',
        body: JSON.stringify(requestWithPrefs),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const jobResponse: RecipeJobCreateResponse = await response.json();
      console.log('🚀 Started recipe generation job:', jobResponse.job_id);
      return jobResponse;
    } catch (error) {
      console.error('Error starting recipe generation job:', error);
      throw new Error('Failed to start recipe generation. Please try again.');
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<RecipeJobStatus> {
    try {
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/api/jobs/recipes/${jobId}/status`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting job status:', error);
      throw new Error('Failed to get job status. Please try again.');
    }
  }

  /**
   * Get completed job result
   */
  async getJobResult(jobId: string): Promise<RecipeJobResult> {
    try {
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/api/jobs/recipes/${jobId}/result`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting job result:', error);
      throw new Error('Failed to get job result. Please try again.');
    }
  }

  /**
   * Poll job until completion with automatic retries
   * Returns the final recipe when ready
   */
  async pollJobUntilComplete(
    jobId: string, 
    onProgress?: (status: RecipeJobStatus) => void,
    timeoutMs: number = 300000 // 5 minutes default
  ): Promise<RecipeGenerationResponse> {
    const startTime = Date.now();
    const pollInterval = 3000; // 3 seconds
    
    while (true) {
      try {
        // Check for timeout
        if (Date.now() - startTime > timeoutMs) {
          throw new Error('Job polling timeout - recipe generation is taking longer than expected');
        }

        // Get current status
        const status = await this.getJobStatus(jobId);
        
        // Call progress callback if provided
        if (onProgress) {
          onProgress(status);
        }

        // Handle completed job
        if (status.status === 'completed') {
          console.log('✅ Job completed:', jobId);
          const result = await this.getJobResult(jobId);
          
          // Convert to RecipeGenerationResponse format
          return {
            id: result.recipe_id,
            recipe: result.recipe,
            ingredients: result.ingredients,
            generatedAt: result.generated_at,
            userPrompt: result.user_prompt,
            retryCount: result.generation_metadata?.retry_count,
            retryMessage: result.generation_metadata?.retry_message
          };
        }

        // Handle failed job
        if (status.status === 'failed') {
          console.error('❌ Job failed:', status.error_message);
          throw new Error(status.error_message || 'Recipe generation failed');
        }

        // Handle cancelled job
        if (status.status === 'cancelled') {
          throw new Error('Recipe generation was cancelled');
        }

        // Continue polling for pending/processing jobs
        console.log(`⏳ Job ${status.status} (${status.progress}%)`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        console.error('Error during job polling:', error);
        throw error;
      }
    }
  }

  // ========================================
  // Shopping List Methods
  // ========================================

  /**
   * Add a recipe to the user's shopping list
   */
  async addRecipeToShoppingList(recipeId: string): Promise<void> {
    try {
      const request: AddRecipeToShoppingListRequest = {
        recipeId
      };

      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/api/shopping-list/add-recipe`, {
        method: 'POST',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Recipe added to shopping list:', recipeId);
    } catch (error) {
      console.error('Error adding recipe to shopping list:', error);
      throw new Error('Failed to add recipe to shopping list. Please try again.');
    }
  }

  /**
   * Get the user's shopping list
   */
  async getShoppingList(): Promise<ShoppingListResponse> {
    try {
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/api/shopping-list`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching shopping list:', error);
      throw new Error('Failed to load shopping list. Please try again.');
    }
  }

  /**
   * Update a shopping list item's checked status
   */
  async updateShoppingListItem(itemId: string, isChecked: boolean): Promise<void> {
    try {
      const request: UpdateShoppingListItemRequest = {
        itemId,
        isChecked
      };

      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/api/shopping-list/item/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Shopping list item updated:', itemId, isChecked);
    } catch (error) {
      console.error('Error updating shopping list item:', error);
      throw new Error('Failed to update shopping list item. Please try again.');
    }
  }

  /**
   * Clear all items from the shopping list
   */
  async clearShoppingList(): Promise<void> {
    try {
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/api/shopping-list/clear`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Shopping list cleared');
    } catch (error) {
      console.error('Error clearing shopping list:', error);
      throw new Error('Failed to clear shopping list. Please try again.');
    }
  }
}

// Export singleton instance
export const apiService = new APIService();

// Export class for testing or custom instances
export default APIService;
