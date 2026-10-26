import React from "react";
import { Check, Sun, Zap, Sparkles, Heart, Flame, Shield } from "lucide-react";
import estilos from "./ResolucionAsistidaRasgo.module.css";

export function IconoCabeceraRasgo({ nombre }: { nombre: string }) {
  const norm = nombre.toLowerCase();
  if (norm.includes("muerto") || norm.includes("expulsar")) return <Sun size={18} />;
  if (norm.includes("golpe") || norm.includes("lanzamiento")) return <Zap size={18} />;
  return <Sparkles size={18} />;
}

export function IconoOpcionResolucion({ opcion }: { opcion: { id: string; tipo?: string; tipoDano?: string } }) {
  if (opcion.id === "curacion" || opcion.tipo === "curacion") return <Heart size={14} />;
  if (opcion.tipoDano === "Radiante" || opcion.id === "radiante") return <Sun size={14} />;
  if (opcion.tipoDano === "Necrótico" || opcion.id === "necrotico") return <Flame size={14} />;
  if (opcion.tipo === "hp_temporal") return <Shield size={14} />;
  return <Sparkles size={14} />;
}

export function TarjetaToggle({
  activo,
  disabled,
  alCambiar,
  icono,
  titulo,
  descripcion,
  esAlerta
}: {
  activo: boolean;
  disabled?: boolean;
  alCambiar: (v: boolean) => void;
  icono: React.ReactNode;
  titulo: React.ReactNode;
  descripcion: string;
  esAlerta?: boolean;
}) {
  return (
    <label className={`${estilos.tarjetaToggle} ${activo ? estilos.tarjetaToggleActiva : ""}`}>
      <input
        type="checkbox"
        className={estilos.checkboxOculto}
        checked={activo}
        disabled={disabled}
        onChange={e => alCambiar(e.target.checked)}
      />
      <span className={estilos.indicadorCheck} aria-hidden="true">
        {activo && <Check size={13} strokeWidth={3} />}
      </span>
      <div className={esAlerta ? estilos.iconoToggleAlerta : estilos.iconoToggle}>{icono}</div>
      <div className={estilos.contenidoToggle}>
        <span className={estilos.tituloToggle}>{titulo}</span>
        <span className={estilos.descripcionToggle}>{descripcion}</span>
      </div>
    </label>
  );
}

export function TarjetaStat({
  icono,
  etiqueta,
  valor,
  detalle,
  tipo
}: {
  icono: React.ReactNode;
  etiqueta: string;
  valor: string;
  detalle: string;
  tipo: "dificultad" | "formula";
}) {
  return (
    <div className={estilos.tarjetaStat}>
      <div className={estilos.cabeceraStat}>
        {icono}
        <span>{etiqueta}</span>
      </div>
      <div className={tipo === "dificultad" ? estilos.valorStatDificultad : estilos.valorStatFormula}>
        {valor}
      </div>
      <div className={estilos.detalleStat}>{detalle}</div>
    </div>
  );
}
