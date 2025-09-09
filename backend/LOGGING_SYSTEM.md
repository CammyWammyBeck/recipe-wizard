# Production Logging System for Recipe Wizard API

## ✅ Enterprise Logging System Complete

The Recipe Wizard API now includes a comprehensive, production-ready logging system with structured JSON logging, security event tracking, and Heroku-optimized configuration.

## Logging Architecture

### 🏗️ **Multi-Tier Logging Strategy**
- **Development**: Human-readable colored logs with detailed debugging
- **Production**: Structured JSON logs optimized for parsing and monitoring
- **Security**: Dedicated security event logging with threat detection
- **Performance**: Request/response timing and database query monitoring

### 📊 **Log Levels by Environment**

#### Development Logging
```
2024-01-15 10:30:45 | INFO     | app.main | Recipe Wizard API starting up [main.py:442]
2024-01-15 10:30:45 | DEBUG    | app.requests | Incoming request: GET /health
2024-01-15 10:30:45 | WARNING  | app.database | Slow database query on users (1250ms)
```

#### Production Logging (JSON)
```json
{
    "timestamp": "2024-01-15T10:30:45.123Z",
    "level": "INFO",
    "logger": "app.main", 
    "message": "Recipe Wizard API starting up",
    "module": "main",
    "function": "startup_event",
    "line": 442,
    "process_id": 12345,
    "extra": {
        "environment": "production",
        "version": "1.0.0",
        "cors_origins_count": 3
    }
}
```

## Logging Components

### 🎯 **Structured Formatter**
- **JSON Output**: Machine-readable structured logs in production
- **Human-Readable**: Colored, formatted logs for development
- **Sensitive Data Filter**: Automatically redacts passwords, tokens, keys
- **Exception Handling**: Full stack trace capture with context

### 🔍 **Request Logging Middleware**
- **Request ID Generation**: Unique request tracking across services
- **Response Time Tracking**: Millisecond-precision performance monitoring
- **Client Information**: IP addresses, user agents, origin headers
- **Status Code Categorization**: Success, client error, server error tracking

### 🔒 **Security Event Logging**
- **Authentication Events**: Login attempts, failures, token usage
- **Authorization Failures**: Access denied events with context
- **Suspicious Activity**: Rate limiting violations, malformed requests
- **Data Protection**: Automatic PII and credential redaction

## Logging Configuration

### 📋 **Logger Hierarchy**
```
app/                    # Root application logger
├── app.main           # FastAPI application core
├── app.routers        # API route handlers  
├── app.services       # Business logic services
├── app.utils          # Utility functions
├── app.database       # Database operations
├── app.requests       # HTTP request/response
├── app.external_api   # External API calls
├── app.security       # Security events
└── app.test           # Development testing
```

### ⚙️ **Environment Variables**
```bash
# Logging configuration
LOG_LEVEL=INFO                    # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FORMAT=json                   # json or human (auto-detected by environment)
LOG_FILE_PATH=/app/logs/app.log   # Optional file logging (not recommended for Heroku)

# Environment detection
ENVIRONMENT=production            # Affects log format and verbosity
DEBUG=False                      # Disables debug logging in production
```

## Logging Endpoints

### 📊 **GET /api/logging/config** - Configuration Status
```json
{
    "environment": "production",
    "log_level": "INFO",
    "structured_logging": true,
    "loggers": {
        "app.main": {
            "level": "INFO",
            "effective_level": "INFO",
            "handlers": 1,
            "propagate": false
        },
        "app.requests": {
            "level": "INFO", 
            "effective_level": "INFO",
            "handlers": 1,
            "propagate": false
        },
        "uvicorn": {
            "level": "INFO",
            "effective_level": "INFO",
            "handlers": 1,
            "propagate": false
        }
    },
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### 🧪 **POST /api/logging/test** - Test Logging (Development Only)
```json
{
    "message": "Log test completed - check logs for output",
    "timestamp": "2024-01-15T10:30:00Z"
}
```

## Request Tracking

### 🔗 **Request ID System**
Every request gets a unique 8-character ID for tracing:
```json
{
    "request_id": "a1b2c3d4",
    "method": "POST",
    "url": "https://api.recipewizard.com/api/recipes/generate",
    "status_code": 200,
    "process_time_ms": 1250.5,
    "client_ip": "192.168.1.100"
}
```

### ⏱️ **Performance Monitoring**
Automatic timing for:
- **HTTP Requests**: End-to-end request processing
- **Database Queries**: Connection time, query execution
- **External API Calls**: OpenAI API response times
- **Function Performance**: Critical function execution timing

### 🌐 **Client Information Tracking**
```json
{
    "client_ip": "192.168.1.100",
    "user_agent": "RecipeWizard/1.0.0 (iOS)",
    "origin": "exp://192.168.1.100:19000",
    "referer": "https://app.recipewizard.com",
    "content_type": "application/json"
}
```

## Security Logging

### 🛡️ **Authentication Events**
```python
# Successful login
log_authentication_event(
    user_id="user123",
    email="user@example.com", 
    event="login",
    success=True,
    ip_address="192.168.1.100"
)

# Failed login attempt
log_authentication_event(
    email="attacker@evil.com",
    event="login_failed",
    success=False,
    ip_address="10.0.0.1",
    user_agent="curl/7.68.0"
)
```

### 🚨 **Security Event Categories**
- **Authentication**: Login success/failure, token validation
- **Authorization**: Access denied, privilege escalation attempts
- **Input Validation**: SQL injection, XSS attempts
- **Rate Limiting**: Excessive request patterns
- **Data Access**: Sensitive data queries, exports

### 🔐 **Sensitive Data Protection**
Automatic redaction of:
- Passwords and credentials
- API keys and tokens
- Authorization headers
- Personal identifiable information (PII)
- Credit card numbers and SSNs

## Database & External API Logging

### 🗄️ **Database Operations**
```json
{
    "operation": "SELECT",
    "table": "users",
    "duration_ms": 45.2,
    "record_count": 1,
    "query_type": "authentication"
}
```

### 🌍 **External API Calls**
```json
{
    "service": "OpenAI",
    "endpoint": "/v1/chat/completions",
    "method": "POST",
    "status_code": 200,
    "duration_ms": 2500,
    "request_size": 1024,
    "response_size": 4096
}
```

## Error Handling & Debugging

### 🐛 **Exception Logging**
```json
{
    "level": "ERROR",
    "message": "Database connection failed",
    "exception": "psycopg2.OperationalError: could not connect to server",
    "function": "get_user_by_email",
    "module": "database",
    "line": 156,
    "request_id": "a1b2c3d4"
}
```

### 📈 **Performance Issues**
Automatic warnings for:
- **Slow Queries**: Database queries > 1 second
- **Slow Requests**: HTTP requests > 5 seconds  
- **High Memory Usage**: System resource monitoring
- **External API Timeouts**: Third-party service issues

## Heroku Integration

### 📊 **Heroku Logs Integration**
```bash
# View all logs
heroku logs --tail

# Filter by component
heroku logs --tail --grep="app.requests"
heroku logs --tail --grep="app.security" 

# View specific log levels
heroku logs --tail --grep="ERROR"
heroku logs --tail --grep="WARNING"

# Search by request ID
heroku logs --tail --grep="a1b2c3d4"
```

### 📋 **Log Aggregation**
Compatible with popular log aggregation services:
- **Papertrail**: Structured JSON parsing
- **Loggly**: Automatic field extraction
- **Splunk**: Advanced analytics and alerting
- **Datadog**: Metrics and monitoring integration

### 🚨 **Alerting Integration**
Set up alerts for:
```bash
# Error rates
heroku logs | grep "ERROR" | wc -l

# Authentication failures
heroku logs | grep "authentication.*success.*false"

# Slow performance
heroku logs | grep "process_time_ms.*[5-9][0-9][0-9][0-9]"
```

## Log Analysis Examples

### 🔍 **Common Log Queries**

#### Find Authentication Failures
```bash
heroku logs --tail | grep "authentication.*success.*false"
```

#### Monitor API Performance
```bash
heroku logs --tail | grep "process_time_ms" | grep -E "[0-9]{4,}"
```

#### Track Database Issues
```bash
heroku logs --tail | grep "app.database" | grep "ERROR"
```

#### Security Event Monitoring
```bash
heroku logs --tail | grep "app.security"
```

## Best Practices

### ✅ **Logging Best Practices**

1. **Use Structured Logging**
   ```python
   # Good - structured with context
   logger.info("User logged in", extra={
       "user_id": "123",
       "ip_address": "192.168.1.100",
       "success": True
   })
   
   # Avoid - unstructured strings
   logger.info(f"User {user_id} logged in from {ip}")
   ```

2. **Log at Appropriate Levels**
   - **DEBUG**: Detailed debugging information
   - **INFO**: General application flow
   - **WARNING**: Unexpected but handled situations
   - **ERROR**: Error conditions that don't stop the app
   - **CRITICAL**: Serious errors that may stop the app

3. **Include Request Context**
   ```python
   logger.info("Recipe generated", extra={
       "request_id": request.state.request_id,
       "user_id": current_user.id,
       "recipe_type": recipe.type
   })
   ```

4. **Monitor Log Volume**
   - Avoid excessive DEBUG logging in production
   - Use sampling for high-frequency events
   - Regular log rotation and cleanup

### ❌ **Avoid These Pitfalls**

1. **Don't Log Sensitive Data**
   ```python
   # Never do this
   logger.info(f"User password: {password}")
   logger.info(f"API key: {api_key}")
   ```

2. **Don't Over-Log**
   ```python
   # Avoid logging every database query in production
   # Use DEBUG level for detailed operations
   ```

3. **Don't Ignore Log Levels**
   ```python
   # Use appropriate levels
   logger.error("User not found")  # Should be WARNING
   logger.info("Database crashed")  # Should be CRITICAL
   ```

## Performance Optimization

### ⚡ **Log Performance Features**
- **Lazy Evaluation**: Log messages only formatted when needed
- **Async Logging**: Non-blocking log operations
- **Filtering**: Early filtering to reduce processing
- **Sampling**: Reduce high-frequency log volume

### 📊 **Resource Usage**
- **Memory**: Minimal memory footprint with streaming logs
- **CPU**: Efficient JSON serialization
- **I/O**: Optimized stdout writing for Heroku

## Ready for Production 🚀

The logging system provides:
- ✅ **Structured JSON logging** for production parsing and analysis
- ✅ **Request tracing** with unique IDs across the entire request lifecycle
- ✅ **Security event monitoring** with automatic threat detection
- ✅ **Performance monitoring** with automatic slow query/request detection
- ✅ **Heroku optimization** with proper stdout logging and log aggregation
- ✅ **Development-friendly** colored, human-readable logs for debugging
- ✅ **Sensitive data protection** with automatic PII and credential redaction

Your Recipe Wizard API now has enterprise-grade logging ready for production monitoring! 📊