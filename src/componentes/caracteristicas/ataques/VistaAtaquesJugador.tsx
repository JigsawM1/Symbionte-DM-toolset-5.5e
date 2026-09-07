import React from "react";
import { FichaHechizo } from "@/componentes/caracteristicas/compendio/FichaHechizo";
import { usarCalculoAtaquesJugador } from "./usarCalculoAtaquesJugador";
import { CabeceraAtaquesJugador } from "./CabeceraAtaquesJugador";
import { SeccionRecursosMagicosAtaque } from "./SeccionRecursosMagicosAtaque";
import { SeccionAtaquesFisicos } from "./SeccionAtaquesFisicos";
import { SeccionAtaquesMagicos } from "./SeccionAtaquesMagicos";
import { SeccionConsumiblesAtaque } from "./SeccionConsumiblesAtaque";
import { SeccionHechizosObjetosMagicos } from "./SeccionHechizosObjetosMagicos";
import estilos from "./VistaAtaquesJugador.module.css";

export const VistaAtaquesJugador: React.FC = () => {
  const {
    personajes,
    personajeActivo,
    statsCalculadas,
    sistemaMagia,
    filtro,
    setFiltro,
    seccionesAbiertas,
    alternarSeccion,
    hechizoDetalle,
    setHechizoDetalle,
    bonoAtaqueMagico,
    estaBloqueadoPorArmadura,
    motivoBloqueoArmadura,
    ataquesFisicosFiltrados,
    conjurosFiltrados,
    conjurosPorNivel,
    consumiblesFiltrados,
    hechizosObjetosFiltrados,
    conteoTotal,
    conteoAccion,
    conteoAccionAdicional,
    conteoReaccion,
    tieneMagiaEstandar,
    tienePacto,
    esHechizoDeSubclase,
    lanzar,
    seleccionarPersonajeActivo,
    gastarEspacioConjuro,
    recuperarEspacioConjuro,
    recuperarTodosEspaciosConjuro,
    gastarPuntosConjuro,
    recuperarPuntosConjuro,
    recuperarTodosPuntosConjuro,
    gastarEspacioPacto,
    recuperarEspaciosPacto,
    manejarCambiarCaracteristicaArma,
    manejarTirarAtaque,
    manejarTirarDano,
    manejarTirarCritico,
    manejarUsarConsumible
  } = usarCalculoAtaquesJugador();

  if (!personajeActivo) {
    return (
      <div className={estilos.contenedorGeneral}>
        <div className={estilos.tarjetaVacia}>No hay un personaje activo seleccionado.</div>
      </div>
    );
  }

  const hayAcciones =
    ataquesFisicosFiltrados.length > 0 ||
    conjurosFiltrados.length > 0 ||
    consumiblesFiltrados.length > 0 ||
    hechizosObjetosFiltrados.length > 0;

  return (
    <div className={estilos.contenedorGeneral}>
      {/* Cabecera Principal con Selector y Filtros */}
      <CabeceraAtaquesJugador
        conteoTotal={conteoTotal}
        conteoAccion={conteoAccion}
        conteoAccionAdicional={conteoAccionAdicional}
        conteoReaccion={conteoReaccion}
        filtro={filtro}
        alCambiarFiltro={setFiltro}
        personajes={personajes}
        personajeActivo={personajeActivo}
        alSeleccionarPersonaje={seleccionarPersonajeActivo}
        statsCalculadas={statsCalculadas}
      />

      {/* Trackers de Recursos Mágicos */}
      <SeccionRecursosMagicosAtaque
        personajeActivo={personajeActivo}
        tieneMagiaEstandar={tieneMagiaEstandar}
        tienePacto={tienePacto}
        sistemaMagia={sistemaMagia}
        estaAbierta={seccionesAbiertas.recursos !== false}
        alAlternar={() => alternarSeccion("recursos")}
        alGastarEspacioConjuro={gastarEspacioConjuro}
        alRecuperarEspacioConjuro={recuperarEspacioConjuro}
        alRecuperarTodosEspaciosConjuro={recuperarTodosEspaciosConjuro}
        alGastarPuntosConjuro={gastarPuntosConjuro}
        alRecuperarPuntosConjuro={recuperarPuntosConjuro}
        alRecuperarTodosPuntosConjuro={recuperarTodosPuntosConjuro}
        alGastarEspacioPacto={gastarEspacioPacto}
        alRecuperarEspaciosPacto={recuperarEspaciosPacto}
      />

      {/* Sección 1: Ataques con Armas y Desarmado */}
      <SeccionAtaquesFisicos
        ataquesFisicos={ataquesFisicosFiltrados}
        personajeActivo={personajeActivo}
        statsCalculadas={statsCalculadas}
        estaAbierta={seccionesAbiertas.fisicos !== false}
        alAlternar={() => alternarSeccion("fisicos")}
        alTirarAtaque={manejarTirarAtaque}
        alTirarDano={manejarTirarDano}
        alTirarCritico={manejarTirarCritico}
        alCambiarCaracteristica={manejarCambiarCaracteristicaArma}
      />

      {/* Sección 2: Conjuros y Trucos de Combate */}
      <SeccionAtaquesMagicos
        conjurosFiltrados={conjurosFiltrados}
        conjurosPorNivel={conjurosPorNivel}
        seccionesAbiertas={seccionesAbiertas}
        alAlternarSeccion={alternarSeccion}
        personajeActivo={personajeActivo}
        bonoAtaqueMagico={bonoAtaqueMagico}
        tienePacto={tienePacto}
        sistemaMagia={sistemaMagia}
        estaBloqueadoPorArmadura={estaBloqueadoPorArmadura}
        motivoBloqueoArmadura={motivoBloqueoArmadura}
        esHechizoDeSubclase={esHechizoDeSubclase}
        alAbrirDetalle={setHechizoDetalle}
        alLanzar={lanzar}
      />

      {/* Sección 3: Consumibles y Pociones */}
      <SeccionConsumiblesAtaque
        consumiblesFiltrados={consumiblesFiltrados}
        estaAbierta={seccionesAbiertas.consumibles !== false}
        alAlternar={() => alternarSeccion("consumibles")}
        alUsarConsumible={manejarUsarConsumible}
      />

      {/* Sección 4: Hechizos de Objetos Mágicos */}
      <SeccionHechizosObjetosMagicos
        hechizosObjetosFiltrados={hechizosObjetosFiltrados}
        estaAbierta={seccionesAbiertas.hechizosObjetos !== false}
        alAlternar={() => alternarSeccion("hechizosObjetos")}
        estaBloqueadoPorArmadura={estaBloqueadoPorArmadura}
        motivoBloqueoArmadura={motivoBloqueoArmadura}
        alLanzar={lanzar}
      />

      {/* Estado vacío cuando no hay acciones con el filtro seleccionado */}
      {!hayAcciones && (
        <div className={estilos.tarjetaVacia}>
          No se encontraron acciones de tipo <strong>"{filtro.toUpperCase()}"</strong> para este personaje.
        </div>
      )}

      {/* Modal de Detalle Completo de Hechizo */}
      {hechizoDetalle && (
        <div
          className={estilos.backdropModalHechizo}
          onClick={() => setHechizoDetalle(null)}
        >
          <div
            className={estilos.contenedorModalHechizo}
            onClick={(e) => e.stopPropagation()}
          >
            <FichaHechizo
              hechizo={hechizoDetalle}
              nombrePersonaje={personajeActivo.nombre}
              nivelPersonaje={personajeActivo.nivel || 1}
              bonoAtaqueMagico={bonoAtaqueMagico}
              esLanzadorPacto={tienePacto}
              nivelEspacioPacto={personajeActivo.nivelEspacioPacto || 0}
              espaciosPactoMaximos={personajeActivo.espaciosPactoMaximos || 0}
              espaciosConjuroMaximos={personajeActivo.espaciosConjuroMaximos || {}}
              nivelConjuroMaximo={personajeActivo.nivelConjuroMaximo || 0}
              sistemaMagia={sistemaMagia}
              bloqueadoPorArmadura={estaBloqueadoPorArmadura}
              motivoBloqueoArmadura={motivoBloqueoArmadura}
              onClose={() => setHechizoDetalle(null)}
              alLanzar={async (modo, nivelLanzamiento) => {
                const exito = await lanzar({
                  modo,
                  hechizo: hechizoDetalle,
                  nivelLanzamiento
                });
                if (exito) {
                  setHechizoDetalle(null);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VistaAtaquesJugador;
