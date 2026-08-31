import django_filters
from .models import Project

class ProjectFilter(django_filters.FilterSet):
    class Meta:
        model = Project
        fields = {
            "status": ["exact"],
            "priority": ["exact"],
            "start_date": ["gte", "lte"],
            "end_date": ["gte", "lte"],
            "created_at": ["gte", "lte"],
        }
