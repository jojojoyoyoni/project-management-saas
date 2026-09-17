from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

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
        user = self.request.user
        
        # Get the active organization ID from the frontend header
        org_id = self.request.headers.get('X-Organization-Id')
        
        # SUPER ADMIN OVERRIDE: Can see all projects in the organization
        if user.is_superuser:
            queryset = Project.objects.all()
            if org_id:
                queryset = queryset.filter(organization_id=org_id)
            return queryset.select_related("organization", "created_by", "default_assignee")
        
        # REGULAR USER: Only sees projects they are explicitly a member of
        queryset = Project.objects.filter(members=user)
        if org_id:
            queryset = queryset.filter(organization_id=org_id)
            
        return queryset.select_related("organization", "created_by", "default_assignee")
    
    def get_serializer_class(self):
        if self.action == "list":
            return ProjectListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return CreateProjectSerializer
        return ProjectDetailSerializer
    
    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsProjectAdmin()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        # When creating, get the org_id from the request data (sent by React)
        org_id = self.request.data.get("organization")
        
        if not org_id:
            raise serializers.ValidationError({"error": "Organization ID is required."})
            
        org = Organization.objects.get(id=org_id)
        if not org.is_member(self.request.user):
            raise serializers.ValidationError({"error": "You do not have access to this organization."})
            
        project = serializer.save(organization=org, created_by=self.request.user)
        ProjectMember.objects.create(project=project, user=self.request.user, role=ProjectMember.Role.OWNER)
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
    
    # Removed org_id from signatures
    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        project = self.get_object()
        members = project.member_records.select_related("user").all()
        return Response({
            "success": True,
            "members": ProjectMemberSerializer(members, many=True).data,
        })

    @action(detail=True, methods=["post"])
    def invite_member(self, request, pk=None):
        project = self.get_object()
        username_or_email = request.data.get("username_or_email")
        role = request.data.get("role", "viewer")
        
        if not username_or_email:
            return Response({"error": "Username or email is required."}, status=400)
            
        user = User.objects.filter(Q(username=username_or_email) | Q(email=username_or_email)).first()
        if not user:
            return Response({"error": "User not found."}, status=404)
            
        # SECURITY: Make sure the invited user is in the same organization!
        if not project.organization.is_member(user):
            return Response({"error": "User must be a member of the organization first."}, status=400)
            
        if project.member_records.filter(user=user).exists():
            return Response({"error": "User is already a member of this project."}, status=400)
            
        member = ProjectMember.objects.create(project=project, user=user, role=role)
        return Response(ProjectMemberSerializer(member).data, status=201)

    @action(detail=True, methods=["patch"])
    def update_member_role(self, request, pk=None):
        project = self.get_object()
        member_id = request.data.get("member_id")
        new_role = request.data.get("role")
        
        member = project.member_records.filter(id=member_id).first()
        if not member:
            return Response({"error": "Member not found."}, status=404)
        if member.role == "owner":
            return Response({"error": "Cannot change owner's role."}, status=400)
            
        member.role = new_role
        member.save()
        return Response(ProjectMemberSerializer(member).data)

    @action(detail=True, methods=["delete"])
    def remove_member(self, request, pk=None):
        project = self.get_object()
        member_id = request.data.get("member_id")
        
        member = project.member_records.filter(id=member_id).first()
        if not member:
            return Response({"error": "Member not found."}, status=404)
        if member.role == "owner":
            return Response({"error": "Cannot remove owner."}, status=400)
            
        member.delete()
        return Response({"success": True, "message": "Member removed."})