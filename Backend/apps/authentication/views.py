"""
Authentication views for JobPilot (EvolJobs.com) Backend.
Handles user registration, login, logout, and token management.
"""

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model
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

User = get_user_model()

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