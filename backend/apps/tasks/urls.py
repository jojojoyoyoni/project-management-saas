from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views


# Main task router
router = DefaultRouter()
router.register(r"", views.TaskViewSet, basename="task")


# Nested comment router
comment_router = DefaultRouter()
comment_router.register(
    r"",
    views.TaskCommentViewSet,
    basename="task-comment",
)


urlpatterns = [
    path("", include(router.urls)),
    path(
        "<int:task_pk>/comments/",
        include(comment_router.urls),
    ),
]
