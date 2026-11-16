import type {
  Caracteristica,
  ModeloConjuros,
  TipoLanzador
} from "@/tipos";

/**
 * Estrategia declarativa de progresión mágica según el tipo de lanzador (D&D 5.5e).
 */
export interface EstrategiaProgresionLanzador {
  readonly tipo: TipoLanzador;
  readonly otorgaTrucosPorDefecto: (nivelClase: number) => boolean;
  readonly calcularNivelEnMonoclase: (nivelClase: number) => number;
  readonly calcularNivelEfectivoRanurasMonoclase: (nivelClase: number) => number;
  readonly calcularAporteEnMulticlase: (nivelClase: number) => number;
  readonly obtenerNivelMaximoConjuro: (nivelClase: number) => number;
}

export interface BonosExtraOrigenMagia {
  readonly bonoExtraCD?: number;
  readonly bonoExtraAtaque?: number;
}

/**
 * Origen de magia procedente de una clase o subclase lanzadora.
 */
export interface OrigenMagiaClase extends BonosExtraOrigenMagia {
  readonly tipo: "clase";
  readonly clase: string;
  readonly subclase?: string;
  readonly habilidadExplicita?: Caracteristica;
}

/**
 * Origen de magia procedente de una dote (ej. Iniciado en la Magia, Telequinético).
 */
export interface OrigenMagiaDote extends BonosExtraOrigenMagia {
  readonly tipo: "dote";
  readonly nombreDote?: string;
  readonly habilidadConjuro: Caracteristica;
}

/**
 * Origen de magia innata procedente de una especie, subespecie o linaje.
 */
export interface OrigenMagiaEspecie extends BonosExtraOrigenMagia {
  readonly tipo: "especie";
  readonly nombreEspecie?: string;
  readonly habilidadConjuro: Caracteristica;
}

/**
 * Origen de magia procedente de un objeto mágico con CD/ataque fijo o respaldado por el portador.
 */
export interface OrigenMagiaObjeto extends BonosExtraOrigenMagia {
  readonly tipo: "objeto";
  readonly nombreObjeto?: string;
  readonly cdFija?: number;
  readonly bonoAtaqueFijo?: number;
  readonly habilidadRespaldo?: Caracteristica;
}

/**
 * Unión discriminada para resolver estadísticas mágicas según la fuente real del conjuro.
 */
export type ContextoOrigenMagia =
  | OrigenMagiaClase
  | OrigenMagiaDote
  | OrigenMagiaEspecie
  | OrigenMagiaObjeto;

/**
 * Resultado inmutable del cálculo de CD, bono de ataque y aptitud mágica por origen.
 */
export interface EstadisticasMagicasResueltas {
  readonly origen: ContextoOrigenMagia["tipo"];
  readonly habilidad: Caracteristica;
  readonly modificadorHabilidad: number;
  readonly bonoCompetencia: number;
  readonly cdConjuros: number;
  readonly bonoAtaqueConjuro: number;
}

export interface ConfiguracionLanzadorDetectada {
  readonly tipo: TipoLanzador;
  readonly habilidad: Caracteristica;
  readonly modelo: ModeloConjuros;
  readonly listaConjuros?: string;
}

export interface ResumenMaximosMagia {
  readonly maxTrucos: number;
  readonly maxConjuros: number;
  readonly modelo: ModeloConjuros;
}

export interface InfoEspaciosPacto {
  readonly espacios: number;
  readonly nivel: number;
}

export interface RecursosMagicosUnificados {
  readonly espaciosConjuroMaximos: Record<string, number>;
  readonly puntosConjuroMaximos: number;
  readonly nivelConjuroMaximo: number;
  readonly espaciosPactoMaximos: number;
  readonly nivelEspacioPacto: number;
}

export interface OpcionNivelLanzamiento {
  readonly nivel: number;
  readonly etiqueta: string;
  readonly tipo: "estandar" | "pacto";
}

export interface ParametrosOpcionesLanzamiento {
  readonly nivelHechizo: number;
  readonly espaciosConjuroMaximos?: Record<string, number> | Record<number, number>;
  readonly nivelConjuroMaximo?: number;
  readonly sistemaMagia?: "espacios" | "puntos";
  readonly esLanzadorPacto?: boolean;
  readonly nivelEspacioPacto?: number;
  readonly espaciosPactoMaximos?: number;
  readonly permitirUpcastLibre?: boolean;
}

export interface ParametrosGastoConjuro {
  readonly nivelLanzamiento: number;
  readonly esLanzadorPacto?: boolean;
  readonly nivelEspacioPacto?: number;
  readonly espaciosPactoMaximos?: number;
  readonly espaciosPactoGastados?: number;
  readonly espaciosConjuroMaximos?: Record<string, number> | Record<number, number>;
  readonly sistemaMagia?: "espacios" | "puntos";
  readonly costePuntosPorNivel?: Record<number, number>;
  readonly alGastarEspacio?: (nivel: number) => void;
  readonly alGastarPuntos?: (cantidad: number) => void;
  readonly alGastarEspacioPacto?: () => void;
}

export interface ResultadoGastoConjuro {
  readonly recursoGastado: "pacto" | "espacio" | "puntos" | "ninguno";
  readonly nivel?: number;
  readonly puntos?: number;
}

export interface ConjurosSubclaseResultado {
  readonly conjuros: string[];
  readonly trucos: string[];
}

export interface ConteoPreparadosEfectivos {
  readonly libres: number;
  readonly subclase: number;
  readonly total: number;
}

export interface PerfilClaseLanzadoraNormalizado {
  readonly nombreNorm: string;
  readonly listaNorm: string;
  readonly niveles: Set<number>;
}

export interface PerfilClaseBaseNormalizado {
  readonly nombreNorm: string;
  readonly subNorm: string;
  readonly listaSubNorm: string;
  readonly niveles: Set<number>;
}

export interface PerfilLanzadorPersonaje {
  readonly esLanzador: boolean;
  readonly trucosConocidos: string[];
  readonly nivelesGenerales: Set<number>;
  readonly clasesPersonajeNorm: string[];
  readonly clasesLanzadoras: PerfilClaseLanzadoraNormalizado[];
  readonly clasesBase: PerfilClaseBaseNormalizado[];
  readonly clasePrincipal?: PerfilClaseLanzadoraNormalizado;
  readonly overrideEspacios?: Record<string, number> | null;
  readonly espaciosMaximos?: Record<string, number>;
  readonly esMonoClase: boolean;
}
