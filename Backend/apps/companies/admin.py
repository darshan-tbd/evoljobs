from django.contrib import admin
from .models import Company, CompanyEmployee, CompanyReview

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'industry', 'company_size', 'is_verified', 'is_featured']
    list_filter = ['industry', 'company_size', 'is_verified', 'is_featured']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(CompanyEmployee)
class CompanyEmployeeAdmin(admin.ModelAdmin):
    list_display = ['user', 'company', 'role', 'is_active']
    list_filter = ['role', 'is_active']
    search_fields = ['user__email', 'company__name']

@admin.register(CompanyReview)
class CompanyReviewAdmin(admin.ModelAdmin):
    list_display = ['company', 'user', 'rating', 'is_approved', 'created_at']
    list_filter = ['rating', 'is_approved', 'is_current_employee']
    search_fields = ['company__name', 'user__email', 'title'] 