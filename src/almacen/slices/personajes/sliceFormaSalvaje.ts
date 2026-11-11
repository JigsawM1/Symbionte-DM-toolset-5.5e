import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import type { SubSliceRasgos } from "./slicePersonajesTipos";
import { mutarPersonaje } from "../helpers/mutarPersonaje";
import { sincronizarVidaTemporalEnIniciativa } from "../iniciativa/sincronizadorVidaIniciativa";
import {
  calcularHpTemporalFormaSalvaje,
  obtenerNivelDruida,
  calcularReglasFormaSalvaje,
  esBestiaValidaParaDruida,
  obtenerRasgoFormaBestia,
  terminarFormaBestia
} from "@/servicios/reglasFormaSalvaje";
import { aplicarCondicion } from "@/servicios/procesadorCondiciones";
import { MONSTRUOS_INICIALES } from "@/utiles/datosIniciales";
import { claveEstado } from "@/servicios/rasgos/estadoCondicionesRasgos";

export const crearSliceFormaSalvaje: StateCreator<
  EstadoDM,
  [],
  [],
  Pick<
    SubSliceRasgos,
    "establecerFormasConocidasDruida" | "transformarEnFormaSalvaje" | "revertirFormaSalvaje"
  >
> = (set, get) => ({
  establecerFormasConocidasDruida: (idPj, formasIds) => {
    mutarPersonaje(set, idPj, (pj) => {
      const nivelDruida = obtenerNivelDruida(pj);
      const rasgo = obtenerRasgoFormaBestia(pj);
      if (!rasgo || nivelDruida < (rasgo.nivelRequerido ?? 2)) return pj;
      const reglas = calcularReglasFormaSalvaje(nivelDruida, rasgo.ajustesFormaBestia, rasgo.formasBestia);
      const elegibles = MONSTRUOS_INICIALES.filter(b => esBestiaValidaParaDruida(b, nivelDruida, rasgo.ajustesFormaBestia, rasgo.formasBestia));
      const elegiblesSet = new Set(elegibles.map(b => b.id));
      const previas = pj.formaSalvaje.formasConocidasIds.filter(id => elegiblesSet.has(id));
      const formas = [...new Set(formasIds)].filter(id => elegiblesSet.has(id)).slice(0, reglas.maxFormasConocidas);
      const retiradas = previas.filter(id => !formas.includes(id)).length;
      if (rasgo.formasBestia && (retiradas > 1 || (retiradas && !pj.formaSalvaje.sustitucionDisponible)
        || formas.length < previas.length)) return pj;

      return {
        ...pj,
        formaSalvaje: {
          ...(pj.formaSalvaje || { formaActivaId: null, hpTemporalAlTransformar: 0 }),
          formasConocidasIds: formas,
          sustitucionDisponible: retiradas ? false : pj.formaSalvaje.sustitucionDisponible
        }
      };
    });
  },

  transformarEnFormaSalvaje: (idPj, idBestia, equipoConservadoIds = [], conservarPg = false) => {
    mutarPersonaje(set, idPj, (pj) => {
      const nivelDruida = obtenerNivelDruida(pj);
      const rasgo = obtenerRasgoFormaBestia(pj);
      const restantes = rasgo?.usosRestantes ?? rasgo?.usosMaximos ?? 0;
      const bestia = MONSTRUOS_INICIALES.find(b => b.id === idBestia);
      if (!rasgo?.tieneUsosLimitados || restantes < 1 || !bestia || nivelDruida < (rasgo.nivelRequerido ?? 2)
        || !pj.formaSalvaje.formasConocidasIds.includes(idBestia)
        || !esBestiaValidaParaDruida(bestia, nivelDruida, rasgo.ajustesFormaBestia, rasgo.formasBestia)
        || pj.salvacionesMuerte?.fallos >= 3
        || (rasgo.desactivarConCondiciones ?? ["Incapacitado", "Inconsciente", "Muerto"])
          .some(c => pj.condicionesActivas.some(a => claveEstado(a) === claveEstado(c)))) return pj;

      // 2. Aplicar condición de Forma salvaje
      const condicionesActualizadas = aplicarCondicion(pj.condicionesActivas ?? [], rasgo.condicionAlActivar ?? "Forma salvaje");

      const hpTemp = calcularHpTemporalFormaSalvaje(nivelDruida, rasgo.ajustesFormaBestia);
      const minutos = Math.floor(nivelDruida / 2) * 60;
      const estado = get();

      return {
        ...pj,
        rasgos: pj.rasgos.map(r => r === rasgo ? { ...r, usosRestantes: restantes - 1, activo: true } : r),
        condicionesActivas: condicionesActualizadas,
        hpTemporal: conservarPg ? pj.hpTemporal : hpTemp,
        formaSalvaje: {
          ...(pj.formaSalvaje || { formasConocidasIds: [] }),
          formaActivaId: idBestia,
          hpTemporalAlTransformar: conservarPg ? 0 : hpTemp,
          equipoConservadoIds: [...new Set(equipoConservadoIds)].filter(id => pj.inventario.some(o => o.idInstancia === id && o.equipado)),
          minutosRestantes: minutos,
          expiraRonda: estado.colaIniciativa.length ? estado.rondaActual + minutos * 10 : undefined
        }
      };
    });

    const pjTransformado = get().personajes.find((p) => p.id === idPj);
    if (pjTransformado) {
      sincronizarVidaTemporalEnIniciativa(set, idPj, pjTransformado.hpTemporal || 0);
    }
  },

  revertirFormaSalvaje: (idPj) => {
    mutarPersonaje(set, idPj, terminarFormaBestia);

    const pjRevertido = get().personajes.find((p) => p.id === idPj);
    if (pjRevertido) {
      sincronizarVidaTemporalEnIniciativa(set, idPj, pjRevertido.hpTemporal || 0);
    }
  }
});
