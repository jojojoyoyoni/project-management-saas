from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def api_root(request):
    return JsonResponse({
        "name": "ProjectFlow API",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/api/docs/",
            "schema": "/api/schema/",
            "health": "/api/health/",
            "auth": {
                "login": "/api/auth/login/",
                "register": "/api/auth/register/",
                "me": "/api/auth/me/",
                "users": "/api/auth/users/",
            },
            "organizations": "/api/organizations/",
            "projects": "/api/organizations/<org_id>/projects/",
            "admin": "/admin/",
        }
    })


urlpatterns = [
    path("", api_root),
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/auth/", include("apps.users.urls")),
    path("api/organizations/", include("apps.organizations.urls")),
    path("api/organizations/<int:org_id>/projects/", include("apps.projects.urls")),
    path("api/health/", include("core.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
