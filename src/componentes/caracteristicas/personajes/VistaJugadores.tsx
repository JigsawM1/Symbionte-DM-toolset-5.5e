import React, { useEffect } from "react";
import {
  usarEstadoConfiguracion,
  usarAccionesConfiguracion,
  usarEstadoPersonajes,
  usarAccionesPersonajes
} from "@/almacen/selectores";
import { HojaPersonaje } from "./HojaPersonaje";
import { PanelConfiguracionPersonaje } from "./PanelConfiguracionPersonaje";
import { GestorPersonajes } from "./GestorPersonajes";
import { autoResolverMiniaturasJugador } from "@/servicios/resolutorMiniaturasJugador";
import { usarEstadoPersistido } from "@/hooks";
import { Shield, Users, UserCheck } from "lucide-react";
import estilos from "./VistaJugadores.module.css";

type SubPestanaJugador = "ficha" | "configuracion" | "personajes";

export const VistaJugadores: React.FC = () => {
  const { esGM } = usarEstadoConfiguracion();
  const { agregarNotificacion } = usarAccionesConfiguracion();
  const { personajes, idPersonajeActivo, personajeActivo } = usarEstadoPersonajes();
  const {
    crearPersonaje,
    actualizarPersonaje,
    duplicarPersonaje,
    eliminarPersonaje,
    seleccionarPersonajeActivo,
    vincularMiniaturaTSPersonaje
  } = usarAccionesPersonajes();

  const [subPestanaActiva, setSubPestanaActiva] = usarEstadoPersistido<SubPestanaJugador>(
    "ts_jugadores_subpestana",
    "ficha"
  );

  // Auto-resolución silenciosa de miniaturas de TaleSpire en segundo plano
  useEffect(() => {
    autoResolverMiniaturasJugador(personajes, vincularMiniaturaTSPersonaje);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personajes.length, personajeActivo?.nombre]);

  return (
    <div className={estilos.contenedorGeneral}>
      {/* Barra Superior de Sub-pestañas y Rol */}
      <div className={estilos.barraNavegacionSuperior}>
        {/* Sub-pestañas: Ficha vs Mis Personajes */}
        <div className={estilos.grupoSubPestanas}>
          <button
            type="button"
            onClick={() => setSubPestanaActiva("ficha")}
            className={estilos.botonSubPestana}
            data-activa={subPestanaActiva === "ficha"}
          >
            <Shield size={12} className={estilos.iconoSubPestana} />
            Ficha de Héroe {personajeActivo ? `(${personajeActivo.nombre})` : ""}
          </button>

          <button
            type="button"
            onClick={() => setSubPestanaActiva("personajes")}
            className={estilos.botonSubPestana}
            data-activa={subPestanaActiva === "personajes"}
          >
            <Users size={12} className={estilos.iconoSubPestana} />
            Mis Personajes ({personajes.length})
          </button>
        </div>


        {/* Indicador de Rol */}
        <div className={estilos.indicadorRolJugador}>
          <UserCheck size={12} color="var(--color-borde-cian)" />
          <span>{esGM ? "DM (GM)" : "Jugador"}</span>
        </div>
      </div>

      {/* Contenido según la sub-pestaña activa */}
      {subPestanaActiva === "ficha" ? (
        <HojaPersonaje alAbrirConfiguracion={() => setSubPestanaActiva("configuracion")} />
      ) : subPestanaActiva === "configuracion" && personajeActivo ? (
        <PanelConfiguracionPersonaje
          personaje={personajeActivo}
          alGuardar={(cambios) => actualizarPersonaje(personajeActivo.id, cambios)}
          alVolverAFicha={() => setSubPestanaActiva("ficha")}
        />
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
            setSubPestanaActiva("configuracion");
          }}
          alDuplicar={duplicarPersonaje}
          alEliminar={eliminarPersonaje}
          alAbrirFicha={() => setSubPestanaActiva("ficha")}
          alImportar={(pjsImportados) => {
            pjsImportados.forEach((pj) => {
              crearPersonaje(pj);
            });
            if (pjsImportados.length > 1) {
              agregarNotificacion(
                `Se han importado exitosamente ${pjsImportados.length} personajes del grupo.`,
                "exito"
              );
              setSubPestanaActiva("personajes");
            } else if (pjsImportados.length === 1) {
              agregarNotificacion(
                `Se ha importado la ficha de "${pjsImportados[0].nombre}".`,
                "exito"
              );
              setSubPestanaActiva("ficha");
            }
          }}
        />
      )}
    </div>
  );
};

export default VistaJugadores;

