from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        # Only get notifications for the current user
        queryset = Notification.objects.filter(recipient=request.user)[:15]
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        
        return Response({
            "results": NotificationSerializer(queryset, many=True).data,
            "unread_count": unread_count
        })

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"success": True})