import type { PersonajeJugador, Caracteristica, HechizoBase } from "@/tipos";
import type { PenalizacionArmadura } from "@/almacen/selectores/usarEstadoPersonajes";
import type { SolicitudLanzamiento } from "@/servicios/servicioLanzamientoConjuros";

export interface CabeceraYRecursosMagicosProps {
  personaje: PersonajeJugador;
  baseDatosHechizos: HechizoBase[];
  sistemaMagia: "espacios" | "puntos";
  penalizacionArmadura?: PenalizacionArmadura;
  estaBloqueadoPorArmadura: boolean;
  motivoBloqueoArmadura?: string;
  alRomperConcentracion: () => void;
  etiquetaHabilidad: string;
  modHabilidad: number;
  cdConjuros: number;
  bonoAtaqueMagico: number;
  manejarTiradaAtaqueMagico: () => void;
  conteoEfectivo: { libres: number; subclase: number; trucosLibres: number; trucosSubclase: number };
  maximos: { maxConjuros: number; maxTrucos: number; modelo?: "ninguno" | "conocidos" | "preparados" | "grimorio" };
  alAbrirConfiguracion?: () => void;
  alAbrirCompendio: () => void;
  esLanzadorPacto: boolean;
  nivelEspacioPacto: number;
  nivelesArcanoDisponibles: number[];
  alGastarEspacio: (nivel: number) => void;
  alRecuperarEspacio: (nivel: number) => void;
  alRecuperarTodosEspacios: () => void;
  alGastarPuntos: (cantidad: number) => void;
  alRecuperarPuntos: (cantidad: number) => void;
  alRecuperarTodosPuntos: () => void;
  alGastarEspacioPacto?: () => void;
  alRecuperarEspaciosPacto?: () => void;
  asignarArcanoMistico: (personajeId: string, nivel: number, hechizoId: string) => void;
  quitarArcanoMistico: (personajeId: string, nivel: number) => void;
  gastarArcanoMistico: (personajeId: string, nivel: number) => void;
  recuperarArcanoMistico: (personajeId: string, nivel: number) => void;
  alAbrirFichaHechizo: (hechizo: HechizoBase) => void;
  alLanzarArcano: (solicitud: SolicitudLanzamiento) => Promise<boolean | void>;
}

export interface PanelConjurosPersonajeProps {
  personaje: PersonajeJugador;
  bonoCompetencia: number;
  modificadores: Record<Caracteristica, number>;
  baseDatosHechizos: HechizoBase[];
  sistemaMagia: "espacios" | "puntos";
  penalizacionArmadura?: PenalizacionArmadura;
  alAbrirConfiguracion?: () => void;
  alGastarEspacio: (nivel: number) => void;
  alRecuperarEspacio: (nivel: number) => void;
  alRecuperarTodosEspacios: () => void;
  alGastarPuntos: (cantidad: number) => void;
  alRecuperarPuntos: (cantidad: number) => void;
  alRecuperarTodosPuntos: () => void;
  alGastarEspacioPacto?: () => void;
  alRecuperarEspaciosPacto?: () => void;
  alEstablecerConcentracion: (id: string, nombre: string) => void;
  alRomperConcentracion: () => void;
  alQuitarTruco: (hechizoId: string) => void;
  alQuitarConjuro: (hechizoId: string) => void;
  alAlternarPreparado: (hechizoId: string) => void;
}
