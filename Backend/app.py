from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from config import supabase
import bcrypt
import asyncio
from concurrent.futures import ThreadPoolExecutor

app = FastAPI()

# Executor para correr las llamadas síncronas de supabase-py en threads paralelos
# Esto permite usar asyncio.gather() y ejecutar múltiples queries al mismo tiempo
executor = ThreadPoolExecutor(max_workers=10)

def run_query(fn):
    """Envuelve una query síncrona de Supabase para ejecutarla en un thread async."""
    loop = asyncio.get_event_loop()
    return loop.run_in_executor(executor, fn)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"ERROR DE VALIDACIÓN: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

@app.get("/")
async def root():
    return {"message": "API de Kora Luxe Joyería activa", "docs": "/docs"}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return {}

# ── LOGIN ────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/login")
async def login(body: LoginRequest):
    try:
        response = await run_query(
            lambda: supabase.table("users")
                .select("id, nombre, email, rol, password")
                .eq("email", body.email)
                .execute()
        )
        users = response.data

        if not users:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

        user = users[0]
        db_password = user['password']

        matched = (body.password == db_password)
        if not matched:
            try:
                matched = bcrypt.checkpw(
                    body.password.encode('utf-8'),
                    db_password.encode('utf-8')
                )
            except Exception:
                pass

        if not matched:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

        del user['password']
        return {"message": "Login exitoso", "user": user}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en login: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── PRODUCTOS ────────────────────────────────────────────────────────

@app.get("/api/productos")
async def get_productos(limit: int = 50, offset: int = 0, include_images: bool = False):
    try:
        select_cols = "id, nombre, categoria, precio, stock, activo"
        if include_images:
            select_cols += ", imagen_url"
            
        response = await run_query(
            lambda: supabase.table("products")
                .select(select_cols)
                .range(offset, offset + limit - 1)
                .order("nombre")
                .execute()
        )
        return response.data
    except Exception as e:
        print(f"Error fetching productos: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/productos/{product_id}")
async def get_producto(product_id: int):
    try:
        response = await run_query(
            lambda: supabase.table("products")
                .select("*")
                .eq("id", product_id)
                .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        return response.data[0]
    except Exception as e:
        print(f"Error fetching product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── DASHBOARD — las 4 queries corren en PARALELO ─────────────────────

@app.get("/api/dashboard")
async def get_dashboard():
    try:
        # Lanzar todas las queries al mismo tiempo en lugar de una por una
        sales_res, stock_res, users_res, recent_res = await asyncio.gather(
            run_query(lambda: supabase.table("sales").select("total").execute()),
            run_query(lambda: supabase.table("products").select("id").lte("stock", 5).execute()),
            run_query(lambda: supabase.table("users").select("id", count="exact").execute()),
            run_query(lambda: supabase.table("products")
                .select("id, nombre, categoria, precio, stock, created_at")
                .order("created_at", desc=True).limit(5).execute()),
        )

        ingresos_totales = sum(s["total"] for s in sales_res.data) if sales_res.data else 0
        stock_bajo       = len(stock_res.data) if stock_res.data else 0
        usuarios         = (users_res.count if hasattr(users_res, 'count') and users_res.count
                            else len(users_res.data))
        recent_products  = recent_res.data if recent_res.data else []

        return {
            "ingresos_totales": ingresos_totales,
            "stock_bajo":       stock_bajo,
            "usuarios":         usuarios,
            "recent_products":  recent_products
        }
    except Exception as e:
        print(f"Error fetching dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── REPORTE DIARIO ───────────────────────────────────────────────────

@app.get("/api/reporte-diario")
async def get_reporte_diario():
    try:
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")

        res = await run_query(
            lambda: supabase.table("sales")
                .select("total, metodo_pago, created_at")
                .gte("created_at", f"{today}T00:00:00")
                .execute()
        )
        sales_today = res.data if res.data else []

        total_venta   = sum(s["total"] for s in sales_today)
        conteo_ventas = len(sales_today)

        metodos = {}
        for s in sales_today:
            m = s["metodo_pago"]
            metodos[m] = metodos.get(m, 0) + s["total"]

        return {
            "fecha":          today,
            "total_venta":    total_venta,
            "conteo_ventas":  conteo_ventas,
            "metodos_pago":   metodos,
            "ventas":         sales_today
        }
    except Exception as e:
        print(f"Error fetching daily report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── CONFIGURACIÓN ────────────────────────────────────────────────────

_DEFAULT_CONFIG = {
    "nombre_empresa": "Kora Luxe Joyería",
    "rnc":            "131-45678-9",
    "telefono":       "809-555-0000",
    "direccion":      "Av. Independencia #45, Santo Domingo Oeste",
    "email_contacto": "info@koraluxe.do",
    "itbis":          18.0,
    "descuento_max":  30.0,
    "stock_minimo":   5
}

@app.get("/api/configuracion")
async def get_configuracion():
    try:
        response = await run_query(
            lambda: supabase.table("settings").select("*").eq("id", 1).execute()
        )
        return response.data[0] if response.data else _DEFAULT_CONFIG
    except Exception as e:
        print(f"Error fetching configuration: {e}")
        return _DEFAULT_CONFIG

@app.put("/api/configuracion")
async def update_configuracion(config: dict):
    try:
        config["id"] = 1
        response = await run_query(
            lambda: supabase.table("settings").upsert(config).execute()
        )
        return {"message": "Configuración actualizada", "data": response.data}
    except Exception as e:
        print(f"Error updating configuration: {e}")
        raise HTTPException(status_code=500, detail=f"Error en la base de datos: {str(e)}")

# ── USUARIOS ─────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    nombre: str
    email: str
    password: str
    rol: str
    activo: bool = True

class UserUpdate(BaseModel):
    nombre:   Optional[str]  = None
    email:    Optional[str]  = None
    password: Optional[str]  = None
    rol:      Optional[str]  = None
    activo:   Optional[bool] = None

@app.get("/api/usuarios")
async def get_usuarios():
    try:
        response = await run_query(
            lambda: supabase.table("users")
                .select("id, nombre, email, rol, activo, created_at")
                .execute()
        )
        return response.data
    except Exception as e:
        print(f"Error fetching usuarios: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/usuarios")
async def create_usuario(user: UserCreate):
    try:
        response = await run_query(
            lambda: supabase.table("users").insert(user.dict()).execute()
        )
        return {"message": "Usuario creado exitosamente", "data": response.data}
    except Exception as e:
        print(f"Error creating usuario: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/usuarios/{user_id}")
async def update_usuario(user_id: int, user: UserUpdate):
    try:
        data = {k: v for k, v in user.dict().items() if v is not None}
        if not data:
            raise HTTPException(status_code=400, detail="No hay datos para actualizar")

        # Proteger al admin de desactivarse
        if data.get("activo") is False:
            existing = await run_query(
                lambda: supabase.table("users").select("rol").eq("id", user_id).execute()
            )
            if existing.data and existing.data[0]["rol"] == "admin":
                raise HTTPException(status_code=403, detail="No se puede desactivar a un administrador")

        response = await run_query(
            lambda: supabase.table("users").update(data).eq("id", user_id).execute()
        )
        return {"message": "Usuario actualizado", "data": response.data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating usuario: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── PRODUCTOS CRUD ───────────────────────────────────────────────────

class ProductCreate(BaseModel):
    nombre:     str
    categoria:  Optional[str]   = None
    precio:     float
    stock:      int
    activo:     bool            = True
    imagen_url: Optional[str]   = None

@app.post("/api/productos")
async def create_producto(product: ProductCreate):
    try:
        response = await run_query(
            lambda: supabase.table("products").insert(product.dict()).execute()
        )
        return {"message": "Producto creado exitosamente", "data": response.data}
    except Exception as e:
        print(f"Error creating producto: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/productos/{product_id}")
async def update_producto(product_id: int, product: ProductCreate):
    try:
        data = {k: v for k, v in product.dict().items() if v is not None}
        response = await run_query(
            lambda: supabase.table("products").update(data).eq("id", product_id).execute()
        )
        return {"message": "Producto actualizado", "data": response.data}
    except Exception as e:
        print(f"Error updating producto: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/productos/{product_id}")
async def delete_producto(product_id: int):
    try:
        await run_query(
            lambda: supabase.table("products").delete().eq("id", product_id).execute()
        )
        return {"message": "Producto eliminado"}
    except Exception as e:
        print(f"Error deleting producto: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── VENTAS ───────────────────────────────────────────────────────────

class SaleItem(BaseModel):
    product_id:      int
    cantidad:        int
    precio_unitario: float

class VentaRequest(BaseModel):
    user_id:     int
    metodo_pago: str
    total:       float
    items:       list[SaleItem]

@app.post("/api/ventas")
async def create_venta(body: VentaRequest):
    try:
        sale_response = await run_query(
            lambda: supabase.table("sales").insert({
                "user_id":     body.user_id,
                "total":       body.total,
                "metodo_pago": body.metodo_pago
            }).execute()
        )
        sale_id = sale_response.data[0]['id']

        details = [
            {
                "sale_id":         sale_id,
                "product_id":      item.product_id,
                "cantidad":        item.cantidad,
                "precio_unitario": item.precio_unitario
            }
            for item in body.items
        ]
        await run_query(
            lambda: supabase.table("sale_details").insert(details).execute()
        )

        return {"message": "Venta registrada exitosamente", "sale_id": sale_id}

    except Exception as e:
        print(f"Error registrando venta: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)