import { z } from "zod";
import type {
  Caracteristica,
  TamanoPersonaje
} from "./index";
import type { PlantillaRasgoEspecie } from "@/constantes/rasgosDND55";

/**
 * Representación de un conjuro o truco innato otorgado por una especie o linaje.
 */
export interface ConjuroInnatoEspecie {
  hechizoId: string;
  nombreHechizo: string;
  caracteristica: Caracteristica | "elegir";
  esTruco: boolean;
  nivelRequerido?: number;
  usosGratis?: number | "ilimitado" | "bono_competencia";
  recuperacion?: "descanso_largo" | "descanso_corto" | "ninguno";
  descripcion?: string;
}

export const EsquemaConjuroInnatoEspecie = z.object({
  hechizoId: z.string(),
  nombreHechizo: z.string(),
  caracteristica: z.union([
    z.enum(["fuerza", "destreza", "constitucion", "inteligencia", "sabiduria", "carisma"]),
    z.literal("elegir")
  ]),
  esTruco: z.boolean().default(false),
  nivelRequerido: z.number().int().min(1).max(20).optional(),
  usosGratis: z.union([z.number().int().min(1), z.literal("ilimitado"), z.literal("bono_competencia")]).optional(),
  recuperacion: z.enum(["descanso_largo", "descanso_corto", "ninguno"]).optional(),
  descripcion: z.string().optional()
});

/**
 * Modificadores específicos aplicados por una subraza, linaje o legado.
 */
export interface ModificadoresSubespecie {
  velocidad?: number;
  visionOscuridad?: number;
  tamano?: TamanoPersonaje;
}

/**
 * Definición estructurada de una subraza, linaje o legado (D&D 5.5e).
 */
export interface DefinicionSubespecie {
  id: string;
  especiePadre: string;
  nombre: string;
  descripcion: string;
  rasgos: PlantillaRasgoEspecie[];
  modificadores?: ModificadoresSubespecie;
  conjurosInnatos?: ConjuroInnatoEspecie[];
  resistenciasDanio?: string[];
}

/**
 * Definición estructurada de una especie/raza oficial (D&D 5.5e).
 */
export interface DefinicionEspecie {
  id: string;
  nombre: string;
  descripcion: string;
  tipoCriatura: string; // ej. "Humanoide"
  tamanoOpciones: TamanoPersonaje[]; // ej. ["Mediano"] o ["Mediano", "Pequeño"]
  tamanoPorDefecto: TamanoPersonaje;
  velocidadBase: number; // en pies, ej. 30
  visionOscuridad: number; // en pies, ej. 60 o 120 (0 si no tiene)
  rasgos: PlantillaRasgoEspecie[];
  subespecies?: DefinicionSubespecie[];
  conjurosInnatos?: ConjuroInnatoEspecie[];
  resistenciasDanio?: string[];
}

/**
 * Parámetros de selección del usuario al elegir una especie en el constructor (builder).
 */
export interface ConfiguracionEspeciePersonaje {
  especieId: string;
  subespecieId?: string;
  tamanoElegido?: TamanoPersonaje;
  caracteristicaConjuroElegida?: Caracteristica;
}

/**
 * Banderas opcionales para controlar qué aspectos del personaje son sobrescritos al aplicar una especie.
 */
export interface OpcionesAplicarEspecie {
  sobrescribirVelocidad?: boolean;
  sobrescribirTamano?: boolean;
  sobrescribirSentidos?: boolean;
  sincronizarRasgos?: boolean;
  sincronizarHechizosInnatos?: boolean;
}
