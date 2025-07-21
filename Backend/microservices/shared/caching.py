"""
Enterprise Caching Layer with Redis
Provides intelligent caching with tenant isolation and cache invalidation strategies.
"""
import json
import hashlib
import asyncio
from typing import Any, Optional, Dict, List, Union, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import redis.asyncio as redis
import pickle
import gzip
from functools import wraps
import logging

from .tenant_context import get_current_tenant, get_tenant_id


class CacheStrategy(str, Enum):
    """Cache invalidation strategies."""
    TTL = "ttl"  # Time-to-live
    LRU = "lru"  # Least Recently Used
    LFU = "lfu"  # Least Frequently Used
    WRITE_THROUGH = "write_through"
    WRITE_BEHIND = "write_behind"
    REFRESH_AHEAD = "refresh_ahead"


class CacheLevel(str, Enum):
    """Cache levels for hierarchical caching."""
    L1_MEMORY = "l1_memory"  # In-memory cache
    L2_REDIS = "l2_redis"    # Redis cache
    L3_DATABASE = "l3_database"  # Database cache


@dataclass
class CacheConfig:
    """Cache configuration."""
    ttl: int = 3600  # 1 hour default
    max_size: int = 10000
    strategy: CacheStrategy = CacheStrategy.TTL
    compression: bool = True
    serialization: str = "json"  # json, pickle
    tenant_isolated: bool = True
    tags: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "ttl": self.ttl,
            "max_size": self.max_size,
            "strategy": self.strategy.value,
            "compression": self.compression,
            "serialization": self.serialization,
            "tenant_isolated": self.tenant_isolated,
            "tags": self.tags
        }


class CacheMetrics:
    """Cache performance metrics."""
    
    def __init__(self):
        self.hits = 0
        self.misses = 0
        self.writes = 0
        self.deletes = 0
        self.evictions = 0
        self.errors = 0
        self.start_time = datetime.utcnow()
    
    @property
    def hit_ratio(self) -> float:
        """Calculate cache hit ratio."""
        total = self.hits + self.misses
        return (self.hits / total) if total > 0 else 0.0
    
    @property
    def total_operations(self) -> int:
        """Total cache operations."""
        return self.hits + self.misses + self.writes + self.deletes
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metrics to dictionary."""
        return {
            "hits": self.hits,
            "misses": self.misses,
            "writes": self.writes,
            "deletes": self.deletes,
            "evictions": self.evictions,
            "errors": self.errors,
            "hit_ratio": self.hit_ratio,
            "total_operations": self.total_operations,
            "uptime_seconds": (datetime.utcnow() - self.start_time).total_seconds()
        }


class RedisCacheManager:
    """Redis-based cache manager with tenant isolation."""
    
    def __init__(self, redis_url: str = "redis://redis:6379", 
                 default_ttl: int = 3600, namespace: str = "cache"):
        self.redis_url = redis_url
        self.default_ttl = default_ttl
        self.namespace = namespace
        self.redis_client = None
        self.metrics = CacheMetrics()
        self.logger = logging.getLogger(__name__)
    
    async def initialize(self):
        """Initialize Redis connection."""
        try:
            self.redis_client = redis.from_url(self.redis_url)
            await self.redis_client.ping()
            self.logger.info("Redis cache manager initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize Redis: {e}")
            raise
    
    def _get_cache_key(self, key: str, tenant_id: Optional[str] = None, 
                      namespace: Optional[str] = None) -> str:
        """Generate tenant-aware cache key."""
        parts = [namespace or self.namespace]
        
        # Add tenant isolation if enabled
        if tenant_id:
            parts.append(f"tenant:{tenant_id}")
        
        parts.append(key)
        return ":".join(parts)
    
    def _serialize_value(self, value: Any, config: CacheConfig) -> bytes:
        """Serialize value for storage."""
        if config.serialization == "pickle":
            serialized = pickle.dumps(value)
        else:  # json
            serialized = json.dumps(value, default=str).encode()
        
        # Compress if enabled
        if config.compression:
            serialized = gzip.compress(serialized)
        
        return serialized
    
    def _deserialize_value(self, data: bytes, config: CacheConfig) -> Any:
        """Deserialize value from storage."""
        try:
            # Decompress if needed
            if config.compression:
                data = gzip.decompress(data)
            
            if config.serialization == "pickle":
                return pickle.loads(data)
            else:  # json
                return json.loads(data.decode())
        except Exception as e:
            self.logger.error(f"Failed to deserialize cache value: {e}")
            return None
    
    async def get(self, key: str, config: Optional[CacheConfig] = None, 
                  tenant_id: Optional[str] = None) -> Optional[Any]:
        """Get value from cache."""
        if not self.redis_client:
            await self.initialize()
        
        config = config or CacheConfig()
        
        # Use current tenant if not specified
        if config.tenant_isolated and not tenant_id:
            tenant_id = get_tenant_id()
        
        cache_key = self._get_cache_key(key, tenant_id)
        
        try:
            # Get from Redis
            cached_data = await self.redis_client.get(cache_key)
            
            if cached_data:
                self.metrics.hits += 1
                
                # Get metadata
                meta_key = f"{cache_key}:meta"
                metadata = await self.redis_client.hgetall(meta_key)
                
                # Update access time for LRU
                if config.strategy == CacheStrategy.LRU:
                    await self.redis_client.hset(meta_key, "last_access", datetime.utcnow().timestamp())
                
                # Update access count for LFU
                if config.strategy == CacheStrategy.LFU:
                    await self.redis_client.hincrby(meta_key, "access_count", 1)
                
                return self._deserialize_value(cached_data, config)
            else:
                self.metrics.misses += 1
                return None
                
        except Exception as e:
            self.metrics.errors += 1
            self.logger.error(f"Cache get error: {e}")
            return None
    
    async def set(self, key: str, value: Any, config: Optional[CacheConfig] = None,
                  tenant_id: Optional[str] = None) -> bool:
        """Set value in cache."""
        if not self.redis_client:
            await self.initialize()
        
        config = config or CacheConfig()
        
        # Use current tenant if not specified
        if config.tenant_isolated and not tenant_id:
            tenant_id = get_tenant_id()
        
        cache_key = self._get_cache_key(key, tenant_id)
        
        try:
            # Serialize value
            serialized_value = self._serialize_value(value, config)
            
            # Store in Redis with TTL
            ttl = config.ttl or self.default_ttl
            await self.redis_client.setex(cache_key, ttl, serialized_value)
            
            # Store metadata
            meta_key = f"{cache_key}:meta"
            metadata = {
                "created_at": datetime.utcnow().timestamp(),
                "last_access": datetime.utcnow().timestamp(),
                "access_count": 1,
                "tenant_id": tenant_id or "global",
                "size": len(serialized_value),
                "tags": json.dumps(config.tags)
            }
            
            await self.redis_client.hset(meta_key, mapping=metadata)
            await self.redis_client.expire(meta_key, ttl)
            
            # Add to tag index
            for tag in config.tags:
                tag_key = self._get_cache_key(f"tag:{tag}", tenant_id)
                await self.redis_client.sadd(tag_key, cache_key)
                await self.redis_client.expire(tag_key, ttl)
            
            self.metrics.writes += 1
            return True
            
        except Exception as e:
            self.metrics.errors += 1
            self.logger.error(f"Cache set error: {e}")
            return False
    
    async def delete(self, key: str, tenant_id: Optional[str] = None) -> bool:
        """Delete value from cache."""
        if not self.redis_client:
            await self.initialize()
        
        if not tenant_id:
            tenant_id = get_tenant_id()
        
        cache_key = self._get_cache_key(key, tenant_id)
        
        try:
            # Get metadata for cleanup
            meta_key = f"{cache_key}:meta"
            metadata = await self.redis_client.hgetall(meta_key)
            
            # Remove from tag indexes
            if metadata.get("tags"):
                tags = json.loads(metadata["tags"])
                for tag in tags:
                    tag_key = self._get_cache_key(f"tag:{tag}", tenant_id)
                    await self.redis_client.srem(tag_key, cache_key)
            
            # Delete cache entry and metadata
            deleted = await self.redis_client.delete(cache_key, meta_key)
            
            if deleted > 0:
                self.metrics.deletes += 1
                return True
            return False
            
        except Exception as e:
            self.metrics.errors += 1
            self.logger.error(f"Cache delete error: {e}")
            return False
    
    async def invalidate_by_tag(self, tag: str, tenant_id: Optional[str] = None) -> int:
        """Invalidate all cache entries with a specific tag."""
        if not self.redis_client:
            await self.initialize()
        
        if not tenant_id:
            tenant_id = get_tenant_id()
        
        tag_key = self._get_cache_key(f"tag:{tag}", tenant_id)
        
        try:
            # Get all keys with this tag
            cache_keys = await self.redis_client.smembers(tag_key)
            
            if not cache_keys:
                return 0
            
            # Delete all keys
            deleted = 0
            for cache_key in cache_keys:
                if await self.redis_client.delete(cache_key, f"{cache_key}:meta"):
                    deleted += 1
            
            # Remove tag index
            await self.redis_client.delete(tag_key)
            
            self.metrics.deletes += deleted
            return deleted
            
        except Exception as e:
            self.metrics.errors += 1
            self.logger.error(f"Cache tag invalidation error: {e}")
            return 0
    
    async def invalidate_by_pattern(self, pattern: str, tenant_id: Optional[str] = None) -> int:
        """Invalidate cache entries matching a pattern."""
        if not self.redis_client:
            await self.initialize()
        
        if not tenant_id:
            tenant_id = get_tenant_id()
        
        search_pattern = self._get_cache_key(pattern, tenant_id)
        
        try:
            # Find matching keys
            keys = []
            async for key in self.redis_client.scan_iter(match=search_pattern):
                keys.append(key)
            
            if not keys:
                return 0
            
            # Delete all matching keys
            deleted = await self.redis_client.delete(*keys)
            
            # Also delete metadata keys
            meta_keys = [f"{key}:meta" for key in keys]
            await self.redis_client.delete(*meta_keys)
            
            self.metrics.deletes += deleted
            return deleted
            
        except Exception as e:
            self.metrics.errors += 1
            self.logger.error(f"Cache pattern invalidation error: {e}")
            return 0
    
    async def clear_tenant_cache(self, tenant_id: str) -> int:
        """Clear all cache entries for a specific tenant."""
        pattern = self._get_cache_key("*", tenant_id)
        return await self.invalidate_by_pattern(pattern, tenant_id)
    
    async def get_cache_info(self, tenant_id: Optional[str] = None) -> Dict[str, Any]:
        """Get cache information and statistics."""
        if not self.redis_client:
            await self.initialize()
        
        try:
            # Redis info
            redis_info = await self.redis_client.info("memory")
            
            # Get tenant-specific stats
            if tenant_id:
                pattern = self._get_cache_key("*", tenant_id)
                keys = []
                total_size = 0
                
                async for key in self.redis_client.scan_iter(match=pattern):
                    keys.append(key)
                    size_info = await self.redis_client.memory_usage(key)
                    if size_info:
                        total_size += size_info
                
                tenant_stats = {
                    "tenant_id": tenant_id,
                    "key_count": len(keys),
                    "total_size_bytes": total_size,
                }
            else:
                tenant_stats = {}
            
            return {
                "metrics": self.metrics.to_dict(),
                "redis_memory_used": redis_info.get("used_memory", 0),
                "redis_memory_peak": redis_info.get("used_memory_peak", 0),
                "tenant_stats": tenant_stats,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Failed to get cache info: {e}")
            return {"error": str(e)}
    
    async def cleanup_expired(self) -> int:
        """Clean up expired cache entries (for strategies other than TTL)."""
        # This would implement cleanup logic for LRU/LFU strategies
        # For now, Redis handles TTL automatically
        return 0


# Global cache manager instance
cache_manager = RedisCacheManager()


def cached(ttl: int = 3600, tags: Optional[List[str]] = None, 
          compression: bool = True, tenant_isolated: bool = True):
    """Decorator for caching function results."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            func_args = str(args) + str(sorted(kwargs.items()))
            cache_key = f"func:{func.__name__}:{hashlib.md5(func_args.encode()).hexdigest()}"
            
            config = CacheConfig(
                ttl=ttl,
                tags=tags or [],
                compression=compression,
                tenant_isolated=tenant_isolated
            )
            
            # Try to get from cache
            cached_result = await cache_manager.get(cache_key, config)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache_manager.set(cache_key, result, config)
            
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # For sync functions, we need to handle differently
            # or require async context
            return func(*args, **kwargs)
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    
    return decorator


def cache_invalidate_on_change(tags: List[str]):
    """Decorator to invalidate cache tags when function is called."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            
            # Invalidate cache tags
            for tag in tags:
                await cache_manager.invalidate_by_tag(tag)
            
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            # For sync functions, schedule cache invalidation
            return result
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    
    return decorator


class CacheWarmer:
    """Service for warming up cache with frequently accessed data."""
    
    def __init__(self, cache_manager: RedisCacheManager):
        self.cache_manager = cache_manager
        self.warming_tasks = {}
    
    async def warm_cache(self, tenant_id: str, warming_config: Dict[str, Any]):
        """Warm cache for a specific tenant."""
        tasks = []
        
        # Common data to warm
        warming_items = [
            {"key": "active_jobs", "query": "SELECT * FROM jobs WHERE status = 'active'"},
            {"key": "featured_companies", "query": "SELECT * FROM companies WHERE featured = true"},
            {"key": "popular_skills", "query": "SELECT skill, COUNT(*) FROM job_skills GROUP BY skill ORDER BY COUNT(*) DESC LIMIT 50"},
            {"key": "recent_applications", "query": "SELECT * FROM applications WHERE created_at >= NOW() - INTERVAL '7 days'"}
        ]
        
        for item in warming_items:
            task = asyncio.create_task(
                self._warm_cache_item(tenant_id, item["key"], item["query"])
            )
            tasks.append(task)
        
        # Wait for all warming tasks to complete
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _warm_cache_item(self, tenant_id: str, cache_key: str, query: str):
        """Warm a specific cache item."""
        try:
            # Execute query (implement based on your database)
            # For now, we'll just store a placeholder
            data = {"query": query, "warmed_at": datetime.utcnow().isoformat()}
            
            config = CacheConfig(
                ttl=7200,  # 2 hours
                tags=["warmed", "analytics"],
                tenant_isolated=True
            )
            
            await self.cache_manager.set(cache_key, data, config, tenant_id)
            
        except Exception as e:
            logging.error(f"Failed to warm cache item {cache_key}: {e}")
    
    async def schedule_warming(self, tenant_id: str, schedule: str = "0 */6 * * *"):
        """Schedule regular cache warming."""
        # Implementation would use a task scheduler like Celery
        pass


# Initialize cache warmer
cache_warmer = CacheWarmer(cache_manager) 