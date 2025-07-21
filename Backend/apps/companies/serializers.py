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
        read_only_fields = ['user']

class CompanyReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyReview
        fields = '__all__'
        read_only_fields = ['user', 'is_approved'] 