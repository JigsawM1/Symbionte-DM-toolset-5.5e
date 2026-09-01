/**
 * objetoConstantes.ts
 * -------------------
 * Constantes y configuraciones visuales generales para el creador y visor
 * de objetos homebrew (Rarezas, Atributos, etc.).
 *
 * NOTA: Las constantes específicas de armas, armaduras, maestrías y equipo
 * se encuentran centralizadas en `equipoConstantes.ts`.
 */

import { Rareza } from "@/almacen/usarAlmacenDM";

// Colores HSL para D&D Rareza
export const COLORES_RAREZA_HSL: Record<Rareza, string> = {
  "Común": "hsl(0, 0%, 75%)",
  "Poco Común": "hsl(120, 60%, 45%)",
  "Raro": "hsl(210, 85%, 50%)",
  "Muy Raro": "hsl(280, 75%, 60%)",
  "Legendario": "hsl(32, 95%, 50%)",
  "Artefacto": "hsl(0, 75%, 40%)"
};

export const OPCIONES_ATRIBUTOS: Record<string, string[]> = {
  "CA": ["CA"],
  "CARACTERÍSTICA": ["Fuerza", "Destreza", "Constitución", "Inteligencia", "Sabiduría", "Carisma"],
  "SALVACIÓN": ["Fuerza", "Destreza", "Constitución", "Inteligencia", "Sabiduría", "Carisma"],
  "HABILIDAD": [
    "Acrobacias",
    "Atletismo",
    "Arcana",
    "Engaño",
    "Historia",
    "Perspicacia",
    "Intimidación",
    "Investigación",
    "Medicina",
    "Naturaleza",
    "Percepción",
    "Interpretación",
    "Persuasión",
    "Religión",
    "Juego de Manos",
    "Sigilo",
    "Supervivencia",
    "Trato con Animales"
  ]
};
