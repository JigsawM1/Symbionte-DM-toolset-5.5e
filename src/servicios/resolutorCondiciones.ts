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

  // 1. Casos específicos de penalizaciones de equipo D&D 5.5e
  if (nombreNorm.includes("sin competencia") || nombreNorm.includes("incompetencia")) {
    return {
      titulo: "Armadura sin Competencia",
      descripcion: "Reglas Oficiales D&D 5.5e (2024): Vistes armadura o portas escudo sin entrenamiento.",
      efectos: [
        "Desventaja en cualquier tirada de ataque que use Fuerza o Destreza.",
        "Desventaja en pruebas de característica y tiradas de salvación de Fuerza y Destreza.",
        "Incapacidad total para lanzar conjuros y realizar rituales."
      ]
    };
  }

  if (nombreNorm.includes("desventaja en sigilo") || nombreNorm.includes("sigilo ruidoso")) {
    return {
      titulo: "Desventaja en Sigilo (Armadura)",
      descripcion: "Reglas Oficiales D&D 5.5e (2024): La armadura corporal equipada es pesada o ruidosa.",
      efectos: [
        "La armadura corporal equipada impone Desventaja automática en todas las pruebas de Sigilo (Destreza)."
      ]
    };
  }

  // 2. Buscar coincidencia en EFECTOS_PREDEFINIDOS (como Desangrándose, Bendecir, etc.)
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

  // 3. Buscar coincidencia en CONDICIONES_2024
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

  return {
    titulo: nombre,
    descripcion: `Condición o efecto activo: ${nombre}`
  };
}
