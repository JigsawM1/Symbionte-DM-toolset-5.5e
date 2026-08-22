import { IDS_INICIALES_MONSTRUOS, IDS_INICIALES_HECHIZOS, IDS_INICIALES_OBJETOS } from '@/utiles/datosIniciales';
import { guardarBlobGlobal } from '@/utiles/almacenamientoTaleSpire';
import type { EstadoDM } from '@/almacen/usarAlmacenDM';
import { logger } from '@/utiles/logger';

let timeoutPersistencia: ReturnType<typeof setTimeout> | null = null;

export const persistirEstadoCompleto = (estado: Partial<EstadoDM>) => {
  if (!estado) return;

  if (timeoutPersistencia) {
    clearTimeout(timeoutPersistencia);
  }

  timeoutPersistencia = setTimeout(() => {

    const baseMonstruos = estado.baseDatosMonstruos || [];
    const baseHechizos = estado.baseDatosHechizos || [];
    const baseObjetos = estado.objetosHomebrew || [];

    const blob = {
      monstruos_homebrew:  baseMonstruos.filter((m) => m && m.id && !IDS_INICIALES_MONSTRUOS.has(m.id)),
      hechizos_homebrew:   baseHechizos.filter((h) => h && h.id && !IDS_INICIALES_HECHIZOS.has(h.id)),
      objetos_homebrew:    baseObjetos.filter((o) => o && o.id && !IDS_INICIALES_OBJETOS.has(o.id)),
      pendientes:          estado.listaPendientes || [],
      notas:               estado.notasDM || "",
      encuentros:          estado.encuentrosGuardados || [],
      cola_iniciativa:     estado.colaIniciativa || [],
      ronda_actual:        estado.rondaActual !== undefined ? estado.rondaActual : 1,
      indice_turno_activo: estado.indiceTurnoActivo !== undefined ? estado.indiceTurnoActivo : 0,
      metodo_vida:         estado.metodoVidaMonstruo || "azar",
      asociaciones_fichas: estado.asociacionesFichas || {},
      personajes:          estado.personajes || [],
      id_personaje_activo: estado.idPersonajeActivo || null,
    };

    guardarBlobGlobal(blob).catch((e: unknown) => {
      logger.error("[TS Storage] Error al persistir estado completo:", e);
    });
  }, 250);
};

