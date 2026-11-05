import type { ObjetoInventario } from "./personaje";

export type CriterioOrdenMochila =
  | "tipo"
  | "personalizado"
  | "reciente"
  | "peso-desc"
  | "peso-asc"
  | "nombre-asc"
  | "valor-desc";

export interface SubseccionMochilaTipo {
  id: string;
  titulo: string;
  tipoIcono?: string;
  color: string;
  items: ObjetoInventario[];
  pesoTotal: number;
  esContenedorEspecial: boolean;
}
