"""
Enterprise Security Module
Provides OAuth2 integrations, audit logging, and data encryption for enterprise platform.
"""
import os
import json
import hashlib
import secrets
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import asyncio
import logging
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import httpx
import jwt

from .tenant_context import get_current_tenant, get_tenant_id
from .auth import User, Role, Permission


class OAuth2Provider(str, Enum):
    """Supported OAuth2 providers."""
    GOOGLE = "google"
    MICROSOFT = "microsoft"
    LINKEDIN = "linkedin"
    GITHUB = "github"
    OKTA = "okta"
    AUTH0 = "auth0"


class AuditEventType(str, Enum):
    """Types of audit events."""
    LOGIN = "login"
    LOGOUT = "logout"
    FAILED_LOGIN = "failed_login"
    PASSWORD_CHANGE = "password_change"
    ROLE_CHANGE = "role_change"
    PERMISSION_GRANT = "permission_grant"
    PERMISSION_REVOKE = "permission_revoke"
    DATA_ACCESS = "data_access"
    DATA_MODIFICATION = "data_modification"
    DATA_DELETION = "data_deletion"
    USER_CREATION = "user_creation"
    USER_DELETION = "user_deletion"
    TENANT_CREATION = "tenant_creation"
    CONFIGURATION_CHANGE = "configuration_change"
    API_ACCESS = "api_access"
    EXPORT_DATA = "export_data"
    IMPORT_DATA = "import_data"
    SECURITY_VIOLATION = "security_violation"


@dataclass
class AuditEvent:
    """Audit event for security logging."""
    id: str
    tenant_id: str
    user_id: Optional[str]
    event_type: AuditEventType
    resource: str
    action: str
    details: Dict[str, Any] = field(default_factory=dict)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    session_id: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    success: bool = True
    risk_score: int = 0  # 0-100 risk assessment
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert audit event to dictionary."""
        return {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "user_id": self.user_id,
            "event_type": self.event_type.value,
            "resource": self.resource,
            "action": self.action,
            "details": self.details,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "session_id": self.session_id,
            "timestamp": self.timestamp.isoformat(),
            "success": self.success,
            "risk_score": self.risk_score
        }


@dataclass
class OAuth2Config:
    """OAuth2 provider configuration."""
    provider: OAuth2Provider
    client_id: str
    client_secret: str
    authorize_url: str
    token_url: str
    user_info_url: str
    scopes: List[str] = field(default_factory=list)
    enabled: bool = True
    tenant_specific: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary (excluding sensitive data)."""
        return {
            "provider": self.provider.value,
            "client_id": self.client_id,
            "authorize_url": self.authorize_url,
            "scopes": self.scopes,
            "enabled": self.enabled,
            "tenant_specific": self.tenant_specific
        }


class EncryptionService:
    """Service for data encryption and decryption."""
    
    def __init__(self, master_key: Optional[str] = None):
        self.master_key = master_key or os.getenv("ENCRYPTION_MASTER_KEY", self._generate_master_key())
        self._cipher_suite = None
    
    def _generate_master_key(self) -> str:
        """Generate a new master key."""
        return Fernet.generate_key().decode()
    
    def _get_cipher_suite(self, tenant_id: Optional[str] = None) -> Fernet:
        """Get cipher suite for encryption/decryption."""
        if self._cipher_suite is None:
            # Derive tenant-specific key if tenant_id provided
            if tenant_id:
                password = f"{self.master_key}:{tenant_id}".encode()
                salt = hashlib.sha256(tenant_id.encode()).digest()[:16]
                kdf = PBKDF2HMAC(
                    algorithm=hashes.SHA256(),
                    length=32,
                    salt=salt,
                    iterations=100000,
                )
                key = base64.urlsafe_b64encode(kdf.derive(password))
                self._cipher_suite = Fernet(key)
            else:
                self._cipher_suite = Fernet(self.master_key.encode())
        
        return self._cipher_suite
    
    def encrypt(self, data: str, tenant_id: Optional[str] = None) -> str:
        """Encrypt sensitive data."""
        cipher_suite = self._get_cipher_suite(tenant_id)
        encrypted_data = cipher_suite.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted_data).decode()
    
    def decrypt(self, encrypted_data: str, tenant_id: Optional[str] = None) -> str:
        """Decrypt sensitive data."""
        cipher_suite = self._get_cipher_suite(tenant_id)
        decoded_data = base64.urlsafe_b64decode(encrypted_data.encode())
        decrypted_data = cipher_suite.decrypt(decoded_data)
        return decrypted_data.decode()
    
    def encrypt_dict(self, data: Dict[str, Any], fields_to_encrypt: List[str], tenant_id: Optional[str] = None) -> Dict[str, Any]:
        """Encrypt specific fields in a dictionary."""
        encrypted_data = data.copy()
        for field in fields_to_encrypt:
            if field in encrypted_data and encrypted_data[field]:
                encrypted_data[field] = self.encrypt(str(encrypted_data[field]), tenant_id)
                encrypted_data[f"{field}_encrypted"] = True
        return encrypted_data
    
    def decrypt_dict(self, data: Dict[str, Any], fields_to_decrypt: List[str], tenant_id: Optional[str] = None) -> Dict[str, Any]:
        """Decrypt specific fields in a dictionary."""
        decrypted_data = data.copy()
        for field in fields_to_decrypt:
            if field in decrypted_data and decrypted_data.get(f"{field}_encrypted"):
                decrypted_data[field] = self.decrypt(decrypted_data[field], tenant_id)
                decrypted_data.pop(f"{field}_encrypted", None)
        return decrypted_data


class AuditLogger:
    """Service for audit logging and compliance."""
    
    def __init__(self, storage_backend: str = "database"):
        self.storage_backend = storage_backend
        self.logger = logging.getLogger("audit")
        self._setup_logger()
    
    def _setup_logger(self):
        """Setup audit logger configuration."""
        handler = logging.FileHandler("logs/audit.log")
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    async def log_event(self, event: AuditEvent) -> str:
        """Log an audit event."""
        event_id = event.id or secrets.token_urlsafe(16)
        event.id = event_id
        
        # Log to file
        self.logger.info(json.dumps(event.to_dict()))
        
        # Store in database (implement based on your DB choice)
        await self._store_in_database(event)
        
        # Send to SIEM if configured
        await self._send_to_siem(event)
        
        return event_id
    
    async def _store_in_database(self, event: AuditEvent):
        """Store audit event in database."""
        # This would connect to your database and store the event
        # For now, we'll just log it
        pass
    
    async def _send_to_siem(self, event: AuditEvent):
        """Send audit event to SIEM system."""
        siem_endpoint = os.getenv("SIEM_ENDPOINT")
        if siem_endpoint:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        siem_endpoint,
                        json=event.to_dict(),
                        headers={"Authorization": f"Bearer {os.getenv('SIEM_TOKEN')}"}
                    )
            except Exception as e:
                self.logger.error(f"Failed to send audit event to SIEM: {e}")
    
    async def get_audit_trail(self, tenant_id: str, start_date: datetime, end_date: datetime, 
                            event_types: Optional[List[AuditEventType]] = None) -> List[AuditEvent]:
        """Retrieve audit trail for compliance reporting."""
        # This would query the database for audit events
        # For now, return empty list
        return []
    
    async def generate_compliance_report(self, tenant_id: str, report_type: str = "SOC2") -> Dict[str, Any]:
        """Generate compliance report."""
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=90)  # Last 90 days
        
        events = await self.get_audit_trail(tenant_id, start_date, end_date)
        
        report = {
            "tenant_id": tenant_id,
            "report_type": report_type,
            "period_start": start_date.isoformat(),
            "period_end": end_date.isoformat(),
            "total_events": len(events),
            "event_summary": {},
            "security_violations": [],
            "compliance_status": "COMPLIANT"
        }
        
        # Analyze events for compliance
        for event in events:
            event_type = event.event_type.value
            report["event_summary"][event_type] = report["event_summary"].get(event_type, 0) + 1
            
            if event.event_type == AuditEventType.SECURITY_VIOLATION:
                report["security_violations"].append(event.to_dict())
        
        # Determine compliance status
        if len(report["security_violations"]) > 0:
            report["compliance_status"] = "NEEDS_REVIEW"
        
        return report


class OAuth2Service:
    """Service for OAuth2 provider integrations."""
    
    def __init__(self):
        self.providers = self._load_provider_configs()
    
    def _load_provider_configs(self) -> Dict[OAuth2Provider, OAuth2Config]:
        """Load OAuth2 provider configurations."""
        configs = {}
        
        # Google OAuth2
        if os.getenv("GOOGLE_CLIENT_ID"):
            configs[OAuth2Provider.GOOGLE] = OAuth2Config(
                provider=OAuth2Provider.GOOGLE,
                client_id=os.getenv("GOOGLE_CLIENT_ID"),
                client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
                authorize_url="https://accounts.google.com/o/oauth2/auth",
                token_url="https://oauth2.googleapis.com/token",
                user_info_url="https://www.googleapis.com/oauth2/v2/userinfo",
                scopes=["openid", "email", "profile"]
            )
        
        # Microsoft OAuth2
        if os.getenv("MICROSOFT_CLIENT_ID"):
            configs[OAuth2Provider.MICROSOFT] = OAuth2Config(
                provider=OAuth2Provider.MICROSOFT,
                client_id=os.getenv("MICROSOFT_CLIENT_ID"),
                client_secret=os.getenv("MICROSOFT_CLIENT_SECRET"),
                authorize_url="https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
                token_url="https://login.microsoftonline.com/common/oauth2/v2.0/token",
                user_info_url="https://graph.microsoft.com/v1.0/me",
                scopes=["openid", "email", "profile"]
            )
        
        # LinkedIn OAuth2
        if os.getenv("LINKEDIN_CLIENT_ID"):
            configs[OAuth2Provider.LINKEDIN] = OAuth2Config(
                provider=OAuth2Provider.LINKEDIN,
                client_id=os.getenv("LINKEDIN_CLIENT_ID"),
                client_secret=os.getenv("LINKEDIN_CLIENT_SECRET"),
                authorize_url="https://www.linkedin.com/oauth/v2/authorization",
                token_url="https://www.linkedin.com/oauth/v2/accessToken",
                user_info_url="https://api.linkedin.com/v2/people/~",
                scopes=["r_liteprofile", "r_emailaddress"]
            )
        
        return configs
    
    def get_authorization_url(self, provider: OAuth2Provider, redirect_uri: str, state: str) -> str:
        """Get OAuth2 authorization URL."""
        config = self.providers.get(provider)
        if not config:
            raise ValueError(f"OAuth2 provider {provider} not configured")
        
        params = {
            "client_id": config.client_id,
            "redirect_uri": redirect_uri,
            "scope": " ".join(config.scopes),
            "response_type": "code",
            "state": state
        }
        
        param_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{config.authorize_url}?{param_string}"
    
    async def exchange_code_for_token(self, provider: OAuth2Provider, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        config = self.providers.get(provider)
        if not config:
            raise ValueError(f"OAuth2 provider {provider} not configured")
        
        data = {
            "client_id": config.client_id,
            "client_secret": config.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(config.token_url, data=data)
            response.raise_for_status()
            return response.json()
    
    async def get_user_info(self, provider: OAuth2Provider, access_token: str) -> Dict[str, Any]:
        """Get user information from OAuth2 provider."""
        config = self.providers.get(provider)
        if not config:
            raise ValueError(f"OAuth2 provider {provider} not configured")
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(config.user_info_url, headers=headers)
            response.raise_for_status()
            return response.json()


class SecurityService:
    """Main security service coordinating all security features."""
    
    def __init__(self):
        self.encryption = EncryptionService()
        self.audit_logger = AuditLogger()
        self.oauth2 = OAuth2Service()
    
    async def audit_event(self, event_type: AuditEventType, resource: str, action: str,
                         user_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None,
                         ip_address: Optional[str] = None, user_agent: Optional[str] = None,
                         success: bool = True, risk_score: int = 0) -> str:
        """Log an audit event."""
        tenant = get_current_tenant()
        tenant_id = tenant.tenant_id if tenant else "system"
        
        event = AuditEvent(
            id=secrets.token_urlsafe(16),
            tenant_id=tenant_id,
            user_id=user_id,
            event_type=event_type,
            resource=resource,
            action=action,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            risk_score=risk_score
        )
        
        return await self.audit_logger.log_event(event)
    
    def encrypt_sensitive_data(self, data: Dict[str, Any], sensitive_fields: List[str]) -> Dict[str, Any]:
        """Encrypt sensitive fields in data."""
        tenant_id = get_tenant_id()
        return self.encryption.encrypt_dict(data, sensitive_fields, tenant_id)
    
    def decrypt_sensitive_data(self, data: Dict[str, Any], encrypted_fields: List[str]) -> Dict[str, Any]:
        """Decrypt sensitive fields in data."""
        tenant_id = get_tenant_id()
        return self.encryption.decrypt_dict(data, encrypted_fields, tenant_id)
    
    async def initiate_oauth2_login(self, provider: OAuth2Provider, redirect_uri: str) -> Dict[str, str]:
        """Initiate OAuth2 login flow."""
        state = secrets.token_urlsafe(32)
        authorization_url = self.oauth2.get_authorization_url(provider, redirect_uri, state)
        
        await self.audit_event(
            AuditEventType.LOGIN,
            "oauth2",
            "initiate_login",
            details={"provider": provider.value, "redirect_uri": redirect_uri}
        )
        
        return {
            "authorization_url": authorization_url,
            "state": state
        }
    
    async def complete_oauth2_login(self, provider: OAuth2Provider, code: str, state: str, redirect_uri: str) -> Dict[str, Any]:
        """Complete OAuth2 login flow."""
        try:
            # Exchange code for token
            token_data = await self.oauth2.exchange_code_for_token(provider, code, redirect_uri)
            
            # Get user info
            user_info = await self.oauth2.get_user_info(provider, token_data["access_token"])
            
            await self.audit_event(
                AuditEventType.LOGIN,
                "oauth2",
                "complete_login",
                details={
                    "provider": provider.value,
                    "user_email": user_info.get("email"),
                    "success": True
                },
                success=True
            )
            
            return {
                "token_data": token_data,
                "user_info": user_info,
                "success": True
            }
            
        except Exception as e:
            await self.audit_event(
                AuditEventType.FAILED_LOGIN,
                "oauth2",
                "complete_login",
                details={
                    "provider": provider.value,
                    "error": str(e),
                    "success": False
                },
                success=False,
                risk_score=50
            )
            raise


# Global security service instance
security_service = SecurityService()


# Decorator for auditing function calls
def audit_action(event_type: AuditEventType, resource: str, action: str):
    """Decorator to automatically audit function calls."""
    def decorator(func):
        async def async_wrapper(*args, **kwargs):
            try:
                result = await func(*args, **kwargs)
                await security_service.audit_event(
                    event_type, resource, action, success=True
                )
                return result
            except Exception as e:
                await security_service.audit_event(
                    event_type, resource, action, 
                    success=False, details={"error": str(e)}, risk_score=30
                )
                raise
        
        def sync_wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)
                # For sync functions, we can't await, so we'd need to handle differently
                return result
            except Exception as e:
                raise
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    return decorator


# Security middleware for sensitive data encryption
def encrypt_sensitive_fields(fields: List[str]):
    """Decorator to automatically encrypt sensitive fields."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            if isinstance(result, dict):
                return security_service.encrypt_sensitive_data(result, fields)
            return result
        return wrapper
    return decorator 