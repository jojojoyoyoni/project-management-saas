
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from apps.notifications.models import Notification
from apps.tasks.models import Task
from apps.projects.models import Project
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
        
        # Super Admins can see all orgs (even archived ones if they want, 
       
        if user.is_superuser:
            return Organization.objects.filter(is_active=True).order_by('-created_at')
        
        # Regular users only see active orgs they are members of
        return Organization.objects.filter(members=user, is_active=True).order_by('-created_at')
    
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
        if Organization.objects.filter(owner=request.user).exists():
            return Response(
                {"error": "You already own an organization. You can only create one."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # FIX: Don't pass owner=request.user here, the serializer handles it!
        org = serializer.save() 

        OrganizationMember.objects.get_or_create(
            organization=org,
            user=request.user,
            defaults={"role": "owner"}
        )
        
        # Notify all Super Admins that a new org was created
        super_admins = User.objects.filter(is_superuser=True).exclude(id=request.user.id)
        admin_notifications = [
            Notification(recipient=admin, actor=request.user, verb=f"created a new organization: {org.name}")
            for admin in super_admins
        ]
        Notification.objects.bulk_create(admin_notifications)
        
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

        # NOTIFICATION: Notify Org Admins/Members that the org details were updated
        members = org.members.exclude(id=request.user.id).exclude(is_superuser=True)
        notifications = [
            Notification(recipient=member, actor=request.user, verb=f"updated the organization details for: {org.name}")
            for member in members
        ]
        Notification.objects.bulk_create(notifications)
        
        return Response({
            "success": True,
            "message": "Organization updated.",
            "organization": OrganizationSerializer(org, context=self.get_serializer_context()).data,
        })
    
    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        org = self.get_object()
        org_name = org.name
        
        # SOFT DELETE: Archive instead of permanent deletion
        org.is_active = False
        org.save()
        
        # NOTIFICATION: Notify all members that the org is archived
        members = org.members.exclude(id=request.user.id)
        notifications = [
            Notification(recipient=member, actor=request.user, verb=f"archived the organization: {org_name}")
            for member in members
        ]
        Notification.objects.bulk_create(notifications)
        
        return Response({"success": True, "message": "Organization archived successfully."})
    
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


    @action(detail=True, methods=["get"])
    def dashboard(self, request, pk=None):
        org = self.get_object()
        
        # 1. Get all active projects for this org
        projects = Project.objects.filter(organization=org, status="active")
        total_projects = projects.count()
        
        # 2. Aggregate all tasks across all projects in the org
        all_tasks = Task.objects.filter(project__in=projects)
        total_tasks = all_tasks.count()
        done_tasks = all_tasks.filter(status__slug="done").count()
        
        overall_completion = (done_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        overdue_tasks = all_tasks.filter(
            due_date__lt=timezone.now().date()
        ).exclude(status__slug="done").count()
        
        # --- NEW: CHART DATA ---
        
        # 3. Pie Chart: Task distribution by Status
        status_data = all_tasks.values(
            'status__name', 'status__color'
        ).annotate(count=Count('id'))
        
        # 4. Line Chart: Task completion trend (Last 7 days)
        seven_days_ago = timezone.now().date() - timezone.timedelta(days=7)
        trend_data = all_tasks.filter(
            status__slug="done", 
            completed_at__isnull=False,
            completed_at__date__gte=seven_days_ago
        ).annotate(
            date=TruncDate('completed_at')
        ).values('date').annotate(count=Count('id')).order_by('date')
        
        # 5. Get per-project breakdown for the table
        project_breakdown = []
        for p in projects:
            p_total = p.tasks.count()
            p_done = p.tasks.filter(status__slug="done").count()
            p_progress = (p_done / p_total * 100) if p_total > 0 else 0
            
            project_breakdown.append({
                "id": p.id,
                "name": p.name,
                "key": p.key,
                "total_tasks": p_total,
                "completion_rate": round(p_progress, 2)
            })
        
        return Response({
            "success": True,
            "stats": {
                "total_projects": total_projects,
                "total_tasks": total_tasks,
                "overall_completion": round(overall_completion, 2),
                "overdue_tasks": overdue_tasks,
            },
            "task_by_status": list(status_data),
            "completion_trend": list(trend_data),
            "projects": project_breakdown
        })