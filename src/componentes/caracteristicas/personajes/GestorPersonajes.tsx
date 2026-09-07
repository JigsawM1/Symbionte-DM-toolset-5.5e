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
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
      {/* Input oculto para importación de archivos JSON */}
      <input
        ref={refInputArchivo}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={manejarArchivoImportar}
      />

      {/* Cabecera del Gestor */}
      <div className={estilos.cabeceraGestor}>
        <div>
          <h2 className={estilos.tituloGestor}>Mis Personajes Guardados</h2>
          <p style={{ fontSize: 11, color: "var(--color-texto-apagado)", margin: "2px 0 0 0" }}>
            Administra tus héroes, copia su JSON al portapapeles o importa nuevos.
          </p>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {personajes.length > 0 && (
            <button
              type="button"
              className={estilos.neoButton}
              onClick={manejarExportarGrupo}
              title={`Copiar todo el grupo (${personajes.length} personajes) al portapapeles`}
              style={grupoCopiado ? { borderColor: "var(--color-borde-cian)", color: "var(--color-borde-cian)" } : {}}
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
            className={estilos.neoButton}
            onClick={alCrearNuevo}
            style={{ backgroundColor: "var(--color-primario)", color: "#fff", borderColor: "var(--color-borde-cian)" }}
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
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className={estilos.nombrePjGaleria}>{pj.nombre}</span>
                    {esActivo && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: "var(--color-borde-cian)",
                          backgroundColor: "rgba(0, 245, 212, 0.12)",
                          border: "1px solid var(--color-borde-cian)",
                          padding: "1px 5px",
                          borderRadius: 10
                        }}
                      >
                        ACTIVO
                      </span>
                    )}
                  </div>
                  <span className={estilos.detallesPjGaleria}>
                    {pj.clase} {pj.subclase ? `(${pj.subclase})` : ""} Niv. {pj.nivel} • {pj.especie}
                  </span>
                </div>

                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-fondo-tarjeta)",
                    border: "1px solid var(--color-borde-brutal)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 14,
                    color: "var(--color-primario-brillante)",
                    overflow: "hidden"
                  }}
                >
                  {pj.avatarUrl ? (
                    <img src={pj.avatarUrl} alt={pj.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    (pj.nombre || "P")[0].toUpperCase()
                  )}
                </div>
              </div>

              {/* Barra de Salud Resumen */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-texto-apagado)" }}>
                  <span>Puntos de Golpe</span>
                  <span>{pj.hpActual} / {pj.hpMaximo} HP</span>
                </div>
                <div
                  className={estilos.neoPressed}
                  style={{ height: 6, borderRadius: 3, position: "relative", overflow: "hidden" }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${porcentajeVida}%`,
                      backgroundColor: "var(--color-primario)"
                    }}
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
                    className={estilos.neoButton}
                    onClick={alAbrirFicha}
                    title="Ver ficha completa"
                    style={{ borderColor: "var(--color-borde-cian)", color: "var(--color-borde-cian)" }}
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
                  className={estilos.neoButton}
                  onClick={() => manejarExportarPersonaje(pj)}
                  title="Copiar JSON de la ficha al portapapeles"
                  style={copiadoPjId === pj.id ? { borderColor: "var(--color-borde-cian)", color: "var(--color-borde-cian)" } : {}}
                >
                  {copiadoPjId === pj.id ? <Check size={12} /> : <Clipboard size={12} />}
                </button>

                <button
                  type="button"
                  className={estilos.neoButton}
                  onClick={() => setIdPjAEliminar(pj.id)}
                  disabled={personajes.length <= 1}
                  title={personajes.length <= 1 ? "No puedes eliminar el único personaje" : "Eliminar personaje"}
                  style={{ color: "var(--color-peligro)" }}
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
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16
          }}
          onClick={() => setModalJSON(null)}
        >
          <div
            className={estilos.neoRaised}
            style={{
              width: "100%",
              maxWidth: 540,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              maxHeight: "85vh"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={16} style={{ color: "var(--color-borde-cian)" }} />
                <h3 style={{ margin: 0, fontSize: 14 }}>{modalJSON.titulo}</h3>
              </div>
              <button
                type="button"
                className={estilos.neoButton}
                onClick={() => setModalJSON(null)}
                style={{ minHeight: 24, padding: "2px 6px" }}
              >
                <X size={14} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 11, color: "var(--color-texto-apagado)" }}>
              Copia el código JSON a continuación para compartir o respaldar la ficha:
            </p>

            <textarea
              readOnly
              value={modalJSON.contenido}
              rows={12}
              style={{
                width: "100%",
                backgroundColor: "var(--color-fondo-panel)",
                border: "1px solid var(--color-borde-brutal)",
                borderRadius: 6,
                color: "#e2e8f0",
                fontSize: 11,
                fontFamily: "monospace",
                padding: 8,
                resize: "vertical",
                boxSizing: "border-box"
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                className={estilos.neoButton}
                onClick={async () => {
                  await copiarAlPortapapeles(modalJSON.contenido);
                  agregarNotificacion("¡Texto JSON copiado al portapapeles!", "exito");
                }}
                style={{ backgroundColor: "var(--color-primario)", color: "#fff", borderColor: "var(--color-borde-cian)" }}
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
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16
          }}
          onClick={() => setModalPegarAbierto(false)}
        >
          <div
            className={estilos.neoRaised}
            style={{
              width: "100%",
              maxWidth: 540,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              maxHeight: "85vh"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Upload size={16} style={{ color: "var(--color-borde-cian)" }} />
                <h3 style={{ margin: 0, fontSize: 14 }}>Importar Ficha o Grupo JSON</h3>
              </div>
              <button
                type="button"
                className={estilos.neoButton}
                onClick={() => setModalPegarAbierto(false)}
                style={{ minHeight: 24, padding: "2px 6px" }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className={estilos.neoButton}
                onClick={() => {
                  refInputArchivo.current?.click();
                  setModalPegarAbierto(false);
                }}
                title="Seleccionar archivo .json del equipo"
                style={{ flex: 1 }}
              >
                <Upload size={14} />
                Seleccionar Archivo .JSON
              </button>
              <button
                type="button"
                className={estilos.neoButton}
                onClick={manejarPegarDesdePortapapeles}
                title="Pegar contenido del portapapeles"
                style={{ flex: 1 }}
              >
                <Clipboard size={14} />
                Pegar Portapapeles
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 11, color: "var(--color-texto-apagado)" }}>
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
              style={{
                width: "100%",
                backgroundColor: "var(--color-fondo-panel)",
                border: errorPegado ? "1px solid var(--color-peligro)" : "1px solid var(--color-borde-brutal)",
                borderRadius: 6,
                color: "#e2e8f0",
                fontSize: 11,
                fontFamily: "monospace",
                padding: 8,
                resize: "vertical",
                boxSizing: "border-box"
              }}
            />

            {errorPegado && (
              <span style={{ color: "var(--color-peligro)", fontSize: 11, fontWeight: 600 }}>
                {errorPegado}
              </span>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                className={estilos.neoButton}
                disabled={!textoJSONPegado.trim()}
                onClick={() => procesarTextoJSON(textoJSONPegado)}
                style={{ backgroundColor: "var(--color-primario)", color: "#fff", borderColor: "var(--color-borde-cian)" }}
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
