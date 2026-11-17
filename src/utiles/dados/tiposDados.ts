/**
 * Contratos de dominio y puertos de inversión de dependencias para el sistema de tiradas 3D.
 */

/** Modo efectivo de una tirada d20 según reglas D&D 5.5e. */
export type ModoTiradaD20 = "ventaja" | "desventaja" | "plano";

/** Metadatos asociados a una tirada con ventaja o desventaja en TaleSpire. */
export interface MetadataTiradaEspecial {
  tipo: "ventaja" | "desventaja";
  etiquetaOriginal: string;
  nombreGrupoOriginal: string;
  grupoAName: string;
  grupoBName: string;
  grupoBonificacionName?: string;
  creadoEn?: number;
}

/** Metadatos de una tirada de iniciativa para actualizar o incorporar un combatiente. */
export interface MetadataIniciativa {
  tipo: "iniciativa";
  criaturaId: string;
  nombrePersonaje?: string;
  idMiniaturaTS?: string | null;
  idPersonaje?: string;
  idAcompanante?: string;
  creadoEn?: number;
}

/** Metadatos de una tirada de salvación contra la muerte. */
export interface MetadataSalvacionMuerte {
  tipo: "salvacionMuerte";
  personajeId: string;
  creadoEn?: number;
}

/** Metadatos de una tirada de curación originada por un rasgo. */
export interface MetadataCuracionRasgo {
  tipo: "curacionRasgo";
  personajeId: string;
  rasgoId?: string;
  nombreRasgo?: string;
  cantidadDadosGastados?: number;
  creadoEn?: number;
}

/** Metadatos de una tirada de Puntos de Golpe Temporales originada por un rasgo. */
export interface MetadataHpTemporalRasgo {
  tipo: "hpTemporalRasgo";
  personajeId: string;
  rasgoId?: string;
  nombreRasgo?: string;
  multiplicador?: number;
  creadoEn?: number;
}

/** Metadatos de una tirada de Dado de Golpe del personaje. */
export interface MetadataDadoGolpe {
  tipo: "dadoGolpe";
  personajeId: string;
  nombrePersonaje?: string;
  tipoDado?: string;
  creadoEn?: number;
}

/** Unión discriminada de metadatos de rasgos especiales de vitalidad. */
export type MetadataEspecialRasgo = MetadataCuracionRasgo | MetadataHpTemporalRasgo;

/** Unión discriminada de todos los efectos de dominio aplicables tras una tirada. */
export type MetadataEfectoTirada =
  | MetadataIniciativa
  | MetadataSalvacionMuerte
  | MetadataCuracionRasgo
  | MetadataHpTemporalRasgo
  | MetadataDadoGolpe;

/** Descriptor de grupo para solicitudes asíncronas de tirada estructurada. */
export interface GrupoTiradaSolicitud {
  nombre: string;
  formula: string;
}

/** Opciones de configuración para `solicitarResultadoTirada`. */
export interface OpcionesSolicitudTirada {
  etiqueta: string;
  grupos: GrupoTiradaSolicitud[];
  mostrarResultadoEnChat?: boolean;
  signal?: AbortSignal;
  azarLocal?: () => number;
}

/** Resultado resuelto de una solicitud de tirada estructurada. */
export interface ResultadoSolicitudTirada {
  rollId: string;
  origen: "talespire" | "local";
  totales: number[];
}

/** Registro interno de una promesa de tirada pendiente de respuesta de TaleSpire. */
export interface SolicitudPendiente {
  resolve: (res: ResultadoSolicitudTirada) => void;
  reject: (err: Error) => void;
  gruposNombres: string[];
  creadoEn: number;
  signal?: AbortSignal;
  onAbort?: () => void;
}

/** Payload normalizado extraído de cualquier variante de evento `rollResults` de TaleSpire. */
export interface PayloadDadosNormalizado {
  rollId: string;
  resultsGroups: unknown[];
}

/** Entrada unificada en memoria para una tirada 3D pendiente en TaleSpire. */
export interface EntradaTiradaActiva {
  creadoEn: number;
  especial?: MetadataTiradaEspecial;
  efecto?: MetadataEfectoTirada;
}

/** Resultado del procesamiento previo de una fórmula según el modo de tirada d20. */
export interface ResultadoPreparacionFormula {
  formulaProcesada: string;
  formulaLimpia: string;
  nombreEtiqueta: string;
  tiradaEspecial: MetadataTiradaEspecial | null;
}

/**
 * Puerto de efectos sobre el estado de la aplicación.
 * Permite que `src/utiles/dados/` permanezca desacoplado de `usarAlmacenDM` y evite ciclos en Rollup.
 */
export interface PuertoEfectosTiradaEstado {
  obtenerModoTiradaGlobal(): ModoTiradaD20;
  restablecerModoTiradaGlobal(): void;
  puedeGastarDadoGolpe(personajeId: string, enVuelo: number): boolean;
  aplicarCuracionDirectaRasgo(
    personajeId: string,
    cantidad: number,
    nombreRasgoNotificar?: string
  ): void;
  aplicarResultadoHpTemporal(
    personajeId: string,
    hpTemporalNuevo: number,
    nombreRasgoNotificar?: string
  ): void;
  aplicarResultadoSalvacionMuerte(personajeId: string, totalDado: number): void;
  aplicarResultadoIniciativa(infoIniciativa: MetadataIniciativa, totalIniciativa: number): void;
  gastarDadoGolpeYNotificar(personajeId: string, totalDado: number): void;
}
