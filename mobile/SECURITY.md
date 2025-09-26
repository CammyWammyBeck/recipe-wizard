# Security Guidelines for Recipe Wizard Mobile App

## Environment Variables Setup

### First Time Setup
```bash
# 1. Copy the example environment file
cp .env.example .env

# 2. Edit .env with your actual API keys
# Never commit this file to Git!
```

### Required Environment Variables
```bash
# Revenue Cat API Keys (get from https://app.revenuecat.com/)
EXPO_PUBLIC_REVENUE_CAT_API_KEY_IOS=your_ios_api_key_here
EXPO_PUBLIC_REVENUE_CAT_API_KEY_ANDROID=your_android_api_key_here
```

## Security Checklist

### ✅ What We Do Right
- Store API keys in environment variables, not code
- Use `.env` files excluded from version control
- Use Revenue Cat public keys (safe for client-side)
- Provide `.env.example` for team onboarding

### ⚠️ Security Reminders
- **Never commit** `.env` files to Git
- **Share keys securely** (encrypted messaging, password managers)
- **Rotate keys periodically** for production apps
- **Use different keys** for development/staging/production

### 🚫 Never Do This
```typescript
// ❌ NEVER hardcode API keys in source code
const API_KEY = 'appl_real_api_key_here';

// ❌ NEVER commit .env files
git add .env  // DON'T DO THIS!

// ❌ NEVER put sensitive backend keys in mobile apps
const SECRET_KEY = 'database_password_123';
```

### ✅ Do This Instead
```typescript
// ✅ Use environment variables
const API_KEY = process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_IOS;

// ✅ Check .gitignore includes .env
echo ".env" >> .gitignore

// ✅ Keep sensitive keys on backend only
// (mobile apps are public, anyone can read the code)
```

## File Security Status

| File | Security Level | Notes |
|------|----------------|-------|
| `.env` | 🔒 **SECRET** | Contains API keys, never commit |
| `.env.example` | ✅ **PUBLIC** | Template with placeholders only |
| `services/purchases.ts` | ✅ **PUBLIC** | Uses env vars, no hardcoded keys |
| `app.json` | ✅ **PUBLIC** | References env vars with `${}` syntax |

## Team Onboarding

### For New Developers
1. Clone the repository
2. Copy `.env.example` to `.env`
3. Ask team lead for API keys (via secure channel)
4. Update `.env` with real keys
5. Never commit `.env` to Git

### For Deployment
- Use EAS Build environment variables
- Set up CI/CD with secure environment variable injection
- Never include `.env` files in build artifacts

## Questions?

If you're unsure about any security practices, ask before proceeding. It's better to be safe than sorry when handling API keys and user data.

---

*Last updated: Phase 3 implementation with Revenue Cat integration*