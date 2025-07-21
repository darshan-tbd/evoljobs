"""
Enterprise Authentication System with OAuth2, RBAC, and JWT Support
Provides secure authentication and authorization for multi-tenant architecture.
"""
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import jwt
import hashlib
import secrets
import bcrypt
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import redis
import json

from .tenant_context import TenantContext, get_current_tenant, set_tenant_context


class Role(str, Enum):
    """User roles in the system."""
    SUPER_ADMIN = "super_admin"
    TENANT_ADMIN = "tenant_admin"
    HR_MANAGER = "hr_manager"
    RECRUITER = "recruiter"
    HIRING_MANAGER = "hiring_manager"
    EMPLOYEE = "employee"
    CANDIDATE = "candidate"
    GUEST = "guest"


class Permission(str, Enum):
    """System permissions."""
    # User Management
    CREATE_USERS = "create_users"
    READ_USERS = "read_users"
    UPDATE_USERS = "update_users"
    DELETE_USERS = "delete_users"
    
    # Company Management
    CREATE_COMPANIES = "create_companies"
    READ_COMPANIES = "read_companies"
    UPDATE_COMPANIES = "update_companies"
    DELETE_COMPANIES = "delete_companies"
    
    # Job Management
    CREATE_JOBS = "create_jobs"
    READ_JOBS = "read_jobs"
    UPDATE_JOBS = "update_jobs"
    DELETE_JOBS = "delete_jobs"
    PUBLISH_JOBS = "publish_jobs"
    
    # Application Management
    CREATE_APPLICATIONS = "create_applications"
    READ_APPLICATIONS = "read_applications"
    UPDATE_APPLICATIONS = "update_applications"
    DELETE_APPLICATIONS = "delete_applications"
    
    # Analytics
    READ_ANALYTICS = "read_analytics"
    READ_ADVANCED_ANALYTICS = "read_advanced_analytics"
    
    # System Administration
    MANAGE_TENANTS = "manage_tenants"
    MANAGE_INTEGRATIONS = "manage_integrations"
    MANAGE_BRANDING = "manage_branding"
    VIEW_AUDIT_LOGS = "view_audit_logs"


# Role-Permission Mapping
ROLE_PERMISSIONS: Dict[Role, List[Permission]] = {
    Role.SUPER_ADMIN: [p for p in Permission],  # All permissions
    Role.TENANT_ADMIN: [
        Permission.CREATE_USERS, Permission.READ_USERS, Permission.UPDATE_USERS,
        Permission.CREATE_COMPANIES, Permission.READ_COMPANIES, Permission.UPDATE_COMPANIES,
        Permission.CREATE_JOBS, Permission.READ_JOBS, Permission.UPDATE_JOBS, Permission.DELETE_JOBS,
        Permission.PUBLISH_JOBS, Permission.READ_APPLICATIONS, Permission.UPDATE_APPLICATIONS,
        Permission.READ_ANALYTICS, Permission.READ_ADVANCED_ANALYTICS,
        Permission.MANAGE_INTEGRATIONS, Permission.MANAGE_BRANDING, Permission.VIEW_AUDIT_LOGS
    ],
    Role.HR_MANAGER: [
        Permission.CREATE_USERS, Permission.READ_USERS, Permission.UPDATE_USERS,
        Permission.READ_COMPANIES, Permission.CREATE_JOBS, Permission.READ_JOBS,
        Permission.UPDATE_JOBS, Permission.PUBLISH_JOBS, Permission.READ_APPLICATIONS,
        Permission.UPDATE_APPLICATIONS, Permission.READ_ANALYTICS
    ],
    Role.RECRUITER: [
        Permission.READ_USERS, Permission.CREATE_JOBS, Permission.READ_JOBS,
        Permission.UPDATE_JOBS, Permission.READ_APPLICATIONS, Permission.UPDATE_APPLICATIONS,
        Permission.READ_ANALYTICS
    ],
    Role.HIRING_MANAGER: [
        Permission.READ_USERS, Permission.READ_JOBS, Permission.READ_APPLICATIONS,
        Permission.UPDATE_APPLICATIONS, Permission.READ_ANALYTICS
    ],
    Role.EMPLOYEE: [
        Permission.READ_USERS, Permission.READ_JOBS, Permission.READ_APPLICATIONS
    ],
    Role.CANDIDATE: [
        Permission.READ_JOBS, Permission.CREATE_APPLICATIONS, Permission.READ_APPLICATIONS
    ],
    Role.GUEST: [
        Permission.READ_JOBS
    ]
}


@dataclass
class User:
    """User model for authentication."""
    id: str
    email: str
    username: str
    tenant_id: str
    roles: List[Role] = field(default_factory=list)
    permissions: List[Permission] = field(default_factory=list)
    is_active: bool = True
    is_verified: bool = False
    last_login: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    mfa_enabled: bool = False
    mfa_secret: Optional[str] = None
    
    def has_permission(self, permission: Permission) -> bool:
        """Check if user has specific permission."""
        return permission in self.permissions
    
    def has_role(self, role: Role) -> bool:
        """Check if user has specific role."""
        return role in self.roles
    
    def has_any_role(self, roles: List[Role]) -> bool:
        """Check if user has any of the specified roles."""
        return any(role in self.roles for role in roles)
    
    def add_role(self, role: Role) -> None:
        """Add role to user and update permissions."""
        if role not in self.roles:
            self.roles.append(role)
            self._update_permissions()
    
    def remove_role(self, role: Role) -> None:
        """Remove role from user and update permissions."""
        if role in self.roles:
            self.roles.remove(role)
            self._update_permissions()
    
    def _update_permissions(self) -> None:
        """Update user permissions based on roles."""
        permissions = set()
        for role in self.roles:
            permissions.update(ROLE_PERMISSIONS.get(role, []))
        self.permissions = list(permissions)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert user to dictionary for serialization."""
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'tenant_id': self.tenant_id,
            'roles': [role.value for role in self.roles],
            'permissions': [perm.value for perm in self.permissions],
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'mfa_enabled': self.mfa_enabled
        }


class TokenData(BaseModel):
    """Token data model."""
    user_id: str
    tenant_id: str
    email: str
    roles: List[str]
    permissions: List[str]
    exp: int
    iat: int
    jti: str  # JWT ID for token revocation


class AuthConfig:
    """Authentication configuration."""
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    REDIS_URL: str = "redis://localhost:6379"
    BCRYPT_ROUNDS: int = 12
    
    # OAuth2 Configuration
    OAUTH2_PROVIDERS: Dict[str, Dict[str, str]] = {
        "google": {
            "client_id": "your-google-client-id",
            "client_secret": "your-google-client-secret",
            "auth_url": "https://accounts.google.com/o/oauth2/auth",
            "token_url": "https://oauth2.googleapis.com/token",
            "user_info_url": "https://www.googleapis.com/oauth2/v2/userinfo"
        },
        "microsoft": {
            "client_id": "your-microsoft-client-id",
            "client_secret": "your-microsoft-client-secret",
            "auth_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
            "token_url": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
            "user_info_url": "https://graph.microsoft.com/v1.0/me"
        }
    }


class AuthService:
    """Authentication service with enterprise features."""
    
    def __init__(self, config: AuthConfig, redis_client: redis.Redis):
        self.config = config
        self.redis = redis_client
        self.security = HTTPBearer()
    
    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt."""
        salt = bcrypt.gensalt(rounds=self.config.BCRYPT_ROUNDS)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify password against hash."""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def generate_jwt_token(self, user: User, token_type: str = "access") -> str:
        """Generate JWT token for user."""
        now = datetime.utcnow()
        
        if token_type == "access":
            expire = now + timedelta(minutes=self.config.ACCESS_TOKEN_EXPIRE_MINUTES)
        else:  # refresh
            expire = now + timedelta(days=self.config.REFRESH_TOKEN_EXPIRE_DAYS)
        
        payload = {
            "user_id": user.id,
            "tenant_id": user.tenant_id,
            "email": user.email,
            "roles": [role.value for role in user.roles],
            "permissions": [perm.value for perm in user.permissions],
            "token_type": token_type,
            "exp": expire.timestamp(),
            "iat": now.timestamp(),
            "jti": secrets.token_urlsafe(32)
        }
        
        token = jwt.encode(payload, self.config.SECRET_KEY, algorithm=self.config.ALGORITHM)
        
        # Store token in Redis for revocation capability
        self.redis.setex(
            f"token:{payload['jti']}", 
            int((expire - now).total_seconds()), 
            json.dumps(payload)
        )
        
        return token
    
    def verify_jwt_token(self, token: str) -> TokenData:
        """Verify JWT token and return token data."""
        try:
            payload = jwt.decode(token, self.config.SECRET_KEY, algorithms=[self.config.ALGORITHM])
            
            # Check if token is revoked
            token_data = self.redis.get(f"token:{payload['jti']}")
            if not token_data:
                raise HTTPException(status_code=401, detail="Token revoked or expired")
            
            return TokenData(**payload)
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    def revoke_token(self, jti: str) -> None:
        """Revoke JWT token."""
        self.redis.delete(f"token:{jti}")
    
    def revoke_all_user_tokens(self, user_id: str) -> None:
        """Revoke all tokens for a user."""
        pattern = f"token:*"
        for key in self.redis.scan_iter(match=pattern):
            token_data = self.redis.get(key)
            if token_data:
                data = json.loads(token_data)
                if data.get('user_id') == user_id:
                    self.redis.delete(key)
    
    async def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())) -> User:
        """Get current authenticated user."""
        token_data = self.verify_jwt_token(credentials.credentials)
        
        # Here you would typically load user from database
        # For now, we'll create a user object from token data
        user = User(
            id=token_data.user_id,
            email=token_data.email,
            username=token_data.email,
            tenant_id=token_data.tenant_id,
            roles=[Role(role) for role in token_data.roles],
            permissions=[Permission(perm) for perm in token_data.permissions]
        )
        
        return user
    
    async def get_current_tenant_user(self, credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())) -> User:
        """Get current authenticated user and set tenant context."""
        user = await self.get_current_user(credentials)
        
        # Set tenant context for the request
        # You would typically load tenant data from database
        tenant = TenantContext(
            tenant_id=user.tenant_id,
            tenant_name=f"Tenant {user.tenant_id}",
            tenant_domain=f"tenant-{user.tenant_id}.example.com",
            subscription_tier="enterprise"
        )
        set_tenant_context(tenant)
        
        return user
    
    def require_permission(self, permission: Permission):
        """Decorator to require specific permission."""
        def decorator(func):
            async def wrapper(*args, **kwargs):
                # Extract user from dependencies
                user = None
                for arg in args:
                    if isinstance(arg, User):
                        user = arg
                        break
                
                if not user or not user.has_permission(permission):
                    raise HTTPException(
                        status_code=403, 
                        detail=f"Permission required: {permission.value}"
                    )
                
                return await func(*args, **kwargs)
            return wrapper
        return decorator
    
    def require_role(self, role: Role):
        """Decorator to require specific role."""
        def decorator(func):
            async def wrapper(*args, **kwargs):
                # Extract user from dependencies
                user = None
                for arg in args:
                    if isinstance(arg, User):
                        user = arg
                        break
                
                if not user or not user.has_role(role):
                    raise HTTPException(
                        status_code=403, 
                        detail=f"Role required: {role.value}"
                    )
                
                return await func(*args, **kwargs)
            return wrapper
        return decorator


# Global auth service instance
auth_config = AuthConfig()
redis_client = redis.Redis.from_url(auth_config.REDIS_URL)
auth_service = AuthService(auth_config, redis_client)


# Convenience functions
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())) -> User:
    """Get current authenticated user."""
    return await auth_service.get_current_user(credentials)


async def get_current_tenant_user(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())) -> User:
    """Get current authenticated user with tenant context."""
    return await auth_service.get_current_tenant_user(credentials)


def require_permission(permission: Permission):
    """Decorator to require specific permission."""
    return auth_service.require_permission(permission)


def require_role(role: Role):
    """Decorator to require specific role."""
    return auth_service.require_role(role) 