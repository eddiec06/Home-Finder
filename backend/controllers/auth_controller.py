"""
Auth Controller (the 'C' in MVC).
Maps HTTP routes -> AuthService methods. Has NO business logic of its own.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status

from models import LoginRequest, MFAVerifyRequest, RegisterRequest
from core.session_manager import SessionManager
from core.security import decode_token


router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(request: Request):
    return request.app.state.auth_service


def get_current_user(request: Request) -> dict:
    """FastAPI dependency: pulls the Bearer token and looks it up in the Singleton."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = auth_header[7:]
    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Wrong token type")

    user = SessionManager().get_user_by_token(token)
    if not user:
        # JWT is still valid but the server was restarted (in-memory store).
        # Reconstruct a minimal user from the payload so the request can proceed.
        user = {
            "id": payload["sub"],
            "email": payload["email"],
            "role": payload["role"],
            "name": payload.get("email", "").split("@")[0],
        }
        SessionManager().register_session(token, user)
    request.state.token = token
    return user


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user


# ---- routes ----------------------------------------------------------------------
# ---- routes ----------------------------------------------------------------------
@router.post("/register")
async def register(payload: RegisterRequest, service=Depends(get_auth_service)):
    return await service.register(payload.email, payload.password, payload.name)


@router.post("/login")
async def login(payload: LoginRequest, service=Depends(get_auth_service)):
    return await service.login(payload.email, payload.password)


@router.post("/mfa/verify")
async def verify_mfa(payload: MFAVerifyRequest, service=Depends(get_auth_service)):
    return await service.verify_mfa(payload.challenge_token, payload.code)


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, user: dict = Depends(get_current_user)):
    token = request.state.token
    request.app.state.auth_service.logout(token)
    return None
