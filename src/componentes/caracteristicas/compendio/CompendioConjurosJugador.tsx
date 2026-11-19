import { DialogoModal } from "@/componentes/comunes/DialogoModal";
import React, { useState, useMemo, useDeferredValue, useCallback, useId } from "react";
import { clasesGestionadasConjuros, conjuroElegidoPorClase, conjuroFueraDeListas, esConjuroIndependiente } from "@/servicios/rasgos/listasConjurosRasgos";
import { aplicarModificadoresInvocacionesAHechizo } from "@/servicios/rasgos/evaluadorCombateRasgos";
import { Star, CheckSquare, BookOpen, Globe, Filter, Search, BookMarked, Sparkles } from "lucide-react";
import type { HechizoBase, ClaseLanzadora, PersonajeJugador } from "@/tipos";
import { coincideBusquedaTolerante, compararPorRelevanciaTitulo } from "@/utiles/busquedaTolerante";
import { usarAccionesPersonajes, usarEstadoConfiguracion } from "@/almacen/selectores";
import {
  obtenerConjurosSubclasePersonaje, requiereSincronizacionSubclase,
  obtenerNivelesConjuroDisponiblesPersonaje, puedePersonajeLanzarHechizo, construirPerfilLanzadorPersonaje
} from "@/servicios/calculadorMagia";
import type { EstadoMagiaPersonaje } from "@/hooks/usarMagiaPersonaje";
import { TarjetasMetricasMagia } from "@/componentes/caracteristicas/personajes/TarjetasMetricasMagia";
import { SelectorDesplegable, ControlPaginacion } from "@/componentes/comunes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { FilaConjuroCompendio } from "./FilaConjuroCompendio";
import { SelectorClaseConjuros } from "./SelectorClaseConjuros";
import { FichaHechizo } from "./FichaHechizo";
import estilos from "./CompendioConjurosJugador.module.css";

type TipoPestañaConjuros = "preparados" | "miLista" | "disponibles" | "todos";

const OPCIONES_NIVEL_FILTRO = [
  { valor: "todos", etiqueta: "Todos los Niveles" },
  { valor: "0", etiqueta: "Truco (Nivel 0)" },
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ valor: String(n), etiqueta: `Nivel ${n}` }))
];

const CONJUROS_POR_PAGINA = 50;

export interface CompendioConjurosJugadorProps {
  personajeActivo: PersonajeJugador | null;
  baseDatosHechizos: HechizoBase[];
  magia: EstadoMagiaPersonaje;
}

export const CompendioConjurosJugador: React.FC<CompendioConjurosJugadorProps> = ({ personajeActivo, baseDatosHechizos, magia }) => {
  const [pestañaActiva, setPestañaActiva] = useState<TipoPestañaConjuros>("miLista");
  const [mostrarFiltros, setMostrarFiltros] = useState<boolean>(false);
  const [busqueda, setBusqueda] = useState<string>("");
  const busquedaDiferida = useDeferredValue(busqueda);
  const [nivelFiltro, setNivelFiltro] = useState<string | number>("todos");
  const [escuelaFiltro, setEscuelaFiltro] = useState<string>("todas");
  const [hechizoModal, setHechizoModal] = useState<HechizoBase | null>(null);
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [claseEleccion, setClaseEleccion] = useState("");
  const idSelectorClase = useId();
  const { esGM } = usarEstadoConfiguracion();
  const idPersonajeActivo = personajeActivo?.id;
  const { agregarTrucoConocido, quitarTrucoConocido, agregarConjuroConocido, quitarConjuroConocido, alternarConjuroPreparado } = usarAccionesPersonajes();
  const sincronizarConjurosSubclase = usarAlmacenDM((state) => state.sincronizarConjurosSubclase);
  const alternarConjuroIndependiente = usarAlmacenDM(state => state.alternarConjuroIndependiente);

  React.useEffect(() => {
    if (
      personajeActivo &&
      (personajeActivo.clase || (personajeActivo.clases && personajeActivo.clases.length > 0))
    ) {
      const res = obtenerConjurosSubclasePersonaje(
        personajeActivo.clases, personajeActivo.clase, personajeActivo.subclase, personajeActivo.nivel
      );
      if (requiereSincronizacionSubclase(personajeActivo, res)) {
        sincronizarConjurosSubclase(personajeActivo.id);
      }
    }
  }, [personajeActivo, sincronizarConjurosSubclase]);

  const {
    esHechizoDeSubclase, obtenerOrigenConjuro, estaPreparado: preparadoGlobal,
    estaEnLista: enListaGlobal, maximos, conteoEfectivo
  } = magia;
  const perfilEleccion = personajeActivo?.clasesLanzadoras.find(c => c.clase === claseEleccion);
  const estaPreparado = useCallback((h: HechizoBase) => !perfilEleccion || !personajeActivo || esConjuroIndependiente(personajeActivo, h) ? preparadoGlobal(h)
    : !!obtenerOrigenConjuro(h) || conjuroElegidoPorClase(personajeActivo, h.id, perfilEleccion.clase, h.nivel === 0 ? "trucos" : "preparados"), [perfilEleccion, personajeActivo, preparadoGlobal, obtenerOrigenConjuro]);
  const estaEnLista = useCallback((h: HechizoBase) => !perfilEleccion || !personajeActivo || esConjuroIndependiente(personajeActivo, h) ? enListaGlobal(h)
    : !!obtenerOrigenConjuro(h) || conjuroElegidoPorClase(personajeActivo, h.id, perfilEleccion.clase, h.nivel === 0 ? "trucos" : "conjuros"), [perfilEleccion, personajeActivo, enListaGlobal, obtenerOrigenConjuro]);

  const esGrimorio = useMemo(() => {
    if (!personajeActivo) return false;
    if (perfilEleccion) return perfilEleccion.modeloConjuros === "grimorio";
    if (personajeActivo.clasesLanzadoras?.some((c: ClaseLanzadora) => c.modeloConjuros === "grimorio")) return true;
    const clasePrincipal = personajeActivo.clasesLanzadoras?.[0]?.clase || personajeActivo.clase || "";
    return clasePrincipal.toLowerCase().includes("mago") || clasePrincipal.toLowerCase().includes("wizard");
  }, [personajeActivo, perfilEleccion]);

  const requierePreparacion = useMemo(() => {
    if (!personajeActivo) return false;
    if (!personajeActivo.clasesLanzadoras || personajeActivo.clasesLanzadoras.length === 0) return true;
    return personajeActivo.clasesLanzadoras.some(
      (c: ClaseLanzadora) => c.modeloConjuros === "preparados" || c.modeloConjuros === "grimorio"
    );
  }, [personajeActivo]);

  const esModeloConocidos = (perfilEleccion?.modeloConjuros ?? maximos.modelo) === "conocidos";
  const esPreparadorSinGrimorio = requierePreparacion && !esGrimorio;

  // Auto-ajustar la pestaña activa según el perfil de magia del personaje
  React.useEffect(() => {
    if (esModeloConocidos && pestañaActiva === "preparados") {
      setPestañaActiva("miLista");
    } else if (esPreparadorSinGrimorio && pestañaActiva === "miLista") {
      setPestañaActiva("preparados");
    }
  }, [esModeloConocidos, esPreparadorSinGrimorio, pestañaActiva]);

  const opcionesEscuelaFiltro = useMemo(() => {
    const escuelas = new Set<string>();
    baseDatosHechizos.forEach((h) => {
      if (h.escuela) escuelas.add(h.escuela);
    });
    return [
      { valor: "todas", etiqueta: "Todas las Escuelas" },
      ...Array.from(escuelas).sort().map((e) => ({ valor: e, etiqueta: e }))
    ];
  }, [baseDatosHechizos]);

  const nivelesDisponiblesPersonaje = useMemo(() => {
    return obtenerNivelesConjuroDisponiblesPersonaje(personajeActivo);
  }, [personajeActivo]);

  const opcionesNivelFiltro = useMemo(() => {
    if (pestañaActiva !== "disponibles" || !personajeActivo) {
      return OPCIONES_NIVEL_FILTRO;
    }
    return OPCIONES_NIVEL_FILTRO.filter(
      (op) => op.valor === "todos" || nivelesDisponiblesPersonaje.has(Number(op.valor))
    );
  }, [pestañaActiva, personajeActivo, nivelesDisponiblesPersonaje]);

  React.useEffect(() => {
    if (
      pestañaActiva === "disponibles" &&
      personajeActivo &&
      nivelFiltro !== "todos" &&
      !nivelesDisponiblesPersonaje.has(Number(nivelFiltro))
    ) {
      setNivelFiltro("todos");
    }
  }, [pestañaActiva, personajeActivo, nivelFiltro, nivelesDisponiblesPersonaje]);

  const conjurosPestaña = useMemo(() => {
    switch (pestañaActiva) {
      case "preparados":
        return esModeloConocidos
          ? baseDatosHechizos.filter((h) => estaEnLista(h))
          : baseDatosHechizos.filter((h) => estaPreparado(h));
      case "miLista":
        return baseDatosHechizos.filter((h) => estaEnLista(h));
      case "disponibles": {
        if (!personajeActivo) return baseDatosHechizos;
        const perfil = construirPerfilLanzadorPersonaje(personajeActivo);
        return baseDatosHechizos.filter((h) => puedePersonajeLanzarHechizo(personajeActivo, h, perfil));
      }
      case "todos":
      default:
        return baseDatosHechizos;
    }
  }, [pestañaActiva, baseDatosHechizos, estaPreparado, estaEnLista, personajeActivo, esModeloConocidos]);

  const conjurosFiltrados = useMemo(() => {
    const busqLimpia = busquedaDiferida.trim();
    const filtrados = conjurosPestaña.filter((h) => {
      if (busqLimpia) {
        const coincide = coincideBusquedaTolerante(
          [h.nombre, h.escuela, h.descripcion],
          busqLimpia
        );
        if (!coincide) return false;
      }
      if (nivelFiltro !== "todos" && h.nivel !== Number(nivelFiltro)) {
        return false;
      }
      if (escuelaFiltro !== "todas" && h.escuela !== escuelaFiltro) {
        return false;
      }
      return true;
    });
    return filtrados.sort(
      compararPorRelevanciaTitulo(
        (h) => h.nombre,
        busqLimpia,
        (a, b) => {
          if (a.nivel !== b.nivel) return a.nivel - b.nivel;
          return a.nombre.localeCompare(b.nombre, "es");
        },
        (h) => [h.escuela, h.descripcion]
      )
    );
  }, [conjurosPestaña, busquedaDiferida, nivelFiltro, escuelaFiltro]);

  React.useEffect(() => {
    setPaginaActual(1);
  }, [pestañaActiva, busquedaDiferida, nivelFiltro, escuelaFiltro, idPersonajeActivo]);

  const conjurosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * CONJUROS_POR_PAGINA;
    return conjurosFiltrados.slice(inicio, inicio + CONJUROS_POR_PAGINA);
  }, [conjurosFiltrados, paginaActual]);

  const mostrarSelectorClase = Boolean(
    personajeActivo && personajeActivo.clasesLanzadoras.length >= 2 && clasesGestionadasConjuros(personajeActivo).length > 0
  );
  const textoConteoConjuros = `${conjurosFiltrados.length} ${conjurosFiltrados.length === 1 ? "conjuro" : "conjuros"}`;

  const manejarAlternarEnLista = (hechizo: HechizoBase) => {
    if (!personajeActivo) return;
    if (hechizo.nivel === 0) {
      if (estaEnLista(hechizo)) {
        quitarTrucoConocido(personajeActivo.id, hechizo.id, claseEleccion || undefined);
      } else {
        agregarTrucoConocido(personajeActivo.id, hechizo.id, claseEleccion || undefined);
      }
    } else if (!esModeloConocidos && esPreparadorSinGrimorio) {
      alternarConjuroPreparado(personajeActivo.id, hechizo.id, claseEleccion || undefined);
    } else if (estaEnLista(hechizo)) {
      if (!esModeloConocidos && estaPreparado(hechizo)) {
        alternarConjuroPreparado(personajeActivo.id, hechizo.id, claseEleccion || undefined);
      }
      quitarConjuroConocido(personajeActivo.id, hechizo.id, claseEleccion || undefined);
    } else {
      agregarConjuroConocido(personajeActivo.id, hechizo.id, claseEleccion || undefined);
    }
  };

  const manejarAlternarPreparado = (hechizo: HechizoBase) => {
    if (!personajeActivo) return;
    if (hechizo.nivel === 0) return;
    if (esModeloConocidos) {
      if (estaEnLista(hechizo)) {
        quitarConjuroConocido(personajeActivo.id, hechizo.id, claseEleccion || undefined);
      } else {
        agregarConjuroConocido(personajeActivo.id, hechizo.id, claseEleccion || undefined);
      }
      return;
    }
    if (esGrimorio && !estaEnLista(hechizo)) {
      agregarConjuroConocido(personajeActivo.id, hechizo.id, claseEleccion || undefined);
    }
    alternarConjuroPreparado(personajeActivo.id, hechizo.id, claseEleccion || undefined);
  };

  const hayFiltrosActivos = Boolean(busqueda.trim() || nivelFiltro !== "todos" || escuelaFiltro !== "todas");
  const sinCapacidadMagica = Boolean(
    personajeActivo && !personajeActivo.esLanzador && (personajeActivo.clasesLanzadoras?.length ?? 0) === 0
  );
  const mensajeVacioPorPestaña: Record<TipoPestañaConjuros, string> = {
    preparados: esGrimorio
      ? "No tienes conjuros preparados para el día. Marca la estrella en tu «Libro de conjuros» para prepararlos."
      : "No tienes conjuros preparados actualmente.",
    miLista: esGrimorio
      ? "El grimorio está vacío. Busca conjuros en Disponibles u Otros."
      : "La lista está vacía. Busca conjuros en Disponibles o Todos.",
    disponibles: sinCapacidadMagica
      ? "Este personaje no posee clases ni rasgos lanzadores de conjuros."
      : "No se encontraron conjuros disponibles para tu clase y nivel con los filtros seleccionados.",
    todos: "No se encontraron conjuros en el compendio con los filtros seleccionados."
  };

  return (
    <div className={estilos.contenedorGeneral}>
      <div className={estilos.cabeceraPrincipal}>
        {mostrarSelectorClase && (
          <div className={estilos.filaSuperiorCabecera}>
            <span className={estilos.contadorConjurosTexto}>{textoConteoConjuros}</span>
            <div className={estilos.grupoSelectorClase}>
              <label htmlFor={idSelectorClase} className={estilos.etiquetaSelectorClase}>Aprender en</label>
              <SelectorClaseConjuros id={idSelectorClase} className={estilos.selectorClaseWrapper} personaje={personajeActivo} valor={claseEleccion} alCambiar={setClaseEleccion} />
            </div>
          </div>
        )}

        {personajeActivo && (
          <TarjetasMetricasMagia
            conteoConjurosLibres={conteoEfectivo.libres}
            conteoConjurosSubclase={conteoEfectivo.subclase}
            maxConjuros={maximos.maxConjuros}
            conteoTrucosLibres={conteoEfectivo.trucosLibres}
            conteoTrucosSubclase={conteoEfectivo.trucosSubclase}
            maxTrucos={maximos.maxTrucos}
            modelo={maximos.modelo}
          />
        )}

        <div className={estilos.grupoPestañas}>
          {/* 1. Preparados */}
          {!esModeloConocidos && (
            <button
              type="button"
              aria-pressed={pestañaActiva === "preparados"}
              onClick={() => setPestañaActiva("preparados")}
              className={`${estilos.botonPestaña} ${pestañaActiva === "preparados" ? estilos.botonPestañaActiva : ""}`}
            >
              <Star size={13} fill={pestañaActiva === "preparados" ? "var(--pj-acento-oro)" : "none"} />
              <span>Preparados</span>
            </button>
          )}

          {/* 2. Mi lista / Libro de conjuros / Conocidos: oculto para preparadores divinos puros */}
          {(!esPreparadorSinGrimorio || esGrimorio) && (
            <button
              type="button"
              aria-pressed={pestañaActiva === "miLista"}
              onClick={() => setPestañaActiva("miLista")}
              className={`${estilos.botonPestaña} ${pestañaActiva === "miLista" ? estilos.botonPestañaActiva : ""}`}
            >
              {esGrimorio ? <BookMarked size={13} /> : esModeloConocidos ? <Sparkles size={13} /> : <CheckSquare size={13} />}
              <span>{esGrimorio ? "Libro de conjuros" : esModeloConocidos ? "Conocidos" : "Mi lista"}</span>
            </button>
          )}

          {/* 3. Disponibles */}
          <button
            type="button"
            aria-pressed={pestañaActiva === "disponibles"}
            onClick={() => setPestañaActiva("disponibles")}
            className={`${estilos.botonPestaña} ${pestañaActiva === "disponibles" ? estilos.botonPestañaActiva : ""}`}
          >
            <BookOpen size={13} />
            <span>Disponibles</span>
          </button>

          {/* 4. Todos / Otros */}
          <button
            type="button"
            aria-pressed={pestañaActiva === "todos"}
            onClick={() => setPestañaActiva("todos")}
            className={`${estilos.botonPestaña} ${pestañaActiva === "todos" ? estilos.botonPestañaActiva : ""}`}
          >
            <Globe size={13} />
            <span>{esGrimorio ? "Otros" : "Todos"}</span>
          </button>
        </div>
      </div>

      {/* Buscador siempre visible y panel desplegable de filtros */}
      <div className={estilos.barraBusquedaYFiltros}>
        <div className={estilos.filaBusquedaCompacta}>
          <div className={estilos.contenedorBuscadorFiltro}>
            <Search size={13} color="var(--pj-texto-terciario)" aria-hidden="true" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, efecto, escuela..."
              aria-label="Buscar conjuros por nombre, efecto o escuela"
              className={estilos.buscadorInput}
            />
          </div>
          {!mostrarSelectorClase && <span className={estilos.contadorConjurosTexto}>{textoConteoConjuros}</span>}
          <button
            type="button"
            aria-expanded={mostrarFiltros}
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`${estilos.botonFiltrar} ${mostrarFiltros ? estilos.botonFiltrarActivo : ""}`}
          >
            <Filter size={12} aria-hidden="true" />
            <span>Filtrar</span>
          </button>
        </div>

        {mostrarFiltros && (
          <div className={estilos.panelFiltros}>
            <div className={estilos.selectorNivelWrapper}>
              <SelectorDesplegable<string>
                valor={String(nivelFiltro)}
                alCambiar={(v) => setNivelFiltro(v === "todos" ? "todos" : Number(v))}
                tamano="compacto"
                opciones={opcionesNivelFiltro}
              />
            </div>
            <div className={estilos.selectorEscuelaWrapper}>
              <SelectorDesplegable<string>
                valor={escuelaFiltro}
                alCambiar={(v) => setEscuelaFiltro(v)}
                tamano="compacto"
                opciones={opcionesEscuelaFiltro}
              />
            </div>
          </div>
        )}
      </div>

      {/* Lista de Filas de Conjuro */}
      <div className={`${estilos.areaLista} u-scroll-cef`}>
        <div className={estilos.listaInterior}>
          {conjurosFiltrados.length === 0 ? (
            <div className={estilos.mensajeVacio}>
              <span>{mensajeVacioPorPestaña[pestañaActiva]}</span>
              {hayFiltrosActivos ? (
                <button
                  type="button"
                  className={estilos.botonCtaVacio}
                  onClick={() => { setBusqueda(""); setNivelFiltro("todos"); setEscuelaFiltro("todas"); }}
                >
                  Limpiar filtros
                </button>
              ) : (pestañaActiva === "preparados" || pestañaActiva === "miLista") ? (
                <button
                  type="button"
                  className={estilos.botonCtaVacio}
                  onClick={() => setPestañaActiva("disponibles")}
                >
                  Ver Disponibles
                </button>
              ) : null}
            </div>
          ) : (
            conjurosPaginados.map((hechizo) => {
              const esSubclase = esHechizoDeSubclase(hechizo);
              const origenBadge = obtenerOrigenConjuro(hechizo);
              const enLista = estaEnLista(hechizo);
              const preparado = estaPreparado(hechizo);
              const independiente = !!personajeActivo && esConjuroIndependiente(personajeActivo, hechizo);
              const edicionIndependiente = !!personajeActivo && (independiente
                || (pestañaActiva === "todos" && !enLista && conjuroFueraDeListas(personajeActivo, hechizo)));
              const mostrarEstrella =
                !esModeloConocidos &&
                (esPreparadorSinGrimorio || pestañaActiva === "miLista" || pestañaActiva === "preparados");

              return (
                <FilaConjuroCompendio
                  key={hechizo.id}
                  hechizo={aplicarModificadoresInvocacionesAHechizo(hechizo, personajeActivo)}
                  estaEnLista={enLista}
                  estaPreparado={preparado}
                  esDeSubclase={esSubclase}
                  origenBadge={origenBadge}
                  esModeloConocidos={esModeloConocidos}
                  mostrarEstrella={mostrarEstrella && (!edicionIndependiente || independiente)}
                  tituloEdicionIndependiente={edicionIndependiente ? independiente ? "Quitar concesión independiente" : "Añadir como concesión independiente" : undefined}
                  alAlternarEnLista={() => edicionIndependiente && personajeActivo
                    ? alternarConjuroIndependiente(personajeActivo.id, hechizo.id) : manejarAlternarEnLista(hechizo)}
                  alAlternarPreparado={() => independiente && personajeActivo
                    ? alternarConjuroPreparado(personajeActivo.id, hechizo.id) : manejarAlternarPreparado(hechizo)}
                  alAbrirDetalle={(h) => setHechizoModal(h)}
                />
              );
            })
          )}
        </div>
      </div>

      {conjurosFiltrados.length > CONJUROS_POR_PAGINA && (
        <div className={estilos.paginacionContenedor}>
          <ControlPaginacion
            paginaActual={paginaActual}
            totalElementos={conjurosFiltrados.length}
            elementosPorPagina={CONJUROS_POR_PAGINA}
            alCambiarPagina={(nueva) => setPaginaActual(nueva)}
            etiquetaElementos="conjuros"
          />
        </div>
      )}

      {/* Modal de FichaHechizo Completa */}
      {hechizoModal && (
        <DialogoModal etiqueta={`Conjuro: ${hechizoModal.nombre}`} alCerrar={() => setHechizoModal(null)}>
          <div className={estilos.modalOverlay} onClick={() => setHechizoModal(null)}>
          <div className={estilos.modalContenido} onClick={(e) => e.stopPropagation()}>
            <FichaHechizo
              hechizo={hechizoModal}
              nombrePersonaje={personajeActivo?.nombre || (esGM ? "DM" : "Personaje")}
              nivelPersonaje={personajeActivo?.nivel || 1}
              bonoAtaqueMagico={0}
              esLanzadorPacto={(personajeActivo?.espaciosPactoMaximos || 0) > 0 || (personajeActivo?.clasesLanzadoras || []).some((c) => c.tipoLanzador === "pacto")}
              nivelEspacioPacto={personajeActivo?.nivelEspacioPacto || 0}
              espaciosPactoMaximos={personajeActivo?.espaciosPactoMaximos || 0}
              espaciosConjuroMaximos={personajeActivo?.espaciosConjuroMaximos || {}}
              nivelConjuroMaximo={personajeActivo?.nivelConjuroMaximo || 0}
              ocultarLanzamiento={!esGM}
              permitirUpcastLibre={esGM}
              onClose={() => setHechizoModal(null)}
            />
          </div>
        </div>
        </DialogoModal>
      )}
    </div>
  );
};
