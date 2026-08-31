from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count

from .models import Organization, OrganizationMember
from .serializers import OrganizationSerializer, CreateOrganizationSerializer, OrganizationMemberSerializer
from core.permissions import IsOrganizationAdmin

class OrganizationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    search_fields = ["name"]
    ordering = ["-created_at"]
    
    def get_queryset(self):
        return Organization.objects.filter(members=self.request.user).annotate(
            member_count=Count("members", distinct=True),
            project_count=Count("projects", distinct=True),
        )
    
    def get_serializer_class(self):
        return CreateOrganizationSerializer if self.action == "create" else OrganizationSerializer
    
    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsOrganizationAdmin()]
        return [IsAuthenticated()]
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)
    
    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        org = self.get_object()
        members = org.membership_set.select_related("user").all()
        serializer = OrganizationMemberSerializer(members, many=True)
        return Response({"success": True, "members": serializer.data})
