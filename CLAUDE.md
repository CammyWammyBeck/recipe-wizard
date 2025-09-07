# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Recipe Wizard** is a cross-platform mobile application that generates personalized recipes and grocery lists from simple user prompts using a local LLM. Users input casual requests like "creamy chicken pasta with sundried tomatoes" and receive structured grocery lists (with checkboxes) and detailed recipes.

## Current Project Status

This is a **monorepo structure** with separate mobile and backend folders. The project is currently in early development with the mobile app having basic navigation structure implemented and backend directory structure created.

## Tech Stack

### Current Implementation (Mobile App)
- **React Native** with **Expo 53** (cross-platform iOS/Android)
- **Expo Router 5** for file-based navigation
- **TypeScript** for type safety
- **NativeWind 4** for Tailwind CSS styling
- **React Native Paper 5** for UI components
- **Expo AuthSession** for future authentication flows
- **Expo Secure Store** for secure data storage

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
├── mobile/                        # React Native Expo app
│   ├── app/                      # Expo Router pages
│   │   ├── _layout.tsx           # Root navigation layout
│   │   └── index.tsx             # Home screen (Recipe Wizard)
│   ├── assets/                   # Static assets (icons, images)
│   ├── components/               # Reusable UI components (to be created)
│   ├── constants/                # App constants and config (to be created)
│   ├── hooks/                    # Custom React hooks (to be created)
│   ├── types/                    # TypeScript type definitions (to be created)
│   ├── services/                 # API client functions (to be created)
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

## Core Architecture (Planned)

### User Flow
1. **Prompt Entry**: User enters simple recipe request in natural language
2. **LLM Processing**: Backend sends prompt + custom instructions to local LLM
3. **Response Formatting**: Backend parses LLM response into structured data
4. **Display**: App shows formatted grocery list with checkboxes + recipe instructions
5. **Save Options**: User can save recipe to favorites or view in conversation history

### Navigation Structure (Planned)
```
(tabs)/
├── index.tsx              # New Recipe (main prompt input)
├── history.tsx           # Conversation history
├── saved.tsx             # Saved recipes
└── settings.tsx          # User preferences

(auth)/
├── login.tsx             # User login
└── register.tsx          # User registration

recipe/
└── [id].tsx             # Individual recipe view

conversation/
└── [id].tsx             # Individual conversation view
```

## Configuration

### Expo Configuration (app.json)
- **Name**: "RecipeWizard"
- **Slug**: "RecipeWizard"
- **Scheme**: "recipe-wizard"
- **New Architecture**: Enabled (React Native New Architecture)
- **Plugins**: expo-router, expo-secure-store

### Environment Variables (Future)
- `API_BASE_URL` - Backend API endpoint
- `LLM_SERVICE_URL` - Local LLM service endpoint

## Development Workflow

### Current Development Focus
1. **Core UI Components**: Build reusable components using React Native Paper + NativeWind
2. **Navigation Structure**: Implement tab-based navigation with authentication flow
3. **Mock Data Integration**: Create mock recipe data for UI development
4. **State Management**: Implement local state management for app data

### Next Development Phases
1. **Backend Integration**: Connect to FastAPI backend for LLM processing
2. **Authentication**: Implement user registration and login
3. **Data Persistence**: Add local storage and backend synchronization
4. **Recipe Generation**: Core LLM integration and response parsing

### Testing
- Manual testing on Expo development client
- Test on both iOS and Android platforms
- Web platform testing for broader accessibility

## Key Features to Implement

### Phase 1: Core UI & Navigation ✨ (Current Focus)
- [ ] Tab-based navigation structure
- [ ] Recipe prompt input interface
- [ ] Basic grocery list and recipe display components
- [ ] Loading states and error handling

### Phase 2: Authentication & User Management
- [ ] User registration and login screens
- [ ] JWT token management with Expo Secure Store
- [ ] Protected route navigation

### Phase 3: Recipe Generation Core
- [ ] Backend API integration
- [ ] LLM prompt processing
- [ ] Grocery list with checkable items
- [ ] Recipe instruction display
- [ ] Response parsing and formatting

### Phase 4: Data Persistence
- [ ] Conversation history storage
- [ ] Recipe saving/favoriting functionality
- [ ] User preferences and settings
- [ ] Cross-device synchronization

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