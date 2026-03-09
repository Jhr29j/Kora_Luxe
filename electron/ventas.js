// Menú hamburguesa
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

// ── Productos desde API ────────────────────────────────────────────
let products = [];
let cart = [];
let selectedPayment = "Ninguno seleccionado";

async function loadProducts() {
  try {
    const res = await fetch('http://localhost:5000/api/productos');
    if (!res.ok) throw new Error('Error al cargar productos');
    const dbProducts = await res.json();

    // Mapear campos de la BD al formato del carrito
    products = dbProducts.map(p => ({
      id: p.id,
      name: p.nombre,
      price: Number(p.precio) || 0,
      category: p.categoria || 'Otro',
      stock: p.stock,
      image: '💎'
    }));

    renderProducts();
  } catch(e) {
    console.error(e);
    document.getElementById('productList').innerHTML = '<p>Error al cargar productos. ¿Está el servidor encendido?</p>';
  }
}

// Renderizar productos
function renderProducts() {
  const list = document.getElementById('productList');
  list.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-image">${p.image}</div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price">RD$ ${p.price.toFixed(2)}</div>
        <button class="product-add" onclick="addToCart('${p.id}')">
          <i class="fa-solid fa-plus"></i> Añadir
        </button>
      </div>
    </div>
  `).join('');
}

// Añadir al carrito
function addToCart(id) {
  const product = products.find(p => String(p.id) === String(id));
  const existing = cart.find(item => String(item.id) === String(id));
  
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  
  renderCart();
}

// Cambiar cantidad
function changeQty(id, delta) {
  const item = cart.find(i => String(i.id) === String(id));
  if (item) {
    item.qty = Math.max(1, item.qty + delta);
    if (item.qty === 0) cart = cart.filter(i => String(i.id) !== String(id));
    renderCart();
  }
}

// Renderizar carrito
function renderCart() {
  const itemsDiv = document.getElementById('cartItems');
  itemsDiv.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">RD$ ${item.price.toFixed(2)} x ${item.qty}</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
        <span>${item.qty}</span>
        <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
      </div>
      <div class="cart-item-total">RD$ ${(item.price * item.qty).toFixed(2)}</div>
    </div>
  `).join('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const iva = subtotal * 0.18;
  const total = subtotal + iva;

  document.getElementById('subtotal').textContent = `RD$ ${subtotal.toFixed(2)}`;
  document.getElementById('iva').textContent = `RD$ ${iva.toFixed(2)}`;
  document.getElementById('total').textContent = `RD$ ${total.toFixed(2)}`;
  document.getElementById('cartCount').textContent = `${cart.length} artículo${cart.length !== 1 ? 's' : ''}`;
}

// Seleccionar método de pago
document.querySelectorAll('.payment-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPayment = btn.dataset.method || btn.textContent.trim();
    document.getElementById('selectedPayment').textContent = selectedPayment;
  });
});

// Cerrar venta (con API)
document.getElementById('finishSale').addEventListener('click', async () => {
  if (cart.length === 0) {
    alert("El carrito está vacío.");
    return;
  }
  if (selectedPayment === "Ninguno seleccionado") {
    alert("Selecciona un método de pago.");
    return;
  }

  const totalEl = document.getElementById('total').textContent;
  const totalAmount = parseFloat(totalEl.replace('RD$', '').trim().replaceAll(',',''));

  const saleData = {
    metodo_pago: selectedPayment,
    total: totalAmount,
    items: cart.map(item => ({
      product_id: item.id,
      cantidad: item.qty,
      precio_unitario: item.price
    }))
  };

  try {
    const res = await fetch('http://localhost:5000/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    });

    if (res.ok) {
      alert(`¡Venta registrada!\nTotal: ${totalEl}\nMétodo: ${selectedPayment}`);
      cart = [];
      selectedPayment = "Ninguno seleccionado";
      document.getElementById('selectedPayment').textContent = selectedPayment;
      document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
      renderCart();
    } else {
      const err = await res.json();
      alert(`Error al registrar: ${err.detail}`);
    }
  } catch(e) {
    alert('Error al conectar con el servidor.');
    console.error(e);
  }
});

// Inicializar
loadProducts();
renderCart();

// Cerrar menú con Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMenu();
});