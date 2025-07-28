"""
Job services for intelligent categorization and other job-related operations
"""
import re
from typing import Optional
from django.db.models import Q
from .models import JobCategory
import logging

logger = logging.getLogger(__name__)


class JobCategorizationService:
    """
    Service for intelligent job categorization based on title and description
    """
    
    @staticmethod
    def categorize_job(title: str, description: str = "") -> Optional[JobCategory]:
        """
        Intelligently categorize a job based on its title and description
        
        Args:
            title: Job title
            description: Job description (optional)
            
        Returns:
            JobCategory instance or None if no match found
        """
        if not title:
            return None
            
        # Clean and normalize text for better matching
        title_lower = title.lower().strip()
        description_lower = description.lower().strip() if description else ""
        
        # Combine title and description for analysis
        combined_text = f"{title_lower} {description_lower}"
        
        # Get all active job categories
        categories = JobCategory.objects.filter(is_active=True)
        
        best_match = None
        best_score = 0
        
        for category in categories:
            score = JobCategorizationService._calculate_match_score(
                combined_text, title_lower, category
            )
            
            if score > best_score:
                best_score = score
                best_match = category
        
        # Only return a match if we have a reasonable confidence
        if best_score >= 2:  # Minimum threshold for category assignment
            logger.info(f"Categorized '{title}' as '{best_match.name}' (score: {best_score})")
            return best_match
        
        logger.warning(f"Could not categorize job: '{title}' (best score: {best_score})")
        return None
    
    @staticmethod
    def _calculate_match_score(combined_text: str, title: str, category: JobCategory) -> int:
        """
        Calculate match score between job text and category
        
        Args:
            combined_text: Combined title and description text
            title: Job title (for priority matching)
            category: JobCategory instance
            
        Returns:
            Match score (higher is better)
        """
        score = 0
        
        # Get category keywords
        keywords = [kw.strip().lower() for kw in category.keywords.split(',') if kw.strip()]
        
        # Check for exact category name match in title (highest priority)
        if category.name.lower() in title:
            score += 10
        
        # Check for exact category name match in combined text
        if category.name.lower() in combined_text:
            score += 5
        
        # Check for keyword matches
        for keyword in keywords:
            # Exact keyword match in title gets higher score
            if keyword in title:
                score += 3
            # Exact keyword match in combined text
            elif keyword in combined_text:
                score += 2
            # Partial keyword match (for compound keywords)
            elif any(word in combined_text for word in keyword.split() if len(word) > 3):
                score += 1
        
        # Special scoring for common patterns
        score += JobCategorizationService._check_special_patterns(combined_text, category)
        
        return score
    
    @staticmethod
    def _check_special_patterns(text: str, category: JobCategory) -> int:
        """
        Check for special patterns that indicate specific job categories
        
        Args:
            text: Combined job text
            category: JobCategory instance
            
        Returns:
            Additional score points
        """
        bonus_score = 0
        category_name = category.name.lower()
        
        # Technology-related patterns
        if 'software' in category_name or 'developer' in category_name:
            tech_patterns = [
                r'\b(react|angular|vue|node\.?js|python|java|javascript|typescript)\b',
                r'\b(api|rest|database|sql|nosql|mongodb|mysql|postgresql)\b',
                r'\b(git|github|docker|aws|azure|cloud|microservices)\b'
            ]
            for pattern in tech_patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    bonus_score += 1
        
        # Healthcare patterns
        elif 'nurse' in category_name or 'medical' in category_name:
            healthcare_patterns = [
                r'\b(patient|hospital|clinic|medical|healthcare|nursing)\b',
                r'\b(rn|lpn|cna|medication|treatment)\b'
            ]
            for pattern in healthcare_patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    bonus_score += 1
        
        # Education patterns
        elif 'teacher' in category_name or 'education' in category_name:
            education_patterns = [
                r'\b(student|classroom|curriculum|lesson|grade|school)\b',
                r'\b(education|teaching|learning|academic)\b'
            ]
            for pattern in education_patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    bonus_score += 1
        
        # Sales/Marketing patterns
        elif 'sales' in category_name or 'marketing' in category_name:
            sales_patterns = [
                r'\b(revenue|target|quota|client|customer|lead)\b',
                r'\b(campaign|seo|social media|advertising|promotion)\b'
            ]
            for pattern in sales_patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    bonus_score += 1
        
        # Trades patterns
        elif any(trade in category_name for trade in ['electrician', 'plumber', 'carpenter', 'mechanic']):
            trades_patterns = [
                r'\b(repair|maintenance|installation|construction|building)\b',
                r'\b(tools|equipment|safety|license|certified)\b'
            ]
            for pattern in trades_patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    bonus_score += 1
        
        return bonus_score
    
    @staticmethod
    def get_category_suggestions(text: str, limit: int = 5) -> list:
        """
        Get a list of suggested categories for a given job text
        
        Args:
            text: Job title and/or description
            limit: Maximum number of suggestions
            
        Returns:
            List of (category, score) tuples
        """
        if not text:
            return []
            
        text_lower = text.lower().strip()
        categories = JobCategory.objects.filter(is_active=True)
        
        suggestions = []
        
        for category in categories:
            score = JobCategorizationService._calculate_match_score(
                text_lower, text_lower, category
            )
            if score > 0:
                suggestions.append((category, score))
        
        # Sort by score (descending) and return top suggestions
        suggestions.sort(key=lambda x: x[1], reverse=True)
        return suggestions[:limit] 