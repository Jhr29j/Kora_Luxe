document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('form');
  const emailInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  // Crear un contenedor para mostrar errores si no existe
  let errorMsg = document.getElementById('error-message');
  if (!errorMsg) {
    errorMsg = document.createElement('div');
    errorMsg.id = 'error-message';
    errorMsg.style.color = '#e74c3c';
    errorMsg.style.marginTop = '10px';
    errorMsg.style.textAlign = 'center';
    errorMsg.style.fontSize = '14px';
    loginForm.appendChild(errorMsg);
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que la página se recargue

    const email = emailInput.value;
    const password = passwordInput.value;
    
    // Limpiar mensaje de error
    errorMsg.textContent = '';

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // Mostrar error del backend
        errorMsg.textContent = data.error || 'Error al iniciar sesión';
        return;
      }

      // Login exitoso, verificar el rol
      const userRol = data.user.rol;
      
      if (userRol === 'admin') {
        window.location.href = 'index.html';
      } else if (userRol === 'vendedor') {
        window.location.href = 'dashboard.html';
      } else {
        errorMsg.textContent = `Rol desconocido: ${userRol}`;
      }

    } catch (error) {
      console.error('Error de red:', error);
      errorMsg.textContent = 'Error al conectar con el servidor. ¿Está el backend encendido?';
    }
  });
});
