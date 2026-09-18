import React, { useState, useRef } from "react";
import type { PersonajeJugador } from "@/tipos";
import { ConfirmDialog } from "@/componentes/comunes/ConfirmDialog";
import { Plus, Copy, Trash2, CheckCircle2, User, Download, Upload, Check, Clipboard, X, FileText } from "lucide-react";
import { importarPersonajesDesdeJSON } from "@/almacen/importadorJSON";
import { usarAccionesConfiguracion } from "@/almacen/selectores";
import { copiarAlPortapapeles, descargarArchivoJSON } from "@/servicios/sistemaTaleSpire";
import { logger } from "@/utiles/logger";
import estilos from "./HojaPersonaje.module.css";

interface GestorPersonajesProps {
  personajes: PersonajeJugador[];
  idPersonajeActivo: string | null;
  alSeleccionarActivo: (id: string) => void;
  alCrearNuevo: () => void;
  alDuplicar: (id: string) => void;
  alEliminar: (id: string) => void;
  alAbrirFicha: () => void;
  alImportar?: (personajes: PersonajeJugador[]) => void;
}

export const GestorPersonajes: React.FC<GestorPersonajesProps> = ({
  personajes,
  idPersonajeActivo,
  alSeleccionarActivo,
  alCrearNuevo,
  alDuplicar,
  alEliminar,
  alAbrirFicha,
  alImportar
}) => {
  const { agregarNotificacion } = usarAccionesConfiguracion();
  const [idPjAEliminar, setIdPjAEliminar] = useState<string | null>(null);
  const [copiadoPjId, setCopiadoPjId] = useState<string | null>(null);
  const [grupoCopiado, setGrupoCopiado] = useState<boolean>(false);
  const [modalJSON, setModalJSON] = useState<{ titulo: string; contenido: string } | null>(null);
  const [modalPegarAbierto, setModalPegarAbierto] = useState<boolean>(false);
  const [textoJSONPegado, setTextoJSONPegado] = useState<string>("");
  const [errorPegado, setErrorPegado] = useState<string | null>(null);

  const refInputArchivo = useRef<HTMLInputElement>(null);

  const personajeAEliminar = personajes.find((p) => p.id === idPjAEliminar);

  const manejarConfirmarEliminacion = () => {
    if (idPjAEliminar) {
      alEliminar(idPjAEliminar);
      setIdPjAEliminar(null);
    }
  };

  const manejarExportarPersonaje = async (pj: PersonajeJugador) => {
    const datos = {
      version: "5.5",
      tipo: "personaje",
      fechaExportacion: new Date().toISOString(),
      personaje: pj
    };
    const jsonStr = JSON.stringify(datos, null, 2);

    // 1. Copiar al portapapeles desacoplado
    const exito = await copiarAlPortapapeles(jsonStr);

    // 2. Descarga en navegador / cliente CEF
    const nombreArchivo = `ficha_${(pj.nombre || "personaje").toLowerCase().replace(/\s+/g, "_")}.json`;
    descargarArchivoJSON(jsonStr, nombreArchivo);

    if (exito) {
      setCopiadoPjId(pj.id);
      setTimeout(() => setCopiadoPjId(null), 3000);
      agregarNotificacion(`¡Ficha de "${pj.nombre}" copiada al portapapeles en formato JSON!`, "exito");
    } else {
      setModalJSON({
        titulo: `Ficha de ${pj.nombre} (JSON)`,
        contenido: jsonStr
      });
    }
  };

  const manejarExportarGrupo = async () => {
    if (personajes.length === 0) return;
    const datos = {
      version: "5.5",
      tipo: "grupo_personajes",
      fechaExportacion: new Date().toISOString(),
      totalPersonajes: personajes.length,
      personajes: personajes
    };
    const jsonStr = JSON.stringify(datos, null, 2);

    const exito = await copiarAlPortapapeles(jsonStr);

    const fecha = new Date().toISOString().split("T")[0];
    descargarArchivoJSON(jsonStr, `grupo_personajes_${fecha}.json`);

    if (exito) {
      setGrupoCopiado(true);
      setTimeout(() => setGrupoCopiado(false), 3000);
      agregarNotificacion(`¡Respaldo de grupo (${personajes.length} héroes) copiado al portapapeles!`, "exito");
    } else {
      setModalJSON({
        titulo: `Respaldo del Grupo (${personajes.length} Personajes)`,
        contenido: jsonStr
      });
    }
  };

  const procesarTextoJSON = (texto: string) => {
    try {
      const parsed = JSON.parse(texto);
      const pjs = importarPersonajesDesdeJSON(parsed);
      if (pjs.length > 0 && alImportar) {
        alImportar(pjs);
        setModalPegarAbierto(false);
        setTextoJSONPegado("");
        setErrorPegado(null);
      } else {
        setErrorPegado("No se encontraron personajes válidos en los datos provistos.");
      }
    } catch (err) {
      setErrorPegado("El texto no contiene un formato JSON válido.");
      logger.error("[GestorPersonajes] Error al parsear JSON:", err);
    }
  };

  const manejarArchivoImportar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = (evento) => {
      const contenido = evento.target?.result as string;
      procesarTextoJSON(contenido);
    };
    lector.readAsText(archivo);
    e.target.value = "";
  };

  const manejarPegarDesdePortapapeles = async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.readText === "function") {
        const texto = await navigator.clipboard.readText();
        if (texto) {
          setTextoJSONPegado(texto);
          setErrorPegado(null);
          return;
        }
      }
    } catch (e) {
      logger.warn("[GestorPersonajes] No se pudo leer directamente el portapapeles:", e);
    }
    agregarNotificacion("Pega el texto JSON directamente en el campo usando Ctrl+V.", "info");
  };

  return (
    <div className={estilos.contenedorGestor}>
      {/* Input oculto para importación de archivos JSON */}
      <input
        ref={refInputArchivo}
        type="file"
        accept=".json"
        className={estilos.inputArchivoOculto}
        onChange={manejarArchivoImportar}
      />

      {/* Cabecera del Gestor */}
      <div className={estilos.cabeceraGestor}>
        <div>
          <h2 className={estilos.tituloGestor}>Mis Personajes Guardados</h2>
          <p className={estilos.subtituloGestor}>
            Administra tus héroes, copia su JSON al portapapeles o importa nuevos.
          </p>
        </div>

        <div className={estilos.filaAccionesGestor}>
          {personajes.length > 0 && (
            <button
              type="button"
              className={`${estilos.neoButton} ${estilos.botonAccionGestor}`}
              onClick={manejarExportarGrupo}
              title={`Copiar todo el grupo (${personajes.length} personajes) al portapapeles`}
              data-copiado={grupoCopiado ? "true" : "false"}
            >
              {grupoCopiado ? <Check size={14} /> : <Download size={14} />}
              {grupoCopiado ? "¡Grupo Copiado!" : `Exportar Grupo (${personajes.length})`}
            </button>
          )}

          <button
            type="button"
            className={estilos.neoButton}
            onClick={() => setModalPegarAbierto(true)}
            title="Importar ficha o grupo desde archivo o portapapeles"
          >
            <Upload size={14} />
            Importar / Pegar JSON
          </button>

          <button
            type="button"
            className={`${estilos.neoButton} ${estilos.botonNuevoPersonaje}`}
            onClick={alCrearNuevo}
          >
            <Plus size={14} />
            Nuevo Personaje
          </button>
        </div>
      </div>

      {/* Cuadrícula de Tarjetas de Personajes */}
      <div className={estilos.gridPersonajesGaleria}>
        {personajes.map((pj) => {
          const esActivo = pj.id === idPersonajeActivo;
          const porcentajeVida = Math.max(0, Math.min(100, Math.round((pj.hpActual / (pj.hpMaximo || 1)) * 100)));

          return (
            <div
              key={pj.id}
              className={`${estilos.neoRaised} ${estilos.tarjetaPjGaleria} ${
                esActivo ? estilos.tarjetaPjGaleriaActiva : ""
              }`}
            >
              <div className={estilos.filaPjCabeceraGaleria}>
                <div>
                  <div className={estilos.filaNombrePj}>
                    <span className={estilos.nombrePjGaleria}>{pj.nombre}</span>
                    {esActivo && (
                      <span className={estilos.badgePjActivo}>
                        ACTIVO
                      </span>
                    )}
                  </div>
                  <span className={estilos.detallesPjGaleria}>
                    {pj.clase} {pj.subclase ? `(${pj.subclase})` : ""} Niv. {pj.nivel} • {pj.especie}
                  </span>
                </div>

                <div className={estilos.avatarCirculoPj}>
                  {pj.avatarUrl ? (
                    <img src={pj.avatarUrl} alt={pj.nombre} className={estilos.avatarImagen} />
                  ) : (
                    (pj.nombre || "P")[0].toUpperCase()
                  )}
                </div>
              </div>

              {/* Barra de Salud Resumen */}
              <div className={estilos.seccionSaludPj}>
                <div className={estilos.filaEtiquetaSaludPj}>
                  <span>Puntos de Golpe</span>
                  <span>{pj.hpActual} / {pj.hpMaximo} HP</span>
                </div>
                <div
                  className={`${estilos.neoPressed} ${estilos.pistaSaludPj}`}
                >
                  <div
                    // eslint-disable-next-line react/forbid-dom-props -- Ancho porcentual dinámico continuo en tiempo de ejecución (0-100%)
                    style={{
                      width: `${porcentajeVida}%`
                    }}
                    className={estilos.rellenoSaludPj}
                  />
                </div>
              </div>

              {/* Botones de Acción */}
              <div className={estilos.filaBotonesAccionPj}>
                {!esActivo ? (
                  <button
                    type="button"
                    className={estilos.neoButton}
                    onClick={() => alSeleccionarActivo(pj.id)}
                    title="Establecer como personaje activo"
                  >
                    <CheckCircle2 size={12} />
                    Activar
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${estilos.neoButton} ${estilos.botonVerFicha}`}
                    onClick={alAbrirFicha}
                    title="Ver ficha completa"
                  >
                    <User size={12} />
                    Ver Ficha
                  </button>
                )}

                <button
                  type="button"
                  className={estilos.neoButton}
                  onClick={() => alDuplicar(pj.id)}
                  title="Duplicar personaje"
                >
                  <Copy size={12} />
                </button>

                <button
                  type="button"
                  className={`${estilos.neoButton} ${estilos.botonAccionGestor}`}
                  onClick={() => manejarExportarPersonaje(pj)}
                  title="Copiar JSON de la ficha al portapapeles"
                  data-copiado={copiadoPjId === pj.id ? "true" : "false"}
                >
                  {copiadoPjId === pj.id ? <Check size={12} /> : <Clipboard size={12} />}
                </button>

                <button
                  type="button"
                  className={`${estilos.neoButton} ${estilos.botonEliminarPj}`}
                  onClick={() => setIdPjAEliminar(pj.id)}
                  disabled={personajes.length <= 1}
                  title={personajes.length <= 1 ? "No puedes eliminar el único personaje" : "Eliminar personaje"}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para Visualizar / Copiar JSON Manualmente */}
      {modalJSON && (
        <div
          className={estilos.overlayModalJSON}
          onClick={() => setModalJSON(null)}
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
                onClick={() => setModalJSON(null)}
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
                onClick={async () => {
                  await copiarAlPortapapeles(modalJSON.contenido);
                  agregarNotificacion("¡Texto JSON copiado al portapapeles!", "exito");
                }}
              >
                <Clipboard size={14} />
                Copiar al Portapapeles
              </button>
              <button
                type="button"
                className={estilos.neoButton}
                onClick={() => setModalJSON(null)}
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
          onClick={() => setModalPegarAbierto(false)}
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
                onClick={() => setModalPegarAbierto(false)}
              >
                <X size={14} />
              </button>
            </div>

            <div className={estilos.filaBotonesPegar}>
              <button
                type="button"
                className={`${estilos.neoButton} ${estilos.botonFlex1}`}
                onClick={() => {
                  refInputArchivo.current?.click();
                  setModalPegarAbierto(false);
                }}
                title="Seleccionar archivo .json del equipo"
              >
                <Upload size={14} />
                Seleccionar Archivo .JSON
              </button>
              <button
                type="button"
                className={`${estilos.neoButton} ${estilos.botonFlex1}`}
                onClick={manejarPegarDesdePortapapeles}
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
              onChange={(e) => {
                setTextoJSONPegado(e.target.value);
                if (errorPegado) setErrorPegado(null);
              }}
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
                onClick={() => procesarTextoJSON(textoJSONPegado)}
              >
                <Check size={14} />
                Importar Personajes
              </button>
              <button
                type="button"
                className={estilos.neoButton}
                onClick={() => {
                  setModalPegarAbierto(false);
                  setTextoJSONPegado("");
                  setErrorPegado(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Eliminar */}
      <ConfirmDialog
        abierto={idPjAEliminar !== null}
        titulo="Eliminar Personaje"
        mensaje={`¿Estás seguro de que deseas eliminar permanentemente a "${personajeAEliminar?.nombre || "este personaje"}"? Esta acción no se puede deshacer.`}
        onConfirmar={manejarConfirmarEliminacion}
        onCancelar={() => setIdPjAEliminar(null)}
      />
    </div>
  );
};
