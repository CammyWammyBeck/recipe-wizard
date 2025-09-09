# Database Migration System for Recipe Wizard API

## ✅ Production-Ready Migration System Complete

The Recipe Wizard API now includes a comprehensive database migration system designed for safe, reliable deployment on Heroku with zero-downtime capabilities.

## Migration Strategy

### Heroku Release Phase Integration
```yaml
# Procfile configuration
release: python scripts/run_migrations.py
web: uvicorn app.main:app --host=0.0.0.0 --port=${PORT:-8000} --workers=1
```

**Benefits**:
- ✅ **Zero Downtime**: Migrations run before new code deploys
- ✅ **Automatic Rollback**: Failed migrations prevent deployment
- ✅ **Safe Updates**: Database changes applied before code changes
- ✅ **Logging**: Comprehensive migration logging and error reporting

## Migration Endpoints

### 📊 **GET /api/migrations/status** - Current Status
```json
{
    "current_revision": "bb7fb1d8e8a3",
    "head_revision": "bb7fb1d8e8a3", 
    "is_up_to_date": true,
    "pending_revisions": [],
    "total_revisions": 3,
    "database_url_masked": "postgresql://user@***",
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### 📜 **GET /api/migrations/history** - Migration History
```json
{
    "migrations": [
        {
            "revision": "bb7fb1d8e8a3",
            "message": "add created_by_id to recipes table",
            "created": "2024-01-15T08:45:00Z",
            "author": null,
            "branch_labels": null,
            "depends_on": null
        },
        {
            "revision": "4ec49e1f4ba8", 
            "message": "initial migration with users recipes",
            "created": "2024-01-14T15:30:00Z"
        }
    ]
}
```

### ✅ **GET /api/migrations/validate** - Schema Validation
```json
{
    "valid": true,
    "existing_tables": ["users", "recipes", "recipe_ingredients", "conversations"],
    "missing_tables": [],
    "alembic_initialized": true,
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### 🚀 **POST /api/migrations/run** - Manual Migration (Production Only)
```json
{
    "success": true,
    "pre_migration": {
        "revision": "4ec49e1f4ba8",
        "pending_count": 2
    },
    "post_migration": {
        "revision": "bb7fb1d8e8a3",
        "is_up_to_date": true
    },
    "applied_revisions": [
        {
            "revision": "b7e906377ec2",
            "message": "add user preferences"
        },
        {
            "revision": "bb7fb1d8e8a3", 
            "message": "add created_by_id to recipes table"
        }
    ],
    "timestamp": "2024-01-15T10:30:00Z"
}
```

## Migration Management

### Development Workflow
```bash
# Create new migration (development only)
cd backend
alembic revision --autogenerate -m "add new feature"

# Check current status
alembic current

# Apply migrations locally
alembic upgrade head

# View migration history
alembic history

# Check what would be applied
alembic upgrade head --sql
```

### Production Deployment
```bash
# Automatic via Heroku release phase
git push heroku main

# Manual check (if needed)
heroku run alembic current
heroku run alembic history

# View migration logs
heroku logs --tail --grep="migration"
```

## Safety Features

### 🔒 **Production Safeguards**
1. **Environment Validation**: Only runs in appropriate environments
2. **URL Compatibility**: Automatic Heroku PostgreSQL URL fixing
3. **Connection Validation**: Verifies database connectivity before migration
4. **Error Handling**: Detailed error reporting and automatic rollback
5. **Timeout Protection**: Connection timeouts prevent hanging migrations

### 🛡️ **Migration Validation**
- **Schema Comparison**: Validates actual vs expected schema
- **Table Existence**: Checks for required core tables
- **Alembic Initialization**: Ensures migration tracking is set up
- **Revision Consistency**: Validates migration chain integrity

### ⚡ **Performance Optimizations**
- **Connection Pooling**: Optimized for Heroku connection limits
- **SSL Requirements**: Enforced SSL in production
- **Batch Operations**: SQLite-compatible batch operations
- **Type Comparison**: Accurate column type change detection

## Migration Configuration

### Enhanced Alembic Configuration
```python
# Production-specific settings in env.py
if ENVIRONMENT == "production":
    configuration.update({
        "sqlalchemy.pool_pre_ping": "true",
        "sqlalchemy.pool_recycle": "1800",  # 30 minutes
        "sqlalchemy.connect_args": '{"sslmode": "require", "connect_timeout": 30}',
    })
```

### Context Configuration
```python
context.configure(
    connection=connection, 
    target_metadata=target_metadata,
    compare_type=True,              # Compare column types
    compare_server_default=True,    # Compare server defaults
    render_as_batch=True,           # SQLite compatibility
)
```

## Error Handling & Recovery

### Common Migration Issues

#### 1. **Connection Timeout**
```json
{
    "success": false,
    "error": "Connection timeout after 30 seconds",
    "timestamp": "2024-01-15T10:30:00Z"
}
```
**Solution**: Check database connectivity, verify environment variables

#### 2. **Schema Mismatch**
```json
{
    "valid": false,
    "missing_tables": ["new_feature_table"],
    "error": "Database schema out of sync"
}
```
**Solution**: Run pending migrations, check migration history

#### 3. **Migration Conflict**
```json
{
    "success": false,
    "error": "Multiple migration heads detected",
}
```
**Solution**: Merge migration branches, resolve conflicts manually

### Recovery Procedures

#### Rollback Migration
```bash
# Emergency rollback (be very careful!)
heroku run alembic downgrade -1

# Rollback to specific revision
heroku run alembic downgrade bb7fb1d8e8a3
```

#### Reset Migration State
```bash
# View current state
heroku run alembic current

# Check what's pending
heroku run alembic show head

# Force to specific revision (dangerous!)
heroku run alembic stamp bb7fb1d8e8a3
```

## Monitoring & Alerts

### Migration Monitoring
```bash
# Real-time migration logs during deployment
heroku logs --tail --grep="migration"

# Check migration status after deployment
curl https://your-api.herokuapp.com/api/migrations/status

# Validate schema integrity
curl https://your-api.herokuapp.com/api/migrations/validate
```

### Health Check Integration
Migration status is included in comprehensive health checks:
```json
{
    "services": {
        "database": {
            "status": "healthy",
            "migrations": {
                "is_up_to_date": true,
                "current_revision": "bb7fb1d8e8a3"
            }
        }
    }
}
```

## Best Practices

### ✅ **Recommended Practices**

1. **Always Create Migrations in Development**
   ```bash
   # Never create migrations in production
   alembic revision --autogenerate -m "descriptive message"
   ```

2. **Test Migrations Locally**
   ```bash
   # Test both upgrade and downgrade
   alembic upgrade head
   alembic downgrade -1
   alembic upgrade head
   ```

3. **Review Generated Migrations**
   - Check auto-generated migrations before committing
   - Add custom logic for data migrations
   - Ensure backwards compatibility when possible

4. **Monitor Deployment**
   ```bash
   # Watch migration progress during deployment
   heroku logs --tail --grep="migration"
   ```

### ❌ **Avoid These Pitfalls**

1. **Don't Skip Migration Review**: Always review auto-generated migrations
2. **Don't Modify Applied Migrations**: Create new migrations instead
3. **Don't Run Migrations Manually**: Use release phase for consistency
4. **Don't Ignore Migration Failures**: Failed migrations block deployment

## Backup & Recovery Strategy

### Pre-Migration Backup (Recommended)
```bash
# Create database backup before major migrations
heroku pg:backups:capture

# List available backups
heroku pg:backups

# Restore from backup if needed (EMERGENCY ONLY)
heroku pg:backups:restore BACKUP_ID
```

### Migration Rollback Strategy
1. **Automatic**: Failed migrations prevent deployment
2. **Manual**: Use `alembic downgrade` for specific rollbacks
3. **Emergency**: Restore from backup as last resort

## Zero-Downtime Deployment

### Heroku Release Phase Process
1. **Build Phase**: Code compilation and dependency installation
2. **Release Phase**: Migration execution (your app is still serving traffic)
3. **Deploy Phase**: New code deployment (brief downtime for restart)

### Migration Design for Zero Downtime
- **Additive Changes**: Add columns as nullable first
- **Backwards Compatible**: Support both old and new schemas temporarily
- **Data Migrations**: Run in separate migrations after schema changes
- **Index Creation**: Use `CONCURRENTLY` for large tables (PostgreSQL)

## Heroku Integration Features

### Environment Variables
- **DATABASE_URL**: Automatically provided by Heroku Postgres
- **ENVIRONMENT**: Set to "production" for production-specific behavior
- **Migration behavior changes**: Based on environment detection

### Release Phase Configuration
```bash
# The release phase runs migrations before deploying new code
# This ensures database schema is always compatible with new code
release: python scripts/run_migrations.py
```

### Logging Integration
All migration activity is logged to Heroku logs:
```bash
# View migration logs
heroku logs --tail --source=app[release.1]

# Search for specific migration
heroku logs --grep="migration" --num=100
```

## Ready for Production 🚀

The migration system provides:
- ✅ **Zero-downtime deployments** with automatic migration execution
- ✅ **Production safety** with comprehensive error handling
- ✅ **Monitoring capabilities** with status and validation endpoints
- ✅ **Heroku optimization** with release phase integration
- ✅ **Recovery procedures** with rollback and backup strategies
- ✅ **Schema validation** with real-time integrity checking

Your Recipe Wizard API is now ready for safe, reliable database migrations in production! 🛠️