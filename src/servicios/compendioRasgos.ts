import type { PersonajeJugador, RasgoPersonaje, DotePersonaje, Caracteristica } from "@/tipos";
import {
  RASGOS_POR_ESPECIE,
  DOTES_CANONICAS_DND55
} from "@/constantes/rasgosDND55";
import {
  obtenerRasgosClaseYSubclase,
  esRasgoPlaceholderSubclase,
  esRasgoMejoraCaracteristica,
  esRasgoDonEpico,
  esRasgoEstiloCombate,
  construirDoteDeMejoraCaracteristica,
  construirDoteDeDonEpico,
  construirDoteDeEstiloCombate
} from "@/servicios/gestorClases";

import {
  obtenerEspeciePorNombre,
  obtenerSubespeciePorNombre,
  construirRasgosEspecie,
  esRasgoVersatil,
  construirDoteDeVersatil
} from "@/servicios/gestorEspecies";
import { esRasgoHabilitadoPorOpcion } from "@/servicios/rasgos/utilidadesRasgos";

/**
 * Normaliza nombres para comparación tolerante e insensible a mayúsculas/acentos
 */
function normalizarTexto(txt: string): string {
  return (txt || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Obtiene la lista de rasgos sugeridos para una especie/raza de D&D 5.5e
 */
export function obtenerRasgosSugeridosPorEspecie(
  especie: string,
  subespecie?: string,
  tamanoActual?: PersonajeJugador["tamano"],
  nivel: number = 1,
  bonificadorCompetencia: number = 2
): RasgoPersonaje[] {
  const espDef = obtenerEspeciePorNombre(especie);
  if (espDef) {
    const subDef = subespecie ? obtenerSubespeciePorNombre(espDef.id, subespecie) : undefined;
    return construirRasgosEspecie(espDef, subDef, nivel, bonificadorCompetencia, tamanoActual);
  }

  const normEspecie = normalizarTexto(especie);
  
  // Buscar en el diccionario
  const clave = Object.keys(RASGOS_POR_ESPECIE).find(
    (k) => normalizarTexto(k) === normEspecie || normEspecie.includes(normalizarTexto(k))
  );

  if (!clave || !RASGOS_POR_ESPECIE[clave]) {
    return [];
  }

  const plantillas = RASGOS_POR_ESPECIE[clave];
  const nombreLimpio = clave;

  return plantillas.map((p) => {
    const id = `rasgo_esp_${normalizarTexto(nombreLimpio)}_${normalizarTexto(p.nombre).replace(/\s+/g, "_")}`;
    const usos = p.tieneUsosLimitados ? p.usosMaximos || 1 : undefined;

    return {
      id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      origen: "especie",
      fuente: `Especie: ${nombreLimpio}${subespecie ? ` (${subespecie})` : ""}`,
      tipoAccion: p.tipoAccion,
      nivelRequerido: p.nivelRequerido,
      tieneUsosLimitados: !!p.tieneUsosLimitados,
      usosMaximos: usos,
      usosRestantes: usos,
      recuperacion: p.recuperacion || "ninguno",
      formulaDados: p.formulaDados,
      personalizado: false,
      activo: p.esActivable ? false : true,
      esActivable: p.esActivable,
      selectores: p.selectores ? JSON.parse(JSON.stringify(p.selectores)) : [],
      efectos: p.efectos ? [...p.efectos] : [],
      categoriaMecanica: p.categoriaMecanica,
      formulaEscalado: p.formulaEscalado,
      notas: ""
    };
  });
}

/**
 * Obtiene los rasgos sugeridos para las clases y subclases configuradas en el personaje
 */
export function obtenerRasgosSugeridosPorClases(
  clases: { nombre: string; subclase?: string; nivel: number }[]
): RasgoPersonaje[] {
  const rasgosTotales: RasgoPersonaje[] = [];
  const idsVistos = new Set<string>();

  for (const itemClase of clases) {
    const nivel = Math.max(1, Math.min(20, itemClase.nivel || 1));
    const rasgosClase = obtenerRasgosClaseYSubclase(itemClase.nombre, nivel, itemClase.subclase);
    for (const r of rasgosClase) {
      if (!idsVistos.has(r.id)) {
        idsVistos.add(r.id);
        rasgosTotales.push(r);
      }
    }
  }

  return rasgosTotales;
}

/**
 * Obtiene todas las dotes canónicas predefinidas de D&D 5.5e
 */
export function obtenerTodasDotesCanonicas(): DotePersonaje[] {
  return DOTES_CANONICAS_DND55;
}

/**
 * Sincroniza y fusiona los rasgos automáticos (Especie y Clases) con los rasgos existentes del personaje,
 * preservando intactos los rasgos personalizados, dotes y los contadores de usos modificados.
 */
export function sincronizarRasgosAutomaticos(personaje: PersonajeJugador): RasgoPersonaje[] {
  const rasgosExistentes = Array.isArray(personaje.rasgos) ? personaje.rasgos : [];

  // 1. Conservar rasgos personalizados, dotes y de trasfondo creados por el jugador (purgando marcadores obsoletos y dotes ligadas a resincronizar)
  const esDoteLigadaSintetica = (r: RasgoPersonaje) =>
    r.id.startsWith("dote_asi_") ||
    r.id.startsWith("dote_don_") ||
    r.id.startsWith("dote_origen_") ||
    (r.origen === "dote" &&
      Boolean(
        r.ligadoA &&
          (r.ligadoA.includes("mejora_de_caracteristica") ||
            r.ligadoA.includes("don_epico") ||
            r.ligadoA.includes("versatil"))
      ));

  const rasgosPersonalizados = rasgosExistentes.filter(
    (r) =>
      (r.personalizado || r.origen === "personalizado" || r.origen === "dote" || r.origen === "trasfondo") &&
      !esRasgoPlaceholderSubclase(r.nombre) &&
      !esDoteLigadaSintetica(r)
  );

  // 2. Resolver rasgos canónicos según Especie y Clases
  const clasesCalculo =
    personaje.clases && personaje.clases.length > 0
      ? personaje.clases.map((c, idx) => ({
          ...c,
          nombre:
            personaje.clases && personaje.clases.length === 1 && personaje.clase
              ? personaje.clase
              : c.nombre || (idx === 0 ? personaje.clase || "Guerrero" : "Guerrero"),
          subclase:
            personaje.clases && personaje.clases.length === 1 && personaje.subclase !== undefined
              ? personaje.subclase
              : c.subclase !== undefined
              ? c.subclase
              : idx === 0
              ? personaje.subclase || ""
              : "",
          nivel:
            personaje.clases.length === 1 && typeof personaje.nivel === "number" && personaje.nivel > 0
              ? personaje.nivel
              : c.nivel || 1
        }))
      : [{ nombre: personaje.clase || "Guerrero", subclase: personaje.subclase || "", nivel: personaje.nivel || 1 }];

  const nivelPj = Math.max(1, Math.min(20, personaje.nivel || 1));
  const bonoCompetencia = Math.floor((nivelPj - 1) / 4) + 2;

  const rasgosEspecie = obtenerRasgosSugeridosPorEspecie(
    personaje.especie,
    personaje.subespecie,
    personaje.tamano,
    nivelPj,
    bonoCompetencia
  ).filter((r) => !r.nivelRequerido || r.nivelRequerido <= nivelPj);
  const rasgosClase = obtenerRasgosSugeridosPorClases(clasesCalculo);

  const canonicosNuevos = [...rasgosEspecie, ...rasgosClase];

  // Filtrar placeholders de tabla y deduplicar canonicosNuevos por ID
  const idsVistosNuevos = new Set<string>();
  const canonicosNuevosUnicos: RasgoPersonaje[] = [];
  for (const r of canonicosNuevos) {
    if (!esRasgoPlaceholderSubclase(r.nombre) && !idsVistosNuevos.has(r.id)) {
      idsVistosNuevos.add(r.id);
      canonicosNuevosUnicos.push(r);
    }
  }

  // 3. Fusionar respetando el estado de usos restantes previo si ya existía el rasgo
  const mapaExistentes = new Map(rasgosExistentes.map((r) => [r.id, r]));

  const dotesAsiGeneradas: RasgoPersonaje[] = [];

  const canonicosFusionados = canonicosNuevosUnicos.map((nuevoRaw) => {
    let nuevo = nuevoRaw;

    // Resolver usos dependientes de un modificador de stat (genérico, vía escaladoUsos)
    if (nuevo.tieneUsosLimitados && nuevo.escaladoUsos?.tipo === "por_modificador" && nuevo.escaladoUsos.modificador) {
      const stat = nuevo.escaladoUsos.modificador as Caracteristica;
      const score = personaje.overridesFijos?.[stat] ?? personaje.caracteristicas?.[stat] ?? 10;
      const mod = Math.floor((score - 10) / 2);
      const usos = Math.max(nuevo.escaladoUsos.minimo ?? 1, mod);
      const usosRestantesPrevios = mapaExistentes.get(nuevo.id)?.usosRestantes;
      nuevo = {
        ...nuevo,
        usosMaximos: usos,
        usosRestantes: typeof usosRestantesPrevios === "number" ? Math.min(usosRestantesPrevios, usos) : usos
      };
    }

    const existente = mapaExistentes.get(nuevo.id);
    if (existente) {
      const selectoresSincronizados = nuevo.selectores?.map((sNuevo) => {
        const sExistente = existente.selectores?.find((s) => s.id === sNuevo.id);
        return {
          ...sNuevo,
          valorActual: sExistente?.valorActual && sExistente.valorActual.length > 0 ? sExistente.valorActual : sNuevo.valorActual ?? []
        };
      }) ?? existente.selectores;

      nuevo = {
        ...nuevo,
        selectores: selectoresSincronizados,
        condicionAlActivar: nuevo.condicionAlActivar ?? existente.condicionAlActivar,
        restaurarUsosAlActivar: nuevo.restaurarUsosAlActivar ?? existente.restaurarUsosAlActivar,
        usosRestantes:
          typeof existente.usosRestantes === "number" && nuevo.usosMaximos
            ? Math.min(existente.usosRestantes, nuevo.usosMaximos)
            : nuevo.usosRestantes,
        activo: existente.activo !== undefined ? existente.activo : (nuevo.esActivable ? false : true),
        notas: existente.notas || nuevo.notas
      };
    } else {
      nuevo = {
        ...nuevo,
        activo: nuevo.esActivable ? false : (nuevo.activo ?? true)
      };
    }

    // Si es un rasgo de Mejora de Característica o Don Épico, generar/sincronizar la dote asociada en el bloque de dotes
    if (esRasgoMejoraCaracteristica(nuevo.nombre)) {
      const selectorDote = nuevo.selectores?.find((s) => s.id.includes("dote_asi"));
      const idDoteSeleccionada = selectorDote?.valorActual?.[0] || "dote_mejora_caracteristica";
      let doteConstruida = construirDoteDeMejoraCaracteristica(nuevo, idDoteSeleccionada);

      const doteExistente = mapaExistentes.get(doteConstruida.id);
      if (doteExistente) {
        doteConstruida = {
          ...doteConstruida,
          usosRestantes:
            typeof doteExistente.usosRestantes === "number" && doteConstruida.usosMaximos
              ? Math.min(doteExistente.usosRestantes, doteConstruida.usosMaximos)
              : doteConstruida.usosRestantes,
          activo: doteExistente.activo !== undefined ? doteExistente.activo : true,
          notas: doteExistente.notas || doteConstruida.notas
        };
      }
      dotesAsiGeneradas.push(doteConstruida);
    } else if (esRasgoDonEpico(nuevo.nombre)) {
      const selectorDote = nuevo.selectores?.find((s) => s.id.includes("dote_don_epico") || s.id.includes("don_epico"));
      const idDoteSeleccionada = selectorDote?.valorActual?.[0];
      let doteConstruida = construirDoteDeDonEpico(nuevo, idDoteSeleccionada);

      const doteExistente = mapaExistentes.get(doteConstruida.id);
      if (doteExistente) {
        doteConstruida = {
          ...doteConstruida,
          usosRestantes:
            typeof doteExistente.usosRestantes === "number" && doteConstruida.usosMaximos
              ? Math.min(doteExistente.usosRestantes, doteConstruida.usosMaximos)
              : doteConstruida.usosRestantes,
          activo: doteExistente.activo !== undefined ? doteExistente.activo : true,
          notas: doteExistente.notas || doteConstruida.notas
        };
      }
      dotesAsiGeneradas.push(doteConstruida);
    } else if (nuevo.origen === "especie" && esRasgoVersatil(nuevo.nombre, nuevo.origen)) {
      const selectorDote = nuevo.selectores?.find((s) => s.id.includes("dote_origen") || s.id.includes("versatil"));
      const idDoteSeleccionada = selectorDote?.valorActual?.[0] || "dote_alerta";
      let doteConstruida = construirDoteDeVersatil(nuevo, idDoteSeleccionada);

      const doteExistente = mapaExistentes.get(doteConstruida.id);
      if (doteExistente) {
        doteConstruida = {
          ...doteConstruida,
          usosRestantes:
            typeof doteExistente.usosRestantes === "number" && doteConstruida.usosMaximos
              ? Math.min(doteExistente.usosRestantes, doteConstruida.usosMaximos)
              : doteConstruida.usosRestantes,
          activo: doteExistente.activo !== undefined ? doteExistente.activo : true,
          notas: doteExistente.notas || doteConstruida.notas
        };
      }
      dotesAsiGeneradas.push(doteConstruida);
    } else if (esRasgoEstiloCombate(nuevo.nombre)) {
      const selectorDote = nuevo.selectores?.find((s) => s.id.includes("dote_estilo") || s.id.includes("estilo_combate"));
      const idDoteSeleccionada = selectorDote?.valorActual?.[0] || "dote_estilo_defensa";
      let doteConstruida = construirDoteDeEstiloCombate(nuevo, idDoteSeleccionada);

      const doteExistente = mapaExistentes.get(doteConstruida.id);
      if (doteExistente) {
        doteConstruida = {
          ...doteConstruida,
          usosRestantes:
            typeof doteExistente.usosRestantes === "number" && doteConstruida.usosMaximos
              ? Math.min(doteExistente.usosRestantes, doteConstruida.usosMaximos)
              : doteConstruida.usosRestantes,
          activo: doteExistente.activo !== undefined ? doteExistente.activo : true,
          notas: doteExistente.notas || doteConstruida.notas,
          selectores: doteConstruida.selectores?.map((sel) => {
            const selExistente = doteExistente.selectores?.find((s) => s.id === sel.id);
            return selExistente && selExistente.valorActual?.length
              ? { ...sel, valorActual: selExistente.valorActual }
              : sel;
          })
        };
      }
      dotesAsiGeneradas.push(doteConstruida);
    }

    return nuevo;
  });

  // 4. Garantizar deduplicación estricta por ID único en el array consolidado final
  const mapaFinal = new Map<string, RasgoPersonaje>();
  for (const r of [...canonicosFusionados, ...dotesAsiGeneradas, ...rasgosPersonalizados]) {
    if (!mapaFinal.has(r.id)) {
      mapaFinal.set(r.id, r);
    }
  }

  // 5. Sincronizar estado activo de rasgos dependientes de opciones en selectores (pasivos permanentes)
  const listaFinal = Array.from(mapaFinal.values());
  for (const r of listaFinal) {
    if (r.requiereOpcion && r.ligadoA && !r.esActivable) {
      r.activo = esRasgoHabilitadoPorOpcion(r, listaFinal);
    }
  }

  return listaFinal;
}
