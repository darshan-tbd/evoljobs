"""
Authentication views for JobPilot (EvolJobs.com) Backend.
Handles user registration, login, logout, and token management.
"""

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.cache import cache
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    PasswordResetSerializer,
    PasswordResetConfirmSerializer
)
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def debug_google_config(request):
    """
    Debug endpoint to check Google OAuth configuration
    """
    try:
        from apps.google_integration.services import GoogleOAuthService
        oauth_service = GoogleOAuthService()
        
        return Response({
            'client_id_configured': bool(oauth_service.client_id),
            'client_secret_configured': bool(oauth_service.client_secret),
            'redirect_uri': oauth_service.redirect_uri,
            'scopes': oauth_service.SCOPES,
            'client_id_prefix': oauth_service.client_id[:20] + '...' if oauth_service.client_id else 'Not set'
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_google_auth_url(request):
    """
    Debug endpoint to get full Google authorization URL for manual testing
    """
    try:
        from apps.google_integration.services import GoogleOAuthService
        oauth_service = GoogleOAuthService()
        
        # Generate a test state
        import uuid
        state = f"test:{str(uuid.uuid4())}"
        
        auth_url = oauth_service.get_authorization_url_for_registration(state)
        
        return Response({
            'authorization_url': auth_url,
            'state': state,
            'redirect_uri': oauth_service.redirect_uri,
            'instructions': 'Copy the authorization_url and paste it in your browser to test the Google OAuth flow manually.'
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GoogleAuthView(APIView):
    """
    Unified Google authentication endpoint for both login and registration
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Google OAuth authentication",
        description="Handle Google OAuth callback for both new user registration and existing user login",
        request={
            "type": "object",
            "properties": {
                "code": {"type": "string", "description": "Authorization code from Google"},
                "state": {"type": "string", "description": "State parameter from OAuth flow"}
            },
            "required": ["code", "state"]
        },
        responses={200: {
            "type": "object",
            "properties": {
                "user": {"$ref": "#/components/schemas/User"},
                "tokens": {
                    "type": "object",
                    "properties": {
                        "access": {"type": "string"},
                        "refresh": {"type": "string"}
                    }
                },
                "is_new_user": {"type": "boolean"}
            }
        }}
    )
    def post(self, request):
        """
        Handle Google OAuth callback
        """
        try:
            from apps.google_integration.services import GoogleOAuthService
            
            code = request.data.get('code')
            state = request.data.get('state')
            
            if not code or not state:
                return Response(
                    {'error': 'Missing code or state parameter'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create a cache key for this authorization code to prevent reuse
            cache_key = f"oauth_code_{code}"
            
            # Check if this code has already been used
            if cache.get(cache_key):
                logger.warning(f"Attempted reuse of authorization code: {code[:10]}...")
                return Response(
                    {'error': 'Authorization code has already been used. Please try the login flow again.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mark this code as used (expires in 10 minutes)
            cache.set(cache_key, True, timeout=600)
            
            logger.info(f"Processing Google OAuth for state: {state}")
            
            # Get user info from Google
            oauth_service = GoogleOAuthService()
            google_data = oauth_service.get_user_info_from_code(code, state)
            user_info = google_data['user_info']
            
            # Check if user exists
            try:
                user = User.objects.get(email=user_info['email'])
                is_new_user = False
            except User.DoesNotExist:
                # Create new user
                user_data = {
                    'email': user_info['email'],
                    'first_name': user_info.get('given_name', ''),
                    'last_name': user_info.get('family_name', ''),
                }
                
                # Use UserRegistrationSerializer without password requirement for Google OAuth
                serializer = UserRegistrationSerializer(data=user_data, require_password=False)
                if serializer.is_valid():
                    user = serializer.save()
                    is_new_user = True
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Create credentials object from the tokens we already have
            from google.oauth2.credentials import Credentials
            from datetime import datetime
            
            credentials = Credentials(
                token=google_data['access_token'],
                refresh_token=google_data['refresh_token'],
                token_uri="https://oauth2.googleapis.com/token",
                client_id=oauth_service.client_id,
                client_secret=oauth_service.client_secret,
                scopes=oauth_service.SCOPES
            )
            
            if google_data['expires_at']:
                from dateutil.parser import parse
                credentials.expiry = parse(google_data['expires_at'])
            
            # Handle Google integration for the user using existing credentials
            integration = oauth_service.handle_oauth_callback(code, state, authenticated_user=user, credentials=credentials)
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'is_new_user': is_new_user
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            logger.error(f"Google OAuth error: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            # Return detailed error for debugging
            return Response(
                {
                    'error': str(e),
                    'error_type': type(e).__name__,
                    'debug': str(traceback.format_exc()) if settings.DEBUG else None
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserRegistrationView(APIView):
    """
    User registration endpoint
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Register a new user",
        request=UserRegistrationSerializer,
        responses={201: UserSerializer}
    )
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(TokenObtainPairView):
    """
    User login endpoint with JWT tokens
    """
    serializer_class = UserLoginSerializer
    
    @extend_schema(
        summary="Login user",
        request=UserLoginSerializer,
        responses={200: UserSerializer}
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])
        
        user = serializer.user
        tokens = serializer.validated_data
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens
        }, status=status.HTTP_200_OK)

class UserLogoutView(APIView):
    """
    User logout endpoint
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="Logout user",
        responses={200: {"message": "Successfully logged out"}}
    )
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    """
    User profile endpoint
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="Get user profile",
        responses={200: UserSerializer}
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Update user profile",
        request=UserSerializer,
        responses={200: UserSerializer}
    )
    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    """
    Change password endpoint
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="Change user password",
        request=ChangePasswordSerializer,
        responses={200: {"message": "Password changed successfully"}}
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            
            # Check old password
            if not user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {"old_password": "Wrong password."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({"message": "Password changed successfully"})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetView(APIView):
    """
    Password reset request endpoint
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Request password reset",
        request=PasswordResetSerializer,
        responses={200: {"message": "Password reset email sent"}}
    )
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password reset email sent"})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    """
    Password reset confirmation endpoint
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Confirm password reset",
        request=PasswordResetConfirmSerializer,
        responses={200: {"message": "Password reset successful"}}
    )
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password reset successful"})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TokenRefreshView(TokenRefreshView):
    """
    Token refresh endpoint
    """
    
    @extend_schema(
        summary="Refresh JWT token",
        responses={200: {"access": "string", "refresh": "string"}}
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_token(request):
    """
    Verify JWT token endpoint
    """
    return Response({
        "valid": True,
        "user": UserSerializer(request.user).data
    })

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def auth_status(request):
    """
    Check authentication status
    """
    if request.user.is_authenticated:
        return Response({
            "authenticated": True,
            "user": UserSerializer(request.user).data
        })
    else:
        return Response({
            "authenticated": False,
            "user": None
        }) 