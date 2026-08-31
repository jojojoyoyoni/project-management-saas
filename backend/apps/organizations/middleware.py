from django.conf import settings

class OrganizationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        org_id = request.headers.get("X-Organization-Id")
        if org_id:
            request.organization_id = org_id
        else:
            request.organization_id = None
        return self.get_response(request)
