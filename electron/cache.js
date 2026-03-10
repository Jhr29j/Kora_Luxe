const KoraCache = {

  // TTLs por clave (ms). Si la clave no está aquí, usa DEFAULT_TTL.
  TTL_MAP: {
    'dashboard':   30  * 1000,   // 30 seg — datos en tiempo real
    'reporte-hoy': 30  * 1000,   // 30 seg — ventas del día
    'productos':   2   * 60 * 1000,  // 2 min
    'usuarios':    2   * 60 * 1000,  // 2 min
    'configuracion': 5 * 60 * 1000, // 5 min
  },

  DEFAULT_TTL: 60 * 1000, // 1 min para claves dinámicas (reporte-hoy-X, ventas-mes-X)

  _getTTL(key) {
    // Claves dinámicas: reporte-hoy-2, ventas-mes-3, etc.
    if (key.startsWith('reporte-hoy-')) return 30 * 1000;
    if (key.startsWith('ventas-mes-'))  return 60 * 1000;
    return this.TTL_MAP[key] || this.DEFAULT_TTL;
  },

  /**
   * Obtiene dato del caché. Si no existe O expiró → fetch fresco.
   * Nunca devuelve datos expirados (para que cambios en BD se reflejen siempre).
   */
  async get(key, fetchFn) {
    const ttl = this._getTTL(key);
    const raw = localStorage.getItem(`koraCache_${key}`);

    if (raw) {
      try {
        const item = JSON.parse(raw);
        if (Date.now() < item.expiry) {
          // Dato fresco → devolver directo
          return item.value;
        }
        // Expirado → borrar y fetch fresco
        console.log(`[Cache] ${key} expirado → fetch fresco`);
        localStorage.removeItem(`koraCache_${key}`);
      } catch (e) {
        localStorage.removeItem(`koraCache_${key}`);
      }
    }

    // No hay dato o expiró → fetch obligatorio
    console.log(`[Cache] ${key} → fetching...`);
    try {
      const value = await fetchFn();
      if (value !== null && value !== undefined) {
        this._save(key, value, ttl);
      }
      return value;
    } catch (e) {
      console.error(`[Cache] Error fetching ${key}:`, e);
      return null;
    }
  },

  /**
   * Peek: solo devuelve si existe Y está fresco. Nunca devuelve expirado.
   */
  peek(key) {
    const raw = localStorage.getItem(`koraCache_${key}`);
    if (!raw) return null;
    try {
      const item = JSON.parse(raw);
      if (Date.now() < item.expiry) return item.value;
      // Expirado → borrar silenciosamente
      localStorage.removeItem(`koraCache_${key}`);
      return null;
    } catch (e) {
      return null;
    }
  },

  _save(key, value, ttl) {
    const item = { value, expiry: Date.now() + ttl };
    try {
      localStorage.setItem(`koraCache_${key}`, JSON.stringify(item));
    } catch (e) {
      console.warn('[Cache] localStorage lleno, limpiando...');
      this.clearAll();
      try {
        localStorage.setItem(`koraCache_${key}`, JSON.stringify(item));
      } catch (e2) {}
    }
  },

  set(key, value) {
    this._save(key, value, this._getTTL(key));
  },

  clear(key) {
    localStorage.removeItem(`koraCache_${key}`);
  },

  clearAll() {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('koraCache_')) localStorage.removeItem(k);
    });
  }
};