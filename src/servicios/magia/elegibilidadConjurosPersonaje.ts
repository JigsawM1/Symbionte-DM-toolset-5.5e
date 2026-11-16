import type { HechizoBase, PersonajeJugador, TipoLanzador } from "@/tipos";
import { TODAS_SUBCLASES_DND55 } from "@/constantes/clasesDND55";
import { coincideHechizoId } from "@/servicios/comparadorHechizos";
import { conjuroEnAmpliacion } from "../rasgos/ampliacionesListaConjuros";
import { obtenerNivelMaximoConjuroPorTipoClase } from "../clases/nivelConjuros";
import {
  ESTRATEGIAS_TIPO_LANZADOR,
  acotarNivelClase,
  detectarTipoLanzador,
  normalizarTextoMagia
} from "./catalogoProgresionMagica";
import { obtenerNivelesArcanoMisticoDisponibles } from "./magiaPactoBrujo";
import type {
  PerfilClaseBaseNormalizado,
  PerfilClaseLanzadoraNormalizado,
  PerfilLanzadorPersonaje
} from "./tiposMagia";

export { obtenerNivelMaximoConjuroPorTipoClase };

const SUBCLASES_CON_LISTA_MAGICA = TODAS_SUBCLASES_DND55
  .filter((s) => Boolean(s.configuracionMagica?.listaConjuros))
  .map((s) => ({
    nombreNorm: normalizarTextoMagia(s.nombre),
    idNorm: normalizarTextoMagia(s.id),
    listaConjuros: s.configuracionMagica!.listaConjuros!.toLowerCase().trim()
  }));

function resolverListaMagicaPorSubclase(subclaseNombre: string, conjunto: Set<string>): void {
  const subNorm = normalizarTextoMagia(subclaseNombre);
  if (!subNorm) return;

  const subDef = SUBCLASES_CON_LISTA_MAGICA.find(
    (s) => s.nombreNorm === subNorm || s.idNorm === subNorm || s.nombreNorm.includes(subNorm) || subNorm.includes(s.nombreNorm)
  );

  if (subDef) {
    conjunto.add(subDef.listaConjuros);
  }
}

/**
 * Obtiene todas las clases cuyas listas de conjuros están disponibles para el personaje.
 */
export function obtenerClasesListaMagicaPersonaje(
  personaje: PersonajeJugador | null | undefined
): string[] {
  if (!personaje) return [];
  const clasesSet = new Set<string>();

  if (personaje.clase) {
    clasesSet.add(personaje.clase.toLowerCase().trim());
  }

  if (Array.isArray(personaje.clases)) {
    for (const c of personaje.clases) {
      const nom = c.nombre || (c as { clase?: string }).clase;
      if (nom) clasesSet.add(nom.toLowerCase().trim());
      if (c.subclase) resolverListaMagicaPorSubclase(c.subclase, clasesSet);
    }
  }

  if (personaje.subclase) {
    resolverListaMagicaPorSubclase(personaje.subclase, clasesSet);
  }

  if (Array.isArray(personaje.clasesLanzadoras)) {
    for (const cl of personaje.clasesLanzadoras) {
      if (cl.clase) clasesSet.add(cl.clase.toLowerCase().trim());
      if (cl.listaConjuros) clasesSet.add(cl.listaConjuros.toLowerCase().trim());
      const info = detectarTipoLanzador(cl.clase, personaje.subclase);
      if (info?.listaConjuros) clasesSet.add(info.listaConjuros.toLowerCase().trim());
    }
  }

  return Array.from(clasesSet);
}

/**
 * Obtiene el conjunto de niveles de conjuro lanzables para una clase según su estrategia y nivel.
 */
export function obtenerNivelesLanzablesPorClase(
  tipo: TipoLanzador,
  nivelClase: number,
  opciones?: { tieneTrucos?: boolean }
): Set<number> {
  const niveles = new Set<number>();
  const niv = acotarNivelClase(nivelClase);
  const estrategia = ESTRATEGIAS_TIPO_LANZADOR[tipo];

  if (estrategia?.otorgaTrucosPorDefecto(niv) || opciones?.tieneTrucos) {
    niveles.add(0);
  }

  const maxNv = estrategia ? estrategia.obtenerNivelMaximoConjuro(niv) : 0;
  for (let i = 1; i <= maxNv; i++) {
    niveles.add(i);
  }

  if (tipo === "pacto") {
    for (const nivelArcano of obtenerNivelesArcanoMisticoDisponibles(niv)) {
      niveles.add(nivelArcano);
    }
  }

  return niveles;
}

/**
 * Obtiene el conjunto de todos los niveles de conjuro (0 a 9) disponibles para el personaje.
 */
export function obtenerNivelesConjuroDisponiblesPersonaje(
  personaje: PersonajeJugador | null | undefined
): Set<number> {
  const niveles = new Set<number>();
  if (!personaje) return niveles;

  const tieneTrucos = (personaje.trucosConocidosIds?.length ?? 0) > 0;
  if (tieneTrucos) niveles.add(0);

  if (Array.isArray(personaje.clasesLanzadoras) && personaje.clasesLanzadoras.length > 0) {
    for (const cl of personaje.clasesLanzadoras) {
      obtenerNivelesLanzablesPorClase(cl.tipoLanzador, cl.nivel, { tieneTrucos })
        .forEach((n) => niveles.add(n));
    }
  } else if (personaje.clase) {
    const info = detectarTipoLanzador(personaje.clase, personaje.subclase);
    if (info) {
      obtenerNivelesLanzablesPorClase(info.tipo, personaje.nivel || 1, { tieneTrucos })
        .forEach((n) => niveles.add(n));
    }
  }

  if (personaje.espaciosConjuroMaximos) {
    for (const [lvlStr, cant] of Object.entries(personaje.espaciosConjuroMaximos)) {
      if (typeof cant === "number" && cant > 0) niveles.add(Number(lvlStr));
    }
  }

  if (personaje.puntosConjuroMaximos > 0 && (personaje.nivelConjuroMaximo || 0) > 0) {
    for (let lvl = 1; lvl <= (personaje.nivelConjuroMaximo || 0); lvl++) niveles.add(lvl);
  }

  if ((personaje.espaciosPactoMaximos || 0) > 0 && (personaje.nivelEspacioPacto || 0) > 0) {
    for (let lvl = 1; lvl <= (personaje.nivelEspacioPacto || 0); lvl++) niveles.add(lvl);
  }

  for (const item of personaje.arcanoMisticoIds || []) {
    const lvl = Number(item.split(":")[0]);
    if (!isNaN(lvl) && lvl >= 6) niveles.add(lvl);
  }

  return niveles;
}

/**
 * Precomputa el perfil de lanzador para evaluar el catálogo completo sin recalcular en cada conjuro.
 */
export function construirPerfilLanzadorPersonaje(
  personaje: PersonajeJugador
): PerfilLanzadorPersonaje {
  const esLanzador =
    personaje.esLanzador ||
    (Array.isArray(personaje.clasesLanzadoras) && personaje.clasesLanzadoras.length > 0) ||
    Boolean(detectarTipoLanzador(personaje.clase || "", personaje.subclase));

  const trucosConocidos = personaje.trucosConocidosIds || [];
  const nivelesGenerales = obtenerNivelesConjuroDisponiblesPersonaje(personaje);
  const tieneTrucos = trucosConocidos.length > 0;
  const clasesPersonajeNorm = obtenerClasesListaMagicaPersonaje(personaje).map(normalizarTextoMagia);

  const clasesLanzadoras: PerfilClaseLanzadoraNormalizado[] = (personaje.clasesLanzadoras || []).map((cl) => ({
    nombreNorm: normalizarTextoMagia(cl.clase),
    listaNorm: cl.listaConjuros ? normalizarTextoMagia(cl.listaConjuros) : "",
    niveles: obtenerNivelesLanzablesPorClase(cl.tipoLanzador, cl.nivel, { tieneTrucos })
  }));

  const clasesBase: PerfilClaseBaseNormalizado[] = [];
  if (Array.isArray(personaje.clases)) {
    for (const cItem of personaje.clases) {
      const info = detectarTipoLanzador(cItem.nombre, cItem.subclase);
      clasesBase.push({
        nombreNorm: normalizarTextoMagia(cItem.nombre || (cItem as { clase?: string }).clase || ""),
        subNorm: cItem.subclase ? normalizarTextoMagia(cItem.subclase) : "",
        listaSubNorm: info?.listaConjuros ? normalizarTextoMagia(info.listaConjuros) : "",
        niveles: info
          ? obtenerNivelesLanzablesPorClase(info.tipo, cItem.nivel || 1, { tieneTrucos })
          : new Set<number>()
      });
    }
  }

  const esMonoClase = !personaje.clases || personaje.clases.length <= 1;

  let clasePrincipal: PerfilClaseLanzadoraNormalizado | undefined;
  const infoPrinc = detectarTipoLanzador(personaje.clase || "", personaje.subclase);
  if (infoPrinc && esMonoClase) {
    clasePrincipal = {
      nombreNorm: normalizarTextoMagia(personaje.clase || ""),
      listaNorm: infoPrinc.listaConjuros ? normalizarTextoMagia(infoPrinc.listaConjuros) : "",
      niveles: obtenerNivelesLanzablesPorClase(infoPrinc.tipo, personaje.nivel || 1, { tieneTrucos })
    };
  }

  return {
    esLanzador,
    trucosConocidos,
    nivelesGenerales,
    clasesPersonajeNorm,
    clasesLanzadoras,
    clasesBase,
    clasePrincipal,
    overrideEspacios: personaje.overrideEspaciosConjuro,
    espaciosMaximos: personaje.espaciosConjuroMaximos,
    esMonoClase
  };
}

function coincideTextoParcial(a: string, b: string): boolean {
  return Boolean(a && b) && (a.includes(b) || b.includes(a));
}

function clasePermiteNivelHechizo(perfil: PerfilLanzadorPersonaje, chNorm: string, nivelHechizo: number): boolean {
  const clLanz = perfil.clasesLanzadoras.find(
    (cl) => coincideTextoParcial(cl.nombreNorm, chNorm) || coincideTextoParcial(cl.listaNorm, chNorm)
  );
  if (clLanz?.niveles.has(nivelHechizo)) return true;

  const clBase = perfil.clasesBase.find(
    (cb) =>
      coincideTextoParcial(cb.nombreNorm, chNorm) ||
      coincideTextoParcial(cb.listaSubNorm, chNorm) ||
      coincideTextoParcial(cb.subNorm, chNorm)
  );
  if (clBase?.niveles.has(nivelHechizo)) return true;

  const cp = perfil.clasePrincipal;
  return Boolean(
    cp &&
      (coincideTextoParcial(cp.nombreNorm, chNorm) || coincideTextoParcial(cp.listaNorm, chNorm)) &&
      cp.niveles.has(nivelHechizo)
  );
}

/**
 * Evalúa si un conjuro está disponible para ser lanzado o aprendido por el personaje.
 */
export function puedePersonajeLanzarHechizo(
  personaje: PersonajeJugador | null | undefined,
  hechizo: HechizoBase,
  perfilPrecalculado?: PerfilLanzadorPersonaje
): boolean {
  if (!personaje) return true;
  if (conjuroEnAmpliacion(personaje, hechizo)) return true;

  const perfil = perfilPrecalculado ?? construirPerfilLanzadorPersonaje(personaje);
  if (!perfil.esLanzador) {
    return hechizo.nivel === 0 && perfil.trucosConocidos.some((id) => coincideHechizoId(id, hechizo.id));
  }
  if (perfil.clasesPersonajeNorm.length === 0) return false;

  const clasesHechizo = hechizo.clases || [];
  if (clasesHechizo.length === 0) return perfil.nivelesGenerales.has(hechizo.nivel);

  let huboCoincidenciaClase = false;
  for (const ch of clasesHechizo) {
    const chNorm = normalizarTextoMagia(ch);
    if (!perfil.clasesPersonajeNorm.some((cp) => coincideTextoParcial(chNorm, cp))) continue;
    huboCoincidenciaClase = true;
    if (clasePermiteNivelHechizo(perfil, chNorm, hechizo.nivel)) return true;
  }
  if (!huboCoincidenciaClase) return false;

  const claveNivel = String(hechizo.nivel);
  if ((perfil.overrideEspacios?.[claveNivel] ?? 0) > 0) return true;
  if (perfil.esMonoClase && (perfil.espaciosMaximos?.[claveNivel] ?? 0) > 0) return true;

  return (
    (personaje.puntosConjuroMaximos || 0) > 0 &&
    hechizo.nivel >= 1 &&
    hechizo.nivel <= (personaje.nivelConjuroMaximo || 0)
  );
}
