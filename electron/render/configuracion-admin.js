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

// ── Cargar Configuración ─────────────────────────────────────────────
async function loadConfig() {
    try {
        const res = await fetch('http://localhost:5000/api/configuracion');
        if (!res.ok) throw new Error('Error al obtener configuración');
        const data = await res.json();

        // Mapear campos a inputs usando IDs
        if (document.getElementById('confNombre')) document.getElementById('confNombre').value = data.nombre_empresa || '';
        if (document.getElementById('confRNC')) document.getElementById('confRNC').value = data.rnc || '';
        if (document.getElementById('confTelefono')) document.getElementById('confTelefono').value = data.telefono || '';
        if (document.getElementById('confDireccion')) document.getElementById('confDireccion').value = data.direccion || '';
        if (document.getElementById('confEmail')) document.getElementById('confEmail').value = data.email_contacto || '';
        
        if (document.getElementById('confIVA')) document.getElementById('confIVA').value = data.itbis || 18.00;
        if (document.getElementById('confDescuentoMax')) document.getElementById('confDescuentoMax').value = data.descuento_max || 30.00;
        if (document.getElementById('confStockMin')) document.getElementById('confStockMin').value = data.stock_minimo || 5;

    } catch (error) {
        console.error('Error al cargar config:', error);
    }
}

// ── Guardar Configuración ────────────────────────────────────────────
const btnSave = document.querySelector('.btn-save');
btnSave?.addEventListener('click', async () => {
    const data = {
        nombre_empresa: document.getElementById('confNombre').value,
        rnc: document.getElementById('confRNC').value,
        telefono: document.getElementById('confTelefono').value,
        direccion: document.getElementById('confDireccion').value,
        email_contacto: document.getElementById('confEmail').value,
        itbis: parseFloat(document.getElementById('confIVA').value),
        descuento_max: parseFloat(document.getElementById('confDescuentoMax').value),
        stock_minimo: parseInt(document.getElementById('confStockMin').value)
    };

    try {
        const res = await fetch('http://localhost:5000/api/configuracion', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert('¡Configuración guardada exitosamente!');
        } else {
            const err = await res.json();
            alert(`Error al guardar: ${err.detail || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión con el servidor.');
    }
});

// ── Manejo de Tema ───────────────────────────────────────────────────
const themeBtns = document.querySelectorAll('.theme-btn');
themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        setTheme(theme);
    });
});

function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        localStorage.setItem('koraLuxe_theme', 'dark');
    } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('koraLuxe_theme', 'light');
    }
    
    // Actualizar botones UI
    themeBtns.forEach(b => {
        b.classList.toggle('active', b.dataset.theme === theme);
    });
}

// Cargar tema al inicio
const savedTheme = localStorage.getItem('koraLuxe_theme');
if (savedTheme) setTheme(savedTheme);

// Inicializar
loadConfig();
