# Recipe Wizard 🪄

> **Create amazing recipes with just a few words**

Recipe Wizard is a cross-platform mobile application that generates personalized recipes and grocery lists from simple user prompts using a local LLM. Transform casual requests like "creamy chicken pasta with sundried tomatoes" into structured grocery lists and detailed recipes.

## ✨ Features

### Core Features ✅ **IMPLEMENTED**
- **Natural Language Input**: Describe your recipe idea in plain English
- **Smart Grocery Lists**: Organized by category with checkable items
- **Detailed Instructions**: Step-by-step cooking guidance with timing
- **Recipe History**: Complete conversation history and saved favorites
- **Cross-Platform**: Works on iOS, Android, and Web
- **User Preferences**: Comprehensive dietary restrictions and cooking preferences
- **Authentication**: Full user registration and login system

### Advanced Features ✅ **IMPLEMENTED**
- **Profile Management**: Complete user settings and preferences
- **Measurement Units**: Metric/Imperial conversion support
- **Dietary Restrictions**: Vegetarian, vegan, gluten-free, allergen management
- **Recipe Customization**: Default servings, difficulty preferences
- **Grocery Categories**: Customizable ingredient organization
- **Dark/Light Theme**: System-aware theme with manual toggle
- **Offline Support**: Local storage for preferences and saved recipes

## 🛠 Tech Stack

### Frontend (Mobile App) ✅ **COMPLETED**
- **React Native** with **Expo 53** - Cross-platform mobile development
- **TypeScript** - Type-safe development with comprehensive API types
- **Expo Router 5** - File-based navigation with complete user flow
- **Custom Theme System** - Light/dark mode with AsyncStorage persistence
- **Material Community Icons** - Consistent iconography
- **Performance Optimized** - Memoization and proper lifecycle management
- **React Native Paper** - Material Design component library
- **Keyboard Aware ScrollView** - Enhanced keyboard handling

### Backend (API Server) ✅ **OPERATIONAL**
- **FastAPI** - Modern Python web framework with complete API structure
- **PostgreSQL** - Robust relational database with migrations
- **SQLAlchemy** - Python SQL toolkit and ORM
- **Alembic** - Database migration tool (migrations implemented)
- **OpenAI API** - LLM integration for recipe generation
- **JWT** - Secure authentication system
- **Pydantic** - Data validation and serialization
- **Rate Limiting** - Redis-based request throttling
- **CORS** - Configured for mobile app integration

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **Expo CLI** (`npm install -g @expo/cli`)
- **PostgreSQL** (for backend)
- **Ollama** (for local LLM)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RecipeWizard
   ```

2. **Setup Mobile App**
   ```bash
   cd mobile
   npm install
   npm start
   ```

3. **Setup Backend** (Required for full functionality)
   ```bash
   cd backend
   
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # venv\Scripts\activate   # Windows
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Setup environment variables
   cp .env.example .env
   # Edit .env with your PostgreSQL and OpenAI API configuration
   
   # Run database migrations
   alembic upgrade head
   
   # Start the server
   uvicorn app.main:app --reload
   ```

4. **Configure Environment** (Required)
   ```bash
   # Backend .env file
   DATABASE_URL=postgresql://user:password@localhost:5432/recipewizard
   SECRET_KEY=your-secret-key-here
   OPENAI_API_KEY=your-openai-api-key  # For LLM functionality
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   DEBUG=True
   
   # Mobile app environment
   export EXPO_PUBLIC_API_BASE_URL="http://localhost:8000"
   ```

## 📱 Development

### Mobile App Development

```bash
cd mobile

# Start Expo development server
npm start

# Run on specific platforms
npm run android    # Android emulator/device
npm run ios        # iOS simulator/device
npm run web        # Web browser

# Development tools
npx expo start --clear-cache  # Clear cache
npx tsc --noEmit              # Type checking
```

### Backend Development

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Start development server with hot reload
uvicorn app.main:app --reload --port 8000

# Database operations
alembic upgrade head                           # Apply migrations
alembic revision --autogenerate -m "message"  # Create migration
```

## 🏗 Project Structure

```
RecipeWizard/
├── mobile/                    # React Native Expo app ✅ COMPLETED
│   ├── app/                  # Expo Router pages (complete user flow)
│   │   ├── index.tsx         # Welcome screen
│   │   ├── prompt.tsx        # Recipe input screen
│   │   ├── recipe-result.tsx # Recipe display screen
│   │   ├── history.tsx       # Recipe history with saved favorites ✅ NEW
│   │   ├── profile.tsx       # User settings & preferences ✅ NEW
│   │   └── auth/             # Authentication screens
│   │       ├── signin.tsx    # User sign-in
│   │       └── signup.tsx    # User registration
│   ├── components/           # Complete UI component library (12+ components)
│   │   ├── Button.tsx        # Multi-variant button
│   │   ├── TextInput.tsx     # Performance-optimized input
│   │   ├── ExpandableCard.tsx# Collapsible sections
│   │   ├── SavedRecipesSection.tsx ✅ NEW
│   │   ├── AllHistorySection.tsx   ✅ NEW
│   │   ├── CheckboxItem.tsx  # Interactive grocery list items
│   │   └── ...               # Additional specialized components
│   ├── contexts/             # React context providers ✅ NEW
│   │   └── AuthContext.tsx   # Authentication state management
│   ├── constants/            # Theme system and configuration
│   ├── services/             # Complete API client services
│   │   ├── api.ts           # Main API service
│   │   ├── auth.ts          # Authentication services
│   │   ├── preferences.ts   # User preferences management ✅ NEW
│   │   └── savedRecipes.ts  # Recipe saving functionality ✅ NEW
│   ├── types/                # Complete TypeScript definitions
│   │   ├── api.ts           # API types
│   │   └── recipe.ts        # Recipe-specific types
│   └── assets/               # Icons and resources
├── backend/                   # Python FastAPI server ✅ OPERATIONAL
│   ├── app/
│   │   ├── models/           # SQLAlchemy database models
│   │   │   └── base.py      # Base model definitions
│   │   ├── schemas/          # Pydantic API schemas
│   │   │   ├── user.py      # User data validation
│   │   │   ├── conversation.py # Recipe conversation schemas
│   │   │   └── base.py      # Base schema definitions
│   │   ├── routers/          # API endpoint definitions
│   │   │   ├── auth.py      # Authentication endpoints
│   │   │   ├── users.py     # User management
│   │   │   └── recipes.py   # Recipe generation endpoints ✅ NEW
│   │   ├── services/         # Business logic layer
│   │   │   └── llm_service.py # LLM integration service ✅ NEW
│   │   ├── utils/            # Utility functions
│   │   │   └── auth.py      # JWT authentication utilities
│   │   ├── database.py       # Database configuration
│   │   └── main.py           # FastAPI application (comprehensive)
│   ├── alembic/              # Database migrations (implemented)
│   │   └── versions/         # Migration files
│   └── requirements.txt      # Python dependencies (complete)
├── shared/                    # Shared TypeScript types
├── design/                    # UI mockups and design assets
└── docs/                      # Project documentation
```

## 🎨 Design System

The app features a modern dark UI with a subtle magical aesthetic:

- **Colors**: Dark backgrounds with blue accent colors
- **Typography**: Mix of modern sans-serif and elegant serif fonts
- **Icons**: Material Design icons with magical touches
- **Layout**: Clean, spacious design optimized for mobile

Design mockups are available in the `design/examples/` folder.

## 🔮 Core User Experience

1. **Welcome Screen**: Elegant introduction with magical visual elements
2. **Authentication**: Seamless sign-up/sign-in with user account creation
3. **Recipe Input**: Natural language text input with AI-powered suggestions  
4. **Generation**: Real-time recipe and grocery list creation via LLM
5. **Results**: Organized grocery list with checkboxes + detailed cooking instructions
6. **Saving**: One-tap saving to personal recipe collection
7. **History**: Complete recipe history with saved favorites section
8. **Profile**: Comprehensive settings for dietary preferences and customization

## 🚧 Development Status

**✅ Mobile App - FULLY COMPLETED:**
- [x] Complete theme system with light/dark mode and system detection
- [x] Comprehensive component library (12+ reusable components)
- [x] Complete navigation flow (Welcome → Auth → Prompt → Recipe Result → History → Profile)
- [x] Recipe result screen with expandable grocery lists & instructions
- [x] Recipe history screen with saved favorites management
- [x] Comprehensive profile/settings screen with user preferences
- [x] Authentication system with user context management
- [x] Performance optimization and comprehensive error handling
- [x] Complete API service layer with all endpoints
- [x] Full TypeScript type system for all data structures
- [x] Local storage integration for preferences and offline support

**✅ Backend - FULLY OPERATIONAL:**
- [x] Complete FastAPI project structure with error handling
- [x] LLM integration with OpenAI API (switchable to Ollama)
- [x] Full database schema and models with migrations
- [x] Authentication endpoints with JWT token management
- [x] Recipe generation API endpoints with structured responses
- [x] User management and preferences endpoints
- [x] Rate limiting and CORS configuration
- [x] Health check and status monitoring endpoints
- [x] Comprehensive error handling and logging

**✅ Recently Completed Features:**
- [x] Complete recipe history with saved favorites
- [x] Comprehensive user profile and preferences management
- [x] Dietary restrictions and allergen management
- [x] Measurement unit preferences (metric/imperial)
- [x] Customizable grocery categories
- [x] Additional preferences text input for AI personalization
- [x] Recipe saving and unsaving functionality
- [x] Authentication context with persistent login state

**🔄 Optional Future Enhancements:**
- [ ] Push notifications for meal planning
- [ ] Recipe sharing and social features
- [ ] Advanced meal planning calendar
- [ ] Nutrition information integration
- [ ] Recipe scaling and ingredient substitution suggestions
- [ ] Integration with grocery delivery services
- [ ] Voice input for recipe prompts
- [ ] Recipe photo capture and analysis

## 🧪 API Endpoints ✅ **IMPLEMENTED IN SERVICE LAYER**

```typescript
// Authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh

// Recipe Generation  
POST /api/recipes/generate
GET  /api/recipes/history
POST /api/recipes/save
DELETE /api/recipes/{id}

// User Management
GET  /api/users/profile
PUT  /api/users/settings
```

## 🔧 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/recipewizard

# Authentication
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# LLM Integration
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_MODEL=llama2

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
```

### Mobile (Environment Variables)
```bash
# Set in your development environment
export EXPO_PUBLIC_API_BASE_URL="http://localhost:8000"

# Or in app.json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "http://localhost:8000"
    }
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and ensure code quality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Expo** for the excellent React Native development platform
- **FastAPI** for the modern Python web framework
- **Ollama** for local LLM integration
- **Tailwind CSS** for the utility-first CSS framework
- **Material Design** for the component system

---

**Built with ❤️ for home cooks everywhere**