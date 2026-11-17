import { usarAlmacenDM, type CriaturaIniciativa, type EstadoDM } from "@/almacen/usarAlmacenDM";
import { calcularEstadisticasPersonaje } from "@/servicios/personajes/calculadorEstadisticasPersonaje";
import { calcularBonoIniciativaRasgos } from "@/servicios/evaluadorEfectosRasgos";
import { logger } from "@/utiles/logger";
import type { AcompanantePersonaje, PersonajeJugador } from "@/tipos";
import type { MetadataIniciativa } from "@/utiles/dados/tiposDados";

function coincideAcompananteEnTirada(
  acompanante: AcompanantePersonaje,
  info: MetadataIniciativa,
  nombreNorm: string
): boolean {
  return Boolean(
    acompanante.id === info.criaturaId ||
      acompanante.id === info.idAcompanante ||
      (info.idMiniaturaTS && acompanante.idMiniaturaTS === info.idMiniaturaTS) ||
      (nombreNorm && acompanante.nombre.trim().toLowerCase() === nombreNorm)
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
    iniciativa: totalIniciativa,
    vidaMaxima: pj.hpMaximo || 10,
    vidaActual: pj.hpActual !== undefined ? pj.hpActual : pj.hpMaximo || 10,
    vidaTemporal: pj.hpTemporal || 0,
    ca: caCalculada,
    condiciones: pj.condicionesActivas || [],
    efectos: [],
    bonificadorIniciativa:
      statsPj.modificadores.destreza +
      (pj.iniciativaBono || 0) +
      calcularBonoIniciativaRasgos(pj),
    esMonstruo: false,
    velocidad: `${pj.velocidad || "30 pies"}`
  };
}

function actualizarAcompanantesEnPersonajes(
  personajes: PersonajeJugador[],
  info: MetadataIniciativa,
  nombreNorm: string,
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
      if (!coincideAcompananteEnTirada(a, info, nombreNorm)) return a;
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
  let encontrada = false;
  const colaActualizada = state.colaIniciativa.map((c) => {
    const coincideAcomp =
      Boolean(info.idAcompanante) &&
      (c.id === info.idAcompanante ||
        c.idAcompanante === info.idAcompanante ||
        (info.idMiniaturaTS && c.id === info.idMiniaturaTS));

    const coincideId =
      c.id === info.criaturaId ||
      (info.idMiniaturaTS && c.id === info.idMiniaturaTS) ||
      (!info.idAcompanante && info.idPersonaje && c.id === info.idPersonaje);

    const coincideNombre =
      Boolean(nombreNorm) &&
      c.nombre.trim().toLowerCase() === nombreNorm &&
      (!info.idAcompanante || Boolean(c.esAcompanante) || Boolean(c.idAcompanante));

    if (coincideAcomp || coincideId || coincideNombre) {
      encontrada = true;
      const esDeJugador = Boolean(info.idPersonaje || coincideAcomp || !c.esMonstruo);
      return {
        ...c,
        iniciativa: totalIniciativa,
        ...(esDeJugador ? { esMonstruo: false, idPlantillaAsociada: undefined } : {})
      };
    }
    return c;
  });

  return { encontrada, colaActualizada };
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
      nombreNorm,
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

  const pj = state.personajes.find(
    (p) =>
      (!infoIniciativa.idAcompanante && p.id === infoIniciativa.idPersonaje) ||
      (infoIniciativa.idMiniaturaTS && p.idMiniaturaTS === infoIniciativa.idMiniaturaTS) ||
      (nombreNorm && p.nombre.trim().toLowerCase() === nombreNorm)
  );

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
