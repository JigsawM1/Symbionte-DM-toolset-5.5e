import React from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { X } from "lucide-react";
import estilos from "./NotificacionesContenedor.module.css";

export const NotificacionesContenedor: React.FC = () => {
  const notificaciones = usarAlmacenDM((s) => s.notificaciones);
  const eliminarNotificacion = usarAlmacenDM((s) => s.eliminarNotificacion);

  if (notificaciones.length === 0) return null;

  return (
    <div className={estilos.contenedor}>
      {notificaciones.map((n) => {
        let claseTipo = estilos.toastInfo;
        if (n.tipo === "exito") claseTipo = estilos.toastExito;
        if (n.tipo === "error") claseTipo = estilos.toastError;
        if (n.tipo === "advertencia") claseTipo = estilos.toastAdvertencia;

        return (
          <div key={n.id} className={`${estilos.toast} ${claseTipo}`}>
            <span className={estilos.texto}>{n.mensaje}</span>
            <button
              onClick={() => eliminarNotificacion(n.id)}
              className={estilos.botonCerrar}
              title="Cerrar"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
