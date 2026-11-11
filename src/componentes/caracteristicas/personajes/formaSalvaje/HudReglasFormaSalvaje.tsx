import React from "react";
import type { ReglasFormaSalvajeNivel } from "@/servicios/reglasFormaSalvaje";
import { Sparkles, ShieldAlert, Award, Feather } from "lucide-react";
import estilos from "../PanelFormaSalvaje.module.css";

interface HudReglasFormaSalvajeProps {
  reglas: ReglasFormaSalvajeNivel;
  pgAlTransformar: number;
  usosRestantes: number;
  usosMaximos: number;
}

/**
 * HUD táctico con telemetría de recursos y limitaciones de Forma Salvaje (PHB 2024 / D&D 5.5e).
 */
export const HudReglasFormaSalvaje: React.FC<HudReglasFormaSalvajeProps> = ({
  reglas,
  pgAlTransformar,
  usosRestantes,
  usosMaximos
}) => {
  const sinUsos = usosRestantes <= 0;
  const maximoPips = Math.max(usosMaximos, 1);

  return (
    <div className={estilos.hudReglasContenedor} role="region" aria-label="Límites y Recursos de Forma Salvaje">
      {/* Módulo 1: Usos Disponibles */}
      <div className={`${estilos.hudModulo} ${sinUsos ? estilos.hudModuloAlerta : estilos.hudModuloActivo}`}>
        <div className={estilos.hudModuloIcono}>
          <Sparkles size={18} />
        </div>
        <div className={estilos.hudModuloCuerpo}>
          <span className={estilos.hudModuloEtiqueta}>
            <strong>Usos disponibles:</strong>
          </span>
          <div className={estilos.hudModuloValorPrincipal}>
            {usosRestantes} <span className={estilos.hudModuloMaximo}>/ {usosMaximos}</span>
          </div>
          <div className={estilos.hudPipsFila} aria-hidden="true">
            {Array.from({ length: maximoPips }).map((_, idx) => (
              <span
                key={idx}
                className={`${estilos.hudPip} ${idx < usosRestantes ? estilos.hudPipLleno : estilos.hudPipVacio}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Módulo 2: PG Temporales */}
      <div className={estilos.hudModulo}>
        <div className={estilos.hudModuloIcono}>
          <ShieldAlert size={18} />
        </div>
        <div className={estilos.hudModuloCuerpo}>
          <span className={estilos.hudModuloEtiqueta}>
            <strong>PG Temporales:</strong>
          </span>
          <div className={estilos.hudModuloValorPrincipal}>
            +{pgAlTransformar} <span className={estilos.hudModuloSufijo}>PG</span>
          </div>
          <span className={estilos.hudModuloNota}>Absorbe daño primero</span>
        </div>
      </div>

      {/* Módulo 3: VD Máximo */}
      <div className={estilos.hudModulo}>
        <div className={estilos.hudModuloIcono}>
          <Award size={18} />
        </div>
        <div className={estilos.hudModuloCuerpo}>
          <span className={estilos.hudModuloEtiqueta}>
            <strong>VD Máximo:</strong>
          </span>
          <div className={estilos.hudModuloValorPrincipal}>
            {reglas.vdMaximoTexto}
          </div>
          <span className={estilos.hudModuloNota}>Límite de metamorfosis</span>
        </div>
      </div>

      {/* Módulo 4: Capacidad de Vuelo */}
      <div className={estilos.hudModulo}>
        <div className={estilos.hudModuloIcono}>
          <Feather size={18} />
        </div>
        <div className={estilos.hudModuloCuerpo}>
          <span className={estilos.hudModuloEtiqueta}>
            <strong>Vuelo:</strong>
          </span>
          <div className={estilos.hudModuloValorPrincipal}>
            {reglas.puedeVolar ? "Permitido" : "No permitido (hasta Nv 8)"}
          </div>
          <span className={estilos.hudModuloNota}>
            {reglas.puedeVolar ? "Aves y formas aéreas" : "Desbloquea en Nivel 8"}
          </span>
        </div>
      </div>
    </div>
  );
};
