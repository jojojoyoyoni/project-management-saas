from apps.notifications.models import Notification
from apps.tasks.models import Task
from rest_framework import serializers, status, viewsets
from django.db.models import Count
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
        if not org_id:
            return Project.objects.none()
            
        queryset = Project.objects.filter(organization_id=org_id)
        
 
        if user.is_superuser:
            return queryset.exclude(status="archived").select_related("organization", "created_by", "default_assignee")
            
        from apps.organizations.models import Organization
        org = Organization.objects.filter(id=org_id).first()
        if org and (org.is_owner(user) or org.get_member_role(user) == "admin"):
            return queryset.exclude(status="archived").select_related("organization", "created_by", "default_assignee")
        
        return queryset.filter(members=user).exclude(status="archived").select_related("organization", "created_by", "default_assignee")
    
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
            
        from apps.organizations.models import Organization
        try:
            org = Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            raise serializers.ValidationError({"error": "Organization not found."})
            
        # FIX: Allow access if user is the Owner OR a Member
        if not (org.is_owner(self.request.user) or org.is_member(self.request.user)):
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
        
        # FIX: Use the organization's members M2M relationship directly
        org_members = project.organization.members.exclude(id=request.user.id)
        
        notifications = [
            Notification(recipient=member, actor=request.user, project=project, verb=f"created a new project: {project.name}")
            for member in org_members
        ]
        Notification.objects.bulk_create(notifications)
        
        return Response(
            {"success": True, "message": "Project created successfully.", "project": ProjectDetailSerializer(project, context=self.get_serializer_context()).data},
            status=status.HTTP_201_CREATED,
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        project = self.get_object()
        old_status = project.status
        serializer = self.get_serializer(project, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # NOTIFICATION: If project status changed to 'archived'
        new_status = serializer.validated_data.get("status", old_status)
        if old_status != new_status and new_status == "archived":
            members = project.members.exclude(id=request.user.id)
            notifications = [
                Notification(recipient=member, actor=request.user, project=project, verb=f"archived the project: {project.name}")
                for member in members
            ]
            Notification.objects.bulk_create(notifications)
            
        return Response({
            "success": True, "message": "Project updated.",
            "project": ProjectDetailSerializer(project, context=self.get_serializer_context()).data,
        })
 
    
    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)
    

    def destroy(self, request, *args, **kwargs):
        project = self.get_object()
        project_name = project.name
        members = list(project.members.exclude(id=request.user.id)) # Get members before deleting!
        
        # self.get_object().delete()
        # SOFT DELETE: Archive instead of permanent deletion
        project.status = "archived"
        project.save()
        
        # Send notification that the project was archived
        notifications = [
            Notification(recipient=member, actor=request.user, project=project, verb=f"archived the project: {project_name}")
            for member in members
        ]
        Notification.objects.bulk_create(notifications)
        
        return Response({"success": True, "message": "Project archived successfully."})

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
            
        # Add them to the project with the selected role (admin = Project Manager)
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

    @action(detail=True, methods=["get"])
    def report(self, request, pk=None):
        project = self.get_object()
        from django.db.models import Sum
        from django.utils import timezone

        # 1. By Status
        status_data = Task.objects.filter(project=project).values('status__name', 'status__color').annotate(count=Count('id'))
        
        # 2. By Priority
        priority_data = Task.objects.filter(project=project).values('priority__name').annotate(count=Count('id'))
        
        # 3. Workload (By Assignee)
        workload_data = Task.objects.filter(project=project, assignee__isnull=False).values('assignee__username').annotate(count=Count('id'))
        
        # 4. By Task Type
        type_data = Task.objects.filter(project=project).values('task_type').annotate(count=Count('id'))
        
        # 5. Time Tracking
        time_data = Task.objects.filter(project=project).aggregate(
            total_estimated=Sum('estimate_hours', default=0),
            total_spent=Sum('time_spent_hours', default=0)
        )
        
        # 6. Overdue Tasks
        overdue_count = Task.objects.filter(
            project=project, 
            due_date__lt=timezone.now().date()
        ).exclude(status__slug="done").count()
        
        # Stats Summary
        total_tasks = Task.objects.filter(project=project).count()
        done_tasks = Task.objects.filter(project=project, status__slug="done").count()
        completion_rate = (done_tasks / total_tasks * 100) if total_tasks > 0 else 0

        # OVERDUE TASKS LIST (Fetch task_number, not key)
        overdue_tasks_qs = Task.objects.filter(
            project=project, 
            due_date__lt=timezone.now().date()
        ).exclude(status__slug="done").values(
            'id', 'title', 'task_number', 'assignee__username', 'due_date'
        )[:5] # Limit to top 5
        
        # Construct the 'key' string manually for the frontend
        overdue_tasks = []
        for t in overdue_tasks_qs:
            t['key'] = f"{project.key}-{t['task_number']}"
            overdue_tasks.append(t)
        
        return Response({
            "success": True,
            "task_by_status": list(status_data),
            "task_by_priority": list(priority_data),
            "task_by_assignee": list(workload_data),
            "task_by_type": list(type_data),
            "time_tracking": time_data,
            "overdue_count": overdue_count,
            "overdue_tasks": overdue_tasks,
            "stats": {
                "total_tasks": total_tasks,
                "completion_rate": round(completion_rate, 2)
            }
        })