from rest_framework import serializers
from .models import SearchQuery

class SearchQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchQuery
        fields = '__all__'
        read_only_fields = ['user'] 