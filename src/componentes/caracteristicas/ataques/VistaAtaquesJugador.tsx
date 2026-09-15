import React from "react";
import { FichaHechizo } from "@/componentes/caracteristicas/compendio/FichaHechizo";
import { obtenerBonoDanoConjuroExtra } from "@/servicios/evaluadorEfectosRasgos";
import { obtenerModificadorAptitudMagica } from "@/servicios/calculadorMagia";
import { usarCalculoAtaquesJugador } from "./usarCalculoAtaquesJugador";
import { CabeceraAtaquesJugador } from "./CabeceraAtaquesJugador";
import { SeccionRecursosMagicosAtaque } from "./SeccionRecursosMagicosAtaque";
import { SeccionAtaquesFisicos } from "./SeccionAtaquesFisicos";
import { SeccionAtaquesMagicos } from "./SeccionAtaquesMagicos";
import { SeccionRasgosAtaque } from "./SeccionRasgosAtaque";
import { SeccionConsumiblesAtaque } from "./SeccionConsumiblesAtaque";
import { SeccionHechizosObjetosMagicos } from "./SeccionHechizosObjetosMagicos";
import { ModalDetalleRasgo } from "@/componentes/caracteristicas/rasgos/ModalDetalleRasgo";
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
    rasgoDetalle,
    setRasgoDetalle,
    bonoAtaqueMagico,
    cdSalvacionConjuros,
    estaBloqueadoPorArmadura,
    motivoBloqueoArmadura,
    ataquesFisicosFiltrados,
    conjurosFiltrados,
    conjurosPorNivel,
    consumiblesFiltrados,
    hechizosObjetosFiltrados,
    listaRasgosCombate: _listaRasgosCombate,
    rasgosFiltrados,
    rasgosAcciones,
    rasgosAccionesAdicionales,
    rasgosReacciones,
    rasgosConsumibles,
    rasgosActivables,
    conteoTotal,
    conteoAccion,
    conteoAccionAdicional,
    conteoReaccion,
    conteoConsumibles,
    conteoActivables,
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
    gastarUsoRasgoPersonaje,
    recuperarUsoRasgoPersonaje,
    alternarActivoRasgo,
    obtenerBloqueoToggleRasgo,
    resolverRecursosPadre,
    obtenerNivelEfectivoParaRasgo,
    manejarCambiarCaracteristicaArma,
    manejarTirarAtaque,
    manejarTirarDano,
    manejarTirarCritico,
    manejarUsarConsumible
  } = usarCalculoAtaquesJugador();

  const rasgoDetalleEfectivo = React.useMemo(() => {
    if (!rasgoDetalle || !personajeActivo) return null;
    return (
      (personajeActivo.rasgos || []).find((r) => r.id === rasgoDetalle.id) ||
      rasgoDetalle
    );
  }, [rasgoDetalle, personajeActivo]);

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
    rasgosFiltrados.length > 0 ||
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
        conteoConsumibles={conteoConsumibles}
        conteoActivables={conteoActivables}
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

      {/* Sección 3: Rasgos y Habilidades Tácticas */}
      <SeccionRasgosAtaque
        personajeActivo={personajeActivo}
        filtro={filtro}
        rasgosFiltrados={rasgosFiltrados}
        rasgosAcciones={rasgosAcciones}
        rasgosAccionesAdicionales={rasgosAccionesAdicionales}
        rasgosReacciones={rasgosReacciones}
        rasgosConsumibles={rasgosConsumibles}
        rasgosActivables={rasgosActivables}
        estaAbierta={seccionesAbiertas.rasgos !== false}
        alAlternar={() => alternarSeccion("rasgos")}
        alAbrirDetalle={setRasgoDetalle}
        alGastarUso={gastarUsoRasgoPersonaje}
        alRecuperarUso={recuperarUsoRasgoPersonaje}
        alAlternarActivo={alternarActivoRasgo}
        obtenerBloqueoToggleRasgo={obtenerBloqueoToggleRasgo}
        resolverRecursosPadre={resolverRecursosPadre}
      />

      {/* Sección 4: Consumibles y Pociones */}
      <SeccionConsumiblesAtaque
        consumiblesFiltrados={consumiblesFiltrados}
        estaAbierta={seccionesAbiertas.consumibles !== false}
        alAlternar={() => alternarSeccion("consumibles")}
        alUsarConsumible={manejarUsarConsumible}
      />

      {/* Sección 5: Hechizos de Objetos Mágicos */}
      <SeccionHechizosObjetosMagicos
        hechizosObjetosFiltrados={hechizosObjetosFiltrados}
        estaAbierta={seccionesAbiertas.hechizosObjetos !== false}
        alAlternar={() => alternarSeccion("hechizosObjetos")}
        estaBloqueadoPorArmadura={estaBloqueadoPorArmadura}
        motivoBloqueoArmadura={motivoBloqueoArmadura}
        cdSalvacionPersonaje={cdSalvacionConjuros}
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
              bonoDanoMagico={
                hechizoDetalle
                  ? obtenerBonoDanoConjuroExtra(personajeActivo, {
                      esTruco: hechizoDetalle.nivel === 0,
                      nivelLanzamiento: hechizoDetalle.nivel,
                      tipoDano: hechizoDetalle.tipoDaño,
                      escuela: hechizoDetalle.escuela,
                      nombreConjuro: hechizoDetalle.nombre
                    })
                  : 0
              }
              modificadorHabilidad={obtenerModificadorAptitudMagica(personajeActivo)}
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

      {/* Modal de Detalle Completo de Rasgo */}
      {rasgoDetalleEfectivo && (
        <ModalDetalleRasgo
          rasgo={rasgoDetalleEfectivo}
          nombrePersonaje={personajeActivo.nombre || "Personaje"}
          idPersonaje={personajeActivo.id}
          nivelPersonaje={obtenerNivelEfectivoParaRasgo(rasgoDetalleEfectivo)}
          alCerrar={() => setRasgoDetalle(null)}
          alGastarUso={() => gastarUsoRasgoPersonaje(personajeActivo.id, rasgoDetalleEfectivo.id)}
          alRecuperarUso={() => recuperarUsoRasgoPersonaje(personajeActivo.id, rasgoDetalleEfectivo.id)}
          alAlternarActivo={() => alternarActivoRasgo(personajeActivo.id, rasgoDetalleEfectivo.id)}
          deshabilitadoToggle={obtenerBloqueoToggleRasgo(rasgoDetalleEfectivo).bloqueado}
          motivoDeshabilitado={obtenerBloqueoToggleRasgo(rasgoDetalleEfectivo).motivo}
          {...resolverRecursosPadre(rasgoDetalleEfectivo)}
        />
      )}
    </div>
  );
};

export default VistaAtaquesJugador;
