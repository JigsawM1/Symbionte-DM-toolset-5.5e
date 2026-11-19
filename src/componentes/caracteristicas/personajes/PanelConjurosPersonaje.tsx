import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { useShallow } from "zustand/react/shallow";
import React, { useState, useEffect, useId, useMemo } from "react";
import type { HechizoBase } from "@/tipos";
import {
  calcularCDConjuros,
  calcularMaximosConjurosYTrucos,
  obtenerConjurosSubclasePersonaje,
  requiereSincronizacionSubclase
} from "@/servicios/calculadorMagia";
import { usarAccionesConfiguracion } from "@/almacen/selectores/usarEstadoConfiguracion";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { calcularEstadisticasMagicas } from "@/hooks/usarMagiaPersonaje";
import { aplicarModificadoresInvocacionesAHechizo } from "@/servicios/evaluadorEfectosRasgos";
import { usarLanzadorConjuros } from "@/hooks/usarLanzadorConjuros";
import { BarraFiltrosConjuros } from "./BarraFiltrosConjuros";
import { usarFiltrosYSeccionesConjuros } from "./conjuros/usarFiltrosYSeccionesConjuros";
import { CabeceraYRecursosMagicos } from "./conjuros/CabeceraYRecursosMagicos";
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
  magia,
  sistemaMagia,
  penalizacionArmadura,
  modoTirada,
  alCambiarModoTirada,
  alAbrirCompendio,
  alGastarEspacio, alRecuperarEspacio,
  alGastarPuntos, alRecuperarPuntos,
  alGastarEspacioPacto, alRecuperarEspaciosPacto,
  alRomperConcentracion,
  alQuitarTruco, alQuitarConjuro, alAlternarPreparado
}) => {
  const [hechizoModal, setHechizoModal] = useState<HechizoBase | null>(null);
  const idClaseLanzamiento = useId();

  const {
    asignarArcanoMistico, quitarArcanoMistico,
    recuperarArcanoMistico, sincronizarConjurosSubclase
  } = usarAlmacenDM(useShallow(s => ({ asignarArcanoMistico: s.asignarArcanoMistico, quitarArcanoMistico: s.quitarArcanoMistico, recuperarArcanoMistico: s.recuperarArcanoMistico, sincronizarConjurosSubclase: s.sincronizarConjurosSubclase })));

  const { establecerPestaña } = usarAccionesConfiguracion();

  useEffect(() => {
    if (
      personaje &&
      (personaje.clase || (personaje.clases && personaje.clases.length > 0))
    ) {
      const res = obtenerConjurosSubclasePersonaje(
        personaje.clases, personaje.clase, personaje.subclase, personaje.nivel
      );
      if (requiereSincronizacionSubclase(personaje, res)) {
        sincronizarConjurosSubclase(personaje.id);
      }
    }
  }, [personaje, sincronizarConjurosSubclase]);

  const [claseElegida, cambiarClaseLanzamiento] = useState("");
  const claseLanzamiento = personaje.clasesLanzadoras.some(c => c.clase === claseElegida)
    ? claseElegida : personaje.clasesLanzadoras[0]?.clase;
  const { etiquetaHabilidad, modHabilidad, cdConjuros, bonoAtaqueMagico } =
    calcularEstadisticasMagicas(personaje, modificadores, bonoCompetencia, claseLanzamiento);
  const {
    requierePreparacion, esLanzadorPacto, nivelEspacioPacto, nivelesArcanoDisponibles,
    esHechizoDeSubclase, obtenerOrigenConjuro, estaPreparado, conteoEfectivo, conjurosPorNivel
  } = magia;
  const maximos = calcularMaximosConjurosYTrucos(personaje.clasesLanzadoras, personaje.nivel || 1, modHabilidad);
  const trucosConocidos = useMemo(
    () => magia.trucosConocidos.map((truco) => aplicarModificadoresInvocacionesAHechizo(truco, personaje, claseLanzamiento)),
    [magia.trucosConocidos, personaje, claseLanzamiento]
  );

  const { puedeLanzar, motivoBloqueo, lanzar } = usarLanzadorConjuros({
    personaje, penalizacionArmadura, bonoAtaqueMagico, sistemaMagia, claseLanzamiento, cdSalvacionPersonaje: calcularCDConjuros(bonoCompetencia, modHabilidad)
  });

  const estaBloqueadoPorArmadura = !puedeLanzar;
  const motivoBloqueoArmadura = motivoBloqueo;

  const manejarTiradaAtaqueMagico = async () => {
    if (!puedeLanzar) return;
    await lanzar({
      modo: "ataqueMagico",
      hechizo: {
        id: "ataque-magico", nombre: "Ataque Mágico", nivel: 0, escuela: "Evocacion",
        tiempoLanzamiento: "1 Accion", alcance: "Personal",
        componentesSeleccionados: { verbal: true, somatico: false, material: false },
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
    limpiarTodosLosFiltros, conjurosEnAccionesSet, alternarEnAcciones,
    trucosVisibles, trucosFiltrados, conjurosVisiblesPorNivel,
    conjurosFiltradosPorNivel
  } = usarFiltrosYSeccionesConjuros({ personaje, conjurosPorNivel, trucosConocidos });

  const algunaSeccionAbierta =
    seccionesAbiertas.trucos !== false ||
    Array.from({ length: 9 }, (_, idx) => idx + 1).some(
      (nivel) => (conjurosPorNivel[nivel]?.length ?? 0) > 0 && seccionesAbiertas[`nv_${nivel}`] !== false
    );

  return (
    <div className={estilos.contenedor}>
      {personaje.clasesLanzadoras.length > 1 && (
        <div className={estilos.barraClaseLanzamiento}>
          <label htmlFor={idClaseLanzamiento} className={estilos.etiquetaClaseLanzamiento}>
            Lanzar como
          </label>
          <SelectorDesplegable
            id={idClaseLanzamiento}
            className={estilos.selectorClaseLanzamiento}
            titulo="Clase de lanzamiento"
            valor={claseLanzamiento ?? ""}
            opciones={personaje.clasesLanzadoras.map((c) => ({ valor: c.clase, etiqueta: c.clase }))}
            alCambiar={cambiarClaseLanzamiento}
          />
        </div>
      )}
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
        modoTirada={modoTirada}
        alCambiarModoTirada={alCambiarModoTirada}
        esLanzadorPacto={esLanzadorPacto}
        nivelEspacioPacto={nivelEspacioPacto}
        nivelesArcanoDisponibles={nivelesArcanoDisponibles}
        alGastarEspacio={alGastarEspacio}
        alRecuperarEspacio={alRecuperarEspacio}
        alGastarPuntos={alGastarPuntos}
        alRecuperarPuntos={alRecuperarPuntos}
        alGastarEspacioPacto={alGastarEspacioPacto}
        alRecuperarEspaciosPacto={alRecuperarEspaciosPacto}
        asignarArcanoMistico={asignarArcanoMistico}
        quitarArcanoMistico={quitarArcanoMistico}
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
        algunaSeccionAbierta={algunaSeccionAbierta}
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
        obtenerOrigenConjuro={obtenerOrigenConjuro}
        estaPreparado={estaPreparado}
        alAlternarPreparado={alAlternarPreparado}
        alQuitarTruco={alQuitarTruco}
        alQuitarConjuro={alQuitarConjuro}
        conjurosEnAccionesSet={conjurosEnAccionesSet}
        alAlternarAcciones={alternarEnAcciones}
        establecerPestaña={establecerPestaña}
        alAbrirCompendio={alAbrirCompendio}
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
