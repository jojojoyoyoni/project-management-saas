"""
URL configuration for organizations app.

Router auto-generates these URLs from the ViewSet:
    GET    /api/organizations/              → list
    POST   /api/organizations/              → create
    GET    /api/organizations/<id>/         → retrieve
    PUT    /api/organizations/<id>/         → update
    PATCH  /api/organizations/<id>/         → partial_update
    DELETE /api/organizations/<id>/         → destroy
    
Custom actions get these URLs:
    GET    /api/organizations/<id>/members/      → members()
    POST   /api/organizations/<id>/invite/       → invite()
    POST   /api/organizations/<id>/leave/       → leave()
    POST   /api/organizations/<id>/remove_member/ → remove_member()
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register ViewSet
router = DefaultRouter()
router.register(r"", views.OrganizationViewSet, basename="organization")

# Include router URLs
urlpatterns = [
    path("", include(router.urls)),
]
