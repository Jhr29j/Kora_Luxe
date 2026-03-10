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
  const myId  = parseInt(localStorage.getItem('koraLuxe_userId'));
  tbody.innerHTML = usuarios.map(u => {
    const isSelf    = u.id === myId;
    const isAdmin   = u.rol === 'admin';
    const canDelete = !isAdmin && !isSelf;

    const toggleDisabled = isAdmin ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : '';
    const deleteBtn = canDelete
      ? `<button class="action-btn action-delete" onclick="eliminarUsuario(${u.id}, '${u.nombre}')">Eliminar</button>`
      : '';

    return `
    <tr data-id="${u.id}" data-nombre="${u.nombre}" data-email="${u.email}" data-rol="${u.rol}" data-activo="${u.activo}" data-is-protected="${isAdmin}" data-is-self="${isSelf}">
      <td>${u.nombre}${isSelf ? ' <span style="font-size:0.75rem;color:#10b981;font-weight:600;">(tú)</span>' : ''}</td>
      <td>${u.email}</td>
      <td style="text-transform:capitalize;">${u.rol}</td>
      <td>${formatDate(u.created_at)}</td>
      <td><span class="${u.activo ? 'status-active' : 'status-inactive'}">${u.activo ? 'activo' : 'inactivo'}</span></td>
      <td class="user-actions">
        <button class="action-btn action-edit" onclick="openModal(true, ${u.id})">Editar</button>
        <button class="action-btn action-toggle ${u.activo ? 'active' : 'inactive'}" onclick="toggleActivo(${u.id}, ${u.activo})" ${toggleDisabled}>${u.activo ? 'Desactivar' : 'Activar'}</button>
        ${deleteBtn}
      </td>
    </tr>`;
  }).join('');
}

async function toggleActivo(id, currentActivo) {
  try {
    const res = await fetch(`http://localhost:5000/api/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !currentActivo })
    });
    if (res.ok) {
      KoraCache.clear('usuarios');
      loadUsuarios();
    } else {
      const e = await res.json();
      alert(`Error: ${e.detail}`);
    }
  } catch(e) { console.error(e); }
}

async function eliminarUsuario(id, nombre) {
  if (!confirm(`¿Eliminar a ${nombre}? Esta acción no se puede deshacer.`)) return;
  try {
    const res = await fetch(`http://localhost:5000/api/usuarios/${id}`, { method: 'DELETE' });
    if (res.ok) {
      KoraCache.clear('usuarios');
      loadUsuarios();
    } else {
      const err = await res.json();
      alert(`Error: ${err.detail}`);
    }
  } catch (e) {
    alert('Error al conectar con el servidor.');
    console.error(e);
  }
}

// Modal
const userModal     = document.getElementById('userModal');
const modalTitle    = document.getElementById('modalTitle');
const passwordField = document.getElementById('passwordField');
const userForm      = document.getElementById('userForm');

function openModal(isEdit = false, userId = null) {
  userForm.reset();
  document.getElementById('editId').value = '';
  modalTitle.textContent = isEdit ? 'Editar Usuario' : 'Nuevo Usuario';
  passwordField.style.display = 'block';
  const pwdInput = document.getElementById('password');
  pwdInput.required = !isEdit;
  pwdInput.placeholder = isEdit ? 'Dejar vacío para no cambiar' : 'Contraseña';

  const rolSelect = document.getElementById('rol');
  const estadoSelect = document.getElementById('estado');
  const rolNote = document.getElementById('rolProtectedNote');

  rolSelect.disabled    = false;
  estadoSelect.disabled = false;
  if (rolNote) rolNote.style.display = 'none';

  if (isEdit && userId) {
    const row = document.querySelector(`tr[data-id="${userId}"]`);
    document.getElementById('editId').value = userId;
    document.getElementById('nombre').value = row.dataset.nombre;
    document.getElementById('email').value  = row.dataset.email;
    rolSelect.value                         = row.dataset.rol;
    estadoSelect.value                      = row.dataset.activo === 'true' ? 'activo' : 'inactivo';

    const isSelf      = row.dataset.isSelf === 'true';
    const isProtected = row.dataset.isProtected === 'true';

    if (isSelf) {
      rolSelect.disabled    = true;
      estadoSelect.disabled = true;
      if (rolNote) {
        rolNote.innerHTML = '<i class="fa-solid fa-lock"></i> No puedes modificar tu propio rol ni estado.';
        rolNote.style.display = 'block';
      }
    } else if (isProtected) {
      rolSelect.disabled    = true;
      estadoSelect.disabled = true;
      if (rolNote) {
        rolNote.innerHTML = '<i class="fa-solid fa-lock"></i> No puedes modificar a otro administrador.';
        rolNote.style.display = 'block';
      }
    }
  }
  userModal.style.display = 'flex';
}

function closeModal() {
  userModal.style.display = 'none';
  userForm.reset();
  document.getElementById('rol').disabled    = false;
  document.getElementById('estado').disabled = false;
  const rolNote = document.getElementById('rolProtectedNote');
  if (rolNote) rolNote.style.display = 'none';
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
      KoraCache.clear('usuarios');
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