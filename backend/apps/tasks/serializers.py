from rest_framework import serializers
from apps.users.serializers import UserListSerializer
from apps.tasks.models import (
    Task,
    TaskComment,
    TaskAttachment,
    TaskActivity,
    TaskStatus,
    TaskPriority,
)


class TaskStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskStatus
        fields = ["id", "name", "slug", "order", "color", "is_default"]


class TaskPrioritySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskPriority
        fields = ["id", "name", "slug", "order", "color"]


class SlugField(serializers.Field):
    """
    Converts slugs to IDs on input and IDs/objects back to slugs on output.
    Requires 'project_id' to be passed in the serializer context to work.
    """

    def __init__(self, **kwargs):
        self.slug_model = kwargs.pop("slug_model", None)
        self.slug_field = kwargs.pop("slug_field", "slug")
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        if data is None:
            return None

        # If the frontend sent an integer ID, fetch the instance
        try:
            int_id = int(data)
            if self.slug_model:
                # Try to get by ID
                project_id = self.context.get("project_id")
                if project_id:
                    instance = self.slug_model.objects.filter(id=int_id, project_id=project_id).first()
                    if instance:
                        return instance # RETURN INSTANCE, NOT ID
        except (ValueError, TypeError):
            pass

        # If it's a string slug, look it up in the database
        project_id = self.context.get("project_id")

        if project_id and self.slug_model:
            try:
                instance = self.slug_model.objects.get(
                    project_id=project_id,
                    **{self.slug_field: str(data)},
                )
                return instance # <--- FIX: Return the instance, not instance.id
            except self.slug_model.DoesNotExist:
                raise serializers.ValidationError({
                    self.slug_field: f"Invalid {self.slug_field}: '{data}' for this project."
                })

        raise serializers.ValidationError({
            self.slug_field: f"Expected ID or valid {self.slug_field} slug, got '{data}'. (Missing project_id in context?)"
        })

    def to_representation(self, value):
        # When reading, DRF passes the actual related object instance here
        if value is None:
            return None
            
        if isinstance(value, str):
            return value
            
        # Return the slug string (e.g., "TODO") instead of the ID
        return getattr(value, self.slug_field, None)

class TaskListSerializer(serializers.ModelSerializer):
    status = TaskStatusSerializer(read_only=True)
    priority = TaskPrioritySerializer(read_only=True)
    assignee = UserListSerializer(read_only=True)
    key = serializers.CharField(read_only=True)
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "key",
            "task_number",
            "title",
            "task_type",
            "status",
            "priority",
            "assignee",
            "due_date",
            "estimate_hours",
            "comments_count",
            "created_at",
            "updated_at",
        ]

    def get_comments_count(self, obj):
        return obj.comments_count()


class TaskDetailSerializer(TaskListSerializer):
    reporter = UserListSerializer(read_only=True)
    parent = serializers.PrimaryKeyRelatedField(read_only=True)
    subtasks = TaskListSerializer(many=True, read_only=True)
    watchers = UserListSerializer(many=True, read_only=True)

    class Meta(TaskListSerializer.Meta):
        fields = TaskListSerializer.Meta.fields + [
            "description",
            "reporter",
            "parent",
            "subtasks",
            "watchers",
            "time_spent_hours",
            "started_at",
            "completed_at",
            "project",
        ]


class CreateTaskSerializer(serializers.ModelSerializer):
    status = SlugField(
        slug_model=TaskStatus,
        slug_field="slug",
        required=False,
        allow_null=True,
        write_only=True,
    )

    priority = SlugField(
        slug_model=TaskPriority,
        slug_field="slug",
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = Task
        fields = [
            "title",
            "description",
            "task_type",
            "status",
            "priority",
            "assignee",
            "parent",
            "due_date",
            "estimate_hours",
        ]

    def validate(self, attrs):
        # FIX: Task model uses started_at and completed_at, not start_date/end_date
        started_at = attrs.get("started_at")
        completed_at = attrs.get("completed_at")

        if started_at and completed_at and completed_at < started_at:
            raise serializers.ValidationError({
                "completed_at": "Completed date must be after started date."
            })

        return super().validate(attrs)


class TaskCommentSerializer(serializers.ModelSerializer):
    author = UserListSerializer(read_only=True)

    class Meta:
        model = TaskComment
        fields = [
            "id",
            "content",
            "is_internal",
            "author",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "author",
            "created_at",
            "updated_at",
        ]


class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserListSerializer(read_only=True)

    class Meta:
        model = TaskAttachment
        fields = [
            "id",
            "file",
            "filename",
            "file_size",
            "uploaded_by",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "filename",
            "file_size",
            "uploaded_by",
            "created_at",
        ]


class TaskActivitySerializer(serializers.ModelSerializer):
    user = UserListSerializer(read_only=True)

    class Meta:
        model = TaskActivity
        fields = [
            "id",
            "action",
            "old_value",
            "new_value",
            "description",
            "user",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "created_at",
        ]