import django_filters
from .models import Project


class ProjectFilter(django_filters.FilterSet):
    """
    Filter projects by various fields.
    
    Usage:
        /api/organizations/1/projects/?status=active
        /api/organizations/1/projects/?priority=high
        /api/organizations/1/projects/?start_date_after=2024-01-01
        /api/organizations/1/projects/?end_date_before=2024-12-31
        /api/organizations/1/projects/?search=website
    """
    class Meta:
        model = Project
        fields = {
            "status": ["exact"],
            "priority": ["exact"],
            "start_date": ["gte", "lte", "exact"],
            "end_date": ["gte", "lte", "exact"],
            "created_at": ["gte", "lte"],
        }
