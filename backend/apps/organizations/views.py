from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Organization, OrganizationMember, OrganizationInvite
from django.contrib.auth import get_user_model
User = get_user_model()
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
        # # Removed annotate — let serializer call model methods instead
        # return Organization.objects.filter(
        #     members=self.request.user
        # )
        user = self.request.user
        
        # SUPER ADMIN: Can see all organizations on the platform
        if user.is_superuser:
            return Organization.objects.all().order_by('-created_at')
        
        # REGULAR USER: Can only see organizations they belong to
        return Organization.objects.filter(members=user).order_by('-created_at')
    
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

                # RESTRICTION: Check if user already owns an organization
        if Organization.objects.filter(owner=request.user).exists():
            return Response(
                {"error": "You already own an organization. You can only create one."},
                status=status.HTTP_400_BAD_REQUEST
            )
        # If not, proceed with normal creation
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        org = serializer.save()

        # Add the creator as an 'owner' member
        OrganizationMember.objects.create(
            organization=org,
            user=request.user,
            role="owner"
        )
        
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
        email = request.data.get("email")
        role = request.data.get("role", "member")
        
        if not email:
            return Response({"error": "Email is required."}, status=400)
            
        # 1. Check if user is already a member
        existing_user = User.objects.filter(email=email).first()
        if existing_user and org.membership_set.filter(user=existing_user).exists():
            return Response({"error": "User is already a member."}, status=400)
            
        # 2. Check if there's already a pending invite
        if OrganizationInvite.objects.filter(organization=org, email=email, accepted_at__isnull=True).exists():
            return Response({"error": "User has already been invited."}, status=400)
            
        # 3. If user exists but isn't a member, add them directly!
        if existing_user:
            OrganizationMember.objects.create(
                organization=org, user=existing_user, role=role, invited_by=request.user
            )
            return Response({"success": True, "message": "Existing user added to organization."})
            
        # 3. If user doesn't exist, create a pending invite
        # But first, check if we already invited them
        invite, created = OrganizationInvite.objects.get_or_create(
            organization=org, 
            email=email,
            defaults={"role": role, "invited_by": request.user}
        )

        if not created:
            # If the invite already existed, just update the role
            invite.role = role
            invite.save()       
        
        
        # 5. Send the invitation email
        registration_link = f"http://localhost:5173/auth/register?token={invite.token}"
        send_mail(
            subject=f"You're invited to join {org.name} on ProjectFlow",
            message=f"You have been invited to join {org.name}.\n\nPlease click the following link to register your account:\n{registration_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=True,
        )
        
        return Response(
            {
                "success": True, 
                "message": f"Invitation email sent to {email}. They will appear in your team list once they register."
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
