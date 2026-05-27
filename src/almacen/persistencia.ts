import { MONSTRUOS_INICIALES, HECHIZOS_INICIALES } from '../utiles/datosIniciales';
import { guardarBlobGlobal } from '../utiles/almacenamientoTaleSpire';
export const persistirEstadoCompleto = (estado: any) => {
  const idsInicialesM = new Set(MONSTRUOS_INICIALES.map((m) => m.id));
  const idsInicialesH = new Set(HECHIZOS_INICIALES.map((h) => h.id));

  const blob = {
    monstruos_homebrew:  estado.baseDatosMonstruos.filter((m: any) => !idsInicialesM.has(m.id)),
    hechizos_homebrew:   estado.baseDatosHechizos.filter((h: any) => !idsInicialesH.has(h.id)),
    objetos_homebrew:    estado.objetosHomebrew,
    pendientes:          estado.listaPendientes,
    notas:               estado.notasDM,
    encuentros:          estado.encuentrosGuardados,
    cola_iniciativa:     estado.colaIniciativa,
    ronda_actual:        estado.rondaActual,
    indice_turno_activo: estado.indiceTurnoActivo,
    metodo_vida:         estado.metodoVidaMonstruo,
  };

  guardarBlobGlobal(blob).catch((e) => {
    console.error("[TS Storage] Error al persistir estado completo:", e);
  });
};
