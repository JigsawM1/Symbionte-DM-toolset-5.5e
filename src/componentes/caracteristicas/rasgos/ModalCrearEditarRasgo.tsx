import React, { useState, useEffect } from "react";
import type { RasgoPersonaje, OrigenRasgo, TipoAccionRasgo, RecuperacionRasgo } from "@/tipos";
import { DOTES_CANONICAS_DND55 } from "@/constantes/rasgosDND55";
import { generarId } from "@/utiles/generarId";
import { Plus, Edit2, X, Check } from "lucide-react";
import estilos from "./VistaRasgosJugador.module.css";

interface ModalCrearEditarRasgoProps {
  rasgoInicial?: RasgoPersonaje | null;
  origenPredeterminado?: OrigenRasgo;
  alGuardar: (rasgo: RasgoPersonaje) => void;
  alCerrar: () => void;
}

export const ModalCrearEditarRasgo: React.FC<ModalCrearEditarRasgoProps> = ({
  rasgoInicial,
  origenPredeterminado = "personalizado",
  alGuardar,
  alCerrar
}) => {
  const esEdicion = !!rasgoInicial;

  const [nombre, setNombre] = useState(rasgoInicial?.nombre || "");
  const [descripcion, setDescripcion] = useState(rasgoInicial?.descripcion || "");
  const [origen, setOrigen] = useState<OrigenRasgo>(rasgoInicial?.origen || origenPredeterminado);
  const [fuente, setFuente] = useState(rasgoInicial?.fuente || (origenPredeterminado === "dote" ? "PHB 2024" : "Homebrew"));
  const [tipoAccion, setTipoAccion] = useState<TipoAccionRasgo>(rasgoInicial?.tipoAccion || "pasivo");
  const [nivelRequerido, setNivelRequerido] = useState<number | undefined>(rasgoInicial?.nivelRequerido);

  const [tieneUsosLimitados, setTieneUsosLimitados] = useState(rasgoInicial?.tieneUsosLimitados || false);
  const [usosMaximos, setUsosMaximos] = useState<number>(rasgoInicial?.usosMaximos || 1);
  const [recuperacion, setRecuperacion] = useState<RecuperacionRasgo>(rasgoInicial?.recuperacion || "descanso_largo");
  const [formulaDados, setFormulaDados] = useState(rasgoInicial?.formulaDados || "");
  const [notas, setNotas] = useState(rasgoInicial?.notas || "");

  // Selector de plantillas de dotes
  const [dotePredefinidaSeleccionada, setDotePredefinidaSeleccionada] = useState<string>("");

  useEffect(() => {
    const manejarEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") alCerrar();
    };
    window.addEventListener("keydown", manejarEscape);
    return () => window.removeEventListener("keydown", manejarEscape);
  }, [alCerrar]);

  const manejarSeleccionarDotePreset = (idDote: string) => {
    setDotePredefinidaSeleccionada(idDote);
    const dote = DOTES_CANONICAS_DND55.find((d) => d.id === idDote);
    if (dote) {
      setNombre(dote.nombre);
      setDescripcion(dote.descripcion);
      setOrigen("dote");
      setFuente(dote.fuente || "PHB 2024");
      setTipoAccion("pasivo");
    }
  };

  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const rasgoFinal: RasgoPersonaje = {
      id: rasgoInicial?.id || generarId("rasgo_hb"),
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      origen,
      fuente: fuente.trim() || "Homebrew",
      tipoAccion,
      nivelRequerido: nivelRequerido && nivelRequerido > 0 ? nivelRequerido : undefined,
      tieneUsosLimitados,
      usosMaximos: tieneUsosLimitados ? Math.max(1, usosMaximos) : undefined,
      usosRestantes: tieneUsosLimitados
        ? (rasgoInicial?.usosRestantes !== undefined ? Math.min(rasgoInicial.usosRestantes, usosMaximos) : usosMaximos)
        : undefined,
      recuperacion: tieneUsosLimitados ? recuperacion : "ninguno",
      formulaDados: formulaDados.trim() || undefined,
      personalizado: true,
      activo: true,
      notas: notas.trim()
    };

    alGuardar(rasgoFinal);
  };

  return (
    <div className={estilos.overlayModal} onClick={alCerrar}>
      <div
        className={estilos.ventanaModal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-rasgo"
      >
        {/* Cabecera */}
        <div className={estilos.cabeceraModal}>
          <h2 id="titulo-modal-rasgo" className={estilos.tituloModal}>
            {esEdicion ? <Edit2 size={16} /> : <Plus size={16} />}
            <span>{esEdicion ? "Editar Rasgo o Dote" : "Añadir Rasgo / Dote Homebrew"}</span>
          </h2>
          <button
            type="button"
            className={estilos.botonLimpiarBusqueda}
            onClick={alCerrar}
            title="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={manejarEnvio} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div className={estilos.cuerpoModal}>
            {/* Opcional: Cargar desde Dotes Canónicas */}
            {!esEdicion && origen === "dote" && (
              <div className={estilos.grupoCampo}>
                <label className={estilos.labelCampo}>
                  Cargar plantilla de Dote oficial D&D 5.5e (Opcional):
                </label>
                <select
                  className={estilos.selectCampo}
                  value={dotePredefinidaSeleccionada}
                  onChange={(e) => manejarSeleccionarDotePreset(e.target.value)}
                >
                  <option value="">-- Seleccionar de la lista canónica --</option>
                  {DOTES_CANONICAS_DND55.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre} ({d.categoria.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Nombre */}
            <div className={estilos.grupoCampo}>
              <label className={estilos.labelCampo}>Nombre del Rasgo o Dote *</label>
              <input
                type="text"
                className={estilos.inputTexto}
                placeholder="Ej. Furia Elemental, Don de la Agilidad..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Fila: Origen y Tipo de Acción */}
            <div className={estilos.filaDosCampos}>
              <div className={estilos.grupoCampo}>
                <label className={estilos.labelCampo}>Categoría / Origen</label>
                <select
                  className={estilos.selectCampo}
                  value={origen}
                  onChange={(e) => setOrigen(e.target.value as OrigenRasgo)}
                >
                  <option value="personalizado">Personalizado / Homebrew</option>
                  <option value="dote">Dote</option>
                  <option value="clase">Clase</option>
                  <option value="subclase">Subclase</option>
                  <option value="especie">Especie / Raza</option>
                  <option value="trasfondo">Trasfondo</option>
                </select>
              </div>

              <div className={estilos.grupoCampo}>
                <label className={estilos.labelCampo}>Tipo de Acción</label>
                <select
                  className={estilos.selectCampo}
                  value={tipoAccion}
                  onChange={(e) => setTipoAccion(e.target.value as TipoAccionRasgo)}
                >
                  <option value="pasivo">Pasivo (Permanente)</option>
                  <option value="accion">Acción Principal</option>
                  <option value="accion_adicional">Acción Adicional</option>
                  <option value="reaccion">Reacción</option>
                  <option value="especial">Especial / Variable</option>
                </select>
              </div>
            </div>

            {/* Fila: Fuente y Nivel Requerido */}
            <div className={estilos.filaDosCampos}>
              <div className={estilos.grupoCampo}>
                <label className={estilos.labelCampo}>Fuente o Etiqueta</label>
                <input
                  type="text"
                  className={estilos.inputTexto}
                  placeholder="Ej. Homebrew, PHB 2024, Nivel 3..."
                  value={fuente}
                  onChange={(e) => setFuente(e.target.value)}
                />
              </div>

              <div className={estilos.grupoCampo}>
                <label className={estilos.labelCampo}>Nivel Requerido (Opcional)</label>
                <input
                  type="number"
                  className={estilos.inputTexto}
                  min={1}
                  max={20}
                  placeholder="Ej. 1, 4, 8..."
                  value={nivelRequerido || ""}
                  onChange={(e) => setNivelRequerido(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>

            {/* Checkbox de Usos Limitados */}
            <label className={estilos.filaCheckbox}>
              <input
                type="checkbox"
                checked={tieneUsosLimitados}
                onChange={(e) => setTieneUsosLimitados(e.target.checked)}
              />
              <span>Este rasgo tiene usos limitados o cargas recuperables</span>
            </label>

            {/* Campos condicionales de Usos Limitados */}
            {tieneUsosLimitados && (
              <div className={estilos.filaDosCampos}>
                <div className={estilos.grupoCampo}>
                  <label className={estilos.labelCampo}>Usos Máximos</label>
                  <input
                    type="number"
                    className={estilos.inputTexto}
                    min={1}
                    max={99}
                    value={usosMaximos}
                    onChange={(e) => setUsosMaximos(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>

                <div className={estilos.grupoCampo}>
                  <label className={estilos.labelCampo}>Recuperación de Usos</label>
                  <select
                    className={estilos.selectCampo}
                    value={recuperacion}
                    onChange={(e) => setRecuperacion(e.target.value as RecuperacionRasgo)}
                  >
                    <option value="descanso_corto">Descanso Corto (y Largo)</option>
                    <option value="descanso_largo">Solo Descanso Largo</option>
                    <option value="manual">Manual / Otro</option>
                  </select>
                </div>
              </div>
            )}

            {/* Fórmula de Dados (Opcional) */}
            <div className={estilos.grupoCampo}>
              <label className={estilos.labelCampo}>
                Fórmula de Dados a TaleSpire (Opcional)
              </label>
              <input
                type="text"
                className={estilos.inputTexto}
                placeholder="Ej. 1d10, 2d6, 1d8+2..."
                value={formulaDados}
                onChange={(e) => setFormulaDados(e.target.value)}
              />
            </div>

            {/* Descripción */}
            <div className={estilos.grupoCampo}>
              <label className={estilos.labelCampo}>Descripción Completa</label>
              <textarea
                className={estilos.textareaCampo}
                placeholder="Explica detalladamente los efectos y reglas del rasgo..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            {/* Notas */}
            <div className={estilos.grupoCampo}>
              <label className={estilos.labelCampo}>Notas Personales / DM</label>
              <input
                type="text"
                className={estilos.inputTexto}
                placeholder="Anotaciones tácticas, recordatorios..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>
          </div>

          {/* Pie */}
          <div className={estilos.pieModal}>
            <button
              type="button"
              className={estilos.botonAccion}
              onClick={alCerrar}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${estilos.botonAccion} ${estilos.botonAccionPrimario}`}
              disabled={!nombre.trim()}
            >
              <Check size={14} />
              <span>{esEdicion ? "Guardar Cambios" : "Crear Rasgo"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
