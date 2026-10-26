import {
  type PersonajeJugador,
  type Caracteristica,
  type HechizoBase
} from "@/tipos";
import { coincideHechizoId } from "@/servicios/comparadorHechizos";
import {
  normalizar,
  esRasgoHabilitadoPorOpcion,
  estaRevelacionCelestialActiva,
  obtenerBonoCompetenciaPersonaje,
  obtenerNivelClasePersonaje,
  } from "./utilidadesRasgos";
import {
  evaluarEfectosRasgosActivos,
  resolverFormulaDinamica,
  evaluarExpresionNumericaSegura
} from "./evaluadorExpresionesRasgos";
import { resolverClaseLanzamiento } from "./modificadoresConjuroRasgos";
import { obtenerDadoInspiracionBardica } from "./evaluadorSalvacionesRasgos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";

/**
 * Contexto de un ataque físico o mágico para evaluar si aplican efectos de rasgos.
 */
export interface ContextoAtaquePersonaje {
  tipo: "arma" | "desarmado" | "improvisada" | "conjuro";
  caracteristica: Caracteristica;
  esCuerpoACuerpo: boolean;
  esDistancia: boolean;
  propiedades?: string[];
  esPesada?: boolean;
  aDosManos?: boolean;
}

/**
 * Comprueba si un efecto mecánico de daño aplica al contexto del ataque actual.
 */
export function aplicaEfectoAAtaque(
  aplicaA: string | undefined,
  objetivo: string,
  contexto: ContextoAtaquePersonaje
): boolean {
  const criterio = normalizar(aplicaA || objetivo || "");
  if (criterio === "arma_o_desarmado_fuerza") return contexto.caracteristica === "fuerza" && ["arma", "improvisada", "desarmado"].includes(contexto.tipo);
  if (criterio === "arma_o_desarmado") return contexto.tipo === "arma" || contexto.tipo === "improvisada" || contexto.tipo === "desarmado";

  if (criterio === "arma") return contexto.tipo === "arma" || contexto.tipo === "improvisada";

  if (criterio === "todos_ataques" || criterio === "todos" || criterio === "ataque") {
    return true;
  }
  if (criterio === "arma_fuerza" || criterio === "ataque_fuerza") {
    return contexto.caracteristica === "fuerza";
  }
  if (criterio === "arma_cac" || criterio === "cuerpo_a_cuerpo") {
    return contexto.esCuerpoACuerpo;
  }
  if (criterio === "arma_sutil" || criterio === "sutil") {
    return Boolean(
      contexto.propiedades?.some((p) => {
        const norm = normalizar(p);
        return norm.includes("sutil") || norm.includes("finesse");
      })
    );
  }
  if (criterio === "arma_sutil_o_distancia" || criterio === "sutil_o_distancia") {
    const esSutil = Boolean(
      contexto.propiedades?.some((p) => {
        const norm = normalizar(p);
        return norm.includes("sutil") || norm.includes("finesse");
      })
    );
    return esSutil || contexto.esDistancia;
  }
  if (criterio === "arma_distancia" || criterio === "distancia" || criterio === "ataque_distancia") {
    return contexto.esDistancia;
  }
  if (criterio === "arma_arrojadiza" || criterio === "arrojadiza") {
    return Boolean(
      contexto.propiedades?.some((p) => {
        const norm = normalizar(p);
        return norm.includes("arrojadiz") || norm.includes("thrown");
      })
    );
  }
  if (criterio === "arma_duelo" || criterio === "duelo") {
    const esADosManos = Boolean(
      contexto.aDosManos ||
      contexto.propiedades?.some((p) => {
        const norm = normalizar(p);
        return norm.includes("a dos manos") || norm.includes("two-handed");
      })
    );
    return contexto.esCuerpoACuerpo && !esADosManos;
  }
  if (criterio === "arma_pesada" || criterio === "pesada") {
    return Boolean(
      contexto.esPesada ||
      contexto.propiedades?.some((p) => {
        const norm = normalizar(p);
        return norm.includes("pesada") || norm.includes("heavy");
      })
    );
  }
  if (
    criterio === "desarmado" ||
    criterio === "ataque_desarmado" ||
    criterio === "sin_armas" ||
    criterio === "sin_arma" ||
    criterio === "ataque_sin_armas" ||
    criterio === "unarmed"
  ) {
    return contexto.tipo === "desarmado";
  }

  // Por defecto, si el objetivo incluye "fuerza", requiere ataque de fuerza
  if (criterio.includes("fuerza")) {
    return contexto.caracteristica === "fuerza";
  }

  return true;
}

/**
 * Obtiene dados adicionales para sumar al daño principal del arma / ataque
 * procedentes de rasgos activos con efecto `dado_extra_dano`.
 */
export function obtenerDadosExtraAtaque(
  personaje: PersonajeJugador,
  contexto: ContextoAtaquePersonaje
): { dados: string; origen: string }[] {
  const efectos = evaluarEfectosRasgosActivos(personaje);
  const resultado: { dados: string; origen: string }[] = [];

  for (const ef of efectos) {
    if (ef.tipo === "dado_extra_dano") {
      if (aplicaEfectoAAtaque(ef.aplicaA, ef.objetivo, contexto)) {
        const formulaResuelta = resolverFormulaDinamica(ef.valor, personaje);
        if (formulaResuelta) {
          resultado.push({
            dados: formulaResuelta,
            origen: ef.descripcion || "Rasgo activo"
          });
        }
      }
    }
  }

  return resultado;
}

/**
 * Obtiene grupos de daño secundario independiente (que se suman con `/` en TaleSpire)
 * procedentes de rasgos activos con efecto `dano_secundario`.
 */
export function obtenerDanosSecundariosAtaque(
  personaje: PersonajeJugador,
  contexto: ContextoAtaquePersonaje
): { formula: string; tipoDano: string; origen: string }[] {
  const efectos = evaluarEfectosRasgosActivos(personaje);
  const resultado: { formula: string; tipoDano: string; origen: string }[] = [];

  for (const ef of efectos) {
    if (ef.tipo === "dano_secundario") {
      if (aplicaEfectoAAtaque(ef.aplicaA, ef.objetivo, contexto)) {
        const formulaResuelta = resolverFormulaDinamica(ef.valor, personaje);
        if (formulaResuelta) {
          const tipoDanoFinal = ef.tipoDano?.trim() || "Adicional";

          resultado.push({
            formula: formulaResuelta,
            tipoDano: tipoDanoFinal,
            origen: ef.descripcion || "Rasgo activo"
          });
        }
      }
    }
  }

  return resultado;
}

/**
 * Obtiene bonificadores numéricos extra al daño procedentes de rasgos activos
 * con efecto `bono_dano_ataque` o `bono_dano_fuerza` de forma 100% genérica.
 */
export function obtenerBonoDanoAtaqueExtra(
  personaje: PersonajeJugador,
  contexto: ContextoAtaquePersonaje
): number {
  let bonoTotal = 0;
  const efectos = evaluarEfectosRasgosActivos(personaje);
  let yaAplicoRevelacion = false;

  for (const ef of efectos) {
    if (ef.tipo === "bono_dano_ataque" || ef.tipo === "bono_dano_fuerza") {
      if (aplicaEfectoAAtaque(ef.aplicaA, ef.objetivo, contexto)) {
        const formulaResuelta = resolverFormulaDinamica(ef.valor, personaje);
        const valorNumerico = evaluarExpresionNumericaSegura(formulaResuelta);
        bonoTotal += valorNumerico;
        if (normalizar(ef.descripcion || "").includes("revelacion")) {
          yaAplicoRevelacion = true;
        }
      }
    }
  }

  if (!yaAplicoRevelacion && estaRevelacionCelestialActiva(personaje)) {
    bonoTotal += obtenerBonoCompetenciaPersonaje(personaje);
  }

  return bonoTotal;
}

/**
 * Obtiene bonificadores numéricos extra a las tiradas de ataque procedentes de rasgos activos
 * con efecto `bono_ataque` de forma 100% genérica (ej. Tiro con arco: +2 a distancia).
 */
export function obtenerBonoAtaqueExtra(
  personaje: PersonajeJugador,
  contexto: ContextoAtaquePersonaje
): number {
  let bonoTotal = 0;
  const efectos = evaluarEfectosRasgosActivos(personaje);

  for (const ef of efectos) {
    if (ef.tipo === "bono_ataque") {
      if (aplicaEfectoAAtaque(ef.aplicaA, ef.objetivo, contexto)) {
        const formulaResuelta = resolverFormulaDinamica(ef.valor, personaje);
        const valorNumerico = evaluarExpresionNumericaSegura(formulaResuelta);
        bonoTotal += valorNumerico;
      }
    }
  }

  return bonoTotal;
}

export interface ContextoDanoConjuro {
  esTruco?: boolean;
  nivelLanzamiento?: number;
  escuela?: string;
  tipoDano?: string;
  nombreConjuro?: string;
}

/**
 * Comprueba si un efecto mecánico de daño a conjuros aplica al contexto del conjuro actual.
 */
function aplicaEfectoAConjuro(
  aplicaA: string | undefined,
  objetivo: string,
  contexto?: ContextoDanoConjuro
): boolean {
  if (!contexto) return true;
  const criterio = normalizar(aplicaA || objetivo || "");
  if (!criterio || criterio === "todos_conjuros" || criterio === "todos" || criterio === "conjuros" || criterio === "general") {
    return true;
  }
  if (criterio === "trucos") {
    return Boolean(contexto.esTruco);
  }
  if (criterio === "espacios" || criterio === "ranuras") {
    return !contexto.esTruco;
  }
  if (contexto.tipoDano && normalizar(contexto.tipoDano) === criterio) {
    return true;
  }
  if (contexto.escuela && normalizar(contexto.escuela) === criterio) {
    return true;
  }
  return false;
}

/**
 * Obtiene bonificadores numéricos extra al daño de conjuros procedentes de rasgos activos
 * con efecto `bono_dano_conjuro` de forma 100% genérica.
 */
export function obtenerBonoDanoConjuroExtra(
  personaje: PersonajeJugador,
  contexto?: ContextoDanoConjuro
): number {
  let bonoTotal = 0;
  const efectos = evaluarEfectosRasgosActivos(personaje);
  let yaAplicoRevelacion = false;

  for (const ef of efectos) {
    if (ef.tipo === "bono_dano_conjuro") {
      const objNorm = normalizar(ef.objetivo || "");
      if (objNorm === "agregar_modificador_habilidad" || objNorm.includes("modificador_habilidad")) {
        continue;
      }

      if (aplicaEfectoAConjuro(ef.aplicaA, ef.objetivo, contexto)) {
        const formulaResuelta = resolverFormulaDinamica(ef.valor, personaje);
        const valorNumerico = evaluarExpresionNumericaSegura(formulaResuelta);
        bonoTotal += valorNumerico;
        if (normalizar(ef.descripcion || "").includes("revelacion")) {
          yaAplicoRevelacion = true;
        }
      }
    }
  }

  if (!yaAplicoRevelacion && estaRevelacionCelestialActiva(personaje)) {
    bonoTotal += obtenerBonoCompetenciaPersonaje(personaje);
  }

  return bonoTotal;
}

export interface InfoAtaqueDesarmadoEspecial {
  aplica: boolean;
  caracteristicaSugerida?: Caracteristica;
  dadoDanoBase?: string;
  nombreAtaque?: string;
  propiedades?: string[];
}

/**
 * Evalúa el peso relativo de dados de daño para ordenamiento.
 */
function obtenerPesoDadoDesarmado(valorDado: string, nivelBardo: number): number {
  const dado = (valorDado === "dado_inspiracion" || valorDado === "dado_padre")
    ? obtenerDadoInspiracionBardica(nivelBardo)
    : valorDado;
  const match = dado.match(/(\d*)d(\d+)/i);
  if (match) {
    const cant = parseInt(match[1] || "1", 10);
    const caras = parseInt(match[2], 10);
    return cant * caras;
  }
  const num = Number(dado);
  return isNaN(num) ? 0 : num;
}

/**
 * Evalúa si el personaje posee un rasgo activo que modifique el ataque sin armas
 * (ej. Daño bárdico del Colegio de la Danza, Matón de Taberna, o rasgos Homebrew de combate desarmado).
 * Aplica precedencia por peso de modificación para que ataques marciales superiores prevalezcan sobre 1d4.
 */
export function evaluarAtaqueDesarmadoEspecial(personaje: PersonajeJugador): InfoAtaqueDesarmadoEspecial {
  const efectos = evaluarEfectosRasgosActivos(personaje);
  const efectosDesarmadosValidos = efectos.filter((ef) => ef.tipo === "ataque_desarmado");

  if (efectosDesarmadosValidos.length === 0) {
    return { aplica: false };
  }

  const nivelBardo = obtenerNivelClasePersonaje(personaje, "bardo") || personaje.nivel || 1;

  // Ordenar por peso de modificación descendente para que ataques mayores (Daño Bárdico 1d6-1d12)
  // prevalezcan sobre opciones con menor peso de modificación (como Matón de Taberna 1d4)
  const efectosOrdenados = [...efectosDesarmadosValidos].sort((a, b) => {
    const pesoA = obtenerPesoDadoDesarmado(String(a.valor || "1d4"), nivelBardo);
    const pesoB = obtenerPesoDadoDesarmado(String(b.valor || "1d4"), nivelBardo);
    return pesoB - pesoA;
  });

  const ef = efectosOrdenados[0];
  let dadoDano = String(ef.valor || "1d4");
  if (dadoDano === "dado_inspiracion" || dadoDano === "dado_padre") {
    dadoDano = obtenerDadoInspiracionBardica(nivelBardo);
  }

  const nombreAtaque = ef.descripcion || "Ataque desarmado especial";
  const caracSugerida = (ef.objetivo && ["fuerza", "destreza", "constitucion", "inteligencia", "sabiduria", "carisma"].includes(normalizar(ef.objetivo)))
    ? normalizar(ef.objetivo) as Caracteristica
    : (dadoDano === "1d4" ? "fuerza" : "destreza");
  const propiedades = caracSugerida === "fuerza" ? [nombreAtaque] : [nombreAtaque, "Sutil"];

  return {
    aplica: true,
    caracteristicaSugerida: caracSugerida,
    dadoDanoBase: dadoDano,
    nombreAtaque,
    propiedades
  };
}

/**
 * Obtiene el conjunto de claves normalizadas de las maestrías de armas que el personaje
 * tiene actualmente aprendidas o seleccionadas en sus rasgos de maestría.
 */
export function obtenerMaestriasArmasAprendidas(personaje: PersonajeJugador): Set<string> {
  const maestrias = new Set<string>();
  if (!personaje || !Array.isArray(personaje.rasgos)) {
    return maestrias;
  }

  for (const rasgo of personaje.rasgos) {
    if (rasgo.activo === false || obtenerNivelEfectivoParaRasgo(personaje, rasgo) < (rasgo.nivelRequerido ?? 1)) continue;
    if (!Array.isArray(rasgo.selectores) || rasgo.selectores.length === 0) continue;

    const nombreRasgo = normalizar(rasgo.nombre);
    const esRasgoMaestria =
      nombreRasgo.includes("maestria con armas") ||
      nombreRasgo.includes("weapon mastery") ||
      rasgo.id.toLowerCase().includes("maestria");

    for (const sel of rasgo.selectores) {
      const idSel = normalizar(sel.id);
      const etiquetaSel = normalizar(sel.etiqueta);
      const esSelectorMaestria =
        esRasgoMaestria ||
        idSel.includes("maestria") ||
        etiquetaSel.includes("maestria");

      if (!esSelectorMaestria) continue;

      const valores: string[] = Array.isArray(sel.valorActual)
        ? sel.valorActual
        : typeof sel.valorActual === "string"
        ? [sel.valorActual]
        : [];

      for (const val of valores) {
        if (!val) continue;
        const claveVal = normalizar(val);
        maestrias.add(claveVal);

        // Buscar en las opciones del selector para enriquecer con sinónimos (id, nombre, etc.)
        const opc = sel.opciones.find(
          (o) => normalizar(o.id) === claveVal || normalizar(o.nombre) === claveVal
        );
        if (opc) {
          maestrias.add(normalizar(opc.id));
          maestrias.add(normalizar(opc.nombre));
          // Extraer posibles partes de patrones como "Cleave (Hender)"
          const matchParen = opc.nombre.match(/^([^(]+)\s*\(([^)]+)\)/);
          if (matchParen) {
            maestrias.add(normalizar(matchParen[1]));
            maestrias.add(normalizar(matchParen[2]));
          }
        }
      }
    }
  }

  return maestrias;
}

/**
 * Comprueba si el personaje tiene desbloqueada o aprendida una maestría de arma específica.
 */
export function personajeTieneMaestriaArma(
  personaje: PersonajeJugador,
  maestriaArma?: string | null
): boolean {
  if (!maestriaArma || !maestriaArma.trim() || normalizar(maestriaArma) === "ninguna") {
    return false;
  }

  const maestriasAprendidas = obtenerMaestriasArmasAprendidas(personaje);
  if (maestriasAprendidas.size === 0) {
    return false;
  }

  const claveArma = normalizar(maestriaArma);
  if (maestriasAprendidas.has(claveArma)) {
    return true;
  }

  // Extraer tokens de expresiones como "Cleave (Hender)" o "Topple (Derribar)"
  const matchParen = maestriaArma.match(/^([^(]+)\s*\(([^)]+)\)/);
  if (matchParen) {
    const p1 = normalizar(matchParen[1]);
    const p2 = normalizar(matchParen[2]);
    if (maestriasAprendidas.has(p1) || maestriasAprendidas.has(p2)) {
      return true;
    }
  }

  // Comprobar coincidencia por contención si la clave es suficientemente descriptiva
  for (const aprendida of maestriasAprendidas) {
    if (aprendida.length >= 3 && (claveArma.includes(aprendida) || aprendida.includes(claveArma))) {
      return true;
    }
  }

  return false;
}

export interface ConfiguracionPactoDelFilo {
  activo: boolean;
  tipoDano: "propio" | "necrotico" | "psiquico" | "radiante";
  caracteristica?: Caracteristica;
}

/**
 * Obtiene el estado y configuración de la invocación Pacto del filo para el personaje.
 * Determina si está activo y el tipo de daño seleccionado ('propio', 'necrotico', 'psiquico', 'radiante').
 */
export function obtenerConfiguracionPactoDelFilo(personaje: PersonajeJugador, idInstancia?: string): ConfiguracionPactoDelFilo {
  if (!personaje) return { activo: false, tipoDano: "propio" };
  for (const r of personaje.rasgos || []) if (r.activo !== false && r.vinculoArma?.idInstancia
    && esRasgoHabilitadoPorOpcion(r, personaje.rasgos)
    && (!idInstancia || r.vinculoArma.idInstancia === idInstancia)) {
    const tipo = r.selectores?.find(s => s.id === r.vinculoArma?.selectorTipoDano)?.valorActual[0];
    return { activo:true, caracteristica:r.vinculoArma.caracteristica,
      tipoDano: tipo === "necrotico" || tipo === "psiquico" || tipo === "radiante" ? tipo : "propio" };
  }
  return { activo: false, tipoDano: "propio" };
}

/**
 * Obtiene la cantidad de dados extra que se suman al daño del arma en caso de golpe crítico.
 * Por defecto en un crítico los dados del arma se multiplican x2.
 * Efectos declarativos tipo "dado_extra_critico" (como Perforador) suman dados adicionales (+1)
 * si el tipo de daño coincide (ej. "perforante") o aplica a "todos".
 */
export function obtenerDadosExtraCriticoArma(personaje: PersonajeJugador, tipoDano: string): number {
  if (!personaje) return 0;
  const efectos = evaluarEfectosRasgosActivos(personaje);
  let extra = 0;
  const tipoDanoNorm = normalizar(tipoDano);
  for (const ef of efectos) {
    if (ef.tipo === "dado_extra_critico") {
      const criterio = normalizar(ef.aplicaA || ef.objetivo || "todos");
      if (criterio === "todos" || criterio === "arma" || tipoDanoNorm.includes(criterio)) {
        extra += Number(ef.valor) || 1;
      }
    }
  }
  return extra;
}

/**
 * Aplica enriquecimientos mecánicos dinámicos provenientes de Invocaciones Sobrenaturales
 * al hechizo (especialmente trucos modificados como Descarga Agónica o Lanza Sobrenatural).
 * Función pura: no muta el objeto hechizo original.
 */
export function aplicarModificadoresInvocacionesAHechizo(
  hechizo: HechizoBase,
  personaje: PersonajeJugador | null | undefined,
  claseLanzamiento?: string
): HechizoBase {
  if (!personaje || hechizo.nivel !== 0) {
    return hechizo;
  }

  let modificado = false;
  let nuevoAgregarModificadorHabilidad = hechizo.agregarModificadorHabilidad;
  let nuevoAlcance = hechizo.alcance;

  // 2. Evaluar bonificación de daño por modificador de característica para trucos
  // (Lanzamiento Potente de Clérigo, Descarga Agónica de Brujo, etc.)
  // Unificado mediante el efecto declarativo bono_dano_conjuro + agregar_modificador_habilidad
  const efectosRasgosActivos = evaluarEfectosRasgosActivos(personaje);
  const claseEfectiva = claseLanzamiento ?? (personaje.clasesLanzadoras?.length ? resolverClaseLanzamiento(personaje, hechizo) : undefined);
  const bonosHabilidad = efectosRasgosActivos.filter((ef) => {
    if (ef.claseConjuro && !claseEfectiva && (personaje.clasesLanzadoras?.length ?? 0) > 1) return false;
    if (ef.claseConjuro && (claseEfectiva ? normalizar(ef.claseConjuro) !== normalizar(claseEfectiva)
      : !hechizo.clases?.some(c => normalizar(c) === normalizar(ef.claseConjuro)))) return false;
    if (ef.tipo !== "bono_dano_conjuro") return false;
    const objNorm = normalizar(ef.objetivo || "");
    if (objNorm !== "agregar_modificador_habilidad" && !objNorm.includes("modificador_habilidad")) {
      return false;
    }

    const aplNorm = normalizar(ef.aplicaA || "");
    // Si aplica a todos los trucos/conjuros o sin restricción
    if (!aplNorm || aplNorm === "trucos" || aplNorm === "todos_conjuros" || aplNorm === "todos") {
      return true;
    }

    // Si aplica a trucos específicos de una clase
    if (aplNorm === "trucos_clerigo") {
      const clasesNorm = (hechizo.clases || []).map(normalizar);
      return clasesNorm.length === 0 || clasesNorm.includes("clerigo") || clasesNorm.includes("clérigo");
    }
    if (aplNorm === "trucos_brujo") {
      const clasesNorm = (hechizo.clases || []).map(normalizar);
      return clasesNorm.length === 0 || clasesNorm.includes("brujo");
    }

    // Si aplica a un truco específico por id o nombre (ej. 'descarga_sobrenatural', 'rayo_de_escarcha')
    return Boolean(
      ef.aplicaA &&
      (coincideHechizoId(ef.aplicaA, hechizo.id) || coincideHechizoId(ef.aplicaA, hechizo.nombre))
    );
  });

  const bonosConAptitudExplicita = bonosHabilidad.filter(e => e.claseConjuro);
  const bonoDeclarado = bonosConAptitudExplicita.length ? Math.max(...bonosConAptitudExplicita.map(e => evaluarExpresionNumericaSegura(resolverFormulaDinamica(e.valor, personaje)))) : undefined;
  if (hechizo.bonoModificadorRasgo !== undefined && bonoDeclarado === undefined) nuevoAgregarModificadorHabilidad = false;
  if (bonoDeclarado !== hechizo.bonoModificadorRasgo) modificado = true;
  if (bonosHabilidad.length && !nuevoAgregarModificadorHabilidad) {
    nuevoAgregarModificadorHabilidad = true;
    modificado = true;
  }
  // El catálogo declara el alcance y el conjuro elegido; se evalúa la fórmula genérica.
  const baseAlcance = nuevoAlcance?.match(/^(\d+)\s*(pies|ft)?$/i);
  if (baseAlcance) {
    let bono = 0;
    for (const ef of efectosRasgosActivos) if (ef.tipo === "modificador_alcance_conjuro" && ef.aplicaA
      && (coincideHechizoId(ef.aplicaA, hechizo.id) || coincideHechizoId(ef.aplicaA, hechizo.nombre))) {
      bono += evaluarExpresionNumericaSegura(resolverFormulaDinamica(ef.valor, personaje));
    }
    if (bono) { nuevoAlcance = String(Number(baseAlcance[1]) + bono) + " pies"; modificado = true; }
  }

  if (!modificado) return hechizo;

  return {
    ...hechizo,
    agregarModificadorHabilidad: nuevoAgregarModificadorHabilidad,
    bonoModificadorRasgo: bonoDeclarado,
    alcance: nuevoAlcance
  };
}
