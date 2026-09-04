from rest_framework.permissions import BasePermission


# class IsProjectMember(BasePermission):
#     """User must be a member of the project."""
    
#     def has_permission(self, request, view):
#         return request.user.is_authenticated
    
#     def has_object_permission(self, request, view, obj):
#         return obj.is_member(request.user)


class IsProjectMember(BasePermission):
    """
    Allows access only to users who are members of the project.
    Works for both Project objects and Task objects.
    """
    def has_object_permission(self, request, view, obj):
        # If the object is a Task, check the project it belongs to
        if hasattr(obj, 'project'):
            return obj.project.is_member(request.user)
        
        # If the object is a Project, check directly
        if hasattr(obj, 'is_member'):
            return obj.is_member(request.user)
            
        return False
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
