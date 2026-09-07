import React from "react";
import type { RasgoPersonaje } from "@/tipos";
import { TarjetaRasgo } from "./TarjetaRasgo";
import { ConstructorRasgoDote } from "./ConstructorRasgoDote";
import { ModalDetalleRasgo } from "./ModalDetalleRasgo";
import { User, Search } from "lucide-react";
import { CabeceraRasgosJugador } from "./CabeceraRasgosJugador";
import { FiltrosAccionRasgos } from "./FiltrosAccionRasgos";
import { VisorProgresionClase } from "./VisorProgresionClase";
import { usarVistaRasgos } from "./usarVistaRasgos";
import { SeccionesRasgosActivos } from "./SeccionesRasgosActivos";
import estilos from "./VistaRasgosJugador.module.css";

export const VistaRasgosJugador: React.FC = () => {
  const {
    personajeActivo,
    modoVista,
    setModoVista,
    consultaBusqueda,
    setConsultaBusqueda,
    mostrarFiltros,
    setMostrarFiltros,
    filtroAccion,
    setFiltroAccion,
    setRasgoSeleccionadoDetalle,
    rasgoDetalleEfectivo,
    rasgoParaEditar,
    setRasgoParaEditar,
    origenPredeterminadoModal,
    seccionesColapsadas,
    alternarColapso,
    alternarTodas,
    estanTodasExpandidas,
    datosProgresionClases,
    rasgosFiltrados,
    datosJerarquicos,
    abrirModalCreacion,
    abrirModalEdicion,
    manejarGuardarRasgoModal,
    eliminarRasgoPersonaje,
    gastarUsoRasgoPersonaje,
    recuperarUsoRasgoPersonaje,
    sincronizarRasgosPersonaje,
    alternarActivoRasgo,
    actualizarSeleccionRasgo,
    obtenerBloqueoToggleRasgo,
    resolverRecursosPadre
  } = usarVistaRasgos();

  if (!personajeActivo) {
    return (
      <div className={estilos.contenedorGeneral}>
        <div className={estilos.estadoVacio}>
          <User size={32} />
          <p>No hay ningún personaje activo seleccionado.</p>
        </div>
      </div>
    );
  }

  const nombrePj = personajeActivo.nombre?.trim() || "Personaje";
  const totalRasgosPj = personajeActivo.rasgos?.length || 0;
  const hayFiltrosActivos = consultaBusqueda.trim() !== "" || filtroAccion !== "todos";

  const renderizarTarjetaRasgo = (rasgo: RasgoPersonaje, idx: number) => {
    const bloqueo = obtenerBloqueoToggleRasgo(rasgo);
    return (
      <TarjetaRasgo
        key={`${rasgo.id}_${rasgo.nivelRequerido || 0}_${idx}`}
        rasgo={rasgo}
        nombrePersonaje={nombrePj}
        idPersonaje={personajeActivo.id}
        alGastarUso={() => gastarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
        alRecuperarUso={() => recuperarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
        alAlternarActivo={() => alternarActivoRasgo(personajeActivo.id, rasgo.id)}
        deshabilitadoToggle={bloqueo.bloqueado}
        motivoDeshabilitado={bloqueo.motivo}
        alEditar={() => abrirModalEdicion(rasgo)}
        alEliminar={() => eliminarRasgoPersonaje(personajeActivo.id, rasgo.id)}
        alVerDetalle={() => setRasgoSeleccionadoDetalle(rasgo)}
        {...resolverRecursosPadre(rasgo)}
      />
    );
  };

  if (modoVista === "creador_homebrew") {
    return (
      <div className={estilos.contenedorGeneral}>
        <ConstructorRasgoDote
          personaje={personajeActivo}
          rasgoInicial={rasgoParaEditar}
          origenPredeterminado={origenPredeterminadoModal}
          alGuardar={manejarGuardarRasgoModal}
          alVolver={() => {
            setRasgoParaEditar(null);
            setModoVista("mis_rasgos");
          }}
        />
      </div>
    );
  }

  return (
    <div className={estilos.contenedorGeneral}>
      {/* 1. Cabecera Compacta */}
      <CabeceraRasgosJugador
        totalRasgosFiltrados={rasgosFiltrados.length}
        totalRasgosPj={totalRasgosPj}
        alAbrirCreacion={() => abrirModalCreacion("personalizado")}
        alSincronizar={() => sincronizarRasgosPersonaje(personajeActivo.id)}
        alAlternarTodas={alternarTodas}
        estanTodasExpandidas={estanTodasExpandidas}
        modoVista={modoVista}
        alCambiarModoVista={setModoVista}
        consultaBusqueda={consultaBusqueda}
        alCambiarBusqueda={setConsultaBusqueda}
        mostrarFiltros={mostrarFiltros}
        alAlternarMostrarFiltros={() => setMostrarFiltros(!mostrarFiltros)}
        filtroAccion={filtroAccion}
      />

      {/* 2. Filtros Desplegables */}
      {modoVista === "mis_rasgos" && mostrarFiltros && (
        <FiltrosAccionRasgos
          filtroAccion={filtroAccion}
          alCambiarFiltroAccion={setFiltroAccion}
          hayFiltrosActivos={hayFiltrosActivos}
          alLimpiarFiltros={() => {
            setConsultaBusqueda("");
            setFiltroAccion("todos");
          }}
        />
      )}

      {/* 3. MODO A: MIS RASGOS ACTIVOS */}
      {modoVista === "mis_rasgos" && (
        <>
          {rasgosFiltrados.length === 0 ? (
            <div className={estilos.estadoVacio}>
              <Search size={24} />
              <p>No se encontraron rasgos con los filtros aplicados.</p>
              <button
                type="button"
                className={estilos.botonHerramienta}
                onClick={() => {
                  setConsultaBusqueda("");
                  setFiltroAccion("todos");
                }}
              >
                Restablecer búsqueda
              </button>
            </div>
          ) : (
            <SeccionesRasgosActivos
              personajeActivo={personajeActivo}
              datosJerarquicos={datosJerarquicos}
              seccionesColapsadas={seccionesColapsadas}
              alternarColapso={alternarColapso}
              abrirModalCreacion={abrirModalCreacion}
              renderizarTarjetaRasgo={renderizarTarjetaRasgo}
              actualizarSeleccionRasgo={actualizarSeleccionRasgo}
            />
          )}
        </>
      )}

      {/* 4. MODO B: VISOR DE PROGRESIÓN DE CLASE 1-20 (PHB 2024) */}
      {modoVista === "progresion_clase" && (
        <VisorProgresionClase datosProgresionClases={datosProgresionClases} />
      )}

      {/* 5. Modal de Detalle Completo de Rasgo */}
      {rasgoDetalleEfectivo && (
        <ModalDetalleRasgo
          rasgo={rasgoDetalleEfectivo}
          nombrePersonaje={nombrePj}
          idPersonaje={personajeActivo.id}
          nivelPersonaje={personajeActivo.nivel}
          alCerrar={() => setRasgoSeleccionadoDetalle(null)}
          alGastarUso={() => gastarUsoRasgoPersonaje(personajeActivo.id, rasgoDetalleEfectivo.id)}
          alRecuperarUso={() => recuperarUsoRasgoPersonaje(personajeActivo.id, rasgoDetalleEfectivo.id)}
          alAlternarActivo={() => alternarActivoRasgo(personajeActivo.id, rasgoDetalleEfectivo.id)}
          deshabilitadoToggle={obtenerBloqueoToggleRasgo(rasgoDetalleEfectivo).bloqueado}
          motivoDeshabilitado={obtenerBloqueoToggleRasgo(rasgoDetalleEfectivo).motivo}
          alActualizarSeleccion={(idSelector, valores) =>
            actualizarSeleccionRasgo(personajeActivo.id, rasgoDetalleEfectivo.id, idSelector, valores)
          }
          alEditar={() => {
            const r = rasgoDetalleEfectivo;
            setRasgoSeleccionadoDetalle(null);
            abrirModalEdicion(r);
          }}
          alEliminar={() => {
            const r = rasgoDetalleEfectivo;
            setRasgoSeleccionadoDetalle(null);
            eliminarRasgoPersonaje(personajeActivo.id, r.id);
          }}
          {...resolverRecursosPadre(rasgoDetalleEfectivo)}
        />
      )}
    </div>
  );
};

export default VistaRasgosJugador;
