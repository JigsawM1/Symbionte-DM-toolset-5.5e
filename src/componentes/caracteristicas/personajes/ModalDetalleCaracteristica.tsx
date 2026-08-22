import React, { useState } from "react";
import type { PersonajeJugador, Caracteristica } from "@/tipos";
import {
  DESCRIPCIONES_CARACTERISTICAS,
  obtenerBonoCompetenciaPorNivel
} from "@/constantes";
import { calcularModificadorCaracteristica } from "@/servicios/procesadorDescansos";
import ts from "@/utiles/TaleSpireAdapter";
import { X, Info, Settings, Dices, Shield, Save } from "lucide-react";
import estilos from "./HojaPersonaje.module.css";

interface ModalDetalleCaracteristicaProps {
  caracteristicaClave: Caracteristica;
  personaje: PersonajeJugador;
  alCerrar: () => void;
  alGuardar: (
    carac: Caracteristica,
    cambios: {
      valorBase: number;
      overrideFijo: number | null;
      competenteSalvacion: boolean;
    }
  ) => void;
  alTirarCaracteristica?: (carac: Caracteristica, nombre: string, bono: number) => void;
  alTirarSalvacion?: (carac: Caracteristica, nombre: string, bono: number) => void;
}

const NOMBRES_CARACTERISTICAS: Record<Caracteristica, string> = {
  fuerza: "Fuerza",
  destreza: "Destreza",
  constitucion: "Constitución",
  inteligencia: "Inteligencia",
  sabiduria: "Sabiduría",
  carisma: "Carisma"
};

const ABREVIATURAS: Record<Caracteristica, string> = {
  fuerza: "FUE",
  destreza: "DES",
  constitucion: "CON",
  inteligencia: "INT",
  sabiduria: "SAB",
  carisma: "CAR"
};

export const ModalDetalleCaracteristica: React.FC<ModalDetalleCaracteristicaProps> = ({
  caracteristicaClave,
  personaje,
  alCerrar,
  alGuardar,
  alTirarCaracteristica,
  alTirarSalvacion
}) => {
  const [pestanaActiva, setPestanaActiva] = useState<"info" | "configurar">("info");

  const nombreCarac = NOMBRES_CARACTERISTICAS[caracteristicaClave] || "Característica";
  const abrev = ABREVIATURAS[caracteristicaClave] || "ATR";
  const descripcionSalvacion = DESCRIPCIONES_CARACTERISTICAS[caracteristicaClave] || "";

  const valorBaseActual = personaje.caracteristicas?.[caracteristicaClave] ?? 10;
  const overrideActual = personaje.overridesFijos?.[caracteristicaClave] ?? null;
  const esCompetenteActual = !!personaje.competenciasSalvacion?.[caracteristicaClave]  // Estado del formulario de configuración (texto libre para permitir borrar y escribir a gusto)
  const [valorBaseForm, setValorBaseForm] = useState<string>(String(valorBaseActual));
  const [overrideForm, setOverrideForm] = useState<string>(
    overrideActual !== null && overrideActual !== undefined ? String(overrideActual) : ""
  );
  const [competenteSalvacionForm, setCompetenteSalvacionForm] = useState<boolean>(esCompetenteActual);

  // Cálculos matemáticos en tiempo real
  const pb = obtenerBonoCompetenciaPorNivel(personaje.nivel || 1);

  // Preview reactivo mientras el usuario escribe en los inputs
  const baseNumPreview = parseInt(valorBaseForm, 10);
  const baseValidaPreview = !isNaN(baseNumPreview) && baseNumPreview >= 1 && baseNumPreview <= 30 ? baseNumPreview : valorBaseActual;
  const overrideNumPreview = overrideForm.trim() !== "" ? parseInt(overrideForm, 10) : null;
  const overrideValidoPreview = overrideNumPreview !== null && !isNaN(overrideNumPreview) && overrideNumPreview >= 1 && overrideNumPreview <= 30 ? overrideNumPreview : null;
  const valorEfectivoPreview = overrideValidoPreview !== null ? overrideValidoPreview : baseValidaPreview;
  const modPreview = calcularModificadorCaracteristica(valorEfectivoPreview);
  const bonoSalvacionPreview = competenteSalvacionForm ? modPreview + pb : modPreview;

  // Modificadores de la ficha guardada para las tiradas
  const valorEfectivoGuardado = overrideActual !== null && overrideActual !== undefined ? overrideActual : valorBaseActual;
  const modGuardado = calcularModificadorCaracteristica(valorEfectivoGuardado);
  const bonoSalvacionGuardado = esCompetenteActual ? modGuardado + pb : modGuardado;

  const cambiarBaseDelta = (delta: number) => {
    const num = parseInt(valorBaseForm, 10);
    const actual = !isNaN(num) ? num : valorBaseActual;
    const nuevo = Math.max(1, Math.min(30, actual + delta));
    setValorBaseForm(String(nuevo));
  };

  // Tiradas de dados 3D nativas
  const ejecutarTiradaCaracteristica = () => {
    if (alTirarCaracteristica) {
      alTirarCaracteristica(caracteristicaClave, nombreCarac, modGuardado);
    } else {
      const formula = modGuardado >= 0 ? `1d20+${modGuardado}` : `1d20${modGuardado}`;
      ts.dice
        .putDiceInTray([{ name: `Prueba de ${abrev}`, roll: formula }], true)
        .catch((err: unknown) => {
          console.error("Error al lanzar prueba de característica en TaleSpire:", err);
        });
    }
  };

  const ejecutarTiradaSalvacion = () => {
    if (alTirarSalvacion) {
      alTirarSalvacion(caracteristicaClave, nombreCarac, bonoSalvacionGuardado);
    } else {
      const formula = bonoSalvacionGuardado >= 0 ? `1d20+${bonoSalvacionGuardado}` : `1d20${bonoSalvacionGuardado}`;
      ts.dice
        .putDiceInTray([{ name: `Salvación de ${abrev}`, roll: formula }], true)
        .catch((err: unknown) => {
          console.error("Error al lanzar salvación en TaleSpire:", err);
        });
    }
  };

  const manejarGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    const baseNum = parseInt(valorBaseForm, 10);
    const baseFinal = !isNaN(baseNum) && baseNum >= 1 && baseNum <= 30 ? baseNum : valorBaseActual;
    const overrideNum = overrideForm.trim() !== "" ? parseInt(overrideForm, 10) : null;
    const overrideFinal = overrideNum !== null && !isNaN(overrideNum) && overrideNum >= 1 && overrideNum <= 30 ? overrideNum : null;

    alGuardar(caracteristicaClave, {
      valorBase: baseFinal,
      overrideFijo: overrideFinal,
      competenteSalvacion: competenteSalvacionForm
    });
  };

  return (
    <div className={estilos.overlayModal} onClick={alCerrar}>
      <div
        className={`${estilos.modalContenedor} ${estilos.neoRaised}`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480, width: "95%" }}
      >
        {/* Cabecera del Modal */}
        <div className={estilos.cabeceraModal} style={{ paddingBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                backgroundColor: "#18202e",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#cbd5e1",
                fontWeight: 800,
                fontSize: 12
              }}
            >
              {abrev}
            </div>
            <div>
              <h3 className={estilos.tituloModal} style={{ margin: 0 }}>
                {nombreCarac}
              </h3>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                Puntuación: <strong style={{ color: "#f1f5f9" }}>{valorEfectivoPreview}</strong> (Mod:{" "}
                <strong style={{ color: modPreview >= 0 ? "#60a5fa" : "#fca5a5" }}>
                  {modPreview >= 0 ? `+${modPreview}` : modPreview}
                </strong>
                )
                {overrideValidoPreview !== null && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 10,
                      backgroundColor: "#201335",
                      color: "#d8b4fe",
                      border: "1px solid rgba(168, 85, 247, 0.3)",
                      padding: "1px 5px",
                      borderRadius: 4,
                      fontWeight: 700
                    }}
                  >
                    Fijo: {overrideValidoPreview}
                  </span>
                )}
              </span>
            </div>
          </div>

          <button type="button" className={estilos.botonCerrarModal} onClick={alCerrar}>
            <X size={18} />
          </button>
        </div>

        {/* Selector de Pestañas Internas */}
        <div className={estilos.barraPestañasModal}>
          <button
            type="button"
            className={`${estilos.pestañaModal} ${pestanaActiva === "info" ? estilos.pestañaModalActiva : ""}`}
            onClick={() => setPestanaActiva("info")}
          >
            <Info size={14} />
            Información y Tiradas
          </button>

          <button
            type="button"
            className={`${estilos.pestañaModal} ${pestanaActiva === "configurar" ? estilos.pestañaModalActiva : ""}`}
            onClick={() => setPestanaActiva("configurar")}
          >
            <Settings size={14} />
            Configurar / Override
          </button>
        </div>

        {/* PESTAÑA 1: INFORMACIÓN Y TIRADAS */}
        {pestanaActiva === "info" && (
          <div className={estilos.contenidoPestañaModal} style={{ gap: 12 }}>
            {/* Uso oficial de Salvaciones (D&D 5.5e) */}
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
                  Haz una tirada de salvación para...
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#f1f5f9", lineHeight: 1.4 }}>
                {descripcionSalvacion}
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
                gap: 8,
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
                  <span>Modificador Resultante:</span>
                  <strong style={{ color: modGuardado >= 0 ? "#60a5fa" : "#fca5a5" }}>
                    {modGuardado >= 0 ? `+${modGuardado}` : modGuardado}
                  </strong>
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
                  <span>Bono de Competencia (PB Nivel {personaje.nivel || 1}):</span>
                  <span style={{ color: "#cbd5e1" }}>+{pb}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
                  <span>Competencia en Salvación:</span>
                  <span style={{ color: esCompetenteActual ? "#93c5fd" : "#64748b", fontWeight: 600 }}>
                    {esCompetenteActual ? `Sí (+${pb} PB)` : "No (+0)"}
                  </span>
                </div>

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
                Prueba {abrev} ({modGuardado >= 0 ? `+${modGuardado}` : modGuardado})
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
        )}

        {/* PESTAÑA 2: CONFIGURAR / OVERRIDE */}
        {pestanaActiva === "configurar" && (
          <form onSubmit={manejarGuardar} className={estilos.contenidoPestañaModal} style={{ gap: 14 }}>
            {/* Puntuación Base con botones +/- y edición libre de texto */}
            <div className={estilos.campoFormulario}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className={estilos.labelFormulario} style={{ color: "#f1f5f9" }}>
                  Puntuación Base de {nombreCarac} (1 - 30)
                </label>
                <span style={{ fontSize: 11, color: "#93c5fd", fontWeight: 700 }}>
                  Mod: {modPreview >= 0 ? `+${modPreview}` : modPreview}
                </span>
              </div>

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => cambiarBaseDelta(-1)}
                  style={{
                    width: 36,
                    height: 34,
                    borderRadius: 4,
                    backgroundColor: "#18202f",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    color: "#cbd5e1",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  title="Restar 1"
                >
                  -
                </button>

                <input
                  type="text"
                  inputMode="numeric"
                  className={estilos.inputFormulario}
                  value={valorBaseForm}
                  onChange={(e) => setValorBaseForm(e.target.value)}
                  onBlur={() => {
                    const num = parseInt(valorBaseForm, 10);
                    if (!isNaN(num) && num >= 1 && num <= 30) {
                      setValorBaseForm(String(num));
                    } else {
                      setValorBaseForm(String(valorBaseActual));
                    }
                  }}
                  style={{
                    textAlign: "center",
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#f1f5f9",
                    backgroundColor: "#0b0f16",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: 4,
                    padding: "6px 10px",
                    flex: 1
                  }}
                  placeholder="10"
                />

                <button
                  type="button"
                  onClick={() => cambiarBaseDelta(1)}
                  style={{
                    width: 36,
                    height: 34,
                    borderRadius: 4,
                    backgroundColor: "#18202f",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    color: "#cbd5e1",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  title="Sumar 1"
                >
                  +
                </button>
              </div>

              <span style={{ fontSize: 10, color: "#94a3b8" }}>
                Puntuación natural asignada por tirada, compra de puntos o mejoras de nivel.
              </span>
            </div>

            {/* Override Fijo con Presets Rápidos */}
            <div className={estilos.campoFormulario}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className={estilos.labelFormulario} style={{ color: "#f1f5f9" }}>
                  Override Fijo (Puntuación por Objeto Mágico)
                </label>
                {overrideValidoPreview !== null && (
                  <span style={{ fontSize: 10, color: "#d8b4fe", fontWeight: 700 }}>
                    ✨ Activo: {overrideValidoPreview}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  className={estilos.inputFormulario}
                  value={overrideForm}
                  onChange={(e) => setOverrideForm(e.target.value)}
                  placeholder="Ninguno (usar puntuación base)"
                  style={{
                    flex: 1,
                    fontSize: 12,
                    backgroundColor: "#0b0f16",
                    border: overrideValidoPreview !== null ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid rgba(148, 163, 184, 0.2)",
                    color: overrideValidoPreview !== null ? "#d8b4fe" : "#f1f5f9",
                    borderRadius: 4,
                    padding: "6px 10px"
                  }}
                />

                {overrideForm !== "" && (
                  <button
                    type="button"
                    onClick={() => setOverrideForm("")}
                    style={{
                      padding: "6px 10px",
                      fontSize: 11,
                      backgroundColor: "#18202f",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      color: "#fca5a5",
                      borderRadius: 4,
                      cursor: "pointer"
                    }}
                  >
                    Quitar
                  </button>
                )}
              </div>

              {/* Presets rápidos */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", marginTop: 2 }}>
                <span style={{ fontSize: 10, color: "#94a3b8", marginRight: 2 }}>Presets:</span>
                <button
                  type="button"
                  onClick={() => setOverrideForm("19")}
                  style={{
                    padding: "2px 6px",
                    fontSize: 10,
                    backgroundColor: "#18202e",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    color: "#cbd5e1",
                    borderRadius: 4,
                    cursor: "pointer"
                  }}
                >
                  19 (Ogro/Diadema)
                </button>
                <button
                  type="button"
                  onClick={() => setOverrideForm("21")}
                  style={{
                    padding: "2px 6px",
                    fontSize: 10,
                    backgroundColor: "#18202e",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    color: "#cbd5e1",
                    borderRadius: 4,
                    cursor: "pointer"
                  }}
                >
                  21 (Colina)
                </button>
                <button
                  type="button"
                  onClick={() => setOverrideForm("23")}
                  style={{
                    padding: "2px 6px",
                    fontSize: 10,
                    backgroundColor: "#18202e",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    color: "#cbd5e1",
                    borderRadius: 4,
                    cursor: "pointer"
                  }}
                >
                  23 (Piedra)
                </button>
              </div>

              <span style={{ fontSize: 10, color: "#94a3b8" }}>
                Fija la puntuación independientemente de la base (D&D 5.5e).
              </span>
            </div>

            {/* Competencia en Salvación */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario} style={{ color: "#f1f5f9" }}>
                Competencia en Tiradas de Salvación
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: 4,
                  cursor: "pointer",
                  backgroundColor: competenteSalvacionForm ? "#132135" : "#0d121c",
                  border: competenteSalvacionForm ? "1px solid rgba(96, 165, 250, 0.3)" : "1px solid rgba(148, 163, 184, 0.14)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={competenteSalvacionForm}
                    onChange={(e) => setCompetenteSalvacionForm(e.target.checked)}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, color: competenteSalvacionForm ? "#93c5fd" : "#cbd5e1" }}>
                    Competente con Salvaciones de {abrev}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: competenteSalvacionForm ? "#93c5fd" : "#94a3b8", fontWeight: 700 }}>
                  {competenteSalvacionForm ? `+${pb} PB (Total: ${bonoSalvacionPreview >= 0 ? `+${bonoSalvacionPreview}` : bonoSalvacionPreview})` : "Sin bono"}
                </span>
              </label>
            </div>

            {/* Botones de acción */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                borderTop: "1px solid rgba(148, 163, 184, 0.15)",
                paddingTop: 10,
                marginTop: 2
              }}
            >
              <button
                type="button"
                onClick={alCerrar}
                style={{
                  padding: "6px 12px",
                  borderRadius: 4,
                  backgroundColor: "#18202f",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  color: "#cbd5e1",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                style={{
                  padding: "6px 14px",
                  borderRadius: 4,
                  backgroundColor: "#1e293b",
                  border: "1px solid rgba(96, 165, 250, 0.4)",
                  color: "#93c5fd",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Save size={14} />
                Guardar Atributo
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ModalDetalleCaracteristica;

