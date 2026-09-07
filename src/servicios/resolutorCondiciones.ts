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
      descripcion: "Vistes armadura o portas escudo sin entrenamiento.",
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
      descripcion: "La armadura corporal equipada es pesada o ruidosa.",
      efectos: [
        "La armadura corporal equipada impone Desventaja automática en todas las pruebas de Sigilo (Destreza)."
      ]
    };
  }

  // 2. Condición específica Furia de los Dioses (Senda del Fanático Nv 14)
  if (nombreNorm.includes("furia de los dioses") || nombreNorm.includes("rage of the gods")) {
    return {
      titulo: "Furia de los Dioses (Rage of the Gods)",
      descripcion: "Forma de guerrero divino (1 min / 10 turnos): Velocidad de vuelo con flotación, resistencia a daño necrótico, psíquico y radiante, y revivificación de aliados.",
      efectos: [
        "Vuelo: Tienes una velocidad volando igual a tu velocidad de movimiento y puedes flotar.",
        "Resistencias Divinas: Tienes resistencia al daño Necrótico, Psíquico y Radiante.",
        "Revivificación (Reacción): Si un aliado a 30 pies fuera a caer a 0 HP, gastas 1 uso de Furia y sus HP se vuelven iguales a tu nivel de bárbaro."
      ]
    };
  }

  // Manto de Majestad (Colegio del Glamour Nv 6)
  if (nombreNorm.includes("manto de majestad") || nombreNorm.includes("mantle of majesty")) {
    return {
      titulo: "Manto de Majestad (Mantle of Majesty)",
      descripcion: "Adoptas una apariencia mágica sobrenatural durante 1 minuto (10 turnos) o hasta que pierdas la concentración.",
      efectos: [
        "Orden imperiosa gratuita: Puedes lanzar Orden imperiosa como acción adicional sin gastar un espacio de conjuro.",
        "Fallo automático: Cualquier criatura Hechizada por ti falla automáticamente su tirada de salvación contra la Orden imperiosa que lances.",
        "Concentración: Requiere mantener concentración activa durante su duración."
      ]
    };
  }

  // Majestad Inquebrantable (Colegio del Glamour Nv 14)
  if (nombreNorm.includes("majestad inquebrantable") || nombreNorm.includes("unbreakable majesty")) {
    return {
      titulo: "Majestad Inquebrantable (Unbreakable Majesty)",
      descripcion: "Asumes una presencia mágicamente majestuosa durante 1 minuto (10 turnos) o hasta quedar incapacitado.",
      efectos: [
        "Protección regia: Cuando una criatura te impacta por primera vez en un turno, debe superar una salvación de Carisma contra tu CD de conjuros.",
        "Desvío de impacto: Si el atacante falla la salvación, el ataque falla automáticamente y retrocede ante tu majestad."
      ]
    };
  }

  // 3. Buscar coincidencia exacta en EFECTOS_PREDEFINIDOS
  const efectoExacto = EFECTOS_PREDEFINIDOS.find((e) => {
    const minEf = normalizar(e.nombre);
    return minEf === nombreNorm || normalizar(e.nombre.split(" (")[0]) === normalizar(nombre.split(" (")[0]);
  });

  if (efectoExacto) {
    return {
      titulo: efectoExacto.nombre,
      descripcion: efectoExacto.descripcion
    };
  }

  // 4. Buscar coincidencia en CONDICIONES_2024
  const condExacta = CONDICIONES_2024.find((c) => {
    const minCond = normalizar(c.nombre);
    return minCond === nombreNorm || normalizar(c.nombre.split(" (")[0]) === normalizar(nombre.split(" (")[0]);
  });

  if (condExacta) {
    return {
      titulo: condExacta.nombre,
      descripcion: condExacta.descripcion,
      efectos: condExacta.efectos
    };
  }

  // 5. Fallback por coincidencia más larga en EFECTOS_PREDEFINIDOS
  const candidatosEfectos = EFECTOS_PREDEFINIDOS.filter((e) => {
    const minEf = normalizar(e.nombre);
    return minEf.includes(nombreNorm) || nombreNorm.includes(minEf);
  });

  if (candidatosEfectos.length > 0) {
    const mejor = candidatosEfectos.sort((a, b) => b.nombre.length - a.nombre.length)[0];
    return {
      titulo: mejor.nombre,
      descripcion: mejor.descripcion
    };
  }

  return {
    titulo: nombre,
    descripcion: `Condición o efecto activo: ${nombre}`
  };
}
