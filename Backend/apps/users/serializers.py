from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, UserExperience, UserEducation

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ['user']

class UserExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserExperience
        fields = '__all__'
        read_only_fields = ['user']

class UserEducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserEducation
        fields = '__all__'
        read_only_fields = ['user']

class AdminUserProfileSerializer(serializers.ModelSerializer):
    """Admin serializer for user profiles with full access"""
    
    class Meta:
        model = UserProfile
        fields = '__all__'

class AdminUserSerializer(serializers.ModelSerializer):
    """Admin serializer for users with full access"""
    profile = AdminUserProfileSerializer(read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    user_type_display = serializers.CharField(source='get_user_type_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'user_type', 'user_type_display', 'is_active', 'is_verified', 
            'is_staff', 'is_superuser', 'date_joined', 'last_login',
            'profile'
        ]
    
    def create(self, validated_data):
        """Create a new user with password"""
        password = self.context.get('password')
        if password:
            user = User.objects.create_user(**validated_data, password=password)
        else:
            user = User.objects.create_user(**validated_data)
        return user
    
    def update(self, instance, validated_data):
        """Update user with password handling"""
        password = self.context.get('password')
        if password:
            instance.set_password(password)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

class AdminUserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users in admin"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'user_type',
            'is_active', 'is_verified', 'is_staff', 'is_superuser',
            'password', 'password_confirm'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data, password=password)
        return user

class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating users in admin"""
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'user_type',
            'is_active', 'is_verified', 'is_staff', 'is_superuser',
            'password', 'password_confirm'
        ]
    
    def validate(self, attrs):
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        
        if password and password_confirm and password != password_confirm:
            raise serializers.ValidationError("Passwords don't match")
        
        return attrs
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        validated_data.pop('password_confirm', None)
        
        if password:
            instance.set_password(password)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance 