import type { PersonajeJugador, RasgoPersonaje, OrigenRasgo } from "@/tipos";
export interface ConstructorRasgoDoteProps {
    personaje: PersonajeJugador;
    rasgoInicial?: RasgoPersonaje | null;
    origenPredeterminado?: OrigenRasgo;
    alGuardar: (rasgo: RasgoPersonaje, rasgosAdicionales?: RasgoPersonaje[]) => void;
    alVolver: () => void;
}
