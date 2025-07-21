"""
Integration Marketplace Service
Provides framework for 3rd-party ATS/CRM integrations and webhook management.
"""
import json
import asyncio
import hashlib
import hmac
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import httpx
from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks
from fastapi.responses import JSONResponse
import redis
from sqlalchemy import create_engine, text

# Import shared modules
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'shared'))

from tenant_context import get_current_tenant, require_tenant_context
from auth import get_current_tenant_user, User, require_permission, Permission
from security import security_service, AuditEventType


class IntegrationType(str, Enum):
    """Types of integrations supported."""
    ATS = "ats"  # Applicant Tracking System
    CRM = "crm"  # Customer Relationship Management
    HRIS = "hris"  # Human Resources Information System
    COMMUNICATION = "communication"  # Email, SMS, etc.
    PAYMENT = "payment"  # Payment processing
    ANALYTICS = "analytics"  # Analytics platforms
    BACKGROUND_CHECK = "background_check"
    ASSESSMENT = "assessment"  # Skills assessment
    VIDEO_INTERVIEW = "video_interview"
    SOCIAL_MEDIA = "social_media"


class IntegrationStatus(str, Enum):
    """Integration status states."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    ERROR = "error"
    SUSPENDED = "suspended"


class WebhookEventType(str, Enum):
    """Types of webhook events."""
    APPLICATION_RECEIVED = "application.received"
    APPLICATION_UPDATED = "application.updated"
    APPLICATION_REJECTED = "application.rejected"
    APPLICATION_HIRED = "application.hired"
    JOB_CREATED = "job.created"
    JOB_UPDATED = "job.updated"
    JOB_CLOSED = "job.closed"
    USER_CREATED = "user.created"
    USER_UPDATED = "user.updated"
    COMPANY_UPDATED = "company.updated"


@dataclass
class Integration:
    """Integration configuration."""
    id: str
    tenant_id: str
    name: str
    provider: str
    integration_type: IntegrationType
    status: IntegrationStatus
    config: Dict[str, Any] = field(default_factory=dict)
    credentials: Dict[str, Any] = field(default_factory=dict)
    webhook_url: Optional[str] = None
    webhook_secret: Optional[str] = None
    api_endpoint: Optional[str] = None
    rate_limit: int = 1000  # requests per hour
    last_sync: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary (excluding sensitive data)."""
        return {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "name": self.name,
            "provider": self.provider,
            "integration_type": self.integration_type.value,
            "status": self.status.value,
            "webhook_url": self.webhook_url,
            "api_endpoint": self.api_endpoint,
            "rate_limit": self.rate_limit,
            "last_sync": self.last_sync.isoformat() if self.last_sync else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


@dataclass
class WebhookEvent:
    """Webhook event data."""
    id: str
    tenant_id: str
    integration_id: str
    event_type: WebhookEventType
    payload: Dict[str, Any]
    headers: Dict[str, str] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)
    processed: bool = False
    retry_count: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "integration_id": self.integration_id,
            "event_type": self.event_type.value,
            "payload": self.payload,
            "headers": self.headers,
            "timestamp": self.timestamp.isoformat(),
            "processed": self.processed,
            "retry_count": self.retry_count
        }


class IntegrationProvider:
    """Base class for integration providers."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
    
    async def authenticate(self, credentials: Dict[str, Any]) -> bool:
        """Authenticate with the provider."""
        raise NotImplementedError
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test connection to the provider."""
        raise NotImplementedError
    
    async def sync_data(self, data_type: str, last_sync: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Sync data from the provider."""
        raise NotImplementedError
    
    async def send_data(self, data_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Send data to the provider."""
        raise NotImplementedError


class GreenhouseProvider(IntegrationProvider):
    """Greenhouse ATS integration."""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get("api_key")
        self.base_url = "https://harvest.greenhouse.io/v1"
    
    async def authenticate(self, credentials: Dict[str, Any]) -> bool:
        """Authenticate with Greenhouse."""
        try:
            headers = {"Authorization": f"Basic {credentials.get('api_key')}"}
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/users", headers=headers)
                return response.status_code == 200
        except Exception:
            return False
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test Greenhouse connection."""
        headers = {"Authorization": f"Basic {self.api_key}"}
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/users", headers=headers)
                if response.status_code == 200:
                    return {"status": "success", "message": "Connection successful"}
                else:
                    return {"status": "error", "message": f"HTTP {response.status_code}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def sync_data(self, data_type: str, last_sync: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Sync data from Greenhouse."""
        headers = {"Authorization": f"Basic {self.api_key}"}
        
        if data_type == "applications":
            url = f"{self.base_url}/applications"
            if last_sync:
                url += f"?updated_after={last_sync.isoformat()}"
        elif data_type == "jobs":
            url = f"{self.base_url}/jobs"
        else:
            return []
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    return response.json()
                return []
        except Exception:
            return []
    
    async def send_data(self, data_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Send data to Greenhouse."""
        headers = {
            "Authorization": f"Basic {self.api_key}",
            "Content-Type": "application/json"
        }
        
        if data_type == "application":
            url = f"{self.base_url}/applications"
        else:
            return {"status": "error", "message": "Unsupported data type"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=data, headers=headers)
                return {
                    "status": "success" if response.status_code == 201 else "error",
                    "response": response.json() if response.status_code == 201 else response.text
                }
        except Exception as e:
            return {"status": "error", "message": str(e)}


class SalesforceProvider(IntegrationProvider):
    """Salesforce CRM integration."""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.client_id = config.get("client_id")
        self.client_secret = config.get("client_secret")
        self.instance_url = config.get("instance_url", "https://login.salesforce.com")
        self.access_token = None
    
    async def authenticate(self, credentials: Dict[str, Any]) -> bool:
        """Authenticate with Salesforce."""
        try:
            data = {
                "grant_type": "password",
                "client_id": credentials.get("client_id"),
                "client_secret": credentials.get("client_secret"),
                "username": credentials.get("username"),
                "password": f"{credentials.get('password')}{credentials.get('security_token', '')}"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(f"{self.instance_url}/services/oauth2/token", data=data)
                if response.status_code == 200:
                    token_data = response.json()
                    self.access_token = token_data.get("access_token")
                    return True
                return False
        except Exception:
            return False
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test Salesforce connection."""
        if not self.access_token:
            return {"status": "error", "message": "Not authenticated"}
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.instance_url}/services/data/v54.0/", headers=headers)
                if response.status_code == 200:
                    return {"status": "success", "message": "Connection successful"}
                else:
                    return {"status": "error", "message": f"HTTP {response.status_code}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def sync_data(self, data_type: str, last_sync: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Sync data from Salesforce."""
        if not self.access_token:
            return []
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        if data_type == "contacts":
            query = "SELECT Id, Name, Email, Phone FROM Contact"
            if last_sync:
                query += f" WHERE LastModifiedDate > {last_sync.isoformat()}"
        elif data_type == "accounts":
            query = "SELECT Id, Name, Industry FROM Account"
        else:
            return []
        
        try:
            params = {"q": query}
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.instance_url}/services/data/v54.0/query/",
                    headers=headers,
                    params=params
                )
                if response.status_code == 200:
                    return response.json().get("records", [])
                return []
        except Exception:
            return []


class IntegrationService:
    """Main integration service."""
    
    def __init__(self):
        self.redis_client = redis.Redis.from_url("redis://redis:6379")
        self.providers = {
            "greenhouse": GreenhouseProvider,
            "salesforce": SalesforceProvider,
        }
    
    @require_tenant_context
    async def create_integration(self, integration_data: Dict[str, Any]) -> Integration:
        """Create a new integration."""
        tenant = get_current_tenant()
        
        integration = Integration(
            id=f"int_{hash(f'{tenant.tenant_id}_{integration_data['provider']}_{datetime.utcnow().timestamp()}')}",
            tenant_id=tenant.tenant_id,
            name=integration_data["name"],
            provider=integration_data["provider"],
            integration_type=IntegrationType(integration_data["integration_type"]),
            status=IntegrationStatus.PENDING,
            config=integration_data.get("config", {}),
            webhook_url=integration_data.get("webhook_url"),
            api_endpoint=integration_data.get("api_endpoint"),
            rate_limit=integration_data.get("rate_limit", 1000)
        )
        
        # Encrypt sensitive credentials
        if "credentials" in integration_data:
            integration.credentials = security_service.encrypt_sensitive_data(
                integration_data["credentials"],
                ["api_key", "client_secret", "password", "token"]
            )
        
        # Test the integration
        test_result = await self.test_integration(integration)
        if test_result["status"] == "success":
            integration.status = IntegrationStatus.ACTIVE
        else:
            integration.status = IntegrationStatus.ERROR
        
        # Store in database (implement based on your DB choice)
        await self._store_integration(integration)
        
        await security_service.audit_event(
            AuditEventType.CONFIGURATION_CHANGE,
            "integration",
            "create",
            details={"integration_id": integration.id, "provider": integration.provider}
        )
        
        return integration
    
    async def test_integration(self, integration: Integration) -> Dict[str, Any]:
        """Test an integration connection."""
        provider_class = self.providers.get(integration.provider)
        if not provider_class:
            return {"status": "error", "message": "Unsupported provider"}
        
        # Decrypt credentials
        credentials = security_service.decrypt_sensitive_data(
            integration.credentials,
            ["api_key", "client_secret", "password", "token"]
        )
        
        provider = provider_class(integration.config)
        
        # Authenticate first
        auth_result = await provider.authenticate(credentials)
        if not auth_result:
            return {"status": "error", "message": "Authentication failed"}
        
        # Test connection
        return await provider.test_connection()
    
    @require_tenant_context
    async def sync_integration_data(self, integration_id: str, data_type: str) -> Dict[str, Any]:
        """Sync data from an integration."""
        integration = await self._get_integration(integration_id)
        if not integration:
            raise HTTPException(status_code=404, detail="Integration not found")
        
        provider_class = self.providers.get(integration.provider)
        if not provider_class:
            return {"status": "error", "message": "Unsupported provider"}
        
        # Decrypt credentials
        credentials = security_service.decrypt_sensitive_data(
            integration.credentials,
            ["api_key", "client_secret", "password", "token"]
        )
        
        provider = provider_class(integration.config)
        
        # Authenticate
        auth_result = await provider.authenticate(credentials)
        if not auth_result:
            return {"status": "error", "message": "Authentication failed"}
        
        # Sync data
        data = await provider.sync_data(data_type, integration.last_sync)
        
        # Update last sync time
        integration.last_sync = datetime.utcnow()
        await self._store_integration(integration)
        
        await security_service.audit_event(
            AuditEventType.DATA_ACCESS,
            "integration",
            "sync_data",
            details={
                "integration_id": integration_id,
                "data_type": data_type,
                "records_synced": len(data)
            }
        )
        
        return {"status": "success", "data": data, "count": len(data)}
    
    async def process_webhook(self, integration_id: str, event_type: str, payload: Dict[str, Any], 
                             headers: Dict[str, str]) -> Dict[str, Any]:
        """Process incoming webhook."""
        integration = await self._get_integration(integration_id)
        if not integration:
            raise HTTPException(status_code=404, detail="Integration not found")
        
        # Verify webhook signature if secret is set
        if integration.webhook_secret:
            signature = headers.get("X-Hub-Signature-256") or headers.get("X-Signature")
            if not self._verify_webhook_signature(payload, integration.webhook_secret, signature):
                raise HTTPException(status_code=401, detail="Invalid webhook signature")
        
        # Create webhook event
        webhook_event = WebhookEvent(
            id=f"wh_{hash(f'{integration_id}_{datetime.utcnow().timestamp()}')}",
            tenant_id=integration.tenant_id,
            integration_id=integration_id,
            event_type=WebhookEventType(event_type),
            payload=payload,
            headers=headers
        )
        
        # Process the webhook event
        await self._process_webhook_event(webhook_event)
        
        await security_service.audit_event(
            AuditEventType.API_ACCESS,
            "webhook",
            "process",
            details={
                "integration_id": integration_id,
                "event_type": event_type,
                "webhook_id": webhook_event.id
            }
        )
        
        return {"status": "success", "webhook_id": webhook_event.id}
    
    def _verify_webhook_signature(self, payload: Dict[str, Any], secret: str, signature: str) -> bool:
        """Verify webhook signature."""
        if not signature:
            return False
        
        payload_bytes = json.dumps(payload, sort_keys=True).encode()
        expected_signature = hmac.new(
            secret.encode(),
            payload_bytes,
            hashlib.sha256
        ).hexdigest()
        
        # Remove prefix if present (e.g., "sha256=")
        if "=" in signature:
            signature = signature.split("=", 1)[1]
        
        return hmac.compare_digest(expected_signature, signature)
    
    async def _process_webhook_event(self, event: WebhookEvent):
        """Process a webhook event."""
        try:
            if event.event_type == WebhookEventType.APPLICATION_RECEIVED:
                await self._handle_application_webhook(event)
            elif event.event_type == WebhookEventType.JOB_CREATED:
                await self._handle_job_webhook(event)
            # Add more event handlers as needed
            
            event.processed = True
        except Exception as e:
            event.retry_count += 1
            if event.retry_count < 3:
                # Schedule retry
                await self._schedule_webhook_retry(event)
    
    async def _handle_application_webhook(self, event: WebhookEvent):
        """Handle application webhook event."""
        # Implementation would sync application data to your database
        pass
    
    async def _handle_job_webhook(self, event: WebhookEvent):
        """Handle job webhook event."""
        # Implementation would sync job data to your database
        pass
    
    async def _schedule_webhook_retry(self, event: WebhookEvent):
        """Schedule webhook retry."""
        retry_delay = 60 * (2 ** event.retry_count)  # Exponential backoff
        # Implementation would schedule retry using background tasks
        pass
    
    async def _store_integration(self, integration: Integration):
        """Store integration in database."""
        # Implementation would store in your database
        pass
    
    async def _get_integration(self, integration_id: str) -> Optional[Integration]:
        """Get integration by ID."""
        # Implementation would retrieve from your database
        return None


# Initialize FastAPI app
app = FastAPI(
    title="Integration Marketplace Service",
    description="3rd-party integrations and webhook management",
    version="1.0.0"
)

# Initialize service
integration_service = IntegrationService()


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "integrations"}


@app.get("/api/v1/integrations/providers")
async def get_available_providers(user: User = Depends(get_current_tenant_user)):
    """Get list of available integration providers."""
    providers = {
        "greenhouse": {
            "name": "Greenhouse",
            "type": "ats",
            "description": "Leading ATS platform",
            "auth_type": "api_key",
            "features": ["applications", "jobs", "candidates"]
        },
        "salesforce": {
            "name": "Salesforce",
            "type": "crm",
            "description": "World's #1 CRM platform",
            "auth_type": "oauth2",
            "features": ["contacts", "accounts", "opportunities"]
        },
        "workday": {
            "name": "Workday",
            "type": "hris",
            "description": "Enterprise HR platform",
            "auth_type": "oauth2",
            "features": ["employees", "positions", "org_structure"]
        },
        "bamboohr": {
            "name": "BambooHR",
            "type": "hris",
            "description": "HR software for small & medium businesses",
            "auth_type": "api_key",
            "features": ["employees", "time_off", "performance"]
        },
        "lever": {
            "name": "Lever",
            "type": "ats",
            "description": "Modern recruiting platform",
            "auth_type": "api_key",
            "features": ["opportunities", "candidates", "postings"]
        }
    }
    
    return {"providers": providers}


@app.post("/api/v1/integrations")
async def create_integration(
    integration_data: Dict[str, Any],
    user: User = Depends(get_current_tenant_user)
):
    """Create a new integration."""
    if not user.has_permission(Permission.MANAGE_INTEGRATIONS):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    integration = await integration_service.create_integration(integration_data)
    return {"integration": integration.to_dict()}


@app.get("/api/v1/integrations/{integration_id}/test")
async def test_integration(
    integration_id: str,
    user: User = Depends(get_current_tenant_user)
):
    """Test an integration connection."""
    if not user.has_permission(Permission.MANAGE_INTEGRATIONS):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    integration = await integration_service._get_integration(integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    result = await integration_service.test_integration(integration)
    return result


@app.post("/api/v1/integrations/{integration_id}/sync/{data_type}")
async def sync_integration_data(
    integration_id: str,
    data_type: str,
    user: User = Depends(get_current_tenant_user)
):
    """Sync data from an integration."""
    if not user.has_permission(Permission.MANAGE_INTEGRATIONS):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    result = await integration_service.sync_integration_data(integration_id, data_type)
    return result


@app.post("/api/v1/webhooks/{integration_id}/{event_type}")
async def process_webhook(
    integration_id: str,
    event_type: str,
    request: Request,
    background_tasks: BackgroundTasks
):
    """Process incoming webhook."""
    payload = await request.json()
    headers = dict(request.headers)
    
    result = await integration_service.process_webhook(
        integration_id, event_type, payload, headers
    )
    
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8010) 