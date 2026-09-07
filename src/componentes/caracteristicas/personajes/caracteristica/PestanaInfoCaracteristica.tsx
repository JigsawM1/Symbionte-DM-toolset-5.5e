import React from "react";
import { Shield, Dices } from "lucide-react";
import estilos from "../HojaPersonaje.module.css";

interface PestanaInfoCaracteristicaProps {
  abrev: string;
  tituloMostrar: string;
  descripcionMostrar: string;
  valorBaseActual: number;
  overrideActual: number | null;
  valorEfectivoGuardado: number;
  modBaseGuardado: number;
  modExtraGuardado: number;
  modTotalGuardado: number;
  pb: number;
  nivelPersonaje: number;
  esCompetenteActual: boolean;
  bonoSalvExtraGuardado: number;
  bonoSalvacionGuardado: number;
  notas?: string;
  ejecutarTiradaCaracteristica: () => void;
  ejecutarTiradaSalvacion: () => void;
}

export const PestanaInfoCaracteristica: React.FC<PestanaInfoCaracteristicaProps> = ({
  abrev,
  tituloMostrar,
  descripcionMostrar,
  valorBaseActual,
  overrideActual,
  valorEfectivoGuardado,
  modBaseGuardado,
  modExtraGuardado,
  modTotalGuardado,
  pb,
  nivelPersonaje,
  esCompetenteActual,
  bonoSalvExtraGuardado,
  bonoSalvacionGuardado,
  notas,
  ejecutarTiradaCaracteristica,
  ejecutarTiradaSalvacion
}) => {
  return (
    <div className={estilos.contenidoPestañaModal} style={{ gap: 12 }}>
      {/* Uso oficial / personalizado de Salvaciones */}
      <div
        style={{
          padding: "10px 12px",
          borderRadius: 6,
          borderLeft: "3px solid #334155",
          backgroundColor: "#0d131f",
          border: "1px solid rgba(148, 163, 184, 0.1)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <Shield size={13} color="#94a3b8" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1" }}>
            Tiradas de salvación y usos de {tituloMostrar}...
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "#f1f5f9", lineHeight: 1.4 }}>
          {descripcionMostrar}
        </p>
      </div>

      {/* Desglose Matemático */}
      <div
        className={estilos.neoPressed}
        style={{
          padding: "12px 14px",
          borderRadius: 6,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          backgroundColor: "#0a0e16"
        }}
      >
        <span className={estilos.labelFormulario} style={{ margin: 0, color: "#94a3b8" }}>
          Desglose Matemático del Atributo
        </span>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11 }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
            <span>Puntuación Base:</span>
            <strong style={{ color: "#f1f5f9" }}>{valorBaseActual}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
            <span>Override Fijo (Objeto Mágico):</span>
            <span style={{ color: overrideActual !== null ? "#d8b4fe" : "#64748b" }}>
              {overrideActual !== null ? `${overrideActual} (Activo)` : "Ninguno"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
            <span>Puntuación Efectiva Final:</span>
            <strong style={{ color: "#f1f5f9" }}>{valorEfectivoGuardado}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
            <span>Modificador Base ({valorEfectivoGuardado}):</span>
            <strong style={{ color: modBaseGuardado >= 0 ? "#60a5fa" : "#fca5a5" }}>
              {modBaseGuardado >= 0 ? `+${modBaseGuardado}` : modBaseGuardado}
            </strong>
          </div>

          {modExtraGuardado !== 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
              <span>Modificador Adicional a Pruebas:</span>
              <strong style={{ color: modExtraGuardado >= 0 ? "#60a5fa" : "#fca5a5" }}>
                {modExtraGuardado >= 0 ? `+${modExtraGuardado}` : modExtraGuardado}
              </strong>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#f1f5f9",
              borderTop: "1px solid rgba(148, 163, 184, 0.12)",
              paddingTop: 4,
              fontWeight: 700
            }}
          >
            <span>Total Modificador de Prueba:</span>
            <span style={{ color: modTotalGuardado >= 0 ? "#60a5fa" : "#fca5a5" }}>
              {modTotalGuardado >= 0 ? `+${modTotalGuardado}` : modTotalGuardado}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#94a3b8",
              borderTop: "1px solid rgba(148, 163, 184, 0.12)",
              paddingTop: 4,
              marginTop: 2
            }}
          >
            <span>Bono de Competencia (PB Nivel {nivelPersonaje}):</span>
            <span style={{ color: "#cbd5e1" }}>+{pb}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
            <span>Competencia en Salvación:</span>
            <span style={{ color: esCompetenteActual ? "#93c5fd" : "#64748b", fontWeight: 600 }}>
              {esCompetenteActual ? `Sí (+${pb} PB)` : "No (+0)"}
            </span>
          </div>

          {bonoSalvExtraGuardado !== 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
              <span>Bono Adicional a Salvaciones:</span>
              <span style={{ color: bonoSalvExtraGuardado >= 0 ? "#93c5fd" : "#fca5a5" }}>
                {bonoSalvExtraGuardado >= 0 ? `+${bonoSalvExtraGuardado}` : bonoSalvExtraGuardado}
              </span>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(148, 163, 184, 0.16)",
              paddingTop: 6,
              marginTop: 2,
              fontSize: 12,
              fontWeight: 700
            }}
          >
            <span style={{ color: "#f1f5f9" }}>Total Tirada de Salvación:</span>
            <span style={{ color: bonoSalvacionGuardado >= 0 ? "#93c5fd" : "#fca5a5" }}>
              {bonoSalvacionGuardado >= 0 ? `+${bonoSalvacionGuardado}` : bonoSalvacionGuardado}
            </span>
          </div>
        </div>
      </div>

      {/* Notas si existen */}
      {notas && (
        <div
          style={{
            fontSize: 11,
            color: "#94a3b8",
            padding: "8px 10px",
            borderRadius: 4,
            backgroundColor: "#0d121c",
            border: "1px dashed rgba(148, 163, 184, 0.2)"
          }}
        >
          <strong style={{ color: "#cbd5e1" }}>Notas: </strong>
          {notas}
        </div>
      )}

      {/* Botones de Tirada 3D */}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button
          type="button"
          className={estilos.neoButton}
          onClick={ejecutarTiradaCaracteristica}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "8px 10px",
            fontSize: 11,
            color: "#cbd5e1",
            borderColor: "rgba(148, 163, 184, 0.2)"
          }}
        >
          <Dices size={14} color="#94a3b8" />
          Prueba {abrev} ({modTotalGuardado >= 0 ? `+${modTotalGuardado}` : modTotalGuardado})
        </button>

        <button
          type="button"
          className={estilos.neoButton}
          onClick={ejecutarTiradaSalvacion}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "8px 10px",
            fontSize: 11,
            color: "#93c5fd",
            borderColor: "rgba(96, 165, 250, 0.3)"
          }}
        >
          <Shield size={14} color="#93c5fd" />
          Salvación {abrev} ({bonoSalvacionGuardado >= 0 ? `+${bonoSalvacionGuardado}` : bonoSalvacionGuardado})
        </button>
      </div>
    </div>
  );
};
