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

let allProducts = [];
let currentEditId = null;
let selectedImageBase64 = null;
let removeImageFlag = false;

async function loadProducts() {
  // Mostrar caché inmediatamente si existe
  const cached = KoraCache.peek('productos');
  if (cached) { allProducts = cached; renderTable(allProducts); }

  try {
    const data = await KoraCache.get('productos', () =>
      fetch('http://localhost:5000/api/productos?include_images=false').then(r => {
        if (!r.ok) throw new Error('Error cargando productos');
        return r.json();
      })
    );
    allProducts = data;
    renderTable(allProducts);
  } catch(e) {
    console.error(e);
    if (!cached) {
      document.getElementById('productTable').innerHTML =
        `<tr><td colspan="6" style="text-align:center;color:red;">Error al cargar. ¿Está el servidor encendido?</td></tr>`;
    }
  }
}

async function fetchProductImage(id, alt) {
  const container = document.getElementById(`img-container-${id}`);
  if (!container || container.dataset.loading === 'true') return;
  container.dataset.loading = 'true';
  
  try {
    const res = await fetch(`http://localhost:5000/api/productos/${id}`);
    if (res.ok) {
      const p = await res.json();
      const localP = allProducts.find(prod => String(prod.id) === String(id));
      if (localP) localP.imagen_url = p.imagen_url;
      container.innerHTML = _getImgHtmlReal(p.imagen_url, alt);
    }
  } catch (e) {}
}

function _getImgHtmlReal(src, alt) {
  if (!src) return `<div style="width:60px;height:60px;background:#f3f4f6;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">💎</div>`;
  const isBase64 = src.length > 30 && !src.includes(' ');
  const hasPrefix = src.startsWith('data:image');
  const isUrl = src.startsWith('http') || src.includes('/') || src.includes('.');
  if (isUrl || hasPrefix) return `<img src="${src}" alt="${alt}" class="product-img" onerror="this.parentElement.innerHTML='💎'" style="width:60px;height:60px;object-fit:cover;border-radius:6px;">`;
  if (isBase64) return `<img src="data:image/png;base64,${src}" alt="${alt}" class="product-img" onerror="this.parentElement.innerHTML='💎'" style="width:60px;height:60px;object-fit:cover;border-radius:6px;">`;
  return `<div style="width:60px;height:60px;background:#f3f4f6;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">💎</div>`;
}

function getProductImageHtml(src, alt, id = null) {
  if (id && (!src || src === '💎')) {
    setTimeout(() => fetchProductImage(id, alt), 50);
    return `<div id="img-container-${id}" class="loading-img" style="width:60px;height:60px;display:flex;align-items:center;justify-content:center;">💎</div>`;
  }
  return _getImgHtmlReal(src, alt);
}

function renderTable(products) {
  const tbody = document.getElementById('productTable');
  if (!products.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#888;">No hay productos aún.</td></tr>`;
    return;
  }
  tbody.innerHTML = products.map(p => `
    <tr data-id="${p.id}">
      <td>${getProductImageHtml(p.imagen_url, p.nombre, p.id)}</td>
      <td>${p.nombre}</td>
      <td>${p.categoria || '—'}</td>
      <td class="gold">RD$ ${Number(p.precio).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
      <td class="${p.stock < 10 ? 'low-stock' : ''}">${p.stock}</td>
      <td>
        <button class="btn btn-edit" onclick="openModal('edit', '${p.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-delete" onclick="deleteProduct('${p.id}')"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function handleSearch(q) {
  const query = q.toLowerCase();
  renderTable(allProducts.filter(p =>
    (p.nombre || '').toLowerCase().includes(query) ||
    (p.categoria || '').toLowerCase().includes(query)
  ));
}

document.querySelector('.actions input[placeholder]')?.addEventListener('input', function() { handleSearch(this.value); });
document.querySelector('header .search-container input')?.addEventListener('input', function() { handleSearch(this.value); });

// Modal
function openModal(mode, productId = null) {
  currentEditId = productId;
  selectedImageBase64 = null;
  removeImageFlag = false;
  document.getElementById('modalTitle').textContent = mode === 'add' ? 'Nuevo Producto' : 'Editar Producto';

  const previewContainer = document.getElementById('imagePreviewContainer');
  const previewImg       = document.getElementById('imagePreview');
  const fileNameDisplay  = document.getElementById('fileNameDisplay');
  const pImagen          = document.getElementById('pImagen');
  const removeBtn        = document.getElementById('removeImageBtn');

  if (pImagen) pImagen.value = '';
  fileNameDisplay.textContent = 'Ningún archivo seleccionado';
  previewContainer.style.display = 'none';
  previewImg.src = '';
  document.getElementById('productForm').reset();

  if (mode === 'edit' && productId) {
    const p = allProducts.find(x => String(x.id) === String(productId));
    if (p) {
      document.getElementById('pNombre').value   = p.nombre    || '';
      document.getElementById('pCategoria').value = p.categoria || '';
      document.getElementById('pPrecio').value   = p.precio    || '';
      document.getElementById('pStock').value    = p.stock     || '';
      document.getElementById('pActivo').value   = p.activo ? 'true' : 'false';
      if (p.imagen_url) {
        previewImg.src = p.imagen_url;
        previewContainer.style.display = 'block';
        fileNameDisplay.textContent = 'Imagen actual';
        removeBtn.style.display = 'block';
      } else {
        removeBtn.style.display = 'none';
      }
    }
  } else {
    removeBtn.style.display = 'none';
  }
  document.getElementById('productModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('productModal').style.display = 'none';
  currentEditId = null;
  selectedImageBase64 = null;
  removeImageFlag = false;
}

window.onclick = function(e) { if (e.target.classList.contains('modal')) closeModal(); };

document.getElementById('pImagen')?.addEventListener('change', function() {
  const file = this.files[0];
  const fileNameDisplay  = document.getElementById('fileNameDisplay');
  const previewContainer = document.getElementById('imagePreviewContainer');
  const previewImg       = document.getElementById('imagePreview');
  if (!file) { if (!selectedImageBase64) { fileNameDisplay.textContent = 'Ningún archivo seleccionado'; previewContainer.style.display = 'none'; } return; }
  fileNameDisplay.textContent = file.name;
  removeImageFlag = false;
  const reader = new FileReader();
  reader.onload = (e) => { selectedImageBase64 = e.target.result; previewImg.src = selectedImageBase64; previewContainer.style.display = 'block'; };
  reader.readAsDataURL(file);
});

document.getElementById('removeImageBtn')?.addEventListener('click', () => {
  selectedImageBase64 = null;
  removeImageFlag = true;
  const pImagen = document.getElementById('pImagen');
  if (pImagen) pImagen.value = '';
  document.getElementById('fileNameDisplay').textContent    = 'Ningún archivo seleccionado';
  document.getElementById('imagePreviewContainer').style.display = 'none';
  document.getElementById('imagePreview').src = '';
});

document.getElementById('productForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    nombre:    document.getElementById('pNombre').value.trim(),
    categoria: document.getElementById('pCategoria').value,
    precio:    parseFloat(document.getElementById('pPrecio').value),
    stock:     parseInt(document.getElementById('pStock').value),
    activo:    document.getElementById('pActivo').value === 'true',
  };
  
  if (selectedImageBase64) {
    data.imagen_url = selectedImageBase64;
  } else if (removeImageFlag) {
    data.imagen_url = null;
  }

  try {
    const method = currentEditId ? 'PUT' : 'POST';
    const url    = currentEditId
      ? `http://localhost:5000/api/productos/${currentEditId}`
      : 'http://localhost:5000/api/productos';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      alert(currentEditId ? '¡Producto actualizado!' : '¡Producto creado exitosamente!');
      // Invalidar caché de productos en empleado y admin
      KoraCache.clear('productos');
      KoraCache.clear('dashboard');
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

async function deleteProduct(id) {
  if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
  try {
    const res = await fetch(`http://localhost:5000/api/productos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert('Producto eliminado.');
      KoraCache.clear('productos');
      KoraCache.clear('dashboard');
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

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeMenu(); } });

loadProducts();