import React from "react";
import type { PersonajeJugador, Caracteristica, PersonalizacionCaracteristica } from "@/tipos";
import { X, Info, Edit3 } from "lucide-react";
import estilos from "./HojaPersonaje.module.css";
import estilosModal from "./ModalDetalleCaracteristica.module.css";
import { usarModalCaracteristica } from "./caracteristica/usarModalCaracteristica";
import { PestanaInfoCaracteristica } from "./caracteristica/PestanaInfoCaracteristica";
import { PestanaPersonalizarCaracteristica } from "./caracteristica/PestanaPersonalizarCaracteristica";

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

export const ModalDetalleCaracteristica: React.FC<ModalDetalleCaracteristicaProps> = ({
  caracteristicaClave,
  personaje,
  alCerrar,
  alGuardar,
  alTirarCaracteristica,
  alTirarSalvacion
}) => {
  const {
    pestanaActiva,
    setPestanaActiva,
    nombreCarac,
    abrev,
    tituloMostrar,
    descripcionMostrar,
    customExistente,
    valorBaseActual,
    overrideActual,
    esCompetenteActual,
    nombreForm,
    setNombreForm,
    descForm,
    setDescForm,
    valorBaseForm,
    setValorBaseForm,
    overrideForm,
    setOverrideForm,
    modExtraForm,
    setModExtraForm,
    bonoSalvacionExtraForm,
    setBonoSalvacionExtraForm,
    competenteSalvacionForm,
    setCompetenteSalvacionForm,
    notasForm,
    setNotasForm,
    pb,
    valorEfectivoPreview,
    modBasePreview,
    modTotalPreview,
    overrideValidoPreview,
    bonoSalvacionPreview,
    valorEfectivoGuardado,
    modBaseGuardado,
    modExtraGuardado,
    modTotalGuardado,
    bonoSalvExtraGuardado,
    bonoSalvacionGuardado,
    cambiarBaseDelta,
    ejecutarTiradaCaracteristica,
    ejecutarTiradaSalvacion,
    manejarGuardar
  } = usarModalCaracteristica({
    caracteristicaClave,
    personaje,
    alCerrar,
    alGuardar,
    alTirarCaracteristica,
    alTirarSalvacion
  });

  return (
    <div className={estilos.overlayModal} onClick={alCerrar}>
      <div
        className={`${estilos.modalContenedor} ${estilos.neoRaised} ${estilosModal.modalContenedorCaracteristica}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className={`${estilos.cabeceraModal} ${estilosModal.cabeceraModalCaracteristica}`}>
          <div className={estilosModal.infoCabeceraContenedor}>
            <div className={estilosModal.abreviaturaBadge}>
              {abrev}
            </div>
            <div>
              <h3 className={`${estilos.tituloModal} ${estilosModal.tituloModalCaracteristica}`}>
                {tituloMostrar}
              </h3>
              <span className={estilosModal.subtextoPuntuacion}>
                Puntuación: <strong className={estilosModal.valorEfectivoResaltado}>{valorEfectivoPreview}</strong> (Mod:{" "}
                <strong className={modTotalPreview >= 0 ? estilosModal.modPreviewPositivo : estilosModal.modPreviewNegativo}>
                  {modTotalPreview >= 0 ? `+${modTotalPreview}` : modTotalPreview}
                </strong>
                )
                {overrideValidoPreview !== null && (
                  <span className={estilosModal.badgeOverrideFijo}>
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

        {/* Pestaña 1: Información y Tiradas */}
        {pestanaActiva === "info" && (
          <PestanaInfoCaracteristica
            abrev={abrev}
            tituloMostrar={tituloMostrar}
            descripcionMostrar={descripcionMostrar}
            valorBaseActual={valorBaseActual}
            overrideActual={overrideActual}
            valorEfectivoGuardado={valorEfectivoGuardado}
            modBaseGuardado={modBaseGuardado}
            modExtraGuardado={modExtraGuardado}
            modTotalGuardado={modTotalGuardado}
            pb={pb}
            nivelPersonaje={personaje.nivel || 1}
            esCompetenteActual={esCompetenteActual}
            bonoSalvExtraGuardado={bonoSalvExtraGuardado}
            bonoSalvacionGuardado={bonoSalvacionGuardado}
            notas={customExistente?.notas}
            ejecutarTiradaCaracteristica={ejecutarTiradaCaracteristica}
            ejecutarTiradaSalvacion={ejecutarTiradaSalvacion}
          />
        )}

        {/* Pestaña 2: Personalizar */}
        {pestanaActiva === "personalizar" && (
          <PestanaPersonalizarCaracteristica
            abrev={abrev}
            nombreCarac={nombreCarac}
            nombreForm={nombreForm}
            setNombreForm={setNombreForm}
            descForm={descForm}
            setDescForm={setDescForm}
            valorBaseForm={valorBaseForm}
            setValorBaseForm={setValorBaseForm}
            valorBaseActual={valorBaseActual}
            overrideForm={overrideForm}
            setOverrideForm={setOverrideForm}
            overrideValidoPreview={overrideValidoPreview}
            modBasePreview={modBasePreview}
            modExtraForm={modExtraForm}
            setModExtraForm={setModExtraForm}
            bonoSalvacionExtraForm={bonoSalvacionExtraForm}
            setBonoSalvacionExtraForm={setBonoSalvacionExtraForm}
            competenteSalvacionForm={competenteSalvacionForm}
            setCompetenteSalvacionForm={setCompetenteSalvacionForm}
            bonoSalvacionPreview={bonoSalvacionPreview}
            pb={pb}
            notasForm={notasForm}
            setNotasForm={setNotasForm}
            cambiarBaseDelta={cambiarBaseDelta}
            manejarGuardar={manejarGuardar}
            alCerrar={alCerrar}
          />
        )}
      </div>
    </div>
  );
};

export default ModalDetalleCaracteristica;
