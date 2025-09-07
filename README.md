# Recipe Wizard 🪄

> **Create amazing recipes with just a few words**

Recipe Wizard is a cross-platform mobile application that generates personalized recipes and grocery lists from simple user prompts using a local LLM. Transform casual requests like "creamy chicken pasta with sundried tomatoes" into structured grocery lists and detailed recipes.

## ✨ Features

- **Natural Language Input**: Describe your recipe idea in plain English
- **Smart Grocery Lists**: Organized by category with checkable items
- **Detailed Instructions**: Step-by-step cooking guidance
- **Recipe History**: Save and revisit your favorite creations
- **Cross-Platform**: Works on iOS, Android, and Web
- **Offline Support**: Access saved recipes without internet
- **Personalization**: Learns your preferences over time

## 🛠 Tech Stack

### Frontend (Mobile App) ✅ **COMPLETED**
- **React Native** with **Expo 53** - Cross-platform mobile development
- **TypeScript** - Type-safe development with comprehensive API types
- **Expo Router 5** - File-based navigation with complete user flow
- **Custom Theme System** - Light/dark mode with AsyncStorage persistence
- **Material Community Icons** - Consistent iconography
- **Performance Optimized** - Memoization and proper lifecycle management

### Backend (API Server)
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Robust relational database
- **SQLAlchemy** - Python SQL toolkit and ORM
- **Alembic** - Database migration tool
- **Ollama** - Local LLM integration
- **JWT** - Secure authentication
- **Pydantic** - Data validation and serialization

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

3. **Setup Backend** (Optional - for full functionality)
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
   # Edit .env with your configuration
   
   # Start the server
   uvicorn app.main:app --reload
   ```

4. **Install Ollama** (for LLM functionality)
   ```bash
   # Install Ollama from https://ollama.ai
   # Pull a model
   ollama pull llama2
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
│   │   └── auth/             # Authentication screens
│   ├── components/           # Complete UI component library
│   │   ├── Button.tsx        # Multi-variant button
│   │   ├── TextInput.tsx     # Performance-optimized input
│   │   ├── ExpandableCard.tsx# Collapsible sections
│   │   └── ...               # 7 total components
│   ├── constants/            # Theme system and configuration
│   ├── services/             # API client ready for backend
│   ├── types/                # Complete TypeScript definitions
│   └── assets/               # Icons and resources
├── backend/                   # Python FastAPI server
│   ├── app/
│   │   ├── models/           # Database models (SQLAlchemy)
│   │   ├── schemas/          # API schemas (Pydantic)
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Business logic
│   │   └── main.py           # FastAPI application
│   ├── alembic/              # Database migrations
│   └── requirements.txt      # Python dependencies
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
2. **Recipe Input**: Natural language text input with AI-powered suggestions  
3. **Generation**: Real-time recipe and grocery list creation
4. **Results**: Organized grocery list with checkboxes + detailed cooking instructions
5. **Saving**: One-tap saving to personal recipe collection
6. **History**: Easy access to previous recipe conversations

## 🚧 Development Status

**✅ Mobile App - COMPLETED:**
- [x] Complete theme system with light/dark mode
- [x] Full component library (7 reusable components)
- [x] Complete navigation flow (Welcome → Auth → Prompt → Recipe Result)
- [x] Recipe result screen with expandable grocery lists & instructions
- [x] Performance optimization and error handling
- [x] API service layer ready for backend integration
- [x] TypeScript types for all API endpoints

**🔄 Backend - IN PROGRESS:**
- [x] Basic FastAPI project structure
- [ ] LLM integration with Ollama
- [ ] Database schema and models
- [ ] Authentication endpoints
- [ ] Recipe generation API endpoints

**📋 Future Features:**
- [ ] Tab navigation (History, Saved Recipes, Settings)
- [ ] Data persistence and synchronization  
- [ ] User preferences and dietary restrictions
- [ ] Advanced recipe customization
- [ ] Social features and recipe sharing

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