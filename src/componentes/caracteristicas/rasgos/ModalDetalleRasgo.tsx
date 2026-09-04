import React from "react";
import type { RasgoPersonaje, TipoAccionRasgo, OrigenRasgo } from "@/tipos";
import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";
import {
  X,
  Shield,
  Zap,
  Clock,
  Sparkles,
  Layers,
  BookOpen,
  Dices,
  Heart,
  Edit2,
  Trash2,
  User,
  Swords,
  Award
} from "lucide-react";
import { TablaProgresionRasgo } from "./TablaProgresionRasgo";
import { TooltipUniversal } from "@/componentes/comunes";
import estilos from "./VistaRasgosJugador.module.css";

interface ModalDetalleRasgoProps {
  rasgo: RasgoPersonaje;
  nombrePersonaje: string;
  idPersonaje?: string;
  nivelPersonaje?: number;
  alCerrar: () => void;
  alGastarUso?: () => void;
  alRecuperarUso?: () => void;
  alAlternarActivo?: () => void;
  deshabilitadoToggle?: boolean;
  motivoDeshabilitado?: string;
  alActualizarSeleccion?: (idSelector: string, valores: string[]) => void;
  alEditar?: () => void;
  alEliminar?: () => void;
  usosPadre?: { restantes: number; maximos: number; nombre: string };
  formulaDadosEfectiva?: string;
}

const ICONO_POR_ACCION: Record<TipoAccionRasgo, React.ReactNode> = {
  pasivo: <Shield size={12} />,
  accion: <Zap size={12} />,
  accion_adicional: <Clock size={12} />,
  reaccion: <Sparkles size={12} />,
  especial: <Layers size={12} />
};

const ETIQUETA_ACCION: Record<TipoAccionRasgo, string> = {
  pasivo: "Pasivo",
  accion: "Acción",
  accion_adicional: "Acción Adicional",
  reaccion: "Reacción",
  especial: "Especial"
};

const ETIQUETA_ORIGEN: Record<OrigenRasgo, string> = {
  clase: "Clase",
  subclase: "Subclase",
  especie: "Especie",
  dote: "Dote",
  trasfondo: "Trasfondo",
  personalizado: "Personalizado / Homebrew"
};

/**
 * Renderiza el texto de descripción:
 * - Todo el texto general permanece en blanco puro (#ffffff).
 * - Únicamente los fragmentos entre asteriscos (*, **, ***) se colorean en cian (#38bdf8),
 *   aplicándose la negrita y/o cursiva según corresponda.
 */
export function renderizarTextoEnriquecidoDND(texto: string): React.ReactNode {
  if (!texto) return null;

  // Dividir párrafos
  const parrafos = texto.split(/\n\s*\n/);

  return parrafos.map((parrafo, pIdx) => {
    // Procesar líneas del párrafo
    const lineas = parrafo.split("\n");

    return (
      <p key={pIdx} className={estilos.parrafoModalEnriquecido}>
        {lineas.map((linea, lIdx) => {
          // Tokenizar: ***texto*** (negrita + cursiva), **texto** (negrita), *texto* (cursiva)
          const partes = linea.split(/(\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*|\*[^*]+?\*)/g);

          return (
            <React.Fragment key={lIdx}>
              {partes.map((parte, parteIdx) => {
                if (parte.startsWith("***") && parte.endsWith("***") && parte.length > 6) {
                  const contenido = parte.slice(3, -3);
                  return (
                    <strong key={parteIdx} className={estilos.subtituloRasgoModal}>
                      <em>{contenido}</em>{" "}
                    </strong>
                  );
                }
                if (parte.startsWith("**") && parte.endsWith("**") && parte.length > 4) {
                  const contenido = parte.slice(2, -2);
                  return (
                    <strong key={parteIdx} className={estilos.negritaModal}>
                      {contenido}{" "}
                    </strong>
                  );
                }
                if (parte.startsWith("*") && parte.endsWith("*") && parte.length > 2) {
                  const contenido = parte.slice(1, -1);
                  return (
                    <em key={parteIdx} className={estilos.cursivaColoreadaModal}>
                      {contenido}
                    </em>
                  );
                }

                return <span key={parteIdx}>{parte}</span>;
              })}
              {lIdx < lineas.length - 1 && <br />}
            </React.Fragment>
          );
        })}
      </p>
    );
  });
}

export const ModalDetalleRasgo: React.FC<ModalDetalleRasgoProps> = ({
  rasgo,
  nombrePersonaje,
  idPersonaje,
  nivelPersonaje,
  alCerrar,
  alGastarUso,
  alRecuperarUso,
  alAlternarActivo,
  deshabilitadoToggle,
  motivoDeshabilitado,
  alActualizarSeleccion,
  alEditar,
  alEliminar,
  usosPadre,
  formulaDadosEfectiva
}) => {
  const formulaEfectiva = formulaDadosEfectiva || rasgo.formulaDados;
  const tieneUsosPropios = rasgo.tieneUsosLimitados && typeof rasgo.usosMaximos === "number";
  const tieneUsosPadre = !tieneUsosPropios && Boolean(rasgo.gastarDePadre && usosPadre);

  const usosRestantes = tieneUsosPropios
    ? (rasgo.usosRestantes ?? (rasgo.usosMaximos || 1))
    : (usosPadre?.restantes ?? 0);
  const usosMaximos = tieneUsosPropios
    ? (rasgo.usosMaximos || 1)
    : (usosPadre?.maximos || 1);

  const sinUsosDisponibles = (tieneUsosPropios || tieneUsosPadre) && usosRestantes <= 0;
  const esCuracion = rasgo.categoriaMecanica === "curacion" || rasgo.nombre.toLowerCase().includes("guerrero de los dioses");

  const manejarTirarDados = async () => {
    if (!formulaEfectiva) return;
    if (sinUsosDisponibles) return;

    try {
      if ((esCuracion || rasgo.gastarDePadre) && alGastarUso) {
        alGastarUso();
      }
      const formula = `!${rasgo.nombre}:${formulaEfectiva}`;
      const etiqueta = `${nombrePersonaje} - ${rasgo.nombre} (${formulaEfectiva})`;
      await lanzarDadosTaleSpire(
        formula,
        etiqueta,
        undefined,
        undefined,
        undefined,
        esCuracion && idPersonaje
          ? {
              tipo: "curacionRasgo",
              personajeId: idPersonaje,
              rasgoId: rasgo.id,
              nombreRasgo: rasgo.nombre,
              cantidadDadosGastados: 1
            }
          : undefined
      );
    } catch (error) {
      console.error("[ModalDetalleRasgo] Error al tirar dados:", error);
    }
  };

  const esHomebrewOPersonalizado = rasgo.personalizado || rasgo.origen === "personalizado" || rasgo.origen === "dote";

  // Color temático de borde superior según origen
  const esSubclase = rasgo.origen === "subclase";
  const esClase = rasgo.origen === "clase";
  const esEspecie = rasgo.origen === "especie";
  const esDote = rasgo.origen === "dote";

  let colorAcento = "#38bdf8";
  if (esClase) colorAcento = "#d4af37";
  else if (esSubclase) colorAcento = "#38bdf8";
  else if (esEspecie) colorAcento = "#10b981";
  else if (esDote) colorAcento = "#a78bfa";

  return (
    <div className={estilos.overlayModalDetalle} onClick={alCerrar}>
      <div
        className={estilos.contenedorModalDetalle}
        style={{ borderTopColor: colorAcento }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className={estilos.cabeceraModalDetalle}>
          <div className={estilos.infoTituloModal}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {esClase && <Swords size={15} color="#d4af37" />}
              {esSubclase && <Sparkles size={15} color="#38bdf8" />}
              {esEspecie && <User size={15} color="#10b981" />}
              {esDote && <Award size={15} color="#a78bfa" />}
              {!esClase && !esSubclase && !esEspecie && !esDote && <Layers size={15} color="#38bdf8" />}

              <h2
                className={estilos.tituloRasgoModal}
                style={{ color: esClase ? "#d4af37" : esSubclase ? "#38bdf8" : "#ffffff" }}
              >
                {rasgo.nivelRequerido && rasgo.nivelRequerido > 0 ? `NIVEL ${rasgo.nivelRequerido}: ` : ""}
                {rasgo.nombre.toUpperCase()}
              </h2>

              {/* Conmutador ON / OFF si es rasgo activable */}
              {rasgo.esActivable && alAlternarActivo && (
                <button
                  type="button"
                  className={`${estilos.botonToggleRasgo} ${rasgo.activo ? estilos.botonToggleRasgoActivo : estilos.botonToggleRasgoInactivo}`}
                  onClick={deshabilitadoToggle ? undefined : alAlternarActivo}
                  disabled={deshabilitadoToggle}
                  title={
                    deshabilitadoToggle
                      ? motivoDeshabilitado || "Acción no disponible"
                      : rasgo.activo
                      ? "Rasgo activo (clic para desactivar)"
                      : "Rasgo inactivo (clic para activar)"
                  }
                  style={{
                    marginLeft: 6,
                    ...(deshabilitadoToggle ? { opacity: 0.5, cursor: "not-allowed" } : {})
                  }}
                >
                  <span className={estilos.puntoToggle} />
                  <span>{rasgo.activo ? "ACTIVO" : "INACTIVO"}</span>
                </button>
              )}
            </div>

            {/* Badges de Metadatos */}
            <div className={estilos.badgesModalDetalle}>
              <span className={`${estilos.badgeAccion} ${estilos[`badge_${rasgo.tipoAccion}`] || estilos.badgePasivo}`}>
                {ICONO_POR_ACCION[rasgo.tipoAccion]}
                <span>{ETIQUETA_ACCION[rasgo.tipoAccion]}</span>
              </span>

              {rasgo.fuente && (
                <span className={estilos.badgeFuenteModal}>
                  <BookOpen size={10} />
                  <span>{rasgo.fuente}</span>
                </span>
              )}

              <span className={estilos.badgeOrigenModal}>
                {ETIQUETA_ORIGEN[rasgo.origen] || "Rasgo"}
              </span>

              {rasgo.ligadoA && (
                <span className={estilos.alertaLigado}>
                  Ligado a: {rasgo.ligadoA.replace(/^rasgo_(cls|sub)_[a-z]+_/, "").replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            className={estilos.botonCerrarModal}
            onClick={alCerrar}
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Zona de Recursos y Tiradas */}
        {(tieneUsosPropios || tieneUsosPadre || formulaEfectiva) && (
          <div className={estilos.barraRecursosModal}>
            {(tieneUsosPropios || tieneUsosPadre) && alGastarUso && alRecuperarUso && (
              <div className={estilos.controlUsosModal}>
                <span className={estilos.etiquetaUsosModal}>
                  {tieneUsosPropios ? "Usos Disponibles:" : `Reserva (${usosPadre?.nombre || "Principal"}):`}
                </span>
                <div className={estilos.grupoBotonesUsoModal}>
                  <button
                    type="button"
                    className={estilos.botonPasoUsoModal}
                    onClick={alGastarUso}
                    disabled={usosRestantes <= 0}
                    title={tieneUsosPropios ? "Gastar 1 uso" : `Gastar 1 uso de ${usosPadre?.nombre || "padre"}`}
                  >
                    -
                  </button>

                  <span className={estilos.valorUsosModal}>
                    {usosRestantes} / {usosMaximos}
                  </span>

                  <button
                    type="button"
                    className={estilos.botonPasoUsoModal}
                    onClick={alRecuperarUso}
                    disabled={usosRestantes >= usosMaximos}
                    title={tieneUsosPropios ? "Recuperar 1 uso" : `Recuperar 1 uso de ${usosPadre?.nombre || "padre"}`}
                  >
                    +
                  </button>
                </div>

                {rasgo.recuperacion && rasgo.recuperacion !== "ninguno" && (
                  <span className={estilos.badgeRecuperacionModal}>
                    {rasgo.recuperacion === "descanso_corto" ? "Recupera en D. Corto" : "Recupera en D. Largo"}
                  </span>
                )}
              </div>
            )}

            {formulaEfectiva && (
              <button
                type="button"
                className={estilos.botonLanzarDadosModal}
                onClick={manejarTirarDados}
                disabled={sinUsosDisponibles}
                title={
                  esCuracion
                    ? `Gastar 1 dado de la reserva (${usosRestantes}/${usosMaximos}) y curar ${formulaEfectiva}`
                    : rasgo.gastarDePadre && usosPadre
                    ? `Lanzar ${formulaEfectiva} a TaleSpire (Gasta 1 uso de ${usosPadre.nombre}: ${usosRestantes}/${usosMaximos})`
                    : `Lanzar tirada de ${formulaEfectiva} a TaleSpire`
                }
              >
                {esCuracion ? <Heart size={14} color="#10b981" /> : <Dices size={14} />}
                <span>
                  {esCuracion
                    ? `Curar ${formulaEfectiva} (Gasta 1 dado)`
                    : rasgo.gastarDePadre && usosPadre
                    ? `Lanzar ${formulaEfectiva} (Gasta 1 Inspiración)`
                    : `Lanzar ${formulaEfectiva}`}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Cuerpo con la Descripción Completa y Tablas / Selectores */}
        <div className={estilos.cuerpoModalDetalle}>
          {renderizarTextoEnriquecidoDND(rasgo.descripcion)}

          {/* Tabla de Progresión y Escalado por Nivel */}
          {rasgo.tablaProgresion && (
            <TablaProgresionRasgo tabla={rasgo.tablaProgresion} nivelPersonaje={nivelPersonaje} />
          )}

          {/* Selectores de opciones interactivas */}
          {Array.isArray(rasgo.selectores) && rasgo.selectores.length > 0 && (
            <div className={estilos.seccionSelectoresModal}>
              {rasgo.selectores.map((sel) => {
                const seleccionados = sel.valorActual || [];
                const max = sel.maxSelecciones || 1;

                return (
                  <div key={sel.id} className={estilos.tarjetaSelectorModal}>
                    <div className={estilos.cabeceraSelectorModal}>
                      <span className={estilos.tituloSelectorModal}>{sel.etiqueta}</span>
                      <span className={estilos.limiteSelectorModal}>
                        {sel.tipo === "multiple"
                          ? `Selecciona hasta ${max} (${seleccionados.length}/${max})`
                          : "Selecciona 1 opción"}
                      </span>
                    </div>

                    <div className={estilos.gridOpcionesSelectorModal}>
                      {sel.opciones.map((op) => {
                        const estaActiva = seleccionados.includes(op.id);
                        return (
                          <TooltipUniversal
                            key={op.id}
                            titulo={op.nombre}
                            contenido={op.descripcion || op.nombre}
                            posicion="arriba"
                          >
                            <button
                              type="button"
                              className={`${estilos.opcionSelectorCard} ${estaActiva ? estilos.opcionSelectorCardActiva : ""}`}
                              onClick={() => {
                                if (!alActualizarSeleccion) return;
                                if (sel.tipo === "unico") {
                                  alActualizarSeleccion(sel.id, [op.id]);
                                } else {
                                  if (estaActiva) {
                                    alActualizarSeleccion(
                                      sel.id,
                                      seleccionados.filter((id) => id !== op.id)
                                    );
                                  } else {
                                    if (seleccionados.length < max) {
                                      alActualizarSeleccion(sel.id, [...seleccionados, op.id]);
                                    } else {
                                      // Reemplazar la más antigua si se supera el máximo
                                      const nuevos = [...seleccionados.slice(1), op.id];
                                      alActualizarSeleccion(sel.id, nuevos);
                                    }
                                  }
                                }
                              }}
                            >
                              <span className={estilos.nombreOpcionSelector}>
                                {op.nombre} {estaActiva && "✓"}
                              </span>
                            </button>
                          </TooltipUniversal>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {rasgo.notas && (
            <div className={estilos.seccionNotasModal}>
              <strong style={{ color: "#cbd5e1", display: "block", marginBottom: 3 }}>Notas y Modificadores:</strong>
              <p style={{ margin: 0, color: "#ffffff", fontSize: 12 }}>{rasgo.notas}</p>
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className={estilos.pieModalDetalle}>
          {esHomebrewOPersonalizado && (
            <div style={{ display: "flex", gap: 6 }}>
              {alEditar && (
                <button
                  type="button"
                  className={estilos.botonAccionModalSecundario}
                  onClick={() => {
                    alCerrar();
                    alEditar();
                  }}
                >
                  <Edit2 size={13} />
                  <span>Editar</span>
                </button>
              )}
              {alEliminar && (
                <button
                  type="button"
                  className={estilos.botonAccionModalPeligro}
                  onClick={() => {
                    alCerrar();
                    alEliminar();
                  }}
                >
                  <Trash2 size={13} />
                  <span>Eliminar</span>
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            className={estilos.botonCerrarModalSecundario}
            onClick={alCerrar}
            style={{ marginLeft: "auto" }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
