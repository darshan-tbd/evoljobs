from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from apps.jobs.models import JobPosting
from apps.jobs.serializers import JobPostingListSerializer
from .services import job_matching_service
from .models import JobMatchScore
from .serializers import JobMatchScoreSerializer
from django.db import models

User = get_user_model()

class AIViewSet(viewsets.ViewSet):
    """
    ViewSet for AI-powered features
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def recommended_jobs(self, request):
        """
        Get recommended jobs for the current user
        GET /api/v1/ai/recommended-jobs/?limit=10
        """
        user = request.user
        limit = int(request.query_params.get('limit', 10))
        limit = min(limit, 50)  # Cap at 50 jobs
        
        # Get recommended jobs with match scores
        recommended = job_matching_service.get_recommended_jobs(user, limit)
        
        if not recommended:
            return Response({
                'results': [],
                'count': 0,
                'message': 'No recommendations found. Complete your profile for better matches.'
            })
        
        # Serialize job data with match scores
        results = []
        for item in recommended:
            job_data = JobPostingListSerializer(item['job']).data
            job_data['match_score'] = round(item['match_score'], 1)
            job_data['match_breakdown'] = item['match_breakdown']
            job_data['match_explanation'] = job_matching_service.get_match_explanation(
                user, item['job']
            )
            results.append(job_data)
        
        return Response({
            'results': results,
            'count': len(results),
            'message': f'Found {len(results)} recommended jobs for you'
        })
    
    @action(detail=False, methods=['post'])
    def calculate_match(self, request):
        """
        Calculate match score for a specific job
        POST /api/v1/ai/calculate-match/
        Body: {"job_id": "job-uuid"}
        """
        job_id = request.data.get('job_id')
        if not job_id:
            return Response({
                'error': 'job_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            job = JobPosting.objects.get(id=job_id, status='active', is_deleted=False)
        except JobPosting.DoesNotExist:
            return Response({
                'error': 'Job not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        user = request.user
        match_score, breakdown = job_matching_service.calculate_match_score(user, job)
        explanation = job_matching_service.get_match_explanation(user, job)
        
        # Store/update match score in database
        match_obj, created = JobMatchScore.objects.update_or_create(
            user=user,
            job=job,
            defaults={
                'overall_score': match_score / 100.0,  # Convert to 0-1 scale
                'skills_match_score': breakdown.get('skills', 0) / 100.0,
                'experience_match_score': breakdown.get('experience', 0) / 100.0,
                'location_match_score': breakdown.get('location', 0) / 100.0,
                'salary_match_score': breakdown.get('job_type', 0) / 100.0,
                'confidence_score': 0.8,  # Default confidence
            }
        )
        
        return Response({
            'job_id': str(job.id),
            'job_title': job.title,
            'company': job.company.name,
            'match_score': round(match_score, 1),
            'match_breakdown': {
                'skills': round(breakdown.get('skills', 0), 1),
                'experience': round(breakdown.get('experience', 0), 1),
                'location': round(breakdown.get('location', 0), 1),
                'job_type': round(breakdown.get('job_type', 0), 1),
                'industry': round(breakdown.get('industry', 0), 1),
            },
            'explanation': explanation,
            'created': created
        })
    
    @action(detail=False, methods=['get'])
    def match_history(self, request):
        """
        Get user's job match history
        GET /api/v1/ai/match-history/
        """
        user = request.user
        matches = JobMatchScore.objects.filter(
            user=user
        ).select_related('job', 'job__company').order_by('-updated_at')[:20]
        
        serializer = JobMatchScoreSerializer(matches, many=True)
        return Response({
            'results': serializer.data,
            'count': matches.count()
        })
    
    @action(detail=False, methods=['post'])
    def bulk_calculate_matches(self, request):
        """
        Calculate matches for multiple jobs
        POST /api/v1/ai/bulk-calculate-matches/
        Body: {"job_ids": ["job-uuid-1", "job-uuid-2", ...]}
        """
        job_ids = request.data.get('job_ids', [])
        if not job_ids or len(job_ids) > 20:  # Limit to 20 jobs
            return Response({
                'error': 'job_ids required (max 20 jobs)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        results = []
        
        jobs = JobPosting.objects.filter(
            id__in=job_ids,
            status='active',
            is_deleted=False
        ).select_related('company')
        
        for job in jobs:
            match_score, breakdown = job_matching_service.calculate_match_score(user, job)
            
            # Store/update match score
            JobMatchScore.objects.update_or_create(
                user=user,
                job=job,
                defaults={
                    'overall_score': match_score / 100.0,  # Convert to 0-1 scale
                    'skills_match_score': breakdown.get('skills', 0) / 100.0,
                    'experience_match_score': breakdown.get('experience', 0) / 100.0,
                    'location_match_score': breakdown.get('location', 0) / 100.0,
                    'salary_match_score': breakdown.get('job_type', 0) / 100.0,
                    'confidence_score': 0.8,  # Default confidence
                }
            )
            
            results.append({
                'job_id': str(job.id),
                'job_title': job.title,
                'company': job.company.name,
                'match_score': round(match_score, 1),
                'match_breakdown': {
                    'skills': round(breakdown.get('skills', 0), 1),
                    'experience': round(breakdown.get('experience', 0), 1),
                    'location': round(breakdown.get('location', 0), 1),
                    'job_type': round(breakdown.get('job_type', 0), 1),
                    'industry': round(breakdown.get('industry', 0), 1),
                }
            })
        
        return Response({
            'results': results,
            'count': len(results)
        })
    
    @action(detail=False, methods=['get'])
    def profile_completeness(self, request):
        """
        Check user's profile completeness for better job matching
        GET /api/v1/ai/profile-completeness/
        """
        user = request.user
        
        if not hasattr(user, 'profile'):
            return Response({
                'completeness': 0,
                'missing_fields': ['Complete profile required'],
                'recommendations': ['Create your profile to get job recommendations']
            })
        
        profile = user.profile
        completeness = 0
        missing_fields = []
        recommendations = []
        
        # Check required fields for good matching
        if profile.bio:
            completeness += 20
        else:
            missing_fields.append('Bio/Summary')
            recommendations.append('Add a professional bio to improve matches')
        
        if profile.skills_text:
            completeness += 30
        else:
            missing_fields.append('Skills')
            recommendations.append('List your skills to get better job matches')
        
        if profile.experience:
            completeness += 25
        else:
            missing_fields.append('Experience')
            recommendations.append('Add your work experience for accurate matching')
        
        if profile.location_text:
            completeness += 15
        else:
            missing_fields.append('Location')
            recommendations.append('Add your location for local job suggestions')
        
        if profile.phone:
            completeness += 10
        else:
            missing_fields.append('Phone')
            recommendations.append('Add contact information')
        
        return Response({
            'completeness': completeness,
            'missing_fields': missing_fields,
            'recommendations': recommendations,
            'can_get_recommendations': completeness >= 50
        })
    
    @action(detail=False, methods=['get'])
    def matching_stats(self, request):
        """
        Get user's matching statistics
        GET /api/v1/ai/matching-stats/
        """
        user = request.user
        
        # Get match scores for this user
        matches = JobMatchScore.objects.filter(user=user)
        
        if not matches.exists():
            return Response({
                'total_matches': 0,
                'average_score': 0,
                'high_matches': 0,
                'medium_matches': 0,
                'low_matches': 0,
                'recommended_jobs': 0,
                'applied_jobs': 0,
                'saved_jobs': 0,
                'stats': {}
            })
        
        # Calculate statistics
        total_matches = matches.count()
        avg_score = matches.aggregate(avg=models.Avg('overall_score'))['avg'] or 0
        
        # Convert to percentage for display
        avg_score = avg_score * 100
        
        # Score distribution
        high_matches = matches.filter(overall_score__gte=0.7).count()
        medium_matches = matches.filter(overall_score__gte=0.4, overall_score__lt=0.7).count()
        low_matches = matches.filter(overall_score__lt=0.4).count()
        
        # Interaction stats
        recommended_jobs = matches.filter(is_recommended=True).count()
        applied_jobs = matches.filter(was_applied=True).count()
        saved_jobs = matches.filter(was_saved=True).count()
        
        # Additional stats
        skills_avg = matches.aggregate(avg=models.Avg('skills_match_score'))['avg'] or 0
        experience_avg = matches.aggregate(avg=models.Avg('experience_match_score'))['avg'] or 0
        location_avg = matches.aggregate(avg=models.Avg('location_match_score'))['avg'] or 0
        
        return Response({
            'total_matches': total_matches,
            'average_score': round(avg_score, 1),
            'high_matches': high_matches,
            'medium_matches': medium_matches,
            'low_matches': low_matches,
            'recommended_jobs': recommended_jobs,
            'applied_jobs': applied_jobs,
            'saved_jobs': saved_jobs,
            'stats': {
                'skills_average': round(skills_avg * 100, 1),
                'experience_average': round(experience_avg * 100, 1),
                'location_average': round(location_avg * 100, 1),
                'high_match_percentage': round((high_matches / total_matches) * 100, 1) if total_matches > 0 else 0,
                'application_rate': round((applied_jobs / total_matches) * 100, 1) if total_matches > 0 else 0,
                'save_rate': round((saved_jobs / total_matches) * 100, 1) if total_matches > 0 else 0
            }
        })
    

 