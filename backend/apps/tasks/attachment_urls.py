from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"", views.TaskAttachmentViewSet, basename="task-attachment")

urlpatterns = [
    path("", include(router.urls),
]
