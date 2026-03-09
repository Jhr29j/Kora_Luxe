// ── Menú hamburguesa ────────────────────────────────────────────────
const menuToggle = document.getElementById('menuToggle');
const sidebarMenu = document.getElementById('sidebarMenu');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeMenuBtn = document.getElementById('closeMenu');

function openMenu() { sidebarMenu.classList.add('active'); sidebarOverlay.classList.add('active'); }
function closeMenu() { sidebarMenu.classList.remove('active'); sidebarOverlay.classList.remove('active'); }
menuToggle.addEventListener('click', openMenu);
closeMenuBtn.addEventListener('click', closeMenu);
sidebarOverlay.addEventListener('click', closeMenu);

// ── Estado ───────────────────────────────────────────────────────────
let allProducts = [];
let currentEditId = null;
let selectedImageBase64 = null;

// ── Cargar productos desde API ────────────────────────────────────────
async function loadProducts() {
  try {
    const res = await fetch('http://localhost:5000/api/productos');
    if (!res.ok) throw new Error('Error cargando productos');
    allProducts = await res.json();
    renderTable(allProducts);
  } catch(e) {
    console.error(e);
    document.getElementById('productTable').innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">Error al cargar. ¿Está el servidor encendido?</td></tr>`;
  }
}

// ── Render tabla ─────────────────────────────────────────────────────
function renderTable(products) {
  const tbody = document.getElementById('productTable');
  if (!products.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#888;">No hay productos aún.</td></tr>`;
    return;
  }
  tbody.innerHTML = products.map(p => `
    <tr data-id="${p.id}">
      <td>
        ${p.imagen_url
          ? `<img src="${p.imagen_url}" alt="${p.nombre}" class="product-img" style="width:60px;height:60px;object-fit:cover;border-radius:6px;">`
          : `<div style="width:60px;height:60px;background:#f3f4f6;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">💎</div>`
        }
      </td>
      <td>${p.nombre}</td>
      <td>${p.categoria || '—'}</td>
      <td class="gold">RD$ ${Number(p.precio).toLocaleString('es-DO', {minimumFractionDigits:2})}</td>
      <td>${p.stock}</td>
      <td>
        <button class="btn btn-edit" onclick="openModal('edit', '${p.id}')">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn-delete" onclick="deleteProduct('${p.id}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// ── Filtro ───────────────────────────────────────────────────────────
document.querySelector('input[placeholder]')?.addEventListener('input', function() {
  const q = this.value.toLowerCase();
  const filtered = allProducts.filter(p =>
    (p.nombre || '').toLowerCase().includes(q) ||
    (p.categoria || '').toLowerCase().includes(q)
  );
  renderTable(filtered);
});

// ── Modal ─────────────────────────────────────────────────────────────
function openModal(mode, productId = null) {
  currentEditId = productId;
  selectedImageBase64 = null;
  document.getElementById('modalTitle').textContent = mode === 'add' ? 'Nuevo Producto' : 'Editar Producto';
  
  const previewContainer = document.getElementById('imagePreviewContainer');
  const previewImg = document.getElementById('imagePreview');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const pImagen = document.getElementById('pImagen');

  if (pImagen) pImagen.value = '';
  fileNameDisplay.textContent = 'Ningún archivo seleccionado';
  previewContainer.style.display = 'none';
  previewImg.src = '';
  
  document.getElementById('productForm').reset();

  if (mode === 'edit' && productId) {
    const p = allProducts.find(x => String(x.id) === String(productId));
    if (p) {
      document.getElementById('pNombre').value = p.nombre || '';
      document.getElementById('pCategoria').value = p.categoria || '';
      document.getElementById('pPrecio').value = p.precio || '';
      document.getElementById('pStock').value = p.stock || '';
      document.getElementById('pActivo').value = p.activo ? 'true' : 'false';
      if (p.imagen_url) {
        previewImg.src = p.imagen_url;
        previewContainer.style.display = 'block';
        fileNameDisplay.textContent = 'Imagen actual';
      }
    }
  }

  document.getElementById('productModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('productModal').style.display = 'none';
  currentEditId = null;
  selectedImageBase64 = null;
}

window.onclick = function(e) {
  if (e.target.classList.contains('modal')) closeModal();
}

// ── Preview de imagen ─────────────────────────────────────────────────
document.getElementById('pImagen')?.addEventListener('change', function() {
  const file = this.files[0];
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const previewContainer = document.getElementById('imagePreviewContainer');
  const previewImg = document.getElementById('imagePreview');

  if (!file) {
    if (!selectedImageBase64) {
      fileNameDisplay.textContent = 'Ningún archivo seleccionado';
      previewContainer.style.display = 'none';
    }
    return;
  }

  fileNameDisplay.textContent = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    selectedImageBase64 = e.target.result;
    previewImg.src = selectedImageBase64;
    previewContainer.style.display = 'block';
  };
  reader.readAsDataURL(file);
});

// ── Quitar imagen ────────────────────────────────────────────────────
document.getElementById('removeImageBtn')?.addEventListener('click', () => {
  selectedImageBase64 = null;
  const pImagen = document.getElementById('pImagen');
  if (pImagen) pImagen.value = '';
  
  document.getElementById('fileNameDisplay').textContent = 'Ningún archivo seleccionado';
  document.getElementById('imagePreviewContainer').style.display = 'none';
  document.getElementById('imagePreview').src = '';
});

// ── Guardar producto ──────────────────────────────────────────────────
document.getElementById('productForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    nombre: document.getElementById('pNombre').value.trim(),
    categoria: document.getElementById('pCategoria').value,
    precio: parseFloat(document.getElementById('pPrecio').value),
    stock: parseInt(document.getElementById('pStock').value),
    activo: document.getElementById('pActivo').value === 'true',
  };

  if (selectedImageBase64) {
    data.imagen_url = selectedImageBase64; // Se guarda la imagen como base64
  }

  try {
    const method = currentEditId ? 'PUT' : 'POST';
    const url = currentEditId
      ? `http://localhost:5000/api/productos/${currentEditId}`
      : 'http://localhost:5000/api/productos';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      alert(currentEditId ? '¡Producto actualizado!' : '¡Producto creado exitosamente!');
      closeModal();
      loadProducts();
    } else {
      const err = await res.json();
      alert(`Error: ${err.detail}`);
    }
  } catch(err) {
    alert('Error de conexión con el servidor.');
    console.error(err);
  }
});

// ── Eliminar producto ─────────────────────────────────────────────────
async function deleteProduct(id) {
  if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
  try {
    const res = await fetch(`http://localhost:5000/api/productos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert('Producto eliminado.');
      loadProducts();
    } else {
      const err = await res.json();
      alert(`Error: ${err.detail}`);
    }
  } catch(err) {
    alert('Error de conexión.');
    console.error(err);
  }
}

// ── Tecla Escape ──────────────────────────────────────────────────────
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeMenu(); } });

// ── Inicializar ───────────────────────────────────────────────────────
loadProducts();