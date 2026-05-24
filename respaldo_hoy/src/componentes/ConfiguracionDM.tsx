import React, { useState, useRef } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { Upload, Download, Trash2, ShieldAlert, CheckCircle, Database } from "lucide-react";
import { MONSTRUOS_INICIALES, HECHIZOS_INICIALES } from "../utiles/datosIniciales";

export const ConfiguracionDM: React.FC = () => {
  const {
    baseDatosMonstruos,
    baseDatosHechizos,
    objetosHomebrew,
    importarBaseDatosJSONCompleta,
    restablecerDatosDeFabrica,
    preferenciaVidaMonstruo,
    establecerPreferenciaVidaMonstruo
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

        // El importador adaptativo detectara de forma inteligente si es un array o diccionario de monstruos, hechizos u objetos
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

  // Generar y descargar copia de seguridad
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

  // Restablecer datos de fábrica se ejecuta ahora sin confirm nativa
  const ejecutarRestablecerFabrica = () => {
    restablecerDatosDeFabrica();
    window.location.reload();
  };

  return (
    <div className="config-container">
      {/* Inyección de estilos CSS premium encapsulados */}
      <style>{`
        /* --- ESTILOS PREMIUM PARA CONFIGURACION DM --- */
        .config-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 8px;
          background: var(--color-fondo-profundo);
          height: 100%;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        .config-titulo-premium {
          font-size: 13px;
          font-weight: 800;
          color: var(--color-texto-principal);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 6px;
          margin: 0;
          letter-spacing: 0.02em;
        }

        .config-diagnostico-premium {
          font-family: var(--fuente-codigo);
          color: var(--color-exito);
          font-size: 9.5px;
          display: flex;
          align-items: center;
          gap: 3px;
          background: rgba(0, 245, 212, 0.08);
          border: 1px solid rgba(0, 245, 212, 0.2);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .config-grid-premium {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 10px;
          overflow-y: auto;
          padding-right: 2px;
          margin-top: 6px;
        }

        .seccion-premium {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: rgba(28, 30, 42, 0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 14px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25);
        }

        .seccion-premium:hover {
          border-color: rgba(123, 44, 191, 0.2);
          box-shadow: 0 12px 40px 0 rgba(123, 44, 191, 0.08);
        }

        .subtitulo-premium {
          font-size: 11px;
          font-weight: 800;
          color: var(--color-borde-cian);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0;
        }

        /* Upload Portal (Zona Drop) */
        .zona-drop-premium {
          border: 2px dashed rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 22px 14px;
          text-align: center;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: rgba(13, 14, 18, 0.4);
          position: relative;
          overflow: hidden;
        }

        .zona-drop-premium:hover {
          border-color: #00f5d4;
          background: rgba(0, 245, 212, 0.03);
          box-shadow: 0 0 20px rgba(0, 245, 212, 0.1);
        }

        .icono-upload-premium {
          color: rgba(0, 245, 212, 0.65);
        }

        .zona-drop-premium:hover .icono-upload-premium {
          color: #00f5d4;
        }

        .texto-drop-premium {
          font-size: 11px;
          color: var(--color-texto-principal);
          margin: 0;
        }

        .ayuda-drop-premium {
          font-size: 9.5px;
          color: var(--color-texto-apagado);
          margin: 0;
        }

        /* Grilla de Métricas / Estadísticas */
        .grid-metricas-premium {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 8px;
          margin-bottom: 4px;
        }

        .metrica-card-premium {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: rgba(13, 14, 18, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          padding: 8px 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .metrica-card-premium:hover {
          border-color: rgba(123, 44, 191, 0.3);
          background: rgba(20, 22, 31, 0.7);
          box-shadow: 0 6px 15px rgba(123, 44, 191, 0.08);
        }

        .metrica-etiqueta-premium {
          font-size: 9px;
          font-weight: 700;
          color: var(--color-texto-secundario);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          line-height: 1.25;
        }

        .metrica-valor-premium {
          font-size: 18px;
          font-weight: 800;
          color: #ffcc00;
          font-family: var(--fuente-codigo);
        }

        /* Zona de peligro */
        .danger-panel-premium {
          background: rgba(242, 92, 84, 0.02);
          border: 1px solid rgba(242, 92, 84, 0.25);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: inset 0 0 10px rgba(242, 92, 84, 0.01);
          margin-top: 6px;
        }

        .danger-panel-premium:hover {
          border-color: rgba(242, 92, 84, 0.55);
          box-shadow: 0 0 15px rgba(242, 92, 84, 0.06), inset 0 0 10px rgba(242, 92, 84, 0.03);
        }

        .danger-title-premium {
          font-size: 11px;
          font-weight: 800;
          color: #f25c54;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .danger-confirm-box-premium {
          background: rgba(242, 92, 84, 0.05);
          border: 1px solid rgba(242, 92, 84, 0.35);
          border-radius: 8px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* Botones Premium */
        .btn-primary-premium {
          background: linear-gradient(135deg, #7b2cbf 0%, #5f5dbb 100%);
          border: 1px solid rgba(123, 44, 191, 0.4);
          border-radius: 8px;
          color: #ffffff;
          padding: 6px 14px;
          font-size: 10.5px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(95, 93, 187, 0.2);
        }

        .btn-primary-premium:hover {
          filter: brightness(1.1);
          box-shadow: 0 6px 16px rgba(95, 93, 187, 0.35);
        }

        .btn-danger-premium {
          background: linear-gradient(135deg, rgba(242, 92, 84, 0.06) 0%, rgba(242, 92, 84, 0.12) 100%);
          border: 1px solid rgba(242, 92, 84, 0.35);
          border-radius: 8px;
          color: #f25c54;
          padding: 6px 14px;
          font-size: 10.5px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .btn-danger-premium:hover {
          background: linear-gradient(135deg, rgba(242, 92, 84, 0.12) 0%, rgba(242, 92, 84, 0.2) 100%);
          border-color: #f25c54;
          color: #ffffff;
          box-shadow: 0 4px 15px rgba(242, 92, 84, 0.15);
        }

        .btn-danger-solid-premium {
          background: #f25c54;
          border: 1px solid #f25c54;
          border-radius: 8px;
          color: #ffffff;
          padding: 6px 12px;
          font-size: 10.5px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-danger-solid-premium:hover {
          background: #ef4444;
          border-color: #ef4444;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
        }

        .btn-cancel-premium {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          color: var(--color-texto-principal);
          padding: 6px 12px;
          font-size: 10.5px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-cancel-premium:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
        }

        /* Ayuda visual */
        .estructura-ayuda-premium {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .codigo-ejemplo-premium {
          font-family: var(--fuente-codigo);
          font-size: 8px;
          background: rgba(13, 14, 18, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 6px;
          color: var(--color-texto-secundario);
          margin: 0;
          overflow-x: auto;
          line-height: 1.25;
        }

        /* Selector de Preferencia de Vida */
        .preferencia-vida-contenedor-premium {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 14px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(20, 22, 31, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        }

        .preferencia-vida-label-premium {
          font-size: 10px;
          font-weight: 700;
          color: var(--color-borde-cian);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-align: left;
        }

        .preferencia-vida-select-premium {
          background: rgba(13, 14, 18, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--color-texto-principal);
          font-size: 11px;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 8px;
          outline: none;
          cursor: pointer;
          font-family: inherit;
        }

        .preferencia-vida-select-premium:focus {
          border-color: var(--color-borde-cian);
          box-shadow: 0 0 10px rgba(0, 245, 212, 0.25);
          background: rgba(13, 14, 18, 0.9);
        }
      `}</style>

      <h3 className="config-titulo-premium">
        <span>Panel de Configuración y Datos del DM</span>
        <span className="config-diagnostico-premium">
          <Database size={10} /> Integridad del Almacén
        </span>
      </h3>

      <div className="config-grid-premium">
        {/* Columna Izquierda: Importación y Exportación */}
        <div className="seccion-premium">
          <h4 className="subtitulo-premium">Importar Base de Datos JSON</h4>
          
          {/* Zona de Drop */}
          <div
            onDragOver={alArrastrarSobre}
            onDragLeave={alArrastrarSalir}
            onDrop={alSoltarArchivo}
            onClick={() => fileInputRef.current?.click()}
            className={`zona-drop-premium ${arrastrando ? "arrastrando-premium" : ""}`}
            style={{
              borderColor: arrastrando ? "#00f5d4" : "rgba(255, 255, 255, 0.08)"
            }}
          >
            <Upload size={24} className="icono-upload-premium" />
            <p className="texto-drop-premium">
              Arrastra y suelta tu archivo <strong>.json</strong> aquí o haz clic para examinar
            </p>
            <span className="ayuda-drop-premium">Soporta colecciones de monstruos, hechizos y objetos mágicos</span>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={alSeleccionarArchivo}
              accept=".json"
              style={{ display: "none" }}
            />
          </div>

          {/* Mensajes de Estado */}
          {estadoImportacion === "exito" && (
            <div style={estilos.alertaExito}>
              <CheckCircle size={14} />
              <span>¡Base de Datos importada con éxito y fusionada con persistencia!</span>
            </div>
          )}

          {estadoImportacion === "error" && (
            <div style={estilos.alertaError}>
              <ShieldAlert size={14} />
              <span>Error: {mensajeError}</span>
            </div>
          )}

          <div className="estructura-ayuda-premium">
            <span style={{ fontSize: "9.5px", fontWeight: "bold", color: "var(--color-texto-secundario)", textTransform: "uppercase" }}>Esquema JSON Esperado:</span>
            <pre className="codigo-ejemplo-premium">
{`{
  "monstruos": [
    {
      "nombre": "Orco Jefe",
      "tipo": "Humanoide",
      "ca": 16,
      "vidaMaxima": 45,
      "iniciativaBonificador": 2,
      "velocidad": "30 pies"
    }
  ],
  "hechizos": [
    {
      "nombre": "Explosión de Energía",
      "nivel": 2,
      "escuela": "Evocación",
      "tiempoLanzamiento": "1 acción",
      "alcance": "90 pies",
      "descripcion": "Disparas un rayo destructivo..."
    }
  ]
}`}
            </pre>
          </div>
        </div>

        {/* Columna Derecha: Backup, Estadísticas y Mantenimiento */}
        <div className="seccion-premium" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <h4 className="subtitulo-premium">Copias de Seguridad y Estadísticas</h4>

            {/* Grilla de Métricas Inteligentes */}
            <div className="grid-metricas-premium">
              <div className="metrica-card-premium">
                <span className="metrica-etiqueta-premium">Monstruos Homebrew</span>
                <span className="metrica-valor-premium" style={{ color: "#a29bfe" }}>{monstruosHomebrew.length}</span>
              </div>
              <div className="metrica-card-premium">
                <span className="metrica-etiqueta-premium">Hechizos Homebrew</span>
                <span className="metrica-valor-premium" style={{ color: "var(--color-borde-cian)" }}>{hechizosHomebrew.length}</span>
              </div>
              <div className="metrica-card-premium">
                <span className="metrica-etiqueta-premium">Objetos Creados</span>
                <span className="metrica-valor-premium" style={{ color: "#ffcc00" }}>{objetosHomebrewCont}</span>
              </div>
              <div className="metrica-card-premium">
                <span className="metrica-etiqueta-premium">Total Monstruos</span>
                <span className="metrica-valor-premium" style={{ color: "#ffffff" }}>{baseDatosMonstruos.length}</span>
              </div>
              <div className="metrica-card-premium" style={{ gridColumn: "span 2" }}>
                <span className="metrica-etiqueta-premium">Total Hechizos</span>
                <span className="metrica-valor-premium" style={{ color: "#ffffff" }}>{baseDatosHechizos.length}</span>
              </div>
            </div>

            <button onClick={descargarBackup} className="btn-primary-premium" title="Exportar Backup JSON" style={{ width: "100%", height: "28px" }}>
              <Download size={13} />
              <span>Exportar Copia de Seguridad</span>
            </button>

            {/* Preferencia de Vida para Monstruos */}
            <div className="preferencia-vida-contenedor-premium">
              <span className="preferencia-vida-label-premium">Preferencia de Vida para Monstruos</span>
              <select
                className="preferencia-vida-select-premium"
                value={preferenciaVidaMonstruo}
                onChange={(e) => establecerPreferenciaVidaMonstruo(e.target.value as "bloque" | "maximo" | "aleatorio")}
                title="Determina cómo se calcula la vida de un monstruo al agregarlo al combate"
              >
                <option value="bloque">Vida por Bloque (Estándar)</option>
                <option value="maximo">Vida Máxima (Dados de Vida)</option>
                <option value="aleatorio">Vida Aleatoria (Tirar Dados)</option>
              </select>
            </div>
          </div>

          {/* Zona de Peligro Rediseñada */}
          <div className="danger-panel-premium">
            <h4 className="danger-title-premium">
              <ShieldAlert size={14} />
              Zona de Peligro
            </h4>
            
            {!confirmarReset ? (
              <button
                onClick={() => setConfirmarReset(true)}
                className="btn-danger-premium"
                title="Borrar todo el Homebrew"
                style={{ width: "100%", height: "26px" }}
              >
                <Trash2 size={13} />
                <span>Restablecer Datos de Fábrica</span>
              </button>
            ) : (
              <div className="danger-confirm-box-premium">
                <p style={{ fontSize: "10px", color: "#f25c54", margin: 0, fontWeight: "800", lineHeight: "1.3", textAlign: "justify" }}>
                  ⚠️ ¿RESTABLECER DE FÁBRICA? Esta acción borrará permanentemente tus monstruos, hechizos, objetos homebrew, combate activo y notas del DM.
                </p>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={ejecutarRestablecerFabrica}
                    className="btn-danger-solid-premium"
                    style={{ flex: 1, height: "24px" }}
                  >
                    SÍ, REINICIAR
                  </button>
                  <button
                    onClick={() => setConfirmarReset(false)}
                    className="btn-cancel-premium"
                    style={{ flex: 1, height: "24px" }}
                  >
                    CANCELAR
                  </button>
                </div>
              </div>
            )}
            <p style={{ fontSize: "9.5px", color: "var(--color-texto-apagado)", margin: 0, textAlign: "justify", lineHeight: "1.25" }}>
              Esta acción eliminará de forma irreversible tus creaciones personalizadas y restablecerá el Simbionte al manual base de D&D 5.5e (2024).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const estilos: { [key: string]: React.CSSProperties } = {
  alertaExito: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    backgroundColor: "rgba(0, 245, 212, 0.08)",
    border: "1px solid var(--color-exito)",
    color: "var(--color-exito)",
    fontSize: "10.5px",
    borderRadius: "8px"
  },
  alertaError: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    backgroundColor: "rgba(242, 92, 84, 0.08)",
    border: "1px solid var(--color-peligro)",
    color: "var(--color-peligro)",
    fontSize: "10.5px",
    borderRadius: "8px"
  }
};
