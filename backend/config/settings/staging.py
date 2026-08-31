from .base import *  # noqa

DEBUG = False
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "").split(",")

SECURE_SSL_REDIRECT = False
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
