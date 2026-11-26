import type { RasgoAccionCombate } from "@/servicios/calculadorAccionesCombate";
import type { TipoAccionConsumida } from "@/tipos";

/**
 * Resultado de clasificar los rasgos tácticos de combate entre la barra superior
 * de switches (Opción C) y el feed plano inferior (Opción A).
 */
export interface RasgosClasificadosFlujoPlano {
  rasgosSwitches: RasgoAccionCombate[];
  rasgosFeed: RasgoAccionCombate[];
}

/**
 * Determina si un rasgo táctico admite conmutación directa y debe promoverse
 * a la barra superior de Modos Activos / Switches de Combate.
 *
 * Excluye rasgos ocultos, transformaciones de Forma Salvaje (requieren elegir bestia),
 * lanzamientos al activar aún inactivos, consultas al atacar aún inactivas,
 * resolución asistida y listas/conjuros de recurso.
 */
export function esRasgoSwitchCombate(item: RasgoAccionCombate): boolean {
  const r = item.rasgo;
  return Boolean(
    item.esActivable &&
      !r.oculto &&
      !r.formasBestia &&
      (!r.lanzamientoConActivacion || r.activo) &&
      (!r.preguntarAlAtacar || r.activo) &&
      !r.resolucionAsistida &&
      !r.lanzamientoConRecurso?.lista &&
      !r.lanzamientoConRecurso?.conjuros &&
      !r.conversionEspacios
  );
}

/**
 * Indica si un rasgo ya promovido a switch necesita conservar su tarjeta
 * en el feed plano inferior porque expone tiradas o acciones adicionales propias.
 */
export function requiereTarjetaEnFeedAdemasDeSwitch(item: RasgoAccionCombate): boolean {
  const r = item.rasgo;
  return Boolean(
    (item.tieneDados && !r.dadosSoloDependientes) ||
      r.guardaDadosTirada ||
      r.tiradaCuracion ||
      r.tiradaCuracionManual ||
      r.recargaConEspacio ||
      r.recuperarEspacios
  );
}

/**
 * Separa los rasgos tácticos en switches superiores y tarjetas de feed sin duplicarlos,
 * preservando el orden estable de los switches para evitar saltos bajo el puntero al pulsarlos.
 */
export function dividirRasgosParaFlujoPlano(
  listaRasgosCombate: RasgoAccionCombate[]
): RasgosClasificadosFlujoPlano {
  const rasgosSwitches: RasgoAccionCombate[] = [];
  const rasgosFeed: RasgoAccionCombate[] = [];

  for (const item of listaRasgosCombate) {
    if (esRasgoSwitchCombate(item)) {
      rasgosSwitches.push(item);
      if (requiereTarjetaEnFeedAdemasDeSwitch(item)) {
        rasgosFeed.push(item);
      }
      continue;
    }

    rasgosFeed.push(item);
  }

  return { rasgosSwitches, rasgosFeed };
}

export interface ConteosFeedCombate {
  conteoTotal: number;
  conteoAccion: number;
  conteoAccionAdicional: number;
  conteoReaccion: number;
  conteoConsumibles: number;
}

/**
 * Calcula en una sola pasada por lista los contadores mostrados en las 5 píldoras de filtro.
 */
export function calcularConteosFeedCombate(
  armas: ReadonlyArray<{ tipoAccion: TipoAccionConsumida }>,
  conjuros: ReadonlyArray<{ tipoAccion: TipoAccionConsumida }>,
  consumibles: ReadonlyArray<{ tipoAccion: TipoAccionConsumida }>,
  hechizosObjetos: ReadonlyArray<{ tipoAccion: TipoAccionConsumida }>,
  rasgosFeed: readonly RasgoAccionCombate[]
): ConteosFeedCombate {
  let accion = 0;
  let adicional = 0;
  let reaccion = 0;

  const sumarTipo = (tipo: TipoAccionConsumida) => {
    if (tipo === "accion") accion++;
    else if (tipo === "accionAdicional") adicional++;
    else if (tipo === "reaccion") reaccion++;
  };

  for (const a of armas) sumarTipo(a.tipoAccion);
  for (const c of conjuros) sumarTipo(c.tipoAccion);
  for (const c of consumibles) sumarTipo(c.tipoAccion);
  for (const h of hechizosObjetos) sumarTipo(h.tipoAccion);

  let rasgosConsumibles = 0;
  for (const r of rasgosFeed) {
    if (r.categoriasCombate.includes("accion")) accion++;
    if (r.categoriasCombate.includes("accionAdicional")) adicional++;
    if (r.categoriasCombate.includes("reaccion")) reaccion++;
    if (r.categoriasCombate.includes("consumible")) rasgosConsumibles++;
  }

  return {
    conteoTotal:
      armas.length + conjuros.length + consumibles.length + hechizosObjetos.length + rasgosFeed.length,
    conteoAccion: accion,
    conteoAccionAdicional: adicional,
    conteoReaccion: reaccion,
    conteoConsumibles: consumibles.length + rasgosConsumibles
  };
}
