"""
Custom permissions for organization access control.

Permission Flow:
═══════════════
Request comes in
       │
       ▼
has_permission()  → "Can this user access ANY organization endpoint?"
       │
       ▼
has_object_permission() → "Can this user access THIS SPECIFIC organization?"
       │
       ▼
View runs (if both pass)
"""
from rest_framework.permissions import BasePermission


class IsOrganizationMember(BasePermission):
    """
    Only organization members can access.
    
    Use for: Viewing organization, viewing projects
    """
    def has_permission(self, request, view):
        # Must be logged in
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # obj = Organization instance
        # Check if user is a member
        return obj.is_member(request.user)


class IsOrganizationAdmin(BasePermission):
    """
    Only admins and owners can access.
    
    Use for: Updating org, managing members, deleting projects
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if obj.is_owner(request.user):
            return True
        
        role = obj.get_member_role(request.user)
        return role in ["owner", "admin"]


class IsOrganizationOwner(BasePermission):
    """
    Only the owner can access.
    
    Use for: Deleting organization, transferring ownership
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        return obj.is_owner(request.user)
