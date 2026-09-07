import type { Caracteristica } from "./index";

export type TipoAccionConsumida = "accion" | "accionAdicional" | "reaccion" | "especial";

export interface AtaquePersonajeCalculado {
  id: string;
  nombre: string;
  tipo: "Arma" | "Desarmado" | "Conjuro" | "Habilidad";
  subtipo?: string;
  tipoAccion: TipoAccionConsumida;
  caracteristicaUsada: Caracteristica;
  bonoAtaque: number;
  dadoDano: string;
  dadoDanoBase: string; // ej. "1d8" o "1"
  modificadorDano: number;
  esDanoFijo: boolean; // Si true, no tira dados de daño
  danoVersatil?: string;
  dadoVersatilBase?: string;
  tipoDano: string;
  alcance?: string;
  propiedades: string[];
  maestria?: string;
  esMagico?: boolean;
  notas?: string;
  tieneTiradaAtaque: boolean;
  cdSalvacion?: number;
  tipoSalvacion?: string;
  requiereMunicion?: boolean;
  municionNombre?: string;
  municionCantidad?: number;
  nombreContenedor?: string;
  tieneContenedor?: boolean;
  municionEnContenedor?: number;
  municionSueltEnMochila?: number;
  municionEnCompartimentosExternos?: number;
  puedeDisparar?: boolean;
  motivoBloqueo?: string;
  esCompetenteConArma?: boolean;
  esSutil?: boolean;
  esDistancia?: boolean;
}

export interface ConsumibleAccionCalculado {
  idInstancia: string;
  nombre: string;
  cantidad: number;
  tipoAccion: TipoAccionConsumida;
  esPocion: boolean;
  esCurativo: boolean;
  formulaCuracion?: string;
  descripcionUso: string;
  notas?: string;
}
