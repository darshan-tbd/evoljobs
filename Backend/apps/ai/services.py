"""
AI Services for JobPilot (EvolJobs.com)
Contains AI-powered features like job matching algorithms
"""
from typing import List, Dict, Tuple
from django.db.models import Q, Count, Case, When, IntegerField, F
from django.contrib.auth import get_user_model
from apps.jobs.models import JobPosting
from apps.users.models import UserProfile
from apps.core.models import Skill
import re
from difflib import SequenceMatcher

User = get_user_model()

class JobMatchingService:
    """
    Service for calculating job matching scores between users and jobs
    """
    
    def __init__(self):
        self.weights = {
            'skills': 0.4,        # 40% weight for skills match
            'experience': 0.25,   # 25% weight for experience level
            'location': 0.15,     # 15% weight for location match
            'job_type': 0.10,     # 10% weight for job type preference
            'industry': 0.10,     # 10% weight for industry match
        }
    
    def calculate_match_score(self, user: User, job: JobPosting) -> Tuple[float, Dict]:
        """
        Calculate overall match score between user and job
        Returns: (score, breakdown_dict)
        """
        if not hasattr(user, 'profile'):
            return 0.0, {'error': 'User has no profile'}
        
        profile = user.profile
        scores = {}
        
        # Skills matching
        scores['skills'] = self._calculate_skills_match(profile, job)
        
        # Experience level matching
        scores['experience'] = self._calculate_experience_match(profile, job)
        
        # Location matching
        scores['location'] = self._calculate_location_match(profile, job)
        
        # Job type matching (if user has preferences)
        scores['job_type'] = self._calculate_job_type_match(profile, job)
        
        # Industry matching
        scores['industry'] = self._calculate_industry_match(profile, job)
        
        # Calculate weighted total score
        total_score = sum(
            scores[criterion] * self.weights[criterion] 
            for criterion in self.weights.keys()
        )
        
        # Normalize to 0-100 scale
        total_score = min(100.0, max(0.0, total_score))
        
        return total_score, scores
    
    def _calculate_skills_match(self, profile: UserProfile, job: JobPosting) -> float:
        """Calculate skills matching score (0-100)"""
        if not profile.skills_text:
            return 0.0
        
        # Get user skills (parse from text)
        user_skills = self._parse_skills_from_text(profile.skills_text)
        if not user_skills:
            return 0.0
        
        # Get job required skills
        job_required_skills = list(job.required_skills.values_list('name', flat=True))
        job_preferred_skills = list(job.preferred_skills.values_list('name', flat=True))
        
        if not job_required_skills and not job_preferred_skills:
            return 50.0  # Neutral score if no skills specified
        
        # Calculate matches
        required_matches = self._count_skill_matches(user_skills, job_required_skills)
        preferred_matches = self._count_skill_matches(user_skills, job_preferred_skills)
        
        # Calculate score (required skills weighted more heavily)
        required_score = 0
        if job_required_skills:
            required_score = (required_matches / len(job_required_skills)) * 80
        
        preferred_score = 0
        if job_preferred_skills:
            preferred_score = (preferred_matches / len(job_preferred_skills)) * 20
        
        return min(100.0, required_score + preferred_score)
    
    def _calculate_experience_match(self, profile: UserProfile, job: JobPosting) -> float:
        """Calculate experience level matching score (0-100)"""
        if not profile.experience:
            return 50.0  # Neutral score if no experience info
        
        # Extract years of experience from profile
        user_experience_years = self._extract_years_from_text(profile.experience)
        
        # Map experience levels to years
        experience_mapping = {
            'entry': (0, 2),
            'mid': (2, 5),
            'senior': (5, 10),
            'executive': (10, float('inf'))
        }
        
        job_exp_range = experience_mapping.get(job.experience_level, (0, float('inf')))
        
        # Check if user's experience fits the job requirement
        if job_exp_range[0] <= user_experience_years <= job_exp_range[1]:
            return 100.0
        elif user_experience_years < job_exp_range[0]:
            # Under-qualified
            gap = job_exp_range[0] - user_experience_years
            return max(0.0, 100.0 - (gap * 20))  # -20 points per year gap
        else:
            # Over-qualified
            return 80.0  # Still good match but might be overqualified
    
    def _calculate_location_match(self, profile: UserProfile, job: JobPosting) -> float:
        """Calculate location matching score (0-100)"""
        if not profile.location_text or not job.location:
            return 50.0  # Neutral score if no location info
        
        # Remote jobs always score high
        if job.remote_option == 'remote':
            return 100.0
        
        # Hybrid jobs score well
        if job.remote_option == 'hybrid':
            return 80.0
        
        # Check location similarity
        user_location = profile.location_text.lower()
        job_location_parts = [
            job.location.name.lower() if job.location.name else '',
            job.location.city.lower() if job.location.city else '',
            job.location.state.lower() if job.location.state else '',
            job.location.country.lower() if job.location.country else '',
        ]
        
        # Check for matches in location components
        for location_part in job_location_parts:
            if location_part and location_part in user_location:
                return 100.0
            if location_part and self._similar_strings(user_location, location_part) > 0.7:
                return 80.0
        
        return 20.0  # Different locations
    
    def _calculate_job_type_match(self, profile: UserProfile, job: JobPosting) -> float:
        """Calculate job type preference matching (0-100)"""
        # This could be enhanced with user preferences in the future
        # For now, return neutral score
        return 50.0
    
    def _calculate_industry_match(self, profile: UserProfile, job: JobPosting) -> float:
        """Calculate industry matching score (0-100)"""
        if not profile.bio or not job.industry:
            return 50.0  # Neutral score
        
        # Check if industry is mentioned in bio
        bio_lower = profile.bio.lower()
        industry_name = job.industry.name.lower()
        
        if industry_name in bio_lower:
            return 100.0
        
        # Check for similar industry terms
        industry_keywords = self._get_industry_keywords(industry_name)
        for keyword in industry_keywords:
            if keyword in bio_lower:
                return 80.0
        
        return 30.0  # No clear industry match
    
    def _parse_skills_from_text(self, skills_text: str) -> List[str]:
        """Parse skills from comma-separated text"""
        if not skills_text:
            return []
        
        # Split by common separators and clean up
        skills = re.split(r'[,;\n\|]', skills_text)
        skills = [skill.strip().lower() for skill in skills if skill.strip()]
        return skills
    
    def _count_skill_matches(self, user_skills: List[str], job_skills: List[str]) -> int:
        """Count matching skills with fuzzy matching"""
        matches = 0
        job_skills_lower = [skill.lower() for skill in job_skills]
        
        for user_skill in user_skills:
            # Exact match
            if user_skill in job_skills_lower:
                matches += 1
                continue
            
            # Fuzzy match
            for job_skill in job_skills_lower:
                if self._similar_strings(user_skill, job_skill) > 0.8:
                    matches += 1
                    break
        
        return matches
    
    def _extract_years_from_text(self, text: str) -> int:
        """Extract years of experience from text"""
        if not text:
            return 0
        
        # Look for patterns like "5 years", "3+ years", "2-3 years"
        year_patterns = [
            r'(\d+)\+?\s*years?',
            r'(\d+)-\d+\s*years?',
            r'(\d+)\s*yrs?',
        ]
        
        for pattern in year_patterns:
            match = re.search(pattern, text.lower())
            if match:
                return int(match.group(1))
        
        # Fallback: count experience sections/jobs mentioned
        experience_indicators = ['experience', 'worked', 'position', 'role', 'job']
        count = sum(1 for indicator in experience_indicators if indicator in text.lower())
        return min(count, 10)  # Cap at 10 years
    
    def _similar_strings(self, a: str, b: str) -> float:
        """Calculate similarity between two strings"""
        return SequenceMatcher(None, a, b).ratio()
    
    def _get_industry_keywords(self, industry: str) -> List[str]:
        """Get related keywords for an industry"""
        industry_keywords = {
            'technology': ['tech', 'software', 'it', 'programming', 'development'],
            'healthcare': ['medical', 'health', 'hospital', 'clinical', 'nursing'],
            'finance': ['banking', 'financial', 'investment', 'accounting', 'insurance'],
            'education': ['teaching', 'academic', 'school', 'university', 'training'],
            'marketing': ['advertising', 'promotion', 'brand', 'digital marketing', 'seo'],
            'sales': ['selling', 'revenue', 'business development', 'account management'],
        }
        
        for key, keywords in industry_keywords.items():
            if key in industry.lower():
                return keywords
        
        return []
    
    def get_recommended_jobs(self, user: User, limit: int = 10) -> List[Dict]:
        """
        Get recommended jobs for a user with match scores
        """
        if not hasattr(user, 'profile'):
            return []
        
        # Get active jobs
        jobs = JobPosting.objects.filter(
            status='active',
            is_deleted=False
        ).select_related('company', 'location', 'industry').prefetch_related(
            'required_skills', 'preferred_skills'
        )
        
        job_scores = []
        
        for job in jobs[:50]:  # Limit to first 50 for performance
            score, breakdown = self.calculate_match_score(user, job)
            if score > 30:  # Only include jobs with decent match
                job_scores.append({
                    'job': job,
                    'match_score': score,
                    'match_breakdown': breakdown
                })
        
        # Sort by score and return top matches
        job_scores.sort(key=lambda x: x['match_score'], reverse=True)
        return job_scores[:limit]
    
    def get_match_explanation(self, user: User, job: JobPosting) -> str:
        """
        Generate human-readable explanation for job match
        """
        score, breakdown = self.calculate_match_score(user, job)
        
        explanations = []
        
        if breakdown.get('skills', 0) > 70:
            explanations.append("Strong skills match")
        elif breakdown.get('skills', 0) > 40:
            explanations.append("Good skills match")
        
        if breakdown.get('experience', 0) > 80:
            explanations.append("Perfect experience level")
        elif breakdown.get('experience', 0) > 60:
            explanations.append("Good experience fit")
        
        if breakdown.get('location', 0) > 80:
            explanations.append("Great location match")
        
        if not explanations:
            explanations.append("Basic compatibility")
        
        return f"Match Score: {score:.0f}% - " + ", ".join(explanations)

# Create a global instance of the JobMatchingService
job_matching_service = JobMatchingService()

class SummaryGenerationService:
    """
    Service for generating AI-powered job summaries
    """
    
    def __init__(self):
        self.max_summary_length = 500
        self.max_highlights = 5
    
    def generate_job_summary(self, job: JobPosting) -> Dict:
        """
        Generate AI-powered summary for a job posting
        """
        # Extract key information
        title = job.title
        company = job.company.name
        description = job.description
        requirements = job.requirements
        
        # Create brief summary
        brief_summary = f"{title} position at {company}. "
        
        # Add key requirements
        if requirements:
            brief_summary += f"Key requirements include {requirements[:100]}..."
        
        # Create detailed summary
        detailed_summary = self._create_detailed_summary(job)
        
        # Extract highlights
        highlights = self._extract_highlights(job)
        
        return {
            'brief_summary': brief_summary,
            'detailed_summary': detailed_summary,
            'highlights': highlights,
            'extracted_skills': self._extract_skills(job),
            'seniority_level': self._classify_seniority(job),
            'job_category': self._classify_category(job)
        }
    
    def _create_detailed_summary(self, job: JobPosting) -> str:
        """Create a detailed summary of the job"""
        parts = []
        
        # Company and role
        parts.append(f"{job.company.name} is seeking a {job.title}")
        
        # Location info
        if job.location:
            if job.remote_option == 'remote':
                parts.append("for a remote position")
            elif job.remote_option == 'hybrid':
                parts.append(f"for a hybrid position based in {job.location.city}")
            else:
                parts.append(f"based in {job.location.city}")
        
        # Experience level
        if job.experience_level:
            levels = {
                'entry': 'entry-level',
                'mid': 'mid-level',
                'senior': 'senior-level',
                'executive': 'executive-level'
            }
            parts.append(f"at the {levels.get(job.experience_level, job.experience_level)} level")
        
        # Salary info
        if job.salary_min or job.salary_max:
            salary_info = "with competitive compensation"
            if job.salary_min and job.salary_max:
                salary_info = f"offering ${job.salary_min:,} - ${job.salary_max:,}"
            parts.append(salary_info)
        
        return ". ".join(parts) + "."
    
    def _extract_highlights(self, job: JobPosting) -> List[str]:
        """Extract key highlights from job posting"""
        highlights = []
        
        # Remote work
        if job.remote_option == 'remote':
            highlights.append("100% Remote Work")
        elif job.remote_option == 'hybrid':
            highlights.append("Hybrid Work Environment")
        
        # Salary
        if job.salary_min and job.salary_max:
            highlights.append(f"${job.salary_min:,} - ${job.salary_max:,}")
        
        # Experience level
        if job.experience_level:
            level_names = {
                'entry': 'Entry Level',
                'mid': 'Mid Level',
                'senior': 'Senior Level',
                'executive': 'Executive Level'
            }
            highlights.append(level_names.get(job.experience_level, job.experience_level.title()))
        
        # Company benefits
        if job.benefits:
            highlights.append("Comprehensive Benefits")
        
        # Growth opportunity
        if 'growth' in job.description.lower() or 'career' in job.description.lower():
            highlights.append("Career Growth Opportunities")
        
        return highlights[:self.max_highlights]
    
    def _extract_skills(self, job: JobPosting) -> List[str]:
        """Extract skills from job description"""
        skills = []
        
        # Get skills from required_skills relationship
        required_skills = list(job.required_skills.values_list('name', flat=True))
        preferred_skills = list(job.preferred_skills.values_list('name', flat=True))
        
        skills.extend(required_skills)
        skills.extend(preferred_skills)
        
        # Extract from description text
        common_skills = [
            'Python', 'JavaScript', 'Java', 'React', 'Node.js', 'Django',
            'SQL', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes',
            'Git', 'Agile', 'Scrum', 'REST', 'GraphQL', 'TypeScript'
        ]
        
        description_lower = job.description.lower()
        for skill in common_skills:
            if skill.lower() in description_lower and skill not in skills:
                skills.append(skill)
        
        return skills[:10]  # Return top 10 skills
    
    def _classify_seniority(self, job: JobPosting) -> str:
        """Classify job seniority level"""
        if job.experience_level:
            return job.experience_level
        
        # Classify based on title
        title_lower = job.title.lower()
        
        if any(word in title_lower for word in ['senior', 'lead', 'principal', 'staff']):
            return 'senior'
        elif any(word in title_lower for word in ['junior', 'entry', 'associate']):
            return 'entry'
        elif any(word in title_lower for word in ['manager', 'director', 'head', 'vp']):
            return 'executive'
        else:
            return 'mid'
    
    def _classify_category(self, job: JobPosting) -> str:
        """Classify job into category"""
        title_lower = job.title.lower()
        description_lower = job.description.lower()
        
        categories = {
            'software_development': ['developer', 'engineer', 'programmer', 'software', 'coding'],
            'data_science': ['data scientist', 'data analyst', 'machine learning', 'ai'],
            'design': ['designer', 'ux', 'ui', 'creative', 'graphic'],
            'marketing': ['marketing', 'seo', 'content', 'social media', 'brand'],
            'sales': ['sales', 'business development', 'account manager'],
            'product': ['product manager', 'product owner', 'product'],
            'operations': ['operations', 'devops', 'infrastructure', 'sysadmin'],
            'management': ['manager', 'director', 'lead', 'head', 'vp']
        }
        
        for category, keywords in categories.items():
            if any(keyword in title_lower for keyword in keywords):
                return category
        
        # Check industry
        if job.industry:
            return job.industry.name.lower().replace(' ', '_')
        
        return 'general'

# Create global instance
summary_service = SummaryGenerationService() 