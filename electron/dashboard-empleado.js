document.addEventListener("DOMContentLoaded", async () => {
  const debug = (msg) => {
    console.log(msg);
    const logs = JSON.parse(localStorage.getItem('kora_debug_logs') || '[]');
    logs.push(`${new Date().toISOString()}: ${msg}`);
    localStorage.setItem('kora_debug_logs', JSON.stringify(logs.slice(-50)));
  };

  debug("DOMLoaded - dashboard-empleado.js starting");
  
  // Limpiar basura vieja del caché (si existe algo muy grande puede colgar el navegador)
  if (!localStorage.getItem('kora_v2_cache_fix')) {
    debug("Applying one-time cache fix (clearing localStorage)");
    localStorage.clear();
    localStorage.setItem('kora_v2_cache_fix', 'true');
    // Restaurar sesión básica
    if (userName) localStorage.setItem("koraLuxe_userName", userName);
  }

  if (typeof KoraCache === 'undefined') {
    debug("CRITICAL: KoraCache is UNDEFINED");
    return;
  }
  debug("KoraCache is defined");

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

  // ── Nombre y fecha (instantáneos, no esperan al backend) ────────────
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

  // ── Mostrar datos cacheados PRIMERO (carga instantánea) ─────────────
  // Si ya hay datos en localStorage, los muestra de inmediato
  // sin esperar al backend para nada
  debug("Peeking cache...");
  const cachedDash    = KoraCache.peek('dashboard');
  const cachedProds   = KoraCache.peek('productos');
  const cachedReporte = KoraCache.peek('reporte-hoy');
  debug(`Cache peek: dash=${!!cachedDash}, prods=${!!cachedProds}, rep=${!!cachedReporte}`);

  if (cachedDash)    _renderStats(cachedDash);
  if (cachedProds)   _renderFeatured(cachedProds, getProductImageHtml);
  if (cachedReporte) _renderVentas(cachedReporte);

  debug("Starting fresh fetch in parallel...");
  try {
    const [dashData, products, reporteData] = await Promise.all([
      KoraCache.get('dashboard',   () => fetch("http://localhost:5000/api/dashboard").then(r => r.ok ? r.json() : null)),
      KoraCache.get('productos',   () => fetch("http://localhost:5000/api/productos?include_images=false").then(r => r.ok ? r.json() : [])),
      KoraCache.get('reporte-hoy', () => fetch("http://localhost:5000/api/reporte-diario").then(r => r.ok ? r.json() : null)),
    ]);

    debug("Fetch Promise.all completed");
    if (dashData)    { debug("Updating UI with fresh stats"); _renderStats(dashData); }
    if (products)    { debug("Updating UI with fresh products"); _renderFeatured(products, getProductImageHtml); }
    if (reporteData) { debug("Updating UI with fresh report"); _renderVentas(reporteData); }

  } catch (e) {
    debug(`ERROR in fetch cycle: ${e.message}`);
    console.error("Error cargando datos del dashboard:", e);
  }

  function _renderStats(data) {
    const sToday = document.getElementById("statsSalesToday");
    const sMonth = document.getElementById("statsSalesMonth");
    const sLow   = document.getElementById("statsLowStock");
    if (sToday) sToday.textContent = `RD$ ${Number(data.ingresos_totales).toLocaleString()}`;
    if (sMonth) sMonth.textContent = `RD$ ${(Number(data.ingresos_totales) * 0.85).toLocaleString()}`;
    if (sLow)   sLow.textContent   = data.stock_bajo;
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

  function _renderVentas(data) {
    const tbody = document.getElementById("ventasHoyBody");
    if (!tbody) return;
    if (data && data.ventas && data.ventas.length > 0) {
      tbody.innerHTML = data.ventas.map(v => {
        const hora = v.created_at
          ? new Date(v.created_at).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Santo_Domingo' })
          : '--:--';
        const comprador = v.nombre_comprador || 'Consumidor Final';
        const producto  = v.nombre_producto  || 'Venta General';
        return `<tr>
          <td>${hora}</td>
          <td>${comprador}</td>
          <td>${producto}</td>
          <td>RD$ ${Number(v.total).toLocaleString()}</td>
          <td>${v.metodo_pago}</td>
        </tr>`;
      }).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;">No hay ventas registradas hoy.</td></tr>';
    }
  }

});