from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.models import User
from apps.organizations.models import Organization
from .models import Project, ProjectMember
from .serializers import (
    ProjectListSerializer,
    ProjectDetailSerializer,
    CreateProjectSerializer,
    ProjectMemberSerializer,
)
from .permissions import IsProjectAdmin


class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    search_fields = ["name", "key", "description"]
    filterset_fields = ["status", "priority"]
    ordering_fields = ["name", "created_at", "priority", "key"]
    ordering = ["-created_at"]
    
    def get_queryset(self):
        org_id = self.kwargs.get("org_id")
        if not org_id:
            return Project.objects.none()
        
        return Project.objects.filter(
            organization_id=org_id,
        # Removed 'members=self.request.user' so all org members see all projects
        ).select_related("organization", "created_by", "default_assignee")
    
    def get_serializer_class(self):
        if self.action == "list":
            return ProjectListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return CreateProjectSerializer
        return ProjectDetailSerializer
    
    def get_permissions(self):
        if self.action in ["update", "partial_update"]:
            return [IsAuthenticated(), IsProjectAdmin()]
        if self.action == "destroy":
            return [IsAuthenticated(), IsProjectAdmin()]
        return [IsAuthenticated()]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["organization_id"] = self.kwargs.get("org_id")
        return context
    
    def perform_create(self, serializer):
        org_id = self.kwargs.get("org_id")
        org = Organization.objects.get(id=org_id)
        project = serializer.save(organization=org, created_by=self.request.user)
        ProjectMember.objects.create(
            project=project, user=self.request.user, role=ProjectMember.Role.OWNER,
        )
        return project
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        return Response({
            "success": True,
            "project": self.get_serializer(self.get_object()).data,
        })
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = self.perform_create(serializer)
        
        return Response(
            {
                "success": True,
                "message": "Project created successfully.",
                "project": ProjectDetailSerializer(project, context=self.get_serializer_context()).data,
            },
            status=status.HTTP_201_CREATED,
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        project = self.get_object()
        serializer = self.get_serializer(project, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            "success": True,
            "message": "Project updated.",
            "project": ProjectDetailSerializer(project, context=self.get_serializer_context()).data,
        })
    
    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response({"success": True, "message": "Project deleted."})
    
    @action(detail=True, methods=["get"])
    def members(self, request, org_id=None, pk=None):
        project = self.get_object()
        members = project.member_records.select_related("user").all()
        return Response({
            "success": True,
            "members": ProjectMemberSerializer(members, many=True).data,
        })
    
    @action(detail=True, methods=["post"])
    def add_member(self, request, org_id=None, pk=None):
        project = self.get_object()
        user_id = request.data.get("user_id")
        role = request.data.get("role", "viewer")
        
        if not user_id:
            return Response(
                {"success": False, "error": "user_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Get the actual User object
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"success": False, "error": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        # Check if user is in the same organization
        org = Organization.objects.get(id=org_id)
        if not org.is_member(user):  # ← Now passes User object, not string!
            return Response(
                {"success": False, "error": "User is not a member of this organization."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        member, created = ProjectMember.objects.get_or_create(
            project=project,
            user=user,
            defaults={"role": role},
        )
        
        if not created:
            return Response(
                {"success": False, "error": "User is already a member of this project."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        return Response(
            {
                "success": True,
                "message": "Member added to project.",
                "member": ProjectMemberSerializer(member).data,
            },
            status=status.HTTP_201_CREATED,
        )
