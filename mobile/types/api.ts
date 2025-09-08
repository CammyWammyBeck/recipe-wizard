// API Response Types for LLM-generated recipe data

export interface APIIngredient {
  id?: string; // Will be generated on frontend if not provided
  name: string;
  amount: string;
  unit?: string;
  category: 'produce' | 'butchery' | 'dry-goods' | 'chilled' | 'frozen' | 'pantry';
}

export interface APIRecipe {
  title: string;
  description?: string;
  instructions: string[];
  prepTime?: number; // in minutes
  cookTime?: number; // in minutes
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tips?: string[];
}

export interface RecipeGenerationRequest {
  prompt: string;
  userId?: string; // For authenticated users
}

export interface RecipeGenerationResponse {
  id: string; // Generated recipe ID
  recipe: APIRecipe;
  ingredients: APIIngredient[];
  generatedAt: string; // ISO timestamp
  userPrompt: string; // Original user prompt
  retryCount?: number; // Number of retries needed
  retryMessage?: string; // Message shown during retries
}

// For saving/loading recipes
export interface SavedRecipeData extends RecipeGenerationResponse {
  savedAt: string;
  isFavorite?: boolean;
}

// For conversation history
export interface ConversationEntry {
  id: string;
  userPrompt: string;
  response: RecipeGenerationResponse;
  createdAt: string;
}

// User preferences for LLM customization
export interface UserPreferences {
  id?: string;
  userId?: string;
  
  // Unit preferences
  units: 'metric' | 'imperial';
  
  // Grocery list categories (user can add/remove)
  groceryCategories: string[];
  
  // Recipe preferences
  defaultServings: number;
  preferredDifficulty?: 'easy' | 'medium' | 'hard';
  maxCookTime?: number; // in minutes
  maxPrepTime?: number; // in minutes
  
  // Dietary restrictions/preferences
  dietaryRestrictions: string[]; // ['vegetarian', 'gluten-free', 'dairy-free', etc.]
  allergens: string[]; // ['nuts', 'shellfish', 'eggs', etc.]
  dislikes: string[]; // ingredients user doesn't like
  
  // Free-text preferences
  additionalPreferences: string;
  
  // UI preferences
  themePreference: 'light' | 'dark' | 'system';
  
  updatedAt: string;
  createdAt: string;
}

// Default grocery categories
export const DEFAULT_GROCERY_CATEGORIES = [
  'produce',
  'butchery', 
  'dry-goods',
  'chilled',
  'frozen',
  'pantry',
  'bakery',
  'deli',
  'beverages',
  'spices'
] as const;

// Default user preferences
export const DEFAULT_USER_PREFERENCES: Omit<UserPreferences, 'id' | 'userId' | 'updatedAt' | 'createdAt'> = {
  units: 'metric',
  groceryCategories: [...DEFAULT_GROCERY_CATEGORIES],
  defaultServings: 4,
  dietaryRestrictions: [],
  allergens: [],
  dislikes: [],
  additionalPreferences: '',
  themePreference: 'system',
};