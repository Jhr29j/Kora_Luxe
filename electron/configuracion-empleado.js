// Menú hamburguesa
const menuToggle = document.getElementById('menuToggle');
const sidebarMenu = document.getElementById('sidebarMenu');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeMenuBtn = document.getElementById('closeMenu');

function openMenu() { sidebarMenu.classList.add('active'); sidebarOverlay.classList.add('active'); }
function closeMenu() { sidebarMenu.classList.remove('active'); sidebarOverlay.classList.remove('active'); }
menuToggle.addEventListener('click', openMenu);
closeMenuBtn.addEventListener('click', closeMenu);
sidebarOverlay.addEventListener('click', closeMenu);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

// Toast
function showToast(msg = 'Cambios guardados', isError = false) {
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.style.background = isError ? '#ef4444' : '#10b981';
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.transform = 'translateY(80px)'; toast.style.opacity = '0'; }, 3000);
}

// Cargar preferencias al iniciar
document.addEventListener('DOMContentLoaded', () => {
  const userName   = localStorage.getItem('koraLuxe_userName')  || '';
  const userEmail  = localStorage.getItem('koraLuxe_userEmail') || '';
  const metodoPago = localStorage.getItem('koraLuxe_metodoPago') || 'Efectivo';

  const confNombre = document.getElementById('confNombre');
  const confEmail  = document.getElementById('confEmail');
  if (confNombre) confNombre.value = userName;
  if (confEmail)  confEmail.value  = userEmail;

  // Marcar radio de método de pago
  document.querySelectorAll('input[name="payment"]').forEach(r => { r.checked = (r.value === metodoPago); });

  // Tema
  applyTheme(localStorage.getItem('koraLuxe_theme') || 'light', false);
});

// Tema
function applyTheme(theme, save = true) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === theme));
  if (save) localStorage.setItem('koraLuxe_theme', theme);
}
document.querySelectorAll('.theme-btn').forEach(btn => btn.addEventListener('click', () => applyTheme(btn.dataset.theme)));

// Guardar cambios
document.getElementById('btnGuardar')?.addEventListener('click', async () => {
  const nombre     = document.getElementById('confNombre').value.trim();
  const metodoPago = document.querySelector('input[name="payment"]:checked')?.value || 'Efectivo';

  if (!nombre) { showToast('El nombre no puede estar vacío', true); return; }

  localStorage.setItem('koraLuxe_userName',   nombre);
  localStorage.setItem('koraLuxe_metodoPago', metodoPago);

  // Actualizar nombre en el backend
  const userId = localStorage.getItem('koraLuxe_userId');
  if (userId) {
    try {
      await fetch(`http://localhost:5000/api/usuarios/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
      });
      KoraCache.clear('usuarios'); // Invalidar caché de usuarios
    } catch (e) { console.error('Error actualizando nombre:', e); }
  }

  const nameEl = document.getElementById('loggedUserName');
  if (nameEl) nameEl.textContent = nombre;
  showToast('Preferencias guardadas correctamente');
});

document.getElementById('btnCancelar')?.addEventListener('click', () => {
  window.location.href = 'dashboard.html';
});