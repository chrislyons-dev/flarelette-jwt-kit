
from __future__ import annotations
from typing import Any, Callable
from .sign import sign
from .verify import verify
async def create_token(claims: dict, *, iss: str | None = None, aud: str | None = None, ttl_seconds: int | None = None) -> str:
    return await sign(claims, iss=iss, aud=aud, ttl_seconds=ttl_seconds)
async def check_auth(token: str, *, iss: str | None = None, aud: str | None = None, leeway: int | None = None,
    require_all_permissions: list[str] | None = None, require_any_permission: list[str] | None = None,
    require_roles_all: list[str] | None = None, require_roles_any: list[str] | None = None,
    predicates: list[Callable[[dict], bool]] | None = None) -> dict | None:
    payload = await verify(token, iss=iss, aud=aud, leeway=leeway)
    if not payload: return None
    perms = payload.get("permissions") or []; roles = payload.get("roles") or []
    if require_all_permissions and not set(require_all_permissions).issubset(perms): return None
    if require_any_permission and not set(require_any_permission).intersection(perms): return None
    if require_roles_all and not set(require_roles_all).issubset(roles): return None
    if require_roles_any and not set(require_roles_any).intersection(roles): return None
    if predicates:
        for fn in predicates:
            if not fn(payload): return None
    return {"sub": payload.get("sub"), "permissions": perms, "roles": roles, "payload": payload}
def policy():
    opts: dict[str, Any] = {}
    class B:
        def base(self, **b): opts.update(b); return self
        def need_all(self, *p): opts.setdefault("require_all_permissions",[]); opts["require_all_permissions"].extend(p); return self
        def need_any(self, *p): opts.setdefault("require_any_permission",[]); opts["require_any_permission"].extend(p); return self
        def roles_all(self, *r): opts.setdefault("require_roles_all",[]); opts["require_roles_all"].extend(r); return self
        def roles_any(self, *r): opts.setdefault("require_roles_any",[]); opts["require_roles_any"].extend(r); return self
        def where(self, fn): opts.setdefault("predicates",[]); opts["predicates"].append(fn); return self
        def build(self): return opts
    return B()
