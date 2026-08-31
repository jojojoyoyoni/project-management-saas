from rest_framework import serializers
from .models import Organization, OrganizationMember
from apps.users.serializers import UserListSerializer

class OrganizationMemberSerializer(serializers.ModelSerializer):
    user = UserListSerializer(read_only=True)
    
    class Meta:
        model = OrganizationMember
        fields = ["id", "user", "role", "joined_at"]
        read_only_fields = ["id", "user", "joined_at"]

class OrganizationSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    project_count = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    current_user_role = serializers.SerializerMethodField()
    
    class Meta:
        model = Organization
        fields = [
            "id", "name", "slug", "description", "logo", "plan",
            "max_members", "max_projects", "owner", "member_count",
            "project_count", "is_owner", "current_user_role", "created_at",
        ]
        read_only_fields = ["id", "slug", "plan", "max_members", "max_projects", "owner", "created_at"]
    
    def get_member_count(self, obj):
        return obj.member_count()
    
    def get_project_count(self, obj):
        return obj.project_count()
    
    def get_is_owner(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.is_owner(request.user)
        return False
    
    def get_current_user_role(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.get_member_role(request.user)
        return None

class CreateOrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["name", "description"]
    
    def create(self, validated_data):
        from core.utils import generate_unique_key
        user = self.context["request"].user
        org = Organization(
            **validated_data,
            slug=generate_unique_key(Organization, "slug", length=8),
            owner=user,
        )
        org.save()
        OrganizationMember.objects.create(
            organization=org, user=user, role=OrganizationMember.Role.OWNER, invited_by=user,
        )
        return org
