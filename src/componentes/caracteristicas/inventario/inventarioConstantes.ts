import React from "react";
import type {
  CriterioOrdenMochila,
  SubseccionMochilaTipo
} from "@/tipos";
import type { OpcionDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import {
  Backpack,
  Sparkles,
  Box,
  Package,
  Swords
} from "lucide-react";

export interface CajaMovilizacionRapida {
  id: string;
  titulo: string;
  subtitulo: string;
  icono: React.ReactNode;
}

export interface ContenedorEspecialConfig {
  id: "bolsa_contencion" | "montura" | "almacen";
  titulo: string;
  icono: React.ReactNode;
  color: string;
}

export type {
  CriterioOrdenMochila,
  SubseccionMochilaTipo
};

export const OPCIONES_ORDEN_MOCHILA: OpcionDesplegable<CriterioOrdenMochila>[] = [
  { valor: "tipo", etiqueta: "Por Tipo (Secciones)" },
  { valor: "personalizado", etiqueta: "Personalizado (Libre)" },
  { valor: "reciente", etiqueta: "Último Agregado" },
  { valor: "peso-desc", etiqueta: "Mayor Peso" },
  { valor: "peso-asc", etiqueta: "Menor Peso" },
  { valor: "nombre-asc", etiqueta: "Nombre (A - Z)" },
  { valor: "valor-desc", etiqueta: "Mayor Valor" }
];

export const CAJAS_MOVILIZACION_RAPIDA: CajaMovilizacionRapida[] = [
  {
    id: "mochila",
    titulo: "Mochila",
    subtitulo: "Carga directa",
    icono: React.createElement(Backpack, { size: 13, color: "var(--pj-texto-oro)" })
  },
  {
    id: "bolsa_contencion",
    titulo: "Bolsa Contención",
    subtitulo: "0 lb carga",
    icono: React.createElement(Sparkles, { size: 13, color: "var(--pj-texto-magia)" })
  },
  {
    id: "montura",
    titulo: "Montura / Carreta",
    subtitulo: "0 lb carga",
    icono: React.createElement(Box, { size: 13, color: "var(--pj-texto-cian)" })
  },
  {
    id: "almacen",
    titulo: "Almacén / Base",
    subtitulo: "0 lb carga",
    icono: React.createElement(Package, { size: 13, color: "var(--pj-texto-terciario)" })
  },
  {
    id: "equipados",
    titulo: "Equipar",
    subtitulo: "Armas / Armadura",
    icono: React.createElement(Swords, { size: 13, color: "var(--pj-texto-cian)" })
  }
];

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
