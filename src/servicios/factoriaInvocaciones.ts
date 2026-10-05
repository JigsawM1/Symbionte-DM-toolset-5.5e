/**
 * factoriaInvocaciones.ts
 * -----------------------
 * Servicio de factoría pura y patrón Strategy para la proyección y escalado
 * en caliente de invocaciones de D&D 5.5e (PHB 2024 / 5e.tools style).
 *
 * Transforma una PlantillaInvocacion con un nivel de conjuro dado y los atributos
 * del personaje lanzador en una instancia completa de MonstruoBase lista para ser
 * renderizada en PanelFichaDnD, TarjetaCriaturaIniciativa o enlazada a TaleSpire.
 */

import type {
  PlantillaInvocacion,
  ContextoLanzadorInvocacion,
  RasgoInvocacion
} from "@/tipos/invocaciones";
import type { MonstruoBase } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador, Caracteristica } from "@/tipos";
import { resolverAtributoConjuroClase } from "@/constantes";
import catalogoInvocacionesJson from "@/datos/invocaciones/invocaciones.2024-es.json";

/**
 * Determina la característica de lanzamiento principal de un personaje según su clase canónica o atributos.
 */
export function obtenerHabilidadMagicaPersonaje(personaje: PersonajeJugador): Caracteristica {
  const atributoCanonico = resolverAtributoConjuroClase(personaje.clase);
  if (atributoCanonico) {
    return atributoCanonico;
  }

  // Fallback: elegir la característica mental con mayor puntuación
  const sab = personaje.caracteristicas?.sabiduria || 10;
  const int = personaje.caracteristicas?.inteligencia || 10;
  const car = personaje.caracteristicas?.carisma || 10;

  if (sab >= int && sab >= car) return "sabiduria";
  if (car >= int && car >= sab) return "carisma";
  return "inteligencia";
}

/**
 * Extrae el contexto del lanzador necesario para escalar invocaciones a partir de un PersonajeJugador.
 */
export function extraerContextoLanzador(personaje: PersonajeJugador): ContextoLanzadorInvocacion {
  const nivel = Math.max(1, Math.min(20, personaje.nivel || 1));
  const pb = Math.floor((nivel - 1) / 4) + 2;

  const habMagica = obtenerHabilidadMagicaPersonaje(personaje);
  const puntuacion = personaje.caracteristicas?.[habMagica] || 10;
  const modHabilidad = Math.floor((puntuacion - 10) / 2);

  const modificadorAtaqueConjuros = pb + modHabilidad;
  const cdSalvacionConjuros = 8 + pb + modHabilidad;

  return {
    modificadorAtaqueConjuros,
    cdSalvacionConjuros,
    bonificadorCompetencia: pb,
    habilidadConjurosMod: modHabilidad,
    nivelPersonaje: nivel
  };
}

/**
 * Catálogo canónico cargado en memoria para búsquedas O(1).
 */
export const CATALOGO_INVOCACIONES: PlantillaInvocacion[] = catalogoInvocacionesJson as PlantillaInvocacion[];
const MAPA_INVOCACIONES_POR_ID = new Map<string, PlantillaInvocacion>(
  CATALOGO_INVOCACIONES.map((inv) => [inv.id, inv])
);

/**
 * Busca una plantilla de invocación por su ID único.
 */
export function obtenerPlantillaInvocacionPorId(id: string): PlantillaInvocacion | undefined {
  return MAPA_INVOCACIONES_POR_ID.get(id);
}

/**
 * Determina si un identificador de criatura o plantilla corresponde a una invocación escalable.
 */
export function esIdInvocacionEscalable(id: string): boolean {
  return MAPA_INVOCACIONES_POR_ID.has(id);
}

/**
 * Calcula la Clase de Armadura (CA) escalada según la fórmula de la plantilla.
 */
export function calcularCAInvocacion(
  plantilla: PlantillaInvocacion,
  nivelConjuro: number
): number {
  const { formulaCA } = plantilla;
  const nivelSeguro = Number.isFinite(nivelConjuro) ? Number(nivelConjuro) : plantilla.nivelMinimo;
  let ca = formulaCA.base;
  if (formulaCA.sumaNivelConjuro) {
    ca += nivelSeguro;
  }
  ca += formulaCA.bonificadorAdicional || 0;
  return ca;
}

/**
 * Calcula la Vida Máxima (PV) escalada según la fórmula de la plantilla.
 */
export function calcularVidaInvocacion(
  plantilla: PlantillaInvocacion,
  nivelConjuro: number
): number {
  const { formulaVida, nivelMinimo } = plantilla;
  const nivelSeguro = Number.isFinite(nivelConjuro) ? Number(nivelConjuro) : plantilla.nivelMinimo;
  if (formulaVida.porNivelPorEncimaDelMinimo) {
    const nivelesExtra = Math.max(0, nivelSeguro - nivelMinimo);
    return formulaVida.base + formulaVida.porNivel * nivelesExtra;
  }
  return formulaVida.base + formulaVida.porNivel * nivelSeguro;
}

/**
 * Determina la cantidad de ataques por acción que realiza la invocación.
 */
export function calcularAtaquesPorAccionInvocacion(
  plantilla: PlantillaInvocacion,
  nivelConjuro: number
): number {
  const nivelSeguro = Number.isFinite(nivelConjuro) ? Number(nivelConjuro) : plantilla.nivelMinimo;
  if (plantilla.formulaAtaquesPorAccion === "fijo_1") {
    return 1;
  }
  if (plantilla.formulaAtaquesPorAccion === "mitad_nivel_arriba") {
    return Math.max(1, Math.ceil(nivelSeguro / 2));
  }
  // "mitad_nivel_abajo" por defecto canónico de D&D 2024
  return Math.max(1, Math.floor(nivelSeguro / 2));
}

/**
 * Proyecta una PlantillaInvocacion a un objeto canónico MonstruoBase,
 * aplicando el nivel de conjuro y los datos del lanzador de forma pura y desacoplada.
 */
export function proyectarInvocacionAMonstruo(
  plantilla: PlantillaInvocacion,
  nivelConjuroSolicitado: number,
  lanzador: ContextoLanzadorInvocacion,
  subtipoElegido?: string
): MonstruoBase {
  // Ajuste de seguridad para el nivel de conjuro (prevenir NaN si nivelConjuroSolicitado es undefined o inválido)
  const nivelSeguro = Number.isFinite(nivelConjuroSolicitado)
    ? Number(nivelConjuroSolicitado)
    : plantilla.nivelMinimo;
  const nivelConjuro = Math.max(
    plantilla.nivelMinimo,
    Math.min(plantilla.nivelMaximo, nivelSeguro)
  );

  const caCalculada = calcularCAInvocacion(plantilla, nivelConjuro);
  const vidaCalculada = calcularVidaInvocacion(plantilla, nivelConjuro);
  const numAtaques = calcularAtaquesPorAccionInvocacion(plantilla, nivelConjuro);

  // Resolver velocidad (incluyendo posibles velocidades especiales por nivel)
  let velocidadFinal = typeof plantilla.velocidadBase === "string"
    ? plantilla.velocidadBase
    : "30 pies";

  for (const esp of plantilla.velocidadesEspeciales) {
    if (nivelConjuro >= esp.nivelMinimo) {
      velocidadFinal = esp.velocidadTexto;
    }
  }

  // Resolver tirada de ataque y daño
  const bonificadorAtaqueNum = lanzador.modificadorAtaqueConjuros;
  const bonificadorAtaqueTexto = bonificadorAtaqueNum >= 0
    ? `+${bonificadorAtaqueNum}`
    : `${bonificadorAtaqueNum}`;

  const subtipoActivo = subtipoElegido || plantilla.subtiposDisponibles[0] || "";

  // Construir las acciones de ataque y acciones rápidas
  const accionesTransformadas = [];
  const accionesRapidas = [];

  // Si tiene más de 1 ataque, añadir la acción canónica de Ataque múltiple
  if (numAtaques > 1) {
    accionesTransformadas.push({
      nombre: "Ataque múltiple",
      bonificadorAtaque: undefined,
      daño: undefined,
      uso: undefined,
      recarga: undefined,
      descripcion: `El espíritu realiza ${numAtaques} ataques con sus armas o garras.`
    });
  }

  for (const atq of plantilla.ataques) {
    const bonoAtqTexto = atq.usaModificadorAtaqueConjuros ? bonificadorAtaqueTexto : "+0";
    const modDano = atq.modificadorDanoFijo + (atq.sumaNivelAlDano ? nivelConjuro : 0);
    const dadosConMod = modDano > 0
      ? `${atq.dadosDanoBase}+${modDano}`
      : modDano < 0
      ? `${atq.dadosDanoBase}${modDano}`
      : atq.dadosDanoBase;

    let tipoDanoResuelto = atq.tipoDano;
    const mapaSubtipos = atq.tipoDanoPorSubtipo;
    if (mapaSubtipos && subtipoActivo && mapaSubtipos[subtipoActivo]) {
      tipoDanoResuelto = mapaSubtipos[subtipoActivo];
    }

    const desc = `${atq.nombre}: Tirada de ataque ${atq.tipo === "a_distancia" ? "a distancia" : "cuerpo a cuerpo"}: ${bonoAtqTexto}, alcance ${atq.alcance}. Impacto: ${dadosConMod} de daño ${tipoDanoResuelto}. ${atq.descripcionExtra || ""}`.trim();

    accionesTransformadas.push({
      nombre: atq.nombre,
      bonificadorAtaque: atq.usaModificadorAtaqueConjuros ? bonificadorAtaqueNum : undefined,
      daño: dadosConMod,
      uso: undefined,
      recarga: undefined,
      descripcion: desc
    });

    accionesRapidas.push({
      nombre: atq.nombre,
      bonificadorAtaque: bonoAtqTexto,
      dadosDaño: dadosConMod,
      tipoDaño: tipoDanoResuelto
    });
  }

  // Filtrar rasgos y reemplazar variables dinámicas como CD de conjuros
  const filtrarPorSubtipo = (items: RasgoInvocacion[] = []) => {
    return items
      .filter((r: RasgoInvocacion) => !r.subtipoRequerido || !subtipoActivo || r.subtipoRequerido === subtipoActivo)
      .map((r: RasgoInvocacion) => ({
        nombre: r.nombre,
        uso: r.uso || "",
        recarga: r.recarga || "",
        descripcion: r.descripcion
          .replace(/tu CD de salvación de conjuros/gi, `CD ${lanzador.cdSalvacionConjuros}`)
          .replace(/tu CD de conjuros/gi, `CD ${lanzador.cdSalvacionConjuros}`)
          .replace(/el nivel del conjuro/gi, `${nivelConjuro}`)
          .replace(/nivel de conjuro/gi, `${nivelConjuro}`)
      }));
  };

  const rasgosFiltrados = filtrarPorSubtipo(plantilla.rasgos);
  const accionesAdicionalesFiltradas = filtrarPorSubtipo(plantilla.accionesAdicionales).map(
    (r: { nombre: string; uso: string; recarga: string; descripcion: string }) => ({
      nombre: r.nombre,
      bonificadorAtaque: undefined,
      daño: undefined,
      uso: r.uso,
      recarga: r.recarga,
      descripcion: r.descripcion
    })
  );

  const reaccionesFiltradas = filtrarPorSubtipo(plantilla.reacciones).map(
    (r: { nombre: string; uso: string; recarga: string; descripcion: string }) => ({
      nombre: r.nombre,
      uso: r.uso,
      recarga: r.recarga,
      descripcion: r.descripcion
    })
  );

  const nombreCompleto = subtipoActivo
    ? `${plantilla.nombre} (${subtipoActivo}, Nv. ${nivelConjuro})`
    : `${plantilla.nombre} (Nv. ${nivelConjuro})`;

  return {
    id: plantilla.id,
    nombre: nombreCompleto,
    tipo: plantilla.tipoCriatura,
    ca: caCalculada,
    caNotas: `10 + ${nivelConjuro} (Nivel del conjuro)`,
    vidaMaxima: vidaCalculada,
    vidaActual: vidaCalculada,
    vidaNotas: plantilla.formulaVida.dadoGolpeVisual
      ? `${nivelConjuro}${plantilla.formulaVida.dadoGolpeVisual} (Escalado por nivel ${nivelConjuro})`
      : `Escalado a Nv. ${nivelConjuro}`,
    iniciativaBonificador: Math.floor((plantilla.caracteristicas.destreza - 10) / 2),
    velocidad: velocidadFinal,
    sentidos: plantilla.sentidos,
    tamaño: plantilla.tamano,
    alineacion: plantilla.alineacion,
    idiomas: plantilla.idiomas,
    desafio: `Invocación (Nv. ${nivelConjuro})`,
    fuente: plantilla.fuente,
    caracteristicas: { ...plantilla.caracteristicas },
    salvaciones: {},
    habilidades: {},
    vulnerabilidades: [],
    resistencias: [],
    inmunidadesDaño: [],
    inmunidadesCondicion: [],
    accionesRapidas,
    rasgos: rasgosFiltrados,
    acciones: accionesTransformadas,
    accionesAdicionales: accionesAdicionalesFiltradas,
    reacciones: reaccionesFiltradas,
    accionesLegendariasTotal: "0",
    accionesLegendarias: [],
    equipo: "",
    tesoros: ""
  };
}
