from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.db.supabase import supabase

# auto_error=False para poder devolver nuestro propio 401 con mensaje claro
# en vez del 403 genérico que tira HTTPBearer cuando falta el header.
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falta el header Authorization: Bearer <token>",
        )

    try:
        user = supabase.auth.get_user(credentials.credentials).user
    except Exception as e:
        print(f"AUTH FAILED: {e}")
        user = None

    if user is None or not user.id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )

    return user.id
