from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from apps.users.models import User
from apps.projects.models import Project
from .models import Task, TaskComment, TaskAttachment, TaskActivity
from .serializers import (
    TaskListSerializer,
    TaskDetailSerializer,
    CreateTaskSerializer,
    TaskCommentSerializer,
    TaskAttachmentSerializer,
    TaskActivitySerializer,
)
from apps.projects.permissions import IsProjectMember


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    search_fields = ["title", "description"]
    filterset_fields = ["status", "priority", "assignee", "task_type"]
    ordering_fields = ["created_at", "updated_at", "due_date", "task_number", "priority"]
    ordering = ["-created_at"]


    def get_serializer_context(self):
        """Pass project_id to serializer context so SlugField can convert slugs to IDs."""
        context = super().get_serializer_context()
        context['project_id'] = self.kwargs.get('project_id')
        return context
    
    def get_queryset(self):
        project_id = self.kwargs.get("project_id")
        if not project_id:
            return Task.objects.none()
        
        return Task.objects.filter(
            project_id=project_id,
            project__members=self.request.user,  # Multi-tenancy!
        ).select_related(
            "project", "status", "priority", "assignee", "reporter", "parent"
        ).prefetch_related(
            "watchers",
        )
    
    def get_serializer_class(self):
        if self.action == "list":
            return TaskListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return CreateTaskSerializer
        return TaskDetailSerializer

    
    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy", "clone", "watch", "unwatch", "clone"]:
            return [IsAuthenticated(), IsProjectMember()]
        return [IsAuthenticated()]
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        return Response({
            "success": True,
            "task": self.get_serializer(self.get_object()).data,
        })
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = serializer.save(
            project_id=self.kwargs.get("project_id"),
            reporter=self.request.user,
        )
        
        # Log creation
        TaskActivity.objects.create(
            task=task,
            user=self.request.user,
            action="created",
            description=f"Created task: {task.title}",
        )
        
        return Response(
            {"success": True, "task": TaskDetailSerializer(task).data},
            status=status.HTTP_201_CREATED,
        )

    
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(
            {"success": True, "task": TaskDetailSerializer(instance, context=self.get_serializer_context()).data},
        )
    
    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response({"success": True, "message": "Task deleted."})
    
    @action(detail=True, methods=["get"])
    def activities(self, request, project_id=None, pk=None):
        task = self.get_object()
        activities = task.activities.all()[:50]
        return Response({
            "success": True,
            "activities": TaskActivitySerializer(activities, many=True).data,
        })
    
    @action(detail=True, methods=["post"])
    def watch(self, request, project_id=None, pk=None):
        task = self.get_object()
        task.watchers.add(request.user)
        return Response({"success": True, "message": "Now watching task."})
    
    @action(detail=True, methods=["post"])
    def unwatch(self, request, project_id=None, pk=None):
        task = self.get_object()
        task.watchers.remove(request.user)
        return Response({"success": True, "message": "Stopped watching."})
    
    @action(detail=True, methods=["post"])
    def clone(self, request, project_id=None, pk=None):
        task = self.get_object()
        from .services import TaskService
        
        cloned = TaskService.clone_task(task, self.request.user)
        return Response(
            {"success": True, "task": TaskDetailSerializer(cloned, context=self.get_serializer_context()).data},
            status=status.HTTP_201_CREATED,
        )
    
    @action(detail=True, methods=["post"])
    def bulk_update_status(self, request, project_id=None, pk=None):
        """Update status for multiple tasks at once."""
        task_ids = request.data.get("task_ids", [])
        new_status_id = request.data.get("status_id")
        
        if not task_ids or not new_status_id:
            return Response(
                {"error": "task_ids and status_id are required"},
                status=400,
            )
        
        updated = Task.objects.filter(
            id__in=[str(id) for id in task_ids],
            project_id=project_id,
        ).update(status_id=new_status_id)
        
        return Response({"success": True, "updated": updated})



class TaskCommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for comments belonging to a task.

    URL:
        /api/projects/<project_id>/tasks/<task_pk>/comments/
    """

    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs.get("project_id")
        task_pk = self.kwargs.get("task_pk")

        if not project_id or not task_pk:
            return TaskComment.objects.none()

        return TaskComment.objects.filter(
            task_id=task_pk,
            task__project_id=project_id,
            task__project__members=self.request.user,
        ).select_related(
            "author",
            "task",
        )

    def perform_create(self, serializer):
        project_id = self.kwargs.get("project_id")
        task_pk = self.kwargs.get("task_pk")

        task = Task.objects.filter(
            id=task_pk,
            project_id=project_id,
            project__members=self.request.user,
        ).first()

        if not task:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                "You do not have access to this task."
            )

        serializer.save(
            task=task,
            author=self.request.user,
        )
