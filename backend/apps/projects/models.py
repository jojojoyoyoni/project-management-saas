from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Project(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", _("Active")
        ARCHIVED = "archived", _("Archived")
        ON_HOLD = "on_hold", _("On Hold")
    
    class Priority(models.TextChoices):
        LOW = "low", _("Low")
        MEDIUM = "medium", _("Medium")
        HIGH = "high", _("High")
        CRITICAL = "critical", _("Critical")
    
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="projects",
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="ProjectMember",
        related_name="projects",
        blank=True,
    )
    default_assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="default_projects",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_projects",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    key = models.CharField(max_length=10)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "projects"
        verbose_name = _("Project")
        verbose_name_plural = _("Projects")
        unique_together = ["organization", "key"]
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.key} - {self.name}"
    
    def task_count(self):
        try:
            return self.tasks.count()
        except Exception:
            return 0
    
    def member_count(self):
        return self.members.count()
    
    def is_member(self, user):
        return self.members.filter(id=user.id).exists()
    
    def get_member_role(self, user):
        member = self.member_records.filter(user=user).first()  # ← Fixed here
        return member.role if member else None


class ProjectMember(models.Model):
    class Role(models.TextChoices):
        OWNER = "owner", _("Owner")
        ADMIN = "admin", _("Admin")
        EDITOR = "editor", _("Editor")
        VIEWER = "viewer", _("Viewer")
    
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="member_records",  # Must match what we use in get_member_role
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.VIEWER,
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "project_members"
        unique_together = ["project", "user"]
    
    def __str__(self):
        return f"{self.user} - {self.project} ({self.role})"
