# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from .views import TaskCommentViewSet, TaskViewSet


# router = DefaultRouter()
# router.register(r"tasks", TaskViewSet, basename="task")

# # Nested comment router (nested under task)
# comment_router = DefaultRouter()
# comment_router.register(r"", TaskCommentViewSet, basename="task-comment")

# urlpatterns = [
#     path("", include(router.urls)),
#     path("tasks/<int:task_pk>/comments/", include(comment_router.urls)),
# ]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# The prefix MUST be empty "" because this file is already included under /tasks/
router = DefaultRouter()
router.register(r"", views.TaskViewSet, basename="task")

# Nested comment router (nested under task)
comment_router = DefaultRouter()
comment_router.register(r"", views.TaskCommentViewSet, basename="task-comment")

urlpatterns = [
    path("", include(router.urls)),
    path("<int:task_pk>/comments/", include(comment_router.urls)),
]
