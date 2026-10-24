import type { PersonajeJugador } from "@/tipos";
import { SelectorDesplegable } from "@/componentes/comunes";
import { clasesGestionadasConjuros } from "@/servicios/rasgos/listasConjurosRasgos";

/** El jugador identifica la clase que aprende el conjuro cuando hay varias listas. */
export function SelectorClaseConjuros({ personaje, valor, alCambiar }: {
  personaje?: PersonajeJugador | null; valor: string; alCambiar: (valor: string) => void;
}) {
  if (!personaje || personaje.clasesLanzadoras.length < 2 || !clasesGestionadasConjuros(personaje).length) return null;
  return <SelectorDesplegable titulo="Clase que aprende el conjuro" placeholder="Elige la clase que aprende el conjuro"
    valor={valor} alCambiar={alCambiar} enFlujo opciones={personaje.clasesLanzadoras.map(c => ({ valor: c.clase, etiqueta: c.clase }))} />;
}
