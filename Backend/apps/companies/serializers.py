from rest_framework import serializers
from .models import Company, CompanyEmployee, CompanyReview

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class CompanyEmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyEmployee
        fields = '__all__'

class CompanyReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyReview
        fields = '__all__'

class AdminCompanySerializer(serializers.ModelSerializer):
    """Admin serializer for companies with full access"""
    industry_name = serializers.CharField(source='industry.name', read_only=True)
    headquarters_name = serializers.CharField(source='headquarters.name', read_only=True)
    employee_count = serializers.SerializerMethodField()
    job_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = '__all__'
    
    def get_employee_count(self, obj):
        return obj.employees.filter(is_active=True).count()
    
    def get_job_count(self, obj):
        return obj.job_postings.filter(status='active').count()

class AdminCompanyEmployeeSerializer(serializers.ModelSerializer):
    """Admin serializer for company employees with full access"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = CompanyEmployee
        fields = '__all__'

class AdminCompanyReviewSerializer(serializers.ModelSerializer):
    """Admin serializer for company reviews with full access"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = CompanyReview
        fields = '__all__' 