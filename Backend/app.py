from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from config import supabase
import bcrypt
import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import pytz

app = FastAPI()

# Executor para correr las llamadas síncronas de supabase-py en threads paralelos
executor = ThreadPoolExecutor(max_workers=10)

def run_query(fn):
    """Envuelve una query síncrona de Supabase para ejecutarla en un thread async."""
    loop = asyncio.get_event_loop()
    return loop.run_in_executor(executor, fn)

def get_santo_domingo_time():
    """Obtiene la hora actual en Santo Domingo"""
    santo_domingo_tz = pytz.timezone('America/Santo_Domingo')
    return datetime.now(santo_domingo_tz)

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
async def get_reporte_diario(user_id: Optional[int] = None):
    try:
        # Usar hora de Santo Domingo para la fecha del reporte
        santo_domingo_time = get_santo_domingo_time()
        today = santo_domingo_time.strftime("%Y-%m-%d")

        def _query():
            q = (supabase.table("sales")
                .select("id, total, metodo_pago, created_at, nombre_comprador, user_id")
                .gte("created_at", f"{today}T00:00:00-04:00")  # Zona horaria de RD
                .lte("created_at", f"{today}T23:59:59-04:00"))
            if user_id is not None:
                q = q.eq("user_id", user_id)
            return q.order("created_at", desc=True).execute()

        res = await run_query(_query)
        sales_today = res.data if res.data else []

        # Para cada venta, buscar TODOS los productos vendidos
        for sale in sales_today:
            try:
                det_res = await run_query(
                    lambda s=sale: supabase.table("sale_details")
                        .select("cantidad, precio_unitario, products(nombre)")
                        .eq("sale_id", s["id"])
                        .execute()
                )
                if det_res.data:
                    productos = []
                    for d in det_res.data:
                        producto = {
                            "nombre": d["products"]["nombre"] if d.get("products") else "Producto",
                            "cantidad": d["cantidad"],
                            "precio_unitario": d["precio_unitario"],
                            "subtotal": d["cantidad"] * d["precio_unitario"]
                        }
                        productos.append(producto)
                    
                    sale["productos"] = productos
                    # Para la tabla, mostrar el primer producto + indicador de cuántos más
                    primer_producto = productos[0]["nombre"]
                    cantidad_total = sum(p["cantidad"] for p in productos)
                    
                    if len(productos) > 1:
                        sale["nombre_producto"] = f"{primer_producto} +{len(productos)-1} más"
                        sale["productos_count"] = len(productos)
                        sale["cantidad_total"] = cantidad_total
                    else:
                        sale["nombre_producto"] = primer_producto
                        sale["productos_count"] = 1
                        sale["cantidad_total"] = cantidad_total
                else:
                    sale["productos"] = []
                    sale["nombre_producto"] = "Venta General"
                    sale["productos_count"] = 0
                    sale["cantidad_total"] = 0
            except Exception as e:
                print(f"Error procesando detalles de venta {sale['id']}: {e}")
                sale["productos"] = []
                sale["nombre_producto"] = "Venta General"
                sale["productos_count"] = 0
                sale["cantidad_total"] = 0

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

# ── VENTAS DEL MES (filtradas por vendedor) ──────────────────────────

@app.get("/api/ventas-mes")
async def get_ventas_mes(user_id: Optional[int] = None):
    try:
        santo_domingo_time = get_santo_domingo_time()
        mes_inicio = santo_domingo_time.strftime("%Y-%m-01")

        def _query():
            q = (supabase.table("sales")
                .select("total")
                .gte("created_at", f"{mes_inicio}T00:00:00-04:00"))
            if user_id is not None:
                q = q.eq("user_id", user_id)
            return q.execute()

        res = await run_query(_query)
        total_mes = sum(s["total"] for s in res.data) if res.data else 0
        return {"total_mes": total_mes}
    except Exception as e:
        print(f"Error fetching ventas mes: {e}")
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


@app.delete("/api/usuarios/{user_id}")
async def delete_usuario(user_id: int):
    try:
        # No se puede eliminar a un administrador
        existing = await run_query(
            lambda: supabase.table("users").select("rol, nombre").eq("id", user_id).execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        if existing.data[0]["rol"] == "admin":
            raise HTTPException(status_code=403, detail="No se puede eliminar a un administrador")

        await run_query(
            lambda: supabase.table("users").delete().eq("id", user_id).execute()
        )
        return {"message": "Usuario eliminado correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting usuario: {e}")
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
    user_id:          int
    metodo_pago:      str
    total:            float
    items:            list[SaleItem]
    nombre_comprador: Optional[str] = None

@app.post("/api/ventas")
async def create_venta(body: VentaRequest):
    try:
        # Usar la hora de Santo Domingo para la venta
        santo_domingo_time = get_santo_domingo_time()
        
        sale_data = {
            "user_id":     body.user_id,
            "total":       body.total,
            "metodo_pago": body.metodo_pago,
            "created_at":  santo_domingo_time.isoformat()  # Guardar con hora local
        }
        
        # Asegurarse de que nombre_comprador no sea null
        if body.nombre_comprador and body.nombre_comprador.strip():
            sale_data["nombre_comprador"] = body.nombre_comprador.strip()
        else:
            sale_data["nombre_comprador"] = "Consumidor Final"

        sale_response = await run_query(
            lambda: supabase.table("sales").insert(sale_data).execute()
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

@app.get("/api/ventas/{sale_id}")
async def get_venta_detalle(sale_id: int):
    try:
        # Obtener la venta
        sale_res = await run_query(
            lambda: supabase.table("sales")
                .select("id, total, metodo_pago, created_at, nombre_comprador, user_id")
                .eq("id", sale_id)
                .execute()
        )
        
        if not sale_res.data:
            raise HTTPException(status_code=404, detail="Venta no encontrada")
        
        venta = sale_res.data[0]
        
        # Convertir la fecha a hora local para mostrarla correctamente
        if venta.get("created_at"):
            try:
                # Parsear la fecha y asegurar que se muestre en hora local
                fecha_utc = datetime.fromisoformat(venta["created_at"].replace('Z', '+00:00'))
                santo_domingo_tz = pytz.timezone('America/Santo_Domingo')
                fecha_local = fecha_utc.astimezone(santo_domingo_tz)
                venta["created_at"] = fecha_local.isoformat()
            except:
                pass
        
        # Obtener el nombre del vendedor
        user_res = await run_query(
            lambda: supabase.table("users")
                .select("nombre")
                .eq("id", venta["user_id"])
                .execute()
        )
        venta["vendedor"] = user_res.data[0]["nombre"] if user_res.data else "Desconocido"
        
        # Obtener los detalles de la venta con los productos
        det_res = await run_query(
            lambda: supabase.table("sale_details")
                .select("cantidad, precio_unitario, products(id, nombre, categoria)")
                .eq("sale_id", sale_id)
                .execute()
        )
        
        if det_res.data:
            productos = []
            for d in det_res.data:
                producto = {
                    "id": d["products"]["id"] if d.get("products") else None,
                    "nombre": d["products"]["nombre"] if d.get("products") else "Producto",
                    "categoria": d["products"]["categoria"] if d.get("products") else "General",
                    "cantidad": d["cantidad"],
                    "precio_unitario": d["precio_unitario"],
                    "subtotal": d["cantidad"] * d["precio_unitario"]
                }
                productos.append(producto)
            venta["productos"] = productos
        else:
            venta["productos"] = []
        
        return venta
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching sale details {sale_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)