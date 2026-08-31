from rest_framework.permissions import BasePermission


class IsProjectMember(BasePermission):
    """User must be a member of the project."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        return obj.is_member(request.user)


class IsProjectEditor(BasePermission):
    """User must be editor, admin, or owner."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        role = obj.get_member_role(request.user)
        return role in ["owner", "admin", "editor"]


class IsProjectAdmin(BasePermission):
    """User must be admin or owner."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        role = obj.get_member_role(request.user)
        return role in ["owner", "admin"]


class IsProjectOwner(BasePermission):
    """User must be owner."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        role = obj.get_member_role(request.user)
        return role == "owner"
