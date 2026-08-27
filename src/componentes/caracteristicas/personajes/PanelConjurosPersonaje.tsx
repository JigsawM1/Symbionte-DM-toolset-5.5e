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
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "4px 0" }}>
      {personaje.concentracionActiva && (
        <div style={{ backgroundColor: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Flame size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#f87171" }}>Concentración Activa</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#fecaca" }}>{personaje.concentracionActiva.nombreHechizo}</span>
            </div>
          </div>
          <button type="button" onClick={alRomperConcentracion} style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.5)", borderRadius: 4, color: "#fecaca", fontSize: 11, fontWeight: 700, padding: "4px 10px", cursor: "pointer" }}>Romper</button>
        </div>
      )}

      {/* Tarjetas de Estadísticas Mágicas (Habilidad, CD, Ataque Mágico) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <div style={{ backgroundColor: "#111622", border: "1px solid rgba(148, 163, 184, 0.14)", borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Habilidad</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#93c5fd" }}>{etiquetaHabilidad}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa" }}>{modHabilidad >= 0 ? `+${modHabilidad}` : modHabilidad}</span>
          </div>
        </div>

        <div style={{ backgroundColor: "#111622", border: "1px solid rgba(148, 163, 184, 0.14)", borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>CD Salvación</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#38bdf8", fontFamily: "JetBrains Mono, monospace", marginTop: 2 }}>{cdConjuros}</span>
        </div>

        <div onClick={manejarTiradaAtaqueMagico} title="Haz clic para tirar Ataque Mágico en TaleSpire" style={{ backgroundColor: "#111622", border: "1px solid rgba(167, 139, 250, 0.3)", borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Zap size={11} color="#a78bfa" />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#c4b5fd", textTransform: "uppercase" }}>Ataque Mágico</span>
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#a78bfa", fontFamily: "JetBrains Mono, monospace", marginTop: 2 }}>{bonoAtaqueMagico >= 0 ? `+${bonoAtaqueMagico}` : bonoAtaqueMagico}</span>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => establecerPestaña("compendio")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "rgba(59, 130, 246, 0.12)",
            border: "1px solid rgba(59, 130, 246, 0.28)",
            borderRadius: 6,
            color: "#93c5fd",
            fontSize: 11,
            fontWeight: 700,
            padding: "5px 10px",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.22)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.12)"; }}
        >
          <BookOpen size={13} />
          <span>Compendio de Conjuros</span>
        </button>

        {alAbrirConfiguracion && (
          <button
            type="button"
            onClick={alAbrirConfiguracion}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              fontSize: 11,
              cursor: "pointer",
              textDecoration: "underline"
            }}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
              <div
                style={{
                  padding: 16,
                  backgroundColor: "#111622",
                  border: "1px dashed rgba(148, 163, 184, 0.2)",
                  borderRadius: 6,
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: 12
                }}
              >
                No hay recursos de magia configurados. Configura tu clase lanzadora en los ajustes del personaje.
              </div>
            )}
          </div>
        );
      })()}

      {/* Sección: Trucos Listos */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, backgroundColor: "#111622", border: "1px solid rgba(148, 163, 184, 0.14)", borderRadius: 8, padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={14} color="#a78bfa" />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#f1f5f9" }}>Trucos Listos</span>
            <span style={{ fontSize: 10, backgroundColor: "rgba(167, 139, 250, 0.15)", color: "#c4b5fd", padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>{trucosConocidos.length}</span>
          </div>
          {trucosConocidos.length > 0 && (
            <span style={{ fontSize: 10, color: "#64748b" }}>
              Escalado: Nivel {personaje.nivel || 1}
            </span>
          )}
        </div>
        {trucosConocidos.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "4px 0" }}>
            <p style={{ margin: 0, fontSize: 11, color: "#64748b", fontStyle: "italic" }}>
              No tienes trucos listos.
            </p>
            <button
              type="button"
              onClick={() => establecerPestaña("compendio")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                backgroundColor: "rgba(167, 139, 250, 0.15)",
                border: "1px solid rgba(167, 139, 250, 0.3)",
                borderRadius: 4,
                color: "#c4b5fd",
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 8px",
                cursor: "pointer"
              }}
            >
              <BookOpen size={11} />
              Añadir Trucos
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "24px 16px",
            backgroundColor: "#111622",
            border: "1px dashed rgba(148, 163, 184, 0.2)",
            borderRadius: 8,
            textAlign: "center"
          }}
        >
          <BookOpen size={24} color="#94a3b8" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>
            {requierePreparacion
              ? "No tienes conjuros preparados para el día"
              : "No tienes conjuros en tu lista"}
          </span>
          <p style={{ margin: 0, fontSize: 11, color: "#64748b", maxWidth: 320, lineHeight: 1.4 }}>
            {requierePreparacion
              ? "Accede al Compendio de Conjuros para revisar tu repertorio o grimorio y preparar tus hechizos con la estrella."
              : "Accede al Compendio de Conjuros para añadir hechizos a tu lista de conocidos."}
          </p>
          <button
            type="button"
            onClick={() => establecerPestaña("compendio")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 4,
              backgroundColor: "#2563eb",
              border: "none",
              borderRadius: 6,
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 700,
              padding: "7px 14px",
              cursor: "pointer",
              transition: "background-color 0.15s ease"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1d4ed8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#2563eb"; }}
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
          <div key={`seccion-nv-${nivel}`} style={{ display: "flex", flexDirection: "column", gap: 8, backgroundColor: "#111622", border: "1px solid rgba(148, 163, 184, 0.14)", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#f1f5f9" }}>Nivel {nivel}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
