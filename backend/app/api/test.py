from fastapi import APIRouter
from app.db.supabase_client import supabase

router = APIRouter()

@router.get("/supabase-test")
def supabase_test():
    result = supabase.table("roles").select("*").execute()
    return result.data
