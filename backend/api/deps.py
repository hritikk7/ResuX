from fastapi import Depends, HTTPException, Header
import jwt
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()


async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token header")
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(
            token, os.getenv("SUPABASE_JWT_SECRET"), algorithms=["HS256"]
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID missing from token")
        return user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

