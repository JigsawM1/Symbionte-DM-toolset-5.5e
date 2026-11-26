import type {
  AtaquePersonajeCalculado,
  Caracteristica,
  PersonajeJugador,
  RasgoPersonaje
} from "@/tipos";
import { evaluarEfectosCondicionesEnTirada } from "../procesadorCondiciones";
import { rasgoMagicoHabilitado } from "./ampliacionesListaConjuros";
import { aplicaEfectoAAtaque, type ContextoAtaquePersonaje } from "./evaluadorCombateRasgos";
import { cumpleCondicionEfecto } from "./evaluadorExpresionesRasgos";
import { resolverExtensionesRasgos } from "./extensionesRasgos";
import { disponibleEnTurnoPropio } from "./limitesTurnoRasgos";
import { estaRasgoActivo } from "./utilidadesRasgos";

const TIPOS_EFECTO_DANO = new Set(["dado_extra_dano", "dano_secundario", "bono_dano_ataque", "bono_dano_fuerza"]);

export interface OpcionesConsultaAtaque {
  turno?: string | false;
  tipoTiradaManual?: "plano" | "ventaja" | "desventaja";
  penalizacionArmadura?: boolean;
}

/**
 * Devuelve los rasgos activables declarados con `preguntarAlAtacar` que son elegibles
 * antes de lanzar la tirada de ataque dada, sin bifurcaciones por nombre de rasgo o clase.
 */
export function obtenerRasgosPreguntablesEnAtaque(
  pj: PersonajeJugador,
  ataque: AtaquePersonajeCalculado,
  opciones?: OpcionesConsultaAtaque
): RasgoPersonaje[] {
  let tieneDesventajaCache: boolean | undefined;

  const tieneDesventajaEnAtaque = (): boolean => {
    if (opciones?.tipoTiradaManual === "desventaja") return true;
    if (tieneDesventajaCache === undefined) {
      tieneDesventajaCache = evaluarEfectosCondicionesEnTirada({
        tipo: "ataque",
        caracteristica: ataque.caracteristicaUsada as Caracteristica,
        penalizacionArmadura: Boolean(opciones?.penalizacionArmadura),
        condicionesActivas: pj.condicionesActivas,
        personaje: pj
      }).tieneDesventaja;
    }
    return tieneDesventajaCache;
  };

  return (pj.rasgos || []).filter((r) => {
    const cfg = r.preguntarAlAtacar;
    if (!cfg || !r.esActivable || r.activo) return false;
    if (cfg.soloArmaODesarmado && ataque.tipo !== "Arma" && ataque.tipo !== "Desarmado") return false;
    if (cfg.caracteristica && ataque.caracteristicaUsada !== cfg.caracteristica) return false;
    if (!rasgoMagicoHabilitado(pj, { ...r, activo: true })) return false;
    if (r.ligadoA && !estaRasgoActivo(pj, r.ligadoA)) return false;

    if (r.tieneUsosLimitados) {
      const disponibles = r.usosRestantes ?? r.usosMaximos ?? 0;
      if (disponibles < (r.costeFijo ?? 1) || r.recuperacionDiferida) return false;
    }

    if ((r.limitePorTurnoPropio || r.limitePorTurno) && !disponibleEnTurnoPropio(r, opciones?.turno, pj)) {
      return false;
    }

    const renunciaVentaja = r.efectos?.some(
      (e) =>
        e.tipo === "renunciar_ventaja" &&
        e.objetivo === `ataque.${ataque.caracteristicaUsada}` &&
        Number(e.valor) > 0
    );
    if (renunciaVentaja && tieneDesventajaEnAtaque()) return false;

    return true;
  });
}

/**
 * Devuelve los rasgos activos con `eleccionEfectoEnTirada` aplicable al momento de tirar el daño
 * del ataque indicado, tras fusionar las extensiones de nivel.
 */
export function obtenerRasgosConEleccionEfectoEnDano(
  pj: PersonajeJugador,
  ataque: AtaquePersonajeCalculado
): RasgoPersonaje[] {
  const contexto: ContextoAtaquePersonaje = {
    tipo: ataque.tipo === "Desarmado" ? "desarmado" : ataque.tipo === "Conjuro" ? "conjuro" : "arma",
    caracteristica: ataque.caracteristicaUsada,
    esDistancia: Boolean(ataque.esDistancia),
    esCuerpoACuerpo: !ataque.esDistancia,
    propiedades: ataque.propiedades
  };
  const efectivos = resolverExtensionesRasgos(pj.rasgos || [], pj.nivel);
  return efectivos.filter((r) => {
    if (r.activo === false || (r.esActivable && !r.activo)) return false;
    const cfg = r.eleccionEfectoEnTirada;
    if (!cfg || (cfg.momento ?? "dano") !== "dano" || !cfg.opciones?.length) return false;
    if (r.ligadoA && !estaRasgoActivo(pj, r.ligadoA)) return false;
    const efectosDano = r.efectos?.filter((e) => TIPOS_EFECTO_DANO.has(e.tipo)) ?? [];
    return !efectosDano.length || efectosDano.some(
      (e) => e.activo !== false && cumpleCondicionEfecto(e.condicion, pj) && aplicaEfectoAAtaque(e.aplicaA, e.objetivo, contexto)
    );
  });
}
