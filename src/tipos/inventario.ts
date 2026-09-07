import type { ReactNode } from "react";
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
  icono: ReactNode;
  color: string;
  items: ObjetoInventario[];
  pesoTotal: number;
  esContenedorEspecial: boolean;
}

export interface CajaMovilizacionRapida {
  id: string;
  titulo: string;
  subtitulo: string;
  color: string;
  icono: ReactNode;
}

export interface ContenedorEspecialConfig {
  id: "bolsa_contencion" | "montura" | "almacen";
  titulo: string;
  icono: ReactNode;
  color: string;
}
