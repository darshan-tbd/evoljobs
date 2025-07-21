"""
Enterprise API Gateway for Recruitment Platform
Handles authentication, rate limiting, routing, and cross-cutting concerns.
"""
from typing import Dict, Any, Optional
import json
import time
from datetime import datetime

from fastapi import FastAPI, Request, Response, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import redis
from prometheus_client import Counter, Histogram, generate_latest

# Import shared modules
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.auth import get_current_tenant_user, User, auth_service
from shared.tenant_context import get_current_tenant, get_tenant_id
from shared.rate_limiter import rate_limit_middleware

# Metrics
REQUEST_COUNT = Counter('gateway_requests_total', 'Total requests', ['method', 'endpoint', 'status', 'tenant'])
REQUEST_DURATION = Histogram('gateway_request_duration_seconds', 'Request duration', ['method', 'endpoint', 'tenant'])

# Service Registry
SERVICE_REGISTRY = {
    "auth": "http://auth-service:8001",
    "tenant": "http://tenant-service:8002",
    "user": "http://user-service:8003",
    "company": "http://company-service:8004",
    "job": "http://job-service:8005",
    "application": "http://application-service:8006",
    "ai": "http://ai-service:8007",
    "analytics": "http://analytics-service:8008",
    "notification": "http://notification-service:8009",
    "integration": "http://integration-service:8010",
    "branding": "http://branding-service:8011",
}

# Create FastAPI app
app = FastAPI(
    title="Enterprise Recruitment Platform API Gateway",
    description="Multi-tenant API Gateway with enterprise features",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# HTTP client for service communication
http_client = httpx.AsyncClient(timeout=30.0)

# Redis client for caching
redis_client = redis.Redis.from_url("redis://redis:6379")


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time and tenant context to response headers."""
    start_time = time.time()
    
    # Process the request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Add tenant information if available
    tenant_id = get_tenant_id()
    if tenant_id:
        response.headers["X-Tenant-ID"] = tenant_id
    
    # Add security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    return response


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Collect metrics for monitoring."""
    start_time = time.time()
    
    # Get tenant info
    tenant_id = get_tenant_id() or "unknown"
    
    # Process request
    response = await call_next(request)
    
    # Record metrics
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code,
        tenant=tenant_id
    ).inc()
    
    REQUEST_DURATION.labels(
        method=request.method,
        endpoint=request.url.path,
        tenant=tenant_id
    ).observe(time.time() - start_time)
    
    return response


@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    """Apply rate limiting."""
    return await rate_limit_middleware(request, call_next)


async def get_service_url(service_name: str) -> str:
    """Get service URL from registry."""
    if service_name not in SERVICE_REGISTRY:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service '{service_name}' not found"
        )
    
    return SERVICE_REGISTRY[service_name]


async def proxy_request(
    request: Request,
    service_name: str,
    path: str,
    user: Optional[User] = None
) -> Response:
    """Proxy request to microservice."""
    service_url = await get_service_url(service_name)
    target_url = f"{service_url}{path}"
    
    # Prepare headers
    headers = dict(request.headers)
    
    # Add tenant and user context
    tenant_id = get_tenant_id()
    if tenant_id:
        headers["X-Tenant-ID"] = tenant_id
    
    if user:
        headers["X-User-ID"] = user.id
        headers["X-User-Roles"] = json.dumps([role.value for role in user.roles])
    
    # Remove hop-by-hop headers
    hop_by_hop_headers = {
        'connection', 'keep-alive', 'proxy-authenticate',
        'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade'
    }
    headers = {k: v for k, v in headers.items() if k.lower() not in hop_by_hop_headers}
    
    try:
        # Forward request
        if request.method == "GET":
            response = await http_client.get(
                target_url,
                headers=headers,
                params=request.query_params
            )
        elif request.method == "POST":
            body = await request.body()
            response = await http_client.post(
                target_url,
                headers=headers,
                params=request.query_params,
                content=body
            )
        elif request.method == "PUT":
            body = await request.body()
            response = await http_client.put(
                target_url,
                headers=headers,
                params=request.query_params,
                content=body
            )
        elif request.method == "DELETE":
            response = await http_client.delete(
                target_url,
                headers=headers,
                params=request.query_params
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
                detail=f"Method {request.method} not allowed"
            )
        
        # Return response
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=dict(response.headers)
        )
    
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unavailable: {str(e)}"
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Service error: {str(e)}"
        )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "3.0.0"
    }


# Metrics endpoint
@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint."""
    return Response(
        content=generate_latest(),
        media_type="text/plain"
    )


# Authentication endpoints (no auth required)
@app.post("/api/v1/auth/login")
async def login(request: Request):
    """Login endpoint."""
    return await proxy_request(request, "auth", "/api/v1/auth/login")


@app.post("/api/v1/auth/register")
async def register(request: Request):
    """Register endpoint."""
    return await proxy_request(request, "auth", "/api/v1/auth/register")


@app.post("/api/v1/auth/refresh")
async def refresh_token(request: Request):
    """Refresh token endpoint."""
    return await proxy_request(request, "auth", "/api/v1/auth/refresh")


@app.post("/api/v1/auth/logout")
async def logout(request: Request):
    """Logout endpoint."""
    return await proxy_request(request, "auth", "/api/v1/auth/logout")


# Public endpoints (no auth required)
@app.get("/api/v1/jobs/public")
async def get_public_jobs(request: Request):
    """Get public job listings."""
    return await proxy_request(request, "job", "/api/v1/jobs/public")


@app.get("/api/v1/companies/public")
async def get_public_companies(request: Request):
    """Get public company listings."""
    return await proxy_request(request, "company", "/api/v1/companies/public")


# Protected endpoints (require authentication)
@app.get("/api/v1/users/{path:path}")
async def user_service_proxy(
    request: Request,
    path: str,
    user: User = Depends(get_current_tenant_user)
):
    """Proxy to user service."""
    return await proxy_request(request, "user", f"/api/v1/users/{path}", user)


@app.post("/api/v1/users/{path:path}")
async def user_service_proxy_post(
    request: Request,
    path: str,
    user: User = Depends(get_current_tenant_user)
):
    """Proxy POST to user service."""
    return await proxy_request(request, "user", f"/api/v1/users/{path}", user)


@app.get("/api/v1/companies/{path:path}")
async def company_service_proxy(
    request: Request,
    path: str,
    user: User = Depends(get_current_tenant_user)
):
    """Proxy to company service."""
    return await proxy_request(request, "company", f"/api/v1/companies/{path}", user)


@app.post("/api/v1/companies/{path:path}")
async def company_service_proxy_post(
    request: Request,
    path: str,
    user: User = Depends(get_current_tenant_user)
):
    """Proxy POST to company service."""
    return await proxy_request(request, "company", f"/api/v1/companies/{path}", user)


@app.get("/api/v1/jobs/{path:path}")
async def job_service_proxy(
    request: Request,
    path: str,
    user: User = Depends(get_current_tenant_user)
):
    """Proxy to job service."""
    return await proxy_request(request, "job", f"/api/v1/jobs/{path}", user)


@app.post("/api/v1/jobs/{path:path}")
async def job_service_proxy_post(
    request: Request,
    path: str,
    user: User = Depends(get_current_tenant_user)
):
    """Proxy POST to job service."""
    return await proxy_request(request, "job", f"/api/v1/jobs/{path}", user)


@app.get("/api/v1/applications/{path:path}")
async def application_service_proxy(
    request: Request,
    path: str,
    user: User = Depends(get_current_tenant_user)
):
    """Proxy to application service."""
    return await proxy_request(request, "application", f"/api/v1/applications/{path}", user)


@app.post("/api/v1/applications/{path:path}")
async def application_service_proxy_post(
    request: Request,
    path: str,
    user: User = Depends(get_current_tenant_user)
):
    """Proxy POST to application service."""
    return await proxy_request(request, "application", f"/api/v1/applications/{path}", user)


@app.get("/api/v1/analytics/{path:path}")
async def analytics_service_proxy(
    request: Request,
    path: str,
    user: User = Depends(get_current_tenant_user)
):
    """Proxy to analytics service."""
    return await proxy_request(request, "analytics", f"/api/v1/analytics/{path}", user)


@app.get("/api/v1/ai/{path:path}")
async def ai_service_proxy(
    request: Request,
    path: str,
    user: User = Depends(get_current_tenant_user)
):
    """Proxy to AI service."""
    return await proxy_request(request, "ai", f"/api/v1/ai/{path}", user)


@app.post("/api/v1/ai/{path:path}")
async def ai_service_proxy_post(
    request: Request,
    path: str,
    user: User = Depends(get_current_tenant_user)
):
    """Proxy POST to AI service."""
    return await proxy_request(request, "ai", f"/api/v1/ai/{path}", user)


@app.get("/api/v1/notifications/{path:path}")
async def notification_service_proxy(
    request: Request,
    path: str,
    user: User = Depends(get_current_tenant_user)
):
    """Proxy to notification service."""
    return await proxy_request(request, "notification", f"/api/v1/notifications/{path}", user)


@app.post("/api/v1/notifications/{path:path}")
async def notification_service_proxy_post(
    request: Request,
    path: str,
    user: User = Depends(get_current_tenant_user)
):
    """Proxy POST to notification service."""
    return await proxy_request(request, "notification", f"/api/v1/notifications/{path}", user)


@app.get("/api/v1/integrations/{path:path}")
async def integration_service_proxy(
    request: Request,
    path: str,
    user: User = Depends(get_current_tenant_user)
):
    """Proxy to integration service."""
    return await proxy_request(request, "integration", f"/api/v1/integrations/{path}", user)


@app.post("/api/v1/integrations/{path:path}")
async def integration_service_proxy_post(
    request: Request,
    path: str,
    user: User = Depends(get_current_tenant_user)
):
    """Proxy POST to integration service."""
    return await proxy_request(request, "integration", f"/api/v1/integrations/{path}", user)


@app.get("/api/v1/branding/{path:path}")
async def branding_service_proxy(
    request: Request,
    path: str,
    user: User = Depends(get_current_tenant_user)
):
    """Proxy to branding service."""
    return await proxy_request(request, "branding", f"/api/v1/branding/{path}", user)


@app.post("/api/v1/branding/{path:path}")
async def branding_service_proxy_post(
    request: Request,
    path: str,
    user: User = Depends(get_current_tenant_user)
):
    """Proxy POST to branding service."""
    return await proxy_request(request, "branding", f"/api/v1/branding/{path}", user)


# Service discovery endpoint
@app.get("/api/v1/services")
async def get_services(user: User = Depends(get_current_tenant_user)):
    """Get available services."""
    return {
        "services": list(SERVICE_REGISTRY.keys()),
        "registry": SERVICE_REGISTRY
    }


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "timestamp": datetime.utcnow().isoformat(),
            "path": request.url.path
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "timestamp": datetime.utcnow().isoformat(),
            "path": request.url.path
        }
    )


# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Startup event handler."""
    print("🚀 API Gateway starting up...")
    
    # Initialize services
    # You could add health checks for downstream services here
    
    print("✅ API Gateway ready!")


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler."""
    print("🛑 API Gateway shutting down...")
    
    # Close HTTP client
    await http_client.aclose()
    
    print("✅ API Gateway shutdown complete!")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 