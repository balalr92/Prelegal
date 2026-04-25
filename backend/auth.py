import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from jose import JWTError, jwt
from pydantic import BaseModel, Field

from db import get_conn

router = APIRouter(prefix="/api/auth")

SECRET_KEY = os.getenv("SECRET_KEY", "prelegal-dev-secret-key")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24 * 7  # 1 week


class AuthRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)


def _hash_password(password: str) -> str:
    """Return salt$hash using PBKDF2-HMAC-SHA256."""
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260_000)
    return f"{salt}${h.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    salt, expected = stored.split("$", 1)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260_000)
    return secrets.compare_digest(h.hex(), expected)


def _create_token(user_id: int, email: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict:
    """Decode and verify JWT; raise HTTPException on failure."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/register")
def register(req: AuthRequest):
    email = req.email.lower().strip()
    hashed = _hash_password(req.password)
    conn = get_conn()
    try:
        cursor = conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (email, hashed),
        )
        conn.commit()
        user_id = cursor.lastrowid
    except Exception:
        raise HTTPException(status_code=409, detail="Email already registered")
    finally:
        conn.close()
    return {"token": _create_token(user_id, email), "email": email}


@router.post("/login")
def login(req: AuthRequest):
    email = req.email.lower().strip()
    conn = get_conn()
    row = conn.execute(
        "SELECT id, password_hash FROM users WHERE email = ?",
        (email,),
    ).fetchone()
    conn.close()
    if not row or not _verify_password(req.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"token": _create_token(row["id"], email), "email": email}
