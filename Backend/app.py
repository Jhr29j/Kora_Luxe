import bcrypt
from flask import Flask, request, jsonify
from flask_cors import CORS
from config import supabase

app = Flask(__name__)
CORS(app)  # Permite peticiones desde el frontend (Electron/Localhost)

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not 'email' in data or not 'password' in data:
            return jsonify({"error": "Faltan credenciales"}), 400
            
        email = data['email']
        password = data['password']
        
        # Buscar el usuario por email usando el cliente estandar de Supabase
        response = supabase.table("users").select("id, nombre, email, rol, password").eq("email", email).execute()
        users = response.data
        
        if not users or len(users) == 0:
            return jsonify({"error": "Credenciales inválidas"}), 401
            
        user = users[0]
        db_password_hash = user['password']
        
        # Comparar la contraseña provista con el hash de la BD usando bcrypt
        # (El hash de Supabase 'crypt' usa el formato de bcrypt)
        if bcrypt.checkpw(password.encode('utf-8'), db_password_hash.encode('utf-8')):
            # Remover la contraseña antes de devolver el usuario
            del user['password']
            return jsonify({
                "message": "Login exitoso",
                "user": user
            }), 200
        else:
            return jsonify({"error": "Credenciales inválidas"}), 401
            
    except Exception as e:
        print(f"Error en login: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Correr el servidor en el puerto 5000
    app.run(debug=True, port=5000)
