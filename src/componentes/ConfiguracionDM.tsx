import React, { useState, useRef } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { Upload, Download, Trash2, ShieldAlert, CheckCircle, Database, Heart, Copy, X, Eye, Settings } from "lucide-react";
import { IDS_INICIALES_MONSTRUOS, IDS_INICIALES_HECHIZOS, IDS_INICIALES_OBJETOS } from "@/utiles/datosIniciales";
import { logger } from '@/utiles/logger';
import { ts } from "../utiles/TaleSpireAdapter";
import estilosClases from "./ConfiguracionDM.module.css";

export const ConfiguracionDM: React.FC = () => {
  const baseDatosMonstruos = usarAlmacenDM((s) => s.baseDatosMonstruos);
  const baseDatosHechizos = usarAlmacenDM((s) => s.baseDatosHechizos);
  const objetosHomebrew = usarAlmacenDM((s) => s.objetosHomebrew);
  const importarBaseDatosJSONCompleta = usarAlmacenDM((s) => s.importarBaseDatosJSONCompleta);
  const restablecerDatosDeFabrica = usarAlmacenDM((s) => s.restablecerDatosDeFabrica);
  const metodoVidaMonstruo = usarAlmacenDM((s) => s.metodoVidaMonstruo);
  const establecerMetodoVidaMonstruo = usarAlmacenDM((s) => s.establecerMetodoVidaMonstruo);
  const mostrarPorcentajeVidaAJugadores = usarAlmacenDM((s) => s.mostrarPorcentajeVidaAJugadores);
  const establecerMostrarPorcentajeVidaAJugadores = usarAlmacenDM((s) => s.establecerMostrarPorcentajeVidaAJugadores);

  const [estadoImportacion, setEstadoImportacion] = useState<"inactivo" | "exito" | "error">("inactivo");
  const [mensajeError, setMensajeError] = useState("");
  const [confirmarReset, setConfirmarReset] = useState(false);
  const [modalExport, setModalExport] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const monstruosHomebrew = baseDatosMonstruos.filter((m) => !IDS_INICIALES_MONSTRUOS.has(m.id));
  const hechizosHomebrew = baseDatosHechizos.filter((h) => !IDS_INICIALES_HECHIZOS.has(h.id));
  const objetosHomebrewSolo = objetosHomebrew.filter((o) => !IDS_INICIALES_OBJETOS.has(o.id));
  const objetosHomebrewCont = objetosHomebrewSolo.length;

  const [arrastrando, setArrastrando] = useState(false);

  const alArrastrarSobre = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastrando(true);
  };

  const alArrastrarSalir = () => {
    setArrastrando(false);
  };

  const procesarArchivoJSON = (archivo: File) => {
    if (archivo.type !== "application/json" && !archivo.name.endsWith(".json")) {
      setEstadoImportacion("error");
      setMensajeError("El archivo debe ser un archivo JSON (.json) válido.");
      return;
    }

    const lector = new FileReader();
    lector.onload = (evento) => {
      try {
        const contenido = evento.target?.result as string;
        const datosParseados = JSON.parse(contenido);

        const resultado = importarBaseDatosJSONCompleta(datosParseados);

        if (resultado) {
          setEstadoImportacion("exito");
          setMensajeError("");
          setTimeout(() => setEstadoImportacion("inactivo"), 4000);
        } else {
          setEstadoImportacion("error");
          setMensajeError("El archivo JSON no tiene una estructura compatible con el Simbionte.");
        }
      } catch (e) {
        logger.error("Error al parsear archivo JSON:", e);
        setEstadoImportacion("error");
        setMensajeError("El archivo JSON contiene errores de sintaxis.");
      }
    };
    lector.readAsText(archivo);
  };

  const alSoltarArchivo = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastrando(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      procesarArchivoJSON(e.dataTransfer.files[0]);
    }
  };

  const alSeleccionarArchivoManual = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      procesarArchivoJSON(e.target.files[0]);
    }
  };

  const exportarBaseDatosCompletaJSON = async () => {
    const datosExportacion = {
      version: "5.5",
      fechaExportacion: new Date().toISOString(),
      baseDatosMonstruos,
      baseDatosHechizos,
      objetosHomebrew
    };

    const jsonStr = JSON.stringify(datosExportacion, null, 2);

    try {
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `backup_dm_homebrew_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      setModalExport(jsonStr);
    }
  };

  const copiarDelModal = async () => {
    if (!modalExport) return;
    const exito = await ts.system.clipboard.setText(modalExport);
    if (exito) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  const ejecutarRestablecerFabrica = () => {
    restablecerDatosDeFabrica();
    setConfirmarReset(false);
  };

  return (
    <div className={estilosClases.contenedor}>
      <h3 className={estilosClases.titulo}>
        <span className={estilosClases.tituloTextoPrincipal}>
          <Settings size={16} style={{ color: "var(--color-borde-cian)", marginRight: "6px", verticalAlign: "middle" }} />
          CONFIGURACIÓN Y MANTENIMIENTO DEL COMPENDIO
        </span>
        <span className={estilosClases.diagnostico}>
          <Database size={12} style={{ color: "var(--color-exito)" }} />
          <span>SISTEMA PERSISTENTE ACTIVO</span>
        </span>
      </h3>

      <div className={estilosClases.gridConfig}>
        <div className={estilosClases.seccion}>
          <div className={estilosClases.cabeceraSeccion}>
            <div className={estilosClases.barraDecorativaCian} />
            <h4 className={estilosClases.subtitulo}>IMPORTADOR DE COMPENDIOS ADAPTATIVO</h4>
          </div>
          
          <div
            onDragOver={alArrastrarSobre}
            onDragLeave={alArrastrarSalir}
            onDrop={alSoltarArchivo}
            onClick={() => fileInputRef.current?.click()}
            className={`${estilosClases.zonaDrop} ${
              arrastrando ? estilosClases.zonaDropArrastrando : ""
            }`}
          >
            <div className={estilosClases.cajaIconoUpload}>
              <Upload size={24} style={{ color: arrastrando ? "var(--color-borde-cian)" : "var(--color-texto-secundario)" }} />
            </div>
            <p className={estilosClases.textoDrop}>
              Arrastra tu archivo <strong style={{ color: "var(--color-borde-cian)", fontFamily: "var(--fuente-codigo)" }}>.json</strong> aquí o haz clic para examinar
            </p>
            <span className={estilosClases.ayudaDrop}>Soporta colecciones de monstruos, hechizos y objetos mágicos del DM</span>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={alSeleccionarArchivoManual}
              accept=".json"
              style={{ display: "none" }}
            />
          </div>

          {estadoImportacion === "exito" && (
            <div className={estilosClases.alertaExito}>
              <CheckCircle size={15} style={{ flexShrink: 0 }} />
              <span>¡Base de Datos importada con éxito y fusionada con la persistencia local!</span>
            </div>
          )}

          {estadoImportacion === "error" && (
            <div className={estilosClases.alertaError}>
              <ShieldAlert size={15} style={{ flexShrink: 0 }} />
              <span>Error de Validación: {mensajeError}</span>
            </div>
          )}

          <div className={estilosClases.estructuraAyuda}>
            <h5 className={estilosClases.tituloAyuda}>ESQUEMA JSON ESPERADO (D&D 5.5e):</h5>
            <pre className={estilosClases.codigoEjemplo}>
{`{
  "monstruos": [
    {
      "nombre": "Orco Jefe de Guerra",
      "tipo": "Humanoide",
      "ca": 16,
      "vidaMaxima": 45,
      "iniciativaBonificador": 2,
      "vidaNotas": "6d8 + 18"
    }
  ]
}`}
            </pre>
          </div>
        </div>

        {/* Columna Derecha: Dados de Vida, Backup y Peligro */}
        <div className={estilosClases.seccion}>
          <div className={estilosClases.cabeceraSeccion}>
            <div className={estilosClases.barraDecorativaPurple} />
            <h4 className={estilosClases.subtitulo}>CONFIGURACIÓN DM Y BACKUPS</h4>
          </div>

          {/* NUEVO PANEL PREMIUM: DADOS DE VIDA DE MONSTRUOS */}
          <div className={estilosClases.tarjetaConfigHP}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <Heart size={14} style={{ color: "var(--color-borde-cian)" }} />
              <span className={estilosClases.tituloConfigHP}>CÁLCULO DE VIDA (HP) AL INICIAR COMBATE</span>
            </div>
            <p className={estilosClases.descripcionConfigHP}>
              Define cómo se instancian los Puntos de Vida de los monstruos cuando son agregados a la iniciativa.
            </p>
            <div className={estilosClases.selectorHPGrid}>
              {(["estandar", "maximo", "azar"] as const).map((metodo) => {
                const activo = metodoVidaMonstruo === metodo;
                return (
                  <button
                    key={metodo}
                    onClick={() => establecerMetodoVidaMonstruo(metodo)}
                    className={`${estilosClases.botonHPBrutal} ${
                      activo ? estilosClases.botonHPBrutalActivo : ""
                    }`}
                  >
                    {metodo === "estandar"
                      ? "ESTÁNDAR (Fijo)"
                      : metodo === "maximo"
                      ? "MÁXIMO (Dados)"
                      : "AZAR (Tirada Real)"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* NUEVO PANEL: MOSTRAR PORCENTAJE DE VIDA A JUGADORES */}
          <div className={estilosClases.tarjetaConfigHP} style={{ marginTop: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <Eye size={14} style={{ color: "#818cf8" }} />
              <span className={estilosClases.tituloConfigHP}>BARRA DE SALUD EN VISTA JUGADOR (%)</span>
            </div>
            <p className={estilosClases.descripcionConfigHP}>
              Controla si los jugadores ven el porcentaje (%) de vida restante de las criaturas en combate.
            </p>
            <div className={estilosClases.selectorHPGrid}>
              <button
                onClick={() => establecerMostrarPorcentajeVidaAJugadores(true)}
                className={`${estilosClases.botonHPBrutal} ${
                  mostrarPorcentajeVidaAJugadores ? estilosClases.botonHPBrutalActivo : ""
                }`}
                type="button"
              >
                MOSTRAR % DE VIDA
              </button>
              <button
                onClick={() => establecerMostrarPorcentajeVidaAJugadores(false)}
                className={`${estilosClases.botonHPBrutal} ${
                  !mostrarPorcentajeVidaAJugadores ? estilosClases.botonHPBrutalActivo : ""
                }`}
                type="button"
              >
                OCULTAR % DE VIDA
              </button>
            </div>
          </div>

          {/* Panel Holográfico de Estadísticas */}
          <div className={estilosClases.tarjetaEstadisticas}>
            <div className={estilosClases.filaEstadistica}>
              <span className={estilosClases.labelEstadistica}>Criaturas Homebrew Creadas:</span>
              <strong className={estilosClases.numero}>{monstruosHomebrew.length}</strong>
            </div>
            <div className={estilosClases.filaEstadistica}>
              <span className={estilosClases.labelEstadistica}>Conjuros Homebrew Creados:</span>
              <strong className={estilosClases.numero}>{hechizosHomebrew.length}</strong>
            </div>
            <div className={estilosClases.filaEstadistica}>
              <span className={estilosClases.labelEstadistica}>Objetos Mágicos Homebrew Creados:</span>
              <strong className={estilosClases.numero}>{objetosHomebrewCont}</strong>
            </div>
            <div className={estilosClases.filaEstadistica}>
              <span className={estilosClases.labelEstadistica}>Total Criaturas en Sistema:</span>
              <strong className={estilosClases.numero} style={{ color: "var(--color-texto-principal)" }}>{baseDatosMonstruos.length}</strong>
            </div>
            <div className={estilosClases.filaEstadistica}>
              <span className={estilosClases.labelEstadistica}>Total Conjuros en Sistema:</span>
              <strong className={estilosClases.numero} style={{ color: "var(--color-texto-principal)" }}>{baseDatosHechizos.length}</strong>
            </div>
            <div className={estilosClases.filaEstadistica}>
              <span className={estilosClases.labelEstadistica}>Total Objetos en Sistema:</span>
              <strong className={estilosClases.numero} style={{ color: "var(--color-texto-principal)" }}>{objetosHomebrew.length}</strong>
            </div>
          </div>

          <div className={estilosClases.accionesConfig}>
            <button
              onClick={exportarBaseDatosCompletaJSON}
              className={`${estilosClases.botonDescargar} ${copiado ? estilosClases.botonDescargarExito : ""}`}
              title="Exportar JSON al portapapeles o descarga"
            >
              {copiado ? <CheckCircle size={14} /> : <Download size={14} />}
              <span>{copiado ? "¡COPIADO AL PORTAPAPELES!" : "EXPORTAR COPIA DE SEGURIDAD (.JSON)"}</span>
            </button>

            <div className={estilosClases.separador} />

            {/* ZONA DE PELIGRO TÁCTICA */}
            <div className={estilosClases.cajaZonaPeligro}>
              <div className={estilosClases.cabeceraPeligro}>
                <ShieldAlert size={14} />
                <span>NÚCLEO DE BORRADO DE SEGURIDAD</span>
              </div>
              
              {!confirmarReset ? (
                <button
                  onClick={() => setConfirmarReset(true)}
                  className={estilosClases.botonRestablecer}
                  title="Borrar todo el Homebrew del almacenamiento"
                >
                  <Trash2 size={14} />
                  <span>RESTABLECER DATOS DE FÁBRICA</span>
                </button>
              ) : (
                <div className={estilosClases.contenedorConfirmacion}>
                  <p className={estilosClases.textoConfirmacion}>
                    ⚠️ ¿RESTABLECER TODO EL SISTEMA? Esta acción irreversible eliminará permanentemente todo tu homebrew, notas, combate activo y tareas pendientes del DM.
                  </p>
                  <div className={estilosClases.botonesConfirmacion}>
                    <button
                      onClick={ejecutarRestablecerFabrica}
                      className={estilosClases.botonConfirmarReset}
                    >
                      SÍ, BORRAR TODO
                    </button>
                    <button
                      onClick={() => setConfirmarReset(false)}
                      className={estilosClases.botonCancelarReset}
                    >
                      CANCELAR
                    </button>
                  </div>
                </div>
              )}
              <p className={estilosClases.avisoPeligro}>
                Esta opción purgará la base de datos local y volverá a cargar las plantillas de referencia del manual base de D&D 5.5e (2024).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE EXPORTACIÓN — cuando los métodos automáticos fallan */}
      {modalExport && (
        <div className={estilosClases.modalOverlay} onClick={() => setModalExport(null)}>
          <div className={estilosClases.modalExport} onClick={(e) => e.stopPropagation()}>
            <div className={estilosClases.modalHeader}>
              <span>📋 EXPORTAR DATOS — Copia el JSON manualmente</span>
              <button onClick={() => setModalExport(null)} className={estilosClases.botonCerrarModal}>
                <X size={16} />
              </button>
            </div>
            <p className={estilosClases.modalAyuda}>
              Selecciona todo el texto (Ctrl+A) y cópialo (Ctrl+C), luego pégalo en un archivo <code>.json</code> en tu PC.
            </p>
            <textarea
              readOnly
              value={modalExport}
              className={estilosClases.modalTextarea}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <div className={estilosClases.modalAcciones}>
              <button onClick={copiarDelModal} className={estilosClases.botonCopiarModal}>
                <Copy size={14} />
                {copiado ? "¡Copiado!" : "Copiar al Portapapeles"}
              </button>
              <button onClick={() => setModalExport(null)} className={estilosClases.botonCerrarModalPie}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
