import { useEffect } from "react";
import { usarEstadoAccesibilidad } from "@/almacen/selectores";
import { CONFIGURACION_ACCESIBILIDAD_POR_DEFECTO } from "@/tipos/accesibilidad";

/**
 * Hook para proyectar la configuración de accesibilidad al DOM raíz.
 * Mantiene la sincronización reactiva instantánea sin causar reflows excesivos.
 */
export function usarAplicadorAccesibilidad(): void {
  const accesibilidad = usarEstadoAccesibilidad();

  useEffect(() => {
    if (typeof document === "undefined") return;

    const config = accesibilidad || CONFIGURACION_ACCESIBILIDAD_POR_DEFECTO;
    const root = document.documentElement;

    root.setAttribute("data-escala-fuente", config.escalaFuente || "normal");
    root.setAttribute("data-familia-fuente", config.familiaFuente || "estandar");
    root.setAttribute("data-modo-contraste", config.modoContraste || "estandar");
    root.setAttribute("data-modo-daltonismo", config.modoDaltonismo || "ninguno");
    root.setAttribute("data-color-acento", config.colorAcento || "arcano");
    root.setAttribute("data-foco-aumentado", String(Boolean(config.focoAumentado)));
    root.setAttribute("data-subrayar-enlaces", String(Boolean(config.subrayarEnlaces)));
    root.setAttribute("data-espaciado-lectura", String(Boolean(config.espaciadoLectura)));

    root.style.setProperty("--factor-escala-fuente", String(config.factorEscala || 1.0));
  }, [accesibilidad]);
}

