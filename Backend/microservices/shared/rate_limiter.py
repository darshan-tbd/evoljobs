"""
API Rate Limiting Middleware with Tenant-Specific Quotas
Provides intelligent rate limiting with burst protection and tenant isolation.
"""
import time
import json
from typing import Dict, Optional, Tuple, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import redis
import hashlib
from fastapi import HTTPException, Request, Response
from fastapi.responses import JSONResponse
import asyncio

from .tenant_context import get_current_tenant, get_tenant_id


class RateLimitType(str, Enum):
    """Rate limit types."""
    REQUESTS_PER_MINUTE = "requests_per_minute"
    REQUESTS_PER_HOUR = "requests_per_hour"
    REQUESTS_PER_DAY = "requests_per_day"
    BANDWIDTH_PER_MINUTE = "bandwidth_per_minute"
    BANDWIDTH_PER_HOUR = "bandwidth_per_hour"


@dataclass
class RateLimit:
    """Rate limit configuration."""
    limit: int
    window: int  # Window size in seconds
    burst_limit: int  # Burst allowance
    rate_limit_type: RateLimitType
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "limit": self.limit,
            "window": self.window,
            "burst_limit": self.burst_limit,
            "rate_limit_type": self.rate_limit_type.value
        }


@dataclass
class TenantRateLimits:
    """Tenant-specific rate limits."""
    tenant_id: str
    subscription_tier: str
    global_limits: Dict[str, RateLimit] = field(default_factory=dict)
    endpoint_limits: Dict[str, RateLimit] = field(default_factory=dict)
    user_limits: Dict[str, RateLimit] = field(default_factory=dict)
    
    def get_limit(self, endpoint: str, user_id: Optional[str] = None) -> Optional[RateLimit]:
        """Get rate limit for specific endpoint and user."""
        # Check user-specific limits first
        if user_id and user_id in self.user_limits:
            return self.user_limits[user_id]
        
        # Check endpoint-specific limits
        if endpoint in self.endpoint_limits:
            return self.endpoint_limits[endpoint]
        
        # Return global limits
        return self.global_limits.get("default")


class RateLimiter:
    """Redis-based rate limiter with sliding window and burst protection."""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.default_limits = self._get_default_limits()
    
    def _get_default_limits(self) -> Dict[str, TenantRateLimits]:
        """Get default rate limits by subscription tier."""
        return {
            "basic": TenantRateLimits(
                tenant_id="",
                subscription_tier="basic",
                global_limits={
                    "default": RateLimit(
                        limit=1000,
                        window=3600,  # 1 hour
                        burst_limit=50,
                        rate_limit_type=RateLimitType.REQUESTS_PER_HOUR
                    )
                },
                endpoint_limits={
                    "/api/v1/jobs/search": RateLimit(
                        limit=100,
                        window=60,  # 1 minute
                        burst_limit=10,
                        rate_limit_type=RateLimitType.REQUESTS_PER_MINUTE
                    ),
                    "/api/v1/analytics": RateLimit(
                        limit=50,
                        window=3600,  # 1 hour
                        burst_limit=5,
                        rate_limit_type=RateLimitType.REQUESTS_PER_HOUR
                    )
                }
            ),
            "professional": TenantRateLimits(
                tenant_id="",
                subscription_tier="professional",
                global_limits={
                    "default": RateLimit(
                        limit=5000,
                        window=3600,  # 1 hour
                        burst_limit=200,
                        rate_limit_type=RateLimitType.REQUESTS_PER_HOUR
                    )
                },
                endpoint_limits={
                    "/api/v1/jobs/search": RateLimit(
                        limit=500,
                        window=60,  # 1 minute
                        burst_limit=50,
                        rate_limit_type=RateLimitType.REQUESTS_PER_MINUTE
                    ),
                    "/api/v1/analytics": RateLimit(
                        limit=200,
                        window=3600,  # 1 hour
                        burst_limit=20,
                        rate_limit_type=RateLimitType.REQUESTS_PER_HOUR
                    )
                }
            ),
            "enterprise": TenantRateLimits(
                tenant_id="",
                subscription_tier="enterprise",
                global_limits={
                    "default": RateLimit(
                        limit=50000,
                        window=3600,  # 1 hour
                        burst_limit=2000,
                        rate_limit_type=RateLimitType.REQUESTS_PER_HOUR
                    )
                },
                endpoint_limits={
                    "/api/v1/jobs/search": RateLimit(
                        limit=2000,
                        window=60,  # 1 minute
                        burst_limit=200,
                        rate_limit_type=RateLimitType.REQUESTS_PER_MINUTE
                    ),
                    "/api/v1/analytics": RateLimit(
                        limit=1000,
                        window=3600,  # 1 hour
                        burst_limit=100,
                        rate_limit_type=RateLimitType.REQUESTS_PER_HOUR
                    )
                }
            )
        }
    
    def _get_key(self, tenant_id: str, endpoint: str, user_id: Optional[str] = None) -> str:
        """Generate Redis key for rate limiting."""
        if user_id:
            return f"rate_limit:{tenant_id}:{user_id}:{endpoint}"
        return f"rate_limit:{tenant_id}:{endpoint}"
    
    def _get_window_key(self, base_key: str, window_start: int) -> str:
        """Generate window-specific key."""
        return f"{base_key}:{window_start}"
    
    async def _sliding_window_counter(self, key: str, limit: int, window: int) -> Tuple[bool, int, int]:
        """Implement sliding window counter algorithm."""
        now = int(time.time())
        window_start = now - (now % window)
        
        pipe = self.redis.pipeline()
        window_key = self._get_window_key(key, window_start)
        
        # Get current count
        pipe.get(window_key)
        # Increment counter
        pipe.incr(window_key)
        # Set expiration
        pipe.expire(window_key, window * 2)
        
        results = pipe.execute()
        current_count = int(results[1])
        
        # Check if limit exceeded
        allowed = current_count <= limit
        remaining = max(0, limit - current_count)
        
        return allowed, remaining, window_start + window
    
    async def _token_bucket(self, key: str, limit: int, window: int, burst_limit: int) -> Tuple[bool, int, int]:
        """Implement token bucket algorithm for burst protection."""
        now = time.time()
        bucket_key = f"{key}:bucket"
        
        # Get current bucket state
        bucket_data = self.redis.get(bucket_key)
        if bucket_data:
            bucket_info = json.loads(bucket_data)
            tokens = bucket_info["tokens"]
            last_refill = bucket_info["last_refill"]
        else:
            tokens = burst_limit
            last_refill = now
        
        # Calculate tokens to add based on time elapsed
        time_elapsed = now - last_refill
        tokens_to_add = int(time_elapsed * (limit / window))
        tokens = min(burst_limit, tokens + tokens_to_add)
        
        # Check if request can be processed
        if tokens >= 1:
            tokens -= 1
            allowed = True
        else:
            allowed = False
        
        # Update bucket state
        bucket_info = {
            "tokens": tokens,
            "last_refill": now
        }
        self.redis.setex(bucket_key, window * 2, json.dumps(bucket_info))
        
        return allowed, int(tokens), int(now + (1 / (limit / window)))
    
    async def check_rate_limit(self, 
                              request: Request,
                              tenant_id: str,
                              subscription_tier: str,
                              user_id: Optional[str] = None) -> Tuple[bool, Dict[str, any]]:
        """Check if request is within rate limits."""
        endpoint = request.url.path
        
        # Get tenant rate limits
        tenant_limits = self.default_limits.get(subscription_tier)
        if not tenant_limits:
            tenant_limits = self.default_limits["basic"]
        
        # Get specific rate limit for this endpoint
        rate_limit = tenant_limits.get_limit(endpoint, user_id)
        if not rate_limit:
            return True, {}
        
        # Generate rate limit key
        key = self._get_key(tenant_id, endpoint, user_id)
        
        # Check sliding window limit
        allowed, remaining, reset_time = await self._sliding_window_counter(
            key, rate_limit.limit, rate_limit.window
        )
        
        if not allowed:
            # Check burst allowance with token bucket
            burst_allowed, burst_remaining, burst_reset = await self._token_bucket(
                key, rate_limit.limit, rate_limit.window, rate_limit.burst_limit
            )
            
            if burst_allowed:
                allowed = True
                remaining = burst_remaining
                reset_time = burst_reset
        
        # Prepare response headers
        headers = {
            "X-RateLimit-Limit": str(rate_limit.limit),
            "X-RateLimit-Remaining": str(remaining),
            "X-RateLimit-Reset": str(reset_time),
            "X-RateLimit-Window": str(rate_limit.window),
            "X-RateLimit-Type": rate_limit.rate_limit_type.value
        }
        
        return allowed, headers
    
    async def get_rate_limit_info(self, tenant_id: str, subscription_tier: str) -> Dict[str, any]:
        """Get rate limit information for tenant."""
        tenant_limits = self.default_limits.get(subscription_tier, self.default_limits["basic"])
        
        info = {
            "tenant_id": tenant_id,
            "subscription_tier": subscription_tier,
            "global_limits": {k: v.to_dict() for k, v in tenant_limits.global_limits.items()},
            "endpoint_limits": {k: v.to_dict() for k, v in tenant_limits.endpoint_limits.items()},
            "current_usage": await self._get_current_usage(tenant_id)
        }
        
        return info
    
    async def _get_current_usage(self, tenant_id: str) -> Dict[str, int]:
        """Get current usage statistics for tenant."""
        pattern = f"rate_limit:{tenant_id}:*"
        usage = {}
        
        for key in self.redis.scan_iter(match=pattern):
            key_str = key.decode('utf-8')
            count = self.redis.get(key)
            if count:
                # Parse key to extract endpoint
                parts = key_str.split(':')
                if len(parts) >= 3:
                    endpoint = parts[2]
                    usage[endpoint] = int(count)
        
        return usage
    
    async def reset_rate_limit(self, tenant_id: str, endpoint: str, user_id: Optional[str] = None) -> bool:
        """Reset rate limit for specific tenant/endpoint/user."""
        key = self._get_key(tenant_id, endpoint, user_id)
        pattern = f"{key}:*"
        
        keys_to_delete = []
        for key in self.redis.scan_iter(match=pattern):
            keys_to_delete.append(key)
        
        if keys_to_delete:
            self.redis.delete(*keys_to_delete)
            return True
        
        return False


class RateLimitMiddleware:
    """FastAPI middleware for rate limiting."""
    
    def __init__(self, rate_limiter: RateLimiter):
        self.rate_limiter = rate_limiter
    
    async def __call__(self, request: Request, call_next):
        """Process rate limiting for incoming requests."""
        # Skip rate limiting for health checks and internal endpoints
        if request.url.path in ["/health", "/metrics", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        # Get tenant information
        tenant_id = get_tenant_id()
        if not tenant_id:
            # Allow requests without tenant context (public endpoints)
            return await call_next(request)
        
        tenant = get_current_tenant()
        subscription_tier = tenant.subscription_tier if tenant else "basic"
        
        # Extract user ID from request if available
        user_id = None
        if hasattr(request.state, 'user'):
            user_id = request.state.user.id
        
        # Check rate limit
        allowed, headers = await self.rate_limiter.check_rate_limit(
            request, tenant_id, subscription_tier, user_id
        )
        
        if not allowed:
            # Rate limit exceeded
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Limit: {headers.get('X-RateLimit-Limit')}/hour",
                    "retry_after": headers.get('X-RateLimit-Reset')
                },
                headers=headers
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers to response
        for key, value in headers.items():
            response.headers[key] = value
        
        return response


# Global rate limiter instance
redis_client = redis.Redis.from_url("redis://localhost:6379")
rate_limiter = RateLimiter(redis_client)
rate_limit_middleware = RateLimitMiddleware(rate_limiter)


# Decorators for endpoint-specific rate limiting
def endpoint_rate_limit(limit: int, window: int, burst_limit: Optional[int] = None):
    """Decorator for endpoint-specific rate limiting."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # This would be implemented in the actual FastAPI endpoint
            # For now, we'll just call the function
            return await func(*args, **kwargs)
        
        # Store rate limit metadata
        wrapper._rate_limit = RateLimit(
            limit=limit,
            window=window,
            burst_limit=burst_limit or limit // 10,
            rate_limit_type=RateLimitType.REQUESTS_PER_HOUR
        )
        
        return wrapper
    return decorator


def user_rate_limit(limit: int, window: int):
    """Decorator for user-specific rate limiting."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # This would be implemented in the actual FastAPI endpoint
            return await func(*args, **kwargs)
        
        wrapper._user_rate_limit = RateLimit(
            limit=limit,
            window=window,
            burst_limit=limit // 5,
            rate_limit_type=RateLimitType.REQUESTS_PER_HOUR
        )
        
        return wrapper
    return decorator 