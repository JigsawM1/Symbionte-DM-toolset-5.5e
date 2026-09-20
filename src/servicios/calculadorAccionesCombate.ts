import type {
  PersonajeJugador,
  HechizoBase,
  HechizoVinculado,
  ObjetoJuego,
  TipoAccionConsumida,
  ConsumibleAccionCalculado,
  RasgoPersonaje,
  ModeloConjuros
} from "@/tipos";
import { detectarInfoConsumible, esObjetoConsumible } from "@/servicios/procesadorConsumibles";
import { calcularMaximosConjurosYTrucos } from "@/servicios/calculadorMagia";
import { OBJETOS_INICIALES } from "@/utiles/datosIniciales";
import { crearResolutorOrigenConjuros } from "@/servicios/resolutorOrigenConjuros";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";
import {
  resolverIdRasgoObjetivoGasto,
  aplicarModificadoresInvocacionesAHechizo
} from "@/servicios/evaluadorEfectosRasgos";
import {
  crearClavesLookupHechizos,
  crearSetsPertenencia,
  crearPredicadosPertenencia,
  clasificarTipoAccion
} from "@/servicios/logicaPertenenciaConjuros";

export { verificarHechizoDeSubclase } from "@/servicios/logicaPertenenciaConjuros";

export interface HechizoObjetoMagicoAccion {
  objetoInstanciaId: string;
  objetoNombre: string;
  cargasActuales: number;
  cargasMaximas: number;
  hechizo: HechizoVinculado;
  tipoAccion: TipoAccionConsumida;
}

export interface ConjuroAccionElemento {
  hechizo: HechizoBase;
  tipoAccion: TipoAccionConsumida;
}

const normalizar = (s: string): string => s.toLowerCase().trim();

/**
 * Resuelve y clasifica por economía de acciones los conjuros conocidos, preparados e innatos
 * (especie, subespecie, linaje, rasgos activos y subclase) del personaje.
 */
export function resolverConjurosAcciones(
  personajeActivo: PersonajeJugador | null,
  baseDatosConjuros: HechizoBase[],
  modeloOverride?: ModeloConjuros
): ConjuroAccionElemento[] {
  if (!personajeActivo) return [];

  const pjNivel = personajeActivo.nivel || 1;
  const modelo = modeloOverride ?? calcularMaximosConjurosYTrucos(
    personajeActivo.clasesLanzadoras || [],
    pjNivel
  ).modelo;

  const sets = crearSetsPertenencia(personajeActivo);
  const clavesLookup = crearClavesLookupHechizos(baseDatosConjuros);
  const resolutor = crearResolutorOrigenConjuros(personajeActivo);
  const predicados = crearPredicadosPertenencia({
    sets,
    clavesLookup,
    modelo,
    resolutorOrigen: resolutor
  });

  const idsAgregados = new Set<string>();
  const resultado: ConjuroAccionElemento[] = [];

  for (const h of baseDatosConjuros) {
    if (idsAgregados.has(h.id)) continue;
    if (!predicados.estaEnLista(h)) continue;

    idsAgregados.add(h.id);
    resultado.push({
      hechizo: aplicarModificadoresInvocacionesAHechizo(h, personajeActivo),
      tipoAccion: clasificarTipoAccion(h.tiempoLanzamiento || "")
    });
  }

  resultado.sort((a, b) => a.hechizo.nivel - b.hechizo.nivel || a.hechizo.nombre.localeCompare(b.hechizo.nombre, "es"));
  return resultado;
}

/**
 * Resuelve la lista de consumibles disponibles en el inventario para uso en combate.
 */
export function resolverConsumiblesCombate(
  personajeActivo: PersonajeJugador | null
): ConsumibleAccionCalculado[] {
  if (!personajeActivo) return [];
  const inventario = personajeActivo.inventario || [];
  const resultado: ConsumibleAccionCalculado[] = [];

  for (const obj of inventario) {
    const esConsumible = esObjetoConsumible(obj.nombre, obj.notas);

    if (esConsumible && obj.cantidad > 0) {
      const info = detectarInfoConsumible(obj.nombre, obj.notas);
      resultado.push({
        idInstancia: obj.idInstancia,
        nombre: obj.nombre,
        cantidad: obj.cantidad,
        tipoAccion: info.esAccionAdicional ? "accionAdicional" : "accion",
        esPocion: info.esPocion,
        esCurativo: info.esCurativo,
        formulaCuracion: info.formulaCuracion,
        descripcionUso: info.descripcionUso,
        notas: obj.notas
      });
    }
  }

  return resultado;
}

/**
/**
 * Resuelve hechizos vinculados a objetos mágicos en posesión activa del personaje
 * (equipados para armas/armaduras/escudos, o en posesión activa para otros objetos mágicos)
 * y sintonizados si lo requieren (D&D 5.5e).
 */
export function resolverHechizosObjetosMagicos(
  personajeActivo: PersonajeJugador | null,
  objetosHomebrew: ObjetoJuego[] = []
): HechizoObjetoMagicoAccion[] {
  if (!personajeActivo) return [];
  const inventario = personajeActivo.inventario || [];
  const lista: HechizoObjetoMagicoAccion[] = [];

  for (const obj of inventario) {
    // 1. Excluir objetos en almacenamiento remoto (almacén / campamento)
    if (obj.contenedor === "almacen") continue;

    // 2. Buscar datos en compendio / homebrew para metadatos complementarios
    const objComp =
      objetosHomebrew.find((b) => b.id === obj.idObjeto || normalizar(b.nombre) === normalizar(obj.nombre)) ||
      OBJETOS_INICIALES.find((b) => b.id === obj.idObjeto || normalizar(b.nombre) === normalizar(obj.nombre));

    // 3. Regla de sintonización
    const requiereSintonizacion = Boolean(obj.sintonizacionRequerida || objComp?.sintonizacionRequerida);
    if (requiereSintonizacion && !obj.sintonizado) continue;

    // 4. Regla de equipamiento: Solo armas, armaduras y escudos requieren estar equipados
    const categoriaEfectiva = obj.categoria || objComp?.categoria;
    const requiereEstarEquipado =
      categoriaEfectiva === "armas" ||
      categoriaEfectiva === "armaduras" ||
      categoriaEfectiva === "escudos";

    if (requiereEstarEquipado && !obj.equipado) continue;

    // 5. Extraer hechizos vinculados (instancia de inventario o compendio)
    const hechizos = obj.hechizosVinculados || objComp?.hechizosVinculados;
    if (hechizos && Array.isArray(hechizos)) {
      const cMax =
        obj.cargasMaximas ??
        ((objComp as Record<string, unknown>)?.cargasMaximas as number | undefined) ??
        (objComp?.cargas !== undefined ? Number(objComp.cargas) : 0);
      const cAct = obj.cargasActuales !== undefined ? obj.cargasActuales : cMax;

      for (const h of hechizos as HechizoVinculado[]) {
        let tipoAccion: TipoAccionConsumida = "accion";
        const hTipoAccion = (h as Record<string, unknown>).tipoAccion as string | undefined;
        const taNorm = normalizar(hTipoAccion || "");
        if (taNorm.includes("adicional") || taNorm.includes("bonus")) tipoAccion = "accionAdicional";
        else if (taNorm.includes("reaccion") || taNorm.includes("reacción")) tipoAccion = "reaccion";

        lista.push({
          objetoInstanciaId: obj.idInstancia,
          objetoNombre: obj.nombre,
          cargasActuales: cAct,
          cargasMaximas: cMax,
          hechizo: h,
          tipoAccion
        });
      }
    }
  }
  return lista;
}


export type CategoriaCombateRasgo =
  | "accion"
  | "accionAdicional"
  | "reaccion"
  | "consumible"
  | "activable"
  | "especial";

export interface RasgoAccionCombate {
  rasgo: RasgoPersonaje;
  categoriasCombate: CategoriaCombateRasgo[];
  tipoAccionCalculado: TipoAccionConsumida;
  esConsumible: boolean;
  esActivable: boolean;
  tieneDados: boolean;
  usosRestantes: number;
  usosMaximos: number;
}

/**
 * Clasifica y filtra los rasgos del personaje que tienen relevancia activa en combate:
 * acciones, acciones adicionales, reacciones, consumibles (con usos limitados) y activables (toggles).
 * Excluye rasgos puramente pasivos permanentes sin mecánicas activas.
 */
export function resolverRasgosAcciones(
  personajeActivo: PersonajeJugador | null
): RasgoAccionCombate[] {
  if (!personajeActivo) return [];

  const listaRasgos =
    Array.isArray(personajeActivo.rasgos) && personajeActivo.rasgos.length > 0
      ? personajeActivo.rasgos
      : sincronizarRasgosAutomaticos(personajeActivo);

  if (!Array.isArray(listaRasgos) || listaRasgos.length === 0) return [];

  const pjNivel = personajeActivo.nivel || 1;
  const resultado: RasgoAccionCombate[] = [];

  // Extraer rasgos base y sintetizar opciones activas de selectores que tengan mecánicas de combate (ej. Invocaciones como Castigo arcano)
  const todosLosRasgos: RasgoPersonaje[] = [...listaRasgos];
  for (const r of listaRasgos) {
    if (r.activo === false) continue;
    if (r.nivelRequerido && pjNivel < r.nivelRequerido) continue;
    if (Array.isArray(r.selectores)) {
      for (const sel of r.selectores) {
        if (!Array.isArray(sel.valorActual)) continue;
        for (const opId of sel.valorActual) {
          const baseId = opId.includes("__") ? opId.split("__")[0] : opId;
          const opcion = sel.opciones?.find((o) => o.id === baseId || o.id === opId);
          if (
            opcion &&
            (opcion.categoriaMecanica === "consumible" ||
              opcion.recursoGastado === "espacio_pacto" ||
              Boolean(opcion.formulaDados) ||
              (opcion.tipoAccion && opcion.tipoAccion !== "pasivo"))
          ) {
            todosLosRasgos.push({
              id: `${r.id}_${opId}`,
              nombre: opcion.nombre,
              descripcion: opcion.descripcion || "",
              origen: r.origen,
              fuente: r.fuente,
              tipoAccion: opcion.tipoAccion || "especial",
              nivelRequerido: opcion.nivelMinimo || r.nivelRequerido,
              tieneUsosLimitados: opcion.tieneUsosLimitados ?? (opcion.categoriaMecanica === "consumible" && opcion.usosMaximos !== undefined),
              usosMaximos: opcion.usosMaximos ?? 1,
              usosRestantes: opcion.usosRestantes ?? opcion.usosMaximos ?? 1,
              recuperacion: opcion.recuperacion || "ninguno",
              categoriaMecanica: opcion.categoriaMecanica || "consumible",
              recursoGastado: opcion.recursoGastado,
              formulaDados: opcion.formulaDados,
              escaladoFormulaDados: opcion.escaladoFormulaDados,
              selectores: opcion.selectores,
              efectos: opcion.efectos,
              personalizado: false,
              activo: true,
              notas: ""
            });
          }
        }
      }
    }
  }

  for (const rasgo of todosLosRasgos) {
    // 1. Filtrar por nivel mínimo requerido si está definido
    if (rasgo.nivelRequerido && pjNivel < rasgo.nivelRequerido) {
      continue;
    }

    // 2. Determinar categorías de combate según metadatos declarativos
    const categorias: CategoriaCombateRasgo[] = [];

    // Mapeo de economía de acción
    if (rasgo.tipoAccion === "accion") {
      categorias.push("accion");
    } else if (rasgo.tipoAccion === "accion_adicional") {
      categorias.push("accionAdicional");
    } else if (rasgo.tipoAccion === "reaccion") {
      categorias.push("reaccion");
    } else if (rasgo.tipoAccion === "especial") {
      categorias.push("especial");
    }

    // Activable (toggle táctico ON/OFF)
    const esActivable = Boolean(rasgo.esActivable || rasgo.categoriaMecanica === "activable");
    if (esActivable && !categorias.includes("activable")) {
      categorias.push("activable");
    }

    // Consumible (recurso con usos limitados, curación, ligado a padre o espacio de pacto)
    const tieneUsosPropios = Boolean(rasgo.tieneUsosLimitados && typeof rasgo.usosMaximos === "number");
    const esEspacioPacto = rasgo.recursoGastado === "espacio_pacto";
    const esConsumible = Boolean(
      tieneUsosPropios ||
      rasgo.gastarDePadre ||
      esEspacioPacto ||
      rasgo.categoriaMecanica === "consumible" ||
      rasgo.categoriaMecanica === "curacion"
    );
    if (esConsumible && !categorias.includes("consumible")) {
      categorias.push("consumible");
    }

    // Calcular fórmula de dados considerando escaladoFormulaDados
    let formulaDadosEfectiva = rasgo.formulaDados;
    if (rasgo.escaladoFormulaDados && rasgo.escaladoFormulaDados.length > 0) {
      const escalones = [...rasgo.escaladoFormulaDados].sort((a, b) => b.nivelMinimo - a.nivelMinimo);
      const escalon = escalones.find((e) => pjNivel >= e.nivelMinimo);
      if (escalon) {
        formulaDadosEfectiva = escalon.valor;
      }
    }

    const tieneDados = Boolean(formulaDadosEfectiva && formulaDadosEfectiva.trim() !== "");

    // 3. Excluir si es puramente pasivo permanente sin mecánicas activas
    const esPasivoPuro =
      (rasgo.tipoAccion === "pasivo" || !rasgo.tipoAccion) &&
      !esActivable &&
      !esConsumible &&
      !tieneDados;

    if (esPasivoPuro || categorias.length === 0) {
      continue;
    }

    // Calcular tipoAccion normalizado para interfaz de combate
    let tipoAccionCalculado: TipoAccionConsumida = "accion";
    if (rasgo.tipoAccion === "accion_adicional") {
      tipoAccionCalculado = "accionAdicional";
    } else if (rasgo.tipoAccion === "reaccion") {
      tipoAccionCalculado = "reaccion";
    }

    let usosMaximos = rasgo.usosMaximos ?? 1;
    let usosRestantes = rasgo.usosRestantes ?? usosMaximos;

    if (esEspacioPacto) {
      const maxPacto = personajeActivo.espaciosPactoMaximos || 0;
      const gastadosPacto = personajeActivo.espaciosPactoGastados || 0;
      usosMaximos = maxPacto;
      usosRestantes = Math.max(0, maxPacto - gastadosPacto);
    } else if (rasgo.gastarDePadre) {
      const idPadre = resolverIdRasgoObjetivoGasto(rasgo, listaRasgos);
      const rasgoPadre = listaRasgos.find((r) => r.id === idPadre);
      if (rasgoPadre && rasgoPadre.tieneUsosLimitados) {
        usosMaximos = rasgoPadre.usosMaximos ?? 1;
        usosRestantes = rasgoPadre.usosRestantes ?? usosMaximos;
      }
    }

    const rasgoEfectivo: RasgoPersonaje = formulaDadosEfectiva !== rasgo.formulaDados
      ? { ...rasgo, formulaDados: formulaDadosEfectiva }
      : rasgo;

    resultado.push({
      rasgo: rasgoEfectivo,
      categoriasCombate: categorias,
      tipoAccionCalculado,
      esConsumible,
      esActivable,
      tieneDados,
      usosRestantes,
      usosMaximos
    });
  }

  return resultado;
}
