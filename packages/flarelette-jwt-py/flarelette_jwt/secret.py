
import os, base64, json, argparse
def generate_secret(length_bytes: int = 64) -> str:
    raw = os.urandom(length_bytes)
    return base64.urlsafe_b64encode(raw).decode('utf-8').rstrip('=')
def is_valid_base64url_secret(secret: str, min_bytes: int = 64) -> bool:
    try:
        pad = '=' * (-len(secret) % 4)
        raw = base64.urlsafe_b64decode(secret + pad)
        return len(raw) >= min_bytes
    except Exception: return False
def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Generate base64url JWT secret (default 64 bytes)")
    p.add_argument("--len", type=int, default=64); p.add_argument("--json", action="store_true"); p.add_argument("--dotenv", action="store_true")
    a = p.parse_args(argv); s = generate_secret(a.len)
    if a.json:
        from datetime import datetime, timezone
        print(json.dumps({"secret": s, "lengthBytes": a.len, "format":"base64url", "createdAt": datetime.now(timezone.utc).isoformat()}, indent=2))
    elif a.dotenv: print(f"JWT_SECRET={s}")
    else: print(s)
    return 0
if __name__ == "__main__":
    raise SystemExit(main())
