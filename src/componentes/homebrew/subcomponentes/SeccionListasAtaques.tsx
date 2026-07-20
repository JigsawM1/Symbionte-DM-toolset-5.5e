import React from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { RasgoBase, AccionMonstruo, AccionRapida } from "../../../tipos";
import estilos from "../FormularioCriatura.module.css";

interface SeccionListasAtaquesProps {
  monstruoForm: {
    accionesRapidas?: AccionRapida[];
    rasgos?: RasgoBase[];
    acciones?: AccionMonstruo[];
    reacciones?: RasgoBase[];
    accionesLegendarias?: RasgoBase[];
  };
  
  // Ataques Rápidos
  tQNombre: string; setTQNombre: (v: string) => void;
  tQBono: string; setTQBono: (v: string) => void;
  tQDados: string; setTQDados: (v: string) => void;
  tQTipo: string; setTQTipo: (v: string) => void;
  quickActionEdicionIdx: number | null;
  agregarQuickAction: () => void;
  iniciarEditarQuickAction: (idx: number) => void;
  cancelarEditarQuickAction: () => void;
  eliminarQuickActionIdx: (idx: number) => void;

  // Rasgos
  tRasgoNombre: string; setTRasgoNombre: (v: string) => void;
  tRasgoDesc: string; setTRasgoDesc: (v: string) => void;
  tRasgoUso: string; setTRasgoUso: (v: string) => void;
  rasgoEdicionIdx: number | null;
  agregarRasgo: () => void;
  iniciarEditarRasgo: (idx: number) => void;
  cancelarEditarRasgo: () => void;
  eliminarRasgoIdx: (idx: number) => void;

  // Acciones
  tAccionNombre: string; setTAccionNombre: (v: string) => void;
  tAccionDesc: string; setTAccionDesc: (v: string) => void;
  tAccionBono: string; setTAccionBono: (v: string) => void;
  tAccionDaño: string; setTAccionDaño: (v: string) => void;
  tAccionUso: string; setTAccionUso: (v: string) => void;
  accionEdicionIdx: number | null;
  agregarAccion: () => void;
  iniciarEditarAccion: (idx: number) => void;
  cancelarEditarAccion: () => void;
  eliminarAccionIdx: (idx: number) => void;

  // Reacciones
  tReaccionNombre: string; setTReaccionNombre: (v: string) => void;
  tReaccionDesc: string; setTReaccionDesc: (v: string) => void;
  tReaccionUso: string; setTReaccionUso: (v: string) => void;
  reaccionEdicionIdx: number | null;
  agregarReaccion: () => void;
  iniciarEditarReaccion: (idx: number) => void;
  cancelarEditarReaccion: () => void;
  eliminarReaccionIdx: (idx: number) => void;

  // Legendarias
  tLegendariaNombre: string; setTLegendariaNombre: (v: string) => void;
  tLegendariaDesc: string; setTLegendariaDesc: (v: string) => void;
  tLegendariaUso: string; setTLegendariaUso: (v: string) => void;
  legendariaEdicionIdx: number | null;
  agregarLegendaria: () => void;
  iniciarEditarLegendaria: (idx: number) => void;
  cancelarEditarLegendaria: () => void;
  eliminarLegendariaIdx: (idx: number) => void;
}

/** Calcula el número de filas necesarias para mostrar todo el texto sin scroll */
const calcFilas = (valor: string, minFilas = 2, maxFilas = 20): number => {
  if (!valor) return minFilas;
  const lineas = valor.split("\n").length;
  const porLongitud = Math.ceil(valor.length / 80);
  return Math.min(maxFilas, Math.max(minFilas, lineas, porLongitud));
};

export const SeccionListasAtaques: React.FC<SeccionListasAtaquesProps> = ({
  monstruoForm,
  tQNombre, setTQNombre,
  tQBono, setTQBono,
  tQDados, setTQDados,
  tQTipo, setTQTipo,
  quickActionEdicionIdx,
  agregarQuickAction,
  iniciarEditarQuickAction,
  cancelarEditarQuickAction,
  eliminarQuickActionIdx,
  tRasgoNombre, setTRasgoNombre,
  tRasgoDesc, setTRasgoDesc,
  tRasgoUso, setTRasgoUso,
  rasgoEdicionIdx,
  agregarRasgo,
  iniciarEditarRasgo,
  cancelarEditarRasgo,
  eliminarRasgoIdx,
  tAccionNombre, setTAccionNombre,
  tAccionDesc, setTAccionDesc,
  tAccionBono, setTAccionBono,
  tAccionDaño, setTAccionDaño,
  tAccionUso, setTAccionUso,
  accionEdicionIdx,
  agregarAccion,
  iniciarEditarAccion,
  cancelarEditarAccion,
  eliminarAccionIdx,
  tReaccionNombre, setTReaccionNombre,
  tReaccionDesc, setTReaccionDesc,
  tReaccionUso, setTReaccionUso,
  reaccionEdicionIdx,
  agregarReaccion,
  iniciarEditarReaccion,
  cancelarEditarReaccion,
  eliminarReaccionIdx,
  tLegendariaNombre, setTLegendariaNombre,
  tLegendariaDesc, setTLegendariaDesc,
  tLegendariaUso, setTLegendariaUso,
  legendariaEdicionIdx,
  agregarLegendaria,
  iniciarEditarLegendaria,
  cancelarEditarLegendaria,
  eliminarLegendariaIdx
}) => {
  return (
    <div className={estilos.seccionContenido}>
      {/* ATAQUES RÁPIDOS*/}
      <div className={estilos.bloqueDinamicoForm}>
        <div className={estilos.tituloBloqueDinamico}>
          {quickActionEdicionIdx !== null
            ? "EDITANDO ATAQUE RÁPIDO"
            : `ATAQUES RÁPIDOS (${monstruoForm.accionesRapidas?.length || 0})`}
        </div>
        <div className={estilos.camposDinamicosGrupo}>
          <div className={estilos.filaCamposAlineados}>
            <input
              type="text"
              value={tQNombre}
              onChange={(e) => setTQNombre(e.target.value)}
              placeholder="Nombre (ej. Mordisco)"
              className={estilos.inputDinamicoMediano}
            />
            <input
              type="text"
              value={tQBono}
              onChange={(e) => setTQBono(e.target.value)}
              placeholder="Bono (+5)"
              className={estilos.inputDinamicoMini}
            />
            <input
              type="text"
              value={tQDados}
              onChange={(e) => setTQDados(e.target.value)}
              placeholder="Dados (2d6+3)"
              className={estilos.inputDinamicoMini}
            />
            <select
              value={tQTipo}
              onChange={(e) => setTQTipo(e.target.value)}
              className={estilos.selectDinamicoMini}
            >
              <option value="ácido">Ácido</option>
              <option value="fuego">Fuego</option>
              <option value="frío">Frío</option>
              <option value="relámpago">Relámpago</option>
              <option value="trueno">Trueno</option>
              <option value="veneno">Veneno</option>
              <option value="fuerza_daño">Fuerza</option>
              <option value="radiante">Radiante</option>
              <option value="necrótico">Necrótico</option>
              <option value="psíquico">Psíquico</option>
              <option value="perforante">Perforante</option>
              <option value="perforante mágico">Perforante Mágico</option>
              <option value="cortante">Cortante</option>
              <option value="cortante mágico">Cortante Mágico</option>
              <option value="contundente">Contundente</option>
              <option value="contundente mágico">Contundente Mágico</option>
            </select>
            <button
              type="button"
              onClick={agregarQuickAction}
              className={estilos.botonAgregarDinamico}
              style={{
                backgroundColor: quickActionEdicionIdx !== null ? "var(--color-exito)" : undefined
              }}
              title={quickActionEdicionIdx !== null ? "Guardar Cambios" : "Agregar Ataque Rápido"}
            >
              <Plus size={16} />
            </button>
            {quickActionEdicionIdx !== null && (
              <button
                type="button"
                onClick={cancelarEditarQuickAction}
                className={estilos.botonAgregarDinamico}
                style={{
                  backgroundColor: "var(--color-daño)"
                }}
                title="Cancelar Edición"
              >
                ✕
              </button>
            )}
          </div>
          {/* Lista previsualizada */}
          {monstruoForm.accionesRapidas && monstruoForm.accionesRapidas.length > 0 && (
            <div className={estilos.listaDinamicaVisual}>
              {monstruoForm.accionesRapidas.map((qa, idx) => (
                <div key={`qa_v_${idx}`} className={estilos.itemDinamicoVisual}>
                  <span>
                    <strong>{qa.nombre}</strong>: {qa.bonificadorAtaque} | {qa.dadosDaño} ({qa.tipoDaño})
                  </span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => iniciarEditarQuickAction(idx)}
                      className={estilos.botonEliminarDinamico}
                      style={{ color: "var(--color-borde-cian)" }}
                      title="Editar Ataque Rápido"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarQuickActionIdx(idx)}
                      className={estilos.botonEliminarDinamico}
                      title="Eliminar Ataque Rápido"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RASGOS PASIVOS */}
      <div className={estilos.bloqueDinamicoForm}>
        <div className={estilos.tituloBloqueDinamico}>
          {rasgoEdicionIdx !== null
            ? "EDITANDO RASGO PASIVO"
            : `RASGOS Y HABILIDADES PASIVAS (${monstruoForm.rasgos?.length || 0})`}
        </div>
        <div className={estilos.camposDinamicosGrupo}>
          <input
            type="text"
            value={tRasgoNombre}
            onChange={(e) => setTRasgoNombre(e.target.value)}
            placeholder="Nombre del rasgo"
            className={estilos.inputDinamicoLargo}
          />
          <input
            type="text"
            value={tRasgoUso}
            onChange={(e) => setTRasgoUso(e.target.value)}
            placeholder="Uso opcional (ej. 3/día)"
            className={estilos.inputDinamicoMediano}
          />
          <textarea
            value={tRasgoDesc}
            onChange={(e) => setTRasgoDesc(e.target.value)}
            placeholder="Descripción detallada del rasgo..."
            className={estilos.textareaDinamico}
            rows={calcFilas(tRasgoDesc, 3)}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={agregarRasgo}
              className={estilos.botonAgregarCompleto}
              style={{
                flex: 1,
                backgroundColor: rasgoEdicionIdx !== null ? "var(--color-exito)" : undefined
              }}
            >
              {rasgoEdicionIdx !== null ? "Guardar Cambios del Rasgo" : "Agregar Rasgo"}
            </button>
            {rasgoEdicionIdx !== null && (
              <button
                type="button"
                onClick={cancelarEditarRasgo}
                className={estilos.botonAgregarCompleto}
                style={{
                  width: "100px",
                  backgroundColor: "var(--color-daño)"
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
        {/* Lista pasivos */}
        {monstruoForm.rasgos && monstruoForm.rasgos.length > 0 && (
          <div className={estilos.listaDinamicaVisual}>
            {monstruoForm.rasgos.map((r, idx) => (
              <div key={`r_v_${idx}`} className={estilos.itemDinamicoVisual}>
                <div style={{ flex: 1, marginRight: "10px" }}>
                  <strong>
                    {r.nombre} {r.uso ? `(${r.uso})` : ""}
                  </strong>
                  :
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--color-texto-secundario)",
                      whiteSpace: "pre-wrap"
                    }}
                  >
                    {r.descripcion}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => iniciarEditarRasgo(idx)}
                    className={estilos.botonEliminarDinamico}
                    style={{ color: "var(--color-borde-cian)" }}
                    title="Editar Rasgo"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarRasgoIdx(idx)}
                    className={estilos.botonEliminarDinamico}
                    title="Eliminar Rasgo"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACCIONES Y ATAQUES */}
      <div className={estilos.bloqueDinamicoForm}>
        <div className={estilos.tituloBloqueDinamico}>
          {accionEdicionIdx !== null
            ? "EDITANDO ACCIÓN PRINCIPAL"
            : `ACCIONES Y ATAQUES PRINCIPALES (${monstruoForm.acciones?.length || 0})`}
        </div>
        <div className={estilos.camposDinamicosGrupo}>
          <div className={estilos.filaCamposAlineados}>
            <input
              type="text"
              value={tAccionNombre}
              onChange={(e) => setTAccionNombre(e.target.value)}
              placeholder="Nombre de la acción"
              className={estilos.inputDinamicoMediano}
            />
            <input
              type="text"
              value={tAccionBono}
              onChange={(e) => setTAccionBono(e.target.value)}
              placeholder="Bono (+5)"
              className={estilos.inputDinamicoMini}
            />
            <input
              type="text"
              value={tAccionDaño}
              onChange={(e) => setTAccionDaño(e.target.value)}
              placeholder="Daño (1d8+3)"
              className={estilos.inputDinamicoMini}
            />
            <input
              type="text"
              value={tAccionUso}
              onChange={(e) => setTAccionUso(e.target.value)}
              placeholder="Recarga (5-6)"
              className={estilos.inputDinamicoMini}
            />
          </div>
          <textarea
            value={tAccionDesc}
            onChange={(e) => setTAccionDesc(e.target.value)}
            placeholder="Descripción detallada de la acción o ataque..."
            className={estilos.textareaDinamico}
            rows={calcFilas(tAccionDesc, 3)}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={agregarAccion}
              className={estilos.botonAgregarCompleto}
              style={{
                flex: 1,
                backgroundColor: accionEdicionIdx !== null ? "var(--color-exito)" : undefined
              }}
            >
              {accionEdicionIdx !== null ? "Guardar Cambios de la Acción" : "Agregar Acción"}
            </button>
            {accionEdicionIdx !== null && (
              <button
                type="button"
                onClick={cancelarEditarAccion}
                className={estilos.botonAgregarCompleto}
                style={{
                  width: "100px",
                  backgroundColor: "var(--color-daño)"
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
        {/* Lista acciones */}
        {monstruoForm.acciones && monstruoForm.acciones.length > 0 && (
          <div className={estilos.listaDinamicaVisual}>
            {monstruoForm.acciones.map((a, idx) => (
              <div key={`a_v_${idx}`} className={estilos.itemDinamicoVisual}>
                <div style={{ flex: 1, marginRight: "10px" }}>
                  <strong>
                    {a.nombre} {a.uso ? `(${a.uso})` : ""}
                  </strong>
                  :
                  <span style={{ fontSize: "11px", marginLeft: "5px", color: "var(--color-borde-cian)" }}>
                    {a.bonificadorAtaque ? `+${a.bonificadorAtaque}` : ""} {a.daño ? `| ${a.daño}` : ""}
                  </span>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--color-texto-secundario)",
                      whiteSpace: "pre-wrap"
                    }}
                  >
                    {a.descripcion}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => iniciarEditarAccion(idx)}
                    className={estilos.botonEliminarDinamico}
                    style={{ color: "var(--color-borde-cian)" }}
                    title="Editar Acción"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarAccionIdx(idx)}
                    className={estilos.botonEliminarDinamico}
                    title="Eliminar Acción"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REACCIONES */}
      <div className={estilos.bloqueDinamicoForm}>
        <div className={estilos.tituloBloqueDinamico}>
          {reaccionEdicionIdx !== null ? "EDITANDO REACCIÓN" : `REACCIONES (${monstruoForm.reacciones?.length || 0})`}
        </div>
        <div className={estilos.camposDinamicosGrupo}>
          <input
            type="text"
            value={tReaccionNombre}
            onChange={(e) => setTReaccionNombre(e.target.value)}
            placeholder="Nombre de la reacción"
            className={estilos.inputDinamicoLargo}
          />
          <input
            type="text"
            value={tReaccionUso}
            onChange={(e) => setTReaccionUso(e.target.value)}
            placeholder="Uso opcional (ej. 1/ronda)"
            className={estilos.inputDinamicoMediano}
          />
          <textarea
            value={tReaccionDesc}
            onChange={(e) => setTReaccionDesc(e.target.value)}
            placeholder="Descripción detallada de la reacción..."
            className={estilos.textareaDinamico}
            rows={calcFilas(tReaccionDesc, 3)}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={agregarReaccion}
              className={estilos.botonAgregarCompleto}
              style={{
                flex: 1,
                backgroundColor: reaccionEdicionIdx !== null ? "var(--color-exito)" : undefined
              }}
            >
              {reaccionEdicionIdx !== null ? "Guardar Cambios de la Reacción" : "Agregar Reacción"}
            </button>
            {reaccionEdicionIdx !== null && (
              <button
                type="button"
                onClick={cancelarEditarReaccion}
                className={estilos.botonAgregarCompleto}
                style={{
                  width: "100px",
                  backgroundColor: "var(--color-daño)"
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
        {/* Lista reacciones */}
        {monstruoForm.reacciones && monstruoForm.reacciones.length > 0 && (
          <div className={estilos.listaDinamicaVisual}>
            {monstruoForm.reacciones.map((r, idx) => (
              <div key={`rec_v_${idx}`} className={estilos.itemDinamicoVisual}>
                <div style={{ flex: 1, marginRight: "10px" }}>
                  <strong>
                    {r.nombre} {r.uso ? `(${r.uso})` : ""}
                  </strong>
                  :
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--color-texto-secundario)",
                      whiteSpace: "pre-wrap"
                    }}
                  >
                    {r.descripcion}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => iniciarEditarReaccion(idx)}
                    className={estilos.botonEliminarDinamico}
                    style={{ color: "var(--color-borde-cian)" }}
                    title="Editar Reacción"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarReaccionIdx(idx)}
                    className={estilos.botonEliminarDinamico}
                    title="Eliminar Reacción"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACCIONES LEGENDARIAS */}
      <div className={estilos.bloqueDinamicoForm}>
        <div className={estilos.tituloBloqueDinamico}>
          {legendariaEdicionIdx !== null
            ? "EDITANDO ACCIÓN LEGENDARIA"
            : `ACCIONES LEGENDARIAS (${monstruoForm.accionesLegendarias?.length || 0})`}
        </div>
        <div className={estilos.camposDinamicosGrupo}>
          <input
            type="text"
            value={tLegendariaNombre}
            onChange={(e) => setTLegendariaNombre(e.target.value)}
            placeholder="Nombre de la acción legendaria"
            className={estilos.inputDinamicoLargo}
          />
          <input
            type="text"
            value={tLegendariaUso}
            onChange={(e) => setTLegendariaUso(e.target.value)}
            placeholder="Costo en acciones (ej. consume 2 acciones)"
            className={estilos.inputDinamicoMediano}
          />
          <textarea
            value={tLegendariaDesc}
            onChange={(e) => setTLegendariaDesc(e.target.value)}
            placeholder="Descripción detallada de la acción legendaria..."
            className={estilos.textareaDinamico}
            rows={calcFilas(tLegendariaDesc, 3)}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={agregarLegendaria}
              className={estilos.botonAgregarCompleto}
              style={{
                flex: 1,
                backgroundColor: legendariaEdicionIdx !== null ? "var(--color-exito)" : undefined
              }}
            >
              {legendariaEdicionIdx !== null ? "Guardar Cambios Legendaria" : "Agregar Acción Legendaria"}
            </button>
            {legendariaEdicionIdx !== null && (
              <button
                type="button"
                onClick={cancelarEditarLegendaria}
                className={estilos.botonAgregarCompleto}
                style={{
                  width: "100px",
                  backgroundColor: "var(--color-daño)"
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
        {/* Lista legendarias */}
        {monstruoForm.accionesLegendarias && monstruoForm.accionesLegendarias.length > 0 && (
          <div className={estilos.listaDinamicaVisual}>
            {monstruoForm.accionesLegendarias.map((l, idx) => (
              <div key={`leg_v_${idx}`} className={estilos.itemDinamicoVisual}>
                <div style={{ flex: 1, marginRight: "10px" }}>
                  <strong>
                    {l.nombre} {l.uso ? `(${l.uso})` : ""}
                  </strong>
                  :
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--color-texto-secundario)",
                      whiteSpace: "pre-wrap"
                    }}
                  >
                    {l.descripcion}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => iniciarEditarLegendaria(idx)}
                    className={estilos.botonEliminarDinamico}
                    style={{ color: "var(--color-borde-cian)" }}
                    title="Editar Acción Legendaria"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarLegendariaIdx(idx)}
                    className={estilos.botonEliminarDinamico}
                    title="Eliminar Acción Legendaria"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
