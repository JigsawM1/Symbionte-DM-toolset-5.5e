import type { RasgoPersonaje } from "@/tipos";

export interface SeccionesColapsadas {
  especie: boolean;
  dotes: boolean;
  personalizados: boolean;
  [claveClase: string]: boolean;
}

export interface GrupoClaseJerarquico {
  clase: { nombre: string; subclase?: string; nivel: number };
  claveColapsoClase: string;
  claveColapsoSubclase: string;
  claveColapsoInvocaciones: string;
  rasgosBase: RasgoPersonaje[];
  rasgosSubclase: RasgoPersonaje[];
  rasgoInvocaciones?: RasgoPersonaje;
  total: number;
}

export interface DatosJerarquicosRasgos {
  especie: RasgoPersonaje[];
  dotes: RasgoPersonaje[];
  personalizados: RasgoPersonaje[];
  clases: GrupoClaseJerarquico[];
  otrosClase: RasgoPersonaje[];
}
