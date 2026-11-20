import React from "react";
import { FlaskConical, Heart, Sparkles } from "lucide-react";
import { TooltipUniversal } from "@/componentes/comunes/TooltipUniversal";
import type { ConsumibleAccionCalculado } from "@/tipos";
import estilos from "./VistaAtaquesJugador.module.css";

interface TarjetaConsumibleAccionProps {
  consumible: ConsumibleAccionCalculado;
  alUsar: (consumible: ConsumibleAccionCalculado) => void;
}

export const TarjetaConsumibleAccion: React.FC<TarjetaConsumibleAccionProps> = React.memo(({
  consumible,
  alUsar
}) => {
  const esUltimaUnidad = consumible.cantidad === 1;

  const textoBadgeAccion =
    consumible.tipoAccion === "accionAdicional"
      ? "Adicional"
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
    <article
      className={`${estilos.tarjetaAtaque} ${estilos.tarjetaConsumible}`}
      data-ultima={esUltimaUnidad ? "true" : undefined}
    >
      {/* Fila Superior: Nombre + Cantidad + Badge Acción */}
      <div className={estilos.filaSuperiorAtaque}>
        <div className={estilos.bloqueIzquierdoConsumible}>
          {consumible.esPocion ? (
            <FlaskConical size={14} color="var(--pj-texto-exito)" aria-hidden="true" />
          ) : (
            <Sparkles size={14} color="var(--pj-texto-oro)" aria-hidden="true" />
          )}
          <span className={estilos.nombreAtaque}>{consumible.nombre}</span>
          <span
            className={estilos.badgeCantidadConsumible}
            data-ultima={esUltimaUnidad ? "true" : undefined}
          >
            {esUltimaUnidad ? "×1 · Última" : `×${consumible.cantidad}`}
          </span>
        </div>

        <div className={estilos.bloqueDerechoConsumible}>
          <span className={`${estilos.badgeAccionTipo} ${claseBadgeAccion}`.trim()}>
            {textoBadgeAccion}
          </span>
          <span className={estilos.badgeAtaqueTipo}>
            {consumible.esPocion ? "Poción" : "Consumible"}
          </span>
        </div>
      </div>

      {/* Fila de Efecto y Botón Usar */}
      <div className={estilos.filaMetricasConsumible}>
        <div className={estilos.bloqueEfectoConsumibleV2}>
          {consumible.esCurativo ? (
            <>
              <div className={estilos.bloqueCuracionConsumible}>
                <Heart size={13} color="var(--pj-texto-alerta)" aria-hidden="true" />
                <span className={estilos.textoEfectoCuracion}>
                  Recupera {consumible.formulaCuracion} PV
                </span>
              </div>
              {consumible.notas && (
                <span className={estilos.textoEfectoGenerico} title={consumible.notas}>
                  {consumible.notas}
                </span>
              )}
            </>
          ) : (
            <span
              className={estilos.textoEfectoGenerico}
              title={consumible.notas || consumible.descripcionUso}
            >
              {consumible.notas || consumible.descripcionUso}
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
            {consumible.esCurativo ? (
              <Heart size={11} aria-hidden="true" />
            ) : (
              <Sparkles size={11} aria-hidden="true" />
            )}
            <span>{consumible.esPocion ? "Beber" : "Usar"}</span>
          </button>
        </TooltipUniversal>
      </div>
    </article>
  );
});

TarjetaConsumibleAccion.displayName = "TarjetaConsumibleAccion";
