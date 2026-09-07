import React from "react";
import type { ObjetoInventario } from "@/tipos";
import type { OpcionDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import {
  Backpack,
  Sparkles,
  Box,
  Package,
  Swords
} from "lucide-react";

export type CriterioOrdenMochila =
  | "tipo"
  | "personalizado"
  | "reciente"
  | "peso-desc"
  | "peso-asc"
  | "nombre-asc"
  | "valor-desc";

export const OPCIONES_ORDEN_MOCHILA: OpcionDesplegable<CriterioOrdenMochila>[] = [
  { valor: "tipo", etiqueta: "Por Tipo (Secciones)" },
  { valor: "personalizado", etiqueta: "Personalizado (Libre)" },
  { valor: "reciente", etiqueta: "Último Agregado" },
  { valor: "peso-desc", etiqueta: "Mayor Peso" },
  { valor: "peso-asc", etiqueta: "Menor Peso" },
  { valor: "nombre-asc", etiqueta: "Nombre (A - Z)" },
  { valor: "valor-desc", etiqueta: "Mayor Valor" }
];

export interface CajaMovilizacionRapida {
  id: string;
  titulo: string;
  subtitulo: string;
  color: string;
  icono: React.ReactNode;
}

export const CAJAS_MOVILIZACION_RAPIDA: CajaMovilizacionRapida[] = [
  {
    id: "mochila",
    titulo: "Mochila",
    subtitulo: "Carga directa",
    color: "#f59e0b",
    icono: React.createElement(Backpack, { size: 13, color: "#f59e0b" })
  },
  {
    id: "bolsa_contencion",
    titulo: "Bolsa Contención",
    subtitulo: "0 lb carga",
    color: "#c084fc",
    icono: React.createElement(Sparkles, { size: 13, color: "#c084fc" })
  },
  {
    id: "montura",
    titulo: "Montura / Carreta",
    subtitulo: "0 lb carga",
    color: "#38bdf8",
    icono: React.createElement(Box, { size: 13, color: "#38bdf8" })
  },
  {
    id: "almacen",
    titulo: "Almacén / Base",
    subtitulo: "0 lb carga",
    color: "#94a3b8",
    icono: React.createElement(Package, { size: 13, color: "#94a3b8" })
  },
  {
    id: "equipados",
    titulo: "Equipar",
    subtitulo: "Armas / Armadura",
    color: "#60a5fa",
    icono: React.createElement(Swords, { size: 13, color: "#60a5fa" })
  }
];

export interface ContenedorEspecialConfig {
  id: "bolsa_contencion" | "montura" | "almacen";
  titulo: string;
  icono: React.ReactNode;
  color: string;
}

export const CONTENEDORES_ESPECIALES_CONFIG: ContenedorEspecialConfig[] = [
  {
    id: "bolsa_contencion",
    titulo: "Bolsa de Contención (Bag of Holding)",
    icono: React.createElement(Sparkles, { size: 14, color: "#c084fc" }),
    color: "#c084fc"
  },
  {
    id: "montura",
    titulo: "Montura / Carreta / Alforjas",
    icono: React.createElement(Box, { size: 14, color: "#38bdf8" }),
    color: "#38bdf8"
  },
  {
    id: "almacen",
    titulo: "Almacén / Base / Campamento",
    icono: React.createElement(Package, { size: 14, color: "#94a3b8" }),
    color: "#94a3b8"
  }
];

export interface SubseccionMochilaTipo {
  id: string;
  titulo: string;
  icono: React.ReactNode;
  color: string;
  items: ObjetoInventario[];
  pesoTotal: number;
  esContenedorEspecial: boolean;
}
