from django.contrib import admin
from .models import SubscriptionPlan, UserSubscription, DailyApplicationUsage

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'plan_type', 'price', 'daily_application_limit', 'is_active']
    list_filter = ['plan_type', 'is_active', 'priority_support', 'advanced_analytics']
    search_fields = ['name', 'description']
    list_editable = ['is_active', 'daily_application_limit']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'plan_type', 'is_active')
        }),
        ('Pricing', {
            'fields': ('price', 'duration_days')
        }),
        ('Limits & Features', {
            'fields': ('daily_application_limit', 'features')
        }),
        ('Premium Features', {
            'fields': ('priority_support', 'advanced_analytics', 'custom_branding', 'api_access'),
            'classes': ('collapse',)
        }),
    )

@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'start_date', 'end_date', 'is_active', 'days_remaining']
    list_filter = ['plan', 'status', 'is_active', 'auto_renew']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'plan__name']
    readonly_fields = ['days_remaining', 'is_expired']
    
    fieldsets = (
        ('User & Plan', {
            'fields': ('user', 'plan')
        }),
        ('Subscription Period', {
            'fields': ('start_date', 'end_date')
        }),
        ('Status', {
            'fields': ('status', 'is_active', 'auto_renew')
        }),
        ('Read-only Info', {
            'fields': ('days_remaining', 'is_expired'),
            'classes': ('collapse',)
        }),
    )
    
    def days_remaining(self, obj):
        return obj.days_remaining
    days_remaining.short_description = 'Days Remaining'

@admin.register(DailyApplicationUsage)
class DailyApplicationUsageAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'applications_count', 'companies_count']
    list_filter = ['date']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['companies_count']
    
    def companies_count(self, obj):
        return len(obj.companies_applied)
    companies_count.short_description = 'Companies Applied' 