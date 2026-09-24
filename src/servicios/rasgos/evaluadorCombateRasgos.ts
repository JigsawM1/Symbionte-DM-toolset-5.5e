import {
  type PersonajeJugador,
  type Caracteristica,
  type HechizoBase
} from "@/tipos";
import { coincideHechizoId } from "@/servicios/comparadorHechizos";
import {
  normalizar,
  estaRevelacionCelestialActiva,
  obtenerBonoCompetenciaPersonaje,
  obtenerNivelClasePersonaje,
  tieneArmaduraEquipada,
  tieneEscudoEquipado
} from "./utilidadesRasgos";
import {
  evaluarEfectosRasgosActivos,
  resolverFormulaDinamica,
  evaluarExpresionNumericaSegura
} from "./evaluadorExpresionesRasgos";
import { obtenerDadoInspiracionBardica } from "./evaluadorSalvacionesRasgos";

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
}

/**
 * Comprueba si un efecto mecánico de daño aplica al contexto del ataque actual.
 */
function aplicaEfectoAAtaque(
  aplicaA: string | undefined,
  objetivo: string,
  contexto: ContextoAtaquePersonaje
): boolean {
  const criterio = normalizar(aplicaA || objetivo || "");

  if (criterio === "todos_ataques" || criterio === "todos" || criterio === "ataque") {
    return true;
  }
  if (criterio === "arma_fuerza" || criterio === "ataque_fuerza") {
    return contexto.caracteristica === "fuerza";
  }
  if (criterio === "arma_cac" || criterio === "cuerpo_a_cuerpo") {
    return contexto.esCuerpoACuerpo;
  }
  if (criterio === "arma_distancia" || criterio === "distancia") {
    return contexto.esDistancia;
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
  if (criterio === "desarmado") {
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
          resultado.push({
            formula: formulaResuelta,
            tipoDano: ef.tipoDano || "Adicional",
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
        const descNorm = normalizar(ef.descripcion || "");
        if (descNorm.includes("revelacion celestial") || descNorm.includes("revelacion_celestial")) {
          yaAplicoRevelacion = true;
        }
      }
    }
  }

  // Respaldo reactivo garantizado: si Revelación celestial está activa (condiciones, efectos temporales o rasgo conmutado)
  // y ningún efecto de rasgo previo aportó el bono, sumar directamente el Bono de Competencia (+PB)
  if (!yaAplicoRevelacion && estaRevelacionCelestialActiva(personaje)) {
    bonoTotal += obtenerBonoCompetenciaPersonaje(personaje);
  }

  return bonoTotal;
}

/**
 * Obtiene bonificadores numéricos extra al daño procedentes de rasgos activos
 * con efecto `bono_dano_fuerza` o similar (delegador retrocompatible).
 */
export function obtenerBonoDanoFuerzaExtra(
  personaje: PersonajeJugador,
  contexto: ContextoAtaquePersonaje
): number {
  return obtenerBonoDanoAtaqueExtra(personaje, contexto);
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
  if (!criterio || criterio === "todos_conjuros" || criterio === "todos" || criterio === "conjuros") {
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
  return true;
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
      if (aplicaEfectoAConjuro(ef.aplicaA, ef.objetivo, contexto)) {
        const formulaResuelta = resolverFormulaDinamica(ef.valor, personaje);
        const valorNumerico = evaluarExpresionNumericaSegura(formulaResuelta);
        bonoTotal += valorNumerico;
        const descNorm = normalizar(ef.descripcion || "");
        if (descNorm.includes("revelacion celestial") || descNorm.includes("revelacion_celestial")) {
          yaAplicoRevelacion = true;
        }
      }
    }
  }

  // Respaldo reactivo garantizado: si Revelación celestial está activa (condiciones, efectos temporales o conmutador)
  // y ningún efecto de rasgo previo aportó el bono, sumar directamente el Bono de Competencia (+PB)
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
  if (valorDado === "dado_inspiracion" || valorDado === "dado_padre") {
    if (nivelBardo >= 15) return 12;
    if (nivelBardo >= 10) return 10;
    if (nivelBardo >= 5) return 8;
    return 6;
  }
  const match = valorDado.match(/(\d*)d(\d+)/i);
  if (match) {
    const cant = parseInt(match[1] || "1", 10);
    const caras = parseInt(match[2], 10);
    return cant * caras;
  }
  const num = Number(valorDado);
  return isNaN(num) ? 0 : num;
}

/**
 * Evalúa si el personaje posee un rasgo activo que modifique el ataque sin armas
 * (ej. Daño bárdico del Colegio de la Danza, Matón de Taberna, o rasgos Homebrew de combate desarmado).
 * Aplica precedencia por peso de modificación para que ataques marciales superiores prevalezcan sobre 1d4.
 */
export function evaluarAtaqueDesarmadoEspecial(personaje: PersonajeJugador): InfoAtaqueDesarmadoEspecial {
  const armadura = tieneArmaduraEquipada(personaje);
  const tieneEscudo = tieneEscudoEquipado(personaje);
  const sinArmaduraNiEscudo = !armadura.tieneArmadura && !tieneEscudo;

  const efectos = evaluarEfectosRasgosActivos(personaje);
  const efectosDesarmadosValidos = efectos.filter((ef) => {
    if (ef.tipo !== "ataque_desarmado") return false;
    const exigeSinArmadura = ef.condicion === "sin_armadura" || ef.condicion === "sin_armadura_ni_escudo";
    if (exigeSinArmadura && !sinArmaduraNiEscudo) return false;
    return true;
  });

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

  const nombreAtaque = ef.descripcion || "Golpe sin Armas Especial";
  const caracSugerida = (ef.objetivo as Caracteristica) || (dadoDano === "1d4" ? "fuerza" : "destreza");
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
}

/**
 * Obtiene el estado y configuración de la invocación Pacto del filo para el personaje.
 * Determina si está activo y el tipo de daño seleccionado ('propio', 'necrotico', 'psiquico', 'radiante').
 */
export function obtenerConfiguracionPactoDelFilo(personaje: PersonajeJugador): ConfiguracionPactoDelFilo {
  if (!personaje) return { activo: false, tipoDano: "propio" };

  for (const r of personaje.rasgos || []) {
    if (r.activo === false) continue;
    if (Array.isArray(r.selectores)) {
      for (const sel of r.selectores) {
        for (const val of sel.valorActual || []) {
          if (
            typeof val === "string" &&
            (val === "pacto_del_filo" || val.startsWith("pacto_del_filo:") || val.startsWith("pacto_del_filo__"))
          ) {
            const subtipo = val.includes(":") ? val.split(":")[1].toLowerCase() : "propio";
            const tipoValido =
              subtipo === "necrotico" || subtipo === "psiquico" || subtipo === "radiante"
                ? subtipo
                : "propio";
            return { activo: true, tipoDano: tipoValido };
          }
        }
      }
    }
    if (r.id === "pacto_del_filo" || normalizar(r.nombre) === "pacto del filo") {
      return { activo: true, tipoDano: "propio" };
    }
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
  personaje: PersonajeJugador | null | undefined
): HechizoBase {
  if (!personaje || hechizo.nivel !== 0) {
    return hechizo;
  }

  // 1. Recolectar selecciones activas de invocaciones del personaje
  const invocacionesActivas: string[] = [];
  for (const r of personaje.rasgos || []) {
    if (r.activo === false) continue;
    if (Array.isArray(r.selectores)) {
      for (const sel of r.selectores) {
        if (Array.isArray(sel.valorActual)) {
          for (const val of sel.valorActual) {
            if (typeof val === "string" && val.trim()) {
              invocacionesActivas.push(val.trim());
            }
          }
        }
      }
    }
  }

  let modificado = false;
  let nuevoAgregarModificadorHabilidad = hechizo.agregarModificadorHabilidad;
  let nuevoAlcance = hechizo.alcance;

  // 2. Evaluar Descarga Agónica: activa agregarModificadorHabilidad = true
  const tieneDescargaAgonica = invocacionesActivas.some((inv) => {
    if (!inv.startsWith("descarga_agonica")) return false;
    // Formato 'descarga_agonica:trucoId' o 'descarga_agonica__timestamp:trucoId' o fallback 'descarga_agonica'
    if (inv.includes(":")) {
      const trucoId = inv.split(":")[1];
      return coincideHechizoId(trucoId, hechizo.id) || coincideHechizoId(trucoId, hechizo.nombre);
    }
    // Si no tiene sufijo de truco específico, aplica a Descarga sobrenatural por defecto canónico
    return coincideHechizoId("descarga_sobrenatural", hechizo.id) || coincideHechizoId("descarga_sobrenatural", hechizo.nombre);
  });

  if (tieneDescargaAgonica && !nuevoAgregarModificadorHabilidad) {
    nuevoAgregarModificadorHabilidad = true;
    modificado = true;
  }

  // 3. Evaluar Lanza Sobrenatural: añade (nivelBrujo * 10) pies al alcance si es >= 10 pies
  const tieneLanzaSobrenatural = invocacionesActivas.some((inv) => {
    if (!inv.startsWith("lanza_sobrenatural")) return false;
    if (inv.includes(":")) {
      const trucoId = inv.split(":")[1];
      return coincideHechizoId(trucoId, hechizo.id) || coincideHechizoId(trucoId, hechizo.nombre);
    }
    return coincideHechizoId("descarga_sobrenatural", hechizo.id) || coincideHechizoId("descarga_sobrenatural", hechizo.nombre);
  });

  if (tieneLanzaSobrenatural && nuevoAlcance) {
    // Parsear alcance numérico (ej. "120 pies", "120 ft", "60 pies", "30")
    const matchAlcance = nuevoAlcance.match(/^(\d+)\s*(pies|ft|m|metros)?$/i);
    if (matchAlcance) {
      const valorBase = parseInt(matchAlcance[1], 10);
      const unidad = matchAlcance[2] || "pies";
      if (valorBase >= 10) {
        const nivelBrujo =
          personaje.clases?.find(
            (c) => normalizar(c.nombre) === "brujo"
          )?.nivel ||
          (normalizar(personaje.clase) === "brujo" ? personaje.nivel : 0) ||
          1;

        const bonoPies = nivelBrujo * 10;
        nuevoAlcance = `${valorBase + bonoPies} ${unidad}`;
        modificado = true;
      }
    }
  }

  if (!modificado) return hechizo;

  return {
    ...hechizo,
    agregarModificadorHabilidad: nuevoAgregarModificadorHabilidad,
    alcance: nuevoAlcance
  };
}
