import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { obtenerClasePorNombre, obtenerSubclasePorNombre } from "@/servicios/gestorClases";
import { resolverFormulaDinamica } from "@/servicios/evaluadorEfectosRasgos";
import type { BloqueProgresionClase, ItemProgresionClase } from "./VisorProgresionClase";
import type { GrupoClaseJerarquico, DatosJerarquicosRasgos } from "./tiposRasgosJugador";
import { DOTES_ORIGEN_DND55 } from "@/constantes/dotesConstantes";

export type { GrupoClaseJerarquico, DatosJerarquicosRasgos };

/**
 * Normaliza una cadena de texto para comparaciones insensibles a mayúsculas y diacríticos.
 */
export function normalizar(txt: string): string {
  return (txt || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Determina si el rasgo requiere furia activa para poder activarse y si está actualmente bloqueado.
 */
export function obtenerBloqueoToggleRasgo(
  r: RasgoPersonaje,
  furiaEstaActiva: boolean
): { bloqueado: boolean; motivo?: string } {
  const requiereFuria = Boolean(
    r.ligadoA &&
    (normalizar(r.ligadoA) === "furia" || normalizar(r.ligadoA).includes("furia"))
  );

  if (requiereFuria && !furiaEstaActiva && !r.activo) {
    return {
      bloqueado: true,
      motivo: "Requiere que la Furia esté activa para poder activarse"
    };
  }

  return { bloqueado: false };
}

/**
 * Resuelve los recursos padre en rasgos dependientes (usos compartidos o dados de daño/inspiración heredados).
 */
export function resolverRecursosPadre(
  personaje: PersonajeJugador | null,
  rasgo: RasgoPersonaje
): {
  usosPadre?: { restantes: number; maximos: number; nombre: string };
  formulaDadosEfectiva?: string;
} {
  if (!personaje) {
    return { usosPadre: undefined, formulaDadosEfectiva: undefined };
  }

  let padre: RasgoPersonaje | undefined;
  if (rasgo.ligadoA) {
    const lig = normalizar(rasgo.ligadoA);
    padre = (personaje.rasgos || []).find((r) =>
      normalizar(r.id) === lig || normalizar(r.nombre) === lig
    );
  }
  // Heurística estructural agnóstica si no se especificó ligadoA
  if (!padre && (rasgo.gastarDePadre || rasgo.heredarDadosPadre) && rasgo.fuente) {
    const candidatos = (personaje.rasgos || []).filter(
      (r) =>
        r.id !== rasgo.id &&
        r.tieneUsosLimitados &&
        r.origen === rasgo.origen &&
        r.fuente === rasgo.fuente
    );
    if (candidatos.length === 1) padre = candidatos[0];
  }

  const usosPadre = (rasgo.gastarDePadre && padre)
    ? {
        restantes: padre.usosRestantes ?? (padre.usosMaximos || 1),
        maximos: padre.usosMaximos || 1,
        nombre: padre.nombre
      }
    : undefined;

  const formulaBase = rasgo.heredarDadosPadre
    ? (padre?.formulaDados || rasgo.formulaDados)
    : rasgo.formulaDados;

  const formulaDadosEfectiva = formulaBase
    ? resolverFormulaDinamica(formulaBase, personaje)
    : undefined;

  return { usosPadre, formulaDadosEfectiva };
}

/**
 * Calcula la progresión de niveles 1 a 20 para todas las clases y subclases del personaje.
 */
export function calcularProgresionClases(
  _personaje: PersonajeJugador,
  clasesPersonaje: Array<{ nombre: string; subclase?: string; nivel: number }>
): BloqueProgresionClase[] {
  const lista: BloqueProgresionClase[] = [];

  for (const claseItem of clasesPersonaje) {
    const defClase = obtenerClasePorNombre(claseItem.nombre);
    if (!defClase) continue;

    const subDef = claseItem.subclase
      ? obtenerSubclasePorNombre(claseItem.nombre, claseItem.subclase)
      : null;
    const nivelPj = claseItem.nivel || 1;

    const rasgosClase1a20: ItemProgresionClase[] = defClase.rasgos
      .filter((r) => !(subDef && r.nombre.toLowerCase().includes("rasgo de subclase")))
      .map((r) => ({
        id: `prog_cls_${r.nivel}_${normalizar(r.nombre)}`,
        nombre: r.nombre,
        descripcion: r.descripcion,
        origen: "clase",
        fuente: `${defClase.nombre} (Nivel ${r.nivel})`,
        tipoAccion: r.tipoAccion,
        nivelRequerido: r.nivel,
        nivel: r.nivel,
        tieneUsosLimitados: !!r.tieneUsosLimitados,
        usosMaximos: r.tieneUsosLimitados && r.obtenerUsosMaximos ? r.obtenerUsosMaximos(nivelPj) : undefined,
        usosRestantes: r.tieneUsosLimitados && r.obtenerUsosMaximos ? r.obtenerUsosMaximos(nivelPj) : undefined,
        recuperacion: r.recuperacion || "ninguno",
        formulaDados: r.formulaDados,
        personalizado: false,
        activo: r.esActivable ? false : true,
        notas: "",
        alcanzado: nivelPj >= r.nivel,
        tablaProgresion: r.tablaProgresion,
        esActivable: !!r.esActivable,
        ligadoA: r.ligadoA,
        categoriaMecanica: r.categoriaMecanica,
        efectos: r.efectos ? JSON.parse(JSON.stringify(r.efectos)) : [],
        selectores: r.selectores ? JSON.parse(JSON.stringify(r.selectores)) : []
      }));

    const rasgosSub1a20: ItemProgresionClase[] = (subDef ? subDef.rasgos : []).map((r) => ({
      id: `prog_sub_${r.nivel}_${normalizar(r.nombre)}`,
      nombre: r.nombre,
      descripcion: r.descripcion,
      origen: "subclase",
      fuente: `${subDef?.nombre || "Subclase"} (Nivel ${r.nivel})`,
      tipoAccion: r.tipoAccion,
      nivelRequerido: r.nivel,
      nivel: r.nivel,
      tieneUsosLimitados: !!r.tieneUsosLimitados,
      usosMaximos: r.tieneUsosLimitados && r.obtenerUsosMaximos ? r.obtenerUsosMaximos(nivelPj) : undefined,
      usosRestantes: r.tieneUsosLimitados && r.obtenerUsosMaximos ? r.obtenerUsosMaximos(nivelPj) : undefined,
      recuperacion: r.recuperacion || "ninguno",
      formulaDados: r.formulaDados,
      personalizado: false,
      activo: r.esActivable ? false : true,
      notas: "",
      alcanzado: nivelPj >= r.nivel,
      tablaProgresion: r.tablaProgresion,
      esActivable: !!r.esActivable,
      ligadoA: r.ligadoA,
      categoriaMecanica: r.categoriaMecanica,
      efectos: r.efectos ? JSON.parse(JSON.stringify(r.efectos)) : [],
      selectores: r.selectores ? JSON.parse(JSON.stringify(r.selectores)) : []
    }));

    const todosProgresion: ItemProgresionClase[] = [...rasgosClase1a20, ...rasgosSub1a20].sort(
      (a, b) => a.nivel - b.nivel
    );

    lista.push({
      clase: claseItem,
      defClase,
      subDef,
      items: todosProgresion
    });
  }

  return lista;
}

/**
 * Clasifica y agrupa los rasgos filtrados en la jerarquía visual: Especie, Dotes, Personalizados y Clases.
 */
export function agruparRasgosJerarquicos(
  rasgosFiltrados: RasgoPersonaje[],
  clasesPersonaje: Array<{ nombre: string; subclase?: string; nivel: number }>
): DatosJerarquicosRasgos {
  const especie: RasgoPersonaje[] = [];
  const subespecie: RasgoPersonaje[] = [];
  const dotes: RasgoPersonaje[] = [];
  const personalizados: RasgoPersonaje[] = [];

  const mapClases: GrupoClaseJerarquico[] = clasesPersonaje.map((c, idx) => ({
    clase: c,
    claveColapsoClase: `clase_${idx}_${normalizar(c.nombre)}`,
    claveColapsoSubclase: `subclase_${idx}_${normalizar(c.nombre)}_${normalizar(c.subclase || "sin_subclase")}`,
    claveColapsoInvocaciones: `invocaciones_${idx}_${normalizar(c.nombre)}`,
    rasgosBase: [],
    rasgosSubclase: [],
    rasgoInvocaciones: undefined,
    total: 0
  }));

  const otrosClase: RasgoPersonaje[] = [];

  for (const rasgo of rasgosFiltrados) {
    if (rasgo.origen === "subespecie") {
      subespecie.push(rasgo);
    } else if (rasgo.origen === "especie") {
      const normFuente = normalizar(rasgo.fuente || "");
      if (
        normFuente.includes("subespecie:") ||
        normFuente.includes("legado:") ||
        normFuente.includes("linaje:")
      ) {
        subespecie.push(rasgo);
      } else {
        especie.push(rasgo);
      }
    } else if (rasgo.origen === "dote") {
      dotes.push(rasgo);
    } else if (rasgo.origen === "personalizado") {
      personalizados.push(rasgo);
    } else {
      const normFuente = normalizar(rasgo.fuente || "");
      let asignado = false;

      for (const mc of mapClases) {
        const normNombreClase = normalizar(mc.clase.nombre);
        const normSubClasePj = normalizar(mc.clase.subclase || "");

        if (normFuente.includes(normNombreClase) || rasgo.id.includes(`_${normNombreClase}_`)) {
          const nomRasgoNorm = normalizar(rasgo.nombre);
          if (
            nomRasgoNorm.includes("invocaciones sobrenaturales") &&
            Array.isArray(rasgo.selectores) &&
            rasgo.selectores.length > 0
          ) {
            mc.rasgoInvocaciones = rasgo;
          } else if (rasgo.origen === "subclase" || (normSubClasePj && normFuente.includes(normSubClasePj))) {
            mc.rasgosSubclase.push(rasgo);
          } else {
            mc.rasgosBase.push(rasgo);
          }
          mc.total++;
          asignado = true;
          break;
        }
      }

      if (!asignado) {
        otrosClase.push(rasgo);
      }
    }
  }

  return { especie, subespecie, dotes, personalizados, clases: mapClases, otrosClase };
}

/**
 * Extrae y sintetiza los rasgos correspondientes a las dotes de origen seleccionadas
 * en la invocación sobrenatural 'Lecciones de los Primeros' del Brujo.
 * Permite proyectar sus tarjetas visuales directamente en el bloque 'Dotes' de la ficha.
 */
export function resolverDotesDesdeInvocaciones(rasgos: RasgoPersonaje[]): RasgoPersonaje[] {
  if (!Array.isArray(rasgos)) return [];
  const dotesSinteticas: RasgoPersonaje[] = [];
  const idsVistos = new Set<string>();

  for (const rasgo of rasgos) {
    if (rasgo.activo === false) continue;
    if (!Array.isArray(rasgo.selectores)) continue;

    for (const selector of rasgo.selectores) {
      for (const opId of selector.valorActual || []) {
        if (typeof opId !== "string") continue;
        const baseSinArg = opId.includes(":") ? opId.split(":")[0] : opId;
        const baseId = baseSinArg.includes("__") ? baseSinArg.split("__")[0] : baseSinArg;

        if (baseId === "lecciones_de_los_primeros" && opId.includes(":")) {
          const doteId = opId.split(":")[1];
          const doteNorm = normalizar(doteId);
          const dotePlantilla = DOTES_ORIGEN_DND55.find(
            (d) =>
              d.id === doteId ||
              normalizar(d.id) === doteNorm ||
              normalizar(d.id).replace(/^dote_/, "") === doteNorm.replace(/^dote_/, "") ||
              normalizar(d.nombre) === doteNorm ||
              (doteNorm === "alert" && d.id === "dote_alerta") ||
              (doteNorm === "crafter" && d.id === "dote_fabricante") ||
              (doteNorm === "healer" && d.id === "dote_sanador") ||
              (doteNorm === "musician" && d.id === "dote_musico") ||
              (doteNorm === "lucky" && d.id === "dote_afortunado") ||
              (doteNorm === "savage-attacker" && d.id === "dote_atacante_salvaje") ||
              (doteNorm === "skilled" && d.id === "dote_habilidoso") ||
              (doteNorm === "tough" && d.id === "dote_duro") ||
              (doteNorm === "tavern-brawler" && d.id === "dote_maton_taberna")
          );

          if (dotePlantilla) {
            const yaExisteEnRasgos = (rasgos || []).some(
              (r) =>
                r.id === dotePlantilla.id ||
                r.id === `dote_invocacion_${dotePlantilla.id}` ||
                (r.origen === "dote" && normalizar(r.nombre) === normalizar(dotePlantilla.nombre))
            );
            if (yaExisteEnRasgos) continue;

            const idSintetico = `dote_invocacion_${opId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
            if (!idsVistos.has(idSintetico)) {
              idsVistos.add(idSintetico);
              dotesSinteticas.push({
                id: idSintetico,
                nombre: dotePlantilla.nombre,
                descripcion: dotePlantilla.descripcion,
                origen: "dote",
                fuente: "Lecciones de los Primeros (Brujo)",
                tipoAccion: dotePlantilla.tipoAccion || "pasivo",
                nivelRequerido: 1,
                tieneUsosLimitados: Boolean(dotePlantilla.tieneUsosLimitados),
                usosMaximos: dotePlantilla.usosMaximos,
                usosRestantes: dotePlantilla.usosMaximos,
                recuperacion: dotePlantilla.recuperacion || "ninguno",
                formulaDados: dotePlantilla.formulaDados,
                categoriaMecanica: dotePlantilla.categoriaMecanica,
                efectos: dotePlantilla.efectos,
                selectores: dotePlantilla.selectores,
                activo: true,
                personalizado: false,
                notas: "Dote de origen otorgada por la invocación sobrenatural Lecciones de los Primeros."
              });
            }
          }
        }
      }
    }
  }

  return dotesSinteticas;
}

/**
 * Obtiene el nivel efectivo que aplica a un rasgo en el contexto de un personaje.
 * - Para rasgos de clase o subclase (o asociados a una clase específica): retorna el nivel individual de dicha clase.
 * - Para rasgos de especie, subespecie, dote, trasfondo o personalizados (o si no se identifica la clase): retorna el nivel general del personaje.
 */
export function obtenerNivelEfectivoParaRasgo(
  personaje: PersonajeJugador | null | undefined,
  rasgo: RasgoPersonaje | null | undefined
): number {
  if (!personaje) return 1;
  const nivelGeneral = Math.max(1, Math.min(20, personaje.nivel || 1));
  if (!rasgo) return nivelGeneral;

  // Si es claramente un rasgo general no dependiente de clase (especie, dote, trasfondo), aplica el nivel general
  if (
    rasgo.origen === "especie" ||
    rasgo.origen === "subespecie" ||
    rasgo.origen === "dote" ||
    rasgo.origen === "trasfondo"
  ) {
    return nivelGeneral;
  }

  // Clases configuradas en el personaje
  const clasesPersonaje: Array<{ nombre: string; subclase?: string; nivel: number }> =
    personaje.clases && personaje.clases.length > 0
      ? personaje.clases
      : [
          {
            nombre: personaje.clase || "Guerrero",
            subclase: personaje.subclase || "",
            nivel: personaje.nivel || 1
          }
        ];

  // Si el personaje solo cuenta con una clase configurada, su nivel coincide con el general
  if (clasesPersonaje.length === 1) {
    return clasesPersonaje[0].nivel || nivelGeneral;
  }

  const normFuente = normalizar(rasgo.fuente || "");
  const normId = normalizar(rasgo.id || "");
  const normNombre = normalizar(rasgo.nombre || "");

  // 1. Búsqueda por coincidencia directa con las clases del personaje
  for (const c of clasesPersonaje) {
    const normNombreClase = normalizar(c.nombre);
    const normSubclaseClase = normalizar(c.subclase || "");

    // Coincidencia con el nombre de la clase en la fuente o en el id
    if (normNombreClase && (normFuente.includes(normNombreClase) || normId.includes(`_${normNombreClase}_`))) {
      return c.nivel;
    }

    // Coincidencia con la subclase configurada
    if (normSubclaseClase && (normFuente.includes(normSubclaseClase) || normId.includes(`_${normSubclaseClase}_`))) {
      return c.nivel;
    }
  }

  // 2. Búsqueda por catálogo oficial de clases y subclases canónicas
  for (const c of clasesPersonaje) {
    const defClase = obtenerClasePorNombre(c.nombre);
    if (!defClase) continue;

    const idClaseNorm = normalizar(defClase.id);
    if (normId.includes(`_${idClaseNorm}_`) || normFuente.includes(idClaseNorm)) {
      return c.nivel;
    }

    // Comprobar si el rasgo figura en la lista de rasgos de esta clase
    if (defClase.rasgos.some((r) => normalizar(r.nombre) === normNombre)) {
      return c.nivel;
    }

    // Comprobar si pertenece a alguna de las subclases de esta clase
    for (const sub of defClase.subclases) {
      const subNombreNorm = normalizar(sub.nombre);
      const subIdNorm = normalizar(sub.id);
      if (
        (subNombreNorm && (normFuente.includes(subNombreNorm) || normId.includes(`_${subNombreNorm}_`))) ||
        (subIdNorm && normId.includes(`_${subIdNorm}_`)) ||
        sub.rasgos.some((r) => normalizar(r.nombre) === normNombre)
      ) {
        return c.nivel;
      }
    }
  }

  // Fallback seguro: nivel general del personaje si no se detectó vinculación a una clase específica
  return nivelGeneral;
}
