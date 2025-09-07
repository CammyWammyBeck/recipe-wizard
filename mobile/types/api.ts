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