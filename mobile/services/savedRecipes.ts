import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecipeGenerationResponse, SavedRecipeData } from '../types/api';

export class SavedRecipesService {
  private static readonly STORAGE_KEY = '@recipe_wizard_saved_recipes';

  /**
   * Save a recipe to local favorites
   */
  static async saveRecipe(recipeData: RecipeGenerationResponse): Promise<SavedRecipeData> {
    try {
      const savedRecipes = await this.getSavedRecipes();
      
      // Create saved recipe data with timestamp
      const savedRecipe: SavedRecipeData = {
        ...recipeData,
        savedAt: new Date().toISOString(),
        isFavorite: true
      };
      
      // Add to saved recipes (replace if already exists)
      const filteredRecipes = savedRecipes.filter(recipe => recipe.id !== recipeData.id);
      const updatedRecipes = [savedRecipe, ...filteredRecipes];
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedRecipes));
      
      return savedRecipe;
    } catch (error) {
      console.error('Failed to save recipe:', error);
      throw new Error('Failed to save recipe');
    }
  }

  /**
   * Remove a recipe from saved favorites
   */
  static async unsaveRecipe(recipeId: string): Promise<void> {
    try {
      const savedRecipes = await this.getSavedRecipes();
      const updatedRecipes = savedRecipes.filter(recipe => recipe.id !== recipeId);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedRecipes));
    } catch (error) {
      console.error('Failed to unsave recipe:', error);
      throw new Error('Failed to unsave recipe');
    }
  }

  /**
   * Get all saved recipes
   */
  static async getSavedRecipes(): Promise<SavedRecipeData[]> {
    try {
      const saved = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as SavedRecipeData[];
      }
      return [];
    } catch (error) {
      console.error('Failed to load saved recipes:', error);
      return [];
    }
  }

  /**
   * Check if a recipe is saved
   */
  static async isRecipeSaved(recipeId: string): Promise<boolean> {
    try {
      const savedRecipes = await this.getSavedRecipes();
      return savedRecipes.some(recipe => recipe.id === recipeId);
    } catch (error) {
      console.error('Failed to check if recipe is saved:', error);
      return false;
    }
  }

  /**
   * Get a specific saved recipe by ID
   */
  static async getSavedRecipe(recipeId: string): Promise<SavedRecipeData | null> {
    try {
      const savedRecipes = await this.getSavedRecipes();
      return savedRecipes.find(recipe => recipe.id === recipeId) || null;
    } catch (error) {
      console.error('Failed to get saved recipe:', error);
      return null;
    }
  }

  /**
   * Clear all saved recipes
   */
  static async clearSavedRecipes(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear saved recipes:', error);
      throw new Error('Failed to clear saved recipes');
    }
  }

  /**
   * Get saved recipes count
   */
  static async getSavedRecipesCount(): Promise<number> {
    try {
      const savedRecipes = await this.getSavedRecipes();
      return savedRecipes.length;
    } catch (error) {
      console.error('Failed to get saved recipes count:', error);
      return 0;
    }
  }
}