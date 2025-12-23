from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Configuración de la aplicación usando pydantic-settings.
    
    Valida automáticamente que todas las variables de entorno existan
    y tengan los tipos correctos al iniciar la aplicación.
    
    Variables requeridas:
    - SUPABASE_URL: URL de tu proyecto Supabase
    - SUPABASE_ANON_KEY: Clave pública (anon) de Supabase
    - SUPABASE_SERVICE_KEY: Clave de servicio (service_role) de Supabase
    - SUPABASE_JWT_SECRET: Secreto JWT para validación local de tokens
      Obtener desde: Dashboard de Supabase → Settings → API → JWT Secret
    - POSTGRES_URL: URL de conexión a PostgreSQL
    - FRONTEND_URL: URL base del frontend (ej: http://localhost:4200 para dev, https://tu-dominio.com para prod)
    """
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_JWT_SECRET: str
    POSTGRES_URL: str
    FRONTEND_URL: str
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Instancia global de configuración
# Falla al iniciar si faltan variables de entorno requeridas
settings = Settings()
