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

// Simulación de productos
const products = [
  { id: 1, name: "Anillo compromiso zirconia", price: 2800, category: "Anillos", image: "💍" },
  { id: 2, name: "Collar infinito", price: 1500, category: "Collares", image: "📿" },
  { id: 3, name: "Pulsera charms", price: 2000, category: "Pulseras", image: "⌚" },
  { id: 4, name: "Aretes aro grandes", price: 950, category: "Aretes", image: "👂" },
  // Agrega más si quieres...
];

let cart = [];
let selectedPayment = "Ninguno seleccionado";

// Renderizar productos
function renderProducts() {
  const list = document.getElementById('productList');
  list.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-image">${p.image}</div>
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

// Añadir al carrito
function addToCart(id) {
  const product = products.find(p => p.id === id);
  const existing = cart.find(item => item.id === id);
  
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  
  renderCart();
}

// Cambiar cantidad
function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (item) {
    item.qty = Math.max(1, item.qty + delta);
    if (item.qty === 0) cart = cart.filter(i => i.id !== id);
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
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
        <span>${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
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

// Cerrar venta (simulado)
document.getElementById('finishSale').addEventListener('click', () => {
  if (cart.length === 0) {
    alert("El carrito está vacío.");
    return;
  }
  if (selectedPayment === "Ninguno seleccionado") {
    alert("Selecciona un método de pago.");
    return;
  }

  const total = document.getElementById('total').textContent;
  alert(`Venta cerrada exitosamente!\nTotal: ${total}\nMétodo: ${selectedPayment}\nGracias por tu compra.`);

  // Limpiar carrito después de cerrar
  cart = [];
  selectedPayment = "Ninguno seleccionado";
  document.getElementById('selectedPayment').textContent = selectedPayment;
  document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
  renderCart();
});

// Inicializar
renderProducts();
renderCart();

// Cerrar menú con Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMenu();
});