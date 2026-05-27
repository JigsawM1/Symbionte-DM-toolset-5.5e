import React, { useState, useEffect, useRef } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { Save, Trash2, Check, AlertTriangle } from "lucide-react";
import estilos from "./NotasDM.module.css";

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
    <div className={estilos.contenedor}>
      <div className={estilos.cabecera}>
        <h3 className={estilos.titulo}>Bloc de Notas del DM</h3>
        
        <div className={estilos.acciones}>
          {/* Indicador de estado */}
          <div className={estilos.indicadorContenedor}>
            {estadoGuardado === "guardado" && (
              <span className={estilos.indicadorGuardado}>
                <Check size={11} />
                Auto-guardado en vivo
              </span>
            )}
            {estadoGuardado === "modificado" && (
              <span className={estilos.indicadorModificado}>
                <AlertTriangle size={11} />
                Cambios sin guardar...
              </span>
            )}
            {estadoGuardado === "guardando" && (
              <span className={estilos.indicadorGuardando}>
                <span className={`activo-pulso ${estilos.puntoPulso}`} />
                Guardando en LocalStorage...
              </span>
            )}
          </div>

          <button
            onClick={alGuardarManual}
            className={estadoGuardado !== "guardado" ? estilos.botonGuardarDestacado : estilos.boton}
            title="Guardar Notas Manualmente"
          >
            <Save size={12} />
            <span>Guardar</span>
          </button>
          
          <button
            onClick={alLimpiarNotas}
            className={estilos.botonLimpiar}
            title="Limpiar Bloc de Notas"
          >
            <Trash2 size={12} />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Editor Textarea que ocupa todo el espacio */}
      <div className={estilos.editorContenedor}>
        <textarea
          value={textoLocal}
          onChange={alCambiarTexto}
          placeholder="Escribe tus notas de campaña, ideas, facciones, detalles de la sesión aquí... Se autoguardan en tiempo real."
          className={estilos.textarea}
        />
      </div>

      {/* Barra de información inferior */}
      <div className={estilos.barraInformacion}>
        <span className={estilos.estadisticaItem}>
          Palabras: <strong className={estilos.numero}>{palabras}</strong>
        </span>
        <span className={estilos.estadisticaItem}>
          Caracteres: <strong className={estilos.numero}>{caracteres}</strong>
        </span>
        <span className={estilos.avisoGuardado}>
          * Datos persistidos de forma segura en almacenamiento cifrado del Simbionte.
        </span>
      </div>
    </div>
  );
};
