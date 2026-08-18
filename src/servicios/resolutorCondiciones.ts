import { CONDICIONES_2024, EFECTOS_PREDEFINIDOS } from "@/utiles/datosIniciales";

export interface DetalleCondicionOEfecto {
  titulo: string;
  descripcion: string;
  efectos?: string[];
}

/**
 * Servicio encargado de buscar y estructurar los detalles y efectos mecánicos
 * de cualquier condición o efecto activo para su visualización en tooltips o paneles.
 */
export function obtenerDetalleCondicion(nombre: string): DetalleCondicionOEfecto {
  if (!nombre) {
    return { titulo: "Efecto Desconocido", descripcion: "Sin información adicional." };
  }

  const nombreLimpio = nombre.trim().toLowerCase();

  // Buscar coincidencia en CONDICIONES_2024
  const condEncontrada = CONDICIONES_2024.find((c) => {
    const minCond = c.nombre.toLowerCase();
    const palabraClave = c.nombre.split(" ")[0].toLowerCase();
    return minCond.includes(nombreLimpio) || nombreLimpio.includes(palabraClave);
  });

  if (condEncontrada) {
    return {
      titulo: condEncontrada.nombre,
      descripcion: condEncontrada.descripcion,
      efectos: condEncontrada.efectos
    };
  }

  // Buscar coincidencia en EFECTOS_PREDEFINIDOS
  const efectoEncontrado = EFECTOS_PREDEFINIDOS.find((e) => {
    const minEf = e.nombre.toLowerCase();
    const palabraClave = e.nombre.split(" ")[0].toLowerCase();
    return minEf.includes(nombreLimpio) || nombreLimpio.includes(palabraClave);
  });

  if (efectoEncontrado) {
    return {
      titulo: efectoEncontrado.nombre,
      descripcion: efectoEncontrado.descripcion
    };
  }

  return {
    titulo: nombre,
    descripcion: `Condición o efecto activo: ${nombre}`
  };
}
