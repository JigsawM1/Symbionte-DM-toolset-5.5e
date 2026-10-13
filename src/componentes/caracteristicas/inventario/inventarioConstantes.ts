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
    color: "var(--pj-texto-oro)",
    icono: React.createElement(Backpack, { size: 13, color: "var(--pj-texto-oro)" })
  },
  {
    id: "bolsa_contencion",
    titulo: "Bolsa Contención",
    subtitulo: "0 lb carga",
    color: "var(--pj-texto-magia)",
    icono: React.createElement(Sparkles, { size: 13, color: "var(--pj-texto-magia)" })
  },
  {
    id: "montura",
    titulo: "Montura / Carreta",
    subtitulo: "0 lb carga",
    color: "var(--pj-texto-cian)",
    icono: React.createElement(Box, { size: 13, color: "var(--pj-texto-cian)" })
  },
  {
    id: "almacen",
    titulo: "Almacén / Base",
    subtitulo: "0 lb carga",
    color: "var(--pj-texto-terciario)",
    icono: React.createElement(Package, { size: 13, color: "var(--pj-texto-terciario)" })
  },
  {
    id: "equipados",
    titulo: "Equipar",
    subtitulo: "Armas / Armadura",
    color: "var(--pj-texto-cian)",
    icono: React.createElement(Swords, { size: 13, color: "var(--pj-texto-cian)" })
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
    icono: React.createElement(Sparkles, { size: 14, color: "var(--pj-texto-magia)" }),
    color: "var(--pj-texto-magia)"
  },
  {
    id: "montura",
    titulo: "Montura / Carreta / Alforjas",
    icono: React.createElement(Box, { size: 14, color: "var(--pj-texto-cian)" }),
    color: "var(--pj-texto-cian)"
  },
  {
    id: "almacen",
    titulo: "Almacén / Base / Campamento",
    icono: React.createElement(Package, { size: 14, color: "var(--pj-texto-terciario)" }),
    color: "var(--pj-texto-terciario)"
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
