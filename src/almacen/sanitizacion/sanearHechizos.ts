import type { HechizoBase } from "@/tipos";
import { aplanarValor, normalizarTexto } from "./comun";

export function sanearHechizoCD(h: HechizoBase): HechizoBase {
  if (!h) return h;

  let cdSalv: string | undefined = undefined;

  // Normalizar el campo cdSalvacion almacenado directamente en la base de datos
  const valorOriginal = h.cdSalvacion ? String(h.cdSalvacion).toUpperCase().trim() : "";
  if (valorOriginal && valorOriginal !== "CD DC" && valorOriginal !== "DC" && valorOriginal !== "CD" && valorOriginal !== "N/A" && valorOriginal !== "NONE") {
    if (valorOriginal === "FUE" || valorOriginal === "STR" || valorOriginal.includes("FUERZA")) cdSalv = "Fuerza";
    else if (valorOriginal === "DES" || valorOriginal === "DEX" || valorOriginal.includes("DESTREZA")) cdSalv = "Destreza";
    else if (valorOriginal === "CON" || valorOriginal.includes("CONSTITUCIÓN") || valorOriginal.includes("CONSTITUCION")) cdSalv = "Constitución";
    else if (valorOriginal === "INT" || valorOriginal.includes("INTELIGENCIA")) cdSalv = "Inteligencia";
    else if (valorOriginal === "SAB" || valorOriginal === "WIS" || valorOriginal.includes("SABIDURÍA") || valorOriginal.includes("SABIDURIA")) cdSalv = "Sabiduría";
    else if (valorOriginal === "CAR" || valorOriginal === "CHA" || valorOriginal.includes("CARISMA")) cdSalv = "Carisma";
    else {
      cdSalv = aplanarValor(h.cdSalvacion);
    }
  }

  // Devolver el hechizo modificado con la salvación saneada (o undefined si no aplica)
  return {
    ...h,
    nombreNormalizado: normalizarTexto(h.nombre),
    descripcionNormalizada: normalizarTexto(h.descripcion),
    escuelaNormalizada: normalizarTexto(h.escuela || ""),
    cdSalvacion: cdSalv && cdSalv !== "N/A" ? cdSalv : undefined
  };
}
