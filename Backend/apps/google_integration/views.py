"""
Google Integration API views for JobPilot (EvolJobs.com)
Handles Google OAuth flow, integration management, and auto-apply settings
"""

import os
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Count, Q, Avg, Sum
from django.http import JsonResponse
from django.utils import timezone

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import (
    GoogleIntegration, EmailSentRecord, EmailResponse, 
    AutoApplySession, GoogleAPIQuota
)
from .serializers import (
    GoogleIntegrationSerializer, EmailSentRecordSerializer,
    EmailResponseSerializer, AutoApplySessionSerializer,
    GoogleAPIQuotaSerializer, AutoApplyConfigSerializer,
    AdminGoogleIntegrationSerializer, AdminEmailSentRecordSerializer,
    AdminEmailResponseSerializer, AdminAutoApplySessionSerializer
)
from .services import GoogleOAuthService, GmailAPIService
from .tasks import trigger_auto_apply_for_user

User = get_user_model()
logger = logging.getLogger(__name__)


class GoogleOAuthRegistrationView(APIView):
    """
    Handle Google OAuth flow for registration (unauthenticated access)
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Initiate Google OAuth flow for registration",
        description="Get authorization URL to start Google OAuth process for new user registration",
        responses={200: {"type": "object", "properties": {"authorization_url": {"type": "string"}}}}
    )
    def get(self, request):
        """
        Get Google OAuth authorization URL for registration
        """
        try:
            oauth_service = GoogleOAuthService()
            
            # Generate a unique state parameter for security
            state = f"registration:{str(uuid.uuid4())}"
            
            authorization_url = oauth_service.get_authorization_url_for_registration(state)
            
            return Response({
                'authorization_url': authorization_url,
                'message': 'Redirect user to this URL to complete Google authorization'
            })
            
        except Exception as e:
            logger.error(f"Error generating OAuth URL for registration: {e}")
            return Response(
                {'error': 'Failed to generate authorization URL'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GoogleOAuthView(APIView):
    """
    Handle Google OAuth flow
    """
    
    def get_permissions(self):
        """
        Different permissions for different methods
        """
        if self.request.method == 'GET':
            # GET (authorization URL) requires authentication
            return [permissions.IsAuthenticated()]
        else:
            # POST (callback) allows unauthenticated but we'll handle auth differently
            return [permissions.AllowAny()]
    
    @extend_schema(
        summary="Initiate Google OAuth flow",
        description="Get authorization URL to start Google OAuth process",
        responses={200: {"type": "object", "properties": {"authorization_url": {"type": "string"}}}}
    )
    def get(self, request):
        """
        Get Google OAuth authorization URL
        """
        try:
            oauth_service = GoogleOAuthService()
            authorization_url = oauth_service.get_authorization_url(request.user)
            
            return Response({
                'authorization_url': authorization_url,
                'message': 'Redirect user to this URL to complete Google authorization'
            })
            
        except Exception as e:
            logger.error(f"Error generating OAuth URL for {request.user.email}: {e}")
            return Response(
                {'error': 'Failed to generate authorization URL'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @extend_schema(
        summary="Handle OAuth callback",
        description="Complete OAuth flow with authorization code",
        request={
            "type": "object",
            "properties": {
                "code": {"type": "string", "description": "Authorization code from Google"},
                "state": {"type": "string", "description": "State parameter from OAuth flow"}
            },
            "required": ["code", "state"]
        },
        responses={200: GoogleIntegrationSerializer}
    )
    def post(self, request):
        """
        Handle OAuth callback with authorization code
        """
        try:
            code = request.data.get('code')
            state = request.data.get('state')
            
            logger.info(f"OAuth callback received - Code: {bool(code)}, State: {bool(state)}")
            
            if not code or not state:
                logger.error("Missing code or state parameter in OAuth callback")
                return Response(
                    {'error': 'Missing code or state parameter'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if user is authenticated via Authorization header
            user = None
            auth_header = request.META.get('HTTP_AUTHORIZATION')
            if auth_header and auth_header.startswith('Bearer '):
                from rest_framework_simplejwt.authentication import JWTAuthentication
                jwt_auth = JWTAuthentication()
                try:
                    validated_token = jwt_auth.get_validated_token(auth_header.split(' ')[1])
                    user = jwt_auth.get_user(validated_token)
                    logger.info(f"OAuth callback authenticated user: {user.email}")
                except Exception as auth_e:
                    logger.warning(f"Failed to authenticate user from token: {auth_e}")
            
            oauth_service = GoogleOAuthService()
            integration = oauth_service.handle_oauth_callback(code, state, authenticated_user=user)
            
            return Response({
                'integration': GoogleIntegrationSerializer(integration).data,
                'message': 'Google account connected successfully'
            })
            
        except Exception as e:
            logger.error(f"OAuth callback error: {e}", exc_info=True)
            return Response(
                {'error': str(e) if settings.DEBUG else 'Failed to complete OAuth flow'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GoogleIntegrationViewSet(ViewSet):
    """
    Manage Google integrations
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_integration(self):
        """Get user's Google integration"""
        try:
            return self.request.user.google_integration
        except GoogleIntegration.DoesNotExist:
            return None
    
    @extend_schema(
        summary="Get Google integration status",
        responses={200: GoogleIntegrationSerializer}
    )
    def list(self, request):
        """
        Get current Google integration status
        """
        integration = self.get_integration()
        
        if not integration:
            return Response({
                'integration': None,
                'status': 'not_connected',
                'message': 'No Google integration found'
            })
        
        return Response({
            'integration': GoogleIntegrationSerializer(integration).data,
            'status': integration.status
        })
    
    @extend_schema(
        summary="Update auto-apply settings",
        request=AutoApplyConfigSerializer,
        responses={200: GoogleIntegrationSerializer}
    )
    @action(detail=False, methods=['post'])
    def update_auto_apply_settings(self, request):
        """
        Update auto-apply configuration
        """
        integration = self.get_integration()
        
        if not integration:
            return Response(
                {'error': 'Google integration not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if integration.status != 'connected':
            return Response(
                {'error': 'Google integration not connected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = AutoApplyConfigSerializer(data=request.data)
        if serializer.is_valid():
            integration.auto_apply_enabled = serializer.validated_data['auto_apply_enabled']
            integration.auto_apply_filters = serializer.validated_data.get('auto_apply_filters', {})
            integration.save()
            
            return Response({
                'integration': GoogleIntegrationSerializer(integration).data,
                'message': 'Auto-apply settings updated successfully'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        summary="Disconnect Google account",
        responses={200: {"type": "object", "properties": {"message": {"type": "string"}}}}
    )
    @action(detail=False, methods=['post'])
    def disconnect(self, request):
        """
        Disconnect Google account and revoke access
        """
        integration = self.get_integration()
        
        if not integration:
            return Response(
                {'error': 'Google integration not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            oauth_service = GoogleOAuthService()
            oauth_service.revoke_access(integration)
            
            return Response({
                'message': 'Google account disconnected successfully'
            })
            
        except Exception as e:
            logger.error(f"Error disconnecting Google account for {request.user.email}: {e}")
            return Response(
                {'error': 'Failed to disconnect Google account'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @extend_schema(
        summary="Trigger manual auto-apply",
        request={
            "type": "object",
            "properties": {
                "max_applications": {"type": "integer", "description": "Maximum applications to send"},
                "filters": {"type": "object", "description": "Job search filters"}
            }
        },
        responses={200: {"type": "object", "properties": {"session_id": {"type": "string"}}}}
    )
    @action(detail=False, methods=['post'])
    def trigger_auto_apply(self, request):
        """
        Manually trigger auto-apply process
        """
        integration = self.get_integration()
        
        if not integration:
            return Response(
                {'error': 'Google integration not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if integration.status != 'connected':
            return Response(
                {'error': 'Google integration not connected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not integration.auto_apply_enabled:
            return Response(
                {'error': 'Auto-apply is disabled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            max_applications = request.data.get('max_applications')
            filters = request.data.get('filters')
            
            # Trigger auto-apply task
            result = trigger_auto_apply_for_user.delay(
                request.user.id,
                max_applications=max_applications,
                filters=filters
            )
            
            return Response({
                'task_id': result.id,
                'message': 'Auto-apply process started'
            })
            
        except Exception as e:
            logger.error(f"Error triggering auto-apply for {request.user.email}: {e}")
            return Response(
                {'error': 'Failed to start auto-apply process'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @extend_schema(
        summary="Check for email responses",
        responses={200: {"type": "object", "properties": {"task_id": {"type": "string"}}}}
    )
    @action(detail=False, methods=['post'])
    def check_responses(self, request):
        """
        Manually check for email responses
        """
        integration = self.get_integration()
        
        if not integration:
            return Response(
                {'error': 'Google integration not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if integration.status != 'connected':
            return Response(
                {'error': 'Google integration not connected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Trigger response check task
            result = check_email_responses_for_integration.delay(integration.id)
            
            return Response({
                'task_id': result.id,
                'message': 'Email response check started'
            })
            
        except Exception as e:
            logger.error(f"Error checking responses for {request.user.email}: {e}")
            return Response(
                {'error': 'Failed to start response check'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EmailActivityViewSet(ViewSet):
    """
    View email activities and responses
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_integration(self):
        """Get user's Google integration"""
        try:
            return self.request.user.google_integration
        except GoogleIntegration.DoesNotExist:
            return None
    
    @extend_schema(
        summary="Get sent emails",
        parameters=[
            OpenApiParameter(name='limit', type=int, description='Number of records to return'),
            OpenApiParameter(name='offset', type=int, description='Number of records to skip'),
        ],
        responses={200: EmailSentRecordSerializer(many=True)}
    )
    def list(self, request):
        """
        Get sent email records
        """
        integration = self.get_integration()
        
        if not integration:
            return Response(
                {'error': 'Google integration not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get query parameters
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))
        
        # Get sent emails
        sent_emails = integration.sent_emails.all()[offset:offset+limit]
        
        return Response({
            'emails': EmailSentRecordSerializer(sent_emails, many=True).data,
            'total': integration.sent_emails.count()
        })
    
    @extend_schema(
        summary="Get email responses",
        parameters=[
            OpenApiParameter(name='limit', type=int, description='Number of records to return'),
            OpenApiParameter(name='offset', type=int, description='Number of records to skip'),
            OpenApiParameter(name='unprocessed_only', type=bool, description='Show only unprocessed responses'),
        ],
        responses={200: EmailResponseSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def responses(self, request):
        """
        Get email responses
        """
        integration = self.get_integration()
        
        if not integration:
            return Response(
                {'error': 'Google integration not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get query parameters
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))
        unprocessed_only = request.query_params.get('unprocessed_only', 'false').lower() == 'true'
        
        # Get responses
        responses_qs = EmailResponse.objects.filter(
            sent_email__google_integration=integration
        )
        
        if unprocessed_only:
            responses_qs = responses_qs.filter(is_processed=False)
        
        responses = responses_qs.order_by('-received_at')[offset:offset+limit]
        
        return Response({
            'responses': EmailResponseSerializer(responses, many=True).data,
            'total': responses_qs.count(),
            'unprocessed_count': responses_qs.filter(is_processed=False).count()
        })
    
    @extend_schema(
        summary="Mark response as processed",
        request={
            "type": "object",
            "properties": {
                "action_taken": {"type": "string", "description": "Action taken on the response"}
            }
        },
        responses={200: EmailResponseSerializer}
    )
    @action(detail=True, methods=['post'])
    def mark_processed(self, request, pk=None):
        """
        Mark email response as processed
        """
        integration = self.get_integration()
        
        if not integration:
            return Response(
                {'error': 'Google integration not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            response = EmailResponse.objects.get(
                id=pk,
                sent_email__google_integration=integration
            )
            
            response.is_processed = True
            response.processed_at = timezone.now()
            response.action_taken = request.data.get('action_taken', '')
            response.save()
            
            return Response({
                'response': EmailResponseSerializer(response).data,
                'message': 'Response marked as processed'
            })
            
        except EmailResponse.DoesNotExist:
            return Response(
                {'error': 'Email response not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class AutoApplySessionViewSet(ViewSet):
    """
    View auto-apply sessions
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_integration(self):
        """Get user's Google integration"""
        try:
            return self.request.user.google_integration
        except GoogleIntegration.DoesNotExist:
            return None
    
    @extend_schema(
        summary="Get auto-apply sessions",
        parameters=[
            OpenApiParameter(name='limit', type=int, description='Number of records to return'),
            OpenApiParameter(name='offset', type=int, description='Number of records to skip'),
        ],
        responses={200: AutoApplySessionSerializer(many=True)}
    )
    def list(self, request):
        """
        Get auto-apply sessions
        """
        integration = self.get_integration()
        
        if not integration:
            return Response(
                {'error': 'Google integration not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get query parameters
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))
        
        # Get sessions
        sessions = integration.auto_apply_sessions.all()[offset:offset+limit]
        
        return Response({
            'sessions': AutoApplySessionSerializer(sessions, many=True).data,
            'total': integration.auto_apply_sessions.count()
        })
    
    @extend_schema(
        summary="Get session details",
        responses={200: AutoApplySessionSerializer}
    )
    def retrieve(self, request, pk=None):
        """
        Get specific session details
        """
        integration = self.get_integration()
        
        if not integration:
            return Response(
                {'error': 'Google integration not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            session = integration.auto_apply_sessions.get(session_id=pk)
            return Response({
                'session': AutoApplySessionSerializer(session).data
            })
            
        except AutoApplySession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class DashboardStatsView(APIView):
    """
    Get dashboard statistics for Google integration
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="Get dashboard statistics",
        responses={200: {
            "type": "object",
            "properties": {
                "integration_status": {"type": "string"},
                "emails_sent_today": {"type": "integer"},
                "emails_sent_this_week": {"type": "integer"},
                "emails_sent_this_month": {"type": "integer"},
                "responses_received": {"type": "integer"},
                "unprocessed_responses": {"type": "integer"},
                "active_sessions": {"type": "integer"},
                "quota_usage": {"type": "object"}
            }
        }}
    )
    def get(self, request):
        """
        Get dashboard statistics
        """
        try:
            integration = request.user.google_integration
        except GoogleIntegration.DoesNotExist:
            return Response({
                'integration_status': 'not_connected',
                'message': 'Google integration not found'
            })
        
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        today = now.date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        
        # Get email statistics
        emails_today = integration.sent_emails.filter(sent_at__date=today).count()
        emails_week = integration.sent_emails.filter(sent_at__date__gte=week_start).count()
        emails_month = integration.sent_emails.filter(sent_at__date__gte=month_start).count()
        
        # Get response statistics
        responses_total = EmailResponse.objects.filter(
            sent_email__google_integration=integration
        ).count()
        responses_unprocessed = EmailResponse.objects.filter(
            sent_email__google_integration=integration,
            is_processed=False
        ).count()
        
        # Get session statistics
        active_sessions = integration.auto_apply_sessions.filter(
            status='running'
        ).count()
        
        # Get quota usage
        quota = GoogleAPIQuota.get_or_create_today(integration)
        quota_usage = {
            'emails_sent': quota.emails_sent,
            'max_emails': quota.max_emails_per_day,
            'email_percentage': (quota.emails_sent / quota.max_emails_per_day) * 100,
            'api_calls': quota.api_calls,
            'max_api_calls': quota.max_api_calls_per_day,
            'api_percentage': (quota.api_calls / quota.max_api_calls_per_day) * 100
        }
        
        return Response({
            'integration_status': integration.status,
            'auto_apply_enabled': integration.auto_apply_enabled,
            'google_email': integration.google_email,
            'last_sync': integration.last_sync,
            'emails_sent_today': emails_today,
            'emails_sent_this_week': emails_week,
            'emails_sent_this_month': emails_month,
            'responses_received': responses_total,
            'unprocessed_responses': responses_unprocessed,
            'active_sessions': active_sessions,
            'quota_usage': quota_usage
        })


# Admin Views for managing Google integrations
class AdminGoogleIntegrationViewSet(ViewSet):
    """
    Admin interface for managing all Google integrations
    """
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    @extend_schema(
        summary="List all Google integrations (Admin)",
        responses={200: AdminGoogleIntegrationSerializer(many=True)}
    )
    def list(self, request):
        """Get all Google integrations for admin"""
        integrations = GoogleIntegration.objects.all().select_related('user')
        serializer = AdminGoogleIntegrationSerializer(integrations, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get integration details (Admin)",
        responses={200: AdminGoogleIntegrationSerializer}
    )
    def retrieve(self, request, pk=None):
        """Get specific integration details"""
        try:
            integration = GoogleIntegration.objects.select_related('user').get(pk=pk)
            serializer = AdminGoogleIntegrationSerializer(integration)
            return Response(serializer.data)
        except GoogleIntegration.DoesNotExist:
            return Response(
                {'error': 'Integration not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @extend_schema(
        summary="Disconnect integration (Admin)",
        request={
            "type": "object",
            "properties": {
                "integration_id": {"type": "string", "description": "Integration ID to disconnect"}
            }
        },
        responses={200: {"type": "object", "properties": {"message": {"type": "string"}}}}
    )
    @action(detail=False, methods=['post'])
    def disconnect(self, request):
        """Admin disconnect an integration"""
        integration_id = request.data.get('integration_id')
        
        try:
            integration = GoogleIntegration.objects.get(id=integration_id)
            oauth_service = GoogleOAuthService()
            oauth_service.revoke_access(integration)
            
            return Response({
                'message': f'Integration for {integration.user.email} disconnected successfully'
            })
            
        except GoogleIntegration.DoesNotExist:
            return Response(
                {'error': 'Integration not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Admin disconnect error: {e}")
            return Response(
                {'error': 'Failed to disconnect integration'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminEmailActivityViewSet(ViewSet):
    """
    Admin interface for viewing all email activities
    """
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    @extend_schema(
        summary="List all email records (Admin)",
        parameters=[
            OpenApiParameter(name='limit', type=int, description='Number of records to return'),
            OpenApiParameter(name='offset', type=int, description='Number of records to skip'),
        ],
        responses={200: AdminEmailSentRecordSerializer(many=True)}
    )
    def list(self, request):
        """Get all email records for admin"""
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))
        
        emails = EmailSentRecord.objects.all().select_related(
            'google_integration__user', 'job__company'
        ).order_by('-sent_at')[offset:offset+limit]
        
        serializer = AdminEmailSentRecordSerializer(emails, many=True)
        return Response({
            'emails': serializer.data,
            'total': EmailSentRecord.objects.count()
        })
    
    @extend_schema(
        summary="Get email responses (Admin)",
        parameters=[
            OpenApiParameter(name='limit', type=int, description='Number of records to return'),
            OpenApiParameter(name='offset', type=int, description='Number of records to skip'),
        ],
        responses={200: AdminEmailResponseSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def responses(self, request):
        """Get all email responses for admin"""
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))
        
        responses = EmailResponse.objects.all().select_related(
            'sent_email__google_integration__user', 'sent_email__job__company'
        ).order_by('-received_at')[offset:offset+limit]
        
        serializer = AdminEmailResponseSerializer(responses, many=True)
        return Response({
            'responses': serializer.data,
            'total': EmailResponse.objects.count()
        })


class AdminAutoApplySessionViewSet(ViewSet):
    """
    Admin interface for viewing all auto-apply sessions
    """
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    @extend_schema(
        summary="List all auto-apply sessions (Admin)",
        parameters=[
            OpenApiParameter(name='limit', type=int, description='Number of records to return'),
            OpenApiParameter(name='offset', type=int, description='Number of records to skip'),
        ],
        responses={200: AdminAutoApplySessionSerializer(many=True)}
    )
    def list(self, request):
        """Get all auto-apply sessions for admin"""
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))
        
        sessions = AutoApplySession.objects.all().select_related(
            'google_integration__user'
        ).order_by('-started_at')[offset:offset+limit]
        
        serializer = AdminAutoApplySessionSerializer(sessions, many=True)
        return Response({
            'sessions': serializer.data,
            'total': AutoApplySession.objects.count()
        })
    
    @extend_schema(
        summary="Get session details (Admin)",
        responses={200: AdminAutoApplySessionSerializer}
    )
    def retrieve(self, request, pk=None):
        """Get specific session details"""
        try:
            session = AutoApplySession.objects.select_related(
                'google_integration__user'
            ).get(pk=pk)
            serializer = AdminAutoApplySessionSerializer(session)
            return Response(serializer.data)
        except AutoApplySession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class AdminGoogleStatsView(APIView):
    """
    Admin dashboard statistics for Google integrations
    """
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    @extend_schema(
        summary="Get admin Google integration statistics",
        responses={200: {
            "type": "object",
            "properties": {
                "total_integrations": {"type": "integer"},
                "connected": {"type": "integer"},
                "active_auto_apply": {"type": "integer"},
                "emails_sent_today": {"type": "integer"},
                "emails_sent_week": {"type": "integer"},
                "responses_received_today": {"type": "integer"},
                "active_sessions": {"type": "integer"},
                "by_status": {"type": "object"}
            }
        }}
    )
    def get(self, request):
        """Get comprehensive Google integration statistics for admin"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        today = now.date()
        week_start = today - timedelta(days=today.weekday())
        
        # Basic stats
        total_integrations = GoogleIntegration.objects.count()
        connected = GoogleIntegration.objects.filter(status='connected').count()
        active_auto_apply = GoogleIntegration.objects.filter(auto_apply_enabled=True).count()
        
        # Email stats
        emails_sent_today = EmailSentRecord.objects.filter(sent_at__date=today).count()
        emails_sent_week = EmailSentRecord.objects.filter(sent_at__date__gte=week_start).count()
        
        # Response stats
        responses_received_today = EmailResponse.objects.filter(received_at__date=today).count()
        
        # Session stats
        active_sessions = AutoApplySession.objects.filter(status='running').count()
        
        # Status breakdown
        status_counts = {}
        for status_choice in GoogleIntegration.STATUS_CHOICES:
            status_key = status_choice[0]
            status_counts[status_key] = GoogleIntegration.objects.filter(status=status_key).count()
        
        return Response({
            'total_integrations': total_integrations,
            'connected': connected,
            'active_auto_apply': active_auto_apply,
            'emails_sent_today': emails_sent_today,
            'emails_sent_week': emails_sent_week,
            'responses_received_today': responses_received_today,
            'active_sessions': active_sessions,
            'by_status': status_counts
        })
