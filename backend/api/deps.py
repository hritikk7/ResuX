"""Auth dependency: verify the Supabase access token, extract the user id.

Stateless by design (PRD V2, Authentication) — this never refreshes a token and
never sees a refresh token. It only verifies the short-lived access token the
frontend sends as `Authorization: Bearer <token>`.

The project signs tokens with asymmetric JWT signing keys (ES256), so
verification uses the public keys from Supabase's JWKS endpoint rather than a
shared secret. There is no HS256 secret involved.
"""

import asyncio
import logging
import os

import jwt
from dotenv import load_dotenv
from fastapi import Header, HTTPException

load_dotenv()

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_PROJECT_URL", "").rstrip("/")
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
ISSUER = f"{SUPABASE_URL}/auth/v1"
ALGORITHMS = ["ES256"]

# Caches the fetched key set, so only the first request after a restart (and one
# per lifespan thereafter) pays for the network round trip. Key rotation is
# picked up automatically when the cache expires.
_jwks_client = jwt.PyJWKClient(JWKS_URL, cache_jwk_set=True, lifespan=600)


def _verify(token: str) -> dict:
    """Blocking: resolve the signing key by `kid`, then verify the token."""
    signing_key = _jwks_client.get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=ALGORITHMS,
        # Supabase tokens carry aud="authenticated". PyJWT rejects a token that
        # has an `aud` claim when the caller didn't say which audience to expect,
        # so omitting this would fail every valid token.
        audience="authenticated",
        issuer=ISSUER,
    )


async def get_current_user(authorization: str = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token header")
    token = authorization.split(" ", 1)[1]

    try:
        # The JWKS fetch is a blocking HTTP call, so keep it off the event loop.
        payload = await asyncio.to_thread(_verify, token)
    except jwt.ExpiredSignatureError:
        # Normal at the expiry boundary — the frontend's Supabase client refreshes
        # and retries. The backend never attempts recovery itself.
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        # Log the real reason; the client still gets an opaque 401.
        logger.warning("JWT rejected: %s: %s", type(e).__name__, e)
        raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWKClientError as e:
        # Couldn't reach or parse the key set — our problem, not a bad token.
        logger.error("JWKS unavailable at %s: %s", JWKS_URL, e)
        raise HTTPException(status_code=503, detail="Auth verification unavailable")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID missing from token")
    return user_id
