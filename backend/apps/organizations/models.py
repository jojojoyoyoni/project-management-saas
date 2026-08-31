from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Organization(models.Model):
    class Plan(models.TextChoices):
        FREE = "free", _("Free")
        PRO = "pro", _("Pro")
        ENTERPRISE = "enterprise", _("Enterprise")
    
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True, default="")
    logo = models.ImageField(upload_to="organization_logos/", blank=True, null=True)
    plan = models.CharField(max_length=20, choices=Plan.choices, default=Plan.FREE)
    max_members = models.PositiveIntegerField(default=10)
    max_projects = models.PositiveIntegerField(default=5)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="owned_organizations",
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="OrganizationMember",
        through_fields=["organization", "user"],
        related_name="organizations",
        blank=True,
    )
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
        try:
            return self.projects.count()
        except Exception:
            return 0
    
    def is_owner(self, user):
        return self.owner_id == user.id
    
    def is_member(self, user):
        return self.members.filter(id=user.id).exists()
    
    def get_member_role(self, user):
        member = self.membership_set.filter(user=user).first()  # ← This now works
        return member.role if member else None


class OrganizationMember(models.Model):
    class Role(models.TextChoices):
        OWNER = "owner", _("Owner")
        ADMIN = "admin", _("Admin")
        MEMBER = "member", _("Member")
        GUEST = "guest", _("Guest")
    
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="membership_set",  # ← ADD THIS
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
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
    
    def __str__(self):
        return f"{self.user} in {self.organization} as {self.role}"
