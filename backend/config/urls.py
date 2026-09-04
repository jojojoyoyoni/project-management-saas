from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

# Try to import docs, but don't fail if missing
try:
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
    HAS_DOCS = True
except ImportError:
    HAS_DOCS = False


def api_root(request):
    return JsonResponse({
        "name": "ProjectFlow API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health/",
            "auth": {
                "login": "/api/auth/login/",
                "register": "/api/auth/register/",
                "me": "/api/auth/me/",
                "users": "/api/auth/users/",
            },
            "organizations": "/api/organizations/",
            "projects": "/api/organizations/<org_id>/projects/",
            "tasks": "/api/projects/<project_id>/tasks/",
            "admin": "/admin/",
        }
    })


urlpatterns = [
    path("", api_root),
    path("admin/", admin.site.urls),
]

# Only add docs if package is installed
if HAS_DOCS:
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    ]

urlpatterns += [
    path("api/auth/", include("apps.users.urls")),
    path("api/organizations/", include("apps.organizations.urls")),
    path("api/organizations/<int:org_id>/projects/", include("apps.projects.urls")),
    path("api/projects/<int:project_id>/tasks/", include("apps.tasks.urls")),
    path("api/health/", include("core.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
