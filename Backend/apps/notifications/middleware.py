from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from urllib.parse import parse_qs
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

@database_sync_to_async
def get_user_from_token(token_string):
    """
    Get user from JWT token
    """
    try:
        # Validate and decode the token
        access_token = AccessToken(token_string)
        user_id = access_token['user_id']
        
        # Get the user
        user = User.objects.get(id=user_id)
        return user
    except (InvalidToken, TokenError, User.DoesNotExist) as e:
        logger.warning(f"Invalid token or user: {e}")
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    """
    JWT authentication middleware for Django Channels
    """
    
    async def __call__(self, scope, receive, send):
        # Only process WebSocket connections
        if scope["type"] == "websocket":
            # Get token from query string
            query_string = scope.get("query_string", b"").decode()
            query_params = parse_qs(query_string)
            
            # Look for token in query params
            token = None
            if "token" in query_params:
                token = query_params["token"][0]
            
            # If no token in query params, check headers
            if not token:
                headers = dict(scope.get("headers", []))
                auth_header = headers.get(b"authorization", b"").decode()
                if auth_header.startswith("Bearer "):
                    token = auth_header[7:]
            
            # Authenticate user
            if token:
                scope["user"] = await get_user_from_token(token)
            else:
                scope["user"] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)

def JWTAuthMiddlewareStack(inner):
    """
    JWT authentication middleware stack for Django Channels
    """
    return JWTAuthMiddleware(inner) 