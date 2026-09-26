import { CONDICIONES_2024, EFECTOS_PREDEFINIDOS } from "@/utiles/datosIniciales";

export interface DetalleCondicionOEfecto {
  titulo: string;
  descripcion: string;
  efectos?: string[];
}

const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

/**
 * Servicio encargado de buscar y estructurar los detalles y efectos mecánicos
 * de cualquier condición o efecto activo para su visualización en tooltips o paneles.
 */
export function obtenerDetalleCondicion(nombre: string): DetalleCondicionOEfecto {
  if (!nombre) {
    return { titulo: "Efecto Desconocido", descripcion: "Sin información adicional." };
  }

  const nombreNorm = normalizar(nombre);
  const nombreBaseNorm = normalizar(nombre.split(" (")[0]);

  // 1. Buscar coincidencia exacta por nombre o por alias en EFECTOS_PREDEFINIDOS
  const efectoExacto = EFECTOS_PREDEFINIDOS.find((e) => {
    const minEf = normalizar(e.nombre);
    const minEfBase = normalizar(e.nombre.split(" (")[0]);

    if (minEf === nombreNorm || minEfBase === nombreBaseNorm) {
      return true;
    }

    return e.aliases?.some((alias) => {
      const minAlias = normalizar(alias);
      const minAliasBase = normalizar(alias.split(" (")[0]);
      return minAlias === nombreNorm || minAliasBase === nombreBaseNorm;
    }) ?? false;
  });

  if (efectoExacto) {
    return {
      titulo: efectoExacto.tituloVisual ?? efectoExacto.nombre,
      descripcion: efectoExacto.descripcion,
      ...(efectoExacto.efectos ? { efectos: efectoExacto.efectos } : {})
    };
  }

  // 2. Buscar coincidencia exacta en CONDICIONES_2024
  const condExacta = CONDICIONES_2024.find((c) => {
    const minCond = normalizar(c.nombre);
    const minCondBase = normalizar(c.nombre.split(" (")[0]);
    return minCond === nombreNorm || minCondBase === nombreBaseNorm;
  });

  if (condExacta) {
    return {
      titulo: condExacta.nombre,
      descripcion: condExacta.descripcion,
      efectos: condExacta.efectos
    };
  }

  // 3. Fallback por coincidencia parcial / más larga en EFECTOS_PREDEFINIDOS
  const candidatosEfectos = EFECTOS_PREDEFINIDOS.filter((e) => {
    const minEf = normalizar(e.nombre);
    if (minEf.includes(nombreNorm) || nombreNorm.includes(minEf)) return true;
    return e.aliases?.some((alias) => {
      const minAlias = normalizar(alias);
      return minAlias.includes(nombreNorm) || nombreNorm.includes(minAlias);
    }) ?? false;
  });

  if (candidatosEfectos.length > 0) {
    const mejor = candidatosEfectos.sort((a, b) => b.nombre.length - a.nombre.length)[0];
    return {
      titulo: mejor.tituloVisual ?? mejor.nombre,
      descripcion: mejor.descripcion,
      ...(mejor.efectos ? { efectos: mejor.efectos } : {})
    };
  }

  return {
    titulo: nombre,
    descripcion: `Condición o efecto activo: ${nombre}`
  };
}
