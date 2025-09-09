# Health Monitoring System for Recipe Wizard API

## ✅ Comprehensive Health Check System Complete

The Recipe Wizard API now includes enterprise-grade health monitoring optimized for production deployment on Heroku and container orchestration platforms.

## Health Check Endpoints

### 🚀 **GET /health** - Quick Health Check
**Purpose**: Primary health endpoint for load balancers and uptime monitoring  
**Response Time**: <1 second  
**Use Case**: Heroku health checks, uptime monitors, load balancers

```json
{
    "status": "healthy",
    "service": "Recipe Wizard API", 
    "version": "1.0.0",
    "environment": "production",
    "uptime_seconds": 3847.23,
    "timestamp": "2024-01-15T10:30:00Z",
    "checks": {
        "api": "running",
        "database": "connected",
        "memory_usage": "45.2%",
        "disk_usage": "23.1%",
        "response_time_ms": 12.5
    }
}
```

**Status Values**:
- `healthy` - All systems operational
- `degraded` - Performance issues but functional
- `unhealthy` - Critical issues, not ready for traffic

### 🔥 **GET /health/live** - Liveness Probe
**Purpose**: Container liveness check (Kubernetes, Docker)  
**Use Case**: Determines if container should be restarted

```json
{
    "status": "alive",
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### ✅ **GET /health/ready** - Readiness Probe
**Purpose**: Container readiness check (Kubernetes, Docker)  
**HTTP Status**: 200 (ready) or 503 (not ready)  
**Use Case**: Determines if container can receive traffic

```json
{
    "ready": true,
    "checks": {
        "database": "ready",
        "memory": "ok", 
        "disk": "ok"
    },
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### 🔍 **GET /health/comprehensive** - Detailed Diagnostics
**Purpose**: Complete system diagnostic information  
**Response Time**: 2-5 seconds  
**Use Case**: Troubleshooting, monitoring dashboards

```json
{
    "status": "operational",
    "uptime_seconds": 3847.23,
    "environment": "production",
    "version": "1.0.0",
    "timestamp": "2024-01-15T10:30:00Z", 
    "response_time_ms": 234.5,
    "services": {
        "api": {
            "status": "running",
            "uptime_seconds": 3847.23
        },
        "database": {
            "status": "healthy",
            "connection_time_ms": 45.2,
            "consecutive_failures": 0,
            "database_type": "PostgreSQL",
            "pool_size": 2,
            "pool_recycle": 1800
        },
        "llm_service": {
            "status": "connected",
            "service": "OpenAI",
            "default_model": "gpt-4o-mini",
            "available_models": ["gpt-3.5-turbo", "gpt-4o-mini"]
        }
    },
    "system": {
        "memory": {
            "percent": 45.2,
            "available_mb": 1024,
            "critical": false
        },
        "disk": {
            "percent": 23.1,
            "free_gb": 15,
            "critical": false
        },
        "cpu": {
            "percent": 12.3,
            "load_1min": 0.5
        }
    },
    "connectivity": {
        "dns": "working",
        "openai_api": "accessible"
    },
    "message": "All systems operational"
}
```

### 📊 **GET /api/status** - Legacy Status Endpoint
**Purpose**: Backward compatibility with existing monitoring  
**Format**: StatusResponse schema

## Health Check Strategy by Environment

### Production (Heroku)
```yaml
Health Check Configuration:
  Primary: GET /health (every 30 seconds)
  Timeout: 30 seconds
  Unhealthy Threshold: 3 consecutive failures
  
Heroku Features:
  - Automatic dyno restart on health check failure
  - Built-in load balancer health checks
  - Logs health check results
```

### Container Orchestration (Kubernetes/Docker)
```yaml
Liveness Probe:
  httpGet:
    path: /health/live
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
  
Readiness Probe:
  httpGet:
    path: /health/ready
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 3
```

## Health Check Performance

### Response Times (Target)
- `/health` - <1 second (quick checks only)
- `/health/live` - <100ms (minimal processing)
- `/health/ready` - <1 second (essential services)
- `/health/comprehensive` - <5 seconds (full diagnostics)

### Caching Strategy
- Quick checks: No caching (real-time status)
- Comprehensive checks: 30-second cache to prevent overload
- Database health: Built-in connection pooling

## System Resource Monitoring

### Memory Monitoring
- **Normal**: <70% usage
- **Warning**: 70-90% usage (status: degraded)
- **Critical**: >90% usage (status: unhealthy)

### Disk Monitoring  
- **Normal**: <80% usage
- **Warning**: 80-90% usage (status: degraded)
- **Critical**: >90% usage (status: unhealthy)

### Database Monitoring
- **Connection Time**: <100ms normal, >500ms warning
- **Pool Status**: Active connections vs pool size
- **Consecutive Failures**: >3 failures triggers degraded status

## Service Dependency Checks

### Critical Services (Must be healthy)
1. **Database** - PostgreSQL connection and query performance
2. **API** - Basic application functionality

### Optional Services (Degraded if unavailable)
1. **OpenAI LLM** - Recipe generation functionality
2. **Redis** - Rate limiting and caching (if configured)

### System Resources (Performance indicators)
1. **Memory** - Available system memory
2. **Disk** - Available disk space  
3. **CPU** - Current CPU utilization
4. **Network** - DNS resolution and external connectivity

## Monitoring Integration

### Heroku Integration
```bash
# View health check logs
heroku logs --tail --grep="health"

# Check dyno metrics
heroku ps:scale

# View resource usage
heroku pg:info
```

### External Monitoring Services
The health endpoints are compatible with:
- **Pingdom** - Use `/health` endpoint
- **UptimeRobot** - Monitor `/health` with keyword "healthy"
- **Datadog** - Custom metrics from `/health/comprehensive`
- **New Relic** - APM integration with health checks

### Custom Monitoring Scripts
```bash
#!/bin/bash
# Simple health check script
HEALTH_URL="https://your-api.herokuapp.com/health"
RESPONSE=$(curl -s "$HEALTH_URL")
STATUS=$(echo "$RESPONSE" | jq -r '.status')

if [ "$STATUS" = "healthy" ]; then
    echo "✅ API is healthy"
    exit 0
else
    echo "❌ API is unhealthy: $STATUS"
    exit 1
fi
```

## Error Handling & Alerting

### Health Check Failures
```json
{
    "status": "unhealthy",
    "service": "Recipe Wizard API",
    "uptime_seconds": 3847.23,
    "timestamp": "2024-01-15T10:30:00Z",
    "checks": {
        "error": "Database connection failed",
        "response_time_ms": 5000
    }
}
```

### Common Issues & Solutions

#### Database Connection Issues
- **Symptom**: `database: "disconnected"`
- **Cause**: Connection pool exhaustion, network issues
- **Solution**: Check Heroku Postgres status, restart dynos

#### High Memory Usage
- **Symptom**: `memory_usage: "95.2%"`, `status: "unhealthy"`
- **Cause**: Memory leaks, high traffic
- **Solution**: Scale dynos, check for memory leaks

#### OpenAI API Issues
- **Symptom**: `llm_service: "disconnected"`  
- **Cause**: API key issues, rate limiting, service outage
- **Solution**: Check API key, verify billing, implement fallback

## Security Considerations

### Information Disclosure
- **Production**: Limited error details in health responses
- **Development**: Full error details for debugging
- **Sensitive Data**: Never expose credentials or internal IPs

### Rate Limiting
- Health check endpoints are **not** rate limited
- Monitoring services can check frequently without throttling
- Comprehensive checks have built-in caching to prevent abuse

## Best Practices

### ✅ **Recommended**
1. **Monitor `/health` every 30 seconds** for uptime
2. **Use `/health/ready` for traffic routing** decisions
3. **Check `/health/comprehensive` for diagnostics** only
4. **Set up alerts** for consecutive health check failures
5. **Monitor uptime trends** over time

### ❌ **Avoid**
1. **Don't** call comprehensive health checks too frequently
2. **Don't** rely on single health check for critical decisions
3. **Don't** ignore degraded status - investigate promptly
4. **Don't** expose health endpoints publicly without rate limiting

## Heroku Configuration

### Required Add-ons
```bash
# PostgreSQL database
heroku addons:create heroku-postgresql:mini

# Optional: Redis for enhanced caching
heroku addons:create heroku-redis:mini
```

### Environment Variables
```bash
# Health check configuration (optional)
heroku config:set HEALTH_CHECK_TIMEOUT=30
heroku config:set HEALTH_CHECK_INTERVAL=60
```

## Ready for Production 🚀

The health monitoring system provides:
- ✅ **Enterprise-grade health checks** with multiple endpoints
- ✅ **Container orchestration support** (Kubernetes/Docker)
- ✅ **Heroku optimization** with automatic restart capability
- ✅ **Resource monitoring** (memory, disk, CPU, database)
- ✅ **Service dependency tracking** (database, LLM, external APIs)
- ✅ **Performance metrics** with response time monitoring
- ✅ **Caching strategy** to prevent health check overload

Your Recipe Wizard API is now ready for production monitoring! 📊