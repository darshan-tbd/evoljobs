from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile, UserExperience, UserEducation

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'user_type', 'get_preferred_categories_count', 'is_active', 'date_joined']
    list_filter = ['user_type', 'is_active', 'is_verified', 'date_joined', 'preferred_job_categories']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    def get_preferred_categories_count(self, obj):
        """Show count of preferred job categories"""
        return obj.preferred_job_categories.count()
    get_preferred_categories_count.short_description = 'Job Categories'
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'user_type', 'preferred_job_categories')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2', 'user_type', 'preferred_job_categories'),
        }),
    )

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'current_job_title', 'experience_level', 'is_open_to_work']
    list_filter = ['experience_level', 'is_open_to_work', 'is_public_profile']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'current_job_title']

@admin.register(UserExperience)
class UserExperienceAdmin(admin.ModelAdmin):
    list_display = ['user', 'job_title', 'company_name', 'start_date', 'end_date', 'is_current']
    list_filter = ['is_current', 'start_date']
    search_fields = ['user__email', 'job_title', 'company_name']

@admin.register(UserEducation)
class UserEducationAdmin(admin.ModelAdmin):
    list_display = ['user', 'degree', 'school_name', 'start_date', 'end_date', 'is_current']
    list_filter = ['is_current', 'start_date']
    search_fields = ['user__email', 'degree', 'school_name'] 