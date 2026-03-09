// ── Menú hamburguesa ────────────────────────────────────────────────
const menuToggle = document.getElementById('menuToggle');
const sidebarMenu = document.getElementById('sidebarMenu');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeMenuBtn = document.getElementById('closeMenu');

function openMenu() {
  sidebarMenu.classList.add('active');
  sidebarOverlay.classList.add('active');
}

function closeMenu() {
  sidebarMenu.classList.remove('active');
  sidebarOverlay.classList.remove('active');
}

menuToggle.addEventListener('click', openMenu);
closeMenuBtn.addEventListener('click', closeMenu);
sidebarOverlay.addEventListener('click', closeMenu);

// ── Modal ───────────────────────────────────────────────────────────
const userModal = document.getElementById('userModal');
const modalTitle = document.getElementById('modalTitle');
const passwordField = document.getElementById('passwordField');
const userForm = document.getElementById('userForm');

function openModal(isEdit = false, userId = null) {
  modalTitle.textContent = isEdit ? 'Editar Usuario' : 'Nuevo Usuario';
  
  // Mostrar/ocultar campo contraseña (solo al crear)
  passwordField.style.display = isEdit ? 'none' : 'block';
  
  if (isEdit) {
    // Simulación: cargar datos del usuario (en producción vendría de API)
    const row = document.querySelector(`tr[data-id="${userId}"]`);
    document.getElementById('editId').value = userId;
    document.getElementById('nombre').value = row.cells[0].textContent;
    document.getElementById('email').value = row.cells[1].textContent;
    document.getElementById('rol').value = row.cells[2].textContent.toLowerCase();
    document.getElementById('estado').value = row.cells[4].textContent.toLowerCase() === 'activo' ? 'activo' : 'inactivo';
  } else {
    userForm.reset();
    document.getElementById('editId').value = '';
  }

  userModal.style.display = 'flex';
}

function closeModal() {
  userModal.style.display = 'none';
  userForm.reset();
}

window.onclick = function(e) {
  if (e.target === userModal) closeModal();
}

// Guardar usuario (simulado)
userForm.addEventListener('submit', e => {
  e.preventDefault();
  
  const isEdit = document.getElementById('editId').value !== '';
  const nombre = document.getElementById('nombre').value;
  const email = document.getElementById('email').value;
  const rol = document.getElementById('rol').value;
  const estado = document.getElementById('estado').value;

  alert(isEdit 
    ? `Usuario ${nombre} actualizado exitosamente (simulado)` 
    : `Nuevo usuario ${nombre} creado exitosamente (simulado)`);

  closeModal();
});

// Cerrar con Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeMenu();
  }
});