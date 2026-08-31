from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Task, TaskComment, TaskAttachment, TaskActivity
from .serializers import (
    TaskListSerializer, TaskDetailSerializer, CreateTaskSerializer,
    TaskCommentSerializer, TaskAttachmentSerializer, TaskActivitySerializer,
)

class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    search_fields = ["title", "description"]
    filterset_fields = ["status", "priority", "assignee", "task_type"]
    ordering_fields = ["created_at", "updated_at", "due_date", "task_number"]
    ordering = ["-created_at"]
    
    def get_queryset(self):
        from apps.projects.models import Project
        project_id = self.kwargs.get("project_id")
        if project_id:
            return Task.objects.filter(project_id=project_id).select_related(
                "project", "status", "priority", "assignee", "reporter",
            )
        return Task.objects.none()
    
    def get_serializer_class(self):
        if self.action == "list":
            return TaskListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return CreateTaskSerializer
        return TaskDetailSerializer
    
    def perform_create(self, serializer):
        from apps.projects.models import Project
        project_id = self.kwargs.get("project_id")
        project = Project.objects.get(id=project_id)
        task = serializer.save(project=project, reporter=self.request.user)
        TaskActivity.objects.create(
            task=task, user=self.request.user, action="created",
            description=f"Created task: {task.title}",
        )
    
    @action(detail=True, methods=["get"])
    def activities(self, request, project_id=None, pk=None):
        task = self.get_object()
        activities = task.activities.all()[:50]
        serializer = TaskActivitySerializer(activities, many=True)
        return Response({"success": True, "activities": serializer.data})
    
    @action(detail=True, methods=["post"])
    def watch(self, request, project_id=None, pk=None):
        task = self.get_object()
        task.watchers.add(request.user)
        return Response({"success": True, "message": "Now watching task"})
    
    @action(detail=True, methods=["post"])
    def unwatch(self, request, project_id=None, pk=None):
        task = self.get_object()
        task.watchers.remove(request.user)
        return Response({"success": True, "message": "Stopped watching task"})

class TaskCommentViewSet(viewsets.ModelViewSet):
    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TaskComment.objects.filter(task_id=self.kwargs["task_pk"]).select_related("author")
    
    def perform_create(self, serializer):
        serializer.save(task_id=self.kwargs["task_pk"], author=self.request.user)

class TaskAttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = TaskAttachmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TaskAttachment.objects.filter(task_id=self.kwargs["task_pk"]).select_related("uploaded_by")
    
    def perform_create(self, serializer):
        file = self.request.data.get("file")
        serializer.save(
            task_id=self.kwargs["task_pk"],
            uploaded_by=self.request.user,
            filename=file.name,
            file_size=file.size,
        )
