import React, { useEffect, useRef } from "react";
import type { AccionDescanso, TipoAccionDescanso } from "@/servicios/procesadorDescansos";
import {
  Moon,
  Coffee,
  X,
  Heart,
  Dices,
  Sparkles,
  Shield,
  Activity,
  Skull,
  Zap,
  CheckCircle2
} from "lucide-react";
import estilos from "./ModalResumenDescanso.module.css";

interface ModalResumenDescansoProps {
  abierto: boolean;
  tipoDescanso: "corto" | "largo";
  acciones: AccionDescanso[];
  nombrePersonaje: string;
  alCerrar: () => void;
}

const obtenerIconoAccion = (tipo: TipoAccionDescanso) => {
  switch (tipo) {
    case "hp":
      return <Heart size={16} color="#ef4444" />;
    case "dadosGolpe":
      return <Dices size={16} color="#818cf8" />;
    case "ranura":
      return <Sparkles size={16} color="#c084fc" />;
    case "temporal":
      return <Shield size={16} color="#38bdf8" />;
    case "cansancio":
      return <Activity size={16} color="#f59e0b" />;
    case "salvacionesMuerte":
      return <Skull size={16} color="#94a3b8" />;
    case "recurso":
      return <Zap size={16} color="#fbbf24" />;
    default:
      return <CheckCircle2 size={16} color="#10b981" />;
  }
};

export const ModalResumenDescanso: React.FC<ModalResumenDescansoProps> = ({
  abierto,
  tipoDescanso,
  acciones,
  nombrePersonaje,
  alCerrar
}) => {
  const botonAceptarRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!abierto) return;

    // Foco automático en el botón de aceptar
    botonAceptarRef.current?.focus();

    // Cierre con la tecla Escape
    const manejarKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        alCerrar();
      }
    };

    window.addEventListener("keydown", manejarKeyDown);
    return () => window.removeEventListener("keydown", manejarKeyDown);
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  const esLargo = tipoDescanso === "largo";
  const tituloModal = esLargo ? "Descanso Largo Completado" : "Descanso Corto Completado";

  return (
    <div
      className={estilos.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) alCerrar();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-resumen-descanso"
    >
      <div className={estilos.modal}>
        {/* Cabecera */}
        <div className={estilos.cabecera}>
          <div className={estilos.tituloConIcono}>
            <div className={`${estilos.iconoCabecera} ${esLargo ? estilos.iconoCabeceraLargo : ""}`}>
              {esLargo ? <Moon size={18} /> : <Coffee size={18} />}
            </div>
            <div>
              <h2 id="titulo-resumen-descanso" className={estilos.titulo}>
                {tituloModal}
              </h2>
              <p className={estilos.subtitulo}>{nombrePersonaje}</p>
            </div>
          </div>
          <button
            type="button"
            className={estilos.botonCerrar}
            onClick={alCerrar}
            aria-label="Cerrar resumen de descanso"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo con lista de efectos y recuperaciones */}
        <div className={estilos.cuerpo}>
          {acciones.length > 0 ? (
            <div className={estilos.listaAcciones}>
              {acciones.map((accion, idx) => (
                <div key={`${accion.tipo}-${idx}`} className={estilos.itemAccion}>
                  <span className={estilos.iconoAccion}>{obtenerIconoAccion(accion.tipo)}</span>
                  <span className={estilos.textoAccion}>{accion.descripcion}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={estilos.itemAccion}>
              <span className={estilos.iconoAccion}>
                <CheckCircle2 size={16} color="#10b981" />
              </span>
              <span className={estilos.textoAccion}>
                Descanso aplicado sin cambios registrados en los recursos del personaje.
              </span>
            </div>
          )}
        </div>

        {/* Pie de modal */}
        <div className={estilos.pie}>
          <button
            ref={botonAceptarRef}
            type="button"
            className={estilos.botonAceptar}
            onClick={alCerrar}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
