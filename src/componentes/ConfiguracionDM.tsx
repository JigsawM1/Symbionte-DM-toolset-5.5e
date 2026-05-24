import React, { useState, useRef } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { Upload, Download, Trash2, ShieldAlert, CheckCircle, Database, Heart } from "lucide-react";
import { MONSTRUOS_INICIALES, HECHIZOS_INICIALES } from "../utiles/datosIniciales";

export const ConfiguracionDM: React.FC = () => {
  const {
    baseDatosMonstruos,
    baseDatosHechizos,
    objetosHomebrew,
    importarBaseDatosJSONCompleta,
    restablecerDatosDeFabrica,
    metodoVidaMonstruo,
    establecerMetodoVidaMonstruo
  } = usarAlmacenDM();

  const [estadoImportacion, setEstadoImportacion] = useState<"inactivo" | "exito" | "error">("inactivo");
  const [mensajeError, setMensajeError] = useState("");
  const [confirmarReset, setConfirmarReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calcular estadísticas de homebrew
  const idsInicialesMonstruos = new Set(MONSTRUOS_INICIALES.map((m) => m.id));
  const idsInicialesHechizos = new Set(HECHIZOS_INICIALES.map((h) => h.id));

  const monstruosHomebrew = baseDatosMonstruos.filter(
    (m) => !idsInicialesMonstruos.has(m.id)
  );
  const hechizosHomebrew = baseDatosHechizos.filter(
    (h) => !idsInicialesHechizos.has(h.id)
  );
  const objetosHomebrewCont = objetosHomebrew.length;

  // Manejar arrastrar y soltar archivos JSON
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
        const datos = JSON.parse(contenido);

        const exito = importarBaseDatosJSONCompleta(datos);
        if (exito) {
          setEstadoImportacion("exito");
          setTimeout(() => setEstadoImportacion("inactivo"), 4000);
        } else {
          throw new Error("El importador no detectó cambios nuevos o falló el formato interno.");
        }
      } catch (err: any) {
        setEstadoImportacion("error");
        setMensajeError(err.message || "Error al decodificar y validar el archivo JSON.");
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

  const alSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      procesarArchivoJSON(e.target.files[0]);
    }
  };

  const descargarBackup = () => {
    const backupData = {
      tipo: "talespire_dm_screen_backup",
      fecha: new Date().toISOString(),
      monstruos: monstruosHomebrew,
      hechizos: hechizosHomebrew,
      objetos: objetosHomebrew
    };

    const stringData = JSON.stringify(backupData, null, 2);
    const blob = new Blob([stringData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `backup_dm_homebrew_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  };

  const ejecutarRestablecerFabrica = () => {
    restablecerDatosDeFabrica();
    window.location.reload();
  };

  return (
    <div style={estilos.contenedor}>
      <h3 style={estilos.titulo}>
        <span style={estilos.tituloTextoPrincipal}>🛠️ CONFIGURACIÓN Y MANTENIMIENTO DEL COMPENDIO</span>
        <span style={estilos.diagnostico}>
          <Database size={12} style={{ color: "var(--color-exito)" }} />
          <span>SISTEMA PERSISTENTE ACTIVO</span>
        </span>
      </h3>

      <div style={estilos.gridConfig}>
        {/* Columna Izquierda: Importación Adaptativa */}
        <div style={estilos.seccion}>
          <div style={estilos.cabeceraSeccion}>
            <div style={estilos.barraDecorativaCian} />
            <h4 style={estilos.subtitulo}>IMPORTADOR DE COMPENDIOS ADAPTATIVO</h4>
          </div>
          
          <div
            onDragOver={alArrastrarSobre}
            onDragLeave={alArrastrarSalir}
            onDrop={alSoltarArchivo}
            onClick={() => fileInputRef.current?.click()}
            style={{
              ...estilos.zonaDrop,
              borderColor: arrastrando
                ? "var(--color-borde-cian)"
                : "var(--color-borde-brutal)",
              backgroundColor: arrastrando
                ? "hsl(222, 25%, 12%)"
                : "hsl(222, 25%, 5%)"
            }}
          >
            <div style={estilos.cajaIconoUpload}>
              <Upload size={24} style={{ color: arrastrando ? "var(--color-borde-cian)" : "var(--color-texto-secundario)" }} />
            </div>
            <p style={estilos.textoDrop}>
              Arrastra tu archivo <strong style={{ color: "var(--color-borde-cian)", fontFamily: "var(--fuente-codigo)" }}>.json</strong> aquí o haz clic para examinar
            </p>
            <span style={estilos.ayudaDrop}>Soporta colecciones de monstruos, hechizos y objetos mágicos del DM</span>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={alSeleccionarArchivo}
              accept=".json"
              style={{ display: "none" }}
            />
          </div>

          {estadoImportacion === "exito" && (
            <div style={estilos.alertaExito}>
              <CheckCircle size={15} style={{ flexShrink: 0 }} />
              <span>¡Base de Datos importada con éxito y fusionada con la persistencia local!</span>
            </div>
          )}

          {estadoImportacion === "error" && (
            <div style={estilos.alertaError}>
              <ShieldAlert size={15} style={{ flexShrink: 0 }} />
              <span>Error de Validación: {mensajeError}</span>
            </div>
          )}

          <div style={estilos.estructuraAyuda}>
            <h5 style={estilos.tituloAyuda}>ESQUEMA JSON ESPERADO (D&D 5.5e):</h5>
            <pre style={estilos.codigoEjemplo}>
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
        <div style={estilos.seccion}>
          <div style={estilos.cabeceraSeccion}>
            <div style={estilos.barraDecorativaPurple} />
            <h4 style={estilos.subtitulo}>CONFIGURACIÓN DM Y BACKUPS</h4>
          </div>

          {/* NUEVO PANEL PREMIUM: DADOS DE VIDA DE MONSTRUOS */}
          <div style={estilos.tarjetaConfigHP}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <Heart size={14} style={{ color: "var(--color-borde-cian)" }} />
              <span style={estilos.tituloConfigHP}>CÁLCULO DE VIDA (HP) AL INICIAR COMBATE</span>
            </div>
            <p style={estilos.descripcionConfigHP}>
              Define cómo se instancian los Puntos de Vida de los monstruos cuando son agregados a la iniciativa.
            </p>
            <div style={estilos.selectorHPGrid}>
              {(["estandar", "maximo", "azar"] as const).map((metodo) => {
                const activo = metodoVidaMonstruo === metodo;
                return (
                  <button
                    key={metodo}
                    onClick={() => establecerMetodoVidaMonstruo(metodo)}
                    style={{
                      ...estilos.botonHPBrutal,
                      backgroundColor: activo ? "var(--color-primario)" : "hsl(222, 25%, 5%)",
                      borderColor: activo ? "var(--color-borde-neon)" : "var(--color-borde-brutal)",
                      color: activo ? "#ffffff" : "var(--color-texto-secundario)",
                      fontWeight: activo ? "800" : "500"
                    }}
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

          {/* Panel Holográfico de Estadísticas */}
          <div style={estilos.tarjetaEstadisticas}>
            <div style={estilos.filaEstadistica}>
              <span style={estilos.labelEstadistica}>Criaturas Homebrew Creadas:</span>
              <strong style={estilos.numero}>{monstruosHomebrew.length}</strong>
            </div>
            <div style={estilos.filaEstadistica}>
              <span style={estilos.labelEstadistica}>Conjuros Homebrew Creados:</span>
              <strong style={estilos.numero}>{hechizosHomebrew.length}</strong>
            </div>
            <div style={estilos.filaEstadistica}>
              <span style={estilos.labelEstadistica}>Objetos Mágicos en Inventario:</span>
              <strong style={estilos.numero}>{objetosHomebrewCont}</strong>
            </div>
            <div style={estilos.filaEstadistica}>
              <span style={estilos.labelEstadistica}>Total Criaturas en Sistema:</span>
              <strong style={{ ...estilos.numero, color: "var(--color-texto-principal)" }}>{baseDatosMonstruos.length}</strong>
            </div>
            <div style={estilos.filaEstadistica}>
              <span style={estilos.labelEstadistica}>Total Conjuros en Sistema:</span>
              <strong style={{ ...estilos.numero, color: "var(--color-texto-principal)" }}>{baseDatosHechizos.length}</strong>
            </div>
          </div>

          <div style={estilos.accionesConfig}>
            <button onClick={descargarBackup} style={estilos.botonDescargar} title="Exportar Backup JSON">
              <Download size={14} />
              <span>EXPORTAR COPIA DE SEGURIDAD (.JSON)</span>
            </button>

            <div style={estilos.separador} />

            {/* ZONA DE PELIGRO TÁCTICA */}
            <div style={estilos.cajaZonaPeligro}>
              <div style={estilos.cabeceraPeligro}>
                <ShieldAlert size={14} />
                <span>NÚCLEO DE BORRADO DE SEGURIDAD</span>
              </div>
              
              {!confirmarReset ? (
                <button
                  onClick={() => setConfirmarReset(true)}
                  style={estilos.botonRestablecer}
                  title="Borrar todo el Homebrew del almacenamiento"
                >
                  <Trash2 size={14} />
                  <span>RESTABLECER DATOS DE FÁBRICA</span>
                </button>
              ) : (
                <div style={estilos.contenedorConfirmacion}>
                  <p style={estilos.textoConfirmacion}>
                    ⚠️ ¿RESTABLECER TODO EL SISTEMA? Esta acción irreversible eliminará permanentemente todo tu homebrew, notas, combate activo y tareas pendientes del DM.
                  </p>
                  <div style={estilos.botonesConfirmacion}>
                    <button
                      onClick={ejecutarRestablecerFabrica}
                      style={estilos.botonConfirmarReset}
                    >
                      SÍ, BORRAR TODO
                    </button>
                    <button
                      onClick={() => setConfirmarReset(false)}
                      style={estilos.botonCancelarReset}
                    >
                      CANCELAR
                    </button>
                  </div>
                </div>
              )}
              <p style={estilos.avisoPeligro}>
                Esta opción purgará la base de datos local y volverá a cargar las plantillas de referencia del manual base de D&D 5.5e (2024).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const estilos: { [key: string]: React.CSSProperties } = {
  contenedor: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "8px",
    backgroundColor: "var(--color-fondo-panel)",
    border: "1px solid var(--color-borde-brutal)",
    height: "100%",
    width: "100%",
    boxSizing: "border-box",
    overflow: "hidden"
  },
  titulo: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "var(--color-texto-principal)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "2px solid var(--color-borde-brutal)",
    paddingBottom: "6px",
    margin: 0,
    fontFamily: "var(--fuente-titulo)"
  },
  tituloTextoPrincipal: {
    letterSpacing: "0.03em"
  },
  diagnostico: {
    fontFamily: "var(--fuente-codigo)",
    color: "var(--color-exito)",
    fontSize: "9.5px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    border: "1px solid rgba(0, 245, 212, 0.25)",
    padding: "2px 6px",
    backgroundColor: "rgba(0, 245, 212, 0.03)",
    borderRadius: "2px"
  },
  gridConfig: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "10px",
    overflowY: "auto",
    paddingRight: "2px"
  },
  seccion: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    padding: "8px",
    height: "fit-content"
  },
  cabeceraSeccion: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "6px",
    marginBottom: "2px"
  },
  barraDecorativaCian: {
    width: "3px",
    height: "12px",
    backgroundColor: "var(--color-borde-cian)",
    flexShrink: 0
  },
  barraDecorativaPurple: {
    width: "3px",
    height: "12px",
    backgroundColor: "#7b2cbf",
    flexShrink: 0
  },
  subtitulo: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "var(--color-texto-principal)",
    letterSpacing: "0.04em",
    margin: 0,
    fontFamily: "var(--fuente-codigo)"
  },
  zonaDrop: {
    border: "1px dashed var(--color-borde-brutal)",
    padding: "16px 8px",
    textAlign: "center",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    userSelect: "none"
  },
  cajaIconoUpload: {
    backgroundColor: "hsl(222, 18%, 8%)",
    border: "1px solid var(--color-borde-brutal)",
    width: "36px",
    height: "36px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  textoDrop: {
    fontSize: "11px",
    color: "var(--color-texto-principal)",
    margin: 0,
    lineHeight: "1.3"
  },
  ayudaDrop: {
    fontSize: "9.5px",
    color: "var(--color-texto-apagado)",
    margin: 0,
    lineHeight: "1.2"
  },
  alertaExito: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 8px",
    backgroundColor: "rgba(0, 245, 212, 0.08)",
    border: "1px solid var(--color-exito)",
    color: "var(--color-exito)",
    fontSize: "11px",
    lineHeight: "1.3"
  },
  alertaError: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 8px",
    backgroundColor: "rgba(242, 92, 84, 0.08)",
    border: "1px solid var(--color-peligro)",
    color: "var(--color-peligro)",
    fontSize: "11px",
    lineHeight: "1.3"
  },
  estructuraAyuda: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  tituloAyuda: {
    fontSize: "9.5px",
    fontWeight: "bold",
    color: "var(--color-texto-secundario)",
    margin: "4px 0 0 0",
    letterSpacing: "0.02em"
  },
  codigoEjemplo: {
    fontFamily: "var(--fuente-codigo)",
    fontSize: "9.5px",
    backgroundColor: "hsl(222, 25%, 4%)",
    border: "1px solid var(--color-borde-brutal)",
    padding: "6px",
    color: "var(--color-texto-secundario)",
    margin: 0,
    overflowX: "auto",
    lineHeight: "1.3",
    borderRadius: "2px"
  },
  tarjetaConfigHP: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    backgroundColor: "hsl(222, 18%, 7%)",
    border: "1px solid var(--color-borde-brutal)",
    padding: "8px",
    borderRadius: "4px"
  },
  tituloConfigHP: {
    fontSize: "10.5px",
    fontWeight: "800",
    color: "var(--color-texto-principal)",
    letterSpacing: "0.02em",
    fontFamily: "var(--fuente-codigo)"
  },
  descripcionConfigHP: {
    fontSize: "10px",
    color: "var(--color-texto-secundario)",
    margin: 0,
    lineHeight: "1.3"
  },
  selectorHPGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "4px",
    marginTop: "4px"
  },
  botonHPBrutal: {
    height: "26px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "9.5px",
    cursor: "pointer",
    border: "1px solid",
    transition: "none",
    borderRadius: "2px"
  },
  tarjetaEstadisticas: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    backgroundColor: "hsl(222, 25%, 5%)",
    border: "1px solid var(--color-borde-brutal)",
    padding: "8px",
    borderRadius: "4px"
  },
  filaEstadistica: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "11px",
    color: "var(--color-texto-secundario)",
    borderBottom: "1px dashed hsl(222, 12%, 12%)",
    paddingBottom: "3px"
  },
  labelEstadistica: {
    fontWeight: "500"
  },
  numero: {
    fontFamily: "var(--fuente-codigo)",
    color: "var(--color-borde-cian)",
    fontSize: "12px"
  },
  accionesConfig: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  botonDescargar: {
    width: "100%",
    height: "26px",
    backgroundColor: "var(--color-primario)",
    color: "#ffffff",
    borderColor: "var(--color-borde-neon)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    fontSize: "10.5px",
    fontWeight: "bold",
    letterSpacing: "0.02em"
  },
  separador: {
    height: "1px",
    backgroundColor: "var(--color-borde-brutal)",
    margin: "2px 0"
  },
  cajaZonaPeligro: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    border: "1px solid rgba(242, 92, 84, 0.2)",
    backgroundColor: "rgba(242, 92, 84, 0.02)",
    padding: "8px",
    borderRadius: "4px"
  },
  cabeceraPeligro: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "4px",
    fontSize: "10.5px",
    fontWeight: "bold",
    color: "var(--color-peligro)",
    fontFamily: "var(--fuente-codigo)",
    letterSpacing: "0.02em"
  },
  botonRestablecer: {
    width: "100%",
    height: "26px",
    backgroundColor: "rgba(242, 92, 84, 0.08)",
    borderColor: "rgba(242, 92, 84, 0.3)",
    color: "var(--color-peligro)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    fontSize: "10.5px",
    fontWeight: "bold",
    letterSpacing: "0.02em"
  },
  avisoPeligro: {
    fontSize: "9.5px",
    color: "var(--color-texto-apagado)",
    textAlign: "justify",
    margin: 0,
    lineHeight: "1.3"
  },
  contenedorConfirmacion: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "8px",
    backgroundColor: "rgba(242, 92, 84, 0.1)",
    border: "1px solid var(--color-peligro)",
    borderRadius: "4px"
  },
  textoConfirmacion: {
    fontSize: "10px",
    color: "var(--color-peligro)",
    margin: 0,
    fontWeight: "bold",
    lineHeight: "1.35",
    textAlign: "justify"
  },
  botonesConfirmacion: {
    display: "flex",
    gap: "4px"
  },
  botonConfirmarReset: {
    flex: 1,
    height: "24px",
    backgroundColor: "var(--color-peligro)",
    color: "#ffffff",
    borderColor: "var(--color-peligro)",
    fontSize: "10px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  botonCancelarReset: {
    flex: 1,
    height: "24px",
    backgroundColor: "hsl(222, 25%, 5%)",
    color: "var(--color-texto-principal)",
    borderColor: "var(--color-borde-brutal)",
    fontSize: "10px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }
};
