import React, { useState } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { Plus, Trash2, CheckSquare, Square } from "lucide-react";
import estilos from "./Pendientes.module.css";

export const Pendientes: React.FC = () => {
  const listaPendientes = usarAlmacenDM((s) => s.listaPendientes);
  const agregarPendiente = usarAlmacenDM((s) => s.agregarPendiente);
  const alternarPendiente = usarAlmacenDM((s) => s.alternarPendiente);
  const eliminarPendiente = usarAlmacenDM((s) => s.eliminarPendiente);

  const [nuevoTexto, setNuevoTexto] = useState("");

  const alAgregar = (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevoTexto.trim() === "") return;
    agregarPendiente(nuevoTexto.trim());
    setNuevoTexto("");
  };

  const completados = listaPendientes.filter((p) => p.completado).length;
  const total = listaPendientes.length;
  const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

  return (
    <div className={estilos.contenedor}>
      <h3 className={estilos.titulo}>
        <span>Tareas Pendientes del DM</span>
        <span className={estilos.contador}>
          {completados}/{total} ({porcentaje}%)
        </span>
      </h3>

      {/* Barra de progreso brutalista */}
      <div className={estilos.barraProgresoContenedor}>
        <div
          className={estilos.barraProgreso}
          style={{
            width: `${porcentaje}%`
          }}
        />
      </div>

      <form onSubmit={alAgregar} className={estilos.formulario}>
        <input
          type="text"
          value={nuevoTexto}
          onChange={(e) => setNuevoTexto(e.target.value)}
          placeholder="Agregar nueva tarea del DM (Ej: 'Preparar tesoro de la mantícora')..."
          className={estilos.entrada}
        />
        <button type="submit" className={estilos.botonAgregar} title="Agregar Tarea">
          <Plus size={14} />
          <span>Añadir</span>
        </button>
      </form>

      <div className={estilos.listaContenedor}>
        {listaPendientes.length === 0 ? (
          <div className={estilos.vacioTexto}>
            No hay tareas pendientes. Añade algunas para planificar tu sesión.
          </div>
        ) : (
          listaPendientes.map((pendiente) => (
            <div
              key={pendiente.id}
              className={`${estilos.elemento} ${pendiente.completado ? estilos.elementoCompletado : ""}`}
            >
              <button
                onClick={() => alternarPendiente(pendiente.id)}
                className={estilos.botonAlternar}
                title={pendiente.completado ? "Marcar como pendiente" : "Marcar como completada"}
              >
                {pendiente.completado ? (
                  <CheckSquare size={14} style={{ color: "var(--color-exito)" }} />
                ) : (
                  <Square size={14} style={{ color: "var(--color-texto-secundario)" }} />
                )}
              </button>

              <span
                className={`${estilos.texto} ${pendiente.completado ? estilos.textoCompletado : ""}`}
                onClick={() => alternarPendiente(pendiente.id)}
              >
                {pendiente.texto}
              </span>

              <button
                onClick={() => eliminarPendiente(pendiente.id)}
                className={estilos.botonEliminar}
                title="Eliminar tarea"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
