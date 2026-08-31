from django.urls import path
from django.http import JsonResponse


def health_check(request):
    """
    Health check endpoint.
    
    Used by:
    - Load balancers: "Is this server healthy? Route traffic to it."
    - Monitoring: "Alert if unhealthy"
    - CI/CD: "Did deployment succeed? Check /api/health/"
    """
    from django.db import connection
    from django.core.cache import cache
    
    # Test database connection
    db_ok = False
    try:
        connection.ensure_connection()
        db_ok = True
    except Exception:
        pass
    
    # Test cache connection
    cache_ok = False
    try:
        cache.set("_health_check", "ok", 10)
        cache_ok = cache.get("_health_check") == "ok"
    except Exception:
        pass
    
    # Determine overall status
    status_code = 200 if (db_ok and cache_ok) else 503
    
    return JsonResponse(
        {
            "status": "healthy" if status_code == 200 else "degraded",
            "database": "ok" if db_ok else "error",
            "cache": "ok" if cache_ok else "error",
            "version": "1.0.0",
        },
        status=status_code,
    )


urlpatterns = [
    path("", health_check, name="health-check"),
]
