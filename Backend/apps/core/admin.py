from django.contrib import admin
from .models import Location, Skill, Industry

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'state', 'country']
    list_filter = ['country', 'state']
    search_fields = ['name', 'city', 'country']

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'category']
    list_filter = ['category']
    search_fields = ['name', 'category']

@admin.register(Industry)
class IndustryAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name'] 