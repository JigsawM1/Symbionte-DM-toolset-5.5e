import React from "react";
import { FlaskConical, Heart, Sparkles } from "lucide-react";
import { TooltipUniversal } from "@/componentes/comunes/TooltipUniversal";
import type { ConsumibleAccionCalculado } from "./TarjetaConsumibleAccion.tipos";
import estilos from "./VistaAtaquesJugador.module.css";

interface TarjetaConsumibleAccionProps {
  consumible: ConsumibleAccionCalculado;
  alUsar: (consumible: ConsumibleAccionCalculado) => void;
}

export const TarjetaConsumibleAccion: React.FC<TarjetaConsumibleAccionProps> = ({
  consumible,
  alUsar
}) => {
  const textoBadgeAccion =
    consumible.tipoAccion === "accionAdicional"
      ? "Acción Adicional"
      : consumible.tipoAccion === "reaccion"
      ? "Reacción"
      : "Acción";

  const claseBadgeAccion =
    consumible.tipoAccion === "accionAdicional"
      ? estilos.badgeAccionAdicional
      : consumible.tipoAccion === "reaccion"
      ? estilos.badgeReaccion
      : "";

  return (
    <div className={`${estilos.tarjetaAtaque} ${estilos.tarjetaConsumible}`}>
      {/* Fila Superior: Nombre + Cantidad + Badge Acción */}
      <div className={estilos.filaSuperiorAtaque}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {consumible.esPocion ? (
            <FlaskConical size={14} color="#10b981" />
          ) : (
            <Sparkles size={14} color="#f59e0b" />
          )}
          <span className={estilos.nombreAtaque}>{consumible.nombre}</span>
          <span className={estilos.badgeCantidadConsumible}>×{consumible.cantidad}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className={`${estilos.badgeAccionTipo} ${claseBadgeAccion}`}>
            {textoBadgeAccion}
          </span>
          <span className={estilos.badgeAtaqueTipo}>
            {consumible.esPocion ? "Poción" : "Consumible"}
          </span>
        </div>
      </div>

      {/* Fila de Efecto y Botón Usar */}
      <div className={estilos.filaMetricasConsumible}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
          {consumible.esCurativo ? (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Heart size={13} color="#ef4444" />
              <span className={estilos.textoEfectoCuracion}>
                Recupera {consumible.formulaCuracion} PV
              </span>
            </div>
          ) : (
            <span className={estilos.textoEfectoGenerico}>
              {consumible.descripcionUso}
            </span>
          )}
        </div>

        {/* Botón Acción Rápida: Usar / Beber */}
        <TooltipUniversal
          titulo={consumible.esPocion ? "Beber Poción (Acción Adicional)" : "Usar Consumible"}
          contenido={
            consumible.esCurativo
              ? `Resta 1 unidad, tira ${consumible.formulaCuracion} en TaleSpire y recupera los Puntos de Golpe automáticamente.`
              : "Resta 1 unidad del inventario y notifica su uso."
          }
          posicion="arriba"
          alineacion="fin"
        >
          <button
            type="button"
            className={estilos.botonUsarConsumible}
            onClick={() => alUsar(consumible)}
          >
            {consumible.esCurativo ? <Heart size={11} /> : <Sparkles size={11} />}
            <span>{consumible.esPocion ? "Beber" : "Usar"}</span>
          </button>
        </TooltipUniversal>
      </div>
    </div>
  );
};
