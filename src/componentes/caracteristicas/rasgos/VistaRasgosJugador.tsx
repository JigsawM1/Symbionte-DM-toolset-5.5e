import React from "react";
import { SeccionOpcionesRasgos } from "./SeccionOpcionesRasgos";
import { resolverExtensionesRasgos } from "@/servicios/rasgos/extensionesRasgos";
import { ResumenDefensasRasgos } from "./ResumenDefensasRasgos";
import type { RasgoPersonaje } from "@/tipos";
import { SeccionSelectoresModalRasgo } from "./SeccionSelectoresModalRasgo";
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
    totalRasgosPj,
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
    resolverRecursosPadre,
    obtenerNivelEfectivoParaRasgo
  } = usarVistaRasgos();

  const efectivos = React.useMemo(
    () => (personajeActivo ? resolverExtensionesRasgos(personajeActivo.rasgos, personajeActivo.nivel) : []),
    [personajeActivo]
  );

  if (!personajeActivo) {
    return (
      <div className={`${estilos.contenedorGeneral} u-scroll-cef`}>
        <div className={estilos.estadoVacio}>
          <User size={32} />
          <p>No hay ningún personaje activo seleccionado.</p>
        </div>
      </div>
    );
  }

  const nombrePj = personajeActivo.nombre?.trim() || "Personaje";
  const hayFiltrosActivos = consultaBusqueda.trim() !== "" || filtroAccion !== "todos";

  const renderizarTarjetaRasgo = (rasgo: RasgoPersonaje, idx: number): React.ReactNode => {
    if (rasgo.selectores?.some(s => s.ubicacion === "seccion" && s.materializarRasgos)) {
      const clave = `opciones_${rasgo.id}`;
      return <SeccionOpcionesRasgos key={rasgo.id} rasgo={rasgo} nivel={obtenerNivelEfectivoParaRasgo(rasgo)}
        colapsada={!!seccionesColapsadas[clave]} alternar={() => alternarColapso(clave)} renderizar={renderizarTarjetaRasgo}
        hijos={efectivos.filter(r => r.idRasgoSelectorOrigen === rasgo.id)}
        actualizar={(id, valores) => actualizarSeleccionRasgo(personajeActivo.id, rasgo.id, id, valores)} />;
    }
    if (rasgo.selectores?.some(s => s.ubicacion === "seccion")) return <div key={rasgo.id} className={estilos.seccionPrincipal}>
      <SeccionSelectoresModalRasgo selectores={rasgo.selectores} nivelPersonaje={obtenerNivelEfectivoParaRasgo(rasgo)}
        alActualizarSeleccion={(idSelector, valores) => actualizarSeleccionRasgo(personajeActivo.id, rasgo.id, idSelector, valores)} />
      <button type="button" onClick={() => abrirModalEdicion(rasgo)}>Editar {rasgo.nombre}</button>
    </div>;
    const bloqueo = obtenerBloqueoToggleRasgo(rasgo);
    const esDoteLigada =
      rasgo.id.startsWith("dote_invocacion_") ||
      rasgo.id.startsWith("dote_asi_") ||
      rasgo.id.startsWith("dote_don_") ||
      rasgo.id.startsWith("dote_origen_");
    return (
      <TarjetaRasgo
        key={`${rasgo.id}_${rasgo.nivelRequerido || 0}_${idx}`}
        rasgo={rasgo}
        nombrePersonaje={nombrePj}
        idPersonaje={personajeActivo.id}
        alGastarUso={(cant?: number) => gastarUsoRasgoPersonaje(personajeActivo.id, rasgo.id, cant)}
        alRecuperarUso={(cant?: number) => recuperarUsoRasgoPersonaje(personajeActivo.id, rasgo.id, cant)}
        alAlternarActivo={() => alternarActivoRasgo(personajeActivo.id, rasgo.id)}
        deshabilitadoToggle={bloqueo.bloqueado}
        motivoDeshabilitado={bloqueo.motivo}
        alEditar={esDoteLigada ? undefined : () => abrirModalEdicion(rasgo)}
        alEliminar={esDoteLigada ? undefined : () => eliminarRasgoPersonaje(personajeActivo.id, rasgo.id)}
        alVerDetalle={() => setRasgoSeleccionadoDetalle(rasgo)}
        {...resolverRecursosPadre(rasgo)}
      />
    );
  };

  if (modoVista === "creador_homebrew") {
    return (
      <div className={`${estilos.contenedorGeneral} u-scroll-cef`}>
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
    <div className={`${estilos.contenedorGeneral} u-scroll-cef`}>
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

      {modoVista === "mis_rasgos" && <ResumenDefensasRasgos personaje={personajeActivo} />}
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
          nivelPersonaje={obtenerNivelEfectivoParaRasgo(rasgoDetalleEfectivo)}
          alCerrar={() => setRasgoSeleccionadoDetalle(null)}
          alGastarUso={(cant?: number) => gastarUsoRasgoPersonaje(personajeActivo.id, rasgoDetalleEfectivo.id, cant)}
          alRecuperarUso={(cant?: number) => recuperarUsoRasgoPersonaje(personajeActivo.id, rasgoDetalleEfectivo.id, cant)}
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
