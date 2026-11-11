import React from "react";
import { Users, Plus, Minus, Skull, ShieldAlert, Crosshair } from "lucide-react";
import type { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import { esCriaturaHorda, obtenerResumenHorda } from "@/servicios/combateHordas";
import estilos from "./PanelBarrasHorda.module.css";

export interface PanelBarrasHordaProps {
  criatura: CriaturaIniciativa;
  onConfigurarBarras: (cantidad: number) => void;
  onSeleccionarBarra: (indice: number) => void;
  onAlternarModoDano: () => void;
}

export const PanelBarrasHorda: React.FC<PanelBarrasHordaProps> = React.memo(({
  criatura,
  onConfigurarBarras,
  onSeleccionarBarra,
  onAlternarModoDano
}) => {
  if (!criatura.esMonstruo) return null;

  const esHorda = esCriaturaHorda(criatura) && Boolean(criatura.barrasVida && criatura.barrasVida.length > 1);

  if (!esHorda) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onConfigurarBarras(2);
        }}
        className={estilos.botonConvertirHorda}
        title="Convertir esta ficha en una Horda con múltiples barras de vida individuales"
      >
        <Users size={10} />
        <span>+ HORDA</span>
      </button>
    );
  }

  const barras = criatura.barrasVida ?? [];
  const resumen = obtenerResumenHorda(criatura) ?? { vivos: barras.length, totales: barras.length };
  const indiceActivo = Math.max(0, Math.min(barras.length - 1, criatura.indiceBarraActiva ?? 0));
  const esCascada = criatura.modoDanoHorda === "cascada";

  return (
    <div className={estilos.contenedorHorda} onClick={(e) => e.stopPropagation()}>
      <div className={estilos.cabeceraHorda}>
        <div className={estilos.insigniaEstadoHorda}>
          <Users size={11} className={estilos.iconoHorda} />
          <span>
            HORDA · <strong className={estilos.conteoVivosTotales}>{resumen.vivos}/{resumen.totales}</strong> EN PIE
          </span>
        </div>

        <div className={estilos.controlesCabeceraHorda}>
          <button
            type="button"
            onClick={onAlternarModoDano}
            className={`${estilos.botonModoDano} ${esCascada ? estilos.botonModoCascada : estilos.botonModoIndividual}`}
            title={
              esCascada
                ? "Modo Cascada / Desborde: el exceso de daño al abatir una barra pasa automáticamente a la siguiente barra viva"
                : "Modo Individual: el daño y la curación afectan únicamente a la barra seleccionada (#)"
            }
          >
            {esCascada ? <ShieldAlert size={10} /> : <Crosshair size={10} />}
            <span>{esCascada ? "CASCADA" : "INDIVIDUAL"}</span>
          </button>

          <div className={estilos.grupoCantidadBarras}>
            <button
              type="button"
              onClick={() => onConfigurarBarras(barras.length - 1)}
              className={estilos.botonPasoBarra}
              title={barras.length <= 2 ? "Volver a ficha individual (1 barra)" : "Quitar una barra de vida de la horda"}
            >
              <Minus size={10} />
            </button>
            <button
              type="button"
              onClick={() => onConfigurarBarras(barras.length + 1)}
              className={estilos.botonPasoBarra}
              title="Añadir 1 barra de vida a la horda"
            >
              <Plus size={10} />
            </button>
            <button
              type="button"
              onClick={() => onConfigurarBarras(barras.length + 5)}
              className={estilos.botonPasoBarraLote}
              title="Añadir 5 barras de vida a la horda"
            >
              +5
            </button>
          </div>
        </div>
      </div>

      <div className={estilos.rejillaBarras}>
        {barras.map((barra, idx) => {
          const esActiva = idx === indiceActivo;
          const muerta = barra.vidaActual <= 0;
          const pct = Math.max(0, Math.min(100, Math.round((barra.vidaActual / Math.max(1, barra.vidaMaxima)) * 100)));
          const estadoSalud = muerta ? "muerto" : pct > 50 ? "saludable" : pct > 25 ? "herido" : "critico";

          return (
            <button
              key={barra.id}
              type="button"
              onClick={() => onSeleccionarBarra(idx)}
              className={estilos.pildoraBarra}
              data-activa={esActiva}
              data-salud={estadoSalud}
              title={`Unidad #${idx + 1}: ${barra.vidaActual}/${barra.vidaMaxima} PG${barra.vidaTemporal ? ` (+${barra.vidaTemporal} temp)` : ""} — Clic para seleccionar como objetivo`}
            >
              <span className={estilos.etiquetaIndice}>#{idx + 1}</span>
              <span className={estilos.valorVidaBarra}>
                {muerta ? (
                  <Skull size={10} className={estilos.iconoCalaveraBarra} />
                ) : (
                  `${barra.vidaActual}/${barra.vidaMaxima}`
                )}
              </span>
              {(barra.vidaTemporal ?? 0) > 0 ? (
                <span className={estilos.badgeTempBarra}>+{barra.vidaTemporal}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
});

PanelBarrasHorda.displayName = "PanelBarrasHorda";
