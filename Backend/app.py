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
        response = supabase.table("users").select("id, nombre, email, rol, password").eq("email", body.email).execute()
        users = response.data

        if not users or len(users) == 0:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

        user = users[0]
        db_password = user['password']

        # Comparación directa en texto plano
        if body.password == db_password:
            del user['password']
            return {"message": "Login exitoso", "user": user}
        else:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en login: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/productos")
async def get_productos():
    try:
        response = supabase.table("products").select("id, nombre, categoria, precio, stock, activo").execute()
        return response.data
    except Exception as e:
        print(f"Error fetching productos: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard")
async def get_dashboard():
    try:
        # Ventas/Ingresos totales
        sales_res = supabase.table("sales").select("total").execute()
        ingresos_totales = sum(s["total"] for s in sales_res.data) if sales_res.data else 0

        # Productos en stock bajo (<= 5)
        stock_res = supabase.table("products").select("id").lte("stock", 5).execute()
        stock_bajo = len(stock_res.data) if stock_res.data else 0

        # Usuarios registrados
        users_res = supabase.table("users").select("id", count="exact").execute()
        usuarios_registrados = users_res.count if hasattr(users_res, 'count') and users_res.count is not None else len(users_res.data)

        # Últimos productos modificados (ordenados por created_at de forma manual)
        recent_res = supabase.table("products").select("nombre, categoria, precio, stock, created_at").order("created_at", desc=True).limit(5).execute()
        recent_products = recent_res.data if recent_res.data else []

        return {
            "ingresos_totales": ingresos_totales,
            "stock_bajo": stock_bajo,
            "usuarios": usuarios_registrados,
            "recent_products": recent_products
        }
    except Exception as e:
        print(f"Error fetching dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reporte-diario")
async def get_reporte_diario():
    try:
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Filtramos ventas de hoy
        # Nota: gte es >= hoy 00:00:00
        res = supabase.table("sales").select("total, metodo_pago, created_at").gte("created_at", f"{today}T00:00:00").execute()
        sales_today = res.data if res.data else []
        
        total_venta = sum(s["total"] for s in sales_today)
        conteo_ventas = len(sales_today)
        
        metodos = {}
        for s in sales_today:
            m = s["metodo_pago"]
            metodos[m] = metodos.get(m, 0) + s["total"]
            
        return {
            "fecha": today,
            "total_venta": total_venta,
            "conteo_ventas": conteo_ventas,
            "metodos_pago": metodos,
            "ventas": sales_today
        }
    except Exception as e:
        print(f"Error fetching daily report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/configuracion")
async def get_configuracion():
    try:
        response = supabase.table("settings").select("*").eq("id", 1).execute()
        if not response.data:
            return {
                "nombre_empresa": "Kora Luxe Joyería",
                "rnc": "131-45678-9",
                "telefono": "809-555-0000",
                "direccion": "Av. Independencia #45, Santo Domingo Oeste",
                "email_contacto": "info@koraluxe.do",
                "itbis": 18.0,
                "descuento_max": 30.0,
                "stock_minimo": 5
            }
        return response.data[0]
    except Exception as e:
        print(f"Error fetching configuration: {e}")
        return {
                "nombre_empresa": "Kora Luxe Joyería",
                "rnc": "131-45678-9",
                "telefono": "809-555-0000",
                "direccion": "Av. Independencia #45, Santo Domingo Oeste",
                "email_contacto": "info@koraluxe.do",
                "itbis": 18.0,
                "descuento_max": 30.0,
                "stock_minimo": 5
            }

@app.put("/api/configuracion")
async def update_configuracion(config: dict):
    try:
        config["id"] = 1
        response = supabase.table("settings").upsert(config).execute()
        return {"message": "Configuración actualizada", "data": response.data}
    except Exception as e:
        print(f"Error updating configuration: {e}")
        raise HTTPException(status_code=500, detail=f"Error en la base de datos: {str(e)}")

class UserCreate(BaseModel):
    nombre: str
    email: str
    password: str
    rol: str
    activo: bool = True

@app.get("/api/usuarios")
async def get_usuarios():
    try:
        response = supabase.table("users").select("id, nombre, email, rol, activo, created_at").execute()
        return response.data
    except Exception as e:
        print(f"Error fetching usuarios: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/usuarios")
async def create_usuario(user: UserCreate):
    try:
        data = {
            "nombre": user.nombre,
            "email": user.email,
            "password": user.password,
            "rol": user.rol,
            "activo": user.activo
        }
        response = supabase.table("users").insert(data).execute()
        return {"message": "Usuario creado exitosamente", "data": response.data}
    except Exception as e:
        print(f"Error creating usuario: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class UserUpdate(BaseModel):
    nombre: str | None = None
    email: str | None = None
    password: str | None = None
    rol: str | None = None
    activo: bool | None = None

@app.put("/api/usuarios/{user_id}")
async def update_usuario(user_id: str, user: UserUpdate):
    try:
        data = {k: v for k, v in user.dict().items() if v is not None}
        if not data:
            raise HTTPException(status_code=400, detail="No hay datos para actualizar")
        response = supabase.table("users").update(data).eq("id", user_id).execute()
        return {"message": "Usuario actualizado", "data": response.data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating usuario: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ProductCreate(BaseModel):
    nombre: str
    categoria: str | None = None
    precio: float
    stock: int
    activo: bool = True
    imagen_url: str | None = None

@app.post("/api/productos")
async def create_producto(product: ProductCreate):
    try:
        data = product.dict()
        response = supabase.table("products").insert(data).execute()
        return {"message": "Producto creado exitosamente", "data": response.data}
    except Exception as e:
        print(f"Error creating producto: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/productos/{product_id}")
async def update_producto(product_id: str, product: ProductCreate):
    try:
        data = {k: v for k, v in product.dict().items() if v is not None}
        response = supabase.table("products").update(data).eq("id", product_id).execute()
        return {"message": "Producto actualizado", "data": response.data}
    except Exception as e:
        print(f"Error updating producto: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/productos/{product_id}")
async def delete_producto(product_id: str):
    try:
        supabase.table("products").delete().eq("id", product_id).execute()
        return {"message": "Producto eliminado"}
    except Exception as e:
        print(f"Error deleting producto: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class SaleItem(BaseModel):
    product_id: str
    cantidad: int
    precio_unitario: float

class VentaRequest(BaseModel):
    metodo_pago: str
    total: float
    items: list[SaleItem]

@app.post("/api/ventas")
async def create_venta(body: VentaRequest):
    try:
        # Get the current user id from the request (stored in token)
        # For now we look up users - later this would come from an auth token.
        # Register the sale in 'sales' table
        sale_response = supabase.table("sales").insert({
            "total": body.total,
            "metodo_pago": body.metodo_pago
        }).execute()

        sale = sale_response.data[0]
        sale_id = sale['id']

        # Register each item in 'sale_details'
        details = [
            {
                "sale_id": sale_id,
                "product_id": item.product_id,
                "cantidad": item.cantidad,
                "precio_unitario": item.precio_unitario
            }
            for item in body.items
        ]
        supabase.table("sale_details").insert(details).execute()

        return {"message": "Venta registrada exitosamente", "sale_id": sale_id}

    except Exception as e:
        print(f"Error registrando venta: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
