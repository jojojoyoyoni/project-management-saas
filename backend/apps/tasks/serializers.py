from rest_framework import serializers
from .models import Task, TaskComment, TaskAttachment, TaskActivity, TaskStatus, TaskPriority
from apps.users.serializers import UserListSerializer

class TaskStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskStatus
        fields = ["id", "name", "slug", "order", "color", "is_default"]

class TaskPrioritySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskPriority
        fields = ["id", "name", "slug", "order", "color"]

class TaskListSerializer(serializers.ModelSerializer):
    status = TaskStatusSerializer(read_only=True)
    priority = TaskPrioritySerializer(read_only=True)
    assignee = UserListSerializer(read_only=True)
    key = serializers.CharField(read_only=True)
    
    class Meta:
        model = Task
        fields = [
            "id", "key", "task_number", "title", "task_type", "status",
            "priority", "assignee", "due_date", "estimate_hours", "created_at", "updated_at",
        ]

class TaskDetailSerializer(TaskListSerializer):
    reporter = UserListSerializer(read_only=True)
    parent = serializers.PrimaryKeyRelatedField(read_only=True)
    subtasks = TaskListSerializer(many=True, read_only=True)
    watchers = UserListSerializer(many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()
    
    class Meta(TaskListSerializer.Meta):
        fields = TaskListSerializer.Meta.fields + [
            "description", "reporter", "parent", "subtasks", "watchers",
            "time_spent_hours", "started_at", "completed_at", "comments_count",
        ]
    
    def get_comments_count(self, obj):
        return obj.comments.count()

class CreateTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["title", "description", "task_type", "status", "priority", "assignee", "parent", "due_date", "estimate_hours"]

class TaskCommentSerializer(serializers.ModelSerializer):
    author = UserListSerializer(read_only=True)
    
    class Meta:
        model = TaskComment
        fields = ["id", "content", "is_internal", "author", "created_at", "updated_at"]
        read_only_fields = ["id", "author", "created_at", "updated_at"]

class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserListSerializer(read_only=True)
    
    class Meta:
        model = TaskAttachment
        fields = ["id", "file", "filename", "file_size", "uploaded_by", "created_at"]
        read_only_fields = ["id", "filename", "file_size", "uploaded_by", "created_at"]

class TaskActivitySerializer(serializers.ModelSerializer):
    user = UserListSerializer(read_only=True)
    
    class Meta:
        model = TaskActivity
        fields = ["id", "action", "old_value", "new_value", "description", "user", "created_at"]
