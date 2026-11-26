import type { PersonajeJugador, RasgoPersonaje, RespuestaPredefinidaRasgo } from "@/tipos";
import {
  calcularCosteResolucionAsistida,
  prepararResolucionAsistida,
  type SolicitudResolucionAsistida
} from "./resolucionAsistidaRasgos";

export type FlujoRespuesta = keyof RespuestaPredefinidaRasgo;

export interface GrupoPredefinible {
  flujo: FlujoRespuesta;
  titulo: string;
  opciones: { valor: string; etiqueta: string }[];
  maxMultiple?: number;
}

/** Indica si activar el rasgo consume algún recurso limitado propio, del padre o de pacto. */
export function rasgoGastaUsosAlActivar(r: RasgoPersonaje): boolean {
  return Boolean(
    (r.tieneUsosLimitados && !r.noGastarUsoAlActivar)
    || r.gastarDePadre
    || r.costeActivacionPorSelector
    || r.recursoGastado === "espacio_pacto"
  );
}

const OPCION_PREGUNTAR = { valor: "preguntar", etiqueta: "Preguntar siempre" };

/**
 * Devuelve los grupos de respuestas predefinidas configurables para un rasgo,
 * aplicando la regla de seguridad: los flujos con gasto de usos solo permiten «Omitir».
 */
export function obtenerGruposPredefiniblesRasgo(r: RasgoPersonaje): GrupoPredefinible[] {
  const grupos: GrupoPredefinible[] = [];

  if (r.preguntarAlAtacar) {
    const opciones = [
      OPCION_PREGUNTAR,
      { valor: "omitir", etiqueta: "Omitir siempre" }
    ];
    if (!rasgoGastaUsosAlActivar(r)) {
      opciones.push({
        valor: "activar",
        etiqueta: r.preguntarAlAtacar.etiquetaActivar ?? `Activar ${r.nombre}`
      });
    }
    grupos.push({ flujo: "alAtacar", titulo: "Antes de atacar", opciones });
  }

  if (r.resolucionAsistida?.integrarEnDanoDeArma) {
    grupos.push({
      flujo: "danoIntegrado",
      titulo: "Daño adicional al impactar",
      opciones: [
        OPCION_PREGUNTAR,
        { valor: "omitir", etiqueta: "Omitir siempre" },
        ...r.resolucionAsistida.opciones
          .filter(o => o.tipo === "dano")
          .map(o => ({ valor: `auto:${o.id}`, etiqueta: `Aplicar: ${o.etiqueta}` }))
      ]
    });
  }

  if (r.eleccionEfectoEnTirada?.opciones?.length) {
    grupos.push({
      flujo: "efectosTirada",
      titulo: r.eleccionEfectoEnTirada.etiqueta ?? "Efecto en tirada",
      maxMultiple: r.eleccionEfectoEnTirada.maxElecciones ?? 1,
      opciones: [
        OPCION_PREGUNTAR,
        ...r.eleccionEfectoEnTirada.opciones.map(o => ({ valor: o.id, etiqueta: o.nombre }))
      ]
    });
  }

  if (r.cambiarTipoDanoBestia) {
    grupos.push({
      flujo: "tipoDanoBestia",
      titulo: "Tipo de daño en Forma Salvaje",
      opciones: [
        OPCION_PREGUNTAR,
        { valor: "normal", etiqueta: "Tipo normal del ataque" },
        { valor: "cambiar", etiqueta: `Cambiar a ${r.cambiarTipoDanoBestia}` }
      ]
    });
  }

  // ponytail: estas 5 mecánicas de consulta son mutuamente excluyentes en el catálogo actual; separar claves si un rasgo homebrew combina dos.
  if (r.iniciativaOpcional) {
    grupos.push({
      flujo: "consulta",
      titulo: "Iniciativa opcional",
      opciones: [
        OPCION_PREGUNTAR,
        { valor: "omitir", etiqueta: "Tirar sin gastar Inspiración" }
      ]
    });
  } else if (r.trasLanzarConjuro) {
    grupos.push({
      flujo: "consulta",
      titulo: "Tras lanzar un conjuro",
      opciones: [
        OPCION_PREGUNTAR,
        { valor: "omitir", etiqueta: "No usar automáticamente" }
      ]
    });
  } else if (r.curacionConjuros?.bonoPorEspacio) {
    grupos.push({
      flujo: "consulta",
      titulo: "Bono de curación en el turno",
      opciones: [
        OPCION_PREGUNTAR,
        { valor: "omitir", etiqueta: "Resolver sin bono condicionado" },
        { valor: "automatico", etiqueta: "Aplicar bono en este turno" }
      ]
    });
  } else if (r.varianteSinConcentracion) {
    grupos.push({
      flujo: "consulta",
      titulo: "Duración sin concentración",
      opciones: [
        OPCION_PREGUNTAR,
        { valor: "omitir", etiqueta: "Duración normal con concentración" },
        { valor: "automatico", etiqueta: "1 minuto sin concentración" }
      ]
    });
  } else if (r.efectos?.some(e => e.tipo === "minimo_d20" && e.objetivo.split(",").includes("concentracion"))) {
    grupos.push({
      flujo: "consulta",
      titulo: "Salvación de concentración",
      opciones: [
        OPCION_PREGUNTAR,
        { valor: "omitir", etiqueta: "Salvación normal" },
        { valor: "automatico", etiqueta: "Aplicar mínimo en concentración" }
      ]
    });
  }

  if (r.resolucionAsistida && !r.resolucionAsistida.integrarEnDanoDeArma) {
    grupos.push({
      flujo: "resolucion",
      titulo: "Resolución de capacidad",
      opciones: [
        OPCION_PREGUNTAR,
        ...r.resolucionAsistida.opciones.map(o => ({
          valor: `auto:${o.id}`,
          etiqueta: `Preseleccionar: ${o.etiqueta}`
        }))
      ]
    });
  }

  return grupos;
}

/** Aplica de forma pura el valor elegido en un flujo de respuesta predefinida. */
export function aplicarValorPredefinido(
  actual: RespuestaPredefinidaRasgo | undefined,
  flujo: FlujoRespuesta,
  valor: string | string[]
): RespuestaPredefinidaRasgo | undefined {
  const siguiente: RespuestaPredefinidaRasgo = { ...(actual ?? {}) };

  if (valor === "preguntar" || (Array.isArray(valor) && valor.length === 0)) {
    delete siguiente[flujo];
  } else if (flujo === "alAtacar") {
    if (valor === "omitir" || valor === "activar") siguiente.alAtacar = valor;
  } else if (flujo === "danoIntegrado") {
    if (valor === "omitir") siguiente.danoIntegrado = { modo: "omitir" };
    else if (typeof valor === "string" && valor.startsWith("auto:")) {
      siguiente.danoIntegrado = { modo: "automatico", idOpcion: valor.slice(5) };
    }
  } else if (flujo === "efectosTirada") {
    const lista = (Array.isArray(valor) ? valor : [valor]).filter(v => v && v !== "preguntar");
    if (lista.length) siguiente.efectosTirada = lista;
    else delete siguiente.efectosTirada;
  } else if (flujo === "tipoDanoBestia") {
    if (valor === "normal" || valor === "cambiar") siguiente.tipoDanoBestia = valor;
  } else if (flujo === "consulta") {
    if (valor === "omitir" || valor === "automatico") siguiente.consulta = valor;
  } else if (flujo === "resolucion") {
    if (typeof valor === "string" && valor.startsWith("auto:")) {
      siguiente.resolucion = { ...(actual?.resolucion ?? {}), idOpcion: valor.slice(5) };
    }
  }

  return Object.keys(siguiente).length > 0 ? siguiente : undefined;
}

/** Devuelve el identificador de opción predefinida vigente para el flujo o "preguntar". */
export function valorPredefinido(r: RasgoPersonaje, flujo: FlujoRespuesta): string {
  const pref = r.respuestaPredefinida;
  if (!pref) return "preguntar";
  switch (flujo) {
    case "alAtacar":
      return pref.alAtacar ?? "preguntar";
    case "danoIntegrado":
      if (!pref.danoIntegrado) return "preguntar";
      if (pref.danoIntegrado.modo === "omitir") return "omitir";
      return pref.danoIntegrado.idOpcion ? `auto:${pref.danoIntegrado.idOpcion}` : "preguntar";
    case "efectosTirada":
      return pref.efectosTirada?.length ? pref.efectosTirada[0] : "preguntar";
    case "tipoDanoBestia":
      return pref.tipoDanoBestia ?? "preguntar";
    case "consulta":
      return pref.consulta ?? "preguntar";
    case "resolucion":
      return pref.resolucion?.idOpcion ? `auto:${pref.resolucion.idOpcion}` : "preguntar";
  }
}

/** Genera un resumen compacto para mostrar en la píldora de la tarjeta del rasgo. */
export function resumenRespuestaPredefinida(r: RasgoPersonaje): string | undefined {
  const pref = r.respuestaPredefinida;
  if (!pref) return undefined;

  const partes: string[] = [];

  if (pref.alAtacar === "activar") partes.push("Activar");
  else if (pref.alAtacar === "omitir") partes.push("Omitir");

  if (pref.danoIntegrado) {
    if (pref.danoIntegrado.modo === "omitir") partes.push("Omitir");
    else if (pref.danoIntegrado.idOpcion) {
      const etiq = r.resolucionAsistida?.opciones.find(o => o.id === pref.danoIntegrado?.idOpcion)?.etiqueta;
      if (etiq) partes.push(etiq);
    }
  }

  if (pref.efectosTirada?.length && r.eleccionEfectoEnTirada?.opciones?.length) {
    const nombres = pref.efectosTirada
      .map(id => r.eleccionEfectoEnTirada?.opciones?.find(o => o.id === id)?.nombre)
      .filter((n): n is string => Boolean(n));
    if (nombres.length) partes.push(nombres.join(" + "));
  }

  if (pref.tipoDanoBestia === "cambiar") {
    partes.push(r.cambiarTipoDanoBestia ?? "Cambiar tipo");
  } else if (pref.tipoDanoBestia === "normal") {
    partes.push("Tipo normal");
  }

  if (pref.consulta === "omitir") partes.push("Omitir");
  else if (pref.consulta === "automatico") partes.push("Automático");

  if (pref.resolucion?.idOpcion) {
    const etiq = r.resolucionAsistida?.opciones.find(o => o.id === pref.resolucion?.idOpcion)?.etiqueta;
    if (etiq) partes.push(etiq);
  }

  return partes.length ? `Auto: ${partes.join(" · ")}` : undefined;
}

/**
 * Construye una solicitud lista para ejecutar en 1 clic desde la tarjeta del rasgo
 * solo cuando no consume usos limitados ni requiere ataque previo o entradas situacionales.
 */
export function resolverSolicitudUnClic(pj: PersonajeJugador, r: RasgoPersonaje): SolicitudResolucionAsistida | undefined {
  const pref = r.respuestaPredefinida?.resolucion;
  const cfg = r.resolucionAsistida;
  if (!pref || !cfg || cfg.integrarEnDanoDeArma) return undefined;
  if (calcularCosteResolucionAsistida(r) > 0) return undefined;
  if (cfg.ataqueConjuro) return undefined;
  if (cfg.reparto && pref.propio) return undefined;

  const opcionesValidas = cfg.opciones.filter(o => !o.resultadoTabla || o.resultadoTabla === r.resultadoTabla?.idFila);
  const opcion = opcionesValidas.find(o => o.id === pref.idOpcion);
  if (!opcion) return undefined;
  if (opcion.tipo === "modificador_tirada" && !opcion.resultadoTabla) return undefined;

  const solicitud: SolicitudResolucionAsistida = {
    idRasgo: r.id,
    idOpcion: opcion.id,
    incluirDados: Boolean(pref.incluirDados),
    propio: Boolean(pref.propio),
    confirmado: true,
    cantidadPropia: pref.cantidadPropia ?? 0,
    tiradaOriginal: 0
  };
  return prepararResolucionAsistida(pj, solicitud) ? solicitud : undefined;
}
