import React, { useId } from "react";
import { Check, Edit2, Plus, Trash2, X } from "lucide-react";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import { SelectorDesplegable, SelectorSugerencias, type OpcionDesplegable } from "@/componentes/comunes";
import { BotonNumerico } from "@/componentes/comunes/BotonNumerico";
import { TIPOS_DAÑO_DND } from "@/constantes/homebrewConstantes";
import type { DatosFormularioInvocacion, usarFormularioInvocacion } from "@/hooks/usarFormularioInvocacion";
import type { AtaqueInvocacion } from "@/tipos";
import { BloqueRasgosInvocacion } from "./BloqueRasgosInvocacion";
import { enfocarEditorFila } from "./focoEditorFila";
import estilos from "../FormularioCriatura.module.css";

interface SeccionHabilidadesInvocacionProps {
  invocacionForm: DatosFormularioInvocacion;
  listaAtaques: ReturnType<typeof usarFormularioInvocacion>["listaAtaques"];
  listaRasgos: ReturnType<typeof usarFormularioInvocacion>["listaRasgos"];
  listaAccionesAdicionales: ReturnType<typeof usarFormularioInvocacion>["listaAccionesAdicionales"];
  listaReacciones: ReturnType<typeof usarFormularioInvocacion>["listaReacciones"];
}

const OPCIONES_TIPO_ATAQUE: OpcionDesplegable<AtaqueInvocacion["tipo"]>[] = [
  { valor: "cuerpo_a_cuerpo", etiqueta: "Cuerpo a cuerpo" },
  { valor: "a_distancia", etiqueta: "A distancia" },
  { valor: "ambos", etiqueta: "Cuerpo a cuerpo o distancia" }
];

function formatearModificadorFijo(mod: number): string {
  if (mod > 0) return `+${mod}`;
  if (mod < 0) return String(mod);
  return "";
}

/**
 * Pestaña de Ataques escalables, Rasgos, Acciones Adicionales y Reacciones de la invocación.
 */
export const SeccionHabilidadesInvocacion: React.FC<SeccionHabilidadesInvocacionProps> = ({
  invocacionForm,
  listaAtaques,
  listaRasgos,
  listaAccionesAdicionales,
  listaReacciones
}) => {
  const idCampos = useId();
  const {
    itemForm: ataqueForm,
    edicionIdx: ataqueEdicionIdx,
    actualizarCampoItem: actualizarCampoAtaque,
    agregarItem: confirmarAtaque,
    iniciarEdicion: iniciarEdicionAtaque,
    cancelarEdicion: cancelarEdicionAtaque,
    eliminarItem: eliminarAtaque
  } = listaAtaques;

  return (
    <div className={estilos.seccionContenido}>
      <div className={estilos.bloqueDinamicoForm} data-editor-fila>
        <div className={estilos.tituloBloqueDinamico}>
          {ataqueEdicionIdx !== null
            ? "EDITANDO ATAQUE ESCALABLE"
            : `ATAQUES ESCALABLES (${invocacionForm.ataques.length})`}
        </div>
        <div className={estilos.camposDinamicosGrupo}>
          <div className={estilos.filaCamposAlineados}>
            <input
              type="text"
              data-campo-inicial
              value={ataqueForm.nombre}
              onChange={(e) => actualizarCampoAtaque("nombre", e.target.value)}
              placeholder="Nombre (ej. Hoja Feérica)"
              aria-label="Nombre del ataque"
              className={estilos.inputDinamicoMediano}
            />
            <div className={estilos.selectorDanoCompacto}>
              <SelectorDesplegable
                valor={ataqueForm.tipo}
                alCambiar={(v) => actualizarCampoAtaque("tipo", v)}
                opciones={OPCIONES_TIPO_ATAQUE}
                tamano="compacto"
                enFlujo
              />
            </div>
            <input
              type="text"
              value={ataqueForm.alcance}
              onChange={(e) => actualizarCampoAtaque("alcance", e.target.value)}
              placeholder="Alcance (5 pies)"
              aria-label="Alcance del ataque"
              className={estilos.inputDinamicoMini}
            />
            <input
              type="text"
              value={ataqueForm.dadosDanoBase}
              onChange={(e) => actualizarCampoAtaque("dadosDanoBase", e.target.value)}
              placeholder="Dados (1d8)"
              aria-label="Dados de daño base"
              className={estilos.inputDinamicoMini}
            />
            <CampoNumerico
              identidad={`${ataqueEdicionIdx ?? "nuevo"}-${listaAtaques.hayBorrador}`}
              value={ataqueForm.modificadorDanoFijo}
              alConfirmar={(v) => actualizarCampoAtaque("modificadorDanoFijo", v)}
              alVaciar={() => actualizarCampoAtaque("modificadorDanoFijo", 0)}
              placeholder="Mod (+3)"
              aria-label="Modificador fijo de daño"
              tipo="entero"
              className={estilos.inputDinamicoMini}
            />
          </div>
          <div className={estilos.filaCamposAlineados}>
            <label htmlFor={`${idCampos}-tipo-dano`} className="u-sr-only">
              Tipo de daño
            </label>
            <SelectorSugerencias
              id={`${idCampos}-tipo-dano`}
              valor={ataqueForm.tipoDano}
              alCambiar={(v) => actualizarCampoAtaque("tipoDano", v)}
              opciones={TIPOS_DAÑO_DND}
              placeholder="Tipo daño (ej. fuerza)"
              className={estilos.selectorSugerenciasCompacto}
            />
            <label className={estilos.checkboxFila}>
              <input
                type="checkbox"
                checked={ataqueForm.sumaNivelAlDano}
                onChange={(e) => actualizarCampoAtaque("sumaNivelAlDano", e.target.checked)}
              />
              <span>+ Nivel conjuro al daño</span>
            </label>
            <label className={estilos.checkboxFila}>
              <input
                type="checkbox"
                checked={ataqueForm.usaModificadorAtaqueConjuros}
                onChange={(e) => actualizarCampoAtaque("usaModificadorAtaqueConjuros", e.target.checked)}
              />
              <span>Usa mod. ataque conjuros</span>
            </label>
            <BotonNumerico
              ambito="[data-editor-fila]"
              type="button"
              onClick={evento => {
                if (confirmarAtaque() && ataqueEdicionIdx !== null) enfocarEditorFila(evento.currentTarget, ataqueEdicionIdx);
              }}
              disabled={!ataqueForm.nombre.trim() || !ataqueForm.dadosDanoBase.trim()}
              className={`${estilos.botonAgregarDinamico} ${ataqueEdicionIdx !== null ? estilos.botonGuardarEdicion : ""}`}
              title={ataqueEdicionIdx !== null ? "Guardar cambios del ataque" : "Agregar ataque"}
            >
              {ataqueEdicionIdx !== null ? (
                <>
                  <Check size={14} aria-hidden="true" /> Guardar
                </>
              ) : (
                <>
                  <Plus size={14} aria-hidden="true" /> Agregar
                </>
              )}
            </BotonNumerico>
            {listaAtaques.hayBorrador && (
              <button
                type="button"
                onClick={evento => {
                  cancelarEdicionAtaque();
                  enfocarEditorFila(evento.currentTarget, ataqueEdicionIdx);
                }}
                className={`${estilos.botonAgregarDinamico} ${estilos.botonCancelarEdicionMini}`}
                title="Cancelar edición"
                aria-label="Cancelar edición de ataque"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
          <input
            type="text"
            value={ataqueForm.descripcionExtra ?? ""}
            onChange={(e) => actualizarCampoAtaque("descripcionExtra", e.target.value)}
            placeholder="Descripción extra (ej. +1d6 de fuerza adicional)"
            aria-label="Descripción extra del ataque"
            className={estilos.inputDinamicoLargo}
          />
        </div>

        {invocacionForm.ataques.length > 0 && (
          <div className={estilos.listaDinamicaVisual}>
            {invocacionForm.ataques.map((atq, idx) => (
              <div key={`atq_inv_${idx}`} className={estilos.itemDinamicoVisual}>
                <div className={estilos.itemVisualCuerpo}>
                  <strong>{atq.nombre}</strong>: {atq.dadosDanoBase}
                  {formatearModificadorFijo(atq.modificadorDanoFijo)}
                  {atq.sumaNivelAlDano ? "+Nv" : ""} ({atq.tipoDano}) | {atq.alcance}
                  {atq.descripcionExtra && (
                    <div className={estilos.itemVisualDescripcion}>{atq.descripcionExtra}</div>
                  )}
                </div>
                <div className="u-flex u-gap-xs">
                  <button
                    type="button"
                    data-editar-fila={idx}
                    disabled={listaAtaques.hayBorrador && ataqueEdicionIdx !== idx}
                    onClick={evento => {
                      if (ataqueEdicionIdx !== idx) iniciarEdicionAtaque(idx);
                      enfocarEditorFila(evento.currentTarget);
                    }}
                    className={`${estilos.botonEliminarDinamico} ${estilos.botonEditarItemVisual}`}
                    title={`Editar ${atq.nombre}`}
                    aria-label={`Editar ${atq.nombre}`}
                  >
                    <Edit2 size={12} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarAtaque(idx)}
                    className={estilos.botonEliminarDinamico}
                    title={`Eliminar ${atq.nombre}`}
                    aria-label={`Eliminar ${atq.nombre}`}
                  >
                    <Trash2 size={12} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BloqueRasgosInvocacion
        titulo="RASGOS"
        tituloEditando="EDITANDO RASGO"
        items={invocacionForm.rasgos}
        editor={listaRasgos}
        textoBotonAgregar="Agregar a RASGOS"
        textoBotonGuardar="Guardar cambios del rasgo"
      />

      <BloqueRasgosInvocacion
        titulo="ACCIONES ADICIONALES"
        tituloEditando="EDITANDO ACCIÓN ADICIONAL"
        items={invocacionForm.accionesAdicionales}
        editor={listaAccionesAdicionales}
        textoBotonAgregar="Agregar a ACCIONES ADICIONALES"
        textoBotonGuardar="Guardar acción adicional"
      />

      <BloqueRasgosInvocacion
        titulo="REACCIONES"
        tituloEditando="EDITANDO REACCIÓN"
        items={invocacionForm.reacciones}
        editor={listaReacciones}
        textoBotonAgregar="Agregar a REACCIONES"
        textoBotonGuardar="Guardar cambios de la reacción"
      />
    </div>
  );
};
