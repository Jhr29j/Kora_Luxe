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
let cart = [];
let selectedPayment = "Ninguno seleccionado";

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
    price: Number(p.precio) || 0,
    category: p.categoria || 'Otro',
    stock: p.stock,
    image: p.imagen_url || '💎'
  }));
}

async function loadProducts() {
  // Mostrar caché inmediatamente si existe
  const cached = KoraCache.peek('productos');
  if (cached) {
    products = _mapProducts(cached);
    renderProducts();
  }

  try {
    // 1. Obtener lista ligera (sin imágenes) primero
    const dbProducts = await KoraCache.get('productos', () =>
      fetch('http://localhost:5000/api/productos?include_images=false').then(r => {
        if (!r.ok) throw new Error('Error al cargar productos');
        return r.json();
      })
    );
    products = _mapProducts(dbProducts);
    renderProducts();

    // 2. Cargar imágenes en background para los que están en pantalla (opcional/futuro)
    // Por ahora las cargaremos bajo demanda en el render
  } catch(e) {
    console.error(e);
    if (!cached) {
      document.getElementById('productList').innerHTML = '<p style="padding:1rem;color:#ef4444;">Error al cargar productos.</p>';
    }
  }
}

async function fetchProductImage(id, alt) {
  const container = document.getElementById(`img-container-${id}`);
  if (!container || container.dataset.loading === 'true') return;
  container.dataset.loading = 'true';
  
  try {
    const res = await fetch(`http://localhost:5000/api/productos/${id}`);
    if (!res.ok) throw new Error();
    const p = await res.json();
    
    // Actualizar el objeto local para futuras renderizaciones
    const localP = products.find(prod => prod.id === id);
    if (localP) localP.image = p.imagen_url;

    container.innerHTML = _getProductImageRealHtml(p.imagen_url, alt);
  } catch (e) {
    if (container) container.innerHTML = '💎';
  }
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

function renderProducts() {
  renderFilteredProducts(products);
}

function renderFilteredProducts(list) {
  document.getElementById('productList').innerHTML = list.map(p => `
    <div class="product-card">
      <div class="product-image">${getProductImageHtml(p.image, p.name, p.id)}</div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price">RD$ ${p.price.toFixed(2)}</div>
        <button class="product-add" onclick="addToCart(${p.id})">
          <i class="fa-solid fa-plus"></i> Añadir
        </button>
      </div>
    </div>
  `).join('');
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  const existing = cart.find(item => item.id === id);
  if (existing) { existing.qty += 1; } else { cart.push({ ...product, qty: 1 }); }
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (item) {
    item.qty = Math.max(1, item.qty + delta);
    if (item.qty === 0) cart = cart.filter(i => i.id !== id);
    renderCart();
  }
}

function renderCart() {
  document.getElementById('cartItems').innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">RD$ ${item.price.toFixed(2)} x ${item.qty}</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
        <span>${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
      <div class="cart-item-total">RD$ ${(item.price * item.qty).toFixed(2)}</div>
    </div>
  `).join('');

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const iva      = subtotal * 0.18;
  const total    = subtotal + iva;

  document.getElementById('subtotal').textContent  = `RD$ ${subtotal.toFixed(2)}`;
  document.getElementById('iva').textContent       = `RD$ ${iva.toFixed(2)}`;
  document.getElementById('total').textContent     = `RD$ ${total.toFixed(2)}`;
  document.getElementById('cartCount').textContent = `${cart.length} artículo${cart.length !== 1 ? 's' : ''}`;
}

document.querySelectorAll('.payment-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPayment = btn.dataset.method || btn.textContent.trim();
    document.getElementById('selectedPayment').textContent = selectedPayment;
  });
});

document.getElementById('finishSale').addEventListener('click', async () => {
  if (cart.length === 0) { alert("El carrito está vacío."); return; }
  if (selectedPayment === "Ninguno seleccionado") { alert("Selecciona un método de pago."); return; }

  const totalAmount = parseFloat(document.getElementById('total').textContent.replace(/[^\d.]/g, '')) || 0;
  const userId      = parseInt(localStorage.getItem('koraLuxe_userId'));

  if (!userId || isNaN(userId)) {
    alert("Sesión inválida. Por favor, inicia sesión de nuevo.");
    window.location.href = 'login.html';
    return;
  }

  const buyerName = (document.getElementById('buyerName')?.value || '').trim();

  const saleData = {
    user_id:          userId,
    metodo_pago:      selectedPayment,
    total:            totalAmount,
    nombre_comprador: buyerName || null,
    items: cart.map(item => ({
      product_id:      item.id,
      cantidad:        parseInt(item.qty),
      precio_unitario: parseFloat(item.price)
    }))
  };

  try {
    const res = await fetch('http://localhost:5000/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    });

    if (res.ok) {
      alert(`¡Venta registrada!\nTotal: RD$ ${totalAmount.toFixed(2)}\nMétodo: ${selectedPayment}`);
      // Invalidar caché dinámico para que la próxima visita al dashboard sea fresca
      KoraCache.clear('reporte-hoy');
      KoraCache.clear('dashboard');
      cart = [];
      selectedPayment = "Ninguno seleccionado";
      document.getElementById('selectedPayment').textContent = selectedPayment;
      document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
      renderCart();
    } else {
      const err = await res.json();
      alert(`Error al registrar: ${JSON.stringify(err.detail)}`);
    }
  } catch(e) {
    alert('Error al conectar con el servidor.');
    console.error(e);
  }
});

document.getElementById('searchProduct')?.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  renderFilteredProducts(products.filter(p =>
    p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  ));
});

loadProducts();
renderCart();
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });