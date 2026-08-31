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
    
    class Meta:
        model = Project
        fields = [
            "id", "name", "key", "description", "status", "priority",
            "start_date", "end_date", "task_count", "member_count",
            "created_at",
        ]
    
    def get_task_count(self, obj):
        return obj.task_count()
    
    def get_member_count(self, obj):
        return obj.member_count()


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
    """
    Serializer for creating/updating projects.
    
    Validates:
    - Key is unique within organization
    - End date is after start date
    """
    
    class Meta:
        model = Project
        fields = ["name", "description", "key", "priority", "start_date", "end_date"]
    
    def validate_key(self, value):
        """Ensure key is unique within the organization."""
        org_id = self.context.get("organization_id")
        if org_id and Project.objects.filter(organization_id=org_id, key=value.upper()).exists():
            raise serializers.ValidationError(
                f"Project key '{value}' already exists in this organization."
            )
        return value.upper()
    
    def validate(self, attrs):
        """End date must be after start date."""
        start = attrs.get("start_date")
        end = attrs.get("end_date")
        if start and end and end < start:
            raise serializers.ValidationError({
                "end_date": "End date must be after start date."
            })
        return attrs
