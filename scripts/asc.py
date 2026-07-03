#!/usr/bin/env python3
"""App Store Connect API helper — mint an ES256 JWT and make authenticated calls.

Reads the API key from .secrets/ (gitignored); no secret values live in this file.

Usage:
  scripts/asc.py token                          # print a fresh 19-min JWT
  scripts/asc.py get  /v1/apps/6785406082
  scripts/asc.py patch /v1/appInfoLocalizations/<id> '{"data":{...}}'
  scripts/asc.py post  /v1/appStoreReviewDetails '{"data":{...}}'
  scripts/asc.py delete /v1/appScreenshots/<id>

Payloads are JSON:API documents (https://developer.apple.com/documentation/appstoreconnectapi).
"""
import json, sys, time, base64, pathlib, urllib.request

REPO = pathlib.Path(__file__).resolve().parent.parent
KEY_PATH = REPO / ".secrets/appstore/AuthKey_7DMZ2M2W46.p8"
KID = "7DMZ2M2W46"
ISS = "80b00a67-32ac-4bc0-a791-2acad274762e"
API = "https://api.appstoreconnect.apple.com"


def _b64url(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def mint_token() -> str:
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature

    now = int(time.time())
    header = _b64url(json.dumps({"alg": "ES256", "kid": KID, "typ": "JWT"}).encode())
    payload = _b64url(json.dumps(
        {"iss": ISS, "iat": now, "exp": now + 1140, "aud": "appstoreconnect-v1"}).encode())
    signing_input = f"{header}.{payload}".encode()
    key = serialization.load_pem_private_key(KEY_PATH.read_bytes(), password=None)
    r, s = decode_dss_signature(key.sign(signing_input, ec.ECDSA(hashes.SHA256())))
    return f"{header}.{payload}.{_b64url(r.to_bytes(32, 'big') + s.to_bytes(32, 'big'))}"


def request(method: str, path: str, body=None):
    url = path if path.startswith("http") else API + path
    req = urllib.request.Request(url, method=method.upper())
    req.add_header("Authorization", f"Bearer {mint_token()}")
    data = None
    if body is not None:
        req.add_header("Content-Type", "application/json")
        data = body.encode() if isinstance(body, str) else json.dumps(body).encode()
    try:
        with urllib.request.urlopen(req, data) as resp:
            return resp.status, json.loads(resp.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    cmd = sys.argv[1].lower()
    if cmd == "token":
        print(mint_token())
        return
    if cmd not in ("get", "post", "patch", "delete"):
        print(f"unknown command: {cmd}")
        sys.exit(1)
    body = sys.argv[3] if len(sys.argv) > 3 else None
    status, doc = request(cmd, sys.argv[2], body)
    print(f"HTTP {status}", file=sys.stderr)
    print(json.dumps(doc, indent=2))
    if status >= 400:
        sys.exit(1)


if __name__ == "__main__":
    main()
