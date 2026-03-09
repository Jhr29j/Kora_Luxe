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

let allUsuarios = [];

async function loadUsuarios() {
  // Mostrar caché inmediatamente si existe
  const cached = KoraCache.peek('usuarios');
  if (cached) { allUsuarios = cached; renderUsuarios(allUsuarios); }

  try {
    const data = await KoraCache.get('usuarios', () =>
      fetch('http://localhost:5000/api/usuarios').then(r => {
        if (!r.ok) throw new Error('Error al obtener la lista');
        return r.json();
      })
    );
    allUsuarios = data;
    renderUsuarios(allUsuarios);
  } catch(error) {
    console.error(error);
    if (!cached) {
      document.getElementById('usersTableBody').innerHTML =
        `<tr><td colspan="6" style="text-align:center;color:red;">Error al cargar usuarios.</td></tr>`;
    }
  }
}

function formatDate(isoString) {
  if (!isoString) return 'Desconocida';
  return new Date(isoString).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
}

function renderUsuarios(usuarios) {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = usuarios.map(u => `
    <tr data-id="${u.id}" data-nombre="${u.nombre}" data-email="${u.email}" data-rol="${u.rol}" data-activo="${u.activo}">
      <td>${u.nombre}</td>
      <td>${u.email}</td>
      <td style="text-transform:capitalize;">${u.rol}</td>
      <td>${formatDate(u.created_at)}</td>
      <td><span class="${u.activo ? 'status-active' : 'status-inactive'}">${u.activo ? 'activo' : 'inactivo'}</span></td>
      <td class="user-actions">
        <button class="action-btn action-edit" onclick="openModal(true, '${u.id}')">Editar</button>
        <button class="action-btn action-toggle" onclick="toggleActivo('${u.id}', ${u.activo})">${u.activo ? 'Desactivar' : 'Activar'}</button>
      </td>
    </tr>
  `).join('');
}

async function toggleActivo(id, currentActivo) {
  try {
    const res = await fetch(`http://localhost:5000/api/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !currentActivo })
    });
    if (res.ok) {
      KoraCache.clear('usuarios'); // Invalidar caché para recargar
      loadUsuarios();
    } else {
      const e = await res.json();
      alert(`Error: ${e.detail}`);
    }
  } catch(e) { console.error(e); }
}

// Modal
const userModal    = document.getElementById('userModal');
const modalTitle   = document.getElementById('modalTitle');
const passwordField = document.getElementById('passwordField');
const userForm     = document.getElementById('userForm');

function openModal(isEdit = false, userId = null) {
  userForm.reset();
  document.getElementById('editId').value = '';
  modalTitle.textContent = isEdit ? 'Editar Usuario' : 'Nuevo Usuario';
  passwordField.style.display = 'block';
  const pwdInput = document.getElementById('password');
  pwdInput.required = !isEdit;
  pwdInput.placeholder = isEdit ? 'Dejar vacío para no cambiar' : 'Contraseña';

  if (isEdit && userId) {
    const row = document.querySelector(`tr[data-id="${userId}"]`);
    document.getElementById('editId').value   = userId;
    document.getElementById('nombre').value   = row.dataset.nombre;
    document.getElementById('email').value    = row.dataset.email;
    document.getElementById('rol').value      = row.dataset.rol;
    document.getElementById('estado').value   = row.dataset.activo === 'true' ? 'activo' : 'inactivo';
  }
  userModal.style.display = 'flex';
}

function closeModal() {
  userModal.style.display = 'none';
  userForm.reset();
}

window.onclick = function(e) { if (e.target === userModal) closeModal(); };

document.getElementById('togglePassword')?.addEventListener('click', function() {
  const pwdInput = document.getElementById('password');
  const icon = this.querySelector('i');
  if (pwdInput.type === 'password') {
    pwdInput.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    pwdInput.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
});

userForm.addEventListener('submit', async e => {
  e.preventDefault();
  const editId = document.getElementById('editId').value;
  const isEdit = editId !== '';
  const data = {
    nombre: document.getElementById('nombre').value,
    email:  document.getElementById('email').value,
    rol:    document.getElementById('rol').value,
    activo: document.getElementById('estado').value === 'activo'
  };
  const pwd = document.getElementById('password').value;
  if (pwd) data.password = pwd;

  try {
    const method = isEdit ? 'PUT' : 'POST';
    const url    = isEdit ? `http://localhost:5000/api/usuarios/${editId}` : 'http://localhost:5000/api/usuarios';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      alert(isEdit ? `Usuario ${data.nombre} actualizado.` : `Usuario ${data.nombre} creado.`);
      KoraCache.clear('usuarios'); // Invalidar caché
      closeModal();
      loadUsuarios();
    } else {
      const err = await res.json();
      alert(`Error: ${err.detail}`);
    }
  } catch (error) {
    alert('Error al conectar con el servidor.');
    console.error(error);
  }
});

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeMenu(); } });

const searchInput = document.querySelector('header .search-container input');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderUsuarios(allUsuarios.filter(u =>
      (u.nombre || '').toLowerCase().includes(q) ||
      (u.email  || '').toLowerCase().includes(q)
    ));
  });
}

loadUsuarios();