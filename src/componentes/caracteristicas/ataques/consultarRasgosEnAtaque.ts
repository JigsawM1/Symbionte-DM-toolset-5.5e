import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { elegirOpcionLanzamiento } from "@/componentes/caracteristicas/rasgos/elegirVarianteConjuro";
import { guardarRespuestaPredefinida } from "@/componentes/caracteristicas/rasgos/guardarRespuestaPredefinida";
import { rasgoMagicoHabilitado } from "@/servicios/rasgos/ampliacionesListaConjuros";
import {
  obtenerRasgosConEleccionEfectoEnDano,
  obtenerRasgosPreguntablesEnAtaque
} from "@/servicios/rasgos/consultaAtaqueRasgos";
import { disponibleEnTurnoPropio, identificarTurnoRasgo } from "@/servicios/rasgos/limitesTurnoRasgos";
import {
  prepararDanoIntegrado,
  type DanoIntegrado,
  type SolicitudResolucionAsistida
} from "@/servicios/rasgos/resolucionAsistidaRasgos";
import { rasgoGastaUsosAlActivar } from "@/servicios/rasgos/respuestasPredefinidasRasgos";
import type { AtaquePersonajeCalculado, PersonajeJugador } from "@/tipos";

/**
 * Consulta secuencialmente al jugador sobre los rasgos activables declarados con `preguntarAlAtacar`.
 * Devuelve la ficha vigente tras las elecciones o `undefined` si el jugador cancela.
 */
export async function consultarRasgosAntesDeAtaque(
  idPersonaje: string,
  ataque: AtaquePersonajeCalculado,
  tipoTiradaManual: "plano" | "ventaja" | "desventaja",
  penalizacionArmadura: boolean
): Promise<PersonajeJugador | undefined> {
  const preguntados = new Set<string>();
  while (true) {
    const estado = usarAlmacenDM.getState();
    const actual = estado.personajes.find((p) => p.id === idPersonaje);
    if (!actual) return undefined;

    const candidatos = obtenerRasgosPreguntablesEnAtaque(actual, ataque, {
      tipoTiradaManual,
      penalizacionArmadura
    });
    const siguiente = candidatos.find((r) => {
      if (preguntados.has(r.id)) return false;
      if (!r.limitePorTurnoPropio && !r.limitePorTurno) return true;
      return disponibleEnTurnoPropio(r, identificarTurnoRasgo(r, actual, estado), actual);
    });
    if (!siguiente) return actual;

    preguntados.add(siguiente.id);
    const pref = siguiente.respuestaPredefinida?.alAtacar;
    const gastaUsos = rasgoGastaUsosAlActivar(siguiente);
    if (pref === "omitir") continue;
    if (pref === "activar" && !gastaUsos) {
      estado.alternarActivoRasgo(actual.id, siguiente.id);
      continue;
    }

    const eleccion = await elegirOpcionLanzamiento(actual.id, {
      nombre: siguiente.nombre,
      etiqueta: "Antes de tirar el ataque",
      descripcion: siguiente.preguntarAlAtacar!.descripcion ?? siguiente.descripcion,
      opciones: [
        { id: "omitir", texto: "Atacar sin activar" },
        {
          id: "activar",
          texto: siguiente.preguntarAlAtacar!.etiquetaActivar ?? `Activar ${siguiente.nombre}`,
          detalle: siguiente.formulaDados
        }
      ],
      recordar: {
        permitido: (id) => id === "omitir" || (id === "activar" && !gastaUsos),
        alRecordar: (id) => {
          if (id === "omitir" || id === "activar") {
            guardarRespuestaPredefinida(actual.id, siguiente.id, "alAtacar", id);
          }
        },
        aviso: gastaUsos ? "Este rasgo consume usos: solo se puede recordar «Atacar sin activar»." : undefined
      }
    });
    if (eleccion === undefined) return undefined;
    if (eleccion === "activar") {
      usarAlmacenDM.getState().alternarActivoRasgo(actual.id, siguiente.id);
    }
  }
}

/**
 * Consulta las opciones de `eleccionEfectoEnTirada` aplicables al daño para anunciarlas en la etiqueta de TaleSpire.
 * Devuelve `undefined` si el jugador cancela el diálogo.
 */
export async function consultarEfectosEtiquetaEnDano(
  pj: PersonajeJugador,
  ataque: AtaquePersonajeCalculado
): Promise<string[] | undefined> {
  const etiquetas: string[] = [];
  for (const r of obtenerRasgosConEleccionEfectoEnDano(pj, ataque)) {
    const cfg = r.eleccionEfectoEnTirada!;
    const maximo = Math.max(1, cfg.maxElecciones ?? 1);
    const prefIds = r.respuestaPredefinida?.efectosTirada ?? [];
    const validasPref = prefIds
      .map((id) => cfg.opciones?.find((o) => o.id === id))
      .filter((o): o is NonNullable<typeof o> => Boolean(o))
      .slice(0, maximo);
    if (validasPref.length > 0) {
      for (const o of validasPref) etiquetas.push(o.nombre);
      continue;
    }

    let recordarElegido = false;
    const idsElegidos: string[] = [];
    let restantes = [...(cfg.opciones ?? [])];
    for (let paso = 0; paso < maximo && restantes.length > 0; paso++) {
      const opciones = [
        ...(paso > 0 ? [{ id: "ninguno", texto: "Sin efecto adicional" }] : []),
        ...restantes.map((o) => ({ id: o.id, texto: o.nombre, detalle: o.detalle }))
      ];
      const etiquetaPaso = maximo > 1
        ? `${cfg.etiqueta ?? "Efecto al impactar"} (${paso + 1}/${maximo})`
        : (cfg.etiqueta ?? "Efecto al impactar");
      const eleccion = await elegirOpcionLanzamiento(pj.id, {
        nombre: r.nombre,
        etiqueta: etiquetaPaso,
        descripcion: "Elige el efecto que se anunciará en la tirada de daño.",
        opciones,
        recordar: {
          permitido: (id) => id !== "ninguno",
          alRecordar: () => {
            recordarElegido = true;
          }
        }
      });
      if (eleccion === undefined) return undefined;
      if (eleccion === "ninguno") break;
      const elegida = restantes.find((o) => o.id === eleccion);
      if (elegida) {
        etiquetas.push(elegida.nombre);
        idsElegidos.push(elegida.id);
        restantes = restantes.filter((o) => o.id !== elegida.id);
      }
    }
    if (recordarElegido && idsElegidos.length > 0) {
      guardarRespuestaPredefinida(pj.id, r.id, "efectosTirada", idsElegidos);
    }
  }
  return etiquetas;
}

/**
 * Orquesta las preguntas previas a emitir la tirada de daño físico o crítico:
 * tipo alternativo de bestia, daños integrados en arma/desarmado y etiquetas de efectos elegidos.
 */
export async function ejecutarConsultaDanoAtaque(
  idPersonaje: string,
  ataque: AtaquePersonajeCalculado,
  emitir: (extra?: DanoIntegrado[], tipoElegido?: string, efectosEtiqueta?: string[]) => Promise<boolean>
): Promise<boolean> {
  const estado = usarAlmacenDM.getState();
  const pj = estado.personajes.find((p) => p.id === idPersonaje);
  if (!pj) return false;
  if ((ataque.tipo !== "Arma" && ataque.tipo !== "Desarmado") || !ataque.tieneTiradaAtaque) return emitir();

  const bestia = ataque.subtipo === "Forma Salvaje";
  const rasgoTipoBestia = bestia
    ? pj.rasgos.find((r) => r.cambiarTipoDanoBestia && rasgoMagicoHabilitado(pj, r))
    : undefined;
  const tipoAlternativo = rasgoTipoBestia?.cambiarTipoDanoBestia;
  let tipoElegido: string | undefined;
  if (rasgoTipoBestia && tipoAlternativo) {
    const prefBestia = rasgoTipoBestia.respuestaPredefinida?.tipoDanoBestia;
    if (prefBestia === "cambiar") {
      tipoElegido = tipoAlternativo;
    } else if (prefBestia !== "normal") {
      const elegido = await elegirOpcionLanzamiento(pj.id, {
        nombre: ataque.nombre,
        etiqueta: "Tipo de daño al impactar",
        descripcion: "Tras confirmar el impacto, elige el tipo de daño del ataque.",
        opciones: [
          { id: "normal", texto: "Tipo normal", detalle: ataque.tipoDano },
          { id: "cambiar", texto: tipoAlternativo }
        ],
        recordar: {
          permitido: (id) => id === "normal" || id === "cambiar",
          alRecordar: (id) => guardarRespuestaPredefinida(pj.id, rasgoTipoBestia.id, "tipoDanoBestia", id)
        }
      });
      if (!elegido) return false;
      if (elegido === "cambiar") tipoElegido = tipoAlternativo;
    }
  }

  const elegidas: { solicitud: SolicitudResolucionAsistida; turno: string | false | undefined }[] = [];
  for (const r of pj.rasgos) {
    const cfg = r.resolucionAsistida;
    const turno = identificarTurnoRasgo(r, pj, estado);
    if (!cfg?.integrarEnDanoDeArma || (cfg.soloAtaqueBestia && !bestia) || !disponibleEnTurnoPropio(r, turno, pj)) continue;
    const opciones = cfg.opciones.flatMap((o) => {
      const solicitud = { idRasgo: r.id, idOpcion: o.id, confirmado: true, incluirDados: true, propio: false };
      const extra = prepararDanoIntegrado(pj, solicitud, ataque.tipoDano, ataque.caracteristicaUsada);
      return extra ? [{ id: o.id, texto: `${r.nombre} · ${o.etiqueta}`, detalle: extra.formula, solicitud }] : [];
    });
    if (!opciones.length) continue;

    const prefDano = r.respuestaPredefinida?.danoIntegrado;
    if (prefDano?.modo === "omitir") continue;
    if (prefDano?.modo === "automatico") {
      const auto = opciones.find((o) => o.id === prefDano.idOpcion) ?? (opciones.length === 1 ? opciones[0] : undefined);
      if (auto) {
        elegidas.push({ solicitud: auto.solicitud, turno });
        continue;
      }
    }

    const eleccion = await elegirOpcionLanzamiento(pj.id, {
      nombre: r.nombre,
      etiqueta: "Daño adicional al impactar",
      descripcion: "Confirma el impacto y elige si quieres añadir este daño.",
      opciones: [{ id: "normal", texto: "Omitir este daño adicional" }, ...opciones],
      recordar: {
        permitido: (id) => id === "normal" || opciones.some((o) => o.id === id),
        alRecordar: (id) => guardarRespuestaPredefinida(pj.id, r.id, "danoIntegrado", id === "normal" ? "omitir" : `auto:${id}`)
      }
    });
    if (eleccion === undefined) return false;
    const opcion = opciones.find((o) => o.id === eleccion);
    if (opcion) elegidas.push({ solicitud: opcion.solicitud, turno });
  }

  const vigente = usarAlmacenDM.getState();
  const actual = vigente.personajes.find((p) => p.id === pj.id);
  if (!actual) return false;

  const extras: DanoIntegrado[] = [];
  for (const { solicitud, turno } of elegidas) {
    const r = actual.rasgos.find((x) => x.id === solicitud.idRasgo);
    const extra = r && prepararDanoIntegrado(actual, solicitud, ataque.tipoDano, ataque.caracteristicaUsada);
    if (!r || !extra || turno !== identificarTurnoRasgo(r, actual, vigente) || !disponibleEnTurnoPropio(r, turno, actual)) return false;
    extras.push(extra);
  }

  const efectosEtiqueta = await consultarEfectosEtiquetaEnDano(actual, ataque);
  if (efectosEtiqueta === undefined) return false;

  if (!await emitir(extras, tipoElegido, efectosEtiqueta)) return false;
  for (const { solicitud, turno } of elegidas) {
    vigente.operarRecursoRasgoPersonaje(pj.id, {
      tipo: "confirmarDanoIntegrado",
      solicitud,
      turnoPrevio: turno || undefined,
      tipoDanoArma: ataque.tipoDano,
      caracteristicaAtaque: ataque.caracteristicaUsada
    });
  }
  return true;
}
