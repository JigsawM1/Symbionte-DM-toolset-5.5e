import type {
  OpcionNivelLanzamiento,
  ParametrosGastoConjuro,
  ParametrosOpcionesLanzamiento,
  ResultadoGastoConjuro
} from "./tiposMagia";

function tieneRanurasEstandarPositivas(
  espacios: Record<string, number> | Record<number, number>
): boolean {
  return Object.entries(espacios).some(
    ([lvl, cant]) => Number(lvl) > 0 && (cant || 0) > 0
  );
}

/**
 * Calcula las opciones válidas de nivel para lanzar un conjuro (Upcasting),
 * respetando estrictamente las ranuras disponibles del personaje, las reglas de
 * Brujo (Warlock mono-clase siempre lanza a nivel de pacto fijo) y la delegación en multiclase.
 */
export function obtenerOpcionesLanzamientoConjuro(
  parametros: ParametrosOpcionesLanzamiento
): OpcionNivelLanzamiento[] {
  const {
    nivelHechizo,
    espaciosConjuroMaximos = {},
    nivelConjuroMaximo = 0,
    sistemaMagia = "espacios",
    esLanzadorPacto = false,
    nivelEspacioPacto = 0,
    espaciosPactoMaximos = 0,
    permitirUpcastLibre = false
  } = parametros;

  if (nivelHechizo === 0) {
    return [{ nivel: 0, etiqueta: "Truco", tipo: "estandar" }];
  }

  if (permitirUpcastLibre) {
    const opciones: OpcionNivelLanzamiento[] = [];
    for (let lvl = nivelHechizo; lvl <= 9; lvl++) {
      opciones.push({
        nivel: lvl,
        etiqueta: lvl === nivelHechizo ? `Nv. ${lvl}` : `Nv. ${lvl} ↑`,
        tipo: "estandar"
      });
    }
    return opciones;
  }

  const tieneEspaciosEstandar =
    sistemaMagia === "puntos"
      ? (nivelConjuroMaximo || 0) > 0
      : tieneRanurasEstandarPositivas(espaciosConjuroMaximos);

  const tienePacto =
    esLanzadorPacto && nivelEspacioPacto > 0 && (espaciosPactoMaximos || 0) > 0;

  // Caso Brujo Puro: siempre lanza al nivel fijo de pacto (o el nivel del conjuro si fuese superior)
  if (tienePacto && !tieneEspaciosEstandar) {
    const nivelFijo = Math.max(nivelHechizo, nivelEspacioPacto);
    return [{ nivel: nivelFijo, etiqueta: `Pacto Nv. ${nivelFijo}`, tipo: "pacto" }];
  }

  const nivelesEstandarDisponibles = new Set<number>();
  if (tieneEspaciosEstandar) {
    if (sistemaMagia === "puntos") {
      const maxLvl = Math.min(9, Math.max(0, nivelConjuroMaximo || 0));
      for (let lvl = nivelHechizo; lvl <= maxLvl; lvl++) {
        nivelesEstandarDisponibles.add(lvl);
      }
    } else {
      for (const [lvlStr, cant] of Object.entries(espaciosConjuroMaximos)) {
        const lvl = Number(lvlStr);
        if (lvl >= nivelHechizo && (cant || 0) > 0) {
          nivelesEstandarDisponibles.add(lvl);
        }
      }
    }
  }

  const todosLosNiveles = new Set<number>(nivelesEstandarDisponibles);
  if (tienePacto && nivelEspacioPacto >= nivelHechizo) {
    todosLosNiveles.add(nivelEspacioPacto);
  }

  if (todosLosNiveles.size === 0) {
    return [
      {
        nivel: nivelHechizo,
        etiqueta: `Nv. ${nivelHechizo}`,
        tipo: tienePacto ? "pacto" : "estandar"
      }
    ];
  }

  const nivelesOrdenados = Array.from(todosLosNiveles).sort((a, b) => a - b);
  const esMulticlasePacto = tienePacto && tieneEspaciosEstandar;

  return nivelesOrdenados.map((lvl) => {
    const esNivelPacto = tienePacto && lvl === nivelEspacioPacto;
    const esNivelEstandar = nivelesEstandarDisponibles.has(lvl);
    const etiquetaBase = lvl === nivelHechizo ? `Nv. ${lvl}` : `Nv. ${lvl} ↑`;
    const etiqueta =
      esMulticlasePacto && esNivelPacto
        ? `${etiquetaBase} (${esNivelEstandar ? "Pacto/Estándar" : "Pacto"})`
        : etiquetaBase;

    return {
      nivel: lvl,
      etiqueta,
      tipo: esNivelPacto ? "pacto" : "estandar"
    };
  });
}

/**
 * Ejecuta el gasto del recurso mágico apropiado delegando entre Magia de Pacto
 * y Magia Estándar según las reglas de multiclase de D&D 5.5e.
 */
export function gastarRecursoLanzamientoConjuro(
  params: ParametrosGastoConjuro
): ResultadoGastoConjuro {
  const {
    nivelLanzamiento,
    esLanzadorPacto = false,
    nivelEspacioPacto = 0,
    espaciosPactoMaximos = 0,
    espaciosPactoGastados = 0,
    espaciosConjuroMaximos = {},
    sistemaMagia = "espacios",
    costePuntosPorNivel,
    alGastarEspacio,
    alGastarPuntos,
    alGastarEspacioPacto
  } = params;

  if (nivelLanzamiento === 0) {
    return { recursoGastado: "ninguno" };
  }

  const pactoDisponible = espaciosPactoMaximos - espaciosPactoGastados > 0;
  const tienePacto =
    esLanzadorPacto && nivelEspacioPacto > 0 && espaciosPactoMaximos > 0;
  const tieneEspaciosEstandar = tieneRanurasEstandarPositivas(espaciosConjuroMaximos);

  if (tienePacto && nivelLanzamiento === nivelEspacioPacto) {
    if ((pactoDisponible || !tieneEspaciosEstandar) && alGastarEspacioPacto) {
      alGastarEspacioPacto();
      return { recursoGastado: "pacto", nivel: nivelEspacioPacto };
    }
  }

  if (sistemaMagia === "puntos" && alGastarPuntos) {
    const coste =
      costePuntosPorNivel?.[nivelLanzamiento] ?? (costePuntosPorNivel?.[1] || 2);
    alGastarPuntos(coste);
    return { recursoGastado: "puntos", puntos: coste, nivel: nivelLanzamiento };
  }

  if (alGastarEspacio) {
    alGastarEspacio(nivelLanzamiento);
    return { recursoGastado: "espacio", nivel: nivelLanzamiento };
  }

  return { recursoGastado: "ninguno" };
}
