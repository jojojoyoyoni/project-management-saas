from apps.notifications.models import Notification
from rest_framework import status, viewsets, serializers
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from apps.users.models import User
from apps.projects.models import Project
from .models import Task, TaskComment, TaskAttachment, TaskActivity, TaskStatus
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
    permission_classes = [IsAuthenticated, IsProjectMember]
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
        user = self.request.user

        if not project_id:
            return Task.objects.none()

        # Base queryset: tasks for this specific project
        queryset = Task.objects.filter(project_id=project_id)

        # SUPER ADMIN OVERRIDE: Can see all tasks in the project
        if user.is_superuser:
            return queryset.select_related(
                "project", "status", "priority", "assignee", "reporter", "parent"
            ).prefetch_related("watchers",)

        # REGULAR USER: Only sees tasks if they are a member of the project
        return queryset.filter(
            project__members=user 
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
        project_id = self.kwargs.get("project_id")
        
        # SECURITY: Check if user is a member of the project before creating a task
        project = Project.objects.filter(id=project_id, members=request.user).first()
        if not project:
            raise serializers.ValidationError({"error": "You do not have access to this project."})

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = serializer.save(
            project=project,
            reporter=request.user,
        )
        
        # Log creation
        TaskActivity.objects.create(
            task=task,
            user=request.user,
            action="created",
            description=f"Created task: {task.title}",
        )
        # NOTIFICATION 1: If task is assigned to someone on creation
        if task.assignee and task.assignee != request.user:
            Notification.objects.create(
                recipient=task.assignee,
                actor=request.user,
                task=task,
                verb=f"assigned you to a new task: {task.title}"
            )
        
        return Response(
            {"success": True, "task": TaskDetailSerializer(task, context=self.get_serializer_context()).data},
            status=status.HTTP_201_CREATED,
        )
        
    # def update(self, request, *args, **kwargs):
    #     partial = kwargs.pop("partial", False)
    #     instance = self.get_object()
    #     serializer = self.get_serializer(instance, data=request.data, partial=partial)
    #     serializer.is_valid(raise_exception=True)
    #     serializer.save()
        
    #     return Response(
    #         {"success": True, "task": TaskDetailSerializer(instance, context=self.get_serializer_context()).data},
    #     )


    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        
        old_assignee = instance.assignee
        old_status = instance.status
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        
        # NOTIFICATION 2: Assignee changed
        new_assignee = task.assignee
        if new_assignee and new_assignee != old_assignee:
            if new_assignee != request.user:
                Notification.objects.create(
                    recipient=new_assignee,
                    actor=request.user,
                    task=task,
                    verb=f"assigned you to task: {task.title}"
                )
                
        # NOTIFICATION 3: Status changed to "Done"
        if old_status != task.status and task.status and task.status.slug == "done":
            # Notify the reporter that the task is done
            if task.reporter and task.reporter != request.user:
                Notification.objects.create(
                    recipient=task.reporter,
                    actor=request.user,
                    task=task,
                    verb=f"completed the task: {task.title}"
                )
        
        return Response(
            {"success": True, "task": TaskDetailSerializer(task, context=self.get_serializer_context()).data},
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
        
        cloned = TaskService.clone_task(task, request.user)
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


class TaskStatusViewSet(viewsets.ModelViewSet):
    """Used by the frontend to fetch and manage Kanban columns."""
    permission_classes = [IsAuthenticated]
    queryset = TaskStatus.objects.all()
    
    def get_serializer_class(self):
        from .serializers import TaskStatusSerializer
        return TaskStatusSerializer

    def get_queryset(self):
        queryset = TaskStatus.objects.all()
        project_id = self.request.query_params.get('project')
        
        if project_id:
            # SUPER ADMIN OVERRIDE: Can see all columns
            if self.request.user.is_superuser:
                queryset = queryset.filter(project_id=project_id)
            else:
                # REGULAR USER: Only see columns if they are a project member
                queryset = queryset.filter(project_id=project_id, project__members=self.request.user)
                
        return queryset

    def perform_create(self, serializer):
        project_id = self.request.data.get('project')
        name = self.request.data.get('name', '')
        slug = self.request.data.get('slug')

        # SECURITY: Check project membership before creating a status
        project = Project.objects.filter(id=project_id, members=self.request.user).first()
        if not project:
            raise serializers.ValidationError({"error": "You do not have access to this project."})

        # Auto-generate slug if not provided
        if not slug and name:
            base_slug = name.lower().replace(' ', '-')
            slug = base_slug
            counter = 1
            
            # Ensure slug is unique for this project
            while TaskStatus.objects.filter(project_id=project_id, slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

        # Set default order (put it at the end)
        max_order = TaskStatus.objects.filter(project_id=project_id).count()
        
        serializer.save(
            project_id=project_id, 
            slug=slug,
            order=max_order
        )
        
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
            
        # 1. Save the comment ONCE
        serializer.save(task=task, author=self.request.user)

        
        # 2. Create the notification
        recipients = set()
        if task.assignee:
            recipients.add(task.assignee)
        if task.reporter:
            recipients.add(task.reporter)
            
        for recipient in recipients:
            if recipient != self.request.user:
                Notification.objects.create(
                    recipient=recipient,
                    actor=self.request.user,
                    task=task,
                    project=task.project,
                    verb=f"commented on task: {task.title}"
                )
        
        # NO SECOND serializer.save() HERE!