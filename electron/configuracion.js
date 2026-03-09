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

// Cerrar con Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMenu();
});

// Cambio de tema
const themeButtons = document.querySelectorAll('.theme-btn');
const html = document.documentElement;

themeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const theme = btn.dataset.theme;
    html.setAttribute('data-theme', theme);
    themeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    localStorage.setItem('theme', theme);
  });
});

const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);
document.querySelector(`.theme-btn[data-theme="${savedTheme}"]`)?.classList.add('active');