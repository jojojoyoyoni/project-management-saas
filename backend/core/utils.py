"""
General utility functions used across the project.
"""
import uuid
from datetime import datetime


def generate_unique_key(model, field, prefix="", length=6):
    """
    Generate a unique random key for a model field.
    
    Example:
        generate_unique_key(Project, "key", prefix="", length=4)
        → "A3F9"
        
        generate_unique_key(Organization, "slug", length=8)
        → "x7k2m9p1"
    
    Why not just use UUID?
    - UUID is too long for human-readable keys (36 chars)
    - We want short keys like "PROJ-123" or "A3F9"
    
    Args:
        model: The Django model class
        field: The field name to check uniqueness against
        prefix: Optional prefix (e.g., "")
        length: Length of random part
    
    Returns:
        A unique string that doesn't exist in the database
    """
    while True:
        # Generate random string from UUID
        key = f"{prefix}{uuid.uuid4().hex[:length].upper()}"
        
        # Check if it already exists
        if not model.objects.filter(**{field: key}).exists():
            return key


def get_client_ip(request):
    """
    Get the real client IP address.
    
    Why not just use request.META.get("REMOTE_ADDR")?
    - Behind a proxy/load balancer, REMOTE_ADDR is the proxy's IP
    - The real IP is in X-Forwarded-For header
    
    X-Forwarded-For format: "real_ip, proxy1_ip, proxy2_ip"
    We want the FIRST one (real_ip).
    """
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def format_datetime(dt: datetime) -> str:
    """Format datetime to ISO 8601 string for API responses."""
    if dt is None:
        return None
    return dt.isoformat()
