# CORS Configuration for Recipe Wizard API

## ✅ Enhanced CORS Configuration Complete

### Mobile App & Web Client Support

The Recipe Wizard API now includes comprehensive CORS (Cross-Origin Resource Sharing) configuration optimized for mobile app development and production deployment.

## Key Features Implemented

### 🔒 **Security-First Approach**
- **Environment-based validation**: Different rules for development vs production
- **Origin validation**: Automatic validation of CORS origins with detailed logging
- **Header restriction**: Limited headers in production, permissive in development
- **HTTPS enforcement**: Prefers HTTPS in production environments

### 📱 **Mobile App Support**
- **Expo Development**: Full support for Expo dev server (`exp://`)
- **Capacitor Apps**: Native mobile app support (`capacitor://`)
- **Ionic Apps**: Hybrid mobile app support (`ionic://`)
- **React Native**: Metro bundler and development server support
- **Cordova/PhoneGap**: File protocol support

### 🌐 **Web Client Support**
- **Development**: Comprehensive localhost support (multiple ports)
- **Production**: HTTPS-preferred domains with validation
- **Network Testing**: Local network IP support for device testing

## Configuration Details

### Production CORS Settings
```python
{
    "allow_origins": ["https://your-domain.com", "exp://your-app"],
    "allow_credentials": True,
    "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": [
        "Authorization", "Content-Type", "X-Requested-With",
        "Accept", "Origin", "User-Agent", "X-CSRF-Token"
    ],
    "expose_headers": ["Content-Range", "X-Content-Range"],
    "max_age": 3600  # 1 hour preflight cache
}
```

### Development CORS Settings
```python
{
    "allow_origins": [
        "http://localhost:3000",      # React development
        "http://localhost:8081",      # React Native Metro
        "exp://localhost:19000",      # Expo dev server
        "http://localhost:19006",     # Expo web
        "capacitor://localhost",      # Capacitor apps
        "ionic://localhost"           # Ionic apps
    ],
    "allow_credentials": True,
    "allow_methods": ["*"],           # All methods in development
    "allow_headers": ["*"],           # All headers in development
    "max_age": 86400                  # 24 hour cache
}
```

## Environment Variables

### For Heroku Production Deployment

```bash
# CORS Configuration - comma-separated list
heroku config:set ALLOWED_ORIGINS="https://your-app.herokuapp.com,exp://your-expo-app,https://your-custom-domain.com"

# Example with multiple origins:
heroku config:set ALLOWED_ORIGINS="https://recipewizard.herokuapp.com,exp://recipewizard,https://app.recipewizard.com"
```

### For Development (.env file)
```bash
# Development automatically includes common localhost origins
# No ALLOWED_ORIGINS needed - handled automatically
ENVIRONMENT=development
DEBUG=True
```

## Testing & Validation

### CORS Testing Endpoints

#### 1. **GET /api/cors/test** - Configuration Testing
```json
{
    "environment": "production",
    "current_origins": ["https://app.example.com"],
    "validation_results": {
        "valid_origins": [
            {"origin": "https://app.example.com", "reason": "Valid HTTPS origin"}
        ],
        "invalid_origins": [],
        "warnings": []
    },
    "recommendations": {
        "mobile_development": ["exp://localhost:19000"],
        "web_development": ["http://localhost:3000"]
    },
    "cors_config": {
        "allow_credentials": true,
        "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "max_age": 3600
    }
}
```

#### 2. **OPTIONS /api/cors/preflight-test** - Preflight Testing
Tests actual CORS preflight functionality from your client.

### Manual Testing Commands

```bash
# Test CORS preflight from command line
curl -X OPTIONS \
  -H "Origin: https://your-app.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  https://your-api.herokuapp.com/api/cors/preflight-test

# Test actual API call
curl -X GET \
  -H "Origin: https://your-app.com" \
  https://your-api.herokuapp.com/api/status
```

## Mobile App Integration

### Expo Configuration

Add to your mobile app's API configuration:

```typescript
// mobile/constants/config.ts
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? "http://localhost:8000"  // Development
    : "https://your-api.herokuapp.com",  // Production
  
  // These origins should match your ALLOWED_ORIGINS
  EXPECTED_ORIGINS: [
    "exp://localhost:19000",
    "exp://your-production-app"
  ]
};
```

### React Native Metro Configuration

Ensure your Metro bundler can connect:

```javascript
// metro.config.js
module.exports = {
  server: {
    port: 8081, // This port is included in CORS origins
  }
};
```

## Origin Validation Rules

### Automatic Validation Features

1. **Mobile Schemes**: Validates `exp://`, `capacitor://`, `ionic://`, `file://`
2. **URL Structure**: Validates proper HTTP/HTTPS URL format
3. **Development Safety**: Allows localhost in development only
4. **Production Security**: Enforces HTTPS preferences in production
5. **Network Access**: Supports local network IPs for device testing

### Common Valid Origins

#### Development
- `http://localhost:3000` - React development server
- `http://localhost:8081` - React Native Metro bundler
- `exp://localhost:19000` - Expo development server
- `exp://192.168.1.100:19000` - Expo on local network
- `http://localhost:19006` - Expo web development
- `capacitor://localhost` - Capacitor mobile apps
- `ionic://localhost` - Ionic mobile apps

#### Production
- `https://your-app.herokuapp.com` - Heroku web app
- `https://your-custom-domain.com` - Custom domain
- `exp://your-expo-app` - Published Expo app

## Error Handling

### Common CORS Errors & Solutions

#### 1. **"CORS policy blocked"**
```bash
# Check current CORS configuration
curl https://your-api.herokuapp.com/api/cors/test

# Verify your origin is in ALLOWED_ORIGINS
heroku config:get ALLOWED_ORIGINS
```

#### 2. **"Preflight request failed"**
- Ensure your client sends proper `Origin` header
- Check that `OPTIONS` method is allowed
- Verify `Access-Control-Request-Headers` match allowed headers

#### 3. **"Credentials not allowed"**
- CORS credentials require exact origin match (no wildcards)
- Ensure your origin is explicitly listed in `ALLOWED_ORIGINS`

## Security Considerations

### ✅ **Security Features Implemented**

1. **No Wildcard Origins**: Never uses `*` in production
2. **Header Restrictions**: Limited headers in production
3. **Method Restrictions**: Only necessary HTTP methods allowed
4. **Origin Validation**: Automatic validation with detailed logging
5. **Environment Separation**: Different security levels for dev/prod

### ⚠️ **Security Best Practices**

1. **Use HTTPS**: Always prefer HTTPS origins in production
2. **Minimal Origins**: Only add origins you actually need
3. **Regular Audits**: Review CORS origins periodically
4. **Monitor Logs**: Watch for CORS validation warnings
5. **Test Thoroughly**: Use provided testing endpoints

## Monitoring & Debugging

### CORS Logging

The API logs detailed CORS information:

```
INFO: CORS configuration for production:
INFO:   Origins: 3 configured
INFO:   Credentials: True
INFO:   Methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
INFO:   Production origins: ['https://app.example.com', 'exp://myapp']
```

### Health Check Integration

CORS origin count is included in the root endpoint:

```json
{
  "message": "Welcome to Recipe Wizard API",
  "cors_origins_count": 3,
  "cors_test": "/api/cors/test"
}
```

## Ready for Production 🚀

The CORS configuration is now fully optimized for:
- ✅ **Mobile App Development** (Expo, React Native, Capacitor, Ionic)
- ✅ **Web Client Support** (React, Next.js, vanilla JS)
- ✅ **Production Security** (HTTPS enforcement, header restrictions)
- ✅ **Development Flexibility** (comprehensive localhost support)
- ✅ **Easy Testing** (built-in validation and testing endpoints)

Your Recipe Wizard API is ready for secure cross-origin requests from any client! 🎯