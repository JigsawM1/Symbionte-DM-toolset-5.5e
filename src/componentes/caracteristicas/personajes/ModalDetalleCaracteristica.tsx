import React, { useState } from "react";
import type { PersonajeJugador, Caracteristica, PersonalizacionCaracteristica } from "@/tipos";
import {
  DESCRIPCIONES_CARACTERISTICAS,
  obtenerBonoCompetenciaPorNivel
} from "@/constantes";
import { calcularModificadorCaracteristica } from "@/servicios/procesadorDescansos";
import ts from "@/utiles/TaleSpireAdapter";
import { X, Info, Edit3, Dices, Shield, Save, Sparkles } from "lucide-react";
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
      personalizacion?: Partial<PersonalizacionCaracteristica>;
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
  const [pestanaActiva, setPestanaActiva] = useState<"info" | "personalizar">("info");

  const nombreCarac = NOMBRES_CARACTERISTICAS[caracteristicaClave] || "Característica";
  const abrev = ABREVIATURAS[caracteristicaClave] || "ATR";
  const descripcionSalvacionOficial = DESCRIPCIONES_CARACTERISTICAS[caracteristicaClave] || "";

  const customExistente = personaje.personalizacionesCaracteristicas?.[caracteristicaClave];
  const valorBaseActual = personaje.caracteristicas?.[caracteristicaClave] ?? 10;
  const overrideActual = customExistente?.valorFijo ?? personaje.overridesFijos?.[caracteristicaClave] ?? null;
  const esCompetenteActual = !!personaje.competenciasSalvacion?.[caracteristicaClave];

  // Estado del formulario de personalización y configuración
  const [nombreForm, setNombreForm] = useState<string>(customExistente?.nombrePersonalizado ?? "");
  const [descForm, setDescForm] = useState<string>(
    customExistente?.descripcionPersonalizada ?? descripcionSalvacionOficial
  );
  const [valorBaseForm, setValorBaseForm] = useState<string>(String(valorBaseActual));
  const [overrideForm, setOverrideForm] = useState<string>(
    overrideActual !== null && overrideActual !== undefined ? String(overrideActual) : ""
  );
  const [modExtraForm, setModExtraForm] = useState<string>(
    customExistente?.modificadorExtra !== undefined && customExistente.modificadorExtra !== 0
      ? String(customExistente.modificadorExtra)
      : ""
  );
  const [bonoSalvacionExtraForm, setBonoSalvacionExtraForm] = useState<string>(
    customExistente?.bonoSalvacionExtra !== undefined && customExistente.bonoSalvacionExtra !== 0
      ? String(customExistente.bonoSalvacionExtra)
      : ""
  );
  const [competenteSalvacionForm, setCompetenteSalvacionForm] = useState<boolean>(esCompetenteActual);
  const [notasForm, setNotasForm] = useState<string>(customExistente?.notas ?? "");

  // Cálculos matemáticos en tiempo real
  const pb = obtenerBonoCompetenciaPorNivel(personaje.nivel || 1);

  // Preview reactivo mientras el usuario escribe en los inputs
  const baseNumPreview = parseInt(valorBaseForm, 10);
  const baseValidaPreview = !isNaN(baseNumPreview) && baseNumPreview >= 1 && baseNumPreview <= 30 ? baseNumPreview : valorBaseActual;
  const overrideNumPreview = overrideForm.trim() !== "" ? parseInt(overrideForm, 10) : null;
  const overrideValidoPreview = overrideNumPreview !== null && !isNaN(overrideNumPreview) && overrideNumPreview >= 1 && overrideNumPreview <= 30 ? overrideNumPreview : null;
  const valorEfectivoPreview = overrideValidoPreview !== null ? overrideValidoPreview : baseValidaPreview;
  const modBasePreview = calcularModificadorCaracteristica(valorEfectivoPreview);
  const modExtraNumPreview = parseInt(modExtraForm, 10) || 0;
  const modTotalPreview = modBasePreview + modExtraNumPreview;
  const bonoSalvExtraNumPreview = parseInt(bonoSalvacionExtraForm, 10) || 0;
  const bonoSalvacionPreview = (competenteSalvacionForm ? modTotalPreview + pb : modTotalPreview) + bonoSalvExtraNumPreview;

  // Modificadores guardados actuales para las tiradas
  const valorEfectivoGuardado = overrideActual !== null && overrideActual !== undefined ? overrideActual : valorBaseActual;
  const modBaseGuardado = calcularModificadorCaracteristica(valorEfectivoGuardado);
  const modExtraGuardado = customExistente?.modificadorExtra || 0;
  const modTotalGuardado = modBaseGuardado + modExtraGuardado;
  const bonoSalvExtraGuardado = customExistente?.bonoSalvacionExtra || 0;
  const bonoSalvacionGuardado = (esCompetenteActual ? modTotalGuardado + pb : modTotalGuardado) + bonoSalvExtraGuardado;

  const tituloMostrar = customExistente?.nombrePersonalizado || nombreCarac;
  const descripcionMostrar = customExistente?.descripcionPersonalizada || descripcionSalvacionOficial;

  const cambiarBaseDelta = (delta: number) => {
    const num = parseInt(valorBaseForm, 10);
    const actual = !isNaN(num) ? num : valorBaseActual;
    const nuevo = Math.max(1, Math.min(30, actual + delta));
    setValorBaseForm(String(nuevo));
  };

  // Tiradas de dados 3D nativas
  const ejecutarTiradaCaracteristica = () => {
    if (alTirarCaracteristica) {
      alTirarCaracteristica(caracteristicaClave, tituloMostrar, modTotalGuardado);
    } else {
      const formula = modTotalGuardado >= 0 ? `1d20+${modTotalGuardado}` : `1d20${modTotalGuardado}`;
      ts.dice
        .putDiceInTray([{ name: `Prueba de ${abrev}`, roll: formula }], true)
        .catch((err: unknown) => {
          console.error("Error al lanzar prueba de característica en TaleSpire:", err);
        });
    }
  };

  const ejecutarTiradaSalvacion = () => {
    if (alTirarSalvacion) {
      alTirarSalvacion(caracteristicaClave, tituloMostrar, bonoSalvacionGuardado);
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
    const modExtraFinal = parseInt(modExtraForm, 10) || 0;
    const bonoSalvExtraFinal = parseInt(bonoSalvacionExtraForm, 10) || 0;

    alGuardar(caracteristicaClave, {
      valorBase: baseFinal,
      overrideFijo: overrideFinal,
      competenteSalvacion: competenteSalvacionForm,
      personalizacion: {
        nombrePersonalizado: nombreForm.trim() !== "" ? nombreForm.trim() : undefined,
        descripcionPersonalizada: descForm.trim() !== "" ? descForm.trim() : undefined,
        modificadorExtra: modExtraFinal,
        valorFijo: overrideFinal,
        bonoSalvacionExtra: bonoSalvExtraFinal,
        notas: notasForm
      }
    });

    alCerrar();
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
                {tituloMostrar}
              </h3>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                Puntuación: <strong style={{ color: "#f1f5f9" }}>{valorEfectivoPreview}</strong> (Mod:{" "}
                <strong style={{ color: modTotalPreview >= 0 ? "#60a5fa" : "#fca5a5" }}>
                  {modTotalPreview >= 0 ? `+${modTotalPreview}` : modTotalPreview}
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

          <button type="button" className={estilos.botonCerrarModal} onClick={alCerrar} title="Cerrar">
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
            <Info size={13} />
            Información y Tiradas
          </button>

          <button
            type="button"
            className={`${estilos.pestañaModal} ${pestanaActiva === "personalizar" ? estilos.pestañaModalActiva : ""}`}
            onClick={() => setPestanaActiva("personalizar")}
          >
            <Edit3 size={13} />
            Personalizar
          </button>
        </div>

        {/* PESTAÑA 1: INFORMACIÓN Y TIRADAS */}
        {pestanaActiva === "info" && (
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
                  <span>Bono de Competencia (PB Nivel {personaje.nivel || 1}):</span>
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
            {customExistente?.notas && (
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
                {customExistente.notas}
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
        )}

        {/* PESTAÑA 2: PERSONALIZAR */}
        {pestanaActiva === "personalizar" && (
          <form onSubmit={manejarGuardar} className={estilos.contenidoPestañaModal} style={{ gap: 12 }}>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
              Personaliza el nombre a mostrar, descripción, puntuaciones base, overrides y bonificadores especiales.
            </p>

            {/* Campo Nombre Personalizado */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Nombre Personalizado</label>
              <input
                type="text"
                className={estilos.inputFormulario}
                value={nombreForm}
                onChange={(e) => setNombreForm(e.target.value)}
                placeholder={nombreCarac}
              />
            </div>

            {/* Campo Descripción Personalizada */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Descripción de Usos y Salvaciones</label>
              <textarea
                className={estilos.inputFormulario}
                rows={2}
                value={descForm}
                onChange={(e) => setDescForm(e.target.value)}
                placeholder="Descripción del uso de la característica..."
                style={{ resize: "vertical", fontSize: 11 }}
              />
            </div>

            {/* Puntuación Base con botones +/- y edición libre de texto */}
            <div className={estilos.campoFormulario}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className={estilos.labelFormulario} style={{ color: "#f1f5f9" }}>
                  Puntuación Base Natural (1 - 30)
                </label>
                <span style={{ fontSize: 11, color: "#93c5fd", fontWeight: 700 }}>
                  Mod Base: {modBasePreview >= 0 ? `+${modBasePreview}` : modBasePreview}
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
            </div>

            {/* Override Fijo con Presets Rápidos */}
            <div className={estilos.campoFormulario}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className={estilos.labelFormulario} style={{ color: "#f1f5f9" }}>
                  Override Fijo (Puntuación por Objeto Mágico)
                </label>
                {overrideValidoPreview !== null && (
                  <span style={{ fontSize: 10, color: "#d8b4fe", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                    <Sparkles size={11} /> Activo: {overrideValidoPreview}
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
            </div>

            {/* Fila Modificadores Adicionales (Prueba y Salvación) */}
            <div className={estilos.filaFormulario}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Modificador Extra a Pruebas</label>
                <input
                  type="number"
                  className={estilos.inputFormulario}
                  value={modExtraForm}
                  onChange={(e) => setModExtraForm(e.target.value)}
                  placeholder="+0"
                />
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Bono Extra a Salvaciones</label>
                <input
                  type="number"
                  className={estilos.inputFormulario}
                  value={bonoSalvacionExtraForm}
                  onChange={(e) => setBonoSalvacionExtraForm(e.target.value)}
                  placeholder="+0"
                />
              </div>
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

            {/* Campo Notas */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Notas y Rasgos Especiales</label>
              <textarea
                className={estilos.inputFormulario}
                rows={2}
                value={notasForm}
                onChange={(e) => setNotasForm(e.target.value)}
                placeholder="Añade notas para que no se te escape nada sobre este atributo..."
                style={{ resize: "vertical", fontSize: 11 }}
              />
            </div>

            {/* Botones de Pie */}
            <div className={estilos.pieModal} style={{ marginTop: 4 }}>
              <button type="button" className={estilos.neoButton} onClick={alCerrar}>
                Cancelar
              </button>
              <button
                type="submit"
                className={estilos.neoButton}
                style={{ backgroundColor: "#1e293b", borderColor: "rgba(96, 165, 250, 0.4)", color: "#93c5fd" }}
              >
                <Save size={14} style={{ marginRight: 4 }} />
                Guardar Personalización
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ModalDetalleCaracteristica;

