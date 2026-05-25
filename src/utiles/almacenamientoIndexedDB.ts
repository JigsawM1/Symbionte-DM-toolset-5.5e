/**
 * almacenamientoIndexedDB.ts
 * ----------------------------
 * Módulo de persistencia principal del Simbionte DM Screen para TaleSpire.
 * Utiliza IndexedDB para almacenamiento asíncrono sin límites de tamaño,
 * eliminando por completo la restricción de 5MB de LocalStorage.
 *
 * Base de Datos: TalespireDMCompendium (v1)
 * Object Store:  talespire_dm_store (clave = string)
 *
 * Programado 100% en español.
 */

const NOMBRE_DB = "TalespireDMCompendium";
const VERSION_DB = 1;
const STORE_PRINCIPAL = "talespire_dm_store";

/** Instancia singleton de la conexión abierta a la base de datos */
let instanciaDB: IDBDatabase | null = null;

/**
 * Abre (o crea) la base de datos IndexedDB y retorna la instancia.
 * Garantiza una única conexión activa durante toda la sesión del Simbionte.
 */
function abrirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Reutilizamos la conexión activa si ya existe
    if (instanciaDB) {
      resolve(instanciaDB);
      return;
    }

    const solicitud = indexedDB.open(NOMBRE_DB, VERSION_DB);

    solicitud.onupgradeneeded = (evento) => {
      const db = (evento.target as IDBOpenDBRequest).result;

      // Creamos el Object Store principal si no existe
      if (!db.objectStoreNames.contains(STORE_PRINCIPAL)) {
        db.createObjectStore(STORE_PRINCIPAL, { keyPath: "clave" });
        console.log(
          `[IndexedDB] Store "${STORE_PRINCIPAL}" creado en la base de datos "${NOMBRE_DB}" (v${VERSION_DB}).`
        );
      }
    };

    solicitud.onsuccess = (evento) => {
      instanciaDB = (evento.target as IDBOpenDBRequest).result;
      console.log(`[IndexedDB] Conexión establecida con la base de datos "${NOMBRE_DB}" v${VERSION_DB}.`);
      resolve(instanciaDB);
    };

    solicitud.onerror = (evento) => {
      const error = (evento.target as IDBOpenDBRequest).error;
      console.error(`[IndexedDB] Error al abrir la base de datos "${NOMBRE_DB}":`, error);
      reject(error);
    };

    solicitud.onblocked = () => {
      console.warn(
        `[IndexedDB] La apertura de "${NOMBRE_DB}" está bloqueada por otra pestaña. Cierra otras instancias del Simbionte.`
      );
    };
  });
}

/**
 * Guarda un valor cualquiera asociado a una clave en IndexedDB.
 * Si la clave ya existe, la sobreescribe (upsert).
 * @param clave  Identificador único del registro (ej. "dm_monstruos_homebrew")
 * @param valor  El dato serializable a persistir (objeto, arreglo, string, número)
 * @returns true si el guardado fue exitoso, false en caso de error
 */
export async function guardarEnDB(clave: string, valor: unknown): Promise<boolean> {
  try {
    const db = await abrirDB();
    return await new Promise((resolve, reject) => {
      const transaccion = db.transaction(STORE_PRINCIPAL, "readwrite");
      const store = transaccion.objectStore(STORE_PRINCIPAL);
      const solicitud = store.put({ clave, valor });

      solicitud.onsuccess = () => resolve(true);
      solicitud.onerror = () => {
        console.error(`[IndexedDB] Error al guardar el registro con clave "${clave}":`, solicitud.error);
        reject(solicitud.error);
      };
    });
  } catch (error) {
    console.error(`[IndexedDB] guardarEnDB("${clave}") falló:`, error);
    return false;
  }
}

/**
 * Recupera el valor asociado a una clave desde IndexedDB.
 * @param clave  Identificador único del registro
 * @returns El valor deserializado, o null si la clave no existe o hay un error
 */
export async function obtenerDeDB<T>(clave: string): Promise<T | null> {
  try {
    const db = await abrirDB();
    return await new Promise((resolve, reject) => {
      const transaccion = db.transaction(STORE_PRINCIPAL, "readonly");
      const store = transaccion.objectStore(STORE_PRINCIPAL);
      const solicitud = store.get(clave);

      solicitud.onsuccess = () => {
        const resultado = solicitud.result;
        if (resultado === undefined || resultado === null) {
          resolve(null);
        } else {
          resolve((resultado as { clave: string; valor: T }).valor);
        }
      };

      solicitud.onerror = () => {
        console.error(`[IndexedDB] Error al leer el registro con clave "${clave}":`, solicitud.error);
        reject(solicitud.error);
      };
    });
  } catch (error) {
    console.error(`[IndexedDB] obtenerDeDB("${clave}") falló:`, error);
    return null;
  }
}

/**
 * Elimina el registro asociado a una clave de IndexedDB.
 * @param clave  Identificador único del registro
 * @returns true si la eliminación fue exitosa, false en caso de error
 */
export async function eliminarDeDB(clave: string): Promise<boolean> {
  try {
    const db = await abrirDB();
    return await new Promise((resolve, reject) => {
      const transaccion = db.transaction(STORE_PRINCIPAL, "readwrite");
      const store = transaccion.objectStore(STORE_PRINCIPAL);
      const solicitud = store.delete(clave);

      solicitud.onsuccess = () => resolve(true);
      solicitud.onerror = () => {
        console.error(`[IndexedDB] Error al eliminar el registro con clave "${clave}":`, solicitud.error);
        reject(solicitud.error);
      };
    });
  } catch (error) {
    console.error(`[IndexedDB] eliminarDeDB("${clave}") falló:`, error);
    return false;
  }
}

/**
 * Elimina TODOS los registros del Object Store principal.
 * Se invoca únicamente al restablecer los datos de fábrica del Simbionte.
 * @returns true si la limpieza fue exitosa, false en caso de error
 */
export async function limpiarDB(): Promise<boolean> {
  try {
    const db = await abrirDB();
    return await new Promise((resolve, reject) => {
      const transaccion = db.transaction(STORE_PRINCIPAL, "readwrite");
      const store = transaccion.objectStore(STORE_PRINCIPAL);
      const solicitud = store.clear();

      solicitud.onsuccess = () => {
        console.log(`[IndexedDB] Todos los registros de "${STORE_PRINCIPAL}" han sido eliminados.`);
        resolve(true);
      };
      solicitud.onerror = () => {
        console.error(`[IndexedDB] Error al vaciar el store "${STORE_PRINCIPAL}":`, solicitud.error);
        reject(solicitud.error);
      };
    });
  } catch (error) {
    console.error("[IndexedDB] limpiarDB() falló:", error);
    return false;
  }
}
