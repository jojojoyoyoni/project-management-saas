from rest_framework.permissions import BasePermission


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

class IsProjectMember(BasePermission):
    """
    Allows access only to users who are members of the project.
    Also allows Organization Owners and Admins.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any authenticated user,
        # we do the strict check in has_object_permission or in the view's get_queryset
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # Super Admins can do anything
        if request.user.is_superuser:
            return True
            
        # If obj is a Task, check the project it belongs to
        if hasattr(obj, 'project'):
            project = obj.project
        elif hasattr(obj, 'is_member'): # It's a Project object
            project = obj
        else:
            return False

        # 1. Is the user a direct member of the project?
        if project.is_member(request.user):
            return True

        # 2. Is the user an Owner or Admin of the organization that owns the project?
        org = project.organization
        if org and (org.is_owner(request.user) or org.get_member_role(request.user) == "admin"):
            return True
            
        return False