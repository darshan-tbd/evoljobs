from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import SearchQuery
from .serializers import SearchQuerySerializer

class SearchQueryViewSet(viewsets.ModelViewSet):
    serializer_class = SearchQuerySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SearchQuery.objects.filter(user=self.request.user)

@api_view(['POST'])
def search_jobs(request):
    # Elasticsearch search implementation would go here
    return Response({'results': [], 'count': 0}) 