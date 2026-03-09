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

let products = [];
let currentCategory = 'all';
let currentSearchTerm = '';

function getProductImageHtml(src, alt) {
  if (!src || src === '💎') return '💎';
  const isBase64 = src.length > 30 && !src.includes(' ');
  const hasPrefix = src.startsWith('data:image');
  const isUrl = src.startsWith('http') || src.includes('/') || src.includes('.');
  if (isUrl || hasPrefix) return `<img src="${src}" alt="${alt}" onerror="this.parentElement.innerHTML='💎'" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
  if (isBase64) return `<img src="data:image/png;base64,${src}" alt="${alt}" onerror="this.parentElement.innerHTML='💎'" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
  return src;
}

function _mapProducts(dbProducts) {
  return dbProducts.map(p => ({
    id: p.id,
    name: p.nombre,
    mainCategory: p.categoria || "Joyería",
    subcategory: p.categoria || "Accesorio",
    categoryFilter: (p.categoria || "").toLowerCase(),
    price: Number(p.precio) || 0,
    currency: "RD$",
    image: p.imagen_url || "💎",
    stock: p.stock
  }));
}

async function fetchProducts() {
  // Mostrar caché inmediatamente si existe (carga instantánea)
  const cached = KoraCache.peek('productos');
  if (cached) {
    products = _mapProducts(cached);
    displayProducts();
  }

  try {
    // 1. Obtener lista ligera (sin imágenes) primero
    const dbProducts = await KoraCache.get('productos', () =>
      fetch('http://localhost:5000/api/productos?include_images=false').then(r => {
        if (!r.ok) throw new Error('Error al obtener productos');
        return r.json();
      })
    );
    products = _mapProducts(dbProducts);
    displayProducts();
  } catch (error) {
    console.error('Error fetching productos:', error);
    if (!cached) {
      document.getElementById('productsGrid').innerHTML = `
        <div class="no-results"><h3>Error de conexión. ¿El servidor está encendido?</h3></div>
      `;
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
      const localP = products.find(prod => prod.id === id);
      if (localP) localP.image = p.imagen_url;
      container.innerHTML = _getProductImageRealHtml(p.imagen_url, alt);
    }
  } catch (e) {}
}

function _getProductImageRealHtml(src, alt) {
  if (!src || src === '💎') return '💎';
  const isBase64 = src.length > 30 && !src.includes(' ');
  const hasPrefix = src.startsWith('data:image');
  const isUrl = src.startsWith('http') || src.includes('/') || src.includes('.');
  if (isUrl || hasPrefix) return `<img src="${src}" alt="${alt}" onerror="this.parentElement.innerHTML='💎'" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
  if (isBase64) return `<img src="data:image/png;base64,${src}" alt="${alt}" onerror="this.parentElement.innerHTML='💎'" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
  return src;
}

function getProductImageHtml(src, alt, id = null) {
  if (id && (!src || src === '💎')) {
    setTimeout(() => fetchProductImage(id, alt), 50);
    return `<div id="img-container-${id}" class="loading-img" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">💎</div>`;
  }
  return _getProductImageRealHtml(src, alt);
}

function displayProducts() {
  const productsGrid  = document.getElementById('productsGrid');
  const resultsCount  = document.getElementById('resultsCount');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  let filtered = products;
  if (currentCategory !== 'all') {
    filtered = filtered.filter(p => p.categoryFilter === currentCategory);
  }
  if (currentSearchTerm) {
    const q = currentSearchTerm.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.mainCategory.toLowerCase().includes(q) ||
      p.subcategory.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    productsGrid.innerHTML = `
      <div class="no-results">
        <span class="emoji">🔍</span>
        <h3>No se encontraron productos</h3>
        <p>Intenta con otros términos de búsqueda</p>
      </div>
    `;
  } else {
    productsGrid.innerHTML = filtered.map(p => `
      <div class="product-card">
        <div class="product-image">${getProductImageHtml(p.image, p.name, p.id)}</div>
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-price">${p.currency} ${p.price.toFixed(2)}</div>
          <div class="product-category">${p.mainCategory} • ${p.subcategory}</div>
        </div>
      </div>
    `).join('');
  }

  resultsCount.textContent = `Mostrando ${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`;
  clearSearchBtn.style.display = currentSearchTerm ? 'inline' : 'none';
}

function filterByCategory(category) {
  currentCategory = category;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.toLowerCase().includes(category) || (category === 'all' && btn.textContent === 'Todos')) {
      btn.classList.add('active');
    }
  });
  displayProducts();
}

function filterProducts() {
  currentSearchTerm = document.getElementById('searchInput').value;
  displayProducts();
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  currentSearchTerm = '';
  displayProducts();
}

document.querySelector('header .search-container input')?.addEventListener('input', (e) => {
  document.getElementById('searchInput').value = e.target.value;
  filterProducts();
});

fetchProducts();
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });