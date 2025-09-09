"""
Production-ready logging configuration for Recipe Wizard API
"""
import os
import sys
import json
import logging
import logging.config
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path


class StructuredFormatter(logging.Formatter):
    """
    Custom formatter that outputs structured JSON logs for production
    and human-readable logs for development
    """
    
    def __init__(self, include_extra_fields: bool = True):
        self.include_extra_fields = include_extra_fields
        super().__init__()
    
    def format(self, record: logging.LogRecord) -> str:
        environment = os.getenv("ENVIRONMENT", "development")
        
        if environment == "production":
            return self._format_json(record)
        else:
            return self._format_human_readable(record)
    
    def _format_json(self, record: logging.LogRecord) -> str:
        """Format log record as JSON for production"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "process_id": os.getpid(),
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields from the log record
        if self.include_extra_fields:
            extra_fields = {}
            for key, value in record.__dict__.items():
                if key not in {
                    'name', 'msg', 'args', 'levelname', 'levelno', 'pathname',
                    'filename', 'module', 'lineno', 'funcName', 'created',
                    'msecs', 'relativeCreated', 'thread', 'threadName',
                    'processName', 'process', 'stack_info', 'exc_info', 'exc_text'
                }:
                    # Only include serializable values
                    try:
                        json.dumps(value)
                        extra_fields[key] = value
                    except (TypeError, ValueError):
                        extra_fields[key] = str(value)
            
            if extra_fields:
                log_entry["extra"] = extra_fields
        
        return json.dumps(log_entry, ensure_ascii=False)
    
    def _format_human_readable(self, record: logging.LogRecord) -> str:
        """Format log record for human readability in development"""
        timestamp = datetime.fromtimestamp(record.created).strftime("%Y-%m-%d %H:%M:%S")
        
        # Color codes for different log levels
        colors = {
            'DEBUG': '\033[36m',    # Cyan
            'INFO': '\033[32m',     # Green
            'WARNING': '\033[33m',  # Yellow
            'ERROR': '\033[31m',    # Red
            'CRITICAL': '\033[35m', # Magenta
            'RESET': '\033[0m'      # Reset
        }
        
        color = colors.get(record.levelname, '')
        reset = colors['RESET']
        
        # Base format
        formatted = f"{timestamp} | {color}{record.levelname:<8}{reset} | {record.name} | {record.getMessage()}"
        
        # Add location info for warnings and errors
        if record.levelno >= logging.WARNING:
            formatted += f" [{record.filename}:{record.lineno}]"
        
        # Add exception info if present
        if record.exc_info:
            formatted += f"\n{self.formatException(record.exc_info)}"
        
        return formatted


class RequestIDFilter(logging.Filter):
    """Add request ID to log records for request tracing"""
    
    def filter(self, record: logging.LogRecord) -> bool:
        # Try to get request ID from context (would be set by middleware)
        request_id = getattr(record, 'request_id', None)
        if not request_id:
            # Generate a simple request ID if not available
            import uuid
            request_id = str(uuid.uuid4())[:8]
        
        record.request_id = request_id
        return True


class SensitiveDataFilter(logging.Filter):
    """Filter out sensitive data from logs"""
    
    SENSITIVE_PATTERNS = [
        'password', 'token', 'key', 'secret', 'authorization',
        'bearer', 'credentials', 'api_key', 'access_token'
    ]
    
    def filter(self, record: logging.LogRecord) -> bool:
        # Sanitize the log message
        message = record.getMessage().lower()
        
        for pattern in self.SENSITIVE_PATTERNS:
            if pattern in message:
                # Replace sensitive data with [REDACTED]
                original_msg = record.msg
                if isinstance(original_msg, str):
                    import re
                    # Simple pattern to redact values after sensitive keywords
                    pattern_regex = rf"({pattern}['\"\s]*[:=]['\"\s]*)([^\s,'\"]+)"
                    record.msg = re.sub(pattern_regex, r'\1[REDACTED]', original_msg, flags=re.IGNORECASE)
        
        return True


def get_log_level() -> int:
    """Get log level from environment variable"""
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    return getattr(logging, log_level, logging.INFO)


def get_logging_config() -> Dict[str, Any]:
    """Get logging configuration based on environment"""
    environment = os.getenv("ENVIRONMENT", "development")
    log_level = get_log_level()
    
    # Base configuration
    config = {
        'version': 1,
        'disable_existing_loggers': False,
        'filters': {
            'request_id': {
                '()': RequestIDFilter,
            },
            'sensitive_data': {
                '()': SensitiveDataFilter,
            }
        },
        'formatters': {
            'structured': {
                '()': StructuredFormatter,
                'include_extra_fields': True,
            },
            'simple': {
                'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'stream': sys.stdout,
                'formatter': 'structured',
                'filters': ['request_id', 'sensitive_data'],
                'level': log_level,
            }
        },
        'loggers': {
            # Application loggers
            'app': {
                'level': log_level,
                'handlers': ['console'],
                'propagate': False,
            },
            'app.main': {
                'level': log_level,
                'handlers': ['console'],
                'propagate': False,
            },
            'app.routers': {
                'level': log_level,
                'handlers': ['console'],
                'propagate': False,
            },
            'app.services': {
                'level': log_level,
                'handlers': ['console'],
                'propagate': False,
            },
            'app.utils': {
                'level': log_level,
                'handlers': ['console'],
                'propagate': False,
            },
            # External library loggers
            'uvicorn': {
                'level': 'INFO',
                'handlers': ['console'],
                'propagate': False,
            },
            'uvicorn.access': {
                'level': 'INFO' if environment == 'production' else 'DEBUG',
                'handlers': ['console'],
                'propagate': False,
            },
            'sqlalchemy.engine': {
                'level': 'WARNING' if environment == 'production' else 'INFO',
                'handlers': ['console'],
                'propagate': False,
            },
            'alembic': {
                'level': 'INFO',
                'handlers': ['console'],
                'propagate': False,
            },
            'openai': {
                'level': 'WARNING',
                'handlers': ['console'],
                'propagate': False,
            },
        },
        'root': {
            'level': log_level,
            'handlers': ['console'],
        }
    }
    
    # Production-specific adjustments
    if environment == "production":
        # More restrictive logging in production
        config['loggers']['sqlalchemy.engine']['level'] = 'ERROR'
        config['loggers']['uvicorn.access']['level'] = 'WARNING'
        
        # Add file logging for production (optional, Heroku logs to stdout)
        log_file_path = os.getenv("LOG_FILE_PATH")
        if log_file_path:
            config['handlers']['file'] = {
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': log_file_path,
                'maxBytes': 10485760,  # 10MB
                'backupCount': 5,
                'formatter': 'structured',
                'filters': ['request_id', 'sensitive_data'],
                'level': log_level,
            }
            # Add file handler to all loggers
            for logger_config in config['loggers'].values():
                if isinstance(logger_config, dict) and 'handlers' in logger_config:
                    logger_config['handlers'].append('file')
    
    return config


def setup_logging():
    """Setup logging configuration"""
    config = get_logging_config()
    logging.config.dictConfig(config)
    
    # Log startup information
    logger = logging.getLogger("app.logging")
    environment = os.getenv("ENVIRONMENT", "development")
    log_level = get_log_level()
    
    logger.info(
        "Logging system initialized",
        extra={
            "environment": environment,
            "log_level": logging.getLevelName(log_level),
            "structured_logging": environment == "production"
        }
    )


def get_logger(name: str) -> logging.Logger:
    """Get a logger with the specified name"""
    return logging.getLogger(f"app.{name}")


def log_request_info(logger: logging.Logger, request, response_time_ms: float = None):
    """Log request information"""
    extra_data = {
        "method": request.method,
        "url": str(request.url),
        "user_agent": request.headers.get("user-agent", ""),
        "client_ip": request.client.host if request.client else "unknown",
    }
    
    if response_time_ms:
        extra_data["response_time_ms"] = response_time_ms
    
    logger.info("Request processed", extra=extra_data)


def log_database_operation(logger: logging.Logger, operation: str, table: str, duration_ms: float = None):
    """Log database operations"""
    extra_data = {
        "operation": operation,
        "table": table,
    }
    
    if duration_ms:
        extra_data["duration_ms"] = duration_ms
    
    logger.info("Database operation", extra=extra_data)


def log_external_api_call(logger: logging.Logger, service: str, endpoint: str, 
                         status_code: int = None, duration_ms: float = None):
    """Log external API calls"""
    extra_data = {
        "service": service,
        "endpoint": endpoint,
    }
    
    if status_code:
        extra_data["status_code"] = status_code
    
    if duration_ms:
        extra_data["duration_ms"] = duration_ms
    
    level = logging.INFO if status_code and 200 <= status_code < 400 else logging.WARNING
    logger.log(level, f"External API call to {service}", extra=extra_data)


# Performance monitoring decorator
def log_performance(logger_name: str = None):
    """Decorator to log function performance"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            import time
            logger = logging.getLogger(logger_name or f"app.{func.__module__}")
            
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000
                
                logger.debug(
                    f"Function {func.__name__} completed",
                    extra={
                        "function": func.__name__,
                        "duration_ms": round(duration_ms, 2),
                        "module": func.__module__
                    }
                )
                return result
            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                logger.error(
                    f"Function {func.__name__} failed",
                    extra={
                        "function": func.__name__,
                        "duration_ms": round(duration_ms, 2),
                        "error": str(e),
                        "module": func.__module__
                    },
                    exc_info=True
                )
                raise
        return wrapper
    return decorator