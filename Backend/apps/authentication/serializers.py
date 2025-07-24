"""
Authentication serializers for JobPilot (EvolJobs.com) Backend.
Handles serialization for user authentication operations.
"""

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import UserProfile

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    User serializer for basic user information with profile data
    """
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    # UserProfile fields
    phone = serializers.CharField(source='profile.phone', required=False, allow_blank=True)
    location = serializers.CharField(source='profile.location_text', required=False, allow_blank=True)
    bio = serializers.CharField(source='profile.bio', required=False, allow_blank=True)
    skills = serializers.CharField(required=False, allow_blank=True)
    experience = serializers.CharField(source='profile.experience', required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'user_type', 'is_active', 'is_verified', 'is_staff', 'is_superuser', 'date_joined',
            'phone', 'location', 'bio', 'skills', 'experience'
        ]
        read_only_fields = ['id', 'date_joined', 'is_active', 'is_verified', 'is_staff', 'is_superuser']
    
    def update(self, instance, validated_data):
        # Extract profile data
        profile_data = {}
        if 'profile' in validated_data:
            profile_data = validated_data.pop('profile')
        
        # Handle fields that go to profile
        skills = validated_data.pop('skills', None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update or create profile
        profile, created = UserProfile.objects.get_or_create(user=instance)
        
        # Update profile fields
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        
        # Handle skills as text
        if skills is not None:
            profile.skills_text = skills
        
        profile.save()
        
        return instance
    
    def to_representation(self, instance):
        """
        Serialize the user with profile data
        """
        data = super().to_representation(instance)
        
        # Add profile data if profile exists
        if hasattr(instance, 'profile'):
            profile = instance.profile
            data['phone'] = profile.phone
            data['location'] = profile.location_text
            data['bio'] = profile.bio
            data['skills'] = profile.skills_text
            data['experience'] = profile.experience
            
            # Add resume information from Resume model
            try:
                from apps.resumes.models import Resume
                primary_resume = Resume.objects.filter(user=instance, is_primary=True).first()
                if primary_resume:
                    data['resume'] = primary_resume.file.url if primary_resume.file else ''
                    data['resume_filename'] = primary_resume.original_filename
                    data['resume_id'] = primary_resume.id
                else:
                    data['resume'] = ''
                    data['resume_filename'] = ''
                    data['resume_id'] = None
            except:
                data['resume'] = ''
                data['resume_filename'] = ''
                data['resume_id'] = None
        else:
            # Set default values if no profile exists
            data['phone'] = ''
            data['location'] = ''
            data['bio'] = ''
            data['skills'] = ''
            data['experience'] = ''
            data['resume'] = ''
            data['resume_filename'] = ''
            data['resume_id'] = None
        
        return data

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    User registration serializer
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'user_type',
            'password', 'password_confirm'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        # Remove password_confirm from validated_data
        validated_data.pop('password_confirm', None)
        
        # Create user
        user = User.objects.create_user(
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            user_type=validated_data.get('user_type', 'job_seeker'),
            password=validated_data['password']
        )
        
        # Create user profile
        UserProfile.objects.create(
            user=user,
            bio='',
            phone='',
            location_text='',
            skills_text='',
            experience=''
        )
        
        return user

class UserLoginSerializer(TokenObtainPairSerializer):
    """
    Custom login serializer with JWT tokens
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['email'] = serializers.EmailField()
        self.fields['password'] = serializers.CharField()
        # Remove username field if it exists
        if 'username' in self.fields:
            del self.fields['username']
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                username=email,  # Our custom user model uses email as username
                password=password
            )
            
            if not user:
                raise serializers.ValidationError('Invalid email or password')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            
            # Store user for later use
            self.user = user
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        else:
            raise serializers.ValidationError('Must include email and password')

class ChangePasswordSerializer(serializers.Serializer):
    """
    Change password serializer
    """
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs

class PasswordResetSerializer(serializers.Serializer):
    """
    Password reset request serializer
    """
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist")
        return value
    
    def save(self):
        email = self.validated_data['email']
        user = User.objects.get(email=email)
        
        # TODO: Implement password reset email sending
        # This would typically involve:
        # 1. Generate a password reset token
        # 2. Send email with reset link
        # 3. Store token temporarily (Redis or database)
        
        return user

class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Password reset confirmation serializer
    """
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def save(self):
        # TODO: Implement password reset confirmation
        # This would typically involve:
        # 1. Validate the token
        # 2. Find the user associated with the token
        # 3. Update the user's password
        # 4. Invalidate the token
        
        pass

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Extended user profile serializer
    """
    user = UserSerializer(read_only=True)
    skills = serializers.StringRelatedField(many=True, read_only=True)
    location = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'user', 'bio', 'phone', 'website', 'linkedin_url', 'github_url',
            'avatar', 'location', 'current_job_title', 'experience_level',
            'expected_salary_min', 'expected_salary_max', 'resume', 'skills',
            'is_open_to_work', 'is_public_profile', 'email_notifications',
            'sms_notifications'
        ] 