from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter

from apps.tasks.views import TaskStatusViewSet
from apps.notifications.views import NotificationViewSet

# Router for Task Statuses (Kanban Columns)
status_router = DefaultRouter()
status_router.register(r'tasks/statuses', TaskStatusViewSet, basename='task-status')

def api_root(request):
    return JsonResponse({
        "name": "ProjectFlow API",
        "version": "1.0.0",
    })

# Try to import docs, but don't fail if missing
try:
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
    HAS_DOCS = True
except ImportError:
    HAS_DOCS = False

urlpatterns = [
    path("", api_root),
    path("admin/", admin.site.urls),
    
    # Auth & Users
    path("api/auth/", include("apps.users.urls")),
    
    # Organizations
    path("api/organizations/", include("apps.organizations.urls")),
    
    # # Projects (Nested under organizations)
    # path("api/organizations/<int:org_id>/projects/", include("apps.projects.urls")),
    
    # CHANGE THIS: Remove <int:org_id> from the projects URL
    path("api/projects/", include("apps.projects.urls")),
    
    # Tasks (Nested under projects)
    path("api/projects/<int:project_id>/tasks/", include("apps.tasks.urls")),
    
    # Custom Status Routes (For creating/fetching Kanban columns)
    path("api/", include(status_router.urls)),
    
    # Health check
    path("api/health/", include("core.urls")),

    # Notifications
    path('api/notifications/', NotificationViewSet.as_view({'get': 'list', 'post': 'mark_all_read'}), name='notifications'),

]

# Only add docs if package is installed
if HAS_DOCS:
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    ]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
