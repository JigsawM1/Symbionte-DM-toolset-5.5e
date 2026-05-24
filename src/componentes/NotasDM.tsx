import React, { useState, useEffect, useRef } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { Save, Trash2, Check, AlertTriangle } from "lucide-react";

export const NotasDM: React.FC = () => {
  const { notasDM, guardarNotasDM } = usarAlmacenDM();
  const [textoLocal, setTextoLocal] = useState(notasDM);
  const [estadoGuardado, setEstadoGuardado] = useState<"guardado" | "modificado" | "guardando">("guardado");
  
  // Sincronizar estado local si cambia externamente (ej: al cargar datos de persistencia)
  useEffect(() => {
    setTextoLocal(notasDM);
  }, [notasDM]);

  // Temporizador para simular auto-guardado debouncificado
  const timerAutoGuardado = useRef<NodeJS.Timeout | null>(null);

  const alCambiarTexto = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nuevoTexto = e.target.value;
    setTextoLocal(nuevoTexto);
    setEstadoGuardado("modificado");

    // Limpiar temporizador previo
    if (timerAutoGuardado.current) {
      clearTimeout(timerAutoGuardado.current);
    }

    // Programar auto-guardado en 800ms
    setEstadoGuardado("guardando");
    timerAutoGuardado.current = setTimeout(() => {
      guardarNotasDM(nuevoTexto);
      setEstadoGuardado("guardado");
    }, 800);
  };

  // Limpiar temporizador al desmontar
  useEffect(() => {
    return () => {
      if (timerAutoGuardado.current) {
        clearTimeout(timerAutoGuardado.current);
      }
    };
  }, []);

  const alGuardarManual = () => {
    if (timerAutoGuardado.current) {
      clearTimeout(timerAutoGuardado.current);
    }
    guardarNotasDM(textoLocal);
    setEstadoGuardado("guardado");
  };

  const alLimpiarNotas = () => {
    if (window.confirm("¿Estás seguro de que deseas borrar todas tus notas? Esta acción no se puede deshacer.")) {
      if (timerAutoGuardado.current) {
        clearTimeout(timerAutoGuardado.current);
      }
      setTextoLocal("");
      guardarNotasDM("");
      setEstadoGuardado("guardado");
    }
  };

  const palabras = textoLocal.trim() === "" ? 0 : textoLocal.trim().split(/\s+/).length;
  const caracteres = textoLocal.length;

  return (
    <div style={estilos.contenedor}>
      <div style={estilos.cabecera}>
        <h3 style={estilos.titulo}>Bloc de Notas del DM</h3>
        
        <div style={estilos.acciones}>
          {/* Indicador de estado */}
          <div style={estilos.indicadorContenedor}>
            {estadoGuardado === "guardado" && (
              <span style={estilos.indicadorGuardado}>
                <Check size={11} />
                Auto-guardado en vivo
              </span>
            )}
            {estadoGuardado === "modificado" && (
              <span style={estilos.indicadorModificado}>
                <AlertTriangle size={11} />
                Cambios sin guardar...
              </span>
            )}
            {estadoGuardado === "guardando" && (
              <span style={estilos.indicadorGuardando}>
                <span className="activo-pulso" style={estilos.puntoPulso} />
                Guardando en LocalStorage...
              </span>
            )}
          </div>

          <button
            onClick={alGuardarManual}
            style={{
              ...estilos.boton,
              borderColor: estadoGuardado !== "guardado" ? "var(--color-borde-cian)" : "var(--color-borde-brutal)"
            }}
            title="Guardar Notas Manualmente"
          >
            <Save size={12} />
            <span>Guardar</span>
          </button>
          
          <button
            onClick={alLimpiarNotas}
            style={estilos.botonLimpiar}
            title="Limpiar Bloc de Notas"
          >
            <Trash2 size={12} />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Editor Textarea que ocupa todo el espacio */}
      <div style={estilos.editorContenedor}>
        <textarea
          value={textoLocal}
          onChange={alCambiarTexto}
          placeholder="Escribe tus notas de campaña, ideas, facciones, detalles de la sesión aquí... Se autoguardan en tiempo real."
          style={estilos.textarea}
        />
      </div>

      {/* Barra de información inferior */}
      <div style={estilos.barraInformacion}>
        <span style={estilos.estadisticaItem}>
          Palabras: <strong style={estilos.numero}>{palabras}</strong>
        </span>
        <span style={estilos.estadisticaItem}>
          Caracteres: <strong style={estilos.numero}>{caracteres}</strong>
        </span>
        <span style={estilos.avisoGuardado}>
          * Datos persistidos de forma segura en almacenamiento cifrado del Simbionte.
        </span>
      </div>
    </div>
  );
};

const estilos: { [key: string]: React.CSSProperties } = {
  contenedor: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "6px",
    backgroundColor: "var(--color-fondo-panel)",
    border: "1px solid var(--color-borde-brutal)",
    height: "100%",
    width: "100%",
    boxSizing: "border-box",
    overflow: "hidden"
  },
  cabecera: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--color-borde-brutal)",
    paddingBottom: "3px",
    flexWrap: "wrap",
    gap: "6px"
  },
  titulo: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "var(--color-texto-principal)",
    margin: 0
  },
  acciones: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  indicadorContenedor: {
    fontSize: "9.5px",
    fontFamily: "var(--fuente-codigo)"
  },
  indicadorGuardado: {
    color: "var(--color-exito)",
    display: "flex",
    alignItems: "center",
    gap: "3px"
  },
  indicadorModificado: {
    color: "var(--color-advertencia)",
    display: "flex",
    alignItems: "center",
    gap: "3px"
  },
  indicadorGuardando: {
    color: "var(--color-borde-cian)",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  puntoPulso: {
    width: "6px",
    height: "6px",
    backgroundColor: "var(--color-borde-cian)",
    borderRadius: "50%",
    display: "inline-block"
  },
  boton: {
    height: "22px",
    padding: "0 6px",
    fontSize: "10px"
  },
  botonLimpiar: {
    height: "22px",
    padding: "0 6px",
    fontSize: "10px",
    backgroundColor: "rgba(242, 92, 84, 0.1)",
    borderColor: "var(--color-peligro)",
    color: "var(--color-peligro)"
  },
  editorContenedor: {
    flex: 1,
    width: "100%",
    minHeight: "0" // Esencial para permitir que el flex reduzca el tamaño del textarea y no desborde
  },
  textarea: {
    width: "100%",
    height: "100%",
    backgroundColor: "var(--color-fondo-profundo)",
    border: "1px solid var(--color-borde-brutal)",
    color: "var(--color-texto-principal)",
    padding: "8px",
    fontSize: "11.5px",
    fontFamily: "var(--fuente-codigo)",
    resize: "none",
    boxSizing: "border-box",
    lineHeight: "1.45",
    tabSize: 4
  },
  barraInformacion: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "9.5px",
    color: "var(--color-texto-secundario)",
    paddingTop: "2px",
    borderTop: "1px dashed var(--color-borde-brutal)"
  },
  estadisticaItem: {
    display: "flex",
    gap: "4px"
  },
  numero: {
    fontFamily: "var(--fuente-codigo)",
    color: "var(--color-primario-brillante)"
  },
  avisoGuardado: {
    fontSize: "8.5px",
    color: "var(--color-texto-apagado)",
    fontStyle: "italic"
  }
};
