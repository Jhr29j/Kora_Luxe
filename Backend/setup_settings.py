from config import supabase

def create_settings_table():
    # Nota: Supabase REST API no permite CREATE TABLE.
    # El usuario debe hacerlo en el SQL Editor.
    sql = """
    CREATE TABLE IF NOT EXISTS settings (
        id BIGINT PRIMARY KEY,
        nombre_empresa TEXT,
        rnc TEXT,
        telefono TEXT,
        direccion TEXT,
        email_contacto TEXT,
        itbis DECIMAL,
        descuento_max DECIMAL,
        stock_minimo INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Insertar fila inicial si no existe
    INSERT INTO settings (id, nombre_empresa, rnc, telefono, direccion, email_contacto, itbis, descuento_max, stock_minimo)
    VALUES (1, 'Kora Luxe Joyería', '131-45678-9', '809-555-0000', 'Av. Independencia #45, Santo Domingo Oeste', 'info@koraluxe.do', 18.0, 30.0, 5)
    ON CONFLICT (id) DO NOTHING;
    """
    print("--- COPIA Y PEGA ESTE SQL EN EL SQL EDITOR DE SUPABASE ---")
    print(sql)
    print("---------------------------------------------------------")

if __name__ == "__main__":
    create_settings_table()
    try:
        # Intento de inserción para ver si la tabla existe
        res = supabase.table("settings").select("*").execute()
        print("✅ Acceso a la tabla 'settings' confirmado.")
    except Exception as e:
        print(f"❌ Error al acceder a la tabla: {e}")
        print("Es muy probable que la tabla 'settings' no exista.")
