import React, { useState } from "react";
import type { ObjetoInventario } from "@/tipos";
import { Zap, X, ShieldAlert, PackageCheck } from "lucide-react";
import estilos from "../PanelFormaSalvaje.module.css";

interface ModalPrepararTransformacionProps {
  abierto: boolean;
  alCerrar: () => void;
  alConfirmar: (equipoConservado: string[], conservarPg: boolean) => void;
  equipado: ObjetoInventario[];
  hpTemporalActual: number;
  hpTemporalNuevo: number;
}

/**
 * Modal para preparar la transformación: equipo retenido y gestión de PG temporales.
 */
export const ModalPrepararTransformacion: React.FC<ModalPrepararTransformacionProps> = ({
  abierto,
  alCerrar,
  alConfirmar,
  equipado,
  hpTemporalActual,
  hpTemporalNuevo
}) => {
  const [equipoConservado, setEquipoConservado] = useState<string[]>([]);
  const [conservarPg, setConservarPg] = useState<boolean>(() => hpTemporalActual >= hpTemporalNuevo);

  if (!abierto) return null;

  const alternarObjeto = (idInstancia: string) => {
    setEquipoConservado((prev) =>
      prev.includes(idInstancia)
        ? prev.filter((id) => id !== idInstancia)
        : [...prev, idInstancia]
    );
  };

  const handleConfirmar = () => {
    alConfirmar(equipoConservado, conservarPg);
  };

  return (
    <div
      className={estilos.modalSelectorOverlay}
      role="dialog"
      aria-label="Preparar transformación"
      onClick={alCerrar}
    >
      <section
        className={`${estilos.modalSelectorContenido} ${estilos.modalTransformacionContenido}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={estilos.modalSelectorHeader}>
          <div className={estilos.modalHeaderTituloBloque}>
            <div className={estilos.modalHeaderIcono}>
              <Zap size={18} />
            </div>
            <h3 className={estilos.modalTituloTexto}>Preparar transformación</h3>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            className={estilos.botonCerrarModal}
            title="Cancelar preparación"
          >
            <X size={18} />
          </button>
        </header>

        <div className={estilos.modalSelectorBody}>
          {/* Selección de Equipo que se adapta o retiene */}
          {equipado.length > 0 && (
            <fieldset className={estilos.fieldsetEquipo}>
              <legend className={estilos.legendEquipo}>
                <PackageCheck size={14} />
                Equipo compatible que seguirá puesto
              </legend>
              <div className={estilos.listaEquipoCheckboxes}>
                {equipado.map((o) => {
                  const check = equipoConservado.includes(o.idInstancia);
                  return (
                    <label
                      key={o.idInstancia}
                      className={`${estilos.labelOpcionEquipo} ${check ? estilos.labelOpcionEquipoActivo : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={check}
                        onChange={() => alternarObjeto(o.idInstancia)}
                      />
                      <span>{o.nombre}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Opción de Puntos de Golpe Temporales */}
          {hpTemporalActual > 0 && (
            <div className={estilos.cajaOpcionPg}>
              <label className={estilos.labelConservarPg}>
                <input
                  type="checkbox"
                  checked={conservarPg}
                  onChange={(e) => setConservarPg(e.target.checked)}
                />
                <div className={estilos.textoConservarPgBloque}>
                  <span className={estilos.tituloConservarPg}>
                    <ShieldAlert size={14} />
                    Conservar mis PG temporales actuales
                  </span>
                  <span className={estilos.subtituloConservarPg}>
                    Actuales: {hpTemporalActual} PG · Nueva forma otorga: {hpTemporalNuevo} PG
                  </span>
                </div>
              </label>
            </div>
          )}
        </div>

        <footer className={estilos.modalSelectorFooter}>
          <button
            type="button"
            className={estilos.botonGestionarPool}
            onClick={alCerrar}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={estilos.botonAdoptar}
            onClick={handleConfirmar}
          >
            <Zap size={14} />
            Transformar
          </button>
        </footer>
      </section>
    </div>
  );
};
