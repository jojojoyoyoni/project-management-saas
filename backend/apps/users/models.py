from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", _("Admin")
        MANAGER = "manager", _("Manager")
        MEMBER = "member", _("Member")
    
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    bio = models.TextField(blank=True, default="")
    phone = models.CharField(max_length=20, blank=True, default="")
    job_title = models.CharField(max_length=100, blank=True, default="")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    timezone = models.CharField(max_length=50, default="UTC")
    receives_email_notifications = models.BooleanField(default=True)
    receives_push_notifications = models.BooleanField(default=True)
    last_activity_at = models.DateTimeField(auto_now=True)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = "users"
        verbose_name = _("User")
        verbose_name_plural = _("Users")
    
    def __str__(self):
        return self.get_full_name() or self.username
    
    @property
    def is_email_verified(self):
        return self.email_verified_at is not None
    
    def get_initials(self):
        if self.first_name and self.last_name:
            return f"{self.first_name[0]}{self.last_name[0]}".upper()
        return self.username[0].upper() if self.username else "?"
