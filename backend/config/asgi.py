
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from apps.notifications.routing import websocket_urlpatterns
from apps.notifications.middleware import TokenAuthMiddleware # IMPORT THIS


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
        "websocket": TokenAuthMiddleware( # USE THIS instead of AuthMiddlewareStack
        URLRouter(websocket_urlpatterns)
    ),
})
