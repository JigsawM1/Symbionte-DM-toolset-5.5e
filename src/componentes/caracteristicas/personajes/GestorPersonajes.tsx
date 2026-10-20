import React, { useState, useRef, useEffect } from "react";
import type { PersonajeJugador } from "@/tipos";
import { ConfirmDialog } from "@/componentes/comunes/ConfirmDialog";
import { Plus, Copy, Trash2, CheckCircle2, User, Download, Upload, Check } from "lucide-react";
import { importarPersonajesDesdeJSON } from "@/almacen/importadorJSON";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { usarAccionesConfiguracion } from "@/almacen/selectores";
import { copiarAlPortapapeles, descargarArchivoJSON } from "@/servicios/sistemaTaleSpire";
import { deshidratarPersonaje, hidratarPersonaje } from "@/servicios/serializadorPersonaje";
import { ModalesJSONGestorPersonajes } from "./subcomponentes/ModalesJSONGestorPersonajes";
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
  const timerCopiadoPjRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerGrupoCopiadoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerCopiadoPjRef.current) clearTimeout(timerCopiadoPjRef.current);
      if (timerGrupoCopiadoRef.current) clearTimeout(timerGrupoCopiadoRef.current);
    };
  }, []);

  const personajeAEliminar = personajes.find((p) => p.id === idPjAEliminar);

  const manejarConfirmarEliminacion = () => {
    if (idPjAEliminar) {
      alEliminar(idPjAEliminar);
      setIdPjAEliminar(null);
    }
  };

  const manejarExportarPersonaje = async (pj: PersonajeJugador) => {
    const estadoActual = usarAlmacenDM.getState();
    const pjActual = (estadoActual.personajes || []).find((p) => p.id === pj.id) || pj;

    const datos = {
      version: "5.5",
      fechaExportacion: new Date().toISOString(),
      personajes: [deshidratarPersonaje(pjActual)]
    };
    const jsonStr = JSON.stringify(datos, null, 2);

    // 1. Copiar al portapapeles desacoplado
    const exitoCopiado = await copiarAlPortapapeles(jsonStr);

    // 2. Descarga en navegador / cliente CEF
    const nombreArchivo = `ficha_${(pjActual.nombre || "personaje").toLowerCase().replace(/\s+/g, "_")}.json`;
    const exitoDescarga = descargarArchivoJSON(jsonStr, nombreArchivo);

    if (exitoCopiado) {
      setCopiadoPjId(pj.id);
      if (timerCopiadoPjRef.current) clearTimeout(timerCopiadoPjRef.current);
      timerCopiadoPjRef.current = setTimeout(() => {
        setCopiadoPjId(null);
        timerCopiadoPjRef.current = null;
      }, 3000);
      agregarNotificacion(`¡Ficha de "${pjActual.nombre}" copiada al portapapeles en formato JSON!`, "exito");
    } else if (exitoDescarga) {
      agregarNotificacion(`¡Ficha de "${pjActual.nombre}" descargada correctamente!`, "exito");
    }

    if (!exitoCopiado && !exitoDescarga) {
      logger.warn("[GestorPersonajes] Falló la copia al portapapeles y la descarga automática, mostrando modal alternativo.");
      setModalJSON({
        titulo: `Ficha de ${pjActual.nombre} (JSON)`,
        contenido: jsonStr
      });
    }
  };

  const manejarExportarGrupo = async () => {
    const estadoActual = usarAlmacenDM.getState();
    const personajesActuales = (estadoActual.personajes && estadoActual.personajes.length > 0)
      ? estadoActual.personajes
      : personajes;

    if (personajesActuales.length === 0) return;

    const datos = {
      version: "5.5",
      fechaExportacion: new Date().toISOString(),
      personajes: personajesActuales.map(deshidratarPersonaje)
    };
    const jsonStr = JSON.stringify(datos, null, 2);

    const exitoCopiado = await copiarAlPortapapeles(jsonStr);

    const fecha = new Date().toISOString().split("T")[0];
    const nombreArchivo = `grupo_personajes_${fecha}.json`;
    const exitoDescarga = descargarArchivoJSON(jsonStr, nombreArchivo);

    if (exitoCopiado) {
      setGrupoCopiado(true);
      if (timerGrupoCopiadoRef.current) clearTimeout(timerGrupoCopiadoRef.current);
      timerGrupoCopiadoRef.current = setTimeout(() => {
        setGrupoCopiado(false);
        timerGrupoCopiadoRef.current = null;
      }, 3000);
      agregarNotificacion(`¡Respaldo de grupo (${personajesActuales.length} personajes) copiado al portapapeles!`, "exito");
    } else if (exitoDescarga) {
      agregarNotificacion(`¡Respaldo de grupo (${personajesActuales.length} personajes) descargado correctamente!`, "exito");
    }

    if (!exitoCopiado && !exitoDescarga) {
      logger.warn("[GestorPersonajes] Falló la copia al portapapeles y la descarga automática del grupo, mostrando modal alternativo.");
      setModalJSON({
        titulo: `Respaldo del Grupo (${personajesActuales.length} Personajes)`,
        contenido: jsonStr
      });
    }
  };

  const procesarTextoJSON = (texto: string) => {
    try {
      const parsed = JSON.parse(texto);
      const pjs = importarPersonajesDesdeJSON(parsed).map(hidratarPersonaje);
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
                  title="Exportar ficha (.json) al portapapeles y archivo"
                  data-copiado={copiadoPjId === pj.id ? "true" : "false"}
                >
                  {copiadoPjId === pj.id ? <Check size={12} /> : <Download size={12} />}
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

      {/* Modales para Visualizar, Copiar y Pegar JSON */}
      <ModalesJSONGestorPersonajes
        modalJSON={modalJSON}
        alCerrarModalJSON={() => setModalJSON(null)}
        modalPegarAbierto={modalPegarAbierto}
        alCerrarModalPegar={() => {
          setModalPegarAbierto(false);
          setTextoJSONPegado("");
          setErrorPegado(null);
        }}
        textoJSONPegado={textoJSONPegado}
        alCambiarTextoJSONPegado={(texto) => {
          setTextoJSONPegado(texto);
          if (errorPegado) setErrorPegado(null);
        }}
        errorPegado={errorPegado}
        alProcesarTextoJSON={procesarTextoJSON}
        alAbrirSelectorArchivo={() => {
          refInputArchivo.current?.click();
          setModalPegarAbierto(false);
        }}
        alPegarDesdePortapapeles={manejarPegarDesdePortapapeles}
        alCopiarTextoJSON={async (texto) => {
          await copiarAlPortapapeles(texto);
          agregarNotificacion("¡Texto JSON copiado al portapapeles!", "exito");
        }}
      />

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
