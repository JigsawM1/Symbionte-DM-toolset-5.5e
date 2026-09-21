import React, { useState, useMemo, useDeferredValue } from "react";
import {
  Star,
  CheckSquare,
  BookOpen,
  Globe,
  Filter,
  Search,
  BookMarked,
  Sparkles,
  User
} from "lucide-react";
import type { HechizoBase, PersonajeJugador, ClaseLanzadora } from "@/tipos";
import { coincideBusquedaTolerante, compararPorRelevanciaTitulo } from "@/utiles/busquedaTolerante";
import {
  usarEstadoHomebrew,
  usarEstadoPersonajes,
  usarAccionesPersonajes
} from "@/almacen/selectores";
import { obtenerConjurosSubclasePersonaje } from "@/servicios/calculadorMagia";
import { usarMagiaPersonaje } from "@/hooks/usarMagiaPersonaje";
import { TarjetasMetricasMagia } from "@/componentes/caracteristicas/personajes/TarjetasMetricasMagia";
import { SelectorDesplegable } from "@/componentes/comunes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { FilaConjuroCompendio } from "./FilaConjuroCompendio";
import { FichaHechizo } from "./FichaHechizo";
import estilos from "./CompendioConjurosJugador.module.css";

type TipoPestañaConjuros = "preparados" | "miLista" | "disponibles" | "todos";

const OPCIONES_NIVEL_FILTRO = [
  { valor: "todos", etiqueta: "Todos los Niveles" },
  { valor: "0", etiqueta: "Truco (Nivel 0)" },
  { valor: "1", etiqueta: "Nivel 1" },
  { valor: "2", etiqueta: "Nivel 2" },
  { valor: "3", etiqueta: "Nivel 3" },
  { valor: "4", etiqueta: "Nivel 4" },
  { valor: "5", etiqueta: "Nivel 5" },
  { valor: "6", etiqueta: "Nivel 6" },
  { valor: "7", etiqueta: "Nivel 7" },
  { valor: "8", etiqueta: "Nivel 8" },
  { valor: "9", etiqueta: "Nivel 9" }
];

export const CompendioConjurosJugador: React.FC = () => {
  const [pestañaActiva, setPestañaActiva] = useState<TipoPestañaConjuros>("miLista");
  const [mostrarFiltros, setMostrarFiltros] = useState<boolean>(false);
  const [busqueda, setBusqueda] = useState<string>("");
  const busquedaDiferida = useDeferredValue(busqueda);
  const [nivelFiltro, setNivelFiltro] = useState<string | number>("todos");
  const [escuelaFiltro, setEscuelaFiltro] = useState<string>("todas");
  const [hechizoModal, setHechizoModal] = useState<HechizoBase | null>(null);

  const { baseDatosHechizos } = usarEstadoHomebrew();
  const { personajes, idPersonajeActivo } = usarEstadoPersonajes();
  const {
    seleccionarPersonajeActivo,
    agregarTrucoConocido,
    quitarTrucoConocido,
    agregarConjuroConocido,
    quitarConjuroConocido,
    alternarConjuroPreparado
  } = usarAccionesPersonajes();
  const sincronizarConjurosSubclase = usarAlmacenDM((state) => state.sincronizarConjurosSubclase);

  const personajeActivo = useMemo(() => {
    if (!personajes || personajes.length === 0) return null;
    if (!idPersonajeActivo) return personajes[0];
    return personajes.find((p) => p.id === idPersonajeActivo) || personajes[0];
  }, [personajes, idPersonajeActivo]);

  React.useEffect(() => {
    if (
      personajeActivo &&
      (!personajeActivo.conjurosSiemprePreparadosIds || personajeActivo.conjurosSiemprePreparadosIds.length === 0) &&
      (personajeActivo.clase || (personajeActivo.clases && personajeActivo.clases.length > 0))
    ) {
      const res = obtenerConjurosSubclasePersonaje(
        personajeActivo.clases,
        personajeActivo.clase,
        personajeActivo.subclase,
        personajeActivo.nivel
      );
      if (res.conjuros.length > 0 || res.trucos.length > 0) {
        sincronizarConjurosSubclase(personajeActivo.id);
      }
    }
  }, [personajeActivo, sincronizarConjurosSubclase]);

  const {
    esHechizoDeSubclase,
    obtenerOrigenConjuro,
    estaPreparado,
    estaEnLista,
    maximos,
    conteoEfectivo
  } = usarMagiaPersonaje(personajeActivo, baseDatosHechizos);

  const esMago = useMemo(() => {
    if (!personajeActivo) return false;
    const clasePrincipal = personajeActivo.clasesLanzadoras?.[0]?.clase || personajeActivo.clase || "";
    return clasePrincipal.toLowerCase().includes("mago") || clasePrincipal.toLowerCase().includes("wizard");
  }, [personajeActivo]);

  const requierePreparacion = useMemo(() => {
    if (!personajeActivo) return false;
    if (!personajeActivo.clasesLanzadoras || personajeActivo.clasesLanzadoras.length === 0) return true;
    return personajeActivo.clasesLanzadoras.some((c: ClaseLanzadora) => c.modeloConjuros === "preparados");
  }, [personajeActivo]);

  const esModeloConocidos = maximos.modelo === "conocidos";
  const esPreparadorDivino = requierePreparacion && !esMago;

  // Auto-ajustar la pestaña activa según el perfil de magia del personaje
  React.useEffect(() => {
    if (esModeloConocidos && pestañaActiva === "preparados") {
      setPestañaActiva("miLista");
    } else if (esPreparadorDivino && pestañaActiva === "miLista") {
      setPestañaActiva("preparados");
    }
  }, [esModeloConocidos, esPreparadorDivino, pestañaActiva]);

  const clasesDelPersonaje = useMemo(() => {
    if (!personajeActivo) return [];
    const clasesSet = new Set<string>();
    if (personajeActivo.clase) {
      clasesSet.add(personajeActivo.clase.toLowerCase().trim());
    }
    if (personajeActivo.clasesLanzadoras) {
      personajeActivo.clasesLanzadoras.forEach((c: ClaseLanzadora) => {
        if (c.clase) clasesSet.add(c.clase.toLowerCase().trim());
      });
    }
    return Array.from(clasesSet);
  }, [personajeActivo]);

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

  const conjurosPestaña = useMemo(() => {
    switch (pestañaActiva) {
      case "preparados":
        return esModeloConocidos
          ? baseDatosHechizos.filter((h) => estaEnLista(h))
          : baseDatosHechizos.filter((h) => estaPreparado(h));
      case "miLista":
        return baseDatosHechizos.filter((h) => estaEnLista(h));
      case "disponibles": {
        if (clasesDelPersonaje.length === 0) return baseDatosHechizos;
        return baseDatosHechizos.filter((h) => {
          if (!h.clases || h.clases.length === 0) return true;
          return h.clases.some((c) =>
            clasesDelPersonaje.some((cp) => c.toLowerCase().includes(cp) || cp.includes(c.toLowerCase()))
          );
        });
      }
      case "todos":
      default:
        return baseDatosHechizos;
    }
  }, [pestañaActiva, baseDatosHechizos, estaPreparado, estaEnLista, clasesDelPersonaje, esModeloConocidos]);

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

  const manejarAlternarEnLista = (hechizo: HechizoBase) => {
    if (!personajeActivo) return;
    if (hechizo.nivel === 0) {
      if (estaEnLista(hechizo)) {
        quitarTrucoConocido(personajeActivo.id, hechizo.id);
      } else {
        agregarTrucoConocido(personajeActivo.id, hechizo.id);
      }
    } else {
      if (esModeloConocidos) {
        // En modelo de conocidos: el control marca o desmarca directamente como conocido
        if (estaEnLista(hechizo)) {
          quitarConjuroConocido(personajeActivo.id, hechizo.id);
        } else {
          agregarConjuroConocido(personajeActivo.id, hechizo.id);
        }
      } else if (esPreparadorDivino) {
        // En preparadores divinos sin libro (Clérigo/Druida/Paladín): prepara o desprepara para el día
        alternarConjuroPreparado(personajeActivo.id, hechizo.id);
      } else {
        // Mago (con libro de conjuros): agrega o quita del libro
        if (estaEnLista(hechizo)) {
          if (estaPreparado(hechizo)) {
            alternarConjuroPreparado(personajeActivo.id, hechizo.id);
          }
          quitarConjuroConocido(personajeActivo.id, hechizo.id);
        } else {
          agregarConjuroConocido(personajeActivo.id, hechizo.id);
        }
      }
    }
  };

  const manejarAlternarPreparado = (hechizo: HechizoBase) => {
    if (!personajeActivo) return;
    if (hechizo.nivel === 0) return;
    if (esModeloConocidos) {
      if (estaEnLista(hechizo)) {
        quitarConjuroConocido(personajeActivo.id, hechizo.id);
      } else {
        agregarConjuroConocido(personajeActivo.id, hechizo.id);
      }
      return;
    }
    if (esMago && !estaEnLista(hechizo)) {
      agregarConjuroConocido(personajeActivo.id, hechizo.id);
    }
    alternarConjuroPreparado(personajeActivo.id, hechizo.id);
  };

  return (
    <div className={estilos.contenedorGeneral}>
      <div className={estilos.cabeceraPrincipal}>
        <div className={estilos.filaTitulo}>
          <div className="u-flex u-alinear-centro u-gap-lg">
            <h2 className={estilos.tituloTexto}>Listado de conjuros</h2>
            <span className={estilos.contadorConjurosTexto}>
              ({conjurosFiltrados.length} {conjurosFiltrados.length === 1 ? "conjuro" : "conjuros"})
            </span>
          </div>
          {personajes.length > 1 && (
            <div className="u-flex u-alinear-centro u-gap-md">
              <User size={13} color="#94a3b8" />
              <SelectorDesplegable<string>
                valor={personajeActivo?.id || ""}
                alCambiar={(id) => seleccionarPersonajeActivo(id)}
                tamano="compacto"
                opciones={personajes.map((p: PersonajeJugador) => ({
                  valor: p.id,
                  etiqueta: `${p.nombre} (${p.clase || "PJ"})`
                }))}
              />
            </div>
          )}
        </div>

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

        <div className={estilos.filaPestañasYFiltro}>
          <div className={estilos.grupoPestañas}>
            {/* 1. Preparados: oculto para clases de conocidos */}
            {!esModeloConocidos && (
              <button
                type="button"
                onClick={() => setPestañaActiva("preparados")}
                className={`${estilos.botonPestaña} ${
                  pestañaActiva === "preparados" ? estilos.botonPestañaActiva : ""
                }`}
              >
                <Star size={13} fill={pestañaActiva === "preparados" ? "#fb923c" : "none"} />
                <span>Preparados</span>
              </button>
            )}

            {/* 2. Mi lista / Libro de conjuros / Conocidos: oculto para preparadores divinos puros */}
            {!esPreparadorDivino && (
              <button
                type="button"
                onClick={() => setPestañaActiva("miLista")}
                className={`${estilos.botonPestaña} ${
                  pestañaActiva === "miLista" ? estilos.botonPestañaActiva : ""
                }`}
              >
                {esMago ? (
                  <BookMarked size={13} />
                ) : esModeloConocidos ? (
                  <Sparkles size={13} />
                ) : (
                  <CheckSquare size={13} />
                )}
                <span>
                  {esMago ? "Libro de conjuros" : esModeloConocidos ? "Conocidos" : "Mi lista"}
                </span>
              </button>
            )}

            {/* 3. Disponibles */}
            <button
              type="button"
              onClick={() => setPestañaActiva("disponibles")}
              className={`${estilos.botonPestaña} ${
                pestañaActiva === "disponibles" ? estilos.botonPestañaActiva : ""
              }`}
            >
              <BookOpen size={13} />
              <span>Disponibles</span>
            </button>

            {/* 4. Todos */}
            <button
              type="button"
              onClick={() => setPestañaActiva("todos")}
              className={`${estilos.botonPestaña} ${
                pestañaActiva === "todos" ? estilos.botonPestañaActiva : ""
              }`}
            >
              <Globe size={13} />
              <span>Todos</span>
            </button>
          </div>

          {/* Botón de Filtros */}
          <button
            type="button"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`${estilos.botonFiltrar} ${
              mostrarFiltros ? estilos.botonFiltrarActivo : ""
            }`}
          >
            <Filter size={12} />
            <span>Filtrar</span>
          </button>
        </div>
      </div>

      {/* Panel Desplegable de Filtros */}
      {mostrarFiltros && (
        <div className={estilos.panelFiltros}>
          <div className={estilos.contenedorBuscadorFiltro}>
            <Search size={13} color="#94a3b8" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, efecto, escuela..."
              className={estilos.buscadorInput}
            />
          </div>

          <div className={estilos.selectorNivelWrapper}>
            <SelectorDesplegable<string>
              valor={String(nivelFiltro)}
              alCambiar={(v) => setNivelFiltro(v === "todos" ? "todos" : Number(v))}
              tamano="compacto"
              opciones={OPCIONES_NIVEL_FILTRO}
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

      {/* Lista de Filas de Conjuro */}
      <div className={estilos.areaLista}>
        {conjurosFiltrados.length === 0 ? (
          <div className={estilos.mensajeVacio}>
            {pestañaActiva === "preparados" && "No tienes conjuros preparados actualmente."}
            {pestañaActiva === "miLista" && (
              esModeloConocidos
                ? "No tienes conjuros conocidos actualmente. Explora las pestañas 'Disponibles' o 'Todos' para aprenderlos."
                : esMago
                ? "No tienes conjuros inscritos en tu libro de conjuros. Explora las pestañas 'Disponibles' o 'Todos' para añadirlos."
                : "No tienes conjuros añadidos a tu lista. Explora las pestañas 'Disponibles' o 'Todos' para agregarlos."
            )}
            {pestañaActiva === "disponibles" && "No se encontraron conjuros disponibles para tu clase con los filtros seleccionados."}
            {pestañaActiva === "todos" && "No se encontraron conjuros en el compendio con los filtros seleccionados."}
          </div>
        ) : (
          conjurosFiltrados.map((hechizo) => {
            const esSubclase = esHechizoDeSubclase(hechizo);
            const origenBadge = obtenerOrigenConjuro(hechizo);
            const enLista = estaEnLista(hechizo);
            const preparado = estaPreparado(hechizo);
            const mostrarEstrella =
              !esModeloConocidos &&
              (esPreparadorDivino || pestañaActiva === "miLista" || pestañaActiva === "preparados");

            return (
              <FilaConjuroCompendio
                key={hechizo.id}
                hechizo={hechizo}
                estaEnLista={enLista}
                estaPreparado={preparado}
                esDeSubclase={esSubclase}
                origenBadge={origenBadge}
                requierePreparacion={requierePreparacion}
                esModeloConocidos={esModeloConocidos}
                mostrarEstrella={mostrarEstrella}
                alAlternarEnLista={() => manejarAlternarEnLista(hechizo)}
                alAlternarPreparado={() => manejarAlternarPreparado(hechizo)}
                alAbrirDetalle={(h) => setHechizoModal(h)}
              />
            );
          })
        )}
      </div>

      {/* Modal de FichaHechizo Completa */}
      {hechizoModal && (
        <div
          className={estilos.modalOverlay}
          onClick={() => setHechizoModal(null)}
        >
          <div
            className={estilos.modalContenido}
            onClick={(e) => e.stopPropagation()}
          >
            <FichaHechizo
              hechizo={hechizoModal}
              nombrePersonaje={personajeActivo?.nombre || "Personaje"}
              nivelPersonaje={personajeActivo?.nivel || 1}
              bonoAtaqueMagico={0}
              esLanzadorPacto={(personajeActivo?.espaciosPactoMaximos || 0) > 0 || (personajeActivo?.clasesLanzadoras || []).some((c) => c.tipoLanzador === "pacto")}
              nivelEspacioPacto={personajeActivo?.nivelEspacioPacto || 0}
              espaciosPactoMaximos={personajeActivo?.espaciosPactoMaximos || 0}
              espaciosConjuroMaximos={personajeActivo?.espaciosConjuroMaximos || {}}
              nivelConjuroMaximo={personajeActivo?.nivelConjuroMaximo || 0}
              ocultarLanzamiento={true}
              onClose={() => setHechizoModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
