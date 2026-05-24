/**
 * Utilidades para almacenamiento persistente de alto rendimiento en TaleSpire.
 * Mantiene caches en memoria separados por alcance (Scope):
 * - GLOBAL: Compartido entre todas las campañas (Monstruos, Hechizos y Objetos Homebrew).
 * - CAMPAÑA: Específico e independiente para cada campaña activa (Notas DM, Iniciativa, Pendientes y Encuentros).
 *
 * Persiste los datos de forma asíncrona mediante los Blobs nativos de TaleSpire:
 * - window.localStorage.global
 * - window.localStorage.campaign
 *
 * Programado 100% en español.
 */

let cacheGlobal: Record<string, any> = {};
let cacheCampaña: Record<string, any> = {};
let storageInicializado = false;
let usarAPINativaTaleSpire = false; // Bandera de protección crítica contra sobreescrituras en caliente

let timeoutEscrituraGlobal: any = null;
let timeoutEscrituraCampaña: any = null;

// Claves de fallbacks en navegadores estándar fuera de TaleSpire
const CLAVE_BLOB_GLOBAL = "talespire_symbiote_global_blob";
const CLAVE_BLOB_CAMPAÑA = "talespire_symbiote_campaign_blob";

// Lista de claves que pertenecen al alcance de Campaña
const CLAVES_ALCANCE_CAMPAÑA = [
  "dm_cola_iniciativa",
  "dm_pendientes",
  "dm_encuentros_guardados",
  "dm_notas",
  "dm_ronda_actual",
  "dm_indice_turno_activo"
];

/**
 * Helper para verificar a qué alcance pertenece una clave.
 */
function esClaveDeCampaña(clave: string): boolean {
  return CLAVES_ALCANCE_CAMPAÑA.includes(clave);
}

/**
 * Espera de forma asíncrona una cantidad de milisegundos.
 */
const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Inicializa el motor de almacenamiento persistente nativo de TaleSpire.
 * Espera de forma adaptativa la inicialización del CEF nativo de TaleSpire.
 */
export async function inicializarAlmacenamiento(): Promise<void> {
  if (storageInicializado) return;

  const windowAlias = window as any;

  // Optimización de velocidad: Si estamos en el navegador local en desarrollo, no esperar lag inútil de 2s
  const esDesarrolloWeb = typeof window !== "undefined" && 
    (window.location.hostname === "localhost" || 
     window.location.hostname === "127.0.0.1" || 
     window.location.port !== "");
  
  const tieneIndiciosTS = !!(windowAlias.TS || windowAlias.com?.bouncyrock?.talespire);

  // Esperar a que el motor CEF de TaleSpire termine de inyectar las APIs en window.TS.localStorage
  let intentos = 0;
  // Si parece ser desarrollo puro y no hay rastro de la API, no esperamos nada
  const maxIntentos = (esDesarrolloWeb && !tieneIndiciosTS) ? 0 : 100; // 100 * 50ms = 5000ms (5 segundos de resiliencia en TaleSpire)
  
  while (!(windowAlias.TS && windowAlias.TS.localStorage && windowAlias.TS.localStorage.global) && intentos < maxIntentos) {
    await esperar(50);
    intentos++;
  }

  // 1. Detección y confirmación del Entorno Real de TaleSpire
  if (windowAlias.TS && windowAlias.TS.localStorage && windowAlias.TS.localStorage.global) {
    console.log("[Almacenamiento] Detectada API nativa de TaleSpire. Entorno REAL.");
    usarAPINativaTaleSpire = true; // Fijar el entorno nativo de forma permanente para esta sesión
    
    // --- CARGAR ALCANCE GLOBAL ---
    try {
      const blobGlobal = await windowAlias.TS.localStorage.global.getBlob();
      if (blobGlobal && blobGlobal.trim() !== "") {
        cacheGlobal = JSON.parse(blobGlobal);
        console.log("[Almacenamiento] Datos GLOBALES cargados con éxito de TaleSpire. Claves:", Object.keys(cacheGlobal));
      } else {
        console.log("[Almacenamiento] Blob global vacío en TaleSpire. Intentando recuperar fallback local...");
        migrarDatosGlobalesDeLocalStorageEstandar();
        // PROTECCIÓN CRÍTICA: Sólo persistir al Blob de TaleSpire si recuperamos datos reales que migrar
        if (Object.keys(cacheGlobal).length > 0) {
          await windowAlias.TS.localStorage.global.setBlob(JSON.stringify(cacheGlobal));
          console.log("[Almacenamiento] Datos globales locales migrados a TaleSpire con éxito.");
        }
      }
    } catch (err) {
      console.error("[Almacenamiento] Error al cargar blob global:", err);
      migrarDatosGlobalesDeLocalStorageEstandar();
    }

    // --- CARGAR ALCANCE CAMPAÑA ---
    if (windowAlias.TS.localStorage.campaign) {
      try {
        const blobCamp = await windowAlias.TS.localStorage.campaign.getBlob();
        if (blobCamp && blobCamp.trim() !== "") {
          cacheCampaña = JSON.parse(blobCamp);
          console.log("[Almacenamiento] Datos de CAMPAÑA cargados con éxito de TaleSpire. Claves:", Object.keys(cacheCampaña));
        } else {
          console.log("[Almacenamiento] Blob de campaña vacío en TaleSpire. Intentando recuperar fallback local...");
          migrarDatosCampañaDeLocalStorageEstandar();
          // PROTECCIÓN CRÍTICA: Sólo persistir al Blob de TaleSpire si recuperamos datos reales que migrar
          if (Object.keys(cacheCampaña).length > 0) {
            await windowAlias.TS.localStorage.campaign.setBlob(JSON.stringify(cacheCampaña));
            console.log("[Almacenamiento] Datos de campaña locales migrados a TaleSpire con éxito.");
          }
        }
      } catch (err) {
        console.error("[Almacenamiento] Error al cargar blob de campaña:", err);
        migrarDatosCampañaDeLocalStorageEstandar();
      }
    } else {
      console.warn("[Almacenamiento] API de campaña no disponible. Usando fallback local.");
      migrarDatosCampañaDeLocalStorageEstandar();
    }

  } else {
    // 2. Detección de Fallback (Navegador Web / Servidor de Desarrollo local)
    console.warn("[Almacenamiento] Entorno de simulador/navegador local. Usando persistencia de fallback local.");
    usarAPINativaTaleSpire = false; // Fijar el modo fallback de forma permanente
    
    // Carga Global Fallback
    try {
      const globalSimulado = localStorage.getItem(CLAVE_BLOB_GLOBAL);
      if (globalSimulado) {
        cacheGlobal = JSON.parse(globalSimulado);
      } else {
        migrarDatosGlobalesDeLocalStorageEstandar();
      }
    } catch (e) {
      console.error("[Almacenamiento] Falló lectura de global simulado:", e);
      migrarDatosGlobalesDeLocalStorageEstandar();
    }

    // Carga Campaña Fallback
    try {
      const campSimulado = localStorage.getItem(CLAVE_BLOB_CAMPAÑA);
      if (campSimulado) {
        cacheCampaña = JSON.parse(campSimulado);
      } else {
        migrarDatosCampañaDeLocalStorageEstandar();
      }
    } catch (e) {
      console.error("[Almacenamiento] Falló lectura de campaña simulada:", e);
      migrarDatosCampañaDeLocalStorageEstandar();
    }
  }

  storageInicializado = true;
}

/**
 * Migra las claves globales del antiguo sistema de almacenamiento fragmentado.
 */
function migrarDatosGlobalesDeLocalStorageEstandar(): void {
  cacheGlobal = {};
  const clavesGlobales = ["dm_monstruos_homebrew", "dm_hechizos_homebrew", "dm_objetos_homebrew"];

  for (const clave of clavesGlobales) {
    const metadatosTexto = localStorage.getItem(`${clave}_meta`);
    if (metadatosTexto) {
      try {
        const metadatos = JSON.parse(metadatosTexto) as { esFragmentado: boolean; cantidad: number };
        if (metadatos.esFragmentado) {
          let textoReconstruido = "";
          let exito = true;
          for (let i = 0; i < metadatos.cantidad; i++) {
            const fragmento = localStorage.getItem(`${clave}_f_${i}`);
            if (fragmento === null) { exito = false; break; }
            textoReconstruido += fragmento;
          }
          if (exito) {
            cacheGlobal[clave] = JSON.parse(textoReconstruido);
          }
        }
      } catch (error) {
        console.error(`Error al migrar ${clave}:`, error);
      }
    } else {
      const convencional = localStorage.getItem(clave);
      if (convencional) {
        try { cacheGlobal[clave] = JSON.parse(convencional); } catch { cacheGlobal[clave] = convencional; }
      }
    }
  }
}

/**
 * Migra las claves de campaña del antiguo sistema.
 */
function migrarDatosCampañaDeLocalStorageEstandar(): void {
  cacheCampaña = {};
  const clavesCampañaFragmentadas = ["dm_pendientes", "dm_encuentros_guardados", "dm_cola_iniciativa"];

  for (const clave of clavesCampañaFragmentadas) {
    const metadatosTexto = localStorage.getItem(`${clave}_meta`);
    if (metadatosTexto) {
      try {
        const metadatos = JSON.parse(metadatosTexto) as { esFragmentado: boolean; cantidad: number };
        if (metadatos.esFragmentado) {
          let textoReconstruido = "";
          let exito = true;
          for (let i = 0; i < metadatos.cantidad; i++) {
            const fragmento = localStorage.getItem(`${clave}_f_${i}`);
            if (fragmento === null) { exito = false; break; }
            textoReconstruido += fragmento;
          }
          if (exito) {
            cacheCampaña[clave] = JSON.parse(textoReconstruido);
          }
        }
      } catch (error) {
        console.error(`Error al migrar de campaña ${clave}:`, error);
      }
    } else {
      const convencional = localStorage.getItem(clave);
      if (convencional) {
        try { cacheCampaña[clave] = JSON.parse(convencional); } catch { cacheCampaña[clave] = convencional; }
      }
    }
  }

  const notas = localStorage.getItem("dm_notas");
  if (notas !== null) cacheCampaña["dm_notas"] = notas;

  const ronda = localStorage.getItem("dm_ronda_actual");
  if (ronda !== null) cacheCampaña["dm_ronda_actual"] = ronda;

  const turno = localStorage.getItem("dm_indice_turno_activo");
  if (turno !== null) cacheCampaña["dm_indice_turno_activo"] = turno;
}

/**
 * Obtiene sincrónicamente un dato cargado en memoria según su alcance (global o campaña).
 */
export function obtenerDatoFragmentado<T>(clave: string): T | null {
  if (!storageInicializado) {
    console.warn(`[Almacenamiento] Advertencia: Se intentó leer "${clave}" antes de inicializar.`);
  }

  if (esClaveDeCampaña(clave)) {
    if (clave in cacheCampaña) {
      return cacheCampaña[clave] as T;
    }
  } else {
    if (clave in cacheGlobal) {
      return cacheGlobal[clave] as T;
    }
  }
  return null;
}

/**
 * Guarda sincrónicamente en memoria y agenda su persistencia asíncrona diferida.
 * Permite pasar `inmediato = true` para forzar la escritura instantánea física a TaleSpire/localStorage.
 */
export function guardarDatoFragmentado(clave: string, datos: unknown, inmediato: boolean = false): boolean {
  try {
    if (esClaveDeCampaña(clave)) {
      cacheCampaña[clave] = datos;
      if (inmediato) {
        escribirPersistenteCampañaInmediato();
      } else {
        programarEscrituraPersistenteCampaña();
      }
    } else {
      cacheGlobal[clave] = datos;
      if (inmediato) {
        escribirPersistenteGlobalInmediato();
      } else {
        programarEscrituraPersistenteGlobal();
      }
    }
    return true;
  } catch (error) {
    console.error(`[Almacenamiento] Error al guardar "${clave}":`, error);
    return false;
  }
}

/**
 * Elimina un registro del almacenamiento y del caché de memoria.
 */
export function eliminarDatoFragmentado(clave: string, inmediato: boolean = false): void {
  try {
    if (esClaveDeCampaña(clave)) {
      if (clave in cacheCampaña) {
        delete cacheCampaña[clave];
        if (inmediato) {
          escribirPersistenteCampañaInmediato();
        } else {
          programarEscrituraPersistenteCampaña();
        }
      }
    } else {
      if (clave in cacheGlobal) {
        delete cacheGlobal[clave];
        if (inmediato) {
          escribirPersistenteGlobalInmediato();
        } else {
          programarEscrituraPersistenteGlobal();
        }
      }
    }
  } catch (error) {
    console.error(`[Almacenamiento] Error al eliminar "${clave}":`, error);
  }
}

/**
 * Realiza una escritura síncrona/inmediata del caché global en TaleSpire o fallback.
 */
export async function escribirPersistenteGlobalInmediato(): Promise<void> {
  if (timeoutEscrituraGlobal) clearTimeout(timeoutEscrituraGlobal);

  const windowAlias = window as any;
  const serializado = JSON.stringify(cacheGlobal);

  if (usarAPINativaTaleSpire && windowAlias.TS && windowAlias.TS.localStorage && windowAlias.TS.localStorage.global) {
    try {
      console.log(`[Almacenamiento-Inmediato] Guardando blob GLOBAL en TaleSpire (${(serializado.length / 1024).toFixed(2)} KB)...`);
      await windowAlias.TS.localStorage.global.setBlob(serializado);
    } catch (e) {
      console.error("[Almacenamiento-Inmediato] Error setBlob Global en TaleSpire:", e);
    }
  } else {
    try {
      localStorage.setItem(CLAVE_BLOB_GLOBAL, serializado);
    } catch (e) {
      console.error("[Almacenamiento-Inmediato] Error en localStorage Global de fallback:", e);
    }
  }
}

/**
 * Realiza una escritura síncrona/inmediata del caché de campaña en TaleSpire o fallback.
 */
export async function escribirPersistenteCampañaInmediato(): Promise<void> {
  if (timeoutEscrituraCampaña) clearTimeout(timeoutEscrituraCampaña);

  const windowAlias = window as any;
  const serializado = JSON.stringify(cacheCampaña);

  if (usarAPINativaTaleSpire && windowAlias.TS && windowAlias.TS.localStorage && windowAlias.TS.localStorage.campaign) {
    try {
      console.log(`[Almacenamiento-Inmediato] Guardando blob de CAMPAÑA en TaleSpire (${(serializado.length / 1024).toFixed(2)} KB)...`);
      await windowAlias.TS.localStorage.campaign.setBlob(serializado);
    } catch (e) {
      console.error("[Almacenamiento-Inmediato] Error setBlob Campaña en TaleSpire:", e);
    }
  } else {
    try {
      localStorage.setItem(CLAVE_BLOB_CAMPAÑA, serializado);
    } catch (e) {
      console.error("[Almacenamiento-Inmediato] Error en localStorage Campaña de fallback:", e);
    }
  }
}

/**
 * Persiste asíncronamente las modificaciones globales con un debounce de 300ms.
 */
function programarEscrituraPersistenteGlobal(): void {
  if (timeoutEscrituraGlobal) clearTimeout(timeoutEscrituraGlobal);

  timeoutEscrituraGlobal = setTimeout(() => {
    escribirPersistenteGlobalInmediato();
  }, 300);
}

/**
 * Persiste asíncronamente las modificaciones de campaña con un debounce de 300ms.
 */
function programarEscrituraPersistenteCampaña(): void {
  if (timeoutEscrituraCampaña) clearTimeout(timeoutEscrituraCampaña);

  timeoutEscrituraCampaña = setTimeout(() => {
    escribirPersistenteCampañaInmediato();
  }, 300);
}

/**
 * Realiza un restablecimiento de fábrica absoluto.
 */
export function reiniciarAlmacenamientoCompleto(): void {
  console.warn("[Almacenamiento] Ejecutando reinicio completo del sistema de almacenamiento...");

  cacheGlobal = {};
  cacheCampaña = {};

  const todasLasClaves = [
    "dm_monstruos_homebrew",
    "dm_hechizos_homebrew",
    "dm_objetos_homebrew",
    "dm_pendientes",
    "dm_encuentros_guardados",
    "dm_cola_iniciativa",
    "dm_notas",
    "dm_ronda_actual",
    "dm_indice_turno_activo"
  ];

  for (const clv of todasLasClaves) {
    localStorage.removeItem(clv);
    localStorage.removeItem(`${clv}_meta`);
    let i = 0;
    while (localStorage.getItem(`${clv}_f_${i}`) !== null) {
      localStorage.removeItem(`${clv}_f_${i}`);
      i++;
    }
  }

  localStorage.removeItem(CLAVE_BLOB_GLOBAL);
  localStorage.removeItem(CLAVE_BLOB_CAMPAÑA);

  const windowAlias = window as any;
  if (windowAlias.TS && windowAlias.TS.localStorage) {
    if (windowAlias.TS.localStorage.global) {
      windowAlias.TS.localStorage.global.deleteBlob()
        .then(() => console.log("[Almacenamiento] Blob global eliminado."))
        .catch((e: any) => console.error("Error al borrar blob global:", e));
    }
    if (windowAlias.TS.localStorage.campaign) {
      windowAlias.TS.localStorage.campaign.deleteBlob()
        .then(() => console.log("[Almacenamiento] Blob de campaña eliminado."))
        .catch((e: any) => console.error("Error al borrar blob de campaña:", e));
    }
  }
}
