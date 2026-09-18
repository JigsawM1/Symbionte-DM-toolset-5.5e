import React from "react";
import type { TipoAccionRasgo, OrigenRasgo } from "@/tipos";
import { Sparkles, Zap, Clock, Shield, Layers } from "lucide-react";
import estilos from "./VistaRasgosJugador.module.css";

export const LIMITE_CARACTERES_DESCRIPCION = 115;

export const ICONO_POR_ACCION: Record<TipoAccionRasgo, React.ReactNode> = {
  pasivo: <Shield size={10} />,
  accion: <Zap size={10} />,
  accion_adicional: <Clock size={10} />,
  reaccion: <Sparkles size={10} />,
  especial: <Layers size={10} />
};

export const CLASE_BADGE_ACCION: Record<TipoAccionRasgo, string> = {
  pasivo: estilos.badgePasivo,
  accion: estilos.badgeAccionPrincipal,
  accion_adicional: estilos.badgeAccionAdicional,
  reaccion: estilos.badgeReaccion,
  especial: estilos.badgeEspecial
};

export const ETIQUETA_ACCION: Record<TipoAccionRasgo, string> = {
  pasivo: "Pasivo",
  accion: "Acción",
  accion_adicional: "Acción Adicional",
  reaccion: "Reacción",
  especial: "Especial"
};

export const ETIQUETA_ORIGEN: Record<OrigenRasgo, string> = {
  clase: "Clase",
  subclase: "Subclase",
  especie: "Especie",
  subespecie: "Legado / Subraza",
  dote: "Dote",
  trasfondo: "Trasfondo",
  personalizado: "Personalizado / Homebrew"
};

export const CLASE_ORIGEN_BORDE: Record<OrigenRasgo, string> = {
  clase: estilos.origenClase,
  subclase: estilos.origenSubclase,
  especie: estilos.origenEspecie,
  subespecie: estilos.origenSubclase,
  dote: estilos.origenDote,
  trasfondo: estilos.origenDote,
  personalizado: estilos.origenPersonalizado
};
