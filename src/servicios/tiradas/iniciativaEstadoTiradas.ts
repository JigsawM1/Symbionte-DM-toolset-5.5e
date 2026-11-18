import { usarAlmacenDM, type CriaturaIniciativa, type EstadoDM } from "@/almacen/usarAlmacenDM";
import { calcularEstadisticasPersonaje } from "@/servicios/personajes/calculadorEstadisticasPersonaje";
import { calcularBonificadorIniciativa } from "@/servicios/personajes/bonificadorIniciativa";
import { coincideIdentidadPersonaje, indiceEntradaPersonaje, resolverPersonajeAsociado } from "@/servicios/resolutorCriaturas";
import { logger } from "@/utiles/logger";
import type { AcompanantePersonaje, PersonajeJugador } from "@/tipos";
import type { MetadataIniciativa } from "@/utiles/dados/tiposDados";

function coincideAcompananteEnTirada(
  acompanante: AcompanantePersonaje,
  info: MetadataIniciativa
): boolean {
  return Boolean(
    acompanante.id === info.criaturaId ||
      acompanante.id === info.idAcompanante ||
      (info.idMiniaturaTS && acompanante.idMiniaturaTS === info.idMiniaturaTS)
  );
}

function construirCriaturaAcompananteIniciativa(
  acomp: AcompanantePersonaje,
  idPersonajeDuenio: string,
  totalIniciativa: number
): CriaturaIniciativa {
  return {
    id: acomp.idMiniaturaTS || acomp.id,
    nombre: acomp.nombre,
    iniciativa: totalIniciativa,
    vidaMaxima: acomp.vidaMaxima || 10,
    vidaActual: acomp.vidaActual !== undefined ? acomp.vidaActual : acomp.vidaMaxima || 10,
    vidaTemporal: acomp.vidaTemporal || 0,
    ca: acomp.ca || 10,
    condiciones: acomp.condiciones || [],
    efectos: acomp.efectos || [],
    bonificadorIniciativa: 0,
    esMonstruo: false,
    esAcompanante: true,
    idPersonajeDuenio,
    idAcompanante: acomp.id,
    velocidad:
      typeof acomp.velocidad === "string"
        ? acomp.velocidad
        : `${acomp.velocidad?.caminar || 30} pies`
  };
}

function construirCriaturaHeroeIniciativa(
  pj: PersonajeJugador,
  totalIniciativa: number
): CriaturaIniciativa {
  const statsPj = calcularEstadisticasPersonaje(pj);
  const caCalculada = pj.ca || statsPj.claseArmadura.total || 10;
  return {
    id: pj.idMiniaturaTS || pj.id,
    nombre: pj.nombre,
    idPersonajeDuenio: pj.id,
    iniciativa: totalIniciativa,
    vidaMaxima: pj.hpMaximo || 10,
    vidaActual: pj.hpActual !== undefined ? pj.hpActual : pj.hpMaximo || 10,
    vidaTemporal: pj.hpTemporal || 0,
    ca: caCalculada,
    condiciones: pj.condicionesActivas || [],
    efectos: [],
    bonificadorIniciativa: calcularBonificadorIniciativa(pj, statsPj.modificadores.destreza),
    esMonstruo: false,
    velocidad: `${pj.velocidad || "30 pies"}`
  };
}

function actualizarAcompanantesEnPersonajes(
  personajes: PersonajeJugador[],
  info: MetadataIniciativa,
  totalIniciativa: number
): {
  personajesModificados: boolean;
  nuevosPersonajes: PersonajeJugador[];
  acompananteEncontrado?: { acomp: AcompanantePersonaje; personajeDuenio: PersonajeJugador };
} {
  let personajesModificados = false;
  let acompananteEncontrado:
    | { acomp: AcompanantePersonaje; personajeDuenio: PersonajeJugador }
    | undefined;

  const nuevosPersonajes = personajes.map((p) => {
    const listaAcomp = p.acompanantes || [];
    let modificadoEnPj = false;
    const acompanantesActualizados = listaAcomp.map((a) => {
      if ((info.idPersonaje && p.id !== info.idPersonaje) || !coincideAcompananteEnTirada(a, info)) return a;
      modificadoEnPj = true;
      personajesModificados = true;
      if (!acompananteEncontrado) {
        acompananteEncontrado = { acomp: a, personajeDuenio: p };
      }
      return { ...a, iniciativa: totalIniciativa };
    });

    return modificadoEnPj ? { ...p, acompanantes: acompanantesActualizados } : p;
  });

  return { personajesModificados, nuevosPersonajes, acompananteEncontrado };
}

function actualizarColaExistente(
  state: EstadoDM,
  info: MetadataIniciativa,
  nombreNorm: string,
  totalIniciativa: number
): { encontrada: boolean; colaActualizada: CriaturaIniciativa[] } {
  const indicesPorId = state.colaIniciativa.flatMap((c, i) => {
      if (info.idPersonaje && c.idPersonajeDuenio && c.idPersonajeDuenio !== info.idPersonaje) return [];
      const coincide = info.idAcompanante
        ? c.idAcompanante === info.idAcompanante || c.id === info.idAcompanante || Boolean(info.idMiniaturaTS && c.id === info.idMiniaturaTS)
        : c.id === info.criaturaId || Boolean(info.idMiniaturaTS && c.id === info.idMiniaturaTS);
      return coincide ? [i] : [];
    });
  // Una fila identificada no se reclasifica por el nombre de otra ficha.
  const pj = !info.idAcompanante ? resolverPersonajeAsociado(
    info.idMiniaturaTS || info.criaturaId, indicesPorId.length ? "" : info.nombrePersonaje || "", state.personajes, info.idPersonaje
  ) : undefined;
  const indices = indicesPorId.length ? indicesPorId
    : pj ? [indiceEntradaPersonaje(state.colaIniciativa, pj, state.personajes)].filter(i => i >= 0) : [];
  if (!indices.length && !info.idAcompanante) {
    const genericas = state.colaIniciativa.flatMap((c, i) => !c.idPersonajeDuenio && !c.idAcompanante && !c.esAcompanante
      && !c.idPlantillaAsociada && !state.personajes.some(p => coincideIdentidadPersonaje(c, p))
      && Boolean(nombreNorm) && c.nombre.trim().toLowerCase() === nombreNorm ? [i] : []);
    if (genericas.length === 1) indices.push(genericas[0]);
  }
  const colaActualizada = state.colaIniciativa.map((c, indice) => {
    if (!indices.includes(indice)) return c;
    const esDeJugador = Boolean(pj || info.idPersonaje || info.idAcompanante || !c.esMonstruo);
    return { ...c, iniciativa: totalIniciativa,
      ...(esDeJugador ? { esMonstruo: false, idPlantillaAsociada: undefined } : {}) };
  });
  return { encontrada: indices.length > 0, colaActualizada };
}

/**
 * Aplica el resultado de una tirada de iniciativa en el estado global del DM.
 * Actualiza la criatura existente o incorpora automáticamente al acompañante, héroe o criatura a la cola.
 */
export function aplicarResultadoIniciativaEnEstado(
  infoIniciativa: MetadataIniciativa,
  totalIniciativa: number
): void {
  const state = usarAlmacenDM.getState();
  const nombreNorm = (infoIniciativa.nombrePersonaje || "").trim().toLowerCase();

  const { encontrada, colaActualizada } = actualizarColaExistente(
    state,
    infoIniciativa,
    nombreNorm,
    totalIniciativa
  );
  const { personajesModificados, nuevosPersonajes, acompananteEncontrado } =
    actualizarAcompanantesEnPersonajes(
      state.personajes,
      infoIniciativa,
      totalIniciativa
    );

  if (encontrada) {
    // No auto-ordenar por iniciativa: TaleSpire es la fuente de la verdad para el orden
    usarAlmacenDM.setState({
      colaIniciativa: colaActualizada,
      ...(personajesModificados ? { personajes: nuevosPersonajes } : {})
    });
    logger.info(`[Lanzador Dados] Iniciativa actualizada para criatura existente a ${totalIniciativa}`);
    return;
  }

  if (acompananteEncontrado) {
    const { acomp, personajeDuenio } = acompananteEncontrado;
    const nuevaCriaturaAcomp = construirCriaturaAcompananteIniciativa(
      acomp,
      personajeDuenio.id,
      totalIniciativa
    );
    usarAlmacenDM.setState({
      colaIniciativa: [...state.colaIniciativa, nuevaCriaturaAcomp],
      personajes: nuevosPersonajes
    });
    logger.info(
      `[Lanzador Dados] Acompañante ${acomp.nombre} de ${personajeDuenio.nombre} añadido a la cola con valor ${totalIniciativa}`
    );
    return;
  }

  const pj = !infoIniciativa.idAcompanante ? resolverPersonajeAsociado(
    infoIniciativa.idMiniaturaTS || infoIniciativa.criaturaId,
    infoIniciativa.nombrePersonaje || "", state.personajes, infoIniciativa.idPersonaje
  ) : undefined;

  const nuevaCriatura: CriaturaIniciativa = pj
    ? construirCriaturaHeroeIniciativa(pj, totalIniciativa)
    : {
        id: infoIniciativa.criaturaId,
        nombre: infoIniciativa.nombrePersonaje || "Combatiente",
        iniciativa: totalIniciativa,
        vidaMaxima: 10,
        vidaActual: 10,
        ca: 10,
        condiciones: [],
        bonificadorIniciativa: 0,
        esMonstruo: true,
        velocidad: "30 pies",
        vidaTemporal: 0
      };

  usarAlmacenDM.setState({
    colaIniciativa: [...state.colaIniciativa, nuevaCriatura],
    ...(personajesModificados ? { personajes: nuevosPersonajes } : {})
  });
  if (pj) {
    logger.info(
      `[Lanzador Dados] Héroe ${pj.nombre} añadido a la cola de iniciativa con valor ${totalIniciativa}`
    );
  }
}
