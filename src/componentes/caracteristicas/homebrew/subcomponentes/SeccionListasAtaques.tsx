import React from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { RasgoBase, AccionMonstruo, AccionRapida } from "@/tipos";
import { SelectorDesplegable } from "@/componentes/comunes";
import estilos from "../FormularioCriatura.module.css";

const OPCIONES_TIPOS_DANO_RAPIDO = [
  { valor: "ácido", etiqueta: "Ácido" },
  { valor: "fuego", etiqueta: "Fuego" },
  { valor: "frío", etiqueta: "Frío" },
  { valor: "relámpago", etiqueta: "Relámpago" },
  { valor: "trueno", etiqueta: "Trueno" },
  { valor: "veneno", etiqueta: "Veneno" },
  { valor: "fuerza_daño", etiqueta: "Fuerza" },
  { valor: "radiante", etiqueta: "Radiante" },
  { valor: "necrótico", etiqueta: "Necrótico" },
  { valor: "psíquico", etiqueta: "Psíquico" },
  { valor: "perforante", etiqueta: "Perforante" },
  { valor: "perforante mágico", etiqueta: "Perforante Mágico" },
  { valor: "cortante", etiqueta: "Cortante" },
  { valor: "cortante mágico", etiqueta: "Cortante Mágico" },
  { valor: "contundente", etiqueta: "Contundente" },
  { valor: "contundente mágico", etiqueta: "Contundente Mágico" }
];

interface SeccionListasAtaquesProps {
  monstruoForm: {
    accionesRapidas?: AccionRapida[];
    rasgos?: RasgoBase[];
    acciones?: AccionMonstruo[];
    accionesAdicionales?: AccionMonstruo[];
    reacciones?: RasgoBase[];
    accionesLegendariasTotal?: number;
    accionesLegendarias?: RasgoBase[];
  };
  actualizarGeneral?: (campo: string, valor: unknown) => void;
  
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

  // Acciones Adicionales (Bonus Actions)
  tAccionAdicionalNombre: string; setTAccionAdicionalNombre: (v: string) => void;
  tAccionAdicionalDesc: string; setTAccionAdicionalDesc: (v: string) => void;
  tAccionAdicionalBono: string; setTAccionAdicionalBono: (v: string) => void;
  tAccionAdicionalDaño: string; setTAccionAdicionalDaño: (v: string) => void;
  tAccionAdicionalUso: string; setTAccionAdicionalUso: (v: string) => void;
  accionAdicionalEdicionIdx: number | null;
  agregarAccionAdicional: () => void;
  iniciarEditarAccionAdicional: (idx: number) => void;
  cancelarEditarAccionAdicional: () => void;
  eliminarAccionAdicionalIdx: (idx: number) => void;

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
  actualizarGeneral,
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
  tAccionAdicionalNombre, setTAccionAdicionalNombre,
  tAccionAdicionalDesc, setTAccionAdicionalDesc,
  tAccionAdicionalBono, setTAccionAdicionalBono,
  tAccionAdicionalDaño, setTAccionAdicionalDaño,
  tAccionAdicionalUso, setTAccionAdicionalUso,
  accionAdicionalEdicionIdx,
  agregarAccionAdicional,
  iniciarEditarAccionAdicional,
  cancelarEditarAccionAdicional,
  eliminarAccionAdicionalIdx,
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
            <div style={{ minWidth: "125px" }}>
              <SelectorDesplegable
                valor={tQTipo}
                alCambiar={setTQTipo}
                opciones={OPCIONES_TIPOS_DANO_RAPIDO}
                tamano="compacto"
              />
            </div>
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

      {/* ACCIONES Y ATAQUES PRINCIPALES */}
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

      {/* ACCIONES ADICIONALES (BONUS ACTIONS) */}
      <div className={estilos.bloqueDinamicoForm}>
        <div className={estilos.tituloBloqueDinamico}>
          {accionAdicionalEdicionIdx !== null
            ? "EDITANDO ACCIÓN ADICIONAL"
            : `ACCIONES ADICIONALES (${monstruoForm.accionesAdicionales?.length || 0})`}
        </div>
        <div className={estilos.camposDinamicosGrupo}>
          <div className={estilos.filaCamposAlineados}>
            <input
              type="text"
              value={tAccionAdicionalNombre}
              onChange={(e) => setTAccionAdicionalNombre(e.target.value)}
              placeholder="Nombre de la acción adicional"
              className={estilos.inputDinamicoMediano}
            />
            <input
              type="text"
              value={tAccionAdicionalBono}
              onChange={(e) => setTAccionAdicionalBono(e.target.value)}
              placeholder="Bono (+5)"
              className={estilos.inputDinamicoMini}
            />
            <input
              type="text"
              value={tAccionAdicionalDaño}
              onChange={(e) => setTAccionAdicionalDaño(e.target.value)}
              placeholder="Daño (1d6+2)"
              className={estilos.inputDinamicoMini}
            />
            <input
              type="text"
              value={tAccionAdicionalUso}
              onChange={(e) => setTAccionAdicionalUso(e.target.value)}
              placeholder="Recarga/Uso"
              className={estilos.inputDinamicoMini}
            />
          </div>
          <textarea
            value={tAccionAdicionalDesc}
            onChange={(e) => setTAccionAdicionalDesc(e.target.value)}
            placeholder="Descripción detallada de la acción adicional..."
            className={estilos.textareaDinamico}
            rows={calcFilas(tAccionAdicionalDesc, 3)}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={agregarAccionAdicional}
              className={estilos.botonAgregarCompleto}
              style={{
                flex: 1,
                backgroundColor: accionAdicionalEdicionIdx !== null ? "var(--color-exito)" : undefined
              }}
            >
              {accionAdicionalEdicionIdx !== null ? "Guardar Cambios Acción Adicional" : "Agregar Acción Adicional"}
            </button>
            {accionAdicionalEdicionIdx !== null && (
              <button
                type="button"
                onClick={cancelarEditarAccionAdicional}
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
        {/* Lista acciones adicionales */}
        {monstruoForm.accionesAdicionales && monstruoForm.accionesAdicionales.length > 0 && (
          <div className={estilos.listaDinamicaVisual}>
            {monstruoForm.accionesAdicionales.map((a, idx) => (
              <div key={`aa_v_${idx}`} className={estilos.itemDinamicoVisual}>
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
                    onClick={() => iniciarEditarAccionAdicional(idx)}
                    className={estilos.botonEliminarDinamico}
                    style={{ color: "var(--color-borde-cian)" }}
                    title="Editar Acción Adicional"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarAccionAdicionalIdx(idx)}
                    className={estilos.botonEliminarDinamico}
                    title="Eliminar Acción Adicional"
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
          {/* Input para el total de acciones legendarias por ronda */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <label className={estilos.labelForm} style={{ margin: 0, fontSize: "11.5px" }}>
              Total de Acciones Legendarias (por ronda):
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={monstruoForm.accionesLegendariasTotal ?? 3}
              onChange={(e) => actualizarGeneral && actualizarGeneral("accionesLegendariasTotal", parseInt(e.target.value, 10) || 3)}
              className={estilos.inputDinamicoMini}
              style={{ width: "55px", textAlign: "center" }}
            />
          </div>

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
            placeholder="Costo (ej. 1 acción o 2 acciones)"
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
                    {l.nombre} {l.uso ? `(Costo: ${l.uso})` : ""}
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
