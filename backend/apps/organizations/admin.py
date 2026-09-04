from django.contrib import admin
from .models import Organization, OrganizationMember

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'created_at')

@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'organization', 'role')
