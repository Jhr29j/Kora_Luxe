/**
 * KoraCache - Utilidad de caché para Kora Luxe
 * Guarda datos en localStorage con tiempo de expiración.
 */
const KoraCache = {
  // Duración por defecto: 5 minutos
  DEFAULT_TTL: 5 * 60 * 1000,

  /**
   * Obtiene un dato del caché. Si no existe o expiró, ejecuta fetchFn.
   * @param {string} key - Clave del caché
   * @param {function} fetchFn - Función async que retorna los datos frescos
   * @param {number} ttl - Tiempo de vida en ms
   */
  async get(key, fetchFn, ttl = this.DEFAULT_TTL) {
    const cached = this.peek(key);
    
    if (cached) {
      // Si el dato es "stale" (viejo) pero existe, lo devolvemos 
      // y disparamos un refresh en el background para la próxima vez
      const now = Date.now();
      const item = JSON.parse(localStorage.getItem(`koraCache_${key}`));
      if (now > item.expiry) {
        console.log(`[Cache] ${key} expirado. Refrescando en background...`);
        this._refresh(key, fetchFn, ttl);
      }
      return cached;
    }

    // Si no hay nada, fetch obligatorio
    console.log(`[Cache] ${key} no encontrado. Fetching...`);
    return await this._refresh(key, fetchFn, ttl);
  },

  /**
   * Mira el caché sin disparar fetch. Útil para carga instantánea UI.
   */
  peek(key) {
    const data = localStorage.getItem(`koraCache_${key}`);
    if (!data) return null;
    try {
      const item = JSON.parse(data);
      // Retornamos el dato aunque esté expirado si queremos "optimismo"
      // La lógica de get() se encarga de refrescarlo.
      return item.value;
    } catch (e) {
      return null;
    }
  },

  async _refresh(key, fetchFn, ttl) {
    try {
      const value = await fetchFn();
      this.set(key, value, ttl);
      return value;
    } catch (e) {
      console.error(`[Cache] Error refrescando ${key}:`, e);
      // Si falla el fetch, intentamos devolver lo que había aunque sea viejo
      return this.peek(key);
    }
  },

  set(key, value, ttl = this.DEFAULT_TTL) {
    const item = {
      value: value,
      expiry: Date.now() + ttl
    };
    try {
      localStorage.setItem(`koraCache_${key}`, JSON.stringify(item));
    } catch (e) {
      console.warn("[Cache] LocalStorage lleno o error al guardar:", e);
      // Si el localStorage está lleno, borramos todo lo de KoraCache e intentamos de nuevo
      this.clearAll();
      try {
        localStorage.setItem(`koraCache_${key}`, JSON.stringify(item));
      } catch (e2) {}
    }
  },

  clear(key) {
    localStorage.removeItem(`koraCache_${key}`);
  },

  clearAll() {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('koraCache_')) {
        localStorage.removeItem(k);
      }
    });
  }
};