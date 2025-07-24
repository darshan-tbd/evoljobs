from rest_framework import serializers
from .models import JobApplication, ApplicationStatusHistory, Interview, ApplicationDocument

class JobApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_company_name = serializers.CharField(source='job.company.name', read_only=True)
    job_location_name = serializers.CharField(source='job.location.name', read_only=True)
    job_salary_min = serializers.DecimalField(source='job.salary_min', max_digits=10, decimal_places=2, read_only=True)
    job_salary_max = serializers.DecimalField(source='job.salary_max', max_digits=10, decimal_places=2, read_only=True)
    job_job_type = serializers.CharField(source='job.job_type', read_only=True)
    job_created_at = serializers.DateTimeField(source='job.created_at', read_only=True)
    
    class Meta:
        model = JobApplication
        fields = '__all__'
        read_only_fields = ['applicant', 'applied_at']
    
    def validate(self, data):
        """
        Check if user has already applied to this job
        """
        if self.context['request'].method == 'POST':
            user = self.context['request'].user
            job = data.get('job')
            
            # Check if this is an external application
            is_external = data.get('is_external_application', False) or self.context.get('is_external', False)
            
            print(f"=== APPLICATION VALIDATION DEBUG ===")
            print(f"User: {user.email}")
            print(f"Job: {job}")
            print(f"Job ID: {job.id if job else 'None'}")
            print(f"Job Title: {job.title if job else 'None'}")
            print(f"Is External: {is_external}")
            
            existing_apps = JobApplication.objects.filter(job=job, applicant=user)
            print(f"Existing applications count: {existing_apps.count()}")
            
            if existing_apps.exists():
                print(f"Found existing application - blocking")
                raise serializers.ValidationError(
                    'You have already applied to this job. You can only apply once per job.'
                )
            else:
                print(f"No existing application found - allowing")
            
            print(f"=====================================")
        
        return data

class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationStatusHistory
        fields = '__all__'
        read_only_fields = ['changed_by']

class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = '__all__'

class ApplicationDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationDocument
        fields = '__all__'

class ExternalJobApplicationSerializer(serializers.ModelSerializer):
    """
    Serializer specifically for external job applications
    """
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_company_name = serializers.CharField(source='job.company.name', read_only=True)
    job_location_name = serializers.CharField(source='job.location.name', read_only=True)
    
    class Meta:
        model = JobApplication
        fields = '__all__'
        read_only_fields = ['applicant', 'applied_at', 'is_external_application']
    
    def validate(self, data):
        """
        Check if user has already applied to this job (for external applications)
        """
        if self.context['request'].method == 'POST':
            user = self.context['request'].user
            job = data.get('job')
            
            print(f"=== EXTERNAL APPLICATION VALIDATION DEBUG ===")
            print(f"User: {user.email}")
            print(f"Job: {job}")
            print(f"Job ID: {job.id if job else 'None'}")
            print(f"Job Title: {job.title if job else 'None'}")
            
            existing_apps = JobApplication.objects.filter(job=job, applicant=user)
            print(f"Existing applications count: {existing_apps.count()}")
            
            if existing_apps.exists():
                print(f"Found existing application - blocking")
                raise serializers.ValidationError(
                    'You have already applied to this job. You can only apply once per job.'
                )
            else:
                print(f"No existing application found - allowing")
            
            print(f"=============================================")
        
        return data

class AdminJobApplicationSerializer(serializers.ModelSerializer):
    """Admin serializer for job applications with full access"""
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_company = serializers.CharField(source='job.company.name', read_only=True)
    applicant_name = serializers.CharField(source='applicant.get_full_name', read_only=True)
    applicant_email = serializers.CharField(source='applicant.email', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    
    class Meta:
        model = JobApplication
        fields = '__all__'

class AdminApplicationStatusHistorySerializer(serializers.ModelSerializer):
    """Admin serializer for application status history with full access"""
    application_job_title = serializers.CharField(source='application.job.title', read_only=True)
    application_applicant_name = serializers.CharField(source='application.applicant.get_full_name', read_only=True)
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    
    class Meta:
        model = ApplicationStatusHistory
        fields = '__all__'

class AdminInterviewSerializer(serializers.ModelSerializer):
    """Admin serializer for interviews with full access"""
    application_job_title = serializers.CharField(source='application.job.title', read_only=True)
    application_applicant_name = serializers.CharField(source='application.applicant.get_full_name', read_only=True)
    interviewer_name = serializers.CharField(source='interviewer.get_full_name', read_only=True)
    additional_interviewers_names = serializers.StringRelatedField(many=True, read_only=True)
    
    class Meta:
        model = Interview
        fields = '__all__'

class AdminApplicationDocumentSerializer(serializers.ModelSerializer):
    """Admin serializer for application documents with full access"""
    application_job_title = serializers.CharField(source='application.job.title', read_only=True)
    application_applicant_name = serializers.CharField(source='application.applicant.get_full_name', read_only=True)
    
    class Meta:
        model = ApplicationDocument
        fields = '__all__'

 