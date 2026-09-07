import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Zap,
  BookOpen,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  EyeOff
} from "lucide-react";
import type {
  PersonajeJugador,
  Caracteristica,
  HechizoBase
} from "@/tipos";
import type { PenalizacionArmadura } from "@/almacen/selectores/usarEstadoPersonajes";
import { obtenerConjurosSubclasePersonaje } from "@/servicios/calculadorMagia";
import { usarAccionesConfiguracion } from "@/almacen/selectores/usarEstadoConfiguracion";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { usarMagiaPersonaje } from "@/hooks/usarMagiaPersonaje";
import { usarLanzadorConjuros } from "@/hooks/usarLanzadorConjuros";
import { usarEstadoPersistido } from "@/hooks";
import {
  evaluarFiltrosHechizo,
  type FiltroComponentesConjuro
} from "@/utiles/filtrosConjuros";
import { TarjetasMetricasMagia } from "./TarjetasMetricasMagia";
import { TrackerEspaciosConjuro } from "./TrackerEspaciosConjuro";
import { TrackerEspaciosPacto } from "./TrackerEspaciosPacto";
import { TrackerPuntosConjuro } from "./TrackerPuntosConjuro";
import { TarjetaConjuroCompacta } from "./TarjetaConjuroCompacta";
import { SeccionArcanoMistico } from "./SeccionArcanoMistico";
import { FichaHechizo } from "@/componentes/caracteristicas/compendio/FichaHechizo";
import { BannerConcentracionActiva } from "./BannerConcentracionActiva";
import { BarraFiltrosConjuros } from "./BarraFiltrosConjuros";
import { SeccionNivelConjuros } from "./SeccionNivelConjuros";
import estilos from "./PanelConjurosPersonaje.module.css";

interface PanelConjurosPersonajeProps {
  personaje: PersonajeJugador;
  bonoCompetencia: number;
  modificadores: Record<Caracteristica, number>;
  baseDatosHechizos: HechizoBase[];
  sistemaMagia: "espacios" | "puntos";
  penalizacionArmadura?: PenalizacionArmadura;
  alAbrirConfiguracion?: () => void;
  alGastarEspacio: (nivel: number) => void;
  alRecuperarEspacio: (nivel: number) => void;
  alRecuperarTodosEspacios: () => void;
  alGastarPuntos: (cantidad: number) => void;
  alRecuperarPuntos: (cantidad: number) => void;
  alRecuperarTodosPuntos: () => void;
  alGastarEspacioPacto?: () => void;
  alRecuperarEspaciosPacto?: () => void;
  alEstablecerConcentracion: (id: string, nombre: string) => void;
  alRomperConcentracion: () => void;
  alQuitarTruco: (hechizoId: string) => void;
  alQuitarConjuro: (hechizoId: string) => void;
  alAlternarPreparado: (hechizoId: string) => void;
}

export const PanelConjurosPersonaje: React.FC<PanelConjurosPersonajeProps> = ({
  personaje,
  bonoCompetencia,
  modificadores,
  baseDatosHechizos,
  sistemaMagia,
  penalizacionArmadura,
  alAbrirConfiguracion,
  alGastarEspacio,
  alRecuperarEspacio,
  alRecuperarTodosEspacios,
  alGastarPuntos,
  alRecuperarPuntos,
  alRecuperarTodosPuntos,
  alGastarEspacioPacto,
  alRecuperarEspaciosPacto,
  alEstablecerConcentracion: _alEstablecerConcentracion,
  alRomperConcentracion,
  alQuitarTruco,
  alQuitarConjuro,
  alAlternarPreparado
}) => {
  const [hechizoModal, setHechizoModal] = useState<HechizoBase | null>(null);

  // Estados para filtros avanzados de conjuros
  const [busqueda, setBusqueda] = useState<string>("");
  const [mostrarFiltros, setMostrarFiltros] = useState<boolean>(false);
  const [filtroConcentracion, setFiltroConcentracion] = useState<"todos" | "sin" | "con">("todos");
  const [filtroResolucion, setFiltroResolucion] = useState<"todos" | "ataque" | "salvacion" | "utilidad">("todos");
  const [filtroComponentes, setFiltroComponentes] = useState<FiltroComponentesConjuro>({
    sinV: false,
    sinS: false,
    sinM: false,
    soloM: false
  });

  // Estado persistente para secciones colapsables por nivel de magia
  const claveSeccionesPj = `ts_conjuros_secciones_${personaje.id || "default"}`;
  const [seccionesAbiertas, setSeccionesAbiertas] = usarEstadoPersistido<Record<string, boolean>>(
    claveSeccionesPj,
    {
      trucos: true,
      nv_1: true,
      nv_2: true,
      nv_3: true,
      nv_4: true,
      nv_5: true,
      nv_6: true,
      nv_7: true,
      nv_8: true,
      nv_9: true,
      ocultos: true
    }
  );

  // Estado persistente para IDs de conjuros ocultados por el jugador
  const claveOcultosPj = `ts_conjuros_ocultos_${personaje.id || "default"}`;
  const [conjurosOcultosIds, setConjurosOcultosIds] = usarEstadoPersistido<string[]>(
    claveOcultosPj,
    []
  );

  const alternarOculto = (hechizoId: string) => {
    setConjurosOcultosIds((prev) =>
      prev.includes(hechizoId) ? prev.filter((id) => id !== hechizoId) : [...prev, hechizoId]
    );
  };

  const desocultarTodos = () => {
    setConjurosOcultosIds([]);
  };

  const conjurosOcultosSet = useMemo(() => new Set(conjurosOcultosIds), [conjurosOcultosIds]);

  const alternarSeccion = (clave: string) => {
    setSeccionesAbiertas((prev) => ({
      ...prev,
      [clave]: !prev[clave]
    }));
  };

  const alternarTodasLasSecciones = (abrir: boolean) => {
    setSeccionesAbiertas({
      trucos: abrir,
      nv_1: abrir,
      nv_2: abrir,
      nv_3: abrir,
      nv_4: abrir,
      nv_5: abrir,
      nv_6: abrir,
      nv_7: abrir,
      nv_8: abrir,
      nv_9: abrir,
      ocultos: abrir
    });
  };

  const {
    asignarArcanoMistico,
    quitarArcanoMistico,
    gastarArcanoMistico,
    recuperarArcanoMistico,
    sincronizarConjurosSubclase
  } = usarAlmacenDM();

  // Auto-sincronización reactiva si el personaje tiene subclase y sus conjuros no están listos
  React.useEffect(() => {
    if (
      (!personaje.conjurosSiemprePreparadosIds || personaje.conjurosSiemprePreparadosIds.length === 0) &&
      (personaje.clase || (personaje.clases && personaje.clases.length > 0))
    ) {
      const res = obtenerConjurosSubclasePersonaje(
        personaje.clases,
        personaje.clase,
        personaje.subclase,
        personaje.nivel
      );
      if (res.conjuros.length > 0 || res.trucos.length > 0) {
        sincronizarConjurosSubclase(personaje.id);
      }
    }
  }, [
    personaje.id,
    personaje.clases,
    personaje.clase,
    personaje.subclase,
    personaje.nivel,
    personaje.conjurosSiemprePreparadosIds,
    sincronizarConjurosSubclase
  ]);

  // Hook universal de magia del personaje
  const {
    etiquetaHabilidad,
    modHabilidad,
    cdConjuros,
    bonoAtaqueMagico,
    requierePreparacion,
    esLanzadorPacto,
    nivelEspacioPacto,
    nivelesArcanoDisponibles,
    esHechizoDeSubclase,
    estaPreparado,
    maximos,
    conteoEfectivo,
    conjurosPorNivel,
    trucosConocidos
  } = usarMagiaPersonaje(personaje, baseDatosHechizos, modificadores, bonoCompetencia);

  const { establecerPestaña } = usarAccionesConfiguracion();

  // Hook centralizado de lanzamiento de magia
  const { puedeLanzar, motivoBloqueo, lanzar } = usarLanzadorConjuros({
    personaje,
    penalizacionArmadura,
    bonoAtaqueMagico,
    sistemaMagia
  });

  const estaBloqueadoPorArmadura = !puedeLanzar;
  const motivoBloqueoArmadura = motivoBloqueo;

  const manejarTiradaAtaqueMagico = async () => {
    if (!puedeLanzar) return;
    await lanzar({
      modo: "ataqueMagico",
      hechizo: {
        id: "ataque-magico",
        nombre: "Ataque Mágico",
        nivel: 0,
        escuela: "Evocacion",
        tiempoLanzamiento: "1 Accion",
        alcance: "Personal",
        componentes: "V",
        duracion: "Instantaneo",
        concentracion: false,
        ritual: false,
        descripcion: "Tirada genérica de ataque de conjuro."
      }
    });
  };

  // Conteo de filtros activos
  const conteoFiltrosActivos = useMemo(() => {
    let conteo = 0;
    if (busqueda.trim()) conteo++;
    if (filtroConcentracion !== "todos") conteo++;
    if (filtroResolucion !== "todos") conteo++;
    if (filtroComponentes.sinV) conteo++;
    if (filtroComponentes.sinS) conteo++;
    if (filtroComponentes.sinM) conteo++;
    if (filtroComponentes.soloM) conteo++;
    return conteo;
  }, [busqueda, filtroConcentracion, filtroResolucion, filtroComponentes]);

  const hayFiltrosActivos = conteoFiltrosActivos > 0;

  const limpiarTodosLosFiltros = () => {
    setBusqueda("");
    setFiltroConcentracion("todos");
    setFiltroResolucion("todos");
    setFiltroComponentes({ sinV: false, sinS: false, sinM: false, soloM: false });
  };

  // Trucos visibles y ocultos
  const trucosVisibles = useMemo(() => {
    return trucosConocidos.filter((t) => !conjurosOcultosSet.has(t.id));
  }, [trucosConocidos, conjurosOcultosSet]);

  const trucosOcultos = useMemo(() => {
    return trucosConocidos.filter((t) => conjurosOcultosSet.has(t.id));
  }, [trucosConocidos, conjurosOcultosSet]);

  const trucosFiltrados = useMemo(() => {
    return trucosVisibles.filter((truco) =>
      evaluarFiltrosHechizo(truco, busqueda, filtroConcentracion, filtroResolucion, filtroComponentes)
    );
  }, [trucosVisibles, busqueda, filtroConcentracion, filtroResolucion, filtroComponentes]);

  // Conjuros de nivel 1 a 9 visibles vs ocultos
  const { conjurosVisiblesPorNivel, todosConjurosOcultos } = useMemo(() => {
    const visibles: Record<number, HechizoBase[]> = {};
    const ocultos: HechizoBase[] = [...trucosOcultos];

    for (let nivel = 1; nivel <= 9; nivel++) {
      const lista = conjurosPorNivel[nivel] || [];
      const vis: HechizoBase[] = [];
      for (const h of lista) {
        if (conjurosOcultosSet.has(h.id)) {
          ocultos.push(h);
        } else {
          vis.push(h);
        }
      }
      visibles[nivel] = vis;
    }

    ocultos.sort((a, b) => {
      if (a.nivel !== b.nivel) return a.nivel - b.nivel;
      return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
    });

    return { conjurosVisiblesPorNivel: visibles, todosConjurosOcultos: ocultos };
  }, [conjurosPorNivel, trucosOcultos, conjurosOcultosSet]);

  // Filtrar conjuros visibles por nivel
  const conjurosFiltradosPorNivel = useMemo(() => {
    const res: Record<number, HechizoBase[]> = {};
    for (let nivel = 1; nivel <= 9; nivel++) {
      const lista = conjurosVisiblesPorNivel[nivel] || [];
      res[nivel] = lista.filter((h) =>
        evaluarFiltrosHechizo(h, busqueda, filtroConcentracion, filtroResolucion, filtroComponentes)
      );
    }
    return res;
  }, [conjurosVisiblesPorNivel, busqueda, filtroConcentracion, filtroResolucion, filtroComponentes]);

  // Filtrar conjuros ocultos
  const conjurosOcultosFiltrados = useMemo(() => {
    return todosConjurosOcultos.filter((h) =>
      evaluarFiltrosHechizo(h, busqueda, filtroConcentracion, filtroResolucion, filtroComponentes)
    );
  }, [todosConjurosOcultos, busqueda, filtroConcentracion, filtroResolucion, filtroComponentes]);

  return (
    <div className={estilos.contenedor}>
      {/* Banner de Bloqueo por Armadura sin Competencia */}
      {estaBloqueadoPorArmadura && (
        <div className={estilos.bannerBloqueoMagia}>
          <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
          <div>
            <strong>Lanzamiento de Conjuros Bloqueado:</strong>
            {" "}Vistes {penalizacionArmadura?.armaduraNoCompetente || penalizacionArmadura?.escudoNoCompetente} sin competencia.
            {" "}Las reglas impiden lanzar conjuros y rituales bajo esta condición.
          </div>
        </div>
      )}

      {/* Banner de Concentración Activa */}
      {personaje.concentracionActiva && (
        <BannerConcentracionActiva
          nombreHechizo={personaje.concentracionActiva.nombreHechizo}
          alRomperConcentracion={alRomperConcentracion}
        />
      )}

      {/* Tarjetas de Estadísticas Mágicas */}
      <div className={estilos.gridEstadisticas}>
        <div className={estilos.tarjetaEstadistica}>
          <span className={estilos.estadisticaEtiqueta}>Habilidad</span>
          <div className={estilos.estadisticaFilaValor}>
            <span className={estilos.estadisticaHabilidad}>{etiquetaHabilidad}</span>
            <span className={estilos.estadisticaModificador}>{modHabilidad >= 0 ? `+${modHabilidad}` : modHabilidad}</span>
          </div>
        </div>

        <div className={estilos.tarjetaEstadistica}>
          <span className={estilos.estadisticaEtiqueta}>CD Salvación</span>
          <span className={estilos.estadisticaNumeroMono}>{cdConjuros}</span>
        </div>

        <div
          onClick={manejarTiradaAtaqueMagico}
          title={estaBloqueadoPorArmadura ? (motivoBloqueoArmadura || "Bloqueado por armadura sin competencia") : "Haz clic para tirar Ataque Mágico en TaleSpire"}
          className={`${estilos.tarjetaAtaqueMagico} ${estaBloqueadoPorArmadura ? estilos.tarjetaAtaqueMagicoBloqueada : ""}`}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {estaBloqueadoPorArmadura ? (
              <AlertTriangle size={11} color="#ef4444" />
            ) : (
              <Zap size={11} color="#a78bfa" />
            )}
            <span
              className={estaBloqueadoPorArmadura ? undefined : estilos.estadisticaEtiquetaMorada}
              style={estaBloqueadoPorArmadura ? { color: "#f87171", fontSize: 10, fontWeight: 700, textTransform: "uppercase" } : undefined}
            >
              Ataque Mágico
            </span>
          </div>
          <span
            className={estaBloqueadoPorArmadura ? undefined : estilos.estadisticaNumeroMorado}
            style={estaBloqueadoPorArmadura ? { color: "#fca5a5", fontSize: 18, fontWeight: 800 } : undefined}
          >
            {bonoAtaqueMagico >= 0 ? `+${bonoAtaqueMagico}` : bonoAtaqueMagico}
          </span>
        </div>
      </div>

      {/* Tarjetas de Conjuros y Trucos Máximos */}
      <TarjetasMetricasMagia
        conteoConjurosLibres={conteoEfectivo.libres}
        conteoConjurosSubclase={conteoEfectivo.subclase}
        maxConjuros={maximos.maxConjuros}
        conteoTrucosLibres={conteoEfectivo.trucosLibres}
        conteoTrucosSubclase={conteoEfectivo.trucosSubclase}
        maxTrucos={maximos.maxTrucos}
        modelo={maximos.modelo}
      />

      {/* Barra de Acciones Rápidas */}
      <div className={estilos.barraAccionesRapidas}>
        <button
          type="button"
          onClick={() => establecerPestaña("compendio")}
          className={estilos.botonCompendio}
        >
          <BookOpen size={13} />
          <span>Compendio de Conjuros</span>
        </button>

        {alAbrirConfiguracion && (
          <button
            type="button"
            onClick={alAbrirConfiguracion}
            className={estilos.botonEnlaceAjustes}
          >
            Ajustar Clases y Magia
          </button>
        )}
      </div>

      {/* Trackers de Recursos Mágicos */}
      {(() => {
        const tieneEspaciosEstandar = Object.values(personaje.espaciosConjuroMaximos || {}).some(
          (v) => (v || 0) > 0
        );
        const tienePuntosEstandar = (personaje.puntosConjuroMaximos || 0) > 0;
        const tieneMagiaEstandar =
          sistemaMagia === "puntos" ? tienePuntosEstandar : tieneEspaciosEstandar;
        const tienePacto = (personaje.espaciosPactoMaximos || 0) > 0 || esLanzadorPacto;

        return (
          <div className={estilos.contenedorTrackers}>
            {tieneMagiaEstandar &&
              (sistemaMagia === "puntos" ? (
                <TrackerPuntosConjuro
                  puntosMaximos={personaje.puntosConjuroMaximos || 0}
                  puntosGastados={personaje.puntosConjuroGastados || 0}
                  nivelMaximo={personaje.nivelConjuroMaximo || 0}
                  alGastarPuntos={alGastarPuntos}
                  alRecuperarPuntos={alRecuperarPuntos}
                  alRecuperarTodosPuntos={alRecuperarTodosPuntos}
                />
              ) : (
                <TrackerEspaciosConjuro
                  espaciosMaximos={personaje.espaciosConjuroMaximos || {}}
                  espaciosGastados={personaje.espaciosConjuroGastados || {}}
                  alGastarEspacio={alGastarEspacio}
                  alRecuperarEspacio={alRecuperarEspacio}
                  alRecuperarTodosEspacios={alRecuperarTodosEspacios}
                />
              ))}

            {tienePacto && (
              <TrackerEspaciosPacto
                espaciosPactoMaximos={personaje.espaciosPactoMaximos || 0}
                espaciosPactoGastados={personaje.espaciosPactoGastados || 0}
                nivelEspacioPacto={personaje.nivelEspacioPacto || 1}
                alGastarEspacioPacto={alGastarEspacioPacto}
                alRecuperarEspaciosPacto={alRecuperarEspaciosPacto}
              />
            )}

            {nivelesArcanoDisponibles.length > 0 && (
              <SeccionArcanoMistico
                arcanoMisticoIds={personaje.arcanoMisticoIds || []}
                arcanoMisticoGastados={personaje.arcanoMisticoGastados || []}
                nivelesDisponibles={nivelesArcanoDisponibles}
                baseDatosHechizos={baseDatosHechizos}
                nombrePersonaje={personaje.nombre}
                bonoAtaqueMagico={bonoAtaqueMagico}
                cdConjuros={cdConjuros}
                bloqueadoPorArmadura={estaBloqueadoPorArmadura}
                motivoBloqueoArmadura={motivoBloqueoArmadura}
                alAsignarArcano={(nivel, hechizoId) => asignarArcanoMistico(personaje.id, nivel, hechizoId)}
                alQuitarArcano={(nivel) => quitarArcanoMistico(personaje.id, nivel)}
                alGastarArcano={(nivel) => gastarArcanoMistico(personaje.id, nivel)}
                alRecuperarArcano={(nivel) => recuperarArcanoMistico(personaje.id, nivel)}
                alAbrirFichaHechizo={(h) => setHechizoModal(h)}
                alLanzar={(sol) => lanzar(sol)}
              />
            )}

            {!tieneMagiaEstandar && !tienePacto && nivelesArcanoDisponibles.length === 0 && (
              <div className={estilos.alertaSinRecursos}>
                No hay recursos de magia configurados. Configura tu clase lanzadora en los ajustes del personaje.
              </div>
            )}
          </div>
        );
      })()}

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

      {/* Sección: Trucos Listos */}
      <SeccionNivelConjuros
        titulo="Trucos Listos"
        icono={<Sparkles size={14} color="#a78bfa" />}
        nivel={0}
        esTruco={true}
        conjurosVisibles={trucosVisibles}
        conjurosFiltrados={trucosFiltrados}
        estaAbierta={seccionesAbiertas.trucos !== false}
        alAlternar={() => alternarSeccion("trucos")}
        hayFiltrosActivos={hayFiltrosActivos}
        personaje={personaje}
        bonoAtaqueMagico={bonoAtaqueMagico}
        estaPreparado={() => true}
        esHechizoDeSubclase={esHechizoDeSubclase}
        requierePreparacion={false}
        esLanzadorPacto={esLanzadorPacto}
        nivelEspacioPacto={nivelEspacioPacto}
        sistemaMagia={sistemaMagia}
        estaBloqueadoPorArmadura={estaBloqueadoPorArmadura}
        motivoBloqueoArmadura={motivoBloqueoArmadura}
        alAlternarOcultar={alternarOculto}
        alQuitarDeLista={alQuitarTruco}
        alAbrirDetalleCompleto={(h) => setHechizoModal(h)}
        alLanzar={(modo, niv, hechizo) => {
          if (hechizo) return lanzar({ modo, hechizo, nivelLanzamiento: niv });
          return Promise.resolve(false);
        }}
        alAnadirTrucos={() => establecerPestaña("compendio")}
        totalTrucosConocidos={trucosConocidos.length}
      />

      {/* Estado Vacío de Conjuros */}
      {conteoEfectivo.total === 0 && (
        <div className={estilos.tarjetaVaciaConjuros}>
          <BookOpen size={24} color="#94a3b8" />
          <span className={estilos.tituloVacioConjuros}>
            {requierePreparacion
              ? "No tienes conjuros preparados para el día"
              : "No tienes conjuros en tu lista"}
          </span>
          <p className={estilos.descripcionVacioConjuros}>
            {requierePreparacion
              ? "Accede al Compendio de Conjuros para revisar tu repertorio o grimorio y preparar tus hechizos con la estrella."
              : "Accede al Compendio de Conjuros para añadir hechizos a tu lista de conocidos."}
          </p>
          <button
            type="button"
            onClick={() => establecerPestaña("compendio")}
            className={estilos.botonIrCompendio}
          >
            <BookOpen size={14} />
            <span>Ir al Compendio de Conjuros</span>
          </button>
        </div>
      )}

      {/* Secciones por Nivel de Conjuro (1 a 9) */}
      {Array.from({ length: 9 }).map((_, idx) => {
        const nivel = idx + 1;
        const conjurosNivelTotal = conjurosPorNivel[nivel] || [];
        if (conjurosNivelTotal.length === 0) return null;

        const conjurosNivelVisiblesBase = conjurosVisiblesPorNivel[nivel] || [];
        if (conjurosNivelVisiblesBase.length === 0) return null;

        const conjurosNivelVisibles = conjurosFiltradosPorNivel[nivel] || [];

        return (
          <SeccionNivelConjuros
            key={`seccion-nv-${nivel}`}
            titulo={`Nivel ${nivel}`}
            nivel={nivel}
            esTruco={false}
            conjurosVisibles={conjurosNivelVisiblesBase}
            conjurosFiltrados={conjurosNivelVisibles}
            estaAbierta={seccionesAbiertas[`nv_${nivel}`] !== false}
            alAlternar={() => alternarSeccion(`nv_${nivel}`)}
            hayFiltrosActivos={hayFiltrosActivos}
            personaje={personaje}
            bonoAtaqueMagico={bonoAtaqueMagico}
            estaPreparado={estaPreparado}
            esHechizoDeSubclase={esHechizoDeSubclase}
            requierePreparacion={requierePreparacion}
            esLanzadorPacto={esLanzadorPacto}
            nivelEspacioPacto={nivelEspacioPacto}
            sistemaMagia={sistemaMagia}
            estaBloqueadoPorArmadura={estaBloqueadoPorArmadura}
            motivoBloqueoArmadura={motivoBloqueoArmadura}
            alAlternarOcultar={alternarOculto}
            alAlternarPreparado={alAlternarPreparado}
            alQuitarDeLista={alQuitarConjuro}
            alAbrirDetalleCompleto={(h) => setHechizoModal(h)}
            alLanzar={(modo, niv, hechizo) => {
              if (hechizo) return lanzar({ modo, hechizo, nivelLanzamiento: niv });
              return Promise.resolve(false);
            }}
          />
        );
      })}

      {/* Sección: Conjuros Ocultos */}
      {todosConjurosOcultos.length > 0 && (
        <div className={estilos.seccionOcultos}>
          <div
            className={estilos.cabeceraNivelInteractiva}
            onClick={() => alternarSeccion("ocultos")}
            role="button"
            tabIndex={0}
            title={`Clic para ${seccionesAbiertas.ocultos !== false ? "colapsar" : "expandir"} conjuros ocultos`}
          >
            <div className={estilos.tituloNivelFila}>
              <EyeOff size={14} color="#94a3b8" />
              <span className={estilos.tituloOcultosTexto}>Conjuros Ocultos</span>
              <span className={estilos.badgeConteoOcultos}>
                {hayFiltrosActivos
                  ? `${conjurosOcultosFiltrados.length} / ${todosConjurosOcultos.length}`
                  : todosConjurosOcultos.length}
              </span>
            </div>
            <div className={estilos.ladoDerechoCabeceraNivel}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  desocultarTodos();
                }}
                className={estilos.botonDesocultarTodos}
                title="Mostrar y devolver todos los conjuros a sus niveles correspondientes"
              >
                Mostrar todos
              </button>
              {seccionesAbiertas.ocultos !== false ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          </div>

          {seccionesAbiertas.ocultos !== false && (
            <>
              {conjurosOcultosFiltrados.length === 0 ? (
                <p className={estilos.alertaFiltroVacioNivel}>
                  Ningún conjuro oculto coincide con los filtros aplicados.
                </p>
              ) : (
                <div className={estilos.listaTarjetas}>
                  {conjurosOcultosFiltrados.map((hechizo) => {
                    const esTruco = hechizo.nivel === 0;
                    return (
                      <TarjetaConjuroCompacta
                        key={`oculto-${hechizo.id}`}
                        hechizo={hechizo}
                        nombrePersonaje={personaje.nombre}
                        nivelPersonaje={personaje.nivel || 1}
                        bonoAtaqueMagico={bonoAtaqueMagico}
                        estaPreparado={esTruco ? true : estaPreparado(hechizo)}
                        esDeSubclase={esHechizoDeSubclase(hechizo)}
                        mostrarTogglePreparado={!esTruco && requierePreparacion}
                        esConcentracionActual={personaje.concentracionActiva?.hechizoId === hechizo.id}
                        esOculto={true}
                        alAlternarOcultar={() => alternarOculto(hechizo.id)}
                        bloqueadoPorArmadura={estaBloqueadoPorArmadura}
                        motivoBloqueoArmadura={motivoBloqueoArmadura}
                        alAlternarPreparado={esTruco ? undefined : () => alAlternarPreparado(hechizo.id)}
                        alQuitarDeLista={() => esTruco ? alQuitarTruco(hechizo.id) : alQuitarConjuro(hechizo.id)}
                        alAbrirDetalleCompleto={(h) => setHechizoModal(h)}
                        alLanzar={(modo, niv) => lanzar({ modo, hechizo, nivelLanzamiento: niv })}
                        esLanzadorPacto={esLanzadorPacto}
                        nivelEspacioPacto={nivelEspacioPacto}
                        espaciosPactoMaximos={personaje.espaciosPactoMaximos || 0}
                        espaciosPactoGastados={personaje.espaciosPactoGastados || 0}
                        espaciosConjuroMaximos={personaje.espaciosConjuroMaximos || {}}
                        nivelConjuroMaximo={personaje.nivelConjuroMaximo || 0}
                        sistemaMagia={sistemaMagia}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal Ficha Completa */}
      {hechizoModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
          onClick={() => setHechizoModal(null)}
        >
          <div
            style={{
              maxWidth: 550,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              backgroundColor: "#161b22",
              borderRadius: 8
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <FichaHechizo
              hechizo={hechizoModal}
              nombrePersonaje={personaje.nombre}
              nivelPersonaje={personaje.nivel || 1}
              bonoAtaqueMagico={bonoAtaqueMagico}
              esLanzadorPacto={esLanzadorPacto}
              nivelEspacioPacto={nivelEspacioPacto}
              espaciosPactoMaximos={personaje.espaciosPactoMaximos || 0}
              espaciosConjuroMaximos={personaje.espaciosConjuroMaximos || {}}
              nivelConjuroMaximo={personaje.nivelConjuroMaximo || 0}
              sistemaMagia={sistemaMagia}
              bloqueadoPorArmadura={estaBloqueadoPorArmadura}
              motivoBloqueoArmadura={motivoBloqueoArmadura}
              onClose={() => setHechizoModal(null)}
              alLanzar={async (modo, nivelLanzamiento) => {
                const exito = await lanzar({
                  modo,
                  hechizo: hechizoModal,
                  nivelLanzamiento
                });
                if (exito) {
                  setHechizoModal(null);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelConjurosPersonaje;
