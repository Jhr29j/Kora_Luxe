// Toggle menú hamburguesa
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

// Opcional: cerrar con tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMenu();
  }
});

// Cargar datos del dashboard si estamos en la página principal
async function loadDashboardCards() {
  try {
    const res = await fetch('http://localhost:5000/api/dashboard');
    if (!res.ok) throw new Error('Error al cargar dashboard');
    const data = await res.json();

    // Actualizar tarjetas numéricas
    const elIngresos = document.getElementById('statIngresos');
    if (elIngresos) {
      elIngresos.textContent = '$' + Number(data.ingresos_totales).toLocaleString('es-DO', {minimumFractionDigits: 2});
    }

    const elVentasHoy = document.getElementById('statVentasHoy');
    if (elVentasHoy) elVentasHoy.textContent = '$' + Number(data.ingresos_totales).toLocaleString('es-DO'); // TODO: Ventas Hoy reales
    
    const elStock = document.getElementById('statStockBajo');
    if (elStock) elStock.textContent = data.stock_bajo;
    
    const elUsuarios = document.getElementById('statUsuarios');
    if (elUsuarios) elUsuarios.textContent = data.usuarios;

    // Actualizar tabla de últimos productos
    const tbody = document.getElementById('recentProductsTable');
    if (tbody && data.recent_products) {
      if (data.recent_products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888;">No hay productos recientes</td></tr>';
      } else {
        tbody.innerHTML = data.recent_products.map(p => {
          // Formateo de fecha rápido
          const d = p.created_at ? new Date(p.created_at).toLocaleDateString('es-ES') : 'N/A';
          return `
            <tr>
              <td>${p.nombre}</td>
              <td>${p.categoria || '—'}</td>
              <td>$${Number(p.precio).toLocaleString('es-DO', {minimumFractionDigits: 2})}</td>
              <td>${p.stock}</td>
              <td>${d}</td>
            </tr>
          `;
        }).join('');
      }
    }

  } catch (error) {
    console.error('Error cargando dashboard:', error);
    const tbody = document.getElementById('recentProductsTable');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error conectando al servidor</td></tr>';
  }
}

// Inicializar si estamos en la pantalla que tiene el ID statIngresos
if (document.getElementById('statIngresos')) {
  loadDashboardCards();
}

// ── Reporte Diario ───────────────────────────────────────────────────
const btnReporte = document.getElementById('btnReporteDiario');
const modalReporte = document.getElementById('modalReporte');
const closeReporte = document.getElementById('closeReporte');
const reporteContent = document.getElementById('reporteContent');

btnReporte?.addEventListener('click', async () => {
  modalReporte.style.display = 'flex';
  reporteContent.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Cargando reporte...</p>';
  
  try {
    const res = await fetch('http://localhost:5000/api/reporte-diario');
    if (!res.ok) throw new Error('Error al cargar reporte');
    const data = await res.json();
    
    renderReporte(data);
  } catch (error) {
    reporteContent.innerHTML = `<p style="text-align: center; color: red; padding: 2rem;">Error: ${error.message}</p>`;
  }
});

closeReporte?.addEventListener('click', () => {
  modalReporte.style.display = 'none';
});

function renderReporte(data) {
  const metodosStr = Object.entries(data.metodos_pago)
    .map(([m, val]) => `<li><strong>${m}:</strong> RD$ ${val.toLocaleString('es-DO')}</li>`)
    .join('') || '<li>No hay ventas registradas.</li>';

  reporteContent.innerHTML = `
    <div style="padding: 1rem; color: #333;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; background: #f8fafc; padding: 1.5rem; border-radius: 10px; border: 1px solid #e2e8f0;">
        <div>
          <p style="color: #64748b; margin-bottom: 4px;">Total del día</p>
          <h2 style="font-size: 1.8rem; color: #1A3263;">RD$ ${data.total_venta.toLocaleString('es-DO')}</h2>
        </div>
        <div>
          <p style="color: #64748b; margin-bottom: 4px;">Cantidad de Ventas</p>
          <h2 style="font-size: 1.8rem; color: #1A3263;">${data.conteo_ventas}</h2>
        </div>
      </div>
      
      <h3><i class="fa-solid fa-credit-card"></i> Desglose por Método de Pago</h3>
      <ul style="list-style: none; padding: 0; margin: 1rem 0 2rem;">
        ${metodosStr}
      </ul>

      <h3><i class="fa-solid fa-list-check"></i> Detalle de Transacciones</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9rem;">
        <thead>
          <tr style="background: #e2e8f0;">
            <th style="padding: 8px; text-align: left;">Hora</th>
            <th style="padding: 8px; text-align: left;">Método</th>
            <th style="padding: 8px; text-align: right;">Monto</th>
          </tr>
        </thead>
        <tbody>
          ${data.ventas.map(v => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${new Date(v.created_at).toLocaleTimeString('es-DO', {hour:'2-digit', minute:'2-digit'})}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${v.metodo_pago}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">$${v.total.toLocaleString('es-DO')}</td>
            </tr>
          `).join('')}
          ${data.ventas.length === 0 ? '<tr><td colspan="3" style="text-align:center; padding: 20px; color: #888;">No hubo movimientos hoy.</td></tr>' : ''}
        </tbody>
      </table>
    </div>
  `;
}