import React, { useState } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { Plus, Trash2, CheckSquare, Square } from "lucide-react";

export const Pendientes: React.FC = () => {
  const {
    listaPendientes,
    agregarPendiente,
    alternarPendiente,
    eliminarPendiente
  } = usarAlmacenDM();

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
    <div style={estilos.contenedor}>
      <h3 style={estilos.titulo}>
        <span>Tareas Pendientes del DM</span>
        <span style={estilos.contador}>
          {completados}/{total} ({porcentaje}%)
        </span>
      </h3>

      {/* Barra de progreso brutalista */}
      <div style={estilos.barraProgresoContenedor}>
        <div
          style={{
            ...estilos.barraProgreso,
            width: `${porcentaje}%`
          }}
        />
      </div>

      <form onSubmit={alAgregar} style={estilos.formulario}>
        <input
          type="text"
          value={nuevoTexto}
          onChange={(e) => setNuevoTexto(e.target.value)}
          placeholder="Agregar nueva tarea del DM (Ej: 'Preparar tesoro de la mantícora')..."
          style={estilos.entrada}
        />
        <button type="submit" style={estilos.botonAgregar} title="Agregar Tarea">
          <Plus size={14} />
          <span>Añadir</span>
        </button>
      </form>

      <div style={estilos.listaContenedor}>
        {listaPendientes.length === 0 ? (
          <div style={estilos.vacioTexto}>
            No hay tareas pendientes. Añade algunas para planificar tu sesión.
          </div>
        ) : (
          listaPendientes.map((pendiente) => (
            <div
              key={pendiente.id}
              style={{
                ...estilos.elemento,
                ...(pendiente.completado ? estilos.elementoCompletado : {})
              }}
            >
              <button
                onClick={() => alternarPendiente(pendiente.id)}
                style={estilos.botonAlternar}
                title={pendiente.completado ? "Marcar como pendiente" : "Marcar como completada"}
              >
                {pendiente.completado ? (
                  <CheckSquare size={14} style={{ color: "var(--color-exito)" }} />
                ) : (
                  <Square size={14} style={{ color: "var(--color-texto-secundario)" }} />
                )}
              </button>

              <span
                style={{
                  ...estilos.texto,
                  ...(pendiente.completado ? estilos.textoCompletado : {})
                }}
                onClick={() => alternarPendiente(pendiente.id)}
              >
                {pendiente.texto}
              </span>

              <button
                onClick={() => eliminarPendiente(pendiente.id)}
                style={estilos.botonEliminar}
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
  titulo: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "var(--color-texto-principal)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--color-borde-brutal)",
    paddingBottom: "3px",
    margin: 0
  },
  contador: {
    fontFamily: "var(--fuente-codigo)",
    color: "var(--color-exito)"
  },
  barraProgresoContenedor: {
    height: "4px",
    backgroundColor: "var(--color-fondo-profundo)",
    border: "1px solid var(--color-borde-brutal)",
    width: "100%",
    overflow: "hidden"
  },
  barraProgreso: {
    height: "100%",
    backgroundColor: "var(--color-primario)"
  },
  formulario: {
    display: "flex",
    gap: "4px",
    width: "100%"
  },
  entrada: {
    flex: 1,
    height: "22px",
    backgroundColor: "var(--color-fondo-profundo)",
    border: "1px solid var(--color-borde-brutal)",
    color: "var(--color-texto-principal)",
    padding: "2px 6px",
    fontSize: "10.5px"
  },
  botonAgregar: {
    height: "22px",
    padding: "0 8px",
    backgroundColor: "var(--color-primario)",
    color: "#ffffff",
    border: "1px solid var(--color-borde-neon)",
    display: "flex",
    alignItems: "center",
    gap: "3px"
  },
  listaContenedor: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    paddingRight: "2px"
  },
  vacioTexto: {
    fontSize: "10px",
    color: "var(--color-texto-apagado)",
    textAlign: "center",
    padding: "20px 10px",
    border: "1px dashed var(--color-borde-brutal)"
  },
  elemento: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "3px 6px",
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)"
  },
  elementoCompletado: {
    borderColor: "var(--color-borde-brutal)",
    opacity: 0.65
  },
  botonAlternar: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  texto: {
    flex: 1,
    fontSize: "10.5px",
    color: "var(--color-texto-principal)",
    cursor: "pointer",
    userSelect: "none",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  textoCompletado: {
    textDecoration: "line-through",
    color: "var(--color-texto-apagado)"
  },
  botonEliminar: {
    background: "none",
    border: "none",
    color: "var(--color-texto-secundario)",
    cursor: "pointer",
    padding: "2px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }
};
