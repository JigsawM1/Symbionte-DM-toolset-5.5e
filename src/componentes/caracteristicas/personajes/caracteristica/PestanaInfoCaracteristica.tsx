import React from "react";
import { Shield, Dices } from "lucide-react";
import estilos from "../HojaPersonaje.module.css";
import estilosModal from "../ModalDetalleCaracteristica.module.css";

interface PestanaInfoCaracteristicaProps {
  abrev: string;
  tituloMostrar: string;
  descripcionMostrar: string;
  valorBaseActual: number;
  overrideActual: number | null;
  valorEfectivoGuardado: number;
  modBaseGuardado: number;
  modExtraGuardado: number;
  modTotalGuardado: number;
  pb: number;
  nivelPersonaje: number;
  esCompetenteActual: boolean;
  bonoSalvExtraGuardado: number;
  bonoSalvacionGuardado: number;
  notas?: string;
  ejecutarTiradaCaracteristica: () => void;
  ejecutarTiradaSalvacion: () => void;
}

export const PestanaInfoCaracteristica: React.FC<PestanaInfoCaracteristicaProps> = ({
  abrev,
  tituloMostrar,
  descripcionMostrar,
  valorBaseActual,
  overrideActual,
  valorEfectivoGuardado,
  modBaseGuardado,
  modExtraGuardado,
  modTotalGuardado,
  pb,
  nivelPersonaje,
  esCompetenteActual,
  bonoSalvExtraGuardado,
  bonoSalvacionGuardado,
  notas,
  ejecutarTiradaCaracteristica,
  ejecutarTiradaSalvacion
}) => {
  return (
    <div className={`${estilos.contenidoPestañaModal} ${estilosModal.formularioPersonalizarContenedor}`}>
      {/* Uso oficial / personalizado de Salvaciones */}
      <div className={estilosModal.cajaDescripcionSalvacion}>
        <div className={estilosModal.cabeceraCajaSalvacion}>
          <Shield size={13} color="#94a3b8" />
          <span className={estilosModal.tituloCajaSalvacion}>
            Tiradas de salvación y usos de {tituloMostrar}...
          </span>
        </div>
        <p className={estilosModal.textoDescripcionSalvacion}>
          {descripcionMostrar}
        </p>
      </div>

      {/* Desglose Matemático */}
      <div className={`${estilos.neoPressed} ${estilosModal.cajaDesgloseMatematico}`}>
        <span className={`${estilos.labelFormulario} ${estilosModal.tituloDesgloseMatematico}`}>
          Desglose Matemático del Atributo
        </span>

        <div className={estilosModal.listaDesgloseFilas}>
          <div className={estilosModal.filaDesglose}>
            <span>Puntuación Base:</span>
            <strong className={estilosModal.valorEfectivoResaltado}>{valorBaseActual}</strong>
          </div>

          <div className={estilosModal.filaDesglose}>
            <span>Override Fijo (Objeto Mágico):</span>
            <span className={overrideActual !== null ? estilosModal.valorOverrideActivo : estilosModal.valorOverrideInactivo}>
              {overrideActual !== null ? `${overrideActual} (Activo)` : "Ninguno"}
            </span>
          </div>

          <div className={estilosModal.filaDesglose}>
            <span>Puntuación Efectiva Final:</span>
            <strong className={estilosModal.valorEfectivoResaltado}>{valorEfectivoGuardado}</strong>
          </div>

          <div className={estilosModal.filaDesglose}>
            <span>Modificador Base ({valorEfectivoGuardado}):</span>
            <strong className={modBaseGuardado >= 0 ? estilosModal.valorModPositivo : estilosModal.valorModNegativo}>
              {modBaseGuardado >= 0 ? `+${modBaseGuardado}` : modBaseGuardado}
            </strong>
          </div>

          {modExtraGuardado !== 0 && (
            <div className={estilosModal.filaDesglose}>
              <span>Modificador Adicional a Pruebas:</span>
              <strong className={modExtraGuardado >= 0 ? estilosModal.valorModPositivo : estilosModal.valorModNegativo}>
                {modExtraGuardado >= 0 ? `+${modExtraGuardado}` : modExtraGuardado}
              </strong>
            </div>
          )}

          <div className={estilosModal.filaDesgloseDestacada}>
            <span>Total Modificador de Prueba:</span>
            <span className={modTotalGuardado >= 0 ? estilosModal.valorModPositivo : estilosModal.valorModNegativo}>
              {modTotalGuardado >= 0 ? `+${modTotalGuardado}` : modTotalGuardado}
            </span>
          </div>

          <div className={estilosModal.filaDesglosePB}>
            <span>Bono de Competencia (PB Nivel {nivelPersonaje}):</span>
            <span className={estilosModal.etiquetaNotasResaltada}>+{pb}</span>
          </div>

          <div className={estilosModal.filaDesglose}>
            <span>Competencia en Salvación:</span>
            <span className={esCompetenteActual ? estilosModal.valorSalvacionCompetente : estilosModal.valorSalvacionIncompetente}>
              {esCompetenteActual ? `Sí (+${pb} PB)` : "No (+0)"}
            </span>
          </div>

          {bonoSalvExtraGuardado !== 0 && (
            <div className={estilosModal.filaDesglose}>
              <span>Bono Adicional a Salvaciones:</span>
              <span className={bonoSalvExtraGuardado >= 0 ? estilosModal.valorBonoSalvacionPositivo : estilosModal.valorBonoSalvacionNegativo}>
                {bonoSalvExtraGuardado >= 0 ? `+${bonoSalvExtraGuardado}` : bonoSalvExtraGuardado}
              </span>
            </div>
          )}

          <div className={estilosModal.filaDesgloseTotalSalvacion}>
            <span className={estilosModal.valorEfectivoResaltado}>Total Tirada de Salvación:</span>
            <span className={bonoSalvacionGuardado >= 0 ? estilosModal.valorBonoSalvacionPositivo : estilosModal.valorBonoSalvacionNegativo}>
              {bonoSalvacionGuardado >= 0 ? `+${bonoSalvacionGuardado}` : bonoSalvacionGuardado}
            </span>
          </div>
        </div>
      </div>

      {/* Notas si existen */}
      {notas && (
        <div className={estilosModal.cajaNotasCaracteristica}>
          <strong className={estilosModal.etiquetaNotasResaltada}>Notas: </strong>
          {notas}
        </div>
      )}

      {/* Botones de Tirada 3D */}
      <div className={estilosModal.filaBotonesTirada}>
        <button
          type="button"
          className={`${estilos.neoButton} ${estilosModal.botonTiradaPrueba}`}
          onClick={ejecutarTiradaCaracteristica}
        >
          <Dices size={14} color="#94a3b8" />
          Prueba {abrev} ({modTotalGuardado >= 0 ? `+${modTotalGuardado}` : modTotalGuardado})
        </button>

        <button
          type="button"
          className={`${estilos.neoButton} ${estilosModal.botonTiradaSalvacion}`}
          onClick={ejecutarTiradaSalvacion}
        >
          <Shield size={14} color="#93c5fd" />
          Salvación {abrev} ({bonoSalvacionGuardado >= 0 ? `+${bonoSalvacionGuardado}` : bonoSalvacionGuardado})
        </button>
      </div>
    </div>
  );
};
