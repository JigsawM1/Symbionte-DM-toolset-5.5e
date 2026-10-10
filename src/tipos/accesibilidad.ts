/**
 * Contratos de tipo e interfaces para el sistema de accesibilidad y personalización visual.
 * Diseñado conforme a las pautas WCAG 2.2 AA/AAA y rendimiento offline para TaleSpire CEF.
 */

export type EscalaFuente = "compacta" | "normal" | "grande" | "muy-grande";

export type FamiliaFuente = "estandar" | "dislexia" | "mono" | "serif";

export type ModoContraste = "estandar" | "alto";

export type ModoDaltonismo = "ninguno" | "protanopia" | "deuteranopia" | "tritanopia";

export type ColorAcento = "arcano" | "cian" | "oro" | "esmeralda" | "alerta";

export interface ConfiguracionAccesibilidad {
  escalaFuente: EscalaFuente;
  factorEscala: number;
  familiaFuente: FamiliaFuente;
  modoContraste: ModoContraste;
  modoDaltonismo: ModoDaltonismo;
  colorAcento: ColorAcento;
  focoAumentado: boolean;
  subrayarEnlaces: boolean;
  espaciadoLectura: boolean;
}

export const CONFIGURACION_ACCESIBILIDAD_POR_DEFECTO: ConfiguracionAccesibilidad = {
  escalaFuente: "normal",
  factorEscala: 1.0,
  familiaFuente: "estandar",
  modoContraste: "estandar",
  modoDaltonismo: "ninguno",
  colorAcento: "arcano",
  focoAumentado: false,
  subrayarEnlaces: false,
  espaciadoLectura: false
};

