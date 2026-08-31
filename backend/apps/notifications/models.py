from django.db import models
from django.conf import settings

class Notification(models.Model):
    class Type(models.TextChoices):
        TASK_ASSIGNED = "task_assigned", "Task Assigned"
        TASK_UPDATED = "task_updated", "Task Updated"
        TASK_COMMENTED = "task_commented", "Task Commented"
        MENTION = "mention", "Mention"
        PROJECT_INVITE = "project_invite", "Project Invite"
        ORG_INVITE = "org_invite", "Organization Invite"
    
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=50, choices=Type.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()
    data = models.JSONField(default=dict)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
        ]
    
    def __str__(self):
        return f"{self.notification_type} for {self.recipient}"
