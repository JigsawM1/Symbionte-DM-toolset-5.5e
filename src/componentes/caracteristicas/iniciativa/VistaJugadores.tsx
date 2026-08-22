import React, { useState, useEffect } from "react";
import {
  usarEstadoConfiguracion,
  usarEstadoPersonajes,
  usarAccionesPersonajes
} from "@/almacen/selectores";
import { HojaPersonaje, GestorPersonajes } from "@/componentes/caracteristicas/personajes";
import { autoResolverMiniaturasJugador } from "@/servicios/resolutorMiniaturasJugador";
import { Shield, Users, UserCheck } from "lucide-react";
import estilos from "./VistaJugadores.module.css";

type SubPestanaJugador = "ficha" | "personajes";

export const VistaJugadores: React.FC = () => {
  const { esGM } = usarEstadoConfiguracion();
  const { personajes, idPersonajeActivo, personajeActivo } = usarEstadoPersonajes();
  const {
    crearPersonaje,
    duplicarPersonaje,
    eliminarPersonaje,
    seleccionarPersonajeActivo,
    vincularMiniaturaTSPersonaje
  } = usarAccionesPersonajes();

  const [subPestanaActiva, setSubPestanaActiva] = useState<SubPestanaJugador>("ficha");

  // Auto-resolución silenciosa de miniaturas de TaleSpire en segundo plano
  useEffect(() => {
    autoResolverMiniaturasJugador(personajes, vincularMiniaturaTSPersonaje);
  }, [personajes.length, personajeActivo?.nombre]);

  return (
    <div className={estilos.contenedorGeneral}>
      {/* Barra Superior de Sub-pestañas y Rol */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "var(--color-fondo-panel)",
          border: "1px solid var(--color-borde-brutal)",
          borderRadius: 6,
          padding: "4px 8px"
        }}
      >
        {/* Sub-pestañas: Ficha vs Mis Personajes */}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            onClick={() => setSubPestanaActiva("ficha")}
            style={{
              backgroundColor: subPestanaActiva === "ficha" ? "var(--color-primario)" : "transparent",
              borderColor: subPestanaActiva === "ficha" ? "var(--color-borde-cian)" : "transparent",
              color: subPestanaActiva === "ficha" ? "#ffffff" : "var(--color-texto-secundario)",
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 4
            }}
          >
            <Shield size={12} style={{ marginRight: 4 }} />
            Ficha de Héroe {personajeActivo ? `(${personajeActivo.nombre})` : ""}
          </button>

          <button
            type="button"
            onClick={() => setSubPestanaActiva("personajes")}
            style={{
              backgroundColor: subPestanaActiva === "personajes" ? "var(--color-primario)" : "transparent",
              borderColor: subPestanaActiva === "personajes" ? "var(--color-borde-cian)" : "transparent",
              color: subPestanaActiva === "personajes" ? "#ffffff" : "var(--color-texto-secundario)",
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 4
            }}
          >
            <Users size={12} style={{ marginRight: 4 }} />
            Mis Personajes ({personajes.length})
          </button>
        </div>

        {/* Indicador de Rol */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            color: "var(--color-texto-apagado)",
            textTransform: "uppercase"
          }}
        >
          <UserCheck size={12} color="var(--color-borde-cian)" />
          <span>{esGM ? "DM (GM)" : "Jugador"}</span>
        </div>
      </div>

      {/* Contenido según la sub-pestaña activa */}
      {subPestanaActiva === "ficha" ? (
        <HojaPersonaje />
      ) : (
        <GestorPersonajes
          personajes={personajes}
          idPersonajeActivo={idPersonajeActivo}
          alSeleccionarActivo={(id) => {
            seleccionarPersonajeActivo(id);
            setSubPestanaActiva("ficha");
          }}
          alCrearNuevo={() => {
            crearPersonaje();
            setSubPestanaActiva("ficha");
          }}
          alDuplicar={duplicarPersonaje}
          alEliminar={eliminarPersonaje}
          alAbrirFicha={() => setSubPestanaActiva("ficha")}
        />
      )}
    </div>
  );
};

export default VistaJugadores;
