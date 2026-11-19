import type { PersonajeJugador } from "@/tipos";
import { SelectorDesplegable } from "@/componentes/comunes";
import { clasesGestionadasConjuros } from "@/servicios/rasgos/listasConjurosRasgos";

export interface SelectorClaseConjurosProps {
  personaje?: PersonajeJugador | null;
  valor: string;
  alCambiar: (valor: string) => void;
  id?: string;
  className?: string;
}

/** El jugador identifica la clase que aprende el conjuro cuando hay varias listas. */
export function SelectorClaseConjuros({ personaje, valor, alCambiar, id, className }: SelectorClaseConjurosProps) {
  if (!personaje || personaje.clasesLanzadoras.length < 2 || !clasesGestionadasConjuros(personaje).length) return null;
  return (
    <SelectorDesplegable
      id={id}
      className={className}
      tamano="compacto"
      titulo="Clase que aprende el conjuro"
      placeholder="Elige clase..."
      valor={valor}
      alCambiar={alCambiar}
      opciones={personaje.clasesLanzadoras.map((c) => ({ valor: c.clase, etiqueta: c.clase }))}
    />
  );
}
