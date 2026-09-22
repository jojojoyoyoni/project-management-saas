from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class Notification(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="notifications"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name="performed_notifications"
    )
    task = models.ForeignKey(
        "tasks.Task", 
        on_delete=models.CASCADE, 
        related_name="notifications",
        null=True, blank=True
    )
    project = models.ForeignKey("projects.Project", on_delete=models.CASCADE, related_name="notifications", null=True, blank=True)
    
    verb = models.CharField(max_length=255) # e.g., "assigned you to"
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.actor} {self.verb} -> {self.recipient}"