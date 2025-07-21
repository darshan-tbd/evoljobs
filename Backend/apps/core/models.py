"""
Core models for JobPilot (EvolJobs.com) Backend.
Contains base classes and common utilities used across all apps.
"""

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone
import uuid

class TimeStampedModel(models.Model):
    """
    Abstract base model with created_at and updated_at timestamps
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class UUIDModel(models.Model):
    """
    Abstract base model with UUID primary key
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    class Meta:
        abstract = True

class SoftDeleteModel(models.Model):
    """
    Abstract base model with soft delete functionality
    """
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        abstract = True
    
    def delete(self, using=None, keep_parents=False):
        """
        Soft delete the object
        """
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(using=using)
    
    def hard_delete(self, using=None, keep_parents=False):
        """
        Actually delete the object from database
        """
        super().delete(using=using, keep_parents=keep_parents)

class BaseModel(TimeStampedModel, UUIDModel, SoftDeleteModel):
    """
    Base model combining all common functionality
    """
    
    class Meta:
        abstract = True

class Location(BaseModel):
    """
    Location model for cities, states, countries
    """
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=255, blank=True)
    state = models.CharField(max_length=255, blank=True)
    country = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    def __str__(self):
        return f"{self.name}, {self.country}"
    
    class Meta:
        unique_together = ['name', 'country']

class Skill(BaseModel):
    """
    Skill model for job skills and user skills
    """
    name = models.CharField(max_length=255, unique=True)
    category = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']

class Industry(BaseModel):
    """
    Industry model for job industries
    """
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Industries' 