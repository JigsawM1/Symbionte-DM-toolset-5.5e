/**
 * resolutorAreaIniciativa.ts
 * --------------------------
 * Lógica pura para resolver tiradas de salvación y aplicaciones masivas de efectos en área.
 */

import type { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import type { Caracteristica, MonstruoBase, PersonajeJugador } from "@/tipos";
import { aplicarCondicion } from "@/servicios/procesadorCondiciones";
import { esCriaturaHorda, resolverSalvacionHordaEnArea } from "@/servicios/combateHordas";
import { resolverPlantillaPorCriatura } from "@/servicios/resolutorCriaturas";
import { crearIndiceMonstruos } from "@/servicios/indiceMonstruos";
import { coincidePersonajeConCriaturaArea } from "./sincronizadorMovimientoIniciativa";
import {
  aplicarDanoACriaturaIndividual,
  construirEfectoCombate
} from "./utilidadesCombateIniciativa";
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
  const idsEnCola = new Set(colaIniciativa.map((c) => c.id));
  const idsSeleccionadosEnCola = (criaturasSeleccionadas || [])
    .map((s) => s.id)
    .filter((id) => idsEnCola.has(id));

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
  limiteMiembrosHorda?: number;
  colaIniciativa: CriaturaIniciativa[];
  indiceTurnoActivo: number;
  criaturasSeleccionadas: CriaturaSeleccionadaTS[];
  asociacionesFichas: Record<string, string>;
  baseDatosMonstruos: MonstruoBase[];
  rondaActual: number;
  personajes: PersonajeJugador[];
}

function obtenerBonoSalvacion(plantilla: MonstruoBase | undefined, caracteristica: Caracteristica): number {
  if (!plantilla) return 0;
  const salvacionEspecifica = plantilla.salvaciones?.[caracteristica];
  if (salvacionEspecifica !== undefined && !isNaN(salvacionEspecifica)) {
    return salvacionEspecifica;
  }
  if (plantilla.caracteristicas?.[caracteristica] !== undefined) {
    return Math.floor((plantilla.caracteristicas[caracteristica] - 10) / 2);
  }
  return 0;
}

function aplicarCondicionOEfectoSalvacion(
  criatura: CriaturaIniciativa,
  condicionOEfecto: NonNullable<ParamsEjecutarSalvacionArea["condicionOEfecto"]>,
  rondaActual: number
): CriaturaIniciativa {
  if (condicionOEfecto.tipo === "condicion") {
    return {
      ...criatura,
      condiciones: aplicarCondicion(criatura.condiciones, condicionOEfecto.nombre)
    };
  }
  const { efecto } = construirEfectoCombate(
    condicionOEfecto.nombre,
    condicionOEfecto.duracion || 10,
    rondaActual,
    { concentracion: condicionOEfecto.esConcentracion }
  );
  return {
    ...criatura,
    efectos: [...(criatura.efectos || []), efecto]
  };
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
    limiteMiembrosHorda,
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
    const bonoSalvacion = obtenerBonoSalvacion(plantilla, caracteristica);

    if (esCriaturaHorda(c) && c.barrasVida && c.barrasVida.length > 1) {
      const { criaturaActualizada: criHorda, detalle } = resolverSalvacionHordaEnArea(c, {
        cd,
        bonoSalvacion,
        danoBruto: dañoBruto,
        mitigacion,
        limiteMiembros: limiteMiembrosHorda
      });
      const huboFallo = detalle.fallos > 0;
      const criFinal = condicionOEfecto && huboFallo
        ? aplicarCondicionOEfectoSalvacion(criHorda, condicionOEfecto, rondaActual)
        : criHorda;

      resultadosLog.push({
        id: c.id,
        nombre: c.nombre,
        bono: bonoSalvacion,
        d20: detalle.d20Necesario,
        total: cd,
        exito: detalle.fallos === 0,
        dañoSufrido: dañoBruto && dañoBruto > 0 ? detalle.danoTotalAplicado : undefined,
        condicionAplicada: Boolean(condicionOEfecto && huboFallo),
        detalleHorda: detalle
      });
      return criFinal;
    }

    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + bonoSalvacion;
    const exito = total >= cd;

    let criaturaActualizada = { ...c };
    let dañoAplicado: number | undefined = undefined;
    let condicionAplicada: boolean | undefined = undefined;

    if (dañoBruto !== undefined && dañoBruto > 0) {
      dañoAplicado = exito ? (mitigacion === "nada" ? 0 : Math.floor(dañoBruto / 2)) : dañoBruto;
      criaturaActualizada = {
        ...criaturaActualizada,
        ...aplicarDanoACriaturaIndividual(criaturaActualizada, dañoAplicado)
      };
    }

    if (condicionOEfecto && !exito) {
      condicionAplicada = true;
      criaturaActualizada = aplicarCondicionOEfectoSalvacion(criaturaActualizada, condicionOEfecto, rondaActual);
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
    const c = colaModificada.find((item) => coincidePersonajeConCriaturaArea(pj, item, personajes));
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
