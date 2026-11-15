import React from "react";
import { Trash2, Edit2, Zap } from "lucide-react";
import { BotonNumerico } from "@/componentes/comunes/BotonNumerico";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import type { AccionMonstruo } from "@/tipos";
import type { usarFormularioCriatura } from "@/hooks/usarFormularioCriatura";
import { ParametrosExtraccionAtaque } from "@/utiles/procesadorAtaques";
import { formatearRecargaTexto } from "@/almacen/sanitizacion";
import estilos from "../FormularioCriatura.module.css";

const calcFilas = (valor: string, minFilas = 2, maxFilas = 20): number => {
  if (!valor) return minFilas;
  const lineas = valor.split("\n").length;
  const porLongitud = Math.ceil(valor.length / 80);
  return Math.min(maxFilas, Math.max(minFilas, lineas, porLongitud));
};

export interface BloqueListaCriaturaProps {
  titulo: string;
  tituloEditando: string;
  items: AccionMonstruo[];
  editor: ReturnType<typeof usarFormularioCriatura>["listaAcciones"];
  conCamposAtaque?: boolean;
  placeholderNombre: string;
  placeholderUso: string;
  placeholderDescripcion: string;
  textoBotonAgregar: string;
  textoBotonGuardar: string;
  usarBotonNumerico?: boolean;
  alPreRellenarAtaqueRapido?: (accion: ParametrosExtraccionAtaque) => void;
  totalLegendarias?: string | number;
  alCambiarTotalLegendarias?: (valor: string) => void;
}

/**
 * Bloque genérico reutilizable para listas de rasgos, acciones, reacciones y legendarias.
 */
export const BloqueListaCriatura: React.FC<BloqueListaCriaturaProps> = ({
  titulo,
  tituloEditando,
  items,
  editor,
  conCamposAtaque = false,
  placeholderNombre,
  placeholderUso,
  placeholderDescripcion,
  textoBotonAgregar,
  textoBotonGuardar,
  usarBotonNumerico = false,
  alPreRellenarAtaqueRapido,
  totalLegendarias,
  alCambiarTotalLegendarias
}) => {
  const { itemForm, edicionIdx, actualizarCampoItem, agregarItem, iniciarEdicion, cancelarEdicion, eliminarItem } = editor;
  const { nombre, descripcion, uso, recarga, bonificadorAtaque, daño } = itemForm;
  const textoBotonPrincipal = edicionIdx !== null ? textoBotonGuardar : textoBotonAgregar;
  const claseBotonPrincipal = `${estilos.botonAgregarCompleto} ${edicionIdx !== null ? estilos.botonAgregarCompletoGuardar : estilos.botonAgregarCompletoNormal}`;

  return (
    <div className={estilos.bloqueDinamicoForm}>
      <div className={estilos.tituloBloqueDinamico}>
        {edicionIdx !== null ? tituloEditando : `${titulo} (${items.length})`}
      </div>
      <div className={estilos.camposDinamicosGrupo}>
        {alCambiarTotalLegendarias && (
          <div className={estilos.filaLegendariasTotal}>
            <label className={`${estilos.labelForm} ${estilos.labelLegendariasTotal}`}>
              Total de Acciones Legendarias (por ronda):
            </label>
            <input
              type="text"
              value={totalLegendarias ?? "3"}
              onChange={(e) => alCambiarTotalLegendarias(e.target.value)}
              placeholder="Ej. 3 o 3 (4 en guarida)"
              className={`${estilos.inputDinamicoMediano} ${estilos.inputLegendariasTotal}`}
            />
          </div>
        )}

        <div className={estilos.filaCamposAlineados}>
          <input
            type="text"
            value={nombre}
            onChange={(e) => actualizarCampoItem("nombre", e.target.value)}
            placeholder={placeholderNombre}
            className={conCamposAtaque ? estilos.inputDinamicoMediano : estilos.inputDinamicoLargo}
          />
          {conCamposAtaque && (
            <CampoNumerico
              value={bonificadorAtaque ?? ""}
              alConfirmar={(valor) => actualizarCampoItem("bonificadorAtaque", valor >= 0 ? `+${valor}` : String(valor))}
              placeholder="Bono (+5)"
              className={estilos.inputDinamicoMini}
              alVaciar={() => actualizarCampoItem("bonificadorAtaque", "")}
            />
          )}
          {conCamposAtaque && (
            <input
              type="text"
              value={daño ?? ""}
              onChange={(e) => actualizarCampoItem("daño", e.target.value)}
              placeholder="Daño (1d8+3)"
              className={estilos.inputDinamicoMini}
            />
          )}
          <input
            type="text"
            value={uso ?? ""}
            onChange={(e) => actualizarCampoItem("uso", e.target.value)}
            placeholder={placeholderUso}
            className={estilos.inputDinamicoMini}
          />
          <input
            type="text"
            value={recarga ?? ""}
            onChange={(e) => actualizarCampoItem("recarga", e.target.value)}
            placeholder="Recarga (ej. 5-6)"
            className={estilos.inputDinamicoMini}
          />
        </div>

        <textarea
          value={descripcion}
          onChange={(e) => actualizarCampoItem("descripcion", e.target.value)}
          placeholder={placeholderDescripcion}
          className={estilos.textareaDinamico}
          rows={calcFilas(descripcion, 3)}
          spellCheck={false}
        />

        <div className="u-flex u-gap-sm">
          {usarBotonNumerico ? (
            <BotonNumerico ambito="form" type="button" onClick={agregarItem} className={claseBotonPrincipal}>
              {textoBotonPrincipal}
            </BotonNumerico>
          ) : (
            <button type="button" onClick={agregarItem} className={claseBotonPrincipal}>
              {textoBotonPrincipal}
            </button>
          )}
          {edicionIdx !== null && (
            <button
              type="button"
              onClick={cancelarEdicion}
              className={`${estilos.botonAgregarCompleto} ${estilos.botonCancelarEdicionAccion}`}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className={estilos.listaDinamicaVisual}>
          {items.map((item, idx) => {
            return (
              <div key={idx} className={estilos.itemDinamicoVisual}>
                <div className={estilos.itemVisualCuerpo}>
                  <strong>
                    {item.nombre} {(item.recarga || item.uso) ? `(${formatearRecargaTexto(item.recarga, item.uso)})` : ""}
                  </strong>
                  {conCamposAtaque && (item.bonificadorAtaque !== undefined || item.daño) && (
                    <span className={estilos.itemVisualMetricasAtaque}>
                      [{item.bonificadorAtaque !== undefined ? `Ataque: ${item.bonificadorAtaque >= 0 ? "+" : ""}${item.bonificadorAtaque}` : ""}
                      {item.bonificadorAtaque !== undefined && item.daño ? " | " : ""}
                      {item.daño ? `Daño: ${item.daño}` : ""}]
                    </span>
                  )}
                  :
                  <div className={estilos.itemVisualDescripcion}>{item.descripcion}</div>
                </div>
                <div className="u-flex u-gap-xs">
                  {alPreRellenarAtaqueRapido && (
                    <button
                      type="button"
                      onClick={() => alPreRellenarAtaqueRapido(item)}
                      className={`${estilos.botonEliminarDinamico} ${estilos.botonCopiarAtaqueRapido}`}
                      title="Copiar datos a Ataques Rápidos"
                    >
                      <Zap size={12} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => iniciarEdicion(idx)}
                    className={`${estilos.botonEliminarDinamico} ${estilos.botonEditarItemVisual}`}
                    title={`Editar ${item.nombre}`}
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarItem(idx)}
                    className={estilos.botonEliminarDinamico}
                    title={`Eliminar ${item.nombre}`}
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
  );
};
