import logging
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.db.supabase_client import supabase
from app.schemas.user import UserInDB
from app.core.config import settings

# Configurar logger
logger = logging.getLogger(__name__)

security = HTTPBearer()


def decode_jwt_token(token: str) -> dict:
    """
    Decodifica y valida el JWT localmente usando SUPABASE_JWT_SECRET.
    
    Esto evita llamadas HTTP a Supabase en cada request, mejorando:
    - Performance: Reduce latencia (no hay llamada HTTP)
    - Resiliencia: Funciona aunque Supabase Auth esté caído
    - Escalabilidad: Menos carga en servicios externos
    
    Args:
        token: Token JWT a validar
        
    Returns:
        dict: Payload del JWT decodificado (incluye 'sub' que es el user_id)
        
    Raises:
        HTTPException 401: Si el token es inválido, expirado o tiene firma incorrecta
    """
    try:
        # Supabase usa HS256 y el JWT_SECRET para firmar tokens
        # Deshabilitamos verify_aud porque Supabase usa diferentes valores de aud
        # y solo necesitamos validar la firma y expiración
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={
                "verify_exp": True,  # Validar expiración
                "verify_signature": True,  # Validar firma
                "verify_aud": False,  # No validar audience (Supabase usa diferentes valores)
            }
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token JWT expirado")
        # No lanzar error aquí, dejar que el fallback lo maneje
        raise ValueError("Token expirado")
    except jwt.InvalidTokenError as e:
        logger.warning(f"Token JWT inválido (firma o formato): {str(e)}")
        # No lanzar error aquí, dejar que el fallback lo maneje
        raise ValueError(f"Token inválido: {str(e)}")
    except Exception as e:
        logger.error(f"Error inesperado al decodificar JWT: {str(e)}")
        # No lanzar error aquí, dejar que el fallback lo maneje
        raise ValueError(f"Error al validar token: {str(e)}")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserInDB:
    """
    Valida el token JWT y retorna el usuario autenticado como modelo Pydantic.
    
    Flujo:
    1. Lee el JWT del header Authorization: Bearer <token>
    2. Valida el token contra Supabase Auth (auth.get_user(jwt))
    3. Busca el usuario en la tabla 'usuarios' por supabase_uid
    4. Valida que el usuario esté activo
    5. Devuelve el registro de la tabla 'usuarios' como UserInDB
    
    Raises:
        HTTPException 401: Si el token es inválido, expirado o no proporcionado
        HTTPException 403: Si el usuario no existe en la BD o está inactivo
        HTTPException 500: Si hay error al consultar la base de datos
    """
    token = credentials.credentials

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado"
        )

    # Intentar validación local con PyJWT primero (más rápido y resiliente)
    # Si falla, usar fallback a Supabase API
    supabase_uid = None
    
    try:
        jwt_payload = decode_jwt_token(token)
        # 'sub' es el user_id (UUID) en Supabase
        supabase_uid = jwt_payload.get("sub")
        if not supabase_uid:
            logger.warning("Token JWT válido pero falta identificador de usuario (sub)")
            # Continuar al fallback
        else:
            # Validación local exitosa
            logger.debug("Validación local JWT exitosa")
    except ValueError as jwt_error:
        # Si la validación local falla (firma incorrecta, expirado, etc.), usar fallback
        logger.warning(f"Validación local JWT falló: {str(jwt_error)}. Usando fallback a Supabase API")
    except Exception as e:
        # Si hay error inesperado en validación local, usar fallback
        logger.warning(f"Error inesperado en validación local JWT: {str(e)}. Usando fallback a Supabase API")
    
    # Si la validación local falló o no obtuvo supabase_uid, usar fallback a Supabase API
    if not supabase_uid:
        try:
            logger.debug("Usando validación vía Supabase API como fallback")
            response = supabase.auth.get_user(token)
            if not response.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token inválido"
                )
            supabase_uid = response.user.id
            logger.debug(f"Validación vía Supabase API exitosa. supabase_uid: {supabase_uid}")
        except HTTPException:
            raise
        except Exception as api_error:
            logger.error(f"Error al validar token con Supabase API: {str(api_error)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Error al validar token"
            )

    # Buscar en tabla 'usuarios' por supabase_uid
    try:
        db_res = (
            supabase.table("usuarios")
            .select("*")
            .eq("supabase_uid", supabase_uid)
            .single()
            .execute()
        )
    except Exception as e:
        error_str = str(e)
        logger.error(
            f"Error al consultar BD para usuario supabase_uid={supabase_uid}: {error_str}",
            exc_info=True
        )
        
        # Detectar errores específicos de Cloudflare
        if "cloudflare" in error_str.lower() or "500 Internal Server Error" in error_str:
            logger.error(
                "Cloudflare está bloqueando las peticiones a Supabase. "
                "Posibles causas: rate limiting, configuración incorrecta, o problema de red."
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Servicio de base de datos temporalmente no disponible. Por favor, intente más tarde."
            )
        
        # Detectar errores de JSON inválido (respuesta HTML en lugar de JSON)
        if "json" in error_str.lower() and "invalid" in error_str.lower():
            logger.error(
                "Supabase devolvió HTML en lugar de JSON. Posible bloqueo de Cloudflare o problema de red."
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Error de comunicación con la base de datos. Por favor, intente más tarde."
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al consultar la base de datos"
        )

    # Verificar errores de Supabase
    if getattr(db_res, "error", None):
        logger.warning(
            f"Usuario con supabase_uid={supabase_uid} no encontrado en tabla usuarios. "
            f"Error de Supabase: {db_res.error}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario no registrado en tabla 'usuarios'",
        )

    if not db_res.data:
        logger.warning(f"Usuario con supabase_uid={supabase_uid} no existe en BD")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario no encontrado en tabla 'usuarios'",
        )

    # Crear instancia del modelo Pydantic
    try:
        user_data = db_res.data
        user_in_db = UserInDB(**user_data)
    except Exception as e:
        logger.error(
            f"Error al crear modelo UserInDB para supabase_uid={supabase_uid}: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar datos del usuario"
        )
    
    # Validar que el usuario esté activo
    if user_in_db.estado != "activo":
        logger.info(
            f"Intento de acceso de usuario inactivo: id={user_in_db.id}, "
            f"correo={user_in_db.correo}, estado={user_in_db.estado}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo. No se puede acceder al sistema."
        )

    logger.debug(f"Usuario autenticado exitosamente: id={user_in_db.id}, correo={user_in_db.correo}")
    return user_in_db


def require_admin(current_user: UserInDB) -> UserInDB:
    """
    Verifica que el usuario sea administrador (rol_id = 1).
    
    Args:
        current_user: Usuario autenticado
        
    Returns:
        UserInDB: El mismo usuario si es administrador
        
    Raises:
        HTTPException 403: Si el usuario no es administrador
        
    Nota:
        Puede usarse como dependencia: Depends(require_admin)
    """
    if current_user.rol_id != 1:
        logger.warning(
            f"Intento de acceso admin denegado: usuario id={current_user.id}, "
            f"correo={current_user.correo}, rol_id={current_user.rol_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No autorizado: se requiere rol administrador",
        )
    return current_user
