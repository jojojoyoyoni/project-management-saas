from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "first_name", "last_name", "role", "is_active", "date_joined")
    list_filter = ("role", "is_active")
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("-date_joined",)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Profile", {"fields": ("avatar", "bio", "phone", "job_title", "role")}),
        ("Preferences", {"fields": ("timezone", "receives_email_notifications", "receives_push_notifications")}),
        ("Verification", {"fields": ("email_verified_at", "last_activity_at")}),
    )
