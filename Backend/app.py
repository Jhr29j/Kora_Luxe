import bcrypt
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from config import supabase

app = FastAPI()

# Permite peticiones desde el frontend (Electron/Localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/login")
async def login(body: LoginRequest):
    try:
        # Buscar el usuario por email usando el cliente estándar de Supabase
        response = supabase.table("users").select("id, nombre, email, rol, password").eq("email", body.email).execute()
        users = response.data

        if not users or len(users) == 0:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

        user = users[0]
        db_password_hash = user['password']

        # Comparar la contraseña provista con el hash de la BD usando bcrypt
        if bcrypt.checkpw(body.password.encode('utf-8'), db_password_hash.encode('utf-8')):
            del user['password']  # No devolver el hash
            return {"message": "Login exitoso", "user": user}
        else:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en login: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
