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

  // Toggle de contraseña
  document.getElementById('togglePassword')?.addEventListener('click', function() {
    const icon = this.querySelector('i');
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
      passwordInput.type = 'password';
      icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value;
    const password = passwordInput.value;
    
    errorMsg.textContent = '';

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        errorMsg.textContent = data.error || 'Error al iniciar sesión';
        return;
      }

      const userRol = data.user.rol;
      const userName = data.user.nombre;
      
      localStorage.setItem('koraLuxe_userRol', userRol);
      localStorage.setItem('koraLuxe_userName', userName);
      localStorage.setItem('koraLuxe_userId', data.user.id);
      
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
