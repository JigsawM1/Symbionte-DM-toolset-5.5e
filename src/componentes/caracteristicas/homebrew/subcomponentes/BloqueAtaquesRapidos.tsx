import React from "react";
import { Plus, Trash2, Edit2, X } from "lucide-react";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import { SelectorDesplegable } from "@/componentes/comunes";
import type { AccionRapida } from "@/tipos";
import type { usarFormularioCriatura } from "@/hooks/usarFormularioCriatura";
import { BotonNumerico } from "@/componentes/comunes/BotonNumerico";
import { desglosarAtaqueRapido, ComponenteDano } from "@/utiles/procesadorAtaques";
import { formatearRecargaTexto } from "@/almacen/sanitizacion";
import estilos from "../FormularioCriatura.module.css";

const OPCIONES_TIPOS_DANO_RAPIDO = [
  { valor: "ácido", etiqueta: "Ácido" },
  { valor: "fuego", etiqueta: "Fuego" },
  { valor: "frío", etiqueta: "Frío" },
  { valor: "relámpago", etiqueta: "Relámpago" },
  { valor: "trueno", etiqueta: "Trueno" },
  { valor: "veneno", etiqueta: "Veneno" },
  { valor: "fuerza", etiqueta: "Fuerza" },
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

export interface BloqueAtaquesRapidosProps {
  contenedorRef?: React.Ref<HTMLDivElement>;
  accionesRapidas?: AccionRapida[];
  editor: ReturnType<typeof usarFormularioCriatura>["listaQuickActions"];
  danyosExtraQA?: ComponenteDano[];
  agregarDanoExtraQA?: () => void;
  actualizarDanoExtraQA?: (index: number, campo: keyof ComponenteDano, valor: string) => void;
  eliminarDanoExtraQA?: (index: number) => void;
  agregarQuickAction: () => void;
  iniciarEditarQuickAction: (idx: number) => void;
  cancelarEditarQuickAction: () => void;
}

/**
 * Bloque editor para ataques rápidos de criatura, incluyendo daños múltiples, uso y recarga.
 */
export const BloqueAtaquesRapidos: React.FC<BloqueAtaquesRapidosProps> = ({
  contenedorRef,
  accionesRapidas = [],
  editor,
  danyosExtraQA = [],
  agregarDanoExtraQA,
  actualizarDanoExtraQA,
  eliminarDanoExtraQA,
  agregarQuickAction,
  iniciarEditarQuickAction,
  cancelarEditarQuickAction
}) => {
  const { itemForm, edicionIdx, actualizarCampoItem, eliminarItem } = editor;
  return (
    <div ref={contenedorRef} className={estilos.bloqueDinamicoForm}>
      <div className={estilos.tituloBloqueDinamico}>
        {edicionIdx !== null
          ? "EDITANDO ATAQUE RÁPIDO"
          : `ATAQUES RÁPIDOS (${accionesRapidas.length})`}
      </div>
      <div className={estilos.camposDinamicosGrupo}>
        <div className={estilos.filaCamposAlineados}>
          <input
            type="text"
            value={itemForm.nombre}
            onChange={(e) => actualizarCampoItem("nombre", e.target.value)}
            placeholder="Nombre (ej. Mordisco)"
            className={estilos.inputDinamicoMediano}
          />
          <CampoNumerico
            value={itemForm.bonificadorAtaque || "+0"}
            alConfirmar={(valor) => actualizarCampoItem("bonificadorAtaque", valor >= 0 ? `+${valor}` : String(valor))}
            placeholder="Bono (+5)"
            className={estilos.inputDinamicoMini}
            alVaciar={() => actualizarCampoItem("bonificadorAtaque", "")}
          />
          <input
            type="text"
            value={itemForm.dadosDaño || "1d6"}
            onChange={(e) => actualizarCampoItem("dadosDaño", e.target.value)}
            placeholder="Dados (1d6+3)"
            className={estilos.inputDinamicoMini}
          />
          <div className={estilos.selectorDanoCompacto}>
            <SelectorDesplegable
              valor={itemForm.tipoDaño || "fuerza"}
              alCambiar={(valor) => actualizarCampoItem("tipoDaño", valor)}
              opciones={OPCIONES_TIPOS_DANO_RAPIDO}
              tamano="compacto"
            />
          </div>
          <input
            type="text"
            value={itemForm.uso ?? ""}
            onChange={(e) => actualizarCampoItem("uso", e.target.value)}
            placeholder="Uso (ej. 1/día)"
            className={estilos.inputDinamicoMini}
          />
          <input
            type="text"
            value={itemForm.recarga ?? ""}
            onChange={(e) => actualizarCampoItem("recarga", e.target.value)}
            placeholder="Recarga (5-6)"
            className={estilos.inputDinamicoMini}
          />
          <BotonNumerico
            type="button"
            onClick={agregarQuickAction}
            className={`${estilos.botonAgregarDinamico} ${edicionIdx !== null ? estilos.botonGuardarEdicion : ""}`}
            title={edicionIdx !== null ? "Guardar Cambios" : "Agregar Ataque Rápido"}
          >
            <Plus size={16} />
          </BotonNumerico>
          {edicionIdx !== null && (
            <button
              type="button"
              onClick={cancelarEditarQuickAction}
              className={`${estilos.botonAgregarDinamico} ${estilos.botonCancelarEdicionMini}`}
              title="Cancelar Edición"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {danyosExtraQA.length > 0 && (
          <div className={estilos.contenedorDanosExtra}>
            {danyosExtraQA.map((dExtra, dIdx) => (
              <div
                key={`d_extra_${dIdx}`}
                className={`${estilos.filaCamposAlineados} ${estilos.filaDanoExtraQA}`}
              >
                <span className={estilos.etiquetaDanoExtra}>+ Daño #{dIdx + 2}:</span>
                <input
                  type="text"
                  value={dExtra.dados}
                  onChange={(e) => actualizarDanoExtraQA?.(dIdx, "dados", e.target.value)}
                  placeholder="Dados (ej. 2d4)"
                  className={estilos.inputDinamicoMini}
                />
                <div className={estilos.selectorDanoCompacto}>
                  <SelectorDesplegable
                    valor={dExtra.tipo}
                    alCambiar={(v) => actualizarDanoExtraQA?.(dIdx, "tipo", v)}
                    opciones={OPCIONES_TIPOS_DANO_RAPIDO}
                    tamano="compacto"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => eliminarDanoExtraQA?.(dIdx)}
                  className={estilos.botonEliminarDinamico}
                  title="Eliminar este daño adicional"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={estilos.filaBotonDanoExtra}>
          <button
            type="button"
            onClick={agregarDanoExtraQA}
            className={estilos.botonAgregarDanoExtra}
            title="Añadir más dados de daño (ej. 2d4 de fuego)"
          >
            <Plus size={12} />
            <span>Añadir más dados de daño</span>
          </button>
        </div>

        {accionesRapidas.length > 0 && (
          <div className={estilos.listaDinamicaVisual}>
            {accionesRapidas.map((qa, idx) => {
              const componentes = desglosarAtaqueRapido(qa.dadosDaño, qa.tipoDaño);
              const desgloseTexto = componentes.map((c) => `${c.dados} (${c.tipo})`).join(" + ");
              const etiquetaLimites = (qa.recarga || qa.uso) ? ` (${formatearRecargaTexto(qa.recarga, qa.uso)})` : "";

              return (
                <div key={`qa_v_${idx}`} className={estilos.itemDinamicoVisual}>
                  <span>
                    <strong>{qa.nombre}{etiquetaLimites}</strong>: {qa.bonificadorAtaque} | {desgloseTexto}
                  </span>
                  <div className="u-flex u-gap-xs">
                    <button
                      type="button"
                      onClick={() => iniciarEditarQuickAction(idx)}
                      className={`${estilos.botonEliminarDinamico} ${estilos.botonEditarItemVisual}`}
                      title="Editar Ataque Rápido"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarItem(idx)}
                      className={estilos.botonEliminarDinamico}
                      title="Eliminar Ataque Rápido"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
