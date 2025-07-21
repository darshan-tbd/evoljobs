from rest_framework import serializers
from .models import JobApplication, ApplicationStatusHistory, Interview, ApplicationDocument

class JobApplicationSerializer(serializers.ModelSerializer):
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
            
            print(f"=== APPLICATION VALIDATION DEBUG ===")
            print(f"User: {user.username}")
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