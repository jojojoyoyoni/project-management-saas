from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Organization, OrganizationMember
from .serializers import (
    OrganizationSerializer,
    CreateOrganizationSerializer,
    OrganizationMemberSerializer,
    InviteMemberSerializer,
)
from .permissions import IsOrganizationAdmin


class OrganizationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    search_fields = ["name", "description"]
    ordering = ["-created_at"]
    
    def get_queryset(self):
        # Removed annotate — let serializer call model methods instead
        return Organization.objects.filter(
            members=self.request.user
        )
    
    def get_serializer_class(self):
        if self.action == "create":
            return CreateOrganizationSerializer
        return OrganizationSerializer
    
    def get_permissions(self):
        if self.action in ["update", "partial_update"]:
            return [IsAuthenticated(), IsOrganizationAdmin()]
        if self.action == "destroy":
            return [IsAuthenticated(), IsOrganizationAdmin()]
        return [IsAuthenticated()]
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        org = serializer.save()
        
        return Response(
            {
                "success": True,
                "message": "Organization created successfully.",
                "organization": OrganizationSerializer(org, context=self.get_serializer_context()).data,
            },
            status=status.HTTP_201_CREATED,
        )
    
    def retrieve(self, request, *args, **kwargs):
        org = self.get_object()
        return Response({
            "success": True,
            "organization": self.get_serializer(org).data,
        })
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        org = self.get_object()
        serializer = CreateOrganizationSerializer(org, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            "success": True,
            "message": "Organization updated.",
            "organization": OrganizationSerializer(org, context=self.get_serializer_context()).data,
        })
    
    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response({"success": True, "message": "Organization deleted."})
    
    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        org = self.get_object()
        members = org.membership_set.select_related("user").all()
        return Response({
            "success": True,
            "members": OrganizationMemberSerializer(members, many=True).data,
        })
    
    @action(detail=True, methods=["post"])
    def invite(self, request, pk=None):
        org = self.get_object()
        serializer = InviteMemberSerializer(
            data=request.data,
            context={"organization": org}
        )
        serializer.is_valid(raise_exception=True)
        
        member = OrganizationMember.objects.create(
            organization=org,
            user=serializer.validated_data["user"],
            role=serializer.validated_data["role"],
            invited_by=request.user,
        )
        
        return Response(
            {
                "success": True,
                "message": f"User invited to {org.name}.",
                "member": OrganizationMemberSerializer(member).data,
            },
            status=status.HTTP_201_CREATED,
        )
    
    @action(detail=True, methods=["post"])
    def leave(self, request, pk=None):
        org = self.get_object()
        
        if org.is_owner(request.user):
            return Response(
                {"success": False, "error": "Owner cannot leave. Transfer ownership first."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        deleted = org.membership_set.filter(user=request.user).delete()
        if deleted[0] == 0:
            return Response(
                {"success": False, "error": "You are not a member."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        return Response({"success": True, "message": f"You have left {org.name}."})
    
    @action(detail=True, methods=["post"])
    def remove_member(self, request, pk=None):
        org = self.get_object()
        user_id = request.data.get("user_id")
        
        if not user_id:
            return Response(
                {"success": False, "error": "user_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if org.owner_id == user_id:
            return Response(
                {"success": False, "error": "Cannot remove the owner."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        deleted = org.membership_set.filter(user_id=user_id).delete()
        if deleted[0] == 0:
            return Response(
                {"success": False, "error": "User is not a member."},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        return Response({"success": True, "message": "Member removed."})
