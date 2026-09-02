import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Flame,
  Zap,
  BookOpen,
  AlertTriangle,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Shield
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
import { coincideBusquedaTolerante } from "@/utiles/busquedaTolerante";
import { TarjetasMetricasMagia } from "./TarjetasMetricasMagia";
import { TrackerEspaciosConjuro } from "./TrackerEspaciosConjuro";
import { TrackerEspaciosPacto } from "./TrackerEspaciosPacto";
import { TrackerPuntosConjuro } from "./TrackerPuntosConjuro";
import { TarjetaConjuroCompacta } from "./TarjetaConjuroCompacta";
import { SeccionArcanoMistico } from "./SeccionArcanoMistico";
import { FichaHechizo } from "@/componentes/caracteristicas/compendio/FichaHechizo";
import estilos from "./PanelConjurosPersonaje.module.css";

interface FiltroComponentesConjuro {
  sinV: boolean;
  sinS: boolean;
  sinM: boolean;
  soloM: boolean;
}

function tieneComponente(componentes: string | undefined, letra: "V" | "S" | "M"): boolean {
  if (!componentes) return false;
  const comp = componentes.toUpperCase();
  return comp.includes(letra);
}

function esConjuroAtaque(hechizo: HechizoBase): boolean {
  if (hechizo.requiereAtaque) return true;
  if (!hechizo.ataqueCd || hechizo.ataqueCd === "N/A" || hechizo.ataqueCd === "none") return false;
  const norm = hechizo.ataqueCd.toUpperCase();
  return norm.includes("ATAQUE") || norm.includes("ATTACK");
}

function esConjuroSalvacion(hechizo: HechizoBase): boolean {
  if (!hechizo.ataqueCd || hechizo.ataqueCd === "N/A" || hechizo.ataqueCd === "none") return false;
  const norm = hechizo.ataqueCd.toUpperCase();
  return norm.includes("SALVACI") || norm.includes("SAVE") || norm.includes("CD") || norm.includes("DC");
}

function esConjuroUtilidad(hechizo: HechizoBase): boolean {
  return !esConjuroAtaque(hechizo) && !esConjuroSalvacion(hechizo);
}

function evaluarFiltrosHechizo(
  hechizo: HechizoBase,
  busqueda: string,
  filtroConcentracion: "todos" | "sin" | "con",
  filtroResolucion: "todos" | "ataque" | "salvacion" | "utilidad",
  filtroComponentes: FiltroComponentesConjuro
): boolean {
  // 1. Filtro de búsqueda por texto
  if (busqueda.trim()) {
    const coincide =
      coincideBusquedaTolerante(hechizo.nombre, busqueda) ||
      coincideBusquedaTolerante(hechizo.descripcion, busqueda) ||
      coincideBusquedaTolerante(hechizo.escuela, busqueda);
    if (!coincide) return false;
  }

  // 2. Filtro de Concentración
  if (filtroConcentracion === "sin" && hechizo.concentracion) return false;
  if (filtroConcentracion === "con" && !hechizo.concentracion) return false;

  // 3. Filtro de Resolución (Ataque vs Salvación CD vs Utilidad)
  if (filtroResolucion === "ataque" && !esConjuroAtaque(hechizo)) return false;
  if (filtroResolucion === "salvacion" && !esConjuroSalvacion(hechizo)) return false;
  if (filtroResolucion === "utilidad" && !esConjuroUtilidad(hechizo)) return false;

  // 4. Filtro de Componentes
  if (filtroComponentes.sinV && tieneComponente(hechizo.componentes, "V")) return false;
  if (filtroComponentes.sinS && tieneComponente(hechizo.componentes, "S")) return false;
  if (filtroComponentes.sinM && tieneComponente(hechizo.componentes, "M")) return false;
  if (filtroComponentes.soloM && !tieneComponente(hechizo.componentes, "M")) return false;

  return true;
}

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
      nv_9: true
    }
  );

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
      nv_9: abrir
    });
  };

  const {
    asignarArcanoMistico,
    quitarArcanoMistico,
    gastarArcanoMistico,
    recuperarArcanoMistico,
    sincronizarConjurosSubclase
  } = usarAlmacenDM();

  // Auto-sincronización reactiva si el personaje tiene subclase y sus conjuros aún no están inicializados
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

  // Usar hook universal de magia del personaje (DRY)
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

  // Hook centralizado de lanzamiento de magia (Facade + Strategy)
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

  // Filtrar trucos
  const trucosFiltrados = useMemo(() => {
    return trucosConocidos.filter((truco) =>
      evaluarFiltrosHechizo(truco, busqueda, filtroConcentracion, filtroResolucion, filtroComponentes)
    );
  }, [trucosConocidos, busqueda, filtroConcentracion, filtroResolucion, filtroComponentes]);

  // Filtrar conjuros por nivel (1 a 9)
  const conjurosFiltradosPorNivel = useMemo(() => {
    const res: Record<number, HechizoBase[]> = {};
    for (let nivel = 1; nivel <= 9; nivel++) {
      const lista = conjurosPorNivel[nivel] || [];
      res[nivel] = lista.filter((h) =>
        evaluarFiltrosHechizo(h, busqueda, filtroConcentracion, filtroResolucion, filtroComponentes)
      );
    }
    return res;
  }, [conjurosPorNivel, busqueda, filtroConcentracion, filtroResolucion, filtroComponentes]);

  return (
    <div className={estilos.contenedor}>
      {/* Banner de Bloqueo por Armadura sin Competencia (Regla Oficial D&D 5.5e) */}
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

      {personaje.concentracionActiva && (
        <div className={estilos.alertaConcentracion}>
          <div className={estilos.concentracionIzquierda}>
            <Flame size={18} color="#ef4444" className={estilos.concentracionIcono} />
            <div className={estilos.concentracionTextos}>
              <span className={estilos.concentracionEtiqueta}>Concentración Activa</span>
              <span className={estilos.concentracionNombre}>{personaje.concentracionActiva.nombreHechizo}</span>
            </div>
          </div>
          <button type="button" onClick={alRomperConcentracion} className={estilos.botonRomperConcentracion}>Romper</button>
        </div>
      )}

      {/* Tarjetas de Estadísticas Mágicas (Habilidad, CD, Ataque Mágico) */}
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
            <span className={estaBloqueadoPorArmadura ? undefined : estilos.estadisticaEtiquetaMorada} style={estaBloqueadoPorArmadura ? { color: "#f87171", fontSize: 10, fontWeight: 700, textTransform: "uppercase" } : undefined}>
              Ataque Mágico
            </span>
          </div>
          <span className={estaBloqueadoPorArmadura ? undefined : estilos.estadisticaNumeroMorado} style={estaBloqueadoPorArmadura ? { color: "#fca5a5", fontSize: 18, fontWeight: 800 } : undefined}>
            {bonoAtaqueMagico >= 0 ? `+${bonoAtaqueMagico}` : bonoAtaqueMagico}
          </span>
        </div>
      </div>

      {/* Tarjetas de Conjuros y Trucos Máximos (Componente DRY) */}
      <TarjetasMetricasMagia
        conteoConjurosLibres={conteoEfectivo.libres}
        conteoConjurosSubclase={conteoEfectivo.subclase}
        maxConjuros={maximos.maxConjuros}
        conteoTrucosLibres={conteoEfectivo.trucosLibres}
        conteoTrucosSubclase={conteoEfectivo.trucosSubclase}
        maxTrucos={maximos.maxTrucos}
        modelo={maximos.modelo}
      />

      {/* Barra de Acciones Rápidas (Compendio de Conjuros + Ajustar Clases) */}
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
            {/* Magia Estándar: Puntos o Espacios de Conjuro */}
            {tieneMagiaEstandar && (
              sistemaMagia === "puntos" ? (
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
              )
            )}

            {/* Magia de Pacto (Brujo): SIEMPRE independiente del sistema de magia estándar */}
            {tienePacto && (
              <TrackerEspaciosPacto
                espaciosPactoMaximos={personaje.espaciosPactoMaximos || 0}
                espaciosPactoGastados={personaje.espaciosPactoGastados || 0}
                nivelEspacioPacto={personaje.nivelEspacioPacto || 1}
                alGastarEspacioPacto={alGastarEspacioPacto}
                alRecuperarEspaciosPacto={alRecuperarEspaciosPacto}
              />
            )}

            {/* Arcano Místico (Brujos Nivel 11+) */}
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

            {/* Sin recursos mágicos */}
            {!tieneMagiaEstandar && !tienePacto && nivelesArcanoDisponibles.length === 0 && (
              <div className={estilos.alertaSinRecursos}>
                No hay recursos de magia configurados. Configura tu clase lanzadora en los ajustes del personaje.
              </div>
            )}
          </div>
        );
      })()}

      {/* Barra de Búsqueda y Filtros Avanzados */}
      <div className={estilos.barraFiltrosConjuros}>
        <div className={estilos.filaPrincipalFiltros}>
          <div className={estilos.cajaBuscador}>
            <Search size={13} color="#94a3b8" />
            <input
              type="text"
              placeholder="Buscar por nombre, escuela o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={estilos.inputBuscador}
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className={estilos.botonLimpiarBusqueda}
                title="Borrar búsqueda"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`${estilos.botonToggleFiltros} ${
              mostrarFiltros || hayFiltrosActivos ? estilos.botonToggleFiltrosActivo : ""
            }`}
          >
            <Filter size={13} />
            <span>Filtros</span>
            {hayFiltrosActivos && (
              <span className={estilos.badgeFiltrosActivos}>{conteoFiltrosActivos}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => alternarTodasLasSecciones(true)}
            className={estilos.botonAccionRapidaSecciones}
            title="Expandir todos los niveles"
          >
            <ChevronsUpDown size={12} />
            <span>Expandir</span>
          </button>

          <button
            type="button"
            onClick={() => alternarTodasLasSecciones(false)}
            className={estilos.botonAccionRapidaSecciones}
            title="Colapsar todos los niveles"
          >
            <span>Colapsar</span>
          </button>
        </div>

        {mostrarFiltros && (
          <div className={estilos.panelFiltrosAvanzados}>
            {/* Filtro 1: Concentración */}
            <div className={estilos.filaGrupoFiltro}>
              <span className={estilos.etiquetaGrupoFiltro}>Concentración:</span>
              <div className={estilos.grupoChipsFiltro}>
                <button
                  type="button"
                  onClick={() => setFiltroConcentracion("todos")}
                  className={`${estilos.chipFiltro} ${
                    filtroConcentracion === "todos" ? estilos.chipFiltroActivo : ""
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroConcentracion("sin")}
                  className={`${estilos.chipFiltro} ${
                    filtroConcentracion === "sin" ? estilos.chipFiltroActivo : ""
                  }`}
                >
                  Sin Concentración
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroConcentracion("con")}
                  className={`${estilos.chipFiltro} ${
                    filtroConcentracion === "con" ? estilos.chipFiltroPeligroActivo : ""
                  }`}
                >
                  <Flame size={11} color={filtroConcentracion === "con" ? "#fca5a5" : "#ef4444"} />
                  Con Concentración
                </button>
              </div>
            </div>

            {/* Filtro 2: Tipo de Resolución (Ataque vs CD Salvación vs Utilidad) */}
            <div className={estilos.filaGrupoFiltro}>
              <span className={estilos.etiquetaGrupoFiltro}>Resolución:</span>
              <div className={estilos.grupoChipsFiltro}>
                <button
                  type="button"
                  onClick={() => setFiltroResolucion("todos")}
                  className={`${estilos.chipFiltro} ${
                    filtroResolucion === "todos" ? estilos.chipFiltroActivo : ""
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroResolucion("ataque")}
                  className={`${estilos.chipFiltro} ${
                    filtroResolucion === "ataque" ? estilos.chipFiltroActivo : ""
                  }`}
                >
                  <Zap size={11} color={filtroResolucion === "ataque" ? "#c4b5fd" : "#a78bfa"} />
                  Tirada de Ataque
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroResolucion("salvacion")}
                  className={`${estilos.chipFiltro} ${
                    filtroResolucion === "salvacion" ? estilos.chipFiltroActivo : ""
                  }`}
                >
                  <Shield size={11} color={filtroResolucion === "salvacion" ? "#bae6fd" : "#38bdf8"} />
                  Salvación (CD)
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroResolucion("utilidad")}
                  className={`${estilos.chipFiltro} ${
                    filtroResolucion === "utilidad" ? estilos.chipFiltroActivo : ""
                  }`}
                >
                  <Sparkles size={11} color={filtroResolucion === "utilidad" ? "#a7f3d0" : "#34d399"} />
                  Utilidad / Efecto
                </button>
              </div>
            </div>

            {/* Filtro 3: Componentes (V, S, M) */}
            <div className={estilos.filaGrupoFiltro}>
              <span className={estilos.etiquetaGrupoFiltro}>Componentes:</span>
              <div className={estilos.grupoChipsFiltro}>
                <button
                  type="button"
                  onClick={() =>
                    setFiltroComponentes((prev) => ({ ...prev, sinV: !prev.sinV }))
                  }
                  className={`${estilos.chipFiltro} ${
                    filtroComponentes.sinV ? estilos.chipFiltroActivo : ""
                  }`}
                  title="Ocultar hechizos que requieran componente Verbal (útil en Silencio / Sigilo)"
                >
                  Sin V (Verbal)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFiltroComponentes((prev) => ({ ...prev, sinS: !prev.sinS }))
                  }
                  className={`${estilos.chipFiltro} ${
                    filtroComponentes.sinS ? estilos.chipFiltroActivo : ""
                  }`}
                  title="Ocultar hechizos que requieran componente Somático (útil si estás atado o sin manos libres)"
                >
                  Sin S (Somático)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFiltroComponentes((prev) => ({ ...prev, sinM: !prev.sinM, soloM: false }))
                  }
                  className={`${estilos.chipFiltro} ${
                    filtroComponentes.sinM ? estilos.chipFiltroActivo : ""
                  }`}
                  title="Ocultar hechizos que requieran componente Material (útil si estás sin foco ni bolsa)"
                >
                  Sin M (Material)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFiltroComponentes((prev) => ({ ...prev, soloM: !prev.soloM, sinM: false }))
                  }
                  className={`${estilos.chipFiltro} ${
                    filtroComponentes.soloM ? estilos.chipFiltroActivo : ""
                  }`}
                  title="Mostrar únicamente hechizos que requieran componente Material"
                >
                  Requiere M
                </button>
              </div>
            </div>

            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarTodosLosFiltros}
                className={estilos.botonResetFiltros}
              >
                Limpiar todos los filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sección: Trucos Listos (Colapsable) */}
      <div className={estilos.seccionNivel}>
        <div
          className={estilos.cabeceraNivelInteractiva}
          onClick={() => alternarSeccion("trucos")}
          role="button"
          tabIndex={0}
          title={`Clic para ${seccionesAbiertas.trucos !== false ? "colapsar" : "expandir"} trucos`}
        >
          <div className={estilos.tituloNivelFila}>
            <Sparkles size={14} color="#a78bfa" />
            <span className={estilos.tituloNivelTexto}>Trucos Listos</span>
            <span className={estilos.badgeConteoNivel}>
              {hayFiltrosActivos
                ? `${trucosFiltrados.length} / ${trucosConocidos.length}`
                : trucosConocidos.length}
            </span>
          </div>
          <div className={estilos.ladoDerechoCabeceraNivel}>
            {trucosConocidos.length > 0 && (
              <span className={estilos.textoEscalado}>
                Escalado: Nivel {personaje.nivel || 1}
              </span>
            )}
            {seccionesAbiertas.trucos !== false ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </div>
        </div>

        {seccionesAbiertas.trucos !== false && (
          <>
            {trucosConocidos.length === 0 ? (
              <div className={estilos.filaVacioTrucos}>
                <p className={estilos.textoVacio}>No tienes trucos listos.</p>
                <button
                  type="button"
                  onClick={() => establecerPestaña("compendio")}
                  className={estilos.botonAnadirTrucos}
                >
                  <BookOpen size={11} />
                  Añadir Trucos
                </button>
              </div>
            ) : trucosFiltrados.length === 0 ? (
              <p className={estilos.alertaFiltroVacioNivel}>
                Ningún truco coincide con los filtros aplicados.
              </p>
            ) : (
              <div className={estilos.listaTarjetas}>
                {trucosFiltrados.map((truco) => (
                  <TarjetaConjuroCompacta
                    key={`truco-${truco.id}`}
                    hechizo={truco}
                    nombrePersonaje={personaje.nombre}
                    nivelPersonaje={personaje.nivel || 1}
                    bonoAtaqueMagico={bonoAtaqueMagico}
                    estaPreparado={true}
                    esDeSubclase={esHechizoDeSubclase(truco)}
                    mostrarTogglePreparado={false}
                    esConcentracionActual={personaje.concentracionActiva?.hechizoId === truco.id}
                    bloqueadoPorArmadura={estaBloqueadoPorArmadura}
                    motivoBloqueoArmadura={motivoBloqueoArmadura}
                    alQuitarDeLista={() => alQuitarTruco(truco.id)}
                    alAbrirDetalleCompleto={(h) => setHechizoModal(h)}
                    alLanzar={(modo, niv) => lanzar({ modo, hechizo: truco, nivelLanzamiento: niv })}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Estado Vacío de Conjuros de Nivel 1-9 */}
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

      {/* Secciones por Nivel de Conjuro (Colapsables) */}
      {Array.from({ length: 9 }).map((_, idx) => {
        const nivel = idx + 1;
        const conjurosNivelTotal = conjurosPorNivel[nivel] || [];
        if (conjurosNivelTotal.length === 0) return null;

        const conjurosNivelVisibles = conjurosFiltradosPorNivel[nivel] || [];
        const estaAbierta = seccionesAbiertas[`nv_${nivel}`] !== false;

        return (
          <div key={`seccion-nv-${nivel}`} className={estilos.seccionNivel}>
            <div
              className={estilos.cabeceraNivelInteractiva}
              onClick={() => alternarSeccion(`nv_${nivel}`)}
              role="button"
              tabIndex={0}
              title={`Clic para ${estaAbierta ? "colapsar" : "expandir"} conjuros de nivel ${nivel}`}
            >
              <div className={estilos.tituloNivelFila}>
                <span className={estilos.tituloNivelPrincipal}>Nivel {nivel}</span>
                <span className={estilos.badgeConteoNivel}>
                  {hayFiltrosActivos
                    ? `${conjurosNivelVisibles.length} / ${conjurosNivelTotal.length}`
                    : conjurosNivelTotal.length}
                </span>
              </div>
              <div className={estilos.ladoDerechoCabeceraNivel}>
                {estaAbierta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </div>

            {estaAbierta && (
              <>
                {conjurosNivelVisibles.length === 0 ? (
                  <p className={estilos.alertaFiltroVacioNivel}>
                    Ningún conjuro de nivel {nivel} coincide con los filtros aplicados.
                  </p>
                ) : (
                  <div className={estilos.listaTarjetas}>
                    {conjurosNivelVisibles.map((hechizo) => (
                      <TarjetaConjuroCompacta
                        key={`conjuro-${hechizo.id}`}
                        hechizo={hechizo}
                        nombrePersonaje={personaje.nombre}
                        nivelPersonaje={personaje.nivel || 1}
                        bonoAtaqueMagico={bonoAtaqueMagico}
                        estaPreparado={estaPreparado(hechizo)}
                        esDeSubclase={esHechizoDeSubclase(hechizo)}
                        mostrarTogglePreparado={requierePreparacion}
                        esConcentracionActual={personaje.concentracionActiva?.hechizoId === hechizo.id}
                        bloqueadoPorArmadura={estaBloqueadoPorArmadura}
                        motivoBloqueoArmadura={motivoBloqueoArmadura}
                        alAlternarPreparado={() => alAlternarPreparado(hechizo.id)}
                        alQuitarDeLista={() => alQuitarConjuro(hechizo.id)}
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
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Modal Ficha Completa */}
      {hechizoModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setHechizoModal(null)}>
          <div style={{ maxWidth: 550, width: "100%", maxHeight: "90vh", overflowY: "auto", backgroundColor: "#161b22", borderRadius: 8 }} onClick={(e) => e.stopPropagation()}>
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
