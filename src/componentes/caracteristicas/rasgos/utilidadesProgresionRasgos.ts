import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import {
  obtenerClasePorNombre,
  obtenerSubclasePorNombre,
  resolverEscaladosRasgo,
  esRasgoPlaceholderSubclase
} from "@/servicios/gestorClases";
import type { BloqueProgresionClase, ItemProgresionClase } from "./VisorProgresionClase";
import type { GrupoClaseJerarquico, DatosJerarquicosRasgos } from "./tiposRasgosJugador";
import { DOTES_ORIGEN_DND55 } from "@/constantes/dotesConstantes";
import {
  esRasgoCanalizarDivinidad,
  resolverRecursosPadre
} from "@/servicios/rasgos/evaluadorRecursosRasgos";

export type { GrupoClaseJerarquico, DatosJerarquicosRasgos };
export { esRasgoCanalizarDivinidad, resolverRecursosPadre };

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


function calcularUsosItemProgresion(r: import("@/tipos/rasgos").PlantillaRasgoClase, nivelPj: number): number | undefined {
  if (!r.tieneUsosLimitados) return undefined;
  const escalado = resolverEscaladosRasgo(r, nivelPj, [], []);
  if (escalado.usosEscalados !== undefined) return escalado.usosEscalados;
  if (typeof r.obtenerUsosMaximos === "function") return r.obtenerUsosMaximos(nivelPj);
  return r.usosMaximos;
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
      .filter((r) => !(subDef && esRasgoPlaceholderSubclase(r.nombre)))
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
        usosMaximos: calcularUsosItemProgresion(r, nivelPj),
        usosRestantes: calcularUsosItemProgresion(r, nivelPj),
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
      usosMaximos: calcularUsosItemProgresion(r, nivelPj),
      usosRestantes: calcularUsosItemProgresion(r, nivelPj),
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
    claveColapsoCanalizarDivinidad: `canalizar_${idx}_${normalizar(c.nombre)}`,
    rasgosBase: [],
    rasgosSubclase: [],
    rasgosCanalizarDivinidad: [],
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
          } else if (esRasgoCanalizarDivinidad(rasgo)) {
            mc.rasgosCanalizarDivinidad.push(rasgo);
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

  for (const mc of mapClases) {
    if (mc.rasgosCanalizarDivinidad.length > 0) {
      mc.rasgosCanalizarDivinidad.sort((a, b) => {
        const esPadreA = normalizar(a.nombre) === "canalizar divinidad";
        const esPadreB = normalizar(b.nombre) === "canalizar divinidad";
        if (esPadreA && !esPadreB) return -1;
        if (!esPadreA && esPadreB) return 1;
        return (a.nivelRequerido || 0) - (b.nivelRequerido || 0);
      });
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

export { obtenerNivelEfectivoParaRasgo } from "@/servicios/gestorClases";
