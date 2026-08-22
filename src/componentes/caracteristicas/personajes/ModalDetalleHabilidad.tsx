import React, { useState } from "react";
import type { PersonajeJugador, Habilidad, GradoCompetencia, PersonalizacionHabilidad } from "@/tipos";
import {
  MAPA_HABILIDAD_A_CARACTERISTICA,
  DESCRIPCIONES_HABILIDADES,
  obtenerBonoCompetenciaPorNivel
} from "@/constantes";
import { calcularModificadorCaracteristica } from "@/servicios/procesadorDescansos";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { X, Info, Edit3, Dices, Save } from "lucide-react";
import estilos from "./HojaPersonaje.module.css";

interface ModalDetalleHabilidadProps {
  habilidadClave: Habilidad;
  nombreHabilidad: string;
  personaje: PersonajeJugador;
  alCerrar: () => void;
  alTirarHabilidad?: (hab: Habilidad, nombre: string, bono: number) => void;
  alGuardarPersonalizacion: (
    hab: Habilidad,
    grado: GradoCompetencia,
    personalizacion: Partial<PersonalizacionHabilidad>
  ) => void;
}

const OPCIONES_COMPETENCIA_DROPDOWN = [
  { valor: "ninguna", etiqueta: "Por defecto (Sin competencia)" },
  { valor: "medio", etiqueta: "Medio bono (0.5x PB)" },
  { valor: "competente", etiqueta: "Competencia (1x PB)" },
  { valor: "pericia", etiqueta: "Pericia / Experto (2x PB)" }
];

const ABREVIATURA_CARAC: Record<string, string> = {
  fuerza: "Fue",
  destreza: "Des",
  constitucion: "Con",
  inteligencia: "Int",
  sabiduria: "Sab",
  carisma: "Car"
};

const NOMBRE_COMPLETO_CARAC: Record<string, string> = {
  fuerza: "Fuerza",
  destreza: "Destreza",
  constitucion: "Constitución",
  inteligencia: "Inteligencia",
  sabiduria: "Sabiduría",
  carisma: "Carisma"
};

export const ModalDetalleHabilidad: React.FC<ModalDetalleHabilidadProps> = ({
  habilidadClave,
  nombreHabilidad,
  personaje,
  alCerrar,
  alTirarHabilidad,
  alGuardarPersonalizacion
}) => {
  const [pestanaActiva, setPestanaActiva] = useState<"info" | "personalizar">("info");

  const caracAsociada = MAPA_HABILIDAD_A_CARACTERISTICA[habilidadClave] || "destreza";
  const abrevCarac = ABREVIATURA_CARAC[caracAsociada] || "Des";
  const nombreCarac = NOMBRE_COMPLETO_CARAC[caracAsociada] || "Destreza";

  const customExistente = personaje.personalizacionesHabilidades?.[habilidadClave];
  const gradoActual = (personaje.gradosHabilidades?.[habilidadClave] || "ninguna") as GradoCompetencia;

  // Estado del formulario de personalización
  const [nombreForm, setNombreForm] = useState(customExistente?.nombrePersonalizado ?? "");
  const [descForm, setDescForm] = useState(
    customExistente?.descripcionPersonalizada ?? DESCRIPCIONES_HABILIDADES[habilidadClave] ?? ""
  );
  const [modExtraForm, setModExtraForm] = useState<string>(
    customExistente?.modificadorExtra !== undefined && customExistente.modificadorExtra !== 0
      ? String(customExistente.modificadorExtra)
      : ""
  );
  const [valorFijoForm, setValorFijoForm] = useState<string>(
    customExistente?.valorFijo !== null && customExistente?.valorFijo !== undefined
      ? String(customExistente.valorFijo)
      : ""
  );
  const [gradoForm, setGradoForm] = useState<GradoCompetencia>(gradoActual);
  const [notasForm, setNotasForm] = useState(customExistente?.notas ?? "");

  // Cálculos matemáticos en tiempo real
  const pb = obtenerBonoCompetenciaPorNivel(personaje.nivel || 1);
  const valorCarac =
    personaje.overridesFijos?.[caracAsociada] ?? personaje.caracteristicas?.[caracAsociada] ?? 10;
  const modCarac = calcularModificadorCaracteristica(valorCarac);

  let bonoCompetenciaValor = 0;
  let etiquetaCompetencia = "Sin competencia";
  if (gradoActual === "competente") {
    bonoCompetenciaValor = pb;
    etiquetaCompetencia = `Competencia (+${pb})`;
  } else if (gradoActual === "pericia") {
    bonoCompetenciaValor = pb * 2;
    etiquetaCompetencia = `Pericia (+${pb * 2})`;
  } else if (gradoActual === "medio") {
    bonoCompetenciaValor = Math.floor(pb / 2);
    etiquetaCompetencia = `Medio bono (+${Math.floor(pb / 2)})`;
  }

  const modExtraNum = customExistente?.modificadorExtra || 0;
  const tieneValorFijo = customExistente?.valorFijo !== null && customExistente?.valorFijo !== undefined;
  const totalCalculado = tieneValorFijo
    ? customExistente!.valorFijo!
    : modCarac + bonoCompetenciaValor + modExtraNum;

  const tituloMostrar = customExistente?.nombrePersonalizado || nombreHabilidad;
  const descripcionMostrar =
    customExistente?.descripcionPersonalizada || DESCRIPCIONES_HABILIDADES[habilidadClave] || "";

  const manejarGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    const modExtraParsed = parseInt(modExtraForm, 10);
    const valorFijoParsed = valorFijoForm.trim() === "" ? null : parseInt(valorFijoForm, 10);

    alGuardarPersonalizacion(habilidadClave, gradoForm, {
      nombrePersonalizado: nombreForm.trim() !== "" ? nombreForm.trim() : undefined,
      descripcionPersonalizada: descForm.trim() !== "" ? descForm.trim() : undefined,
      modificadorExtra: isNaN(modExtraParsed) ? 0 : modExtraParsed,
      valorFijo: valorFijoParsed !== null && !isNaN(valorFijoParsed) ? valorFijoParsed : null,
      notas: notasForm
    });

    alCerrar();
  };

  return (
    <div className={estilos.overlayModal} onClick={alCerrar}>
      <div
        className={estilos.cuerpoModal}
        style={{ maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Inspector */}
        <div className={estilos.cabeceraModal}>
          <span className={estilos.tituloModal}>
            {tituloMostrar} ({abrevCarac})
          </span>
          <button
            type="button"
            className={estilos.botonConfigurarPj}
            onClick={alCerrar}
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra de Sub-pestañas */}
        <div className={estilos.barraPestañasModal}>
          <button
            type="button"
            className={`${estilos.botonPestañaModal} ${
              pestanaActiva === "info" ? estilos.botonPestañaModalActiva : ""
            }`}
            onClick={() => setPestanaActiva("info")}
          >
            <Info size={13} style={{ marginRight: 4 }} />
            Información
          </button>

          <button
            type="button"
            className={`${estilos.botonPestañaModal} ${
              pestanaActiva === "personalizar" ? estilos.botonPestañaModalActiva : ""
            }`}
            onClick={() => setPestanaActiva("personalizar")}
          >
            <Edit3 size={13} style={{ marginRight: 4 }} />
            Personalizar
          </button>
        </div>

        {/* PESTAÑA 1: INFORMACIÓN */}
        {pestanaActiva === "info" && (
          <div className={estilos.contenidoPestañaModal} style={{ gap: 12 }}>
            {/* Cuadro de Descripción */}
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 6,
                fontSize: 12,
                lineHeight: 1.45,
                color: "#cbd5e1",
                backgroundColor: "#0d131f",
                borderLeft: "3px solid #334155",
                border: "1px solid rgba(148, 163, 184, 0.1)"
              }}
            >
              {descripcionMostrar}
            </div>

            <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0 0" }}>
              Desglose de modificadores que afectan a {tituloMostrar} ({abrevCarac}):
            </p>

            {/* Tabla de Desglose de Modificadores */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                backgroundColor: "#0a0e16",
                border: "1px solid rgba(148, 163, 184, 0.12)",
                borderRadius: 6,
                overflow: "hidden"
              }}
            >
              {tieneValorFijo ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    fontSize: 12,
                    color: "#d8b4fe",
                    backgroundColor: "#201335"
                  }}
                >
                  <span>Valor fijo personalizado</span>
                  <span style={{ fontWeight: 700, fontFamily: "monospace" }}>
                    {totalCalculado}
                  </span>
                </div>
              ) : (
                <>
                  {/* Fila Modificador de Característica */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      fontSize: 12,
                      color: "#cbd5e1",
                      backgroundColor: "rgba(255, 255, 255, 0.02)"
                    }}
                  >
                    <span>Modificador {nombreCarac}</span>
                    <span style={{ fontWeight: 700, fontFamily: "monospace", color: modCarac >= 0 ? "#60a5fa" : "#fca5a5" }}>
                      {modCarac >= 0 ? `+${modCarac}` : `${modCarac}`}
                    </span>
                  </div>

                  {/* Fila Grado de Competencia */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      fontSize: 12,
                      color: "#cbd5e1",
                      borderTop: "1px solid rgba(148, 163, 184, 0.1)"
                    }}
                  >
                    <span>{etiquetaCompetencia}</span>
                    <span style={{ fontWeight: 700, fontFamily: "monospace", color: bonoCompetenciaValor > 0 ? "#93c5fd" : "#94a3b8" }}>
                      {bonoCompetenciaValor >= 0 ? `+${bonoCompetenciaValor}` : `${bonoCompetenciaValor}`}
                    </span>
                  </div>

                  {/* Fila Modificador Extra (si aplica) */}
                  {modExtraNum !== 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        fontSize: 12,
                        color: "#cbd5e1",
                        borderTop: "1px solid rgba(148, 163, 184, 0.1)"
                      }}
                    >
                      <span>Modificador Adicional</span>
                      <span style={{ fontWeight: 700, fontFamily: "monospace", color: modExtraNum >= 0 ? "#60a5fa" : "#fca5a5" }}>
                        {modExtraNum >= 0 ? `+${modExtraNum}` : `${modExtraNum}`}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Fila Total */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#f1f5f9",
                  backgroundColor: "#18202e",
                  borderTop: "1px solid rgba(148, 163, 184, 0.18)"
                }}
              >
                <span>Total Habilidad</span>
                <span style={{ color: totalCalculado >= 0 ? "#93c5fd" : "#fca5a5", fontFamily: "monospace" }}>
                  {totalCalculado >= 0 ? `+${totalCalculado}` : `${totalCalculado}`}
                </span>
              </div>
            </div>

            {/* Notas opcionales si existen */}
            {customExistente?.notas && (
              <div
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  padding: "6px 10px",
                  borderRadius: 4,
                  backgroundColor: "#0d121c",
                  border: "1px dashed rgba(148, 163, 184, 0.2)"
                }}
              >
                <strong style={{ color: "#cbd5e1" }}>Notas: </strong>
                {customExistente.notas}
              </div>
            )}

            {/* Botón de Tirada 3D */}
            {alTirarHabilidad && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                <button
                  type="button"
                  style={{
                    backgroundColor: "#18202f",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    color: "#cbd5e1",
                    padding: "6px 12px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                  onClick={() => {
                    alTirarHabilidad(habilidadClave, tituloMostrar, totalCalculado);
                    alCerrar();
                  }}
                >
                  <Dices size={14} color="#94a3b8" />
                  Lanzar Tirada 3D ({totalCalculado >= 0 ? `+${totalCalculado}` : totalCalculado})
                </button>
              </div>
            )}
          </div>
        )}


        {/* PESTAÑA 2: PERSONALIZAR */}
        {pestanaActiva === "personalizar" && (
          <form onSubmit={manejarGuardar} className={estilos.contenidoPestañaModal} style={{ gap: 10 }}>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
              Puedes personalizar el nombre y la descripción a mostrar.
            </p>

            {/* Campo Nombre */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Nombre</label>
              <input
                type="text"
                className={estilos.inputFormulario}
                value={nombreForm}
                onChange={(e) => setNombreForm(e.target.value)}
                placeholder={nombreHabilidad}
              />
            </div>

            {/* Campo Descripción */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Descripción</label>
              <textarea
                className={estilos.inputFormulario}
                rows={3}
                value={descForm}
                onChange={(e) => setDescForm(e.target.value)}
                placeholder="Descripción del uso de la habilidad..."
                style={{ resize: "vertical", fontSize: 11 }}
              />
            </div>

            <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0 0" }}>
              Ajusta el valor añadiendo un modificador o estableciendo un valor fijo.
            </p>

            {/* Fila Modificador / Valor Fijo */}
            <div className={estilos.filaFormulario}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Modificador</label>
                <input
                  type="number"
                  className={estilos.inputFormulario}
                  value={modExtraForm}
                  onChange={(e) => setModExtraForm(e.target.value)}
                  placeholder="Añade un modificador adic..."
                />
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Valor fijo</label>
                <input
                  type="number"
                  className={estilos.inputFormulario}
                  value={valorFijoForm}
                  onChange={(e) => setValorFijoForm(e.target.value)}
                  placeholder="Establece un valor fijo"
                />
              </div>
            </div>

            {/* Campo Competencia */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Competencia</label>
              <SelectorDesplegable
                valor={gradoForm}
                alCambiar={(val) => setGradoForm(val as GradoCompetencia)}
                opciones={OPCIONES_COMPETENCIA_DROPDOWN}
                tamano="normal"
              />
            </div>

            {/* Campo Notas */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Notas</label>
              <textarea
                className={estilos.inputFormulario}
                rows={2}
                value={notasForm}
                onChange={(e) => setNotasForm(e.target.value)}
                placeholder="Añade notas para que no se te escape nada"
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
                Guardar
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default ModalDetalleHabilidad;
