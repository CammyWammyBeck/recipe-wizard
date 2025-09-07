# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Recipe Wizard** is a cross-platform mobile application that generates personalized recipes and grocery lists from simple user prompts using a local LLM. Users input casual requests like "creamy chicken pasta with sundried tomatoes" and receive structured grocery lists (with checkboxes) and detailed recipes.

## Current Project Status

This is a **monorepo structure** with separate mobile and backend folders. The **mobile app core foundation is complete** with a fully functional user interface, navigation flow, and API-ready architecture. The backend directory structure is created and ready for LLM integration.

## Tech Stack

### Current Implementation (Mobile App) ✅ **COMPLETED**
- **React Native** with **Expo 53** (cross-platform iOS/Android)
- **Expo Router 5** for file-based navigation with complete user flow
- **TypeScript** for type safety with comprehensive API types
- **Custom theme system** with light/dark mode support and AsyncStorage persistence
- **Material Community Icons** for consistent iconography
- **Performance-optimized components** with memoization and proper lifecycle management
- **API service layer** ready for backend integration

### Backend Implementation (In Progress)
- **Python FastAPI** backend (basic structure created)
- **PostgreSQL** database for user data persistence
- **Local LLM** integration via Ollama Python client
- **JWT** authentication system
- **SQLAlchemy** ORM with Alembic migrations

## Development Commands

### Mobile App (React Native/Expo)
```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start development server
npm start                           # Expo development server
npm run android                     # Build/run Android
npm run ios                         # Build/run iOS
npm run web                         # Build/run Web

# Development tools
npx expo start --clear-cache        # Clear Expo cache
npx expo install --fix              # Fix dependency versions
npx tsc --noEmit                    # Type checking without build
```

### Backend API (Python FastAPI)
```bash
# Navigate to backend directory
cd backend

# Setup Python environment
python -m venv venv
source venv/bin/activate            # Linux/Mac
# venv\Scripts\activate             # Windows

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Database migrations (when implemented)
alembic upgrade head
alembic revision --autogenerate -m "Description"
```

## Project Structure

```
RecipeWizard/
├── mobile/                        # React Native Expo app ✅ COMPLETED
│   ├── app/                      # Expo Router pages
│   │   ├── _layout.tsx           # Root navigation layout
│   │   ├── index.tsx             # Welcome screen
│   │   ├── prompt.tsx            # Recipe prompt input screen
│   │   ├── recipe-result.tsx     # Recipe result with ingredients & instructions
│   │   └── auth/                 # Authentication screens
│   │       ├── signin.tsx        # Sign in screen
│   │       └── signup.tsx        # Sign up screen
│   ├── assets/                   # Static assets (icons, images)
│   ├── components/               # Reusable UI components ✅ COMPLETED
│   │   ├── Button.tsx            # Multi-variant button component
│   │   ├── TextInput.tsx         # Performance-optimized input
│   │   ├── ExpandableCard.tsx    # Collapsible card sections
│   │   ├── CheckboxItem.tsx      # Grocery list checkboxes
│   │   ├── InstructionStep.tsx   # Recipe instruction steps
│   │   ├── IngredientsSection.tsx # Categorized grocery list
│   │   └── RecipeSection.tsx     # Recipe display with metadata
│   ├── constants/                # App constants and config ✅ COMPLETED
│   │   ├── theme.ts              # Theme system constants
│   │   └── ThemeProvider.tsx     # Theme context with persistence
│   ├── types/                    # TypeScript type definitions ✅ COMPLETED
│   │   └── api.ts                # API response and request types
│   ├── services/                 # API client functions ✅ COMPLETED
│   │   └── api.ts                # Complete API service layer
│   ├── package.json              # Mobile app dependencies
│   ├── app.json                  # Expo configuration
│   ├── tsconfig.json             # TypeScript configuration
│   └── tailwind.config.js        # TailwindCSS configuration
├── backend/                       # Python FastAPI server
│   ├── app/                      # FastAPI application
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI entry point
│   │   ├── models/               # SQLAlchemy database models
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── routers/              # API endpoint definitions
│   │   ├── services/             # Business logic layer
│   │   └── utils/                # Utility functions
│   ├── alembic/                  # Database migration management
│   ├── requirements.txt          # Python dependencies
│   └── .env.example             # Environment variables template
├── shared/                        # Shared resources between frontend/backend
│   └── types.ts                  # Common TypeScript interfaces (to be created)
├── design/                        # Design mockups and assets
│   └── examples/                 # HTML design examples
├── docs/                          # Project documentation (to be created)
├── CLAUDE.md                      # Claude Code instructions
└── README.md                      # Project documentation
```

## Core Architecture ✅ **IMPLEMENTED**

### User Flow ✅ **COMPLETE**
1. **Welcome Screen**: Magical onboarding with theme toggle and "Get Started" button
2. **Authentication**: Sign in/sign up screens with consistent wizard branding
3. **Prompt Entry**: Enhanced input screen with suggestions and character counter
4. **Recipe Generation**: Loading state with 2-second simulation (ready for LLM integration)
5. **Recipe Display**: Expandable sections showing grocery list + recipe instructions
6. **Interactive Features**: Checkable grocery items organized by store categories

### Current Navigation Structure ✅ **IMPLEMENTED**
```
app/
├── _layout.tsx            # Root stack navigation
├── index.tsx              # Welcome screen
├── prompt.tsx             # Recipe prompt input
├── recipe-result.tsx      # Recipe result display
└── auth/                  # Authentication flow
    ├── signin.tsx         # Sign in screen  
    └── signup.tsx         # Sign up screen
```

### Navigation Features ✅ **COMPLETE**
- **Custom headers** with recipe titles instead of route names
- **Navigation parameters** for passing data between screens
- **Back navigation** with proper state management
- **Theme consistency** across all screens
- **Safe area handling** for mobile devices

## Configuration

### Expo Configuration (app.json)
- **Name**: "RecipeWizard"
- **Slug**: "RecipeWizard"
- **Scheme**: "recipe-wizard"
- **New Architecture**: Enabled (React Native New Architecture)
- **Plugins**: expo-router, expo-secure-store

### Environment Variables
- `EXPO_PUBLIC_API_BASE_URL` - Backend API endpoint (defaults to http://localhost:8000)
- `LLM_SERVICE_URL` - Local LLM service endpoint (for backend)

## Development Workflow

### Current Development Status ✅ **MOBILE APP COMPLETE**
1. ✅ **Core UI Components**: Complete component library with theme system
2. ✅ **Navigation Structure**: Full authentication and recipe generation flow
3. ✅ **Mock Data Integration**: Production-ready mock system for development
4. ✅ **State Management**: Theme persistence and ingredient checkbox states
5. ✅ **API Architecture**: Complete service layer ready for backend integration

### Next Development Phases (Backend Focus)
1. **LLM Backend**: Implement FastAPI backend with Ollama integration
2. **Database Setup**: PostgreSQL schemas for users, recipes, and conversations  
3. **Authentication API**: JWT endpoints matching frontend auth screens
4. **Recipe Generation API**: LLM prompt processing and structured response parsing
5. **Tab Navigation**: Add History, Saved Recipes, and Settings screens

### Testing
- Manual testing on Expo development client
- Test on both iOS and Android platforms
- Web platform testing for broader accessibility

## Key Features Status

### Phase 1: Core UI & Navigation ✅ **COMPLETED**
- ✅ Complete navigation structure with authentication flow
- ✅ Recipe prompt input interface with suggestions and validation
- ✅ Advanced grocery list and recipe display components
- ✅ Loading states, error handling, and performance optimization
- ✅ Theme system with light/dark mode support
- ✅ Expandable card sections with smooth animations

### Phase 2: Authentication & User Management 🔄 **UI READY**
- ✅ User registration and login screens with consistent branding
- 🔄 JWT token management with Expo Secure Store (backend needed)
- 🔄 Protected route navigation (backend integration needed)

### Phase 3: Recipe Generation Core ✅ **ARCHITECTURE READY**
- 🔄 Backend API integration (service layer implemented, backend needed)
- 🔄 LLM prompt processing (mock data system ready for replacement)
- ✅ Grocery list with checkable items organized by categories
- ✅ Recipe instruction display with metadata and tips
- ✅ Response parsing and formatting (TypeScript types implemented)

### Phase 4: Data Persistence 📋 **PLANNED**
- 📋 Conversation history storage (API endpoints defined)
- 📋 Recipe saving/favoriting functionality (UI components ready)
- 📋 User preferences and settings (theme persistence implemented)
- 📋 Cross-device synchronization

## Styling Guidelines

### NativeWind + React Native Paper Integration
- Use **NativeWind classes** for layout and spacing: `flex-1`, `p-4`, `mb-2`
- Use **React Native Paper** components for interactive elements: `Button`, `TextInput`, `Card`
- Follow **Material Design 3** principles through React Native Paper theming
- Ensure accessibility with proper `accessibilityLabel` and `accessibilityHint`

### Color Scheme
- Primary: Material Design default (customizable via theme)
- Background: Clean whites and light grays
- Text: High contrast for readability

## Backend Integration (Future)

### API Endpoints (Planned)
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

### Data Models (Planned)
- **User**: Authentication and profile data
- **Conversation**: Recipe generation history
- **SavedRecipe**: User's favorite recipes
- **UserSettings**: Preferences and dietary restrictions

## Testing and Debugging

### Development Testing
- Use **Expo Development Build** for testing native features
- Test on multiple screen sizes and orientations
- Validate accessibility features with screen readers

### Error Handling
- Network connectivity issues
- LLM service unavailability
- Malformed API responses
- User authentication errors

## Deployment (Future)

### Mobile App Distribution
- **iOS**: App Store distribution via Expo Application Services (EAS)
- **Android**: Google Play Store via EAS Build
- **Development**: Expo Development Client for internal testing

### Backend Deployment
- **API Server**: Railway, Heroku, or dedicated VPS
- **Database**: PostgreSQL on Heroku, Railway, or managed service
- **LLM Service**: Local deployment with Ollama

## Success Metrics

- **Primary**: Users can successfully generate and save recipes from natural language prompts
- **Secondary**: Grocery lists are accurately categorized and useful for shopping
- **Tertiary**: User preferences improve recipe relevance over time
- **Technical**: App maintains 60fps performance and <3s recipe generation time

---

*This document should be updated as the project evolves and requirements become clearer through development and user feedback.*