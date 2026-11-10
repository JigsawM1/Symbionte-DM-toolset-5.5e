import type {
  PersonajeJugador,
  MonstruoBase,
  HechizoBase,
  RasgoPersonaje,
  VelocidadEstructurada,
  SentidosEstructurados
} from "@/tipos";
import { MONSTRUOS_INICIALES } from "@/utiles/datosIniciales";
import { obtenerClasePorNombre, obtenerNivelEfectivoParaRasgo } from "./clases/catalogoClases";
import { coincideIdRasgo } from "@/constantes/identificadoresDND";
import { coincideHechizoId } from "./comparadorHechizos";
import { obtenerConcesionRasgo } from "./rasgos/concesionesRasgos";
import { normalizar } from "./rasgos/utilidadesRasgos";

interface VelocidadBestiaObjeto extends Partial<VelocidadEstructurada> {
  volando?: number;
  trepar?: number;
}

/**
 * Convierte un string de desafío (VD) como "0", "1/8", "1/4", "1/2", "1", "2" a número decimal.
 */
export function convertirVDANumero(vd: string | undefined): number {
  if (!vd) return 0;
  const limpio = vd.trim();
  if (limpio === "1/8") return 0.125;
  if (limpio === "1/4") return 0.25;
  if (limpio === "1/2") return 0.5;
  const num = parseFloat(limpio);
  return isNaN(num) ? 0 : num;
}

/**
 * Determina si una bestia tiene velocidad volando.
 */
export function bestiaTieneVuelo(bestia: MonstruoBase): boolean {
  if (typeof bestia.velocidad === "string") {
    const s = bestia.velocidad.toLowerCase();
    return s.includes("vuelo") || s.includes("volar") || s.includes("fly");
  }
  if (bestia.velocidad && typeof bestia.velocidad === "object") {
    const v = bestia.velocidad as VelocidadBestiaObjeto;
    return (v.volar ?? v.volando ?? 0) > 0;
  }
  return false;
}

/**
 * Parsea y extrae velocidades estructuradas de cualquier bloque de estadísticas de bestia.
 */
export function extraerVelocidadesBestia(bestia: MonstruoBase): {
  caminar: number;
  nadar?: number;
  volar?: number;
  escalar?: number;
  excavar?: number;
  planea: boolean;
} {
  let caminar = 30;
  let nadar: number | undefined;
  let volar: number | undefined;
  let escalar: number | undefined;
  let excavar: number | undefined;
  let planea = false;

  if (typeof bestia.velocidad === "string") {
    const s = bestia.velocidad.toLowerCase();
    const caminarMatch = s.match(/^(\d+)\s*(?:pies|ft)?/i);
    if (caminarMatch) caminar = parseInt(caminarMatch[1], 10) || 30;

    const nadarMatch = s.match(/nadar\s*(\d+)/i);
    if (nadarMatch) nadar = parseInt(nadarMatch[1], 10);

    const volarMatch = s.match(/volar\s*(\d+)/i);
    if (volarMatch) volar = parseInt(volarMatch[1], 10);

    const escalarMatch = s.match(/(?:escalar|trepar)\s*(\d+)/i);
    if (escalarMatch) escalar = parseInt(escalarMatch[1], 10);

    const excavarMatch = s.match(/excavar\s*(\d+)/i);
    if (excavarMatch) excavar = parseInt(excavarMatch[1], 10);
  } else if (bestia.velocidad && typeof bestia.velocidad === "object") {
    const v = bestia.velocidad as VelocidadBestiaObjeto;
    caminar = v.caminar ?? 30;
    nadar = v.nadar;
    volar = v.volar ?? v.volando;
    escalar = v.escalar ?? v.trepar;
    excavar = v.excavar;
    planea = Boolean(v.planea);
  }

  return { caminar, nadar, volar, escalar, excavar, planea };
}

/**
 * Extrae los sentidos clave de una bestia (visión en la oscuridad, ciega y percepción pasiva).
 */
export function extraerSentidosBestia(bestia: MonstruoBase): {
  visionOscuridad?: number;
  visionCiega?: number;
  percepcionPasiva?: number;
} {
  let visionOscuridad: number | undefined;
  let visionCiega: number | undefined;
  let percepcionPasiva: number | undefined;

  if (bestia.sentidos && typeof bestia.sentidos === "object") {
    const s = bestia.sentidos as Partial<SentidosEstructurados>;
    visionOscuridad = s.visionOscuridad;
    visionCiega = s.visionCiega;
    percepcionPasiva = s.percepcionPasiva;
  } else if (typeof bestia.sentidos === "string") {
    const sentidosStr = bestia.sentidos.toLowerCase();
    const matchVO = sentidosStr.match(/visi[oó]n en la oscuridad\s*(\d+)/i);
    if (matchVO) visionOscuridad = parseInt(matchVO[1], 10);

    const matchVC = sentidosStr.match(/visi[oó]n ciega\s*(\d+)/i);
    if (matchVC) visionCiega = parseInt(matchVC[1], 10);

    const matchPP = sentidosStr.match(/percepci[oó]n pasiva\s*(\d+)/i);
    if (matchPP) percepcionPasiva = parseInt(matchPP[1], 10);
  }

  return { visionOscuridad, visionCiega, percepcionPasiva };
}

export interface ReglasFormaSalvajeNivel {
  maxFormasConocidas: number;
  vdMaximo: number;
  vdMaximoTexto: string;
  puedeVolar: boolean;
}

/**
 * Obtiene el nivel efectivo de Druida de un personaje (soporta multiclase).
 */
export function obtenerNivelDruida(pj: PersonajeJugador): number {
  const rasgo = obtenerRasgoFormaBestia(pj);
  if (rasgo?.formasBestia) return obtenerNivelEfectivoParaRasgo(pj, rasgo);
  if (Array.isArray(pj.clases) && pj.clases.length > 0) {
    const claseDruida = pj.clases.find(
      (c) => c.nombre.toLowerCase().trim() === "druida"
    );
    if (claseDruida) return Math.max(1, claseDruida.nivel || 1);
  }
  return Math.max(1, pj.nivel || 1);
}

export function obtenerRasgoFormaBestia(pj: PersonajeJugador): RasgoPersonaje | undefined {
  return pj.rasgos?.find(r => r.formasBestia) ?? pj.rasgos?.find(r => coincideIdRasgo(r, "forma_salvaje"));
}

/**
 * Calcula los límites de Forma salvaje de acuerdo a las reglas de D&D 5.5e (PHB 2024).
 * En PHB 2024:
 * - Nivel 2: 4 formas conocidas, VD máx 1/4, No vuela
 * - Nivel 4: 6 formas conocidas, VD máx 1/2, No vuela
 * - Nivel 8+: 8 formas conocidas, VD máx 1 (o nivel/3 para Círculo de la Luna), Sí vuela
 */
export function calcularReglasFormaSalvaje(
  nivelDruida: number,
  ajustes: RasgoPersonaje["ajustesFormaBestia"] = undefined,
  formas?: RasgoPersonaje["formasBestia"]
): ReglasFormaSalvajeNivel {
  const progresion = formas?.progresion ?? obtenerClasePorNombre("Druida")?.rasgos.find(r => r.formasBestia)?.formasBestia?.progresion;
  const fila = progresion?.reduce<NonNullable<typeof progresion>[number] | undefined>((actual, forma) =>
    forma.nivelMinimo <= nivelDruida && (!actual || actual.nivelMinimo < forma.nivelMinimo) ? forma : actual, undefined);
  const vdMaximo = Math.max(fila?.vdMaximo ?? 0, ajustes ? Math.floor(nivelDruida / ajustes.divisorNivelVD) : 0);
  return {
    maxFormasConocidas: fila?.conocidas ?? 0,
    vdMaximo,
    vdMaximoTexto: vdMaximo === 0.25 ? "1/4" : vdMaximo === 0.5 ? "1/2" : String(vdMaximo),
    puedeVolar: fila?.vuelo ?? false
  };
}

/**
 * Evalúa si una criatura es elegible para la reserva de formas conocidas de un druida.
 */
export function esBestiaValidaParaDruida(
  bestia: MonstruoBase,
  nivelDruida: number,
  ajustes: RasgoPersonaje["ajustesFormaBestia"] = undefined,
  formas?: RasgoPersonaje["formasBestia"]
): boolean {
  const tipo = (bestia.tipo || "").toLowerCase();
  if (tipo.trim() !== "bestia" && tipo.trim() !== "beast") return false;

  const reglas = calcularReglasFormaSalvaje(nivelDruida, ajustes, formas);
  if (reglas.maxFormasConocidas === 0 || !/^\d+(?:\/\d+|\.\d+)?$/.test(bestia.desafio?.trim() ?? "")) return false;
  const vdNum = convertirVDANumero(bestia.desafio);

  if (vdNum > reglas.vdMaximo) return false;
  if (!reglas.puedeVolar && bestiaTieneVuelo(bestia)) return false;

  return true;
}

/**
 * Obtiene todas las bestias del compendio oficial y homebrew que el druida puede aprender.
 */
export function obtenerBestiasElegiblesCompendio(
  nivelDruida: number,
  ajustes: RasgoPersonaje["ajustesFormaBestia"] = undefined,
  catalogoHomebrew: MonstruoBase[] = [],
  formas?: RasgoPersonaje["formasBestia"]
): MonstruoBase[] {
  const todas = [...MONSTRUOS_INICIALES, ...catalogoHomebrew];
  const mapa = new Map<string, MonstruoBase>();

  for (const criatura of todas) {
    if (esBestiaValidaParaDruida(criatura, nivelDruida, ajustes, formas)) {
      if (!mapa.has(criatura.id)) {
        mapa.set(criatura.id, criatura);
      }
    }
  }

  return Array.from(mapa.values()).sort((a, b) => {
    const vdA = convertirVDANumero(a.desafio);
    const vdB = convertirVDANumero(b.desafio);
    if (vdA !== vdB) return vdA - vdB;
    return a.nombre.localeCompare(b.nombre);
  });
}

/**
 * Calcula los PG temporales otorgados al adoptar Forma salvaje (D&D 5.5e):
 * - Druida estándar: nivel de druida
 * - Círculo de la Luna: 3 * nivel de druida
 */
export function calcularHpTemporalFormaSalvaje(
  nivelDruida: number,
  ajustes?: RasgoPersonaje["ajustesFormaBestia"]
): number {
  return nivelDruida * (ajustes?.multiplicadorPgTemporales ?? 1);
}

/**
 * Recupera el objeto de la bestia actualmente activa del personaje, si la hay y la forma sigue vigente.
 * Según D&D 2024:
 * "You stay in that form for a number of hours equal to half your Druid level or until you use Wild Shape again,
 * have the Incapacitated condition, or die."
 */
export function obtenerBestiaFormaActiva(
  pj: PersonajeJugador,
  catalogoHomebrew: MonstruoBase[] = []
): MonstruoBase | null {
  const idActiva = pj.formaSalvaje?.formaActivaId;
  if (!idActiva || pj.salvacionesMuerte?.fallos >= 3) return null;

  // Condiciones que finalizan de inmediato la Forma salvaje según PHB 2024
  const conds = (pj.condicionesActivas || []).map((c) => c.toLowerCase().trim());
  if (
    conds.includes("incapacitado") ||
    conds.includes("incapacitated") ||
    conds.includes("inconsciente") ||
    conds.includes("unconscious") ||
    conds.includes("muerto") ||
    conds.includes("dead")
  ) {
    return null;
  }

  // Si la condición "Forma salvaje" fue retirada explícitamente y el rasgo está inactivo
  const rasgoForma = obtenerRasgoFormaBestia(pj);
  const tieneCondicion = conds.some((c) => c.includes("forma salvaje") || c.includes("wild shape"));
  if (!tieneCondicion && rasgoForma && !rasgoForma.activo) {
    return null;
  }

  const bestia = catalogoHomebrew.find(m => m.id === idActiva) ?? MONSTRUOS_INICIALES.find(m => m.id === idActiva);
  if (rasgoForma?.formasBestia && (!rasgoForma.activo || !bestia || !esBestiaValidaParaDruida(
    bestia, obtenerNivelDruida(pj), rasgoForma.ajustesFormaBestia, rasgoForma.formasBestia))) return null;
  return bestia ?? null;
}

export function terminarFormaBestia(pj: PersonajeJugador): PersonajeJugador {
  const rasgo = obtenerRasgoFormaBestia(pj);
  return {
    ...pj,
    formaSalvaje: { formasConocidasIds: pj.formaSalvaje.formasConocidasIds,
      sustitucionDisponible: pj.formaSalvaje.sustitucionDisponible, formaActivaId: null, hpTemporalAlTransformar: 0 },
    rasgos: pj.rasgos.map(r => r === rasgo ? { ...r, activo: false } : r),
    condicionesActivas: pj.condicionesActivas.filter(c => normalizarTexto(c) !== normalizarTexto(rasgo?.condicionAlActivar ?? "Forma salvaje")),
    efectosActivos: pj.efectosActivos.filter(e => !rasgo || e.idRasgoOrigen !== rasgo.id)
  };
}

export function transcurrirDescansoFormaBestia(pj: PersonajeJugador, largo: boolean): PersonajeJugador {
  const forma = pj.formaSalvaje;
  if (!forma || !obtenerRasgoFormaBestia(pj)?.formasBestia) return pj;
  const minutos = largo ? 480 : 60;
  const minutosRestantes = forma.minutosRestantes === undefined ? undefined : Math.max(0, forma.minutosRestantes - minutos);
  const expiraRonda = forma.expiraRonda === undefined ? undefined : Math.max(1, forma.expiraRonda - minutos * 10);
  const actualizado = { ...pj, formaSalvaje: { ...forma, minutosRestantes, expiraRonda,
    sustitucionDisponible: largo || forma.sustitucionDisponible } };
  return forma.formaActivaId && minutosRestantes === 0 ? terminarFormaBestia(actualizado) : actualizado;
}

export function inventarioEnFormaBestia(pj: PersonajeJugador): PersonajeJugador["inventario"] {
  const ids = pj.formaSalvaje?.equipoConservadoIds;
  const inventario = pj.inventario ?? [];
  return ids && obtenerBestiaFormaActiva(pj) ? inventario.filter(o => ids.includes(o.idInstancia)) : inventario;
}

export function evaluarConjuroEnFormaBestia(pj: PersonajeJugador, hechizo?: HechizoBase, clase?: string): "permitido" | "bloqueado" | "confirmar" {
  if (!obtenerBestiaFormaActiva(pj)) return "permitido";
  const permiso = pj.rasgos.some(r => r.permiteConjurosEnBestia && r.activo !== false
    && obtenerNivelEfectivoParaRasgo(pj, r) >= (r.nivelRequerido ?? 1));
  const permiteConcesion = pj.rasgos.some(r => r.lanzarConcesionEnBestia
    && (!clase || normalizar(clase) === normalizar(r.claseConjurosOtorgados))
    && obtenerConcesionRasgo(pj, r, hechizo?.nivel === 0 ? "trucos" : "conjuros")
      .some(id => !hechizo || coincideHechizoId(id, hechizo.id)));
  if (permiteConcesion) return "permitido";
  if (!permiso) return "bloqueado";
  if (!hechizo?.componentesSeleccionados.material) return "permitido";
  if (hechizo.materialCostosoOConsumido === true) return "bloqueado";
  return hechizo.materialCostosoOConsumido === false ? "permitido" : "confirmar";
}


/**
 * Normaliza una cadena eliminando acentos, mayúsculas y espacios sobrantes.
 */
function normalizarTexto(s?: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Determina si un rasgo pertenece a la clase o subclase de Druida.
 */
export function esRasgoDeDruida(rasgo: RasgoPersonaje): boolean {
  const f = normalizarTexto(rasgo.fuente);
  const id = normalizarTexto(rasgo.id);
  const nom = normalizarTexto(rasgo.nombre);
  const sub = normalizarTexto(rasgo.subclase);

  if (f.includes("druida") || f.includes("circulo")) return true;
  if (id.includes("druida") || id.includes("forma_salvaje")) return true;
  if (sub.includes("luna") || sub.includes("tierra") || sub.includes("estrellas") || sub.includes("esporas") || sub.includes("mar")) return true;
  if (nom.includes("forma salvaje") || nom.includes("druidico") || nom.includes("druida") || nom.includes("luna")) return true;

  // Si origen es clase o subclase y no pertenece a otra clase identificable
  if (rasgo.origen === "clase" || rasgo.origen === "subclase") {
    const otrasClases = [
      "barbaro",
      "bardo",
      "clerigo",
      "guerrero",
      "monje",
      "paladin",
      "explorador",
      "picaro",
      "hechicero",
      "brujo",
      "mago"
    ];
    const esDeOtra = otrasClases.some((c) => f.includes(c) || id.includes(`_${c}_`));
    if (!esDeOtra) return true;
  }

  return false;
}

/**
 * Convierte los rasgos y acciones especiales de una bestia en objetos RasgoPersonaje listos para la hoja.
 */
export function extraerRasgosBestia(bestia: MonstruoBase): RasgoPersonaje[] {
  if (!bestia) return [];
  const rasgosExtraidos: RasgoPersonaje[] = [];

  const agregarRasgos = (
    entradas: MonstruoBase["rasgos"],
    prefijo: string,
    tipoAccion: RasgoPersonaje["tipoAccion"],
    etiqueta: string
  ): void => {
    if (!Array.isArray(entradas)) return;
    entradas.forEach((entrada, idx) => {
      const limpio = normalizarTexto(entrada.nombre).replace(/\s+/g, "_");
      rasgosExtraidos.push({
        id: `${prefijo}_bestia_${bestia.id}_${idx}_${limpio}`,
        nombre: entrada.nombre,
        descripcion: entrada.descripcion || "",
        origen: "personalizado",
        fuente: `Forma salvaje: ${bestia.nombre}`,
        tipoAccion,
        personalizado: false,
        activo: true,
        tieneUsosLimitados: false,
        recuperacion: "ninguno",
        notas: `${etiqueta} de ${bestia.nombre}.`
      });
    });
  };

  agregarRasgos(bestia.rasgos, "rasgo", "pasivo", "Rasgo");
  agregarRasgos(bestia.accionesAdicionales, "acc_adic", "accion_adicional", "Acción adicional");
  agregarRasgos(bestia.reacciones, "reac", "reaccion", "Reacción");

  return rasgosExtraidos;
}

/**
 * Filtra los rasgos del personaje para Forma salvaje según la regla estricta:
 * Solo rasgos de la bestia en la que se transforma + rasgos de Druida (clase y subclase).
 */
export function filtrarRasgosFormaSalvaje(
  rasgosPersonaje: RasgoPersonaje[],
  bestia: MonstruoBase
): RasgoPersonaje[] {
  const rasgosBestia = extraerRasgosBestia(bestia);
  const canonicos = rasgosPersonaje.some(r => r.formasBestia);
  return [...rasgosBestia, ...rasgosPersonaje.filter(r => canonicos
    ? r.origen === "clase" || r.origen === "subclase" || r.origen === "dote" : esRasgoDeDruida(r))];
}
