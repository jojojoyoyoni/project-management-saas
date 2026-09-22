from rest_framework import serializers
from .models import Notification
from apps.users.serializers import UserListSerializer

class NotificationSerializer(serializers.ModelSerializer):
    actor = UserListSerializer(read_only=True)
    # ADD THIS: Task title and project ID for task notifications
    task_title = serializers.CharField(source="task.title", read_only=True)
    project_id = serializers.CharField(source="task.project.id", read_only=True)

    # ADD THIS: Project details (if it's a project notification)
    project_name = serializers.CharField(source="project.name", read_only=True)
    project_id_from_project = serializers.CharField(source="project.id", read_only=True)


    class Meta:
        model = Notification
        fields = ["id", "actor", "verb", "task", "task_title", "project_id", "project", "project_name", "project_id_from_project", "is_read", "created_at"]