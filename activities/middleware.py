from urllib.parse import parse_qs
from django.conf import settings
from django.contrib.auth.models import AnonymousUser, User
from channels.db import database_sync_to_async
from rest_framework_simplejwt.backends import TokenBackend


class TokenAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    def __call__(self, scope):
        return TokenAuthMiddlewareInstance(scope, self.inner)


class TokenAuthMiddlewareInstance:
    def __init__(self, scope, inner):
        self.scope = dict(scope)
        self.inner = inner

    async def __call__(self, receive, send):
        # default to anonymous
        self.scope['user'] = AnonymousUser()

        query_string = self.scope.get('query_string', b'').decode()
        qs = parse_qs(query_string)
        token_list = qs.get('token') or qs.get('access_token')

        if token_list:
            token = token_list[0]
            try:
                # validate token using SimpleJWT TokenBackend
                token_backend = TokenBackend(
                    algorithm=settings.SIMPLE_JWT.get('ALGORITHM', 'HS256'),
                    signing_key=settings.SIMPLE_JWT.get('SIGNING_KEY', None) or settings.SECRET_KEY,
                )
                validated = token_backend.decode(token, verify=True)
                user_id = validated.get('user_id')
                if user_id:
                    user = await database_sync_to_async(User.objects.get)(pk=user_id)
                    self.scope['user'] = user
            except Exception:
                self.scope['user'] = AnonymousUser()

        inner = self.inner(self.scope)
        return await inner(receive, send)


def TokenAuthMiddlewareStack(inner):
    return TokenAuthMiddleware(inner)
