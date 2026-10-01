from channels.db import database_sync_to_async

@database_sync_to_async
def get_user_from_token(token):
    # MOVE ALL IMPORTS INSIDE HERE!
    from django.contrib.auth import get_user_model
    from rest_framework_simplejwt.tokens import AccessToken
    from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
    
    User = get_user_model()
    
    try:
        access_token = AccessToken(token)
        user_id = access_token['user_id']
        return User.objects.get(id=user_id)
    except (InvalidToken, TokenError, User.DoesNotExist):
        return None

class TokenAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode("utf-8")
        token = None
        
        for param in query_string.split("&"):
            if param.startswith("token="):
                token = param.split("=", 1)[1]
                break

        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = None

        return await self.inner(scope, receive, send)