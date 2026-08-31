from rest_framework import serializers
from .models import Project, ProjectMember
from apps.users.serializers import UserListSerializer

class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserListSerializer(read_only=True)
    
    class Meta:
        model = ProjectMember
        fields = ["id", "user", "role", "joined_at"]
        read_only_fields = ["id", "user", "joined_at"]

class ProjectListSerializer(serializers.ModelSerializer):
    task_count = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            "id", "name", "key", "description", "status", "priority",
            "start_date", "end_date", "task_count", "member_count", "created_at",
        ]
    
    def get_task_count(self, obj):
        return obj.task_count()
    
    def get_member_count(self, obj):
        return obj.members.count()

class ProjectDetailSerializer(ProjectListSerializer):
    members = ProjectMemberSerializer(many=True, read_only=True)
    created_by = UserListSerializer(read_only=True)
    default_assignee = UserListSerializer(read_only=True)
    
    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields + ["members", "created_by", "default_assignee", "organization"]

class CreateProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["name", "description", "key", "priority", "start_date", "end_date"]
    
    def validate_key(self, value):
        if self.context.get("request"):
            org_id = self.context["view"].kwargs.get("org_id")
            if org_id and Project.objects.filter(organization_id=org_id, key=value.upper()).exists():
                raise serializers.ValidationError("Project key must be unique within organization.")
        return value.upper()
