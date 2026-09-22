from rest_framework import serializers
from .models import Project, ProjectMember
from apps.users.serializers import UserListSerializer


class ProjectMemberSerializer(serializers.ModelSerializer):
    """Serialize a project membership."""
    user = UserListSerializer(read_only=True)
    
    class Meta:
        model = ProjectMember
        fields = ["id", "user", "role", "joined_at"]
        read_only_fields = ["id", "user", "joined_at"]


class ProjectListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for project lists.
    
    Used in: GET /organizations/<id>/projects/
    Shows: basic info + counts, NOT full member list.
    """
    task_count = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    active_tasks = serializers.SerializerMethodField()
    completed_tasks = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            "id", "name", "key", "description", "status", "priority",
            "start_date", "end_date", "task_count", "member_count",
            "active_tasks", "completed_tasks", "created_at",
        ]
    
    def get_task_count(self, obj):
        return obj.tasks.count()
    
    def get_member_count(self, obj):
        return obj.members.count()
    
    def get_active_tasks(self, obj):
        # Any task that is NOT in the 'done' status
        return obj.tasks.exclude(status__slug="done").count()
    
    def get_completed_tasks(self, obj):
        return obj.tasks.filter(status__slug="done").count()


class ProjectDetailSerializer(ProjectListSerializer):
    """
    Full serializer for single project view.
    
    Adds: members list, created_by, default_assignee.
    """
    members = ProjectMemberSerializer(many=True, read_only=True)
    created_by = UserListSerializer(read_only=True)
    default_assignee = UserListSerializer(read_only=True)
    current_user_role = serializers.SerializerMethodField()
    
    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields + [
            "members", "created_by", "default_assignee",
            "organization", "current_user_role",
        ]
    
    def get_current_user_role(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.get_member_role(request.user)
        return None


class CreateProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["name", "description", "key", "priority", "start_date", "end_date", "organization"]

    def validate_key(self, value):
        # Get the organization ID from the incoming data
        org_id = self.initial_data.get("organization")
        
        # Check if a project with this key already exists in this organization
        if org_id and Project.objects.filter(organization_id=org_id, key=value.upper()).exists():
            raise serializers.ValidationError(
                f"A project with the key '{value}' already exists in this organization."
            )
        return value.upper()

    def validate(self, attrs):
        start = attrs.get("start_date")
        end = attrs.get("end_date")
        if start and end and end < start:
            raise serializers.ValidationError({
                "end_date": "End date must be after start date."
            })
        return attrs