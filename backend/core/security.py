"""
Security helpers: password hashing + JWT signing/decoding.
Kept small and readable - this is the kind of code a student can explain in a viva.
"""

import os
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta


JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 60  # short-lived; refresh-tokens omitted to keep prototype simple


def hash_password(plain: str) -> str:
    """bcrypt hashes are salted automatically -> safe to store."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def _secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str, role: str) -> str:
    """Issue the final, post-MFA access token."""
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, _secret(), algorithm=JWT_ALGORITHM)


def create_challenge_token(user_id: str) -> str:
    """
    Issued AFTER password is verified but BEFORE MFA is verified.
    The frontend uses this on the MFA-entry screen so we know which user the
    6-digit code belongs to.
    """
    payload = {
        "sub": user_id,
        "type": "mfa_challenge",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, _secret(), algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, _secret(), algorithms=[JWT_ALGORITHM])
