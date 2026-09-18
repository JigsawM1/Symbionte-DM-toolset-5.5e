import React, { useState } from "react";
import type { PersonajeJugador, Habilidad, GradoCompetencia, PersonalizacionHabilidad } from "@/tipos";
import {
  MAPA_HABILIDAD_A_CARACTERISTICA,
  DESCRIPCIONES_HABILIDADES
} from "@/constantes";
import { tieneMedioBonoHabilidades } from "@/servicios/evaluadorEfectosRasgos";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { X, Info, Edit3, Dices, Save } from "lucide-react";
import estilos from "./HojaPersonaje.module.css";
import estilosHab from "./ModalDetalleHabilidad.module.css";
import estilosModalCarac from "./ModalDetalleCaracteristica.module.css";

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
  const tieneAprendiz = tieneMedioBonoHabilidades(personaje);
  const gradoBase = (personaje.gradosHabilidades?.[habilidadClave] || "ninguna") as GradoCompetencia;
  const gradoActual: GradoCompetencia = gradoBase === "ninguna" && tieneAprendiz ? "medio" : gradoBase;

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

  const opcionesCompetenciaDropdown = [
    {
      valor: "ninguna",
      etiqueta: tieneAprendiz
        ? "Por defecto (Medio bono por Aprendiz de mucho)"
        : "Por defecto (Sin competencia)"
    },
    { valor: "medio", etiqueta: "Medio bono (0.5x PB)" },
    { valor: "competente", etiqueta: "Competencia (1x PB)" },
    { valor: "pericia", etiqueta: "Pericia / Experto (2x PB)" }
  ];

  // Cálculos matemáticos a partir de estadísticas derivadas canónicas
  const statsCalculadas = calcularEstadisticasPersonaje(personaje);
  const pb = statsCalculadas.bonoCompetencia;
  const modCarac = statsCalculadas.modificadores[caracAsociada] ?? 0;

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
    : (statsCalculadas.habilidades[habilidadClave] ?? (modCarac + bonoCompetenciaValor + modExtraNum));

  const tituloMostrar = customExistente?.nombrePersonalizado || nombreHabilidad;
  const descripcionMostrar =
    customExistente?.descripcionPersonalizada || DESCRIPCIONES_HABILIDADES[habilidadClave] || "";

  const manejarGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    const modExtraParsed = parseInt(modExtraForm, 10);
    const valorFijoParsed = valorFijoForm.trim() === "" ? null : parseInt(valorFijoForm, 10);
    const gradoAGuardar = (gradoForm === "ninguna" && tieneAprendiz) ? "medio" : gradoForm;

    alGuardarPersonalizacion(habilidadClave, gradoAGuardar, {
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
        className={`${estilos.cuerpoModal} ${estilosHab.cuerpoModalHabilidad}`}
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
            <Info size={13} className={estilosHab.iconoPestanaHabilidad} />
            Información
          </button>

          <button
            type="button"
            className={`${estilos.botonPestañaModal} ${
              pestanaActiva === "personalizar" ? estilos.botonPestañaModalActiva : ""
            }`}
            onClick={() => setPestanaActiva("personalizar")}
          >
            <Edit3 size={13} className={estilosHab.iconoPestanaHabilidad} />
            Personalizar
          </button>
        </div>

        {/* PESTAÑA 1: INFORMACIÓN */}
        {pestanaActiva === "info" && (
          <div className={`${estilos.contenidoPestañaModal} ${estilosModalCarac.formularioPersonalizarContenedor}`}>
            {/* Cuadro de Descripción */}
            <div className={estilosHab.cajaDescripcionHabilidad}>
              {descripcionMostrar}
            </div>

            <p className={estilosHab.textoDesgloseIntro}>
              Desglose de modificadores que afectan a {tituloMostrar} ({abrevCarac}):
            </p>

            {/* Tabla de Desglose de Modificadores */}
            <div className={estilosHab.tablaDesgloseHabilidad}>
              {tieneValorFijo ? (
                <div className={estilosHab.filaValorFijo}>
                  <span>Valor fijo personalizado</span>
                  <span className={estilosHab.valorFijoNumero}>
                    {totalCalculado}
                  </span>
                </div>
              ) : (
                <>
                  {/* Fila Modificador de Característica */}
                  <div className={estilosHab.filaModCarac}>
                    <span>Modificador {nombreCarac}</span>
                    <span className={modCarac >= 0 ? estilosHab.valorModCaracPositivo : estilosHab.valorModCaracNegativo}>
                      {modCarac >= 0 ? `+${modCarac}` : `${modCarac}`}
                    </span>
                  </div>

                  {/* Fila Grado de Competencia */}
                  <div className={estilosHab.filaCompetenciaHab}>
                    <span>{etiquetaCompetencia}</span>
                    <span className={bonoCompetenciaValor > 0 ? estilosHab.valorCompetenciaConBono : estilosHab.valorCompetenciaSinBono}>
                      {bonoCompetenciaValor >= 0 ? `+${bonoCompetenciaValor}` : `${bonoCompetenciaValor}`}
                    </span>
                  </div>

                  {/* Fila Modificador Extra (si aplica) */}
                  {modExtraNum !== 0 && (
                    <div className={estilosHab.filaModAdicionalHab}>
                      <span>Modificador Adicional</span>
                      <span className={modExtraNum >= 0 ? estilosHab.valorModAdicionalPositivo : estilosHab.valorModAdicionalNegativo}>
                        {modExtraNum >= 0 ? `+${modExtraNum}` : `${modExtraNum}`}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Fila Total */}
              <div className={estilosHab.filaTotalHabilidad}>
                <span>Total Habilidad</span>
                <span className={totalCalculado >= 0 ? estilosHab.valorTotalHabPositivo : estilosHab.valorTotalHabNegativo}>
                  {totalCalculado >= 0 ? `+${totalCalculado}` : `${totalCalculado}`}
                </span>
              </div>
            </div>

            {/* Notas opcionales si existen */}
            {customExistente?.notas && (
              <div className={estilosHab.cajaNotasHabilidad}>
                <strong className={estilosHab.etiquetaNotasHab}>Notas: </strong>
                {customExistente.notas}
              </div>
            )}

            {/* Botón de Tirada 3D */}
            {alTirarHabilidad && (
              <div className={estilosHab.filaBotonTiradaHabilidad}>
                <button
                  type="button"
                  className={estilosHab.botonLanzarTiradaHab}
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
          <form onSubmit={manejarGuardar} className={`${estilos.contenidoPestañaModal} ${estilosModalCarac.formularioPersonalizarContenedor}`}>
            <p className={estilosHab.textoIntroPersonalizarHab}>
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
                className={`${estilos.inputFormulario} ${estilosHab.textareaPersonalizarHab}`}
                rows={3}
                value={descForm}
                onChange={(e) => setDescForm(e.target.value)}
                placeholder="Descripción del uso de la habilidad..."
                spellCheck={false}
              />
            </div>

            <p className={estilosHab.textoIntroValoresHab}>
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
                opciones={opcionesCompetenciaDropdown}
                tamano="normal"
              />
            </div>

            {/* Campo Notas */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Notas</label>
              <textarea
                className={`${estilos.inputFormulario} ${estilosHab.textareaPersonalizarHab}`}
                rows={2}
                value={notasForm}
                onChange={(e) => setNotasForm(e.target.value)}
                placeholder="Añade notas para que no se te escape nada"
                spellCheck={false}
              />
            </div>

            {/* Botones de Pie */}
            <div className={`${estilos.pieModal} ${estilosModalCarac.pieModalMargenTop}`}>
              <button type="button" className={estilos.neoButton} onClick={alCerrar}>
                Cancelar
              </button>
              <button
                type="submit"
                className={`${estilos.neoButton} ${estilosHab.botonGuardarHab}`}
              >
                <Save size={14} className={estilosHab.iconoPestanaHabilidad} />
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
