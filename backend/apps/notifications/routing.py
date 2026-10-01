from django.urls import path
from . import consumers

websocket_urlpatterns = [
    # Route for project-specific real-time board updates
    path('ws/notifications/<str:project_id>/', consumers.NotificationConsumer.as_asgi()),
    # Route for general user notifications (fallback)
    path('ws/notifications/', consumers.NotificationConsumer.as_asgi()),
]