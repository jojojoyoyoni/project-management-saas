from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Organization(models.Model):
    """
    Organization model for multi-tenancy.
    
    Multi-tenancy means: One codebase serves multiple organizations,
    each with their own isolated data.
    
    Example:
        Organization A (Acme Corp) → has projects X, Y, Z
        Organization B (Beta Inc)  → has projects P, Q, R
        
        Users in Org A CANNOT see Org B's data.
    """
    
    class Plan(models.TextChoices):
        FREE = "free", _("Free")
        PRO = "pro", _("Pro")
        ENTERPRISE = "enterprise", _("Enterprise")
    
    # Basic info
    name = models.CharField(max_length=255, verbose_name=_("Name"))
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True, default="")
    logo = models.ImageField(
        upload_to="organization_logos/",
        blank=True,
        null=True,
    )
    
    # Plan & limits
    plan = models.CharField(
        max_length=20,
        choices=Plan.choices,
        default=Plan.FREE,
    )
    max_members = models.PositiveIntegerField(default=10)
    max_projects = models.PositiveIntegerField(default=5)
    
    # Owner
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="owned_organizations",
    )
    
    # Members - THIS IS WHERE THE FIX IS
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="OrganizationMember",           # Use this model as the join table
        through_fields=["organization", "user"], # ← FIX: Tell Django which FKs to use
        related_name="organizations",
        blank=True,
    )
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "organizations"
        verbose_name = _("Organization")
        verbose_name_plural = _("Organizations")
        ordering = ["-created_at"]
    
    def __str__(self):
        return self.name
    
    def member_count(self):
        return self.members.count()
    
    def project_count(self):
        return self.projects.count()
    
    def is_owner(self, user):
        return self.owner_id == user.id
    
    def is_member(self, user):
        return self.members.filter(id=user.id).exists()
    
    def get_member_role(self, user):
        membership = self.membership_set.filter(user=user).first()
        return membership.role if membership else None


class OrganizationMember(models.Model):
    """
    Through model for organization membership.
    
    A "through model" adds extra data to a ManyToMany relationship.
    
    Without through model:
        Organization.members = [User1, User2, User3]
        (Just a list of users - no extra info)
    
    With through model:
        OrganizationMember = [
            {user: User1, role: "owner", joined_at: ...},
            {user: User2, role: "admin", joined_at: ...},
            {user: User3, role: "member", joined_at: ...},
        ]
        (Each relationship has extra data!)
    """
    
    class Role(models.TextChoices):
        OWNER = "owner", _("Owner")
        ADMIN = "admin", _("Admin")
        MEMBER = "member", _("Member")
        GUEST = "guest", _("Guest")
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MEMBER,
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="invited_memberships",
    )
    
    class Meta:
        db_table = "organization_members"
        unique_together = ["organization", "user"]
        verbose_name = _("Organization Member")
        verbose_name_plural = _("Organization Members")
    
    def __str__(self):
        return f"{self.user} in {self.organization} as {self.role}"
