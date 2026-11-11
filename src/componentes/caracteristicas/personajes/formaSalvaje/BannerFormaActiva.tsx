import React from "react";
import type { MonstruoBase } from "@/tipos";
import { PawPrint, RotateCcw, Clock, Shield, Activity } from "lucide-react";
import estilos from "../PanelFormaSalvaje.module.css";

interface BannerFormaActivaProps {
  bestiaActiva: MonstruoBase;
  minutosRestantes?: number;
  alRevertir: () => void;
}

/**
 * Banner táctico de metamorfosis activa para el druida transformado.
 */
export const BannerFormaActiva: React.FC<BannerFormaActivaProps> = ({
  bestiaActiva,
  minutosRestantes,
  alRevertir
}) => {
  const fue = bestiaActiva.caracteristicas?.fuerza ?? 10;
  const des = bestiaActiva.caracteristicas?.destreza ?? 10;
  const con = bestiaActiva.caracteristicas?.constitucion ?? 10;
  const ca = bestiaActiva.ca ?? 10;

  return (
    <aside className={estilos.bannerActiva} aria-label="Forma Salvaje Activa">
      <div className={estilos.bannerLadoIzquierdo}>
        <div className={estilos.bannerAvatarEmblema}>
          <PawPrint size={22} className={estilos.iconoPawPulsante} />
        </div>
        <div className={estilos.bannerInfo}>
          <div className={estilos.bannerTituloFila}>
            <span className={estilos.bannerTitulo}>Forma Activa: {bestiaActiva.nombre}</span>
            <span className={estilos.bannerVdBadge}>VD {bestiaActiva.desafio}</span>
            <span className={estilos.badgeFormaActiva}>
              <PawPrint size={11} /> Activa
            </span>
          </div>

          <div className={estilos.bannerDetalle}>
            <span className={estilos.bannerPillStat}>
              <Shield size={12} /> CA {ca}
            </span>
            <span className={estilos.bannerPillStat}>
              <Activity size={12} /> FUE {fue} · DES {des} · CON {con}
            </span>
            {minutosRestantes !== undefined && (
              <span className={estilos.bannerPillTiempo}>
                <Clock size={12} /> Hasta {minutosRestantes} min de juego
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        className={estilos.botonRevertir}
        onClick={alRevertir}
        title="Cancelar transformación y volver a tu forma natural"
      >
        <RotateCcw size={14} />
        Revertir Forma
      </button>
    </aside>
  );
};
