from .base import *  # noqa

DEBUG = True
ALLOWED_HOSTS = ["*"]
CORS_ALLOW_ALL_ORIGINS = True

INSTALLED_APPS += ["django_debug_toolbar"]
MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]

INTERNAL_IPS = ["127.0.0.1", "localhost"]

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {
    "anon": "10000/hour",
    "user": "100000/hour",
}
