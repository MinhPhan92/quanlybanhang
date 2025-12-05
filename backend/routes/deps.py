from functools import wraps
from typing import Dict, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError, ExpiredSignatureError

from backend.database import get_db
from sqlalchemy.orm import Session
from backend.routes.auth import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is missing")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return payload


async def get_current_user_optional(
    request: Request
) -> Optional[Dict]:
    """
    Optional authentication dependency.
    Returns user dict if token is valid, None if no token or invalid token.
    Allows public access to routes while still identifying logged-in users.
    """
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header.split(" ", 1)[1]
        if not token:
            return None
        
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except (ExpiredSignatureError, JWTError):
            # Token is invalid or expired, but we don't raise error for optional auth
            return None
    except Exception:
        # Any other error, return None (public access)
        return None


def jwt_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        request: Optional[Request] = kwargs.get("request")
        if request is None:
            for a in args:
                if isinstance(a, Request):
                    request = a
                    break
        if request is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Request object required")

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing")

        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        except ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        request.state.current_user = payload
        return func(*args, **kwargs)

    return wrapper
