from .models import Notification

class NotificationService:
    @staticmethod
    def create_notification(recipient_id, notification_type, title, message, data=None):
        return Notification.objects.create(
            recipient_id=recipient_id,
            notification_type=notification_type,
            title=title,
            message=message,
            data=data or {},
        )
    
    @staticmethod
    def get_unread_count(user):
        return Notification.objects.filter(recipient=user, is_read=False).count()
