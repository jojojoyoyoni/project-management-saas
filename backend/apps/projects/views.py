from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Project, ProjectMember
from .serializers import ProjectListSerializer, ProjectDetailSerializer, CreateProjectSerializer, ProjectMemberSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    search_fields = ["name", "key", "description"]
    filterset_fields = ["status", "priority"]
    ordering_fields = ["name", "created_at", "priority"]
    ordering = ["-created_at"]
    
    def get_queryset(self):
        from apps.organizations.models import Organization
        org_id = self.kwargs.get("org_id")
        if org_id:
            return Project.objects.filter(organization_id=org_id, members=self.request.user)
        return Project.objects.filter(members=self.request.user)
    
    def get_serializer_class(self):
        if self.action == "list":
            return ProjectListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return CreateProjectSerializer
        return ProjectDetailSerializer
    
    def perform_create(self, serializer):
        from apps.organizations.models import Organization
        org_id = self.kwargs.get("org_id")
        org = Organization.objects.get(id=org_id)
        project = serializer.save(organization=org, created_by=self.request.user)
        ProjectMember.objects.create(
            project=project, user=self.request.user, role=ProjectMember.Role.OWNER,
        )
    
    @action(detail=True, methods=["get"])
    def members(self, request, org_id=None, pk=None):
        project = self.get_object()
        members = project.projectmember_set.select_related("user").all()
        serializer = ProjectMemberSerializer(members, many=True)
        return Response({"success": True, "members": serializer.data})
    
    @action(detail=True, methods=["post"])
    def add_member(self, request, org_id=None, pk=None):
        project = self.get_object()
        user_id = request.data.get("user_id")
        role = request.data.get("role", "viewer")
        
        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        member, created = ProjectMember.objects.get_or_create(
            project=project, user_id=user_id,
            defaults={"role": role},
        )
        
        if not created:
            return Response({"error": "User is already a member"}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(
            {"success": True, "member": ProjectMemberSerializer(member).data},
            status=status.HTTP_201_CREATED,
        )
