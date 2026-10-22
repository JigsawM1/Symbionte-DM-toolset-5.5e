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
import { SeccionAcompanantesPersonaje } from "./acompanantes/SeccionAcompanantesPersonaje";
import { autoResolverMiniaturasJugador } from "@/servicios/resolutorMiniaturasJugador";
import { usarEstadoPersistido } from "@/hooks";
import { Plus } from "lucide-react";
import estilos from "./VistaJugadores.module.css";

type SubPestanaJugador = "ficha" | "acompanantes" | "configuracion" | "personajes";

export const VistaJugadores: React.FC = () => {
  const { datosInicialesCargados } = usarEstadoConfiguracion();
  const { agregarNotificacion } = usarAccionesConfiguracion();
  const { personajes, idPersonajeActivo, personajeActivo } = usarEstadoPersonajes();
  const {
    crearPersonaje,
    actualizarPersonaje,
    duplicarPersonaje,
    eliminarPersonaje,
    seleccionarPersonajeActivo,
    vincularMiniaturaTSPersonaje,
    vincularMiniaturaTSAcompanante
  } = usarAccionesPersonajes();

  const [subPestanaActiva, setSubPestanaActiva] = usarEstadoPersistido<SubPestanaJugador>(
    "ts_jugadores_subpestana",
    "ficha"
  );

  // Auto-resolución silenciosa de miniaturas de TaleSpire en segundo plano
  useEffect(() => {
    if (!datosInicialesCargados) return;
    autoResolverMiniaturasJugador(personajes, vincularMiniaturaTSPersonaje, vincularMiniaturaTSAcompanante);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datosInicialesCargados, personajes.length, personajeActivo?.nombre]);

  const manejarCrearNuevo = () => {
    const nuevoId = crearPersonaje();
    seleccionarPersonajeActivo(nuevoId);
    setSubPestanaActiva("ficha");
  };

  const nombreActivo = personajeActivo?.nombre ? personajeActivo.nombre.toUpperCase() : "HEROE";

  return (
    <div className={`${estilos.contenedorGeneral} u-scroll-cef`}>
      {/* Barra Superior de Sub-pestañas: Activo vs Acompañantes vs Mis Personajes */}
      <div className={estilos.barraNavegacionSuperior}>
        <div className={estilos.grupoSubPestanas}>
          <button
            type="button"
            onClick={() => setSubPestanaActiva("ficha")}
            className={estilos.botonSubPestana}
            data-activa={subPestanaActiva === "ficha"}
            title="Ver la ficha del personaje activo"
          >
            <span className={estilos.dotActivoVerde} />
            <span className={estilos.textoPill}>ACTIVO: {nombreActivo}</span>
          </button>

          <button
            type="button"
            onClick={() => setSubPestanaActiva("acompanantes")}
            className={estilos.botonSubPestana}
            data-activa={subPestanaActiva === "acompanantes"}
            title="Ver acompañantes y monturas del personaje"
          >
            <span className={subPestanaActiva === "acompanantes" ? estilos.dotActivoCian : estilos.dotGris} />
            <span className={estilos.textoPill}>ACOMPAÑANTES ({personajeActivo?.acompanantes?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubPestanaActiva("personajes")}
            className={estilos.botonSubPestana}
            data-activa={subPestanaActiva === "personajes"}
            title="Gestionar mis personajes y copias"
          >
            <span className={subPestanaActiva === "personajes" ? estilos.dotActivoCian : estilos.dotGris} />
            <span className={estilos.textoPill}>MIS PERSONAJES ({personajes.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={manejarCrearNuevo}
          className={estilos.botonNuevoPj}
          title="Crear un nuevo personaje"
        >
          <Plus size={13} className={estilos.iconoNuevo} />
          <span>NUEVO</span>
        </button>
      </div>

      {/* Contenido según la sub-pestaña activa */}
      {subPestanaActiva === "ficha" ? (
        <HojaPersonaje alAbrirConfiguracion={() => setSubPestanaActiva("configuracion")} />
      ) : subPestanaActiva === "acompanantes" && personajeActivo ? (
        <div className={estilos.contenedorAcompanantes}>
          <SeccionAcompanantesPersonaje personaje={personajeActivo} />
        </div>
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
