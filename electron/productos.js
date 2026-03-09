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

let products = [];

async function fetchProducts() {
    try {
        const response = await fetch('http://localhost:5000/api/productos');
        if (!response.ok) throw new Error('Error al obtener productos');
        const dbProducts = await response.json();
        
        // Mapear el formato de la Base de Datos al formato que el HTML necesita
        products = dbProducts.map(p => ({
            id: p.id,
            name: p.nombre,
            category: "all",
            mainCategory: p.categoria || "Joyería",
            subcategory: p.categoria || "Accesorio",
            categoryFilter: (p.categoria || "").toLowerCase(),
            price: Number(p.precio) || 0,
            currency: "RD$",
            image: "💎",
            stock: p.stock
        }));

        // Llamar a displayProducts solo cuando los datos hayan cargado
        displayProducts();
    } catch (error) {
        console.error('Error fetching productos:', error);
        productsGrid.innerHTML = `
            <div class="no-results">
                <h3>Error de conexión. ¿El servidor está encendido?</h3>
            </div>
        `;
    }
}

// Estado actual
let currentCategory = 'all';
let currentSearchTerm = '';

// Función para mostrar productos
function displayProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const resultsCount = document.getElementById('resultsCount');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    let filteredProducts = products;
    
    if (currentCategory !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.categoryFilter === currentCategory);
    }
    
    if (currentSearchTerm) {
        const searchTermLower = currentSearchTerm.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchTermLower) ||
            p.mainCategory.toLowerCase().includes(searchTermLower) ||
            p.subcategory.toLowerCase().includes(searchTermLower)
        );
    }
    
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-results">
                <span class="emoji">🔍</span>
                <h3>No se encontraron productos</h3>
                <p>Intenta con otros términos de búsqueda</p>
            </div>
        `;
    } else {
        productsGrid.innerHTML = filteredProducts.map(product => `
            <div class="product-card">
                <div class="product-image">${product.image}</div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${product.currency} ${product.price.toFixed(2)}</div>
                    <div class="product-category">${product.mainCategory} • ${product.subcategory}</div>
                </div>
            </div>
        `).join('');
    }
    
    resultsCount.textContent = `Mostrando ${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''}`;
    
    if (currentSearchTerm) {
        clearSearchBtn.style.display = 'inline';
    } else {
        clearSearchBtn.style.display = 'none';
    }
}

// Filtros
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

// Inicializar
fetchProducts();

// Cerrar menú con Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMenu();
});