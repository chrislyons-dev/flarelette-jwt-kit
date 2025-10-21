
from __future__ import annotations
import time
from typing import Any, Callable
from .sign import sign
from .verify import verify

async def create_token(claims: dict, *, secret: str, iss: str, aud: str, ttl_seconds: int = 900, jti_factory: Callable[[], str] | None = None) -> str:
    now = int(time.time())
    body = dict(claims)
    body.setdefault('iss', iss)
    body.setdefault('aud', aud)
    body.setdefault('iat', now)
    body.setdefault('exp', now + int(ttl_seconds))
    if jti_factory and 'jti' not in body:
        body['jti'] = jti_factory()
    return await sign(body, secret=secret, iss=iss, aud=aud, ttl_seconds=body['exp'] - now)

async def check_auth(
    token: str, *, secret: str, iss: str, aud: str, leeway: int = 90,
    require_all_permissions: list[str] | None = None,
    require_any_permission: list[str] | None = None,
    require_roles_all: list[str] | None = None,
    require_roles_any: list[str] | None = None,
    predicates: list[Callable[[dict], bool]] | None = None,
) -> dict | None:
    payload = await verify(token, secret=secret, iss=iss, aud=aud, leeway=leeway)
    if not payload:
        return None
    perms = payload.get('permissions') or []
    roles = payload.get('roles') or []
    if require_all_permissions and not set(require_all_permissions).issubset(perms):
        return None
    if require_any_permission and not set(require_any_permission).intersection(perms):
        return None
    if require_roles_all and not set(require_roles_all).issubset(roles):
        return None
    if require_roles_any and not set(require_roles_any).intersection(roles):
        return None
    if predicates:
        for fn in predicates:
            if not fn(payload):
                return None
    return {
        'sub': payload.get('sub'),
        'permissions': perms,
        'roles': roles,
        'jti': payload.get('jti'),
        'cid': payload.get('cid'),
        'rid': payload.get('rid'),
        'tid': payload.get('tid'),
        'payload': payload,
    }

def policy():
    opts: dict[str, Any] = {}
    class Builder:
        def base(self, *, secret: str, iss: str, aud: str, leeway: int | None = None):
            opts.update({'secret': secret, 'iss': iss, 'aud': aud})
            if leeway is not None: opts['leeway'] = leeway
            return self
        def need_all(self, *perms: str):
            opts.setdefault('require_all_permissions', []); opts['require_all_permissions'].extend(perms); return self
        def need_any(self, *perms: str):
            opts.setdefault('require_any_permission', []); opts['require_any_permission'].extend(perms); return self
        def roles_all(self, *roles: str):
            opts.setdefault('require_roles_all', []); opts['require_roles_all'].extend(roles); return self
        def roles_any(self, *roles: str):
            opts.setdefault('require_roles_any', []); opts['require_roles_any'].extend(roles); return self
        def where(self, fn):
            opts.setdefault('predicates', []); opts['predicates'].append(fn); return self
        def build(self): return opts
    return Builder()

async def mint_access_token(subject: str, permissions: list[str] | None = None, roles: list[str] | None = None, meta: dict | None = None, *, secret: str, iss: str, aud: str, ttl_seconds: int = 900):
    return await create_token({
        'sub': subject,
        'permissions': permissions or [],
        'roles': roles or [],
        **(meta or {})
    }, secret=secret, iss=iss, aud=aud, ttl_seconds=ttl_seconds)
