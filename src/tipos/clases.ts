import type {
  Caracteristica,
  Habilidad,
  TipoLanzador,
  ModeloConjuros,
  RasgoPersonaje,
  EfectoMecanicoRasgo
} from "./index";
import type { PlantillaRasgoClase } from "@/constantes/rasgosDND55";

/**
 * Progresión de conjuros o trucos otorgados por nivel de clase.
 */
export interface ProgresionConjurosNivel {
  nivelClase: number;
  conjuros?: string[];
  trucos?: string[];
}

/**
 * Configuración mágica de una clase o subclase lanzadora.
 */
export interface ConfiguracionMagicaClase {
  tipoLanzador: TipoLanzador;
  habilidadConjuro: Caracteristica;
  modeloConjuros: ModeloConjuros;
  nivelInicio: number;
}

/**
 * Definición completa y estructurada de una subclase oficial (D&D 5.5e).
 */
export interface DefinicionSubclase {
  id: string;
  clasePadre: string;
  nombre: string;
  descripcion: string;
  lema?: string;
  nivelDesbloqueo: number;
  rasgos: PlantillaRasgoClase[];
  progresionConjuros?: ProgresionConjurosNivel[];
  variantesConjuros?: Record<string, ProgresionConjurosNivel[]>;
  configuracionMagica?: ConfiguracionMagicaClase;
}

/**
 * Definición completa y estructurada de una clase oficial (D&D 5.5e).
 */
export interface DefinicionClase {
  id: string;
  nombre: string;
  descripcion: string;
  dadoGolpe: "d6" | "d8" | "d10" | "d12";
  caracteristicasPrimarias: Caracteristica[];
  salvacionesCompetentes: Caracteristica[];
  competenciasArmaduras: string[];
  competenciasArmas: string[];
  competenciasHerramientas?: string[];
  opcionesHabilidades: {
    cantidad: number;
    opciones: Habilidad[];
  };
  equipoInicial: {
    descripcion: string;
    opcionA: string;
    opcionB: string;
  };
  configuracionMagica?: ConfiguracionMagicaClase;
  rasgos: PlantillaRasgoClase[];
  subclases: DefinicionSubclase[];
}

/**
 * Opciones para la aplicación automática de una build de clase al personaje.
 */
export interface OpcionesAplicarBuild {
  sobrescribirDadoGolpe?: boolean;
  sobrescribirSalvaciones?: boolean;
  sobrescribirCompetenciasEquipo?: boolean;
  sobrescribirConfiguracionMagia?: boolean;
  sincronizarRasgos?: boolean;
  sincronizarConjurosSubclase?: boolean;
}

/**
 * Resultado estructurado de calcular la build de una clase y subclase a un nivel específico.
 */
export interface BuildClaseCalculada {
  clase: DefinicionClase;
  subclase?: DefinicionSubclase;
  nivel: number;
  dadoGolpe: "d6" | "d8" | "d10" | "d12";
  salvacionesCompetentes: Caracteristica[];
  competenciasArmaduras: string[];
  competenciasArmas: string[];
  competenciasHerramientas: string[];
  rasgos: RasgoPersonaje[];
  configuracionMagica?: ConfiguracionMagicaClase;
  conjurosSiemprePreparados: string[];
  trucosOtorgados: string[];
  efectosActivosResueltos?: EfectoMecanicoRasgo[];
}
