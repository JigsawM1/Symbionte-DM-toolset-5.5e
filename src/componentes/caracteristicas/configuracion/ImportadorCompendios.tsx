import React, { useState, useRef } from "react";
import { usarAccionesHomebrew } from "@/almacen/selectores";
import { Upload, CheckCircle, ShieldAlert } from "lucide-react";
import { logger } from "@/utiles/logger";
import estilosClases from "./ConfiguracionDM.module.css";

export const ImportadorCompendios: React.FC = () => {
  const { importarBaseDatosJSONCompleta } = usarAccionesHomebrew();

  const [estadoImportacion, setEstadoImportacion] = useState<"inactivo" | "exito" | "error">("inactivo");
  const [mensajeError, setMensajeError] = useState("");
  const [arrastrando, setArrastrando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className={estilosClases.seccion}>
      <div className={estilosClases.cabeceraSeccion}>
        <div className={estilosClases.barraDecorativaCian} />
        <h4 className={estilosClases.subtitulo}>IMPORTADOR DE COMPENDIOS</h4>
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
          <Upload size={24} className={arrastrando ? estilosClases.iconoUploadArrastrando : estilosClases.iconoUpload} />
        </div>
        <p className={estilosClases.textoDrop}>
          Arrastra tu archivo <strong className={estilosClases.extensionJson}>.json</strong> aquí o haz clic para examinar
        </p>
        <span className={estilosClases.ayudaDrop}>Soporta colecciones de monstruos, hechizos y objetos</span>

        <input
          type="file"
          ref={fileInputRef}
          onChange={alSeleccionarArchivoManual}
          accept=".json"
          className={estilosClases.inputOculto}
        />
      </div>

      {estadoImportacion === "exito" && (
        <div className={estilosClases.alertaExito}>
          <CheckCircle size={15} className="u-flex-shrink-0" />
          <span>¡Base de Datos importada con éxito y fusionada con la persistencia local!</span>
        </div>
      )}

      {estadoImportacion === "error" && (
        <div className={estilosClases.alertaError}>
          <ShieldAlert size={15} className="u-flex-shrink-0" />
          <span>Error de Validación: {mensajeError}</span>
        </div>
      )}

      <div className={estilosClases.estructuraAyuda}>
        <h5 className={estilosClases.tituloAyuda}>ESQUEMA JSON ESPERADO:</h5>
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
  );
};

