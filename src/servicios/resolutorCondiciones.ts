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

  // Buscar coincidencia en CONDICIONES_2024
  const condEncontrada = CONDICIONES_2024.find((c) => {
    const minCond = normalizar(c.nombre);
    const palabraClave = normalizar(c.nombre.split(" ")[0]);
    return minCond.includes(nombreNorm) || nombreNorm.includes(palabraClave);
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
    const minEf = normalizar(e.nombre);
    const palabraClave = normalizar(e.nombre.split(" ")[0]);
    return minEf.includes(nombreNorm) || nombreNorm.includes(palabraClave);
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
