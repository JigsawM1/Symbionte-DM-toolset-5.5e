import React from "react";
import { Check, Clipboard, FileText, Upload, X } from "lucide-react";
import estilos from "../HojaPersonaje.module.css";

interface ModalesJSONGestorPersonajesProps {
  modalJSON: { titulo: string; contenido: string } | null;
  alCerrarModalJSON: () => void;
  modalPegarAbierto: boolean;
  alCerrarModalPegar: () => void;
  textoJSONPegado: string;
  alCambiarTextoJSONPegado: (texto: string) => void;
  errorPegado: string | null;
  alProcesarTextoJSON: (texto: string) => void;
  alAbrirSelectorArchivo: () => void;
  alPegarDesdePortapapeles: () => Promise<void>;
  alCopiarTextoJSON: (texto: string) => Promise<void>;
}

export const ModalesJSONGestorPersonajes: React.FC<ModalesJSONGestorPersonajesProps> = ({
  modalJSON,
  alCerrarModalJSON,
  modalPegarAbierto,
  alCerrarModalPegar,
  textoJSONPegado,
  alCambiarTextoJSONPegado,
  errorPegado,
  alProcesarTextoJSON,
  alAbrirSelectorArchivo,
  alPegarDesdePortapapeles,
  alCopiarTextoJSON
}) => {
  return (
    <>
      {/* Modal para Visualizar / Copiar JSON Manualmente */}
      {modalJSON && (
        <div
          className={estilos.overlayModalJSON}
          onClick={alCerrarModalJSON}
        >
          <div
            className={`${estilos.neoRaised} ${estilos.cajaModalJSON}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={estilos.cabeceraModalJSON}>
              <div className={estilos.filaTituloModalJSON}>
                <FileText size={16} className={estilos.iconoModalCian} />
                <h3 className={estilos.tituloModalJSON}>{modalJSON.titulo}</h3>
              </div>
              <button
                type="button"
                className={`${estilos.neoButton} ${estilos.botonCerrarModalCompacto}`}
                onClick={alCerrarModalJSON}
              >
                <X size={14} />
              </button>
            </div>

            <p className={estilos.textoInstruccionModal}>
              Copia el código JSON a continuación para compartir o respaldar la ficha:
            </p>

            <textarea
              readOnly
              value={modalJSON.contenido}
              rows={12}
              spellCheck={false}
              className={estilos.textareaCodigoJSON}
            />

            <div className={estilos.filaAccionesPieModal}>
              <button
                type="button"
                className={`${estilos.neoButton} ${estilos.botonAccionPrimarioModal}`}
                onClick={() => alCopiarTextoJSON(modalJSON.contenido)}
              >
                <Clipboard size={14} />
                Copiar al Portapapeles
              </button>
              <button
                type="button"
                className={estilos.neoButton}
                onClick={alCerrarModalJSON}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Pegar e Importar JSON */}
      {modalPegarAbierto && (
        <div
          className={estilos.overlayModalJSON}
          onClick={alCerrarModalPegar}
        >
          <div
            className={`${estilos.neoRaised} ${estilos.cajaModalJSON}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={estilos.cabeceraModalJSON}>
              <div className={estilos.filaTituloModalJSON}>
                <Upload size={16} className={estilos.iconoModalCian} />
                <h3 className={estilos.tituloModalJSON}>Importar Ficha o Grupo JSON</h3>
              </div>
              <button
                type="button"
                className={`${estilos.neoButton} ${estilos.botonCerrarModalCompacto}`}
                onClick={alCerrarModalPegar}
              >
                <X size={14} />
              </button>
            </div>

            <div className={estilos.filaBotonesPegar}>
              <button
                type="button"
                className={`${estilos.neoButton} ${estilos.botonFlex1}`}
                onClick={alAbrirSelectorArchivo}
                title="Seleccionar archivo .json del equipo"
              >
                <Upload size={14} />
                Seleccionar Archivo .JSON
              </button>
              <button
                type="button"
                className={`${estilos.neoButton} ${estilos.botonFlex1}`}
                onClick={alPegarDesdePortapapeles}
                title="Pegar contenido del portapapeles"
              >
                <Clipboard size={14} />
                Pegar Portapapeles
              </button>
            </div>

            <p className={estilos.textoInstruccionModal}>
              O pega el texto JSON de la ficha o grupo directamente en el siguiente campo:
            </p>

            <textarea
              placeholder='Pega aquí el JSON exportado (ej: { "personaje": { ... } } o { "personajes": [ ... ] })'
              value={textoJSONPegado}
              onChange={(e) => alCambiarTextoJSONPegado(e.target.value)}
              rows={9}
              spellCheck={false}
              className={estilos.textareaPegarJSON}
              data-error={errorPegado ? "true" : "false"}
            />

            {errorPegado && (
              <span className={estilos.mensajeErrorPegado}>
                {errorPegado}
              </span>
            )}

            <div className={estilos.filaAccionesPieModal}>
              <button
                type="button"
                className={`${estilos.neoButton} ${estilos.botonAccionPrimarioModal}`}
                disabled={!textoJSONPegado.trim()}
                onClick={() => alProcesarTextoJSON(textoJSONPegado)}
              >
                <Check size={14} />
                Importar Personajes
              </button>
              <button
                type="button"
                className={estilos.neoButton}
                onClick={alCerrarModalPegar}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
