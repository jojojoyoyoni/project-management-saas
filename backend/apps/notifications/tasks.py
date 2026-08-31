from celery import shared_task
from .models import Notification
from .services import NotificationService

@shared_task
def send_notification(recipient_id, notification_type, title, message, data=None):
    NotificationService.create_notification(
        recipient_id=recipient_id,
        notification_type=notification_type,
        title=title,
        message=message,
        data=data or {},
    )

@shared_task
def send_task_assigned_notification(task_id, assignee_id):
    from apps.tasks.models import Task
    task = Task.objects.get(id=task_id)
    NotificationService.create_notification(
        recipient_id=assignee_id,
        notification_type="task_assigned",
        title=f"Task assigned: {task.title}",
        message=f"You have been assigned to {task.key}",
        data={"task_id": task.id, "project_id": task.project_id},
    )
