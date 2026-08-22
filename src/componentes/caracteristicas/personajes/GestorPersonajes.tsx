import React, { useState } from "react";
import type { PersonajeJugador } from "@/tipos";
import { ConfirmDialog } from "@/componentes/comunes/ConfirmDialog";
import { Plus, Copy, Trash2, CheckCircle2, User } from "lucide-react";
import estilos from "./HojaPersonaje.module.css";

interface GestorPersonajesProps {
  personajes: PersonajeJugador[];
  idPersonajeActivo: string | null;
  alSeleccionarActivo: (id: string) => void;
  alCrearNuevo: () => void;
  alDuplicar: (id: string) => void;
  alEliminar: (id: string) => void;
  alAbrirFicha: () => void;
}

export const GestorPersonajes: React.FC<GestorPersonajesProps> = ({
  personajes,
  idPersonajeActivo,
  alSeleccionarActivo,
  alCrearNuevo,
  alDuplicar,
  alEliminar,
  alAbrirFicha
}) => {
  const [idPjAEliminar, setIdPjAEliminar] = useState<string | null>(null);

  const personajeAEliminar = personajes.find((p) => p.id === idPjAEliminar);

  const manejarConfirmarEliminacion = () => {
    if (idPjAEliminar) {
      alEliminar(idPjAEliminar);
      setIdPjAEliminar(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
      {/* Cabecera del Gestor */}
      <div className={estilos.cabeceraGestor}>
        <div>
          <h2 className={estilos.tituloGestor}>Mis Personajes Guardados</h2>
          <p style={{ fontSize: 11, color: "var(--color-texto-apagado)", margin: "2px 0 0 0" }}>
            Administra tus héroes, selecciona la ficha activa o crea una nueva.
          </p>
        </div>

        <button
          type="button"
          className={estilos.neoButton}
          onClick={alCrearNuevo}
          style={{ backgroundColor: "var(--color-primario)", color: "#fff", borderColor: "var(--color-borde-cian)" }}
        >
          <Plus size={14} />
          Nuevo Personaje
        </button>
      </div>

      {/* Cuadrícula de Tarjetas de Personajes */}
      <div className={estilos.gridPersonajesGaleria}>
        {personajes.map((pj) => {
          const esActivo = pj.id === idPersonajeActivo;
          const porcentajeVida = Math.max(0, Math.min(100, Math.round((pj.hpActual / (pj.hpMaximo || 1)) * 100)));

          return (
            <div
              key={pj.id}
              className={`${estilos.neoRaised} ${estilos.tarjetaPjGaleria} ${
                esActivo ? estilos.tarjetaPjGaleriaActiva : ""
              }`}
            >
              <div className={estilos.filaPjCabeceraGaleria}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className={estilos.nombrePjGaleria}>{pj.nombre}</span>
                    {esActivo && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: "var(--color-borde-cian)",
                          backgroundColor: "rgba(0, 245, 212, 0.12)",
                          border: "1px solid var(--color-borde-cian)",
                          padding: "1px 5px",
                          borderRadius: 10
                        }}
                      >
                        ACTIVO
                      </span>
                    )}
                  </div>
                  <span className={estilos.detallesPjGaleria}>
                    {pj.clase} {pj.subclase ? `(${pj.subclase})` : ""} Niv. {pj.nivel} • {pj.especie}
                  </span>
                </div>

                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-fondo-tarjeta)",
                    border: "1px solid var(--color-borde-brutal)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 14,
                    color: "var(--color-primario-brillante)",
                    overflow: "hidden"
                  }}
                >
                  {pj.avatarUrl ? (
                    <img src={pj.avatarUrl} alt={pj.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    (pj.nombre || "P")[0].toUpperCase()
                  )}
                </div>
              </div>

              {/* Barra de Salud Resumen */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-texto-apagado)" }}>
                  <span>Puntos de Golpe</span>
                  <span>{pj.hpActual} / {pj.hpMaximo} HP</span>
                </div>
                <div
                  className={estilos.neoPressed}
                  style={{ height: 6, borderRadius: 3, position: "relative", overflow: "hidden" }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${porcentajeVida}%`,
                      backgroundColor: "var(--color-primario)"
                    }}
                  />
                </div>
              </div>

              {/* Botones de Acción */}
              <div className={estilos.filaBotonesAccionPj}>
                {!esActivo ? (
                  <button
                    type="button"
                    className={estilos.neoButton}
                    onClick={() => alSeleccionarActivo(pj.id)}
                    title="Establecer como personaje activo"
                  >
                    <CheckCircle2 size={12} />
                    Activar
                  </button>
                ) : (
                  <button
                    type="button"
                    className={estilos.neoButton}
                    onClick={alAbrirFicha}
                    title="Ver ficha completa"
                    style={{ borderColor: "var(--color-borde-cian)", color: "var(--color-borde-cian)" }}
                  >
                    <User size={12} />
                    Ver Ficha
                  </button>
                )}

                <button
                  type="button"
                  className={estilos.neoButton}
                  onClick={() => alDuplicar(pj.id)}
                  title="Duplicar personaje"
                >
                  <Copy size={12} />
                </button>

                <button
                  type="button"
                  className={estilos.neoButton}
                  onClick={() => setIdPjAEliminar(pj.id)}
                  disabled={personajes.length <= 1}
                  title={personajes.length <= 1 ? "No puedes eliminar el único personaje" : "Eliminar personaje"}
                  style={{ color: "var(--color-peligro)" }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Confirmación para Eliminar */}
      <ConfirmDialog
        abierto={idPjAEliminar !== null}
        titulo="Eliminar Personaje"
        mensaje={`¿Estás seguro de que deseas eliminar permanentemente a "${personajeAEliminar?.nombre || "este personaje"}"? Esta acción no se puede deshacer.`}
        onConfirmar={manejarConfirmarEliminacion}
        onCancelar={() => setIdPjAEliminar(null)}
      />
    </div>
  );
};
