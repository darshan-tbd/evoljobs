"""
Tenant Context Management for Multi-Tenant Architecture
Provides tenant-aware context propagation across microservices.
"""
from contextvars import ContextVar
from typing import Optional, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime
import uuid


@dataclass
class TenantContext:
    """Tenant context information propagated across services."""
    tenant_id: str
    tenant_name: str
    tenant_domain: str
    subscription_tier: str  # basic, professional, enterprise
    features_enabled: Dict[str, bool] = field(default_factory=dict)
    rate_limits: Dict[str, int] = field(default_factory=dict)
    custom_branding: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def has_feature(self, feature: str) -> bool:
        """Check if tenant has a specific feature enabled."""
        return self.features_enabled.get(feature, False)
    
    def get_rate_limit(self, resource: str) -> int:
        """Get rate limit for a specific resource."""
        return self.rate_limits.get(resource, 1000)  # Default 1000 requests/hour
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert tenant context to dictionary for serialization."""
        return {
            'tenant_id': self.tenant_id,
            'tenant_name': self.tenant_name,
            'tenant_domain': self.tenant_domain,
            'subscription_tier': self.subscription_tier,
            'features_enabled': self.features_enabled,
            'rate_limits': self.rate_limits,
            'custom_branding': self.custom_branding,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


# Context variable for tenant information
tenant_context: ContextVar[Optional[TenantContext]] = ContextVar('tenant_context', default=None)


def get_current_tenant() -> Optional[TenantContext]:
    """Get current tenant context."""
    return tenant_context.get()


def set_tenant_context(tenant: TenantContext) -> None:
    """Set tenant context for current request."""
    tenant_context.set(tenant)


def get_tenant_id() -> Optional[str]:
    """Get current tenant ID."""
    tenant = get_current_tenant()
    return tenant.tenant_id if tenant else None


def require_tenant() -> TenantContext:
    """Get current tenant context or raise exception if not set."""
    tenant = get_current_tenant()
    if not tenant:
        raise ValueError("Tenant context not set")
    return tenant


def clear_tenant_context() -> None:
    """Clear tenant context."""
    tenant_context.set(None)


class TenantAwareQueryBuilder:
    """Query builder that automatically adds tenant filtering."""
    
    def __init__(self, base_query: str):
        self.base_query = base_query
        self.tenant_id = get_tenant_id()
    
    def build(self) -> str:
        """Build tenant-aware query."""
        if not self.tenant_id:
            raise ValueError("Tenant context required for query execution")
        
        # Add tenant filter to WHERE clause
        if "WHERE" in self.base_query.upper():
            return f"{self.base_query} AND tenant_id = '{self.tenant_id}'"
        else:
            return f"{self.base_query} WHERE tenant_id = '{self.tenant_id}'"
    
    def build_with_params(self) -> tuple[str, dict]:
        """Build query with parameters for safe execution."""
        if not self.tenant_id:
            raise ValueError("Tenant context required for query execution")
        
        if "WHERE" in self.base_query.upper():
            query = f"{self.base_query} AND tenant_id = :tenant_id"
        else:
            query = f"{self.base_query} WHERE tenant_id = :tenant_id"
        
        return query, {'tenant_id': self.tenant_id}


def tenant_aware_query(query: str) -> str:
    """Add tenant filtering to a SQL query."""
    return TenantAwareQueryBuilder(query).build()


# Tenant isolation decorators
def require_tenant_context(func):
    """Decorator to ensure tenant context is set."""
    def wrapper(*args, **kwargs):
        if not get_current_tenant():
            raise ValueError("Tenant context required")
        return func(*args, **kwargs)
    return wrapper


def tenant_isolation(func):
    """Decorator to ensure tenant isolation in database operations."""
    def wrapper(*args, **kwargs):
        tenant = require_tenant()
        # Add tenant_id to kwargs if not present
        if 'tenant_id' not in kwargs:
            kwargs['tenant_id'] = tenant.tenant_id
        return func(*args, **kwargs)
    return wrapper 