// Recipe and ingredient data types
export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit?: string;
  category?: string;
  checked?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime?: number; // in minutes
  cookTime?: number; // in minutes
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeGeneration {
  id: string;
  prompt: string;
  recipe: Recipe;
  createdAt: Date;
}

// User and app state types
export interface User {
  id: string;
  email: string;
  name: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  dietaryRestrictions?: string[];
  favoriteIngredients?: string[];
  dislikedIngredients?: string[];
  defaultServings?: number;
  units?: 'metric' | 'imperial';
}

// Navigation and UI types
export interface GroceryListItem extends Ingredient {
  checked: boolean;
}

export interface ConversationHistory {
  id: string;
  prompt: string;
  recipe: Recipe;
  timestamp: Date;
}

export interface SavedRecipe {
  id: string;
  recipe: Recipe;
  savedAt: Date;
  notes?: string;
}