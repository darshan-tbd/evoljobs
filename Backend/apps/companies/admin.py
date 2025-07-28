from django.contrib import admin
from .models import Company, CompanyEmployee, CompanyReview

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    """
    Enhanced Company admin with comprehensive contact details management
    """
    list_display = [
        'name', 'email', 'phone', 'website', 'industry', 
        'company_size', 'is_verified', 'is_featured', 'created_at'
    ]
    list_filter = [
        'industry', 'company_size', 'is_verified', 'is_featured', 
        'created_at', 'headquarters__country'
    ]
    search_fields = [
        'name', 'description', 'email', 'phone', 'website',
        'headquarters__name', 'headquarters__city', 'headquarters__country'
    ]
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_verified', 'is_featured']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'logo')
        }),
        ('Contact Details', {
            'fields': ('email', 'phone', 'website'),
            'description': 'Contact information for Auto Apply and communication'
        }),
        ('Location', {
            'fields': ('headquarters',),
            'description': 'Primary company location'
        }),
        ('Company Details', {
            'fields': ('industry', 'company_size', 'founded_year'),
            'classes': ('collapse',)
        }),
        ('Social Media', {
            'fields': ('linkedin_url', 'twitter_url', 'facebook_url'),
            'classes': ('collapse',)
        }),
        ('Status & Verification', {
            'fields': ('is_verified', 'is_featured')
        }),
        ('SEO', {
            'fields': ('meta_description', 'meta_keywords'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('industry', 'headquarters')
    
    # Custom admin methods
    def job_count(self, obj):
        return obj.job_postings.filter(status='active').count()
    job_count.short_description = 'Active Jobs'
    
    def applications_count(self, obj):
        from apps.applications.models import JobApplication
        return JobApplication.objects.filter(job__company=obj).count()
    applications_count.short_description = 'Total Applications'
    
    # Add custom actions
    actions = ['verify_companies', 'unverify_companies', 'feature_companies']
    
    def verify_companies(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'{updated} companies verified successfully.')
    verify_companies.short_description = 'Verify selected companies'
    
    def unverify_companies(self, request, queryset):
        updated = queryset.update(is_verified=False)
        self.message_user(request, f'{updated} companies unverified.')
    unverify_companies.short_description = 'Unverify selected companies'
    
    def feature_companies(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f'{updated} companies featured.')
    feature_companies.short_description = 'Feature selected companies'

@admin.register(CompanyEmployee)
class CompanyEmployeeAdmin(admin.ModelAdmin):
    list_display = ['user', 'company', 'role', 'is_active']
    list_filter = ['role', 'is_active']
    search_fields = ['user__email', 'company__name']

@admin.register(CompanyReview)
class CompanyReviewAdmin(admin.ModelAdmin):
    """
    Company review management for monitoring and moderation
    """
    list_display = ['company', 'user', 'rating', 'is_approved', 'is_current_employee', 'created_at']
    list_filter = ['rating', 'is_approved', 'is_current_employee', 'created_at']
    search_fields = ['company__name', 'user__email', 'title', 'review_text']
    list_editable = ['is_approved']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Review Information', {
            'fields': ('company', 'user', 'title', 'review_text')
        }),
        ('Ratings', {
            'fields': ('rating', 'work_life_balance', 'salary_benefits', 'job_security', 'management', 'culture')
        }),
        ('Metadata', {
            'fields': ('is_current_employee', 'is_anonymous', 'is_approved')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['approve_reviews', 'disapprove_reviews']
    
    def approve_reviews(self, request, queryset):
        updated = queryset.update(is_approved=True)
        self.message_user(request, f'{updated} reviews approved.')
    approve_reviews.short_description = 'Approve selected reviews'
    
    def disapprove_reviews(self, request, queryset):
        updated = queryset.update(is_approved=False)
        self.message_user(request, f'{updated} reviews disapproved.')
    disapprove_reviews.short_description = 'Disapprove selected reviews' 