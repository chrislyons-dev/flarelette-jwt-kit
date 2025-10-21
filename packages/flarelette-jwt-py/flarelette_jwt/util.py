
import base64, json, time

def parse(token: str) -> dict:
    hb, pb, *_ = token.split('.')
    def dec(s: str):
        s = s + '=' * (-len(s) % 4)
        return json.loads(base64.urlsafe_b64decode(s.encode('utf-8')))
    return {'header': dec(hb), 'payload': dec(pb)}

def is_expiring_soon(payload: dict, seconds: int) -> bool:
    now = int(time.time())
    return (int(payload.get('exp', 0)) - now) <= int(seconds)

def map_scopes_to_permissions(scopes: list[str]) -> list[str]:
    return scopes
