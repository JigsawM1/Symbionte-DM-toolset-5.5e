import React, { useState } from "react";
import {
  Sparkles,
  Flame,
  Zap,
  BookOpen
} from "lucide-react";
import type {
  PersonajeJugador,
  Caracteristica,
  HechizoBase
} from "@/tipos";
import {
  gastarRecursoLanzamientoConjuro,
  obtenerConjurosSubclasePersonaje
} from "@/servicios/calculadorMagia";
import { COSTE_PUNTOS_POR_NIVEL } from "@/constantes";
import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";
import { usarAccionesConfiguracion } from "@/almacen/selectores/usarEstadoConfiguracion";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { usarMagiaPersonaje } from "@/hooks/usarMagiaPersonaje";
import { TarjetasMetricasMagia } from "./TarjetasMetricasMagia";
import { TrackerEspaciosConjuro } from "./TrackerEspaciosConjuro";
import { TrackerEspaciosPacto } from "./TrackerEspaciosPacto";
import { TrackerPuntosConjuro } from "./TrackerPuntosConjuro";
import { TarjetaConjuroCompacta } from "./TarjetaConjuroCompacta";
import { SeccionArcanoMistico } from "./SeccionArcanoMistico";
import { FichaHechizo } from "@/componentes/caracteristicas/compendio/FichaHechizo";
import estilos from "./PanelConjurosPersonaje.module.css";

interface PanelConjurosPersonajeProps {
  personaje: PersonajeJugador;
  bonoCompetencia: number;
  modificadores: Record<Caracteristica, number>;
  baseDatosHechizos: HechizoBase[];
  sistemaMagia: "espacios" | "puntos";
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
  alAbrirConfiguracion,
  alGastarEspacio,
  alRecuperarEspacio,
  alRecuperarTodosEspacios,
  alGastarPuntos,
  alRecuperarPuntos,
  alRecuperarTodosPuntos,
  alGastarEspacioPacto,
  alRecuperarEspaciosPacto,
  alEstablecerConcentracion,
  alRomperConcentracion,
  alQuitarTruco,
  alQuitarConjuro,
  alAlternarPreparado
}) => {
  const [hechizoModal, setHechizoModal] = useState<HechizoBase | null>(null);

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

  const manejarTiradaAtaqueMagico = async () => {
    try {
      const nombrePj = personaje.nombre?.trim() || "Personaje";
      const modTexto = bonoAtaqueMagico >= 0 ? `+${bonoAtaqueMagico}` : `${bonoAtaqueMagico}`;
      const formula = `!Ataque de Conjuro:1d20${modTexto}`;
      await lanzarDadosTaleSpire(formula, `${nombrePj} - Ataque Mágico`);
    } catch (err) {
      console.error("[PanelConjurosPersonaje] Error al lanzar tirada:", err);
    }
  };

  return (
    <div className={estilos.contenedor}>
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

        <div onClick={manejarTiradaAtaqueMagico} title="Haz clic para tirar Ataque Mágico en TaleSpire" className={estilos.tarjetaAtaqueMagico}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Zap size={11} color="#a78bfa" />
            <span className={estilos.estadisticaEtiquetaMorada}>Ataque Mágico</span>
          </div>
          <span className={estilos.estadisticaNumeroMorado}>{bonoAtaqueMagico >= 0 ? `+${bonoAtaqueMagico}` : bonoAtaqueMagico}</span>
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
                alAsignarArcano={(nivel, hechizoId) => asignarArcanoMistico(personaje.id, nivel, hechizoId)}
                alQuitarArcano={(nivel) => quitarArcanoMistico(personaje.id, nivel)}
                alGastarArcano={(nivel) => gastarArcanoMistico(personaje.id, nivel)}
                alRecuperarArcano={(nivel) => recuperarArcanoMistico(personaje.id, nivel)}
                alAbrirFichaHechizo={(h) => setHechizoModal(h)}
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

      {/* Sección: Trucos Listos */}
      <div className={estilos.seccionNivel}>
        <div className={estilos.cabeceraNivel}>
          <div className={estilos.tituloNivelFila}>
            <Sparkles size={14} color="#a78bfa" />
            <span className={estilos.tituloNivelTexto}>Trucos Listos</span>
            <span className={estilos.badgeConteoNivel}>{trucosConocidos.length}</span>
          </div>
          {trucosConocidos.length > 0 && (
            <span className={estilos.textoEscalado}>
              Escalado: Nivel {personaje.nivel || 1}
            </span>
          )}
        </div>
        {trucosConocidos.length === 0 ? (
          <div className={estilos.filaVacioTrucos}>
            <p className={estilos.textoVacio}>
              No tienes trucos listos.
            </p>
            <button
              type="button"
              onClick={() => establecerPestaña("compendio")}
              className={estilos.botonAnadirTrucos}
            >
              <BookOpen size={11} />
              Añadir Trucos
            </button>
          </div>
        ) : (
          <div className={estilos.listaTarjetas}>
            {trucosConocidos.map((truco) => (
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
                alQuitarDeLista={() => alQuitarTruco(truco.id)}
                alAbrirDetalleCompleto={(h) => setHechizoModal(h)}
                alEstablecerConcentracion={alEstablecerConcentracion}
              />
            ))}
          </div>
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

      {/* Secciones por Nivel de Conjuro */}
      {Array.from({ length: 9 }).map((_, idx) => {
        const nivel = idx + 1;
        const conjurosNivel = conjurosPorNivel[nivel] || [];
        if (conjurosNivel.length === 0) return null;
        return (
          <div key={`seccion-nv-${nivel}`} className={estilos.seccionNivel}>
            <div className={estilos.cabeceraNivel}>
              <span className={estilos.tituloNivelPrincipal}>Nivel {nivel}</span>
            </div>
            <div className={estilos.listaTarjetas}>
              {conjurosNivel.map((hechizo) => (
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
                  alAlternarPreparado={() => alAlternarPreparado(hechizo.id)}
                  alQuitarDeLista={() => alQuitarConjuro(hechizo.id)}
                  alAbrirDetalleCompleto={(h) => setHechizoModal(h)}
                  alGastarEspacio={alGastarEspacio}
                  alGastarPuntos={alGastarPuntos}
                  alGastarEspacioPacto={alGastarEspacioPacto}
                  esLanzadorPacto={esLanzadorPacto}
                  nivelEspacioPacto={nivelEspacioPacto}
                  espaciosPactoMaximos={personaje.espaciosPactoMaximos || 0}
                  espaciosPactoGastados={personaje.espaciosPactoGastados || 0}
                  espaciosConjuroMaximos={personaje.espaciosConjuroMaximos || {}}
                  nivelConjuroMaximo={personaje.nivelConjuroMaximo || 0}
                  sistemaMagia={sistemaMagia}
                  alEstablecerConcentracion={alEstablecerConcentracion}
                  costePuntosPorNivel={COSTE_PUNTOS_POR_NIVEL}
                />
              ))}
            </div>
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
              onClose={() => setHechizoModal(null)}
              onLanzarRitual={() => {
                if (hechizoModal.concentracion && alEstablecerConcentracion) {
                  alEstablecerConcentracion(hechizoModal.id, hechizoModal.nombre);
                }
                setHechizoModal(null);
              }}
              onLanzarConjuro={(nivelLanzamiento) => {
                if (hechizoModal.nivel > 0) {
                  gastarRecursoLanzamientoConjuro({
                    nivelLanzamiento,
                    esLanzadorPacto,
                    nivelEspacioPacto,
                    espaciosPactoMaximos: personaje.espaciosPactoMaximos || 0,
                    espaciosPactoGastados: personaje.espaciosPactoGastados || 0,
                    espaciosConjuroMaximos: personaje.espaciosConjuroMaximos || {},
                    sistemaMagia,
                    costePuntosPorNivel: COSTE_PUNTOS_POR_NIVEL,
                    alGastarEspacio,
                    alGastarPuntos,
                    alGastarEspacioPacto
                  });
                }
                if (hechizoModal.concentracion && alEstablecerConcentracion) {
                  alEstablecerConcentracion(hechizoModal.id, hechizoModal.nombre);
                }
                setHechizoModal(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
