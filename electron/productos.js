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

// Tus productos (los que me diste)
const products = [
    { id: 1, name: "Antique Bangles", category: "all", mainCategory: "Brazaletes", subcategory: "Brazaletes Antiguos", price: 450.00, currency: "RD$", image: "📿", categoryFilter: "bangles" },
    { id: 2, name: "Sparkling Tikka", category: "all", mainCategory: "Joyería", subcategory: "Tikka", price: 650.00, currency: "RD$", image: "✨", categoryFilter: "jewellery" },
    { id: 3, name: "Silver Pendant", category: "all", mainCategory: "Joyería", subcategory: "Collares", price: 700.00, currency: "RD$", image: "🔮", categoryFilter: "jewellery" },
    { id: 4, name: "Zircon Bangles", category: "all", mainCategory: "Brazaletes", subcategory: "Brazaletes de Zirconio", price: 489.00, currency: "RD$", image: "💫", categoryFilter: "bangles" },
    { id: 5, name: "Collar infinito", category: "jewellery", mainCategory: "Joyería", subcategory: "Collares", price: 1500.00, currency: "RD$", image: "📿", categoryFilter: "jewellery" },
    { id: 6, name: "Collar cruz plateada", category: "jewellery", mainCategory: "Joyería", subcategory: "Collares", price: 1700.00, currency: "RD$", image: "💎", categoryFilter: "jewellery" },
    { id: 7, name: "Collar nombre personalizado", category: "jewellery", mainCategory: "Joyería", subcategory: "Collares Personalizados", price: 2500.00, currency: "RD$", image: "✨", categoryFilter: "jewellery" },
    { id: 8, name: "Aretes aro grandes", category: "jewellery", mainCategory: "Joyería", subcategory: "Aretes Grandes", price: 950.00, currency: "RD$", image: "👑", categoryFilter: "jewellery" },
    { id: 9, name: "Aretes brillantes zirconia", category: "jewellery", mainCategory: "Joyería", subcategory: "Aretes brillante", price: 1400.00, currency: "RD$", image: "👑", categoryFilter: "jewellery" },
    { id: 10, name: "Aretes colgantes elegantes", category: "jewellery", mainCategory: "Joyería", subcategory: "Aretes Elegantes", price: 1650.00, currency: "RD$", image: "👑", categoryFilter: "jewellery" },
    { id: 11, name: "Pulsera charms", category: "bangles", mainCategory: "Brazaletes", subcategory: "Pulseras", price: 2000.00, currency: "RD$", image: "📿", categoryFilter: "bangles" },
    { id: 12, name: "Pulsera perlas", category: "bangles", mainCategory: "Brazaletes", subcategory: "Pulseras", price: 1300.00, currency: "RD$", image: "💫", categoryFilter: "bangles" },
    { id: 13, name: "Pulsera magnética", category: "bangles", mainCategory: "Brazaletes", subcategory: "Pulseras", price: 1800.00, currency: "RD$", image: "🔮", categoryFilter: "bangles" },
    { id: 14, name: "Reloj metálico dorado", category: "bangles", mainCategory: "Brazaletes", subcategory: "Relojes", price: 5200.00, currency: "RD$", image: "✨", categoryFilter: "bangles" },
    { id: 15, name: "Reloj femenino elegante", category: "bangles", mainCategory: "Brazaletes", subcategory: "Relojes", price: 4800.00, currency: "RD$", image: "👑", categoryFilter: "bangles" },
    { id: 16, name: "Anillo compromiso zirconia", category: "rings", mainCategory: "Anillos", subcategory: "Anillos de compromiso", price: 2800.00, currency: "RD$", image: "⚫", categoryFilter: "rings" },
    { id: 17, name: "Anillo triple banda", category: "rings", mainCategory: "Anillos", subcategory: "Anillos", price: 1600.00, currency: "RD$", image: "🌈", categoryFilter: "rings" },
    { id: 18, name: "Anillo ajustable minimalista", category: "rings", mainCategory: "Anillos", subcategory: "Anillos", price: 900.00, currency: "RD$", image: "💛", categoryFilter: "rings" },
    { id: 19, name: "Set collar y aretes corazón", category: "conjunto", mainCategory: "Conjuntos", subcategory: "Conjunto de Corazon", price: 3200.00, currency: "RD$", image: "⚙️", categoryFilter: "conjunto" },
    { id: 20, name: "Set joyería perla", category: "conjunto", mainCategory: "Conjuntos", subcategory: "Conjunto", price: 3900.00, currency: "RD$", image: "⚙️", categoryFilter: "conjunto" },
    { id: 21, name: "Broche decorativo elegante", category: "premium", mainCategory: "premium", subcategory: "Broche Elegante", price: 1100.00, currency: "RD$", image: "⚙️", categoryFilter: "premium" },
    { id: 22, name: "Set joyería perla", category: "premium", mainCategory: "premium", subcategory: "Joyeria", price: 2600.00, currency: "RD$", image: "⚙️", categoryFilter: "premium" }
];

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
displayProducts();

// Cerrar menú con Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMenu();
});