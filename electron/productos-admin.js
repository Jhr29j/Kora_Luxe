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
  
  function openModal(mode) {
    document.getElementById('modalTitle').textContent = mode === 'add' ? 'Nuevo Producto' : 'Editar Producto';
    document.getElementById('productModal').style.display = 'flex';
  }
  function closeModal() {
    document.getElementById('productModal').style.display = 'none';
  }
  window.onclick = function(e) {
    if (e.target.classList.contains('modal')) closeModal();
  }