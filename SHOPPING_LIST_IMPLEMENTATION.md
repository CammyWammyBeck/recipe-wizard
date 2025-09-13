# Shopping List Backend Implementation

## Overview

This document describes the backend implementation of the combined shopping list feature for the Recipe Wizard application. The shopping list allows users to add recipes and automatically consolidates ingredients from multiple recipes into a unified shopping list.

## Architecture

### Database Models

#### 1. ShoppingList
- **Purpose**: Represents a user's shopping list
- **Key Fields**:
  - `user_id`: Links to the user who owns the list
  - `name`: Name of the shopping list (default: "My Shopping List")
  - `is_active`: Boolean flag for active lists
- **Relationships**: One-to-many with ShoppingListItem

#### 2. ShoppingListItem
- **Purpose**: Individual items in a shopping list with consolidated quantities
- **Key Fields**:
  - `ingredient_name`: Name of the ingredient
  - `category`: Grocery store category (produce, meat, dairy, etc.)
  - `consolidated_display`: Human-readable total amount (e.g., "2 cups + 1/2 cup")
  - `is_checked`: Whether the user has checked off this item
- **Relationships**: One-to-many with ShoppingListRecipeBreakdown

#### 3. ShoppingListRecipeBreakdown
- **Purpose**: Tracks how much of each ingredient comes from which recipe
- **Key Fields**:
  - `recipe_title`: Name of the recipe (denormalized for performance)
  - `quantity`: Original quantity needed for this specific recipe
  - `recipe_id`: Reference to the recipe
  - `original_ingredient_id`: Reference to the original recipe ingredient

#### 4. ShoppingListRecipeAssociation
- **Purpose**: Tracks which recipes have been added to a shopping list
- **Key Fields**:
  - `recipe_id`: The recipe that was added
  - `servings_used`: How many servings were added (for scaling)
  - `added_at`: Timestamp when recipe was added

### API Endpoints

#### GET /api/shopping-list/
Returns the user's shopping list with all consolidated items and recipe breakdowns.

**Response Format:**
```json
{
  "items": [
    {
      "id": "123",
      "ingredientName": "chicken breast",
      "category": "butchery",
      "consolidatedDisplay": "2 lbs + 500g",
      "recipeBreakdown": [
        {
          "recipeId": "1",
          "recipeTitle": "Chicken Parmesan",
          "quantity": "2 lbs"
        },
        {
          "recipeId": "2",
          "recipeTitle": "Chicken Stir Fry",
          "quantity": "500g"
        }
      ],
      "isChecked": false
    }
  ],
  "lastUpdated": "2025-09-13T18:30:00Z"
}
```

#### POST /api/shopping-list/add-recipe
Adds a recipe's ingredients to the shopping list.

**Request Body:**
```json
{
  "recipe_id": "1",
  "servings_override": 4
}
```

**Features:**
- Automatically scales ingredient quantities based on servings
- Consolidates with existing ingredients of the same name and category
- Creates breakdown entries to track which recipe contributed what

#### PUT /api/shopping-list/items/{item_id}
Updates the checked status of a shopping list item.

**Request Body:**
```json
{
  "item_id": "123",
  "is_checked": true
}
```

#### DELETE /api/shopping-list/clear
Clears all items from the shopping list.

#### DELETE /api/shopping-list/recipes/{recipe_id}
Removes a specific recipe's contribution from the shopping list.

### Business Logic (ShoppingListService)

#### Ingredient Consolidation
The service handles complex ingredient consolidation logic:

1. **Same Ingredient Detection**: Matches ingredients by name and category
2. **Quantity Scaling**: Automatically scales quantities based on servings
3. **Unit Consolidation**: Attempts to combine quantities with the same units
4. **Fallback Display**: Shows breakdown format when consolidation isn't possible

#### Quantity Scaling Algorithm
```python
def _scale_quantity(amount: str, target_servings: int, original_servings: int) -> str:
    # Handles fractions (1/2, 3/4)
    # Handles decimals (2.5, 0.75)
    # Handles whole numbers (2, 3)
    # Returns scaled amount maintaining precision
```

#### Consolidation Examples
- **Simple Addition**: "1 cup" + "1 cup" = "2 cups"
- **Mixed Units**: "2 lbs" + "500g" = "2 lbs + 500g"
- **Fractions**: "1/2 cup" + "1/4 cup" = "3/4 cup"

### Mobile App Integration

The backend APIs are designed to match the existing mobile app's TypeScript interfaces:

- `ShoppingListItem`: Maps directly to mobile `ShoppingListItem` type
- `ShoppingListResponseSchema`: Provides `items` array and `lastUpdated` timestamp
- Checkbox state persistence across app sessions
- Offline support through caching (handled by mobile app)

## Implementation Highlights

### 1. Performance Optimizations
- Denormalized recipe titles in breakdown table for faster queries
- Indexed ingredient names and categories for quick searching
- Batch operations for recipe additions

### 2. Data Integrity
- Foreign key constraints ensure referential integrity
- Cascade deletes prevent orphaned records
- Transaction handling for multi-step operations

### 3. Scalability Considerations
- Shopping lists are user-scoped for multi-tenancy
- Lazy loading of recipe breakdowns
- Efficient queries using SQLAlchemy relationships

### 4. Error Handling
- Validates recipe existence before adding to shopping list
- Prevents duplicate recipe additions
- Graceful handling of malformed quantities
- User-friendly error messages

## Database Schema

```sql
CREATE TABLE shopping_lists (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL DEFAULT 'My Shopping List',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE shopping_list_items (
    id INTEGER PRIMARY KEY,
    shopping_list_id INTEGER REFERENCES shopping_lists(id),
    ingredient_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    consolidated_display VARCHAR(200) NOT NULL,
    is_checked BOOLEAN NOT NULL DEFAULT false,
    consolidation_metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE shopping_list_recipe_breakdowns (
    id INTEGER PRIMARY KEY,
    shopping_item_id INTEGER REFERENCES shopping_list_items(id),
    recipe_id INTEGER REFERENCES recipes(id),
    original_ingredient_id INTEGER REFERENCES recipe_ingredients(id),
    recipe_title VARCHAR(500) NOT NULL,
    quantity VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE shopping_list_recipe_associations (
    id INTEGER PRIMARY KEY,
    shopping_list_id INTEGER REFERENCES shopping_lists(id),
    recipe_id INTEGER REFERENCES recipes(id),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    servings_used INTEGER
);
```

## Testing

The implementation includes a test script (`test_shopping_list.py`) that verifies:
- Empty shopping list retrieval
- Recipe addition with ingredient consolidation
- Shopping list clearing functionality

## Future Enhancements

1. **Smart Categorization**: AI-powered ingredient categorization
2. **Store Integration**: Map categories to specific grocery store layouts
3. **Price Estimation**: Integrate with grocery pricing APIs
4. **Smart Lists**: Auto-generate shopping lists from meal plans
5. **Sharing**: Allow users to share shopping lists with family members

## Dependencies

- **FastAPI**: Web framework for API endpoints
- **SQLAlchemy**: ORM for database operations
- **Pydantic**: Data validation and serialization
- **Alembic**: Database migrations (when working)

## Deployment Notes

1. Run database migration to create tables: `python create_shopping_tables.py`
2. Ensure all model imports are working properly
3. Start FastAPI server: `uvicorn app.main:app --reload`
4. Test endpoints using the provided test script

The shopping list feature is now fully implemented and ready for integration with the mobile app's existing UI components.