import React, { useState, useEffect } from "react";
import type { HechizoBase } from "@/tipos";
import { obtenerConjurosSubclasePersonaje } from "@/servicios/calculadorMagia";
import { usarAccionesConfiguracion } from "@/almacen/selectores/usarEstadoConfiguracion";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { usarMagiaPersonaje } from "@/hooks/usarMagiaPersonaje";
import { usarLanzadorConjuros } from "@/hooks/usarLanzadorConjuros";
import { BarraFiltrosConjuros } from "./BarraFiltrosConjuros";
import { usarFiltrosYSeccionesConjuros } from "./conjuros/usarFiltrosYSeccionesConjuros";
import { CabeceraYRecursosMagicos } from "./conjuros/CabeceraYRecursosMagicos";
import { SeccionConjurosOcultos } from "./conjuros/SeccionConjurosOcultos";
import { ModalFichaHechizoFlotante } from "./conjuros/ModalFichaHechizoFlotante";
import { ListaNivelesConjuros } from "./conjuros/ListaNivelesConjuros";
import type { PanelConjurosPersonajeProps } from "./conjuros/tiposPanelConjuros";
import estilos from "./PanelConjurosPersonaje.module.css";

export type { PanelConjurosPersonajeProps };

export const PanelConjurosPersonaje: React.FC<PanelConjurosPersonajeProps> = ({
  personaje,
  bonoCompetencia,
  modificadores,
  baseDatosHechizos,
  sistemaMagia,
  penalizacionArmadura,
  alAbrirConfiguracion,
  alGastarEspacio, alRecuperarEspacio, alRecuperarTodosEspacios,
  alGastarPuntos, alRecuperarPuntos, alRecuperarTodosPuntos,
  alGastarEspacioPacto, alRecuperarEspaciosPacto,
  alEstablecerConcentracion: _alEstablecerConcentracion,
  alRomperConcentracion,
  alQuitarTruco, alQuitarConjuro, alAlternarPreparado
}) => {
  const [hechizoModal, setHechizoModal] = useState<HechizoBase | null>(null);

  const {
    asignarArcanoMistico, quitarArcanoMistico,
    gastarArcanoMistico, recuperarArcanoMistico,
    sincronizarConjurosSubclase
  } = usarAlmacenDM();

  const { establecerPestaña } = usarAccionesConfiguracion();

  useEffect(() => {
    if (
      (!personaje.conjurosSiemprePreparadosIds || personaje.conjurosSiemprePreparadosIds.length === 0) &&
      (personaje.clase || (personaje.clases && personaje.clases.length > 0))
    ) {
      const res = obtenerConjurosSubclasePersonaje(
        personaje.clases, personaje.clase, personaje.subclase, personaje.nivel
      );
      if (res.conjuros.length > 0 || res.trucos.length > 0) {
        sincronizarConjurosSubclase(personaje.id);
      }
    }
  }, [
    personaje.id, personaje.clases, personaje.clase, personaje.subclase,
    personaje.nivel, personaje.conjurosSiemprePreparadosIds, sincronizarConjurosSubclase
  ]);

  const {
    etiquetaHabilidad, modHabilidad, cdConjuros, bonoAtaqueMagico,
    requierePreparacion, esLanzadorPacto, nivelEspacioPacto,
    nivelesArcanoDisponibles, esHechizoDeSubclase, estaPreparado,
    maximos, conteoEfectivo, conjurosPorNivel, trucosConocidos
  } = usarMagiaPersonaje(personaje, baseDatosHechizos, modificadores, bonoCompetencia);

  const { puedeLanzar, motivoBloqueo, lanzar } = usarLanzadorConjuros({
    personaje, penalizacionArmadura, bonoAtaqueMagico, sistemaMagia
  });

  const estaBloqueadoPorArmadura = !puedeLanzar;
  const motivoBloqueoArmadura = motivoBloqueo;

  const manejarTiradaAtaqueMagico = async () => {
    if (!puedeLanzar) return;
    await lanzar({
      modo: "ataqueMagico",
      hechizo: {
        id: "ataque-magico", nombre: "Ataque Mágico", nivel: 0, escuela: "Evocacion",
        tiempoLanzamiento: "1 Accion", alcance: "Personal", componentes: "V",
        duracion: "Instantaneo", concentracion: false, ritual: false,
        descripcion: "Tirada genérica de ataque de conjuro."
      }
    });
  };

  const {
    busqueda, setBusqueda, mostrarFiltros, setMostrarFiltros,
    filtroConcentracion, setFiltroConcentracion, filtroResolucion, setFiltroResolucion,
    filtroComponentes, setFiltroComponentes, seccionesAbiertas, alternarSeccion,
    alternarTodasLasSecciones, conteoFiltrosActivos, hayFiltrosActivos,
    limpiarTodosLosFiltros, alternarOculto, desocultarTodos,
    trucosVisibles, trucosFiltrados, conjurosVisiblesPorNivel,
    conjurosFiltradosPorNivel, todosConjurosOcultos, conjurosOcultosFiltrados
  } = usarFiltrosYSeccionesConjuros({ personaje, conjurosPorNivel, trucosConocidos });

  return (
    <div className={estilos.contenedor}>
      {/* Cabecera y Recursos Mágicos */}
      <CabeceraYRecursosMagicos
        personaje={personaje}
        baseDatosHechizos={baseDatosHechizos}
        sistemaMagia={sistemaMagia}
        penalizacionArmadura={penalizacionArmadura}
        estaBloqueadoPorArmadura={estaBloqueadoPorArmadura}
        motivoBloqueoArmadura={motivoBloqueoArmadura}
        alRomperConcentracion={alRomperConcentracion}
        etiquetaHabilidad={etiquetaHabilidad}
        modHabilidad={modHabilidad}
        cdConjuros={cdConjuros}
        bonoAtaqueMagico={bonoAtaqueMagico}
        manejarTiradaAtaqueMagico={manejarTiradaAtaqueMagico}
        conteoEfectivo={conteoEfectivo}
        maximos={maximos}
        alAbrirConfiguracion={alAbrirConfiguracion}
        alAbrirCompendio={() => establecerPestaña("compendio")}
        esLanzadorPacto={esLanzadorPacto}
        nivelEspacioPacto={nivelEspacioPacto}
        nivelesArcanoDisponibles={nivelesArcanoDisponibles}
        alGastarEspacio={alGastarEspacio}
        alRecuperarEspacio={alRecuperarEspacio}
        alRecuperarTodosEspacios={alRecuperarTodosEspacios}
        alGastarPuntos={alGastarPuntos}
        alRecuperarPuntos={alRecuperarPuntos}
        alRecuperarTodosPuntos={alRecuperarTodosPuntos}
        alGastarEspacioPacto={alGastarEspacioPacto}
        alRecuperarEspaciosPacto={alRecuperarEspaciosPacto}
        asignarArcanoMistico={asignarArcanoMistico}
        quitarArcanoMistico={quitarArcanoMistico}
        gastarArcanoMistico={gastarArcanoMistico}
        recuperarArcanoMistico={recuperarArcanoMistico}
        alAbrirFichaHechizo={(h) => setHechizoModal(h)}
        alLanzarArcano={(sol) => lanzar(sol)}
      />

      {/* Barra de Filtros y Búsqueda */}
      <BarraFiltrosConjuros
        busqueda={busqueda}
        alCambiarBusqueda={setBusqueda}
        mostrarFiltros={mostrarFiltros}
        alAlternarMostrarFiltros={() => setMostrarFiltros(!mostrarFiltros)}
        conteoFiltrosActivos={conteoFiltrosActivos}
        hayFiltrosActivos={hayFiltrosActivos}
        alAlternarTodasLasSecciones={alternarTodasLasSecciones}
        filtroConcentracion={filtroConcentracion}
        alCambiarFiltroConcentracion={setFiltroConcentracion}
        filtroResolucion={filtroResolucion}
        alCambiarFiltroResolucion={setFiltroResolucion}
        filtroComponentes={filtroComponentes}
        alCambiarFiltroComponentes={setFiltroComponentes}
        alLimpiarTodosLosFiltros={limpiarTodosLosFiltros}
      />

      {/* Lista de Trucos y Niveles 1 a 9 de Conjuros */}
      <ListaNivelesConjuros
        personaje={personaje}
        sistemaMagia={sistemaMagia}
        bonoAtaqueMagico={bonoAtaqueMagico}
        estaBloqueadoPorArmadura={estaBloqueadoPorArmadura}
        motivoBloqueoArmadura={motivoBloqueoArmadura}
        esLanzadorPacto={esLanzadorPacto}
        nivelEspacioPacto={nivelEspacioPacto}
        requierePreparacion={requierePreparacion}
        esHechizoDeSubclase={esHechizoDeSubclase}
        estaPreparado={estaPreparado}
        alAlternarPreparado={alAlternarPreparado}
        alQuitarTruco={alQuitarTruco}
        alQuitarConjuro={alQuitarConjuro}
        alternarOculto={alternarOculto}
        establecerPestaña={establecerPestaña}
        setHechizoModal={setHechizoModal}
        lanzar={lanzar}
        conteoEfectivo={conteoEfectivo}
        trucosConocidos={trucosConocidos}
        trucosVisibles={trucosVisibles}
        trucosFiltrados={trucosFiltrados}
        conjurosPorNivel={conjurosPorNivel}
        conjurosVisiblesPorNivel={conjurosVisiblesPorNivel}
        conjurosFiltradosPorNivel={conjurosFiltradosPorNivel}
        seccionesAbiertas={seccionesAbiertas}
        alternarSeccion={alternarSeccion}
        hayFiltrosActivos={hayFiltrosActivos}
      />

      {/* Sección: Conjuros Ocultos */}
      <SeccionConjurosOcultos
        personaje={personaje}
        todosConjurosOcultos={todosConjurosOcultos}
        conjurosOcultosFiltrados={conjurosOcultosFiltrados}
        estaAbierta={seccionesAbiertas.ocultos !== false}
        alAlternar={() => alternarSeccion("ocultos")}
        hayFiltrosActivos={hayFiltrosActivos}
        desocultarTodos={desocultarTodos}
        alternarOculto={alternarOculto}
        bonoAtaqueMagico={bonoAtaqueMagico}
        estaPreparado={estaPreparado}
        esHechizoDeSubclase={esHechizoDeSubclase}
        requierePreparacion={requierePreparacion}
        estaBloqueadoPorArmadura={estaBloqueadoPorArmadura}
        motivoBloqueoArmadura={motivoBloqueoArmadura}
        alAlternarPreparado={alAlternarPreparado}
        alQuitarTruco={alQuitarTruco}
        alQuitarConjuro={alQuitarConjuro}
        alAbrirDetalleCompleto={(h) => setHechizoModal(h)}
        alLanzar={(modo, niv, hechizo) => {
          if (hechizo) return lanzar({ modo, hechizo, nivelLanzamiento: niv });
          return Promise.resolve(false);
        }}
        esLanzadorPacto={esLanzadorPacto}
        nivelEspacioPacto={nivelEspacioPacto}
        sistemaMagia={sistemaMagia}
      />

      {/* Modal Ficha Completa */}
      <ModalFichaHechizoFlotante
        hechizoModal={hechizoModal}
        alCerrar={() => setHechizoModal(null)}
        personaje={personaje}
        bonoAtaqueMagico={bonoAtaqueMagico}
        esLanzadorPacto={esLanzadorPacto}
        nivelEspacioPacto={nivelEspacioPacto}
        sistemaMagia={sistemaMagia}
        estaBloqueadoPorArmadura={estaBloqueadoPorArmadura}
        motivoBloqueoArmadura={motivoBloqueoArmadura}
        lanzar={lanzar}
      />
    </div>
  );
};

export default PanelConjurosPersonaje;
