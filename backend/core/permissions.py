"""
Custom permission classes for access control.
"""
from rest_framework.permissions import BasePermission


class IsOrganizationMember(BasePermission):
    """
    Only allow members of the organization.
    
    Used for: Organization-scoped resources (projects, tasks)
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # obj should have is_member() method
        return obj.is_member(request.user)


class IsOrganizationAdmin(BasePermission):
    """
    Only allow admins/owners of the organization.
    
    Used for: Sensitive operations (delete project, manage members)
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if obj.is_owner(request.user):
            return True
        role = obj.get_member_role(request.user)
        return role in ["owner", "admin"]


class IsProjectMember(BasePermission):
    """
    Only allow members of the project.
    
    Used for: Project resources (tasks, comments)
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        return obj.members.filter(id=request.user.id).exists()
