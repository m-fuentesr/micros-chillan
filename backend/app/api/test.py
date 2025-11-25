from fastapi import APIRouter
from app.db.supabase_client import supabase

router = APIRouter(prefix="/api/test", tags=["Test"])

@router.get("/")
def supabase_test():
    result = supabase.table("roles").select("*").execute()
    return result.data
