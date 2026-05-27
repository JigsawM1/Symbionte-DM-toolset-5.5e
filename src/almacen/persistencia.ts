import { MONSTRUOS_INICIALES, HECHIZOS_INICIALES } from '../utiles/datosIniciales';
import { guardarBlobGlobal } from '../utiles/almacenamientoTaleSpire';
import type { EstadoDM } from './usarAlmacenDM';

let timeoutPersistencia: ReturnType<typeof setTimeout> | null = null;

export const persistirEstadoCompleto = (estado: Partial<EstadoDM>) => {
  if (!estado) return;

  if (timeoutPersistencia) {
    clearTimeout(timeoutPersistencia);
  }

  timeoutPersistencia = setTimeout(() => {
    const idsInicialesM = new Set(MONSTRUOS_INICIALES.map((m) => m.id));
    const idsInicialesH = new Set(HECHIZOS_INICIALES.map((h) => h.id));

    const baseMonstruos = estado.baseDatosMonstruos || [];
    const baseHechizos = estado.baseDatosHechizos || [];

    const blob = {
      monstruos_homebrew:  baseMonstruos.filter((m) => m && m.id && !idsInicialesM.has(m.id)),
      hechizos_homebrew:   baseHechizos.filter((h) => h && h.id && !idsInicialesH.has(h.id)),
      objetos_homebrew:    estado.objetosHomebrew || [],
      pendientes:          estado.listaPendientes || [],
      notas:               estado.notasDM || "",
      encuentros:          estado.encuentrosGuardados || [],
      cola_iniciativa:     estado.colaIniciativa || [],
      ronda_actual:        estado.rondaActual !== undefined ? estado.rondaActual : 1,
      indice_turno_activo: estado.indiceTurnoActivo !== undefined ? estado.indiceTurnoActivo : 0,
      metodo_vida:         estado.metodoVidaMonstruo || "azar",
    };

    guardarBlobGlobal(blob).catch((e: unknown) => {
      console.error("[TS Storage] Error al persistir estado completo:", e);
    });
  }, 250);
};

