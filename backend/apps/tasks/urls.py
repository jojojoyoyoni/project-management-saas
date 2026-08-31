from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"", views.TaskViewSet, basename="task")

comment_router = DefaultRouter()
comment_router.register(r"", views.TaskCommentViewSet, basename="task-comment")

attachment_router = DefaultRouter()
attachment_router.register(r"", views.TaskAttachmentViewSet, basename="task-attachment")

urlpatterns = [
    path("", include(router.urls)),
    path("<int:task_pk>/comments/", include(comment_router.urls)),
    path("<int:task_pk>/attachments/", include(attachment_router.urls)),
]
