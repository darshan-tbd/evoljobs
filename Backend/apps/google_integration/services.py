"""
Google Integration Services for JobPilot (EvolJobs.com)
Handles Gmail API interactions, OAuth token management, and email monitoring
"""

import os
import base64
import email
import logging
import time
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile

import google.auth
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import requests

from .models import (
    GoogleIntegration, EmailSentRecord, EmailResponse, 
    AutoApplySession, GoogleAPIQuota
)
from apps.jobs.models import JobPosting
from apps.applications.models import JobApplication
from apps.subscriptions.services import SubscriptionService

User = get_user_model()
logger = logging.getLogger(__name__)

class GoogleOAuthService:
    """
    Service for handling Google OAuth 2.0 authentication
    """
    
    # Required scopes for Gmail API access
    SCOPES = [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid'
    ]
    
    def __init__(self):
        self.client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', None)
        self.client_secret = getattr(settings, 'GOOGLE_OAUTH_CLIENT_SECRET', None)
        self.redirect_uri = getattr(settings, 'GOOGLE_OAUTH_REDIRECT_URI', None)
        
        if not all([self.client_id, self.client_secret, self.redirect_uri]):
            logger.error("Google OAuth credentials not properly configured")
    
    def get_authorization_url(self, user: User) -> str:
        """
        Generate authorization URL for OAuth flow
        """
        try:
            flow = Flow.from_client_config(
                client_config={
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "redirect_uris": [self.redirect_uri],
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                },
                scopes=self.SCOPES
            )
            flow.redirect_uri = self.redirect_uri
            
            # Use user ID as state parameter for security
            state = f"{user.id}:{str(uuid.uuid4())}"
            
            authorization_url, _ = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                prompt='consent',  # Force consent to get refresh token
                state=state,
            )
            
            return authorization_url
            
        except Exception as e:
            logger.error(f"Error generating authorization URL: {e}")
            raise
    
    def get_authorization_url_for_registration(self, state: str) -> str:
        """
        Generate authorization URL for OAuth flow during registration (no user required)
        """
        try:
            flow = Flow.from_client_config(
                client_config={
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "redirect_uris": [self.redirect_uri],
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                },
                scopes=self.SCOPES
            )
            flow.redirect_uri = self.redirect_uri
            
            authorization_url, _ = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                prompt='consent',  # Force consent to get refresh token
                state=state,
            )
            
            return authorization_url
            
        except Exception as e:
            logger.error(f"Error generating authorization URL for registration: {e}")
            raise
    
    def get_user_info_from_code(self, authorization_code: str, state: str) -> dict:
        """
        Get user info from Google using authorization code (for registration flow)
        """
        try:
            logger.info(f"Starting OAuth token exchange for state: {state}")
            logger.info(f"Using redirect URI: {self.redirect_uri}")
            logger.info(f"Using client ID: {self.client_id[:10]}...")  # Log partial client ID for debugging
            
            # Exchange authorization code for tokens
            flow = Flow.from_client_config(
                client_config={
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "redirect_uris": [self.redirect_uri],
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                },
                scopes=self.SCOPES
            )
            flow.redirect_uri = self.redirect_uri
            
            logger.info("Attempting to fetch tokens from Google...")
            
            # Fetch tokens
            flow.fetch_token(code=authorization_code)
            credentials = flow.credentials
            
            logger.info(f"Successfully received tokens from Google")
            logger.info(f"Access token present: {bool(credentials.token)}")
            logger.info(f"Refresh token present: {bool(credentials.refresh_token)}")
            
            # Get user info from Google
            user_info = self._get_google_user_info(credentials.token)
            
            if not user_info:
                raise Exception("Failed to get user info from Google")
            
            logger.info(f"Successfully retrieved user info for: {user_info.get('email', 'unknown')}")
            
            # Return user info along with tokens for account creation
            return {
                'user_info': user_info,
                'access_token': credentials.token,
                'refresh_token': credentials.refresh_token,
                'expires_at': credentials.expiry.isoformat() if credentials.expiry else None
            }
            
        except Exception as e:
            logger.error(f"Error getting user info from code: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            if hasattr(e, 'args') and e.args:
                logger.error(f"Error details: {e.args}")
            
            # Re-raise with more specific error message
            if "invalid_grant" in str(e).lower():
                raise Exception("(invalid_grant) The authorization code is invalid, expired, or has already been used. Please try the OAuth flow again.")
            elif "invalid_client" in str(e).lower():
                raise Exception("(invalid_client) Google OAuth client configuration is invalid. Please check your client ID and secret.")
            else:
                raise Exception(f"Google OAuth error: {str(e)}")
    
    def handle_oauth_callback(self, authorization_code: str, state: str, authenticated_user: User = None, credentials = None) -> GoogleIntegration:
        """
        Handle OAuth callback and exchange code for tokens
        """
        try:
            # Use authenticated user if provided, otherwise extract from state parameter
            user = authenticated_user
            
            if not user:
                # Extract user ID from state parameter as fallback
                try:
                    user_id_str, _ = state.split(':', 1)
                    # Handle UUID user IDs (not integers)
                    user = User.objects.get(id=user_id_str)
                    logger.info(f"Retrieved user from state parameter: {user.email}")
                except (ValueError, User.DoesNotExist) as e:
                    logger.error(f"Invalid state parameter or user not found: {state}")
                    raise Exception("Invalid OAuth state parameter")
            else:
                logger.info(f"Using authenticated user for OAuth callback: {user.email}")
            
            # Use provided credentials or exchange authorization code for tokens
            if credentials:
                logger.info("Using provided credentials (avoiding double authorization code usage)")
            else:
                # Exchange authorization code for tokens
                flow = Flow.from_client_config(
                    client_config={
                        "web": {
                            "client_id": self.client_id,
                            "client_secret": self.client_secret,
                            "redirect_uris": [self.redirect_uri],
                            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                            "token_uri": "https://oauth2.googleapis.com/token",
                        }
                    },
                    scopes=self.SCOPES
                )
                flow.redirect_uri = self.redirect_uri
                
                # Fetch tokens
                flow.fetch_token(code=authorization_code)
                credentials = flow.credentials
            
            # Log token information for debugging
            logger.info(f"OAuth tokens received - Access token: {bool(credentials.token)}, Refresh token: {bool(credentials.refresh_token)}")
            
            if not credentials.refresh_token:
                logger.warning(f"No refresh token received for user. This might happen if the user has already authorized the app recently.")
            
            # Get user info from Google
            user_info = self._get_google_user_info(credentials.token)
            
            # Create or update Google integration
            integration, created = GoogleIntegration.objects.get_or_create(
                user=user,
                defaults={
                    'google_email': user_info.get('email', ''),
                    'google_user_id': user_info.get('id', ''),
                    'access_token_encrypted': '',
                    'refresh_token_encrypted': '',
                    'status': 'disconnected',
                }
            )
            
            # Store tokens
            integration.set_tokens(
                access_token=credentials.token,
                refresh_token=credentials.refresh_token,
                expires_in=credentials.expiry.timestamp() - time.time() if credentials.expiry else 3600
            )
            
            integration.scope = ' '.join(self.SCOPES)
            integration.google_email = user_info.get('email', '')
            integration.google_user_id = user_info.get('id', '')
            
            # If no refresh token, add a note about re-authorization
            if not credentials.refresh_token:
                integration.last_error = "No refresh token received. Re-authorization may be required when access token expires."
            
            integration.save()
            
            logger.info(f"OAuth successful for user {user.email}")
            return integration
            
        except Exception as e:
            logger.error(f"Error handling OAuth callback: {e}")
            raise
    
    def refresh_access_token(self, integration: GoogleIntegration) -> bool:
        """
        Refresh access token using refresh token
        """
        try:
            refresh_token = integration.get_refresh_token()
            if not refresh_token:
                integration.status = 'expired'
                integration.save()
                return False
            
            # Refresh token
            credentials = Credentials(
                token=None,
                refresh_token=refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=self.client_id,
                client_secret=self.client_secret,
                scopes=self.SCOPES
            )
            
            credentials.refresh(Request())
            
            # Update stored tokens
            integration.set_tokens(
                access_token=credentials.token,
                refresh_token=credentials.refresh_token or refresh_token,
                expires_in=credentials.expiry.timestamp() - time.time() if credentials.expiry else 3600
            )
            
            logger.info(f"Token refreshed for user {integration.user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Error refreshing token for {integration.user.email}: {e}")
            integration.record_error(f"Token refresh failed: {str(e)}")
            return False
    
    def revoke_access(self, integration: GoogleIntegration) -> bool:
        """
        Revoke Google access and clear tokens
        """
        try:
            access_token = integration.get_access_token()
            if access_token:
                # Revoke token at Google
                revoke_url = f"https://oauth2.googleapis.com/revoke?token={access_token}"
                response = requests.post(revoke_url)
                
                if response.status_code != 200:
                    logger.warning(f"Failed to revoke token at Google: {response.status_code}")
            
            # Clear local tokens
            integration.clear_tokens()
            integration.status = 'revoked'
            integration.auto_apply_enabled = False
            integration.save()
            
            logger.info(f"Access revoked for user {integration.user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Error revoking access for {integration.user.email}: {e}")
            integration.record_error(f"Revoke access failed: {str(e)}")
            return False
    
    def _get_google_user_info(self, access_token: str) -> Dict:
        """
        Get user information from Google using access token
        """
        try:
            response = requests.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error getting Google user info: {e}")
            return {}


class GmailAPIService:
    """
    Service for interacting with Gmail API
    """
    
    def __init__(self, integration: GoogleIntegration):
        self.integration = integration
        self.oauth_service = GoogleOAuthService()
        self._service = None
    
    def _get_service(self):
        """
        Get authenticated Gmail service
        """
        if self._service is None:
            try:
                # Check if token is valid
                if not self.integration.is_token_valid:
                    if not self.oauth_service.refresh_access_token(self.integration):
                        raise Exception("Unable to refresh access token")
                
                access_token = self.integration.get_access_token()
                if not access_token:
                    raise Exception("No valid access token available")
                
                # Create credentials
                credentials = Credentials(
                    token=access_token,
                    token_uri="https://oauth2.googleapis.com/token",
                    client_id=self.oauth_service.client_id,
                    client_secret=self.oauth_service.client_secret,
                    scopes=GoogleOAuthService.SCOPES
                )
                
                # Build service
                self._service = build('gmail', 'v1', credentials=credentials)
                
                # Record API call
                quota = GoogleAPIQuota.get_or_create_today(self.integration)
                quota.record_api_call()
                
            except Exception as e:
                logger.error(f"Error creating Gmail service: {e}")
                self.integration.record_error(f"Gmail service error: {str(e)}")
                raise
        
        return self._service
    
    def send_job_application_email(
        self, 
        job: JobPosting, 
        cover_letter: str, 
        resume_file: Optional[Any] = None,
        additional_attachments: List[Tuple[str, bytes]] = None,
        use_static_template: bool = False
    ) -> Optional[EmailSentRecord]:
        """
        Send job application email via Gmail API
        """
        try:
            # Check quota
            quota = GoogleAPIQuota.get_or_create_today(self.integration)
            if not quota.can_send_email():
                raise Exception("Daily email quota exceeded")
            
            # Get recipient email
            to_email = self._extract_contact_email(job)
            if not to_email:
                raise Exception("No contact email found for job")
            
            # Create email
            message = self._create_job_application_message(
                job=job,
                cover_letter=cover_letter,
                to_email=to_email,
                resume_file=resume_file,
                additional_attachments=additional_attachments or [],
                use_static_template=use_static_template
            )
            
            # Send email
            service = self._get_service()
            sent_message = service.users().messages().send(
                userId='me',
                body=message
            ).execute()
            
            # Create appropriate subject for record keeping
            if use_static_template:
                category_name = job.job_category.name if job.job_category else job.title
                subject = f"Application for {category_name} Position"
                email_body = f"Static template auto-application for {category_name} position"
            else:
                subject = f"Application for {job.title} Position"
                email_body = cover_letter
            
            # Record sent email
            email_record = EmailSentRecord.objects.create(
                google_integration=self.integration,
                job=job,
                gmail_message_id=sent_message['id'],
                to_email=to_email,
                subject=subject,
                email_body=email_body,
                attachments=[resume_file.name] if resume_file else [],
                status='sent',
                metadata={
                    'thread_id': sent_message.get('threadId'),
                    'label_ids': sent_message.get('labelIds', []),
                    'auto_apply': use_static_template
                }
            )
            
            # Update quota
            quota.record_email_sent()
            
            logger.info(f"Job application email sent for job {job.id}")
            return email_record
            
        except Exception as e:
            logger.error(f"Error sending job application email: {e}")
            self.integration.record_error(f"Email send error: {str(e)}")
            return None
    
    def _create_job_application_message(
        self, 
        job: JobPosting, 
        cover_letter: str, 
        to_email: str,
        resume_file: Optional[Any] = None,
        additional_attachments: List[Tuple[str, bytes]] = None,
        use_static_template: bool = False
    ) -> Dict:
        """
        Create email message for job application
        """
        # Create multipart message
        message = MIMEMultipart()
        message['to'] = to_email
        message['from'] = self.integration.google_email
        
        # Use static template for auto apply as specified in requirements
        if use_static_template:
            # Static subject format: "Application for [Job Category] Position"
            category_name = job.job_category.name if job.job_category else job.title
            message['subject'] = f"Application for {category_name} Position"
            
            # Static email body format as specified
            body = f"""Hello,

I am writing to express my interest in the {category_name} role at your company. Please find my resume attached. Looking forward to hearing from you.

Best regards,
{self.integration.user.get_full_name()}"""
        else:
            # Dynamic template for manual applications
            message['subject'] = f"Application for {job.title} Position"
            body = f"""Dear Hiring Manager,

{cover_letter}

Best regards,
{self.integration.user.get_full_name()}
{self.integration.user.email}

---
This email was sent through JobPilot on behalf of {self.integration.user.get_full_name()}.
"""
        
        message.attach(MIMEText(body, 'plain'))
        
        # Attach resume
        if resume_file:
            try:
                attachment = MIMEBase('application', 'octet-stream')
                attachment.set_payload(resume_file.read())
                encoders.encode_base64(attachment)
                attachment.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {resume_file.name}'
                )
                message.attach(attachment)
            except Exception as e:
                logger.error(f"Error attaching resume: {e}")
        
        # Attach additional files
        for filename, file_content in additional_attachments:
            try:
                attachment = MIMEBase('application', 'octet-stream')
                attachment.set_payload(file_content)
                encoders.encode_base64(attachment)
                attachment.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {filename}'
                )
                message.attach(attachment)
            except Exception as e:
                logger.error(f"Error attaching {filename}: {e}")
        
        # Encode message
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        return {'raw': raw_message}
    
    def _extract_contact_email(self, job: JobPosting) -> Optional[str]:
        """
        Extract contact email from job posting, prioritizing company contact email
        """
        # Priority 1: Company contact email (as specified in requirements)
        if job.company and job.company.email:
            return job.company.email
        
        # Priority 2: Job's direct application email
        if hasattr(job, 'application_email') and job.application_email:
            return job.application_email
        
        # Priority 3: Check if job has direct contact email
        if hasattr(job, 'contact_email') and job.contact_email:
            return job.contact_email
        
        # Check company email
        if job.company and hasattr(job.company, 'email') and job.company.email:
            return job.company.email
        
        # Try to extract from job description using simple pattern matching
        import re
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        
        if job.description:
            emails = re.findall(email_pattern, job.description)
            if emails:
                return emails[0]  # Return first found email
        
        # Check if there's an application URL that might contain email
        if hasattr(job, 'application_url') and job.application_url:
            # This would need more sophisticated parsing
            pass
        
        return None
    
    def check_for_responses(self) -> List[EmailResponse]:
        """
        Check for new responses to sent emails
        """
        try:
            service = self._get_service()
            new_responses = []
            
            # Get sent emails from last 30 days
            cutoff_date = timezone.now() - timedelta(days=30)
            sent_emails = self.integration.sent_emails.filter(
                sent_at__gte=cutoff_date
            )
            
            for sent_email in sent_emails:
                try:
                    # Get message thread
                    thread_id = sent_email.metadata.get('thread_id')
                    if not thread_id:
                        continue
                    
                    thread = service.users().threads().get(
                        userId='me',
                        id=thread_id
                    ).execute()
                    
                    # Check for new messages in thread
                    for message in thread.get('messages', []):
                        if message['id'] == sent_email.gmail_message_id:
                            continue  # Skip our original message
                        
                        # Check if we already have this response
                        if EmailResponse.objects.filter(
                            gmail_message_id=message['id']
                        ).exists():
                            continue
                        
                        # Parse message
                        response = self._parse_email_response(message, sent_email)
                        if response:
                            new_responses.append(response)
                            
                            # Update sent email response count
                            sent_email.response_count += 1
                            sent_email.last_response_at = response.received_at
                            sent_email.status = 'replied'
                            sent_email.save()
                    
                except Exception as e:
                    logger.error(f"Error checking responses for email {sent_email.id}: {e}")
                    continue
            
            logger.info(f"Found {len(new_responses)} new responses")
            return new_responses
            
        except Exception as e:
            logger.error(f"Error checking for responses: {e}")
            self.integration.record_error(f"Response check error: {str(e)}")
            return []
    
    def _parse_email_response(
        self, 
        message: Dict, 
        sent_email: EmailSentRecord
    ) -> Optional[EmailResponse]:
        """
        Parse Gmail message and create EmailResponse
        """
        try:
            # Get message details
            msg_data = message.get('payload', {})
            headers = {h['name']: h['value'] for h in msg_data.get('headers', [])}
            
            # Extract body
            body = self._extract_message_body(msg_data)
            
            # Parse date
            received_at = datetime.fromtimestamp(
                int(message['internalDate']) / 1000,
                tz=timezone.utc
            )
            
            # Classify response type
            response_type = self._classify_response(body, headers.get('Subject', ''))
            
            # Create response record
            response = EmailResponse.objects.create(
                sent_email=sent_email,
                gmail_message_id=message['id'],
                thread_id=message.get('threadId', ''),
                from_email=headers.get('From', ''),
                subject=headers.get('Subject', ''),
                body=body,
                received_at=received_at,
                response_type=response_type,
                is_automated=self._is_automated_response(body, headers),
                requires_action=response_type in ['interview_invitation', 'request_info'],
                extracted_data=self._extract_response_data(body)
            )
            
            logger.info(f"Created response record {response.id}")
            return response
            
        except Exception as e:
            logger.error(f"Error parsing email response: {e}")
            return None
    
    def _extract_message_body(self, payload: Dict) -> str:
        """
        Extract text content from email message payload
        """
        body = ""
        
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    data = part['body'].get('data', '')
                    if data:
                        body += base64.urlsafe_b64decode(data).decode('utf-8')
        elif payload['body'].get('data'):
            body = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8')
        
        return body
    
    def _classify_response(self, body: str, subject: str) -> str:
        """
        Classify email response type using keywords
        """
        body_lower = body.lower()
        subject_lower = subject.lower()
        
        # Interview keywords
        interview_keywords = [
            'interview', 'meeting', 'call', 'discuss', 'schedule',
            'available', 'time', 'calendar', 'appointment'
        ]
        
        # Rejection keywords
        rejection_keywords = [
            'unfortunately', 'regret', 'declined', 'not selected',
            'other candidates', 'position filled', 'thank you for your interest'
        ]
        
        # Auto-reply keywords
        auto_reply_keywords = [
            'auto-reply', 'automatic', 'out of office', 'vacation',
            'away', 'do not reply'
        ]
        
        # Information request keywords
        info_request_keywords = [
            'portfolio', 'samples', 'references', 'additional information',
            'questions', 'clarification', 'details'
        ]
        
        text = body_lower + ' ' + subject_lower
        
        if any(keyword in text for keyword in auto_reply_keywords):
            return 'auto_reply'
        elif any(keyword in text for keyword in interview_keywords):
            return 'interview_invitation'
        elif any(keyword in text for keyword in rejection_keywords):
            return 'rejection'
        elif any(keyword in text for keyword in info_request_keywords):
            return 'request_info'
        else:
            return 'reply'
    
    def _is_automated_response(self, body: str, headers: Dict) -> bool:
        """
        Determine if response is automated
        """
        auto_indicators = [
            'auto-reply', 'automatic', 'do not reply', 'noreply',
            'automated', 'system generated'
        ]
        
        # Check headers
        auto_reply_header = headers.get('Auto-Submitted', '').lower()
        if auto_reply_header and auto_reply_header != 'no':
            return True
        
        # Check body
        body_lower = body.lower()
        return any(indicator in body_lower for indicator in auto_indicators)
    
    def _extract_response_data(self, body: str) -> Dict:
        """
        Extract structured data from response using simple pattern matching
        """
        import re
        
        data = {}
        
        # Extract phone numbers
        phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        phones = re.findall(phone_pattern, body)
        if phones:
            data['phone_numbers'] = phones
        
        # Extract dates (simple patterns)
        date_patterns = [
            r'\b\d{1,2}/\d{1,2}/\d{4}\b',
            r'\b\d{1,2}-\d{1,2}-\d{4}\b',
            r'\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b',
            r'\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b'
        ]
        
        dates = []
        for pattern in date_patterns:
            dates.extend(re.findall(pattern, body, re.IGNORECASE))
        
        if dates:
            data['mentioned_dates'] = dates
        
        # Extract times
        time_pattern = r'\b\d{1,2}:\d{2}\s?(AM|PM|am|pm)?\b'
        times = re.findall(time_pattern, body)
        if times:
            data['mentioned_times'] = times
        
        return data


class AutoApplyService:
    """
    Service for automated job applications
    """
    
    def __init__(self, integration: GoogleIntegration):
        self.integration = integration
        self.gmail_service = GmailAPIService(integration)
        self.subscription_service = SubscriptionService()
    
    def start_auto_apply_session(
        self, 
        max_applications: int = None, 
        search_filters: Dict = None
    ) -> AutoApplySession:
        """
        Start an automated job application session
        """
        try:
            # Get user's subscription limits
            subscription = self.subscription_service.get_active_subscription(
                self.integration.user
            )
            
            if not subscription:
                raise Exception("No active subscription found")
            
            # Determine max applications based on subscription
            if max_applications is None:
                max_applications = subscription.plan.daily_application_limit
            else:
                max_applications = min(max_applications, subscription.plan.daily_application_limit)
            
            # Check daily usage
            daily_usage = self.subscription_service.get_daily_usage(self.integration.user)
            remaining_applications = daily_usage.get_remaining_applications(
                subscription.plan.daily_application_limit
            )
            
            if remaining_applications <= 0:
                raise Exception("Daily application limit reached")
            
            max_applications = min(max_applications, remaining_applications)
            
            # Use filters from integration or provided filters
            filters = search_filters or self.integration.auto_apply_filters
            
            # Create session
            session = AutoApplySession.objects.create(
                google_integration=self.integration,
                max_applications=max_applications,
                search_filters=filters
            )
            
            logger.info(f"Started auto-apply session {session.session_id}")
            return session
            
        except Exception as e:
            logger.error(f"Error starting auto-apply session: {e}")
            raise
    
    def execute_auto_apply_session(self, session: AutoApplySession) -> Dict:
        """
        Execute auto-apply session
        """
        try:
            results = {
                'jobs_found': 0,
                'applications_sent': 0,
                'applications_failed': 0,
                'errors': []
            }
            
            # Find matching jobs
            jobs = self._find_matching_jobs(
                session.search_filters, 
                session.max_applications
            )
            
            session.jobs_found = len(jobs)
            session.save()
            results['jobs_found'] = len(jobs)
            
            # Apply to each job
            for job in jobs:
                try:
                    if session.applications_sent >= session.max_applications:
                        break
                    
                    # Check if already auto-applied to this job
                    from apps.applications.models import AutoAppliedJob
                    existing_auto_apply = AutoAppliedJob.objects.filter(
                        user=self.integration.user,
                        job=job
                    ).first()
                    
                    if existing_auto_apply:
                        logger.info(f"Already auto-applied to job {job.id}, skipping")
                        continue
                    
                    # Verify company has contact email
                    if not job.company or not job.company.email:
                        logger.warning(f"Job {job.id} has no company contact email, skipping")
                        continue
                    
                    # Generate static cover letter (minimal for auto apply)
                    category_name = job.job_category.name if job.job_category else job.title
                    static_cover_letter = f"Auto-application for {category_name} position"
                    
                    # Get user's resume
                    resume_file = self._get_user_resume()
                    
                    # Send application using static template
                    email_record = self.gmail_service.send_job_application_email(
                        job=job,
                        cover_letter=static_cover_letter,
                        resume_file=resume_file,
                        use_static_template=True  # Use static template for auto apply
                    )
                    
                    if email_record:
                        # Create AutoAppliedJob record for tracking
                        auto_applied_job = AutoAppliedJob.objects.create(
                            user=self.integration.user,
                            job=job,
                            application_method='email',
                            email_status='sent',
                            company_email=job.company.email,
                            gmail_message_id=email_record.gmail_message_id,
                            cover_letter_sent=static_cover_letter,
                            resume_attached=bool(resume_file)
                        )
                        
                        # Also create regular JobApplication record if needed
                        application = JobApplication.objects.create(
                            job=job,
                            applicant=self.integration.user,
                            cover_letter=static_cover_letter,
                            status='pending',
                            is_external_application=True,
                            external_url=email_record.gmail_message_id
                        )
                        
                        # Link the records
                        auto_applied_job.job_application = application
                        auto_applied_job.save()
                        
                        email_record.application = application
                        email_record.save()
                        
                        # Record in subscription usage
                        self.subscription_service.record_application(
                            self.integration.user, 
                            job
                        )
                        
                        session.applications_sent += 1
                        results['applications_sent'] += 1
                        
                        logger.info(f"Auto-applied to job {job.id} at {job.company.name} ({job.company.email})")
                    else:
                        # Record failed attempt
                        AutoAppliedJob.objects.create(
                            user=self.integration.user,
                            job=job,
                            application_method='email',
                            email_status='failed',
                            company_email=job.company.email if job.company else '',
                            error_message="Failed to send email"
                        )
                        session.applications_failed += 1
                        results['applications_failed'] += 1
                        results['errors'].append(f"Failed to send email for job {job.id}")
                
                except Exception as e:
                    # Record error in tracking
                    try:
                        from apps.applications.models import AutoAppliedJob
                        AutoAppliedJob.objects.create(
                            user=self.integration.user,
                            job=job,
                            application_method='email',
                            email_status='failed',
                            company_email=job.company.email if job.company and job.company.email else '',
                            error_message=str(e)[:500]  # Truncate long error messages
                        )
                    except:
                        pass  # Don't fail if we can't record the error
                    
                    session.applications_failed += 1
                    results['applications_failed'] += 1
                    error_msg = f"Error auto-applying to job {job.id}: {str(e)}"
                    results['errors'].append(error_msg)
                    logger.error(error_msg)
                
                session.save()
            
            # Mark session as completed
            session.mark_completed(results)
            
            logger.info(f"Auto-apply session {session.session_id} completed")
            return results
            
        except Exception as e:
            session.mark_failed(str(e))
            logger.error(f"Auto-apply session {session.session_id} failed: {e}")
            raise
    
    def _find_matching_jobs(self, filters: Dict, limit: int) -> List[JobPosting]:
        """
        Find jobs matching the specified filters and user's preferred categories
        """
        from django.db import models
        from apps.jobs.models import JobPosting
        from apps.applications.models import JobApplication
        
        queryset = JobPosting.objects.filter(status='active', is_deleted=False)
        
        # CRITICAL: Filter by user's preferred job categories first
        user_categories = self.integration.user.preferred_job_categories.all()
        if user_categories.exists():
            queryset = queryset.filter(job_category__in=user_categories)
            logger.info(f"Auto-apply filtered by user {self.integration.user.email}'s preferred categories: {[cat.name for cat in user_categories]}")
        else:
            logger.warning(f"User {self.integration.user.email} has no preferred job categories - no jobs will be auto-applied to")
            return []
        
        # Apply additional filters
        if filters.get('keywords'):
            keywords = filters['keywords']
            queryset = queryset.filter(
                models.Q(title__icontains=keywords) |
                models.Q(description__icontains=keywords)
            )
        
        if filters.get('location'):
            location = filters['location']
            queryset = queryset.filter(
                models.Q(location__name__icontains=location) |
                models.Q(location__city__icontains=location) |
                models.Q(location__state__icontains=location)
            )
        
        if filters.get('job_type'):
            queryset = queryset.filter(job_type=filters['job_type'])
        
        if filters.get('experience_level'):
            queryset = queryset.filter(experience_level=filters['experience_level'])
        
        if filters.get('salary_min'):
            queryset = queryset.filter(salary_max__gte=filters['salary_min'])
        
        # Exclude jobs already applied to
        applied_jobs = JobApplication.objects.filter(
            applicant=self.integration.user
        ).values_list('job_id', flat=True)
        
        queryset = queryset.exclude(id__in=applied_jobs)
        
        # Order by created date (newest first)
        results = list(queryset.order_by('-created_at')[:limit])
        
        logger.info(f"Found {len(results)} matching jobs for auto-apply (user: {self.integration.user.email})")
        return results
    
    def _generate_cover_letter(self, job: JobPosting) -> str:
        """
        Generate personalized cover letter for job
        """
        user = self.integration.user
        profile = getattr(user, 'profile', None)
        
        # Basic template - could be enhanced with AI generation
        template = f"""Dear Hiring Manager,

I am writing to express my strong interest in the {job.title} position at {job.company.name}. 

{self._get_relevant_experience_text(job, profile)}

I am excited about the opportunity to contribute to your team and would welcome the chance to discuss how my skills and experience align with your needs.

Thank you for considering my application. I look forward to hearing from you.

Sincerely,
{user.get_full_name()}"""
        
        return template
    
    def _get_relevant_experience_text(self, job: JobPosting, profile) -> str:
        """
        Generate relevant experience text based on job and user profile
        """
        if not profile:
            return "With my background and enthusiasm for this role, I believe I would be a valuable addition to your team."
        
        experience_text = ""
        
        if profile.current_job_title:
            experience_text += f"As a {profile.current_job_title}, "
        
        if profile.experience_level:
            level_text = {
                'entry': 'entry-level professional',
                'mid': 'mid-level professional', 
                'senior': 'senior professional',
                'executive': 'executive'
            }.get(profile.experience_level, 'professional')
            
            experience_text += f"I bring the perspective of a {level_text} "
        
        experience_text += "with relevant skills and experience that align well with your requirements."
        
        return experience_text
    
    def _get_user_resume(self):
        """
        Get user's primary resume file
        """
        user = self.integration.user
        profile = getattr(user, 'profile', None)
        
        if profile and profile.primary_resume:
            return profile.primary_resume.file
        elif profile and profile.resume:
            return profile.resume
        
        return None 