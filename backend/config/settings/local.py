from .base import *  # noqa

DEBUG = True
ALLOWED_HOSTS = ["*"]
CORS_ALLOW_ALL_ORIGINS = True

INSTALLED_APPS += ["django_debug_toolbar"]
MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]

INTERNAL_IPS = ["127.0.0.1", "localhost"]

# Print emails to the terminal console instead of sending them
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
EMAIL_HOST = "localhost"
EMAIL_PORT = 1025
DEFAULT_FROM_EMAIL = "noreply@projectflow.com"

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {
    "anon": "10000/hour",
    "user": "100000/hour",
}
#  Add this block below:
from corsheaders.defaults import default_headers

CORS_ALLOW_HEADERS = list(default_headers) + [
    'x-organization-id',
]
