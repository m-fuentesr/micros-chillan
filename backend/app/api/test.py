from fastapi import APIRouter
from app.db.supabase_client import supabase
from app.services.cron_service import check_missing_daily_records

router = APIRouter(prefix="/api/test", tags=["Test"])

@router.get("/")
def supabase_test():
    result = supabase.table("roles").select("*").execute()
    return result.data

@router.post("/force-cron/{target}")
async def force_cron_job(target: str):
    """
    Fuerza la ejecución del cron job.
    target puede ser 'chofer' o 'admin'.
    """
    print(f"⚡ Forzando ejecución de cron para: {target}")
    await check_missing_daily_records(target)
    return {"message": f"Cron job ejecutado manualmente para {target}"}