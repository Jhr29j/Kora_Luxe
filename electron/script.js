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

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

// ── Dashboard admin ───────────────────────────────────────────────────
async function loadDashboardCards() {
  // Mostrar caché de inmediato si existe
  const cached = KoraCache.peek('dashboard');
  if (cached) _renderDashboard(cached);

  try {
    const data = await KoraCache.get('dashboard', () =>
      fetch('http://localhost:5000/api/dashboard').then(r => {
        if (!r.ok) throw new Error('Error al cargar dashboard');
        return r.json();
      })
    );
    _renderDashboard(data);
  } catch (error) {
    console.error('Error cargando dashboard:', error);
    const tbody = document.getElementById('recentProductsTable');
    if (tbody && !cached) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">Error conectando al servidor</td></tr>';
    }
  }
}

function _renderDashboard(data) {
  const elIngresos = document.getElementById('statIngresos');
  if (elIngresos) elIngresos.textContent = 'RD$ ' + Number(data.ingresos_totales).toLocaleString('es-DO', { minimumFractionDigits: 2 });

  const elVentasHoy = document.getElementById('statVentasHoy');
  if (elVentasHoy) elVentasHoy.textContent = 'RD$ ' + Number(data.ingresos_totales).toLocaleString('es-DO');

  const elStock = document.getElementById('statStockBajo');
  if (elStock) elStock.textContent = data.stock_bajo;

  const elUsuarios = document.getElementById('statUsuarios');
  if (elUsuarios) elUsuarios.textContent = data.usuarios;

  const tbody = document.getElementById('recentProductsTable');
  if (tbody && data.recent_products) {
    if (data.recent_products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">No hay productos recientes</td></tr>';
    } else {
      tbody.innerHTML = data.recent_products.map(p => {
        const d = p.created_at ? new Date(p.created_at).toLocaleDateString('es-ES') : 'N/A';
        const imgHtml = _getImgHtml(p.imagen_url, p.nombre, p.id);
        return `<tr>
          <td>${imgHtml}</td>
          <td>${p.nombre}</td>
          <td>${p.categoria || '—'}</td>
          <td>RD$ ${Number(p.precio).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
          <td>${p.stock}</td>
          <td>${d}</td>
        </tr>`;
      }).join('');
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
      container.innerHTML = _getImgHtmlReal(p.imagen_url, alt);
    }
  } catch (e) {}
}

function _getImgHtmlReal(src, alt) {
  if (!src || src === '💎') return '💎';
  const isBase64 = src.length > 30 && !src.includes(' ');
  const hasPrefix = src.startsWith('data:image');
  const isUrl = src.startsWith('http') || src.includes('/') || src.includes('.');
  if (isUrl || hasPrefix) return `<img src="${src}" alt="${alt}" onerror="this.parentElement.innerHTML='💎'" style="width:40px;height:40px;object-fit:cover;border-radius:6px;">`;
  if (isBase64) return `<img src="data:image/png;base64,${src}" alt="${alt}" onerror="this.parentElement.innerHTML='💎'" style="width:40px;height:40px;object-fit:cover;border-radius:6px;">`;
  return src;
}

function _getImgHtml(src, alt, id = null) {
  if (id && (!src || src === '💎')) {
    setTimeout(() => fetchProductImage(id, alt), 50);
    return `<div id="img-container-${id}" class="loading-img" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;">💎</div>`;
  }
  return _getImgHtmlReal(src, alt);
}

if (document.getElementById('statIngresos')) {
  loadDashboardCards();
}

// ── Reporte Diario ───────────────────────────────────────────────────
const btnReporte    = document.getElementById('btnReporteDiario');
const modalReporte  = document.getElementById('modalReporte');
const closeReporte  = document.getElementById('closeReporte');
const reporteContent = document.getElementById('reporteContent');

btnReporte?.addEventListener('click', async () => {
  modalReporte.style.display = 'flex';
  reporteContent.innerHTML = '<p style="text-align:center;color:#666;padding:2rem;">Cargando reporte...</p>';

  try {
    const data = await KoraCache.get('reporte-hoy', () =>
      fetch('http://localhost:5000/api/reporte-diario').then(r => {
        if (!r.ok) throw new Error('Error al cargar reporte');
        return r.json();
      })
    );
    _renderReporte(data);
  } catch (error) {
    reporteContent.innerHTML = `<p style="text-align:center;color:red;padding:2rem;">Error: ${error.message}</p>`;
  }
});

closeReporte?.addEventListener('click', () => { modalReporte.style.display = 'none'; });

function _renderReporte(data) {
  const metodosStr = Object.entries(data.metodos_pago)
    .map(([m, val]) => `<li><strong>${m}:</strong> RD$ ${val.toLocaleString('es-DO')}</li>`)
    .join('') || '<li>No hay ventas registradas.</li>';

  reporteContent.innerHTML = `
    <div style="padding:1rem;color:#333;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:2rem;background:#f8fafc;padding:1.5rem;border-radius:10px;border:1px solid #e2e8f0;">
        <div>
          <p style="color:#64748b;margin-bottom:4px;">Total del día</p>
          <h2 style="font-size:1.8rem;color:#1A3263;">RD$ ${data.total_venta.toLocaleString('es-DO')}</h2>
        </div>
        <div>
          <p style="color:#64748b;margin-bottom:4px;">Cantidad de Ventas</p>
          <h2 style="font-size:1.8rem;color:#1A3263;">${data.conteo_ventas}</h2>
        </div>
      </div>
      <h3><i class="fa-solid fa-credit-card"></i> Desglose por Método de Pago</h3>
      <ul style="list-style:none;padding:0;margin:1rem 0 2rem;">${metodosStr}</ul>
      <h3><i class="fa-solid fa-list-check"></i> Detalle de Transacciones</h3>
      <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:0.9rem;">
        <thead><tr style="background:#e2e8f0;">
          <th style="padding:8px;text-align:left;">Hora</th>
          <th style="padding:8px;text-align:left;">Método</th>
          <th style="padding:8px;text-align:right;">Monto</th>
        </tr></thead>
        <tbody>
          ${data.ventas.map(v => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${new Date(v.created_at).toLocaleTimeString('es-DO', { hour:'2-digit', minute:'2-digit' })}</td>
              <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${v.metodo_pago}</td>
              <td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;">RD$ ${v.total.toLocaleString('es-DO')}</td>
            </tr>
          `).join('')}
          ${data.ventas.length === 0 ? '<tr><td colspan="3" style="text-align:center;padding:20px;color:#888;">No hubo movimientos hoy.</td></tr>' : ''}
        </tbody>
      </table>
    </div>
  `;
}

// ── Descargar PDF del Reporte ─────────────────────────────────────────
async function descargarPDF() {
  const btn = document.getElementById('btnDescargarPDF');
  const original = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';
  btn.disabled = true;

  try {
    const { jsPDF } = window.jspdf;
    const content = document.getElementById('reporteContent');

    const canvas = await html2canvas(content, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 15;

    // Encabezado azul Kora Luxe
    pdf.setFillColor(26, 50, 99);
    pdf.rect(0, 0, pageW, 22, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('KORA LUXE JOYERÍA', margin, 13);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const fecha = new Date().toLocaleDateString('es-DO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    pdf.text('Reporte Diario — ' + fecha, pageW - margin, 13, { align: 'right' });

    // Contenido del modal como imagen
    const imgW  = pageW - margin * 2;
    const imgH  = (canvas.height * imgW) / canvas.width;
    const maxH  = pageH - 28 - margin;
    pdf.addImage(imgData, 'PNG', margin, 28, imgW, imgH > maxH ? maxH : imgH);

    // Pie de página
    pdf.setFillColor(248, 249, 252);
    pdf.rect(0, pageH - 12, pageW, 12, 'F');
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(8);
    pdf.text('Generado por Kora Luxe POS', margin, pageH - 5);
    pdf.text('Página 1 de 1', pageW - margin, pageH - 5, { align: 'right' });

    const dateStr = new Date().toISOString().slice(0, 10);
    pdf.save('reporte-diario-' + dateStr + '.pdf');

  } catch (e) {
    console.error('Error generando PDF:', e);
    alert('Error al generar el PDF. Por favor intenta de nuevo.');
  } finally {
    btn.innerHTML = original;
    btn.disabled = false;
  }
}