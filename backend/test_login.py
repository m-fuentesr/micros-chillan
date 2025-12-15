# test_login.py
import asyncio
from app.db.supabase_client import supabase
 # Asegúrate que esta importación funcione en tu estructura

def obtener_token():
    email = "matiasjfr01@gmail.com"      # <--- PON EL EMAIL DEL USUARIO QUE CREASTE EN SUPABASE
    password = "password"  # <--- PON LA CONTRASEÑA QUE LE PUSISTE EN SUPABASE

    try:
        # Intentar iniciar sesión
        response = supabase.auth.sign_in_with_password({"email": email, "password": password})
        
        if response.session:
            print("\n✅ LOGIN EXITOSO. TU TOKEN ES:\n")
            print(response.session.access_token)
            print("\n" + "="*50 + "\n")
        else:
            print("❌ No se recibió sesión.")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    obtener_token()

#matiasjfr01@gmail.com
#password
#userchofer10@micros.cl