from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)
    
    @action(detail=False, methods=["get"])
    def unread(self, request):
        notifications = self.get_queryset().filter(is_read=False)[:20]
        serializer = self.get_serializer(notifications, many=True)
        return Response({"success": True, "notifications": serializer.data, "count": notifications.count()})
    
    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"success": True, "message": "All notifications marked as read"})
    
    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({"success": True})
