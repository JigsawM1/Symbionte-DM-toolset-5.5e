/**
 * resolutorAreaIniciativa.ts
 * --------------------------
 * Lógica pura para resolver tiradas de salvación y aplicaciones masivas de efectos en área.
 */

import type { CriaturaIniciativa, EfectoActivo } from "@/almacen/usarAlmacenDM";
import type { Caracteristica, MonstruoBase, PersonajeJugador } from "@/tipos";
import { aplicarCondicion } from "@/servicios/procesadorCondiciones";
import { resolverPlantillaPorCriatura } from "@/servicios/resolutorCriaturas";
import { crearIndiceMonstruos } from "@/servicios/indiceMonstruos";
import { generarId } from "@/utiles/generarId";
import type {
  CriaturaSeleccionadaTS,
  ResultadoSalvacionArea,
  ResultadoSalvacionCriatura
} from "./tipos";

/**
 * Resuelve el conjunto de IDs objetivo para las operaciones masivas.
 * Prioridad: IDs manuales > criaturas seleccionadas en la cola > criatura con el turno activo.
 */
export function obtenerIdsObjetivoMasivo(
  colaIniciativa: CriaturaIniciativa[],
  indiceTurnoActivo: number,
  criaturasSeleccionadas: CriaturaSeleccionadaTS[],
  idsManuales?: string[]
): Set<string> {
  if (idsManuales && idsManuales.length > 0) {
    return new Set(idsManuales);
  }
  const idsSeleccionadosEnCola = (criaturasSeleccionadas || [])
    .map((s) => s.id)
    .filter((id) => colaIniciativa.some((c) => c.id === id));

  if (idsSeleccionadosEnCola.length > 0) {
    return new Set(idsSeleccionadosEnCola);
  }

  const idActiva = colaIniciativa[indiceTurnoActivo]?.id;
  return idActiva ? new Set([idActiva]) : new Set();
}

/**
 * Encapsula el boilerplate compartido por las acciones "EnArea" (Strategy Pattern).
 * Resuelve targets, aplica la transformación pura `transformar` solo a las criaturas objetivo
 * y devuelve el patch de estado para Zustand.
 */
export function aplicarTransformacionEnArea(
  state: { colaIniciativa: CriaturaIniciativa[]; indiceTurnoActivo: number; criaturasSeleccionadas: CriaturaSeleccionadaTS[] },
  idsManuales: string[] | undefined,
  transformar: (c: CriaturaIniciativa) => CriaturaIniciativa
): { colaIniciativa: CriaturaIniciativa[] } | Record<string, never> {
  const targets = obtenerIdsObjetivoMasivo(
    state.colaIniciativa,
    state.indiceTurnoActivo,
    state.criaturasSeleccionadas,
    idsManuales
  );
  if (targets.size === 0) return {};
  return {
    colaIniciativa: state.colaIniciativa.map((c) => targets.has(c.id) ? transformar(c) : c)
  };
}

export interface ParamsEjecutarSalvacionArea {
  caracteristica: Caracteristica;
  cd: number;
  dañoBruto?: number;
  condicionOEfecto?: { nombre: string; tipo: "condicion" | "efecto"; duracion?: number; esConcentracion?: boolean };
  mitigacion?: "mitad" | "nada";
  idsObjetivo?: string[];
  colaIniciativa: CriaturaIniciativa[];
  indiceTurnoActivo: number;
  criaturasSeleccionadas: CriaturaSeleccionadaTS[];
  asociacionesFichas: Record<string, string>;
  baseDatosMonstruos: MonstruoBase[];
  rondaActual: number;
  personajes: PersonajeJugador[];
}

export function ejecutarCalculoSalvacionArea(params: ParamsEjecutarSalvacionArea): {
  resultado: ResultadoSalvacionArea;
  nuevaCola: CriaturaIniciativa[];
  nuevosPersonajes: PersonajeJugador[];
} | null {
  const {
    caracteristica,
    cd,
    dañoBruto,
    condicionOEfecto,
    mitigacion = "mitad",
    idsObjetivo,
    colaIniciativa,
    indiceTurnoActivo,
    criaturasSeleccionadas,
    asociacionesFichas,
    baseDatosMonstruos,
    rondaActual,
    personajes
  } = params;

  if (colaIniciativa.length === 0 || cd <= 0) return null;

  const targets = obtenerIdsObjetivoMasivo(
    colaIniciativa,
    indiceTurnoActivo,
    criaturasSeleccionadas,
    idsObjetivo
  );
  if (targets.size === 0) return null;

  const indiceMonstruos = crearIndiceMonstruos(baseDatosMonstruos);
  const resultadosLog: ResultadoSalvacionCriatura[] = [];

  const colaModificada = colaIniciativa.map((c) => {
    if (!targets.has(c.id)) return c;

    const plantilla = resolverPlantillaPorCriatura(c.id, c.nombre, asociacionesFichas, indiceMonstruos);
    let bonoSalvacion = 0;
    if (plantilla) {
      const salvacionEspecifica = plantilla.salvaciones?.[caracteristica];
      if (salvacionEspecifica !== undefined && !isNaN(salvacionEspecifica)) {
        bonoSalvacion = salvacionEspecifica;
      } else if (plantilla.caracteristicas?.[caracteristica] !== undefined) {
        bonoSalvacion = Math.floor((plantilla.caracteristicas[caracteristica] - 10) / 2);
      }
    }

    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + bonoSalvacion;
    const exito = total >= cd;

    let criaturaActualizada = { ...c };
    let dañoAplicado: number | undefined = undefined;
    let condicionAplicada: boolean | undefined = undefined;

    if (dañoBruto !== undefined && dañoBruto > 0) {
      dañoAplicado = exito ? (mitigacion === "nada" ? 0 : Math.floor(dañoBruto / 2)) : dañoBruto;
      let dañoRestante = dañoAplicado;
      let vidaTemp = criaturaActualizada.vidaTemporal || 0;
      let vidaAct = criaturaActualizada.vidaActual;

      if (vidaTemp > 0) {
        if (vidaTemp >= dañoRestante) {
          vidaTemp -= dañoRestante;
          dañoRestante = 0;
        } else {
          dañoRestante -= vidaTemp;
          vidaTemp = 0;
        }
      }

      if (dañoRestante > 0) {
        vidaAct = Math.max(0, vidaAct - dañoRestante);
      }

      criaturaActualizada = { ...criaturaActualizada, vidaTemporal: vidaTemp, vidaActual: vidaAct };
    }

    if (condicionOEfecto && !exito) {
      condicionAplicada = true;
      if (condicionOEfecto.tipo === "condicion") {
        criaturaActualizada.condiciones = aplicarCondicion(
          criaturaActualizada.condiciones,
          condicionOEfecto.nombre
        );
      } else {
        const nuevosEfectos = criaturaActualizada.efectos ? [...criaturaActualizada.efectos] : [];
        const esConcentracion =
          condicionOEfecto.esConcentracion ||
          condicionOEfecto.nombre.toLowerCase().trim() === "concentración" ||
          condicionOEfecto.nombre.toLowerCase().trim() === "concentracion";
        const nuevoEfecto: EfectoActivo = {
          id: generarId(condicionOEfecto.nombre.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 20)),
          nombre: condicionOEfecto.nombre,
          expiraRonda: esConcentracion ? undefined : rondaActual + (condicionOEfecto.duracion || 10),
          concentracion: esConcentracion || undefined
        };
        criaturaActualizada.efectos = [...nuevosEfectos, nuevoEfecto];
      }
    }

    resultadosLog.push({
      id: c.id,
      nombre: c.nombre,
      bono: bonoSalvacion,
      d20,
      total,
      exito,
      dañoSufrido: dañoAplicado,
      condicionAplicada
    });

    return criaturaActualizada;
  });

  const nuevosPersonajesSalvacion = personajes.map((pj) => {
    const c = colaModificada.find((item) => {
      const cNom = (item.nombre || "").trim().toLowerCase();
      return (
        pj.id === item.id ||
        (Boolean(pj.idMiniaturaTS) && pj.idMiniaturaTS === item.id) ||
        (Boolean(cNom) && (pj.nombre || "").trim().toLowerCase() === cNom)
      );
    });
    if (c && condicionOEfecto) {
      const logItem = resultadosLog.find((r) => r.id === c.id);
      if (logItem?.condicionAplicada) {
        return {
          ...pj,
          condicionesActivas: aplicarCondicion(pj.condicionesActivas || [], condicionOEfecto.nombre)
        };
      }
    }
    return pj;
  });

  return {
    resultado: {
      caracteristica,
      cd,
      resultados: resultadosLog
    },
    nuevaCola: colaModificada,
    nuevosPersonajes: nuevosPersonajesSalvacion
  };
}
