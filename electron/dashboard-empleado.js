document.addEventListener("DOMContentLoaded", async () => {
  const debug = (msg) => {
    console.log(msg);
    const logs = JSON.parse(localStorage.getItem('kora_debug_logs') || '[]');
    logs.push(`${new Date().toISOString()}: ${msg}`);
    localStorage.setItem('kora_debug_logs', JSON.stringify(logs.slice(-50)));
  };

  debug("DOMLoaded - dashboard-empleado.js starting");

  if (typeof KoraCache === 'undefined') {
    debug("CRITICAL: KoraCache is UNDEFINED");
    return;
  }
  debug("KoraCache is defined");

  // Variable para almacenar las ventas actuales
  let ventasActuales = [];

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
    if (isUrl || hasPrefix) return `<img src="${src}" alt="${alt}" onerror="this.parentElement.innerHTML='💎'" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
    if (isBase64) return `<img src="data:image/png;base64,${src}" alt="${alt}" onerror="this.parentElement.innerHTML='💎'" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
    return src;
  }

  function getProductImageHtml(src, alt, id = null) {
    if (id && (!src || src === '💎')) {
      setTimeout(() => fetchProductImage(id, alt), 100);
      return `<div id="img-container-${id}" class="loading-img" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">💎</div>`;
    }
    return _getImgHtmlReal(src, alt);
  }

  // Función para mostrar el modal de detalle de venta
  function showSaleDetailModal(venta) {
    // Crear el modal si no existe
    let modal = document.getElementById('saleDetailModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'saleDetailModal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2>Detalle de Venta</h2>
            <span class="close-modal">&times;</span>
          </div>
          <div class="modal-body">
            <div class="sale-info">
              <p><strong>Venta ID:</strong> <span id="modal-sale-id"></span></p>
              <p><strong>Fecha:</strong> <span id="modal-sale-date"></span></p>
              <p><strong>Cliente:</strong> <span id="modal-sale-client"></span></p>
              <p><strong>Vendedor:</strong> <span id="modal-sale-seller"></span></p>
              <p><strong>Método de pago:</strong> <span id="modal-sale-payment"></span></p>
              <p><strong>Total:</strong> <span id="modal-sale-total"></span></p>
            </div>
            <h3>Productos</h3>
            <table class="products-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody id="modal-products-body"></tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="text-align: right;"><strong>Total:</strong></td>
                  <td id="modal-sale-total-footer"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Estilos del modal
      const style = document.createElement('style');
      style.textContent = `
        .modal {
          display: none;
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.5);
        }
        .modal-content {
          background-color: #fff;
          margin: 5% auto;
          padding: 20px;
          border-radius: 10px;
          width: 80%;
          max-width: 800px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #d4af37;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .modal-header h2 {
          margin: 0;
          color: #333;
        }
        .close-modal {
          color: #aaa;
          font-size: 28px;
          font-weight: bold;
          cursor: pointer;
        }
        .close-modal:hover {
          color: #d4af37;
        }
        .sale-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        .sale-info p {
          margin: 5px 0;
        }
        .sale-info strong {
          color: #d4af37;
        }
        .products-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .products-table th {
          background-color: #d4af37;
          color: white;
          padding: 10px;
          text-align: left;
        }
        .products-table td {
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }
        .products-table tfoot td {
          font-weight: bold;
          background-color: #f8f9fa;
        }
      `;
      document.head.appendChild(style);

      // Cerrar modal al hacer clic en la X
      modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.style.display = 'none';
      });

      // Cerrar modal al hacer clic fuera
      window.addEventListener('click', (event) => {
        if (event.target === modal) {
          modal.style.display = 'none';
        }
      });
    }

    // Formatear fecha correctamente
    const fechaVenta = new Date(venta.created_at);
    const fechaFormateada = fechaVenta.toLocaleDateString('es-DO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Llenar el modal con los datos de la venta
    document.getElementById('modal-sale-id').textContent = venta.id;
    document.getElementById('modal-sale-date').textContent = fechaFormateada;
    document.getElementById('modal-sale-client').textContent = venta.nombre_comprador || 'Consumidor Final';
    document.getElementById('modal-sale-seller').textContent = venta.vendedor || 'Desconocido';
    document.getElementById('modal-sale-payment').textContent = venta.metodo_pago;
    document.getElementById('modal-sale-total').textContent = `RD$ ${Number(venta.total).toLocaleString()}`;
    document.getElementById('modal-sale-total-footer').textContent = `RD$ ${Number(venta.total).toLocaleString()}`;

    // Llenar la tabla de productos
    const tbody = document.getElementById('modal-products-body');
    if (venta.productos && venta.productos.length > 0) {
      tbody.innerHTML = venta.productos.map(p => `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.categoria || 'General'}</td>
          <td>${p.cantidad}</td>
          <td>RD$ ${Number(p.precio_unitario).toLocaleString()}</td>
          <td>RD$ ${Number(p.subtotal).toLocaleString()}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay productos en esta venta</td></tr>';
    }

    // Mostrar el modal
    modal.style.display = 'block';
  }

  // Función para cargar detalles de una venta específica
  async function loadSaleDetails(saleId) {
    try {
      const response = await fetch(`http://localhost:5000/api/ventas/${saleId}`);
      if (response.ok) {
        const venta = await response.json();
        showSaleDetailModal(venta);
      } else {
        console.error('Error al cargar detalles de la venta');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Función para descargar PDF del reporte
  window.descargarPDFEmpleado = async function() {
    const btn = document.getElementById('btnDescargarPDFEmpleado');
    if (!btn) return;
    
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';
    btn.disabled = true;

    try {
      const { jsPDF } = window.jspdf;
      const content = document.getElementById('reporteContentEmpleado');

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

      // Obtener nombre del empleado
      const userName = localStorage.getItem("koraLuxe_userName") || "Empleado";

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
      pdf.text(`Reporte Diario — ${fecha}`, pageW - margin, 13, { align: 'right' });
      
      // Agregar nombre del empleado
      pdf.setFontSize(8);
      pdf.text(`Vendedor: ${userName}`, margin, 20);

      // Contenido del modal como imagen
      const imgW  = pageW - margin * 2;
      const imgH  = (canvas.height * imgW) / canvas.width;
      const maxH  = pageH - 32 - margin;
      pdf.addImage(imgData, 'PNG', margin, 28, imgW, imgH > maxH ? maxH : imgH);

      // Pie de página
      pdf.setFillColor(248, 249, 252);
      pdf.rect(0, pageH - 12, pageW, 12, 'F');
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(8);
      pdf.text('Generado por Kora Luxe POS', margin, pageH - 5);
      pdf.text('Página 1 de 1', pageW - margin, pageH - 5, { align: 'right' });

      const dateStr = new Date().toISOString().slice(0, 10);
      pdf.save(`reporte-diario-${userName}-${dateStr}.pdf`);

    } catch (e) {
      console.error('Error generando PDF:', e);
      alert('Error al generar el PDF. Por favor intenta de nuevo.');
    } finally {
      btn.innerHTML = original;
      btn.disabled = false;
    }
  };

  // ── Nombre y fecha (instantáneos) ────────────
  const userName = localStorage.getItem("koraLuxe_userName");
  if (userName) {
    const el = document.querySelector(".welcome-row h1");
    if (el) el.textContent = `Bienvenido, ${userName}`;
    const nameEl = document.getElementById("loggedUserName");
    if (nameEl) nameEl.textContent = userName;
  }

  const dateEl = document.querySelector(".date");
  if (dateEl) {
    dateEl.textContent = "Hoy, " + new Date().toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // ── Mostrar datos cacheados PRIMERO ─────────────
  const userId = parseInt(localStorage.getItem("koraLuxe_userId")) || null;
  const reporteCacheKey = `reporte-hoy-${userId}`;
  const mesCacheKey     = `ventas-mes-${userId}`;
  
  KoraCache.clear(mesCacheKey);

  debug("Peeking cache...");
  const cachedDash    = KoraCache.peek('dashboard');
  const cachedProds   = KoraCache.peek('productos');
  const cachedReporte = KoraCache.peek(reporteCacheKey);
  const cachedMes     = KoraCache.peek(mesCacheKey);
  debug(`Cache peek: dash=${!!cachedDash}, prods=${!!cachedProds}, rep=${!!cachedReporte}, mes=${!!cachedMes}`);

  if (cachedDash)    _renderStockBajo(cachedDash);
  if (cachedReporte) { 
    _renderStatsSales(cachedReporte); 
    ventasActuales = cachedReporte.ventas || [];
    _renderVentas(ventasActuales); 
  }
  if (cachedMes)     _renderMes(cachedMes);
  if (cachedProds)   _renderFeatured(cachedProds, getProductImageHtml);

  debug("Starting fresh fetch in parallel...");
  try {
    const [dashData, products, reporteData, mesData] = await Promise.all([
      KoraCache.get('dashboard',     () => fetch("http://localhost:5000/api/dashboard").then(r => r.ok ? r.json() : null)),
      KoraCache.get('productos',     () => fetch("http://localhost:5000/api/productos?include_images=false").then(r => r.ok ? r.json() : [])),
      KoraCache.get(reporteCacheKey, () => fetch(`http://localhost:5000/api/reporte-diario?user_id=${userId}`).then(r => r.ok ? r.json() : null)),
      KoraCache.get(mesCacheKey,     () => fetch(`http://localhost:5000/api/ventas-mes?user_id=${userId}`).then(r => r.ok ? r.json() : null)),
    ]);

    debug("Fetch Promise.all completed");
    if (dashData)    { debug("Updating stock bajo"); _renderStockBajo(dashData); }
    if (reporteData) { 
      debug("Updating sales stats + table"); 
      _renderStatsSales(reporteData); 
      ventasActuales = reporteData.ventas || [];
      _renderVentas(ventasActuales); 
      _renderReporteModal(reporteData); // Renderizar el contenido del modal de reporte
    }
    if (mesData)     { debug("Updating month sales"); _renderMes(mesData); }
    if (products)    { debug("Updating featured"); _renderFeatured(products, getProductImageHtml); }

  } catch (e) {
    debug(`ERROR in fetch cycle: ${e.message}`);
    console.error("Error cargando datos del dashboard:", e);
  }

  // Función para renderizar el contenido del modal de reporte
  function _renderReporteModal(data) {
    const reporteContent = document.getElementById('reporteContentEmpleado');
    if (!reporteContent) return;

    const metodosStr = Object.entries(data.metodos_pago || {})
      .map(([m, val]) => `<li><strong>${m}:</strong> RD$ ${val.toLocaleString('es-DO')}</li>`)
      .join('') || '<li>No hay ventas registradas.</li>';

    reporteContent.innerHTML = `
      <div style="padding:1rem;color:#333;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:2rem;background:#f8fafc;padding:1.5rem;border-radius:10px;border:1px solid #e2e8f0;">
          <div>
            <p style="color:#64748b;margin-bottom:4px;">Total del día</p>
            <h2 style="font-size:1.8rem;color:#1A3263;">RD$ ${Number(data.total_venta).toLocaleString('es-DO')}</h2>
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
            <th style="padding:8px;text-align:left;">Cliente</th>
            <th style="padding:8px;text-align:left;">Producto</th>
            <th style="padding:8px;text-align:left;">Método</th>
            <th style="padding:8px;text-align:right;">Monto</th>
          </tr></thead>
          <tbody>
            ${(data.ventas || []).map(v => `
              <tr>
                <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${new Date(v.created_at).toLocaleTimeString('es-DO', { hour:'2-digit', minute:'2-digit', timeZone: 'America/Santo_Domingo' })}</td>
                <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${v.nombre_comprador || 'Consumidor Final'}</td>
                <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${v.nombre_producto || 'Venta General'}</td>
                <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${v.metodo_pago}</td>
                <td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;">RD$ ${Number(v.total).toLocaleString('es-DO')}</td>
              </tr>
            `).join('')}
            ${(data.ventas || []).length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">No hubo movimientos hoy.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;
  }

  // Tarjeta Stock Bajo
  function _renderStockBajo(data) {
    const sLow = document.getElementById("statsLowStock");
    if (sLow) sLow.textContent = data.stock_bajo;
  }

  // Tarjeta Ventas Hoy
  function _renderStatsSales(reporte) {
    const sToday = document.getElementById("statsSalesToday");
    if (sToday) sToday.textContent = `RD$ ${Number(reporte.total_venta).toLocaleString()}`;
  }

  // Tarjeta Mis Ventas Mes
  function _renderMes(mesData) {
    const sMonth = document.getElementById("statsSalesMonth");
    if (sMonth) sMonth.textContent = `RD$ ${Number(mesData.total_mes).toLocaleString()}`;
  }

  function _renderFeatured(products, imgFn) {
    if (!products || products.length === 0) return;
    const featured = products[Math.floor(Math.random() * Math.min(products.length, 5))];
    document.getElementById("featuredSection").style.display = "block";
    document.getElementById("featuredTitle").textContent    = featured.nombre;
    document.getElementById("featuredDesc").textContent     = `${featured.categoria || 'Joya'} exclusiva de Kora Luxe`;
    document.getElementById("featuredPrice").textContent    = `RD$ ${Number(featured.precio).toLocaleString()}`;
    document.getElementById("featuredOldPrice").textContent = `RD$ ${(Number(featured.precio) * 1.2).toLocaleString()}`;
    document.getElementById("featuredDiscount").textContent = `-20%`;
    document.getElementById("featuredCode").textContent     = `ID: ${featured.id}`;
    document.getElementById("featuredStock").innerHTML      = `Existencia: <strong>${featured.stock} pzas</strong>`;
    document.getElementById("featuredImage").innerHTML      = imgFn(featured.imagen_url, featured.nombre, featured.id);
  }

  function _renderVentas(ventas) {
    const tbody = document.getElementById("ventasHoyBody");
    if (!tbody) return;
    
    if (ventas && ventas.length > 0) {
      tbody.innerHTML = ventas.map(v => {
        const hora = v.created_at
          ? new Date(v.created_at).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Santo_Domingo' })
          : '--:--';
        const comprador = v.nombre_comprador || 'Consumidor Final';
        
        // Mostrar el producto con indicador de cantidad si hay múltiples
        let productoDisplay = v.nombre_producto || 'Venta General';
        if (v.productos_count > 1) {
          productoDisplay += ` <span class="product-count-badge" title="${v.productos_count} productos en total">📦 ${v.cantidad_total} uni.</span>`;
        }
        
        return `<tr class="venta-row" data-venta-id="${v.id}" style="cursor: pointer;">
          <td>${hora}</td>
          <td>${comprador}</td>
          <td>${productoDisplay}</td>
          <td>RD$ ${Number(v.total).toLocaleString()}</td>
          <td>${v.metodo_pago}</td>
        </tr>`;
      }).join('');
      
      // Agregar event listeners a cada fila
      document.querySelectorAll('.venta-row').forEach(row => {
        row.addEventListener('click', async (e) => {
          // Prevenir que el click en el badge también dispare el evento
          if (e.target.classList.contains('product-count-badge')) return;
          
          const ventaId = row.dataset.ventaId;
          await loadSaleDetails(ventaId);
        });
      });
      
      // Agregar estilos para el badge
      const style = document.createElement('style');
      style.textContent = `
        .product-count-badge {
          display: inline-block;
          background-color: #d4af37;
          color: white;
          font-size: 0.75rem;
          padding: 2px 6px;
          border-radius: 12px;
          margin-left: 8px;
          cursor: help;
        }
        .venta-row:hover {
          background-color: #f5f5f5;
        }
        .venta-row td {
          transition: background-color 0.2s;
        }
      `;
      if (!document.getElementById('venta-row-styles')) {
        style.id = 'venta-row-styles';
        document.head.appendChild(style);
      }
      
    } else {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;">No hay ventas registradas hoy.</td></tr>';
    }
  }

  // Event listener para el botón de reporte
  const btnReporte = document.getElementById('btnReporteEmpleado');
  const modalReporte = document.getElementById('modalReporteEmpleado');
  const closeReporte = document.getElementById('closeReporteEmpleado');

  btnReporte?.addEventListener('click', async () => {
    modalReporte.style.display = 'flex';
    
    // Si ya tenemos datos, los mostramos
    if (ventasActuales.length > 0) {
      const totalVenta = ventasActuales.reduce((sum, v) => sum + v.total, 0);
      const metodosPago = {};
      ventasActuales.forEach(v => {
        metodosPago[v.metodo_pago] = (metodosPago[v.metodo_pago] || 0) + v.total;
      });
      
      _renderReporteModal({
        total_venta: totalVenta,
        conteo_ventas: ventasActuales.length,
        metodos_pago: metodosPago,
        ventas: ventasActuales
      });
    } else {
      document.getElementById('reporteContentEmpleado').innerHTML = 
        '<p style="text-align:center;color:#666;padding:2rem;">No hay ventas registradas hoy.</p>';
    }
  });

  closeReporte?.addEventListener('click', () => {
    modalReporte.style.display = 'none';
  });

  // Cerrar modal al hacer clic fuera
  window.addEventListener('click', (event) => {
    if (event.target === modalReporte) {
      modalReporte.style.display = 'none';
    }
  });
});