import { usarAccionesTarjetaRasgo } from "./usarAccionesTarjetaRasgo";
import React from "react";
import { ControlesRecursosDeclarativos } from "./ControlesRecursosDeclarativos";
import { useActivacionDeclarativa } from "./usarActivacionDeclarativa";
import type { RasgoPersonaje, TipoAccionRasgo } from "@/tipos";
import { ETIQUETA_ACCION, ETIQUETA_ORIGEN } from "./TarjetaRasgo.constantes";
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
  Award,
  SlidersHorizontal
} from "lucide-react";
import { TablaProgresionRasgo } from "./TablaProgresionRasgo";
import { SeccionSelectoresModalRasgo } from "./SeccionSelectoresModalRasgo";
import { TextoEnriquecidoDND } from "@/componentes/comunes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { ModalTiendaRecuperacionEspacios } from "./ModalTiendaRecuperacionEspacios";
import estilos from "./VistaRasgosJugador.module.css";

interface ModalDetalleRasgoProps {
  rasgo: RasgoPersonaje;
  nombrePersonaje: string;
  idPersonaje?: string;
  nivelPersonaje?: number;
  alCerrar: () => void;
  alGastarUso?: (cantidad?: number) => void;
  alRecuperarUso?: (cantidad?: number) => void;
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
  const activacion = useActivacionDeclarativa(rasgo, idPersonaje, alAlternarActivo);
  const [mostrarTienda, setMostrarTienda] = React.useState(false);
  const personajeActivoAlmacen = usarAlmacenDM(
    React.useCallback((s) => s.personajes.find((p) => p.id === idPersonaje), [idPersonaje])
  );

  const manejarConfirmarRecuperacion = (espacios: Record<number, number>, puntosConjuro?: number) => {
    confirmarRecuperacion(espacios, puntosConjuro, alGastarUso);
  };

  const { formulaEfectiva, tieneUsosPropios, tieneUsosPadre, usosMaximos, usosRestantes, sinUsosDisponibles, esCuracion, esPreservarVida, manejarTirarDados, manejarConfirmarRecuperacion: confirmarRecuperacion } = usarAccionesTarjetaRasgo({
    rasgo, nombrePersonaje, idPersonaje, alGastarUso, usosPadre, formulaDadosEfectiva, nivelPersonaje
  });
  const tieneDadosReales = Boolean(formulaEfectiva && formulaEfectiva.toLowerCase().includes("d"));
  const etiquetaGasto = (rasgo.gastarDePadre && usosPadre) || !tieneDadosReales ? "Gasta 1 uso" : "Gasta 1 dado";

  const esHomebrewOPersonalizado = rasgo.personalizado || rasgo.origen === "personalizado" || rasgo.origen === "dote";

  // Color temático de borde superior según origen
  const esRasgoSelector =
    rasgo.categoriaMecanica === "selector_informativo" ||
    (Array.isArray(rasgo.selectores) && rasgo.selectores.length > 0 && !rasgo.requiereOpcion);
  const esSubclase = rasgo.origen === "subclase";
  const esClase = rasgo.origen === "clase";
  const esEspecie = rasgo.origen === "especie";
  const esDote = rasgo.origen === "dote";

  const tipoOrigen: "selector" | "clase" | "subclase" | "especie" | "dote" | "default" =
    esRasgoSelector
      ? "selector"
      : esClase
      ? "clase"
      : esSubclase
      ? "subclase"
      : esEspecie
      ? "especie"
      : esDote
      ? "dote"
      : "default";

  return (
    <div className={estilos.overlayModalDetalle} onClick={alCerrar}>
      <div
        className={estilos.contenedorModalDetalle}
        data-tipo-origen={tipoOrigen}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className={estilos.cabeceraModalDetalle}>
          <div className={estilos.infoTituloModal}>
            <div className={estilos.lineaTituloModal}>
              {esRasgoSelector && <SlidersHorizontal size={15} color="var(--pj-texto-acento)" />}
              {!esRasgoSelector && esClase && <Swords size={15} color="var(--pj-texto-oro)" />}
              {!esRasgoSelector && esSubclase && <Sparkles size={15} color="var(--pj-texto-cian)" />}
              {!esRasgoSelector && esEspecie && <User size={15} color="var(--pj-texto-exito)" />}
              {!esRasgoSelector && esDote && <Award size={15} color="var(--pj-texto-magia)" />}
              {!esRasgoSelector && !esClase && !esSubclase && !esEspecie && !esDote && <Layers size={15} color="var(--pj-texto-cian)" />}

              <h2 className={estilos.tituloRasgoModal}>
                {rasgo.nivelRequerido && rasgo.nivelRequerido > 0 ? `NIVEL ${rasgo.nivelRequerido}: ` : ""}
                {rasgo.nombre.toUpperCase()}
              </h2>

              {/* Conmutador ON / OFF si es rasgo activable */}
              {rasgo.esActivable && alAlternarActivo && (!rasgo.lanzamientoConActivacion || rasgo.activo) && (
                <button
                  type="button"
                  className={`${estilos.botonToggleRasgo} ${
                    rasgo.activo ? estilos.botonToggleRasgoActivo : estilos.botonToggleRasgoInactivo
                  } ${deshabilitadoToggle ? estilos.botonToggleRasgoDeshabilitado : ""}`}
                  onClick={deshabilitadoToggle ? undefined : activacion.alternar}
                  disabled={deshabilitadoToggle}
                  title={
                    deshabilitadoToggle
                      ? motivoDeshabilitado || "Acción no disponible"
                  : rasgo.activo && rasgo.renovarActivacion ? "Rasgo activo (clic para renovar)" : rasgo.activo
                      ? "Rasgo activo (clic para desactivar)"
                      : "Rasgo inactivo (clic para activar)"
                  }
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
        {(tieneUsosPropios || tieneUsosPadre || formulaEfectiva || rasgo.conjurosRituales?.length || rasgo.salvacionObjetivo || rasgo.resolucionAsistida || rasgo.resolucionesCuracionPendientes?.length || rasgo.conversionEspacios || rasgo.lanzamientoConRecurso || rasgo.reservaDados || rasgo.tablaAleatoria || rasgo.varianteSinConcentracion || rasgo.usoGratuitoCondicionado) && (
          <div className={estilos.barraRecursosModal}>
            {(tieneUsosPropios || tieneUsosPadre) && !rasgo.resolucionAsistida && !rasgo.lanzamientoConRecurso?.lista && !rasgo.lanzamientoConRecurso?.conjuros && alGastarUso && alRecuperarUso && (
              <div className={estilos.controlUsosModal}>
                <span className={estilos.etiquetaUsosModal}>
                  {tieneUsosPropios ? "Usos Disponibles:" : `Reserva (${usosPadre?.nombre || "Principal"}):`}
                </span>
                <div className={estilos.grupoBotonesUsoModal}>
                  <button
                    type="button"
                    className={estilos.botonPasoUsoModal}
                    onClick={() => alGastarUso()}
                    disabled={usosRestantes <= 0}
                    title={tieneUsosPropios ? "Gastar 1 uso" : `Gastar 1 uso de ${usosPadre?.nombre || "padre"}`}
                  >
                    -
                  </button>

                  {rasgo.costeFijo && rasgo.costeFijo > 1 && (
                    <button
                      type="button"
                      className={estilos.botonPasoUsoModal}
                      onClick={() => alGastarUso(rasgo.costeFijo)}
                      disabled={usosRestantes < (rasgo.costeFijo || 1)}
                      title={`Gastar ${rasgo.costeFijo} usos (Coste fijo)`}
                    >
                      -{rasgo.costeFijo}
                    </button>
                  )}

                  <span className={estilos.valorUsosModal}>
                    {usosRestantes} / {usosMaximos}
                  </span>

                  <button
                    type="button"
                    className={estilos.botonPasoUsoModal}
                    onClick={() => alRecuperarUso()}
                    disabled={usosRestantes >= usosMaximos}
                    title={tieneUsosPropios ? "Recuperar 1 uso" : `Recuperar 1 uso de ${usosPadre?.nombre || "padre"}`}
                  >
                    +
                  </button>
                </div>

                {rasgo.recuperacion && rasgo.recuperacion !== "ninguno" && (
                  <span className={estilos.badgeRecuperacionModal}>
                    {rasgo.recargaDescansoCorto
                      ? `Recupera +${rasgo.recargaDescansoCorto} en D. Corto (Todos en D. Largo)`
                      : rasgo.recuperacion === "descanso_dinamico"
                      ? "Recupera 1 en D. Corto (Todos en D. Largo)"
                      : rasgo.recuperacion === "descanso_corto"
                      ? "Recupera en D. Corto"
                      : "Recupera en D. Largo"}
                  </span>
                )}
              </div>
            )}

            {formulaEfectiva && !rasgo.tiradaCuracion && !rasgo.tiradaCuracionManual && !rasgo.resolucionAsistida && (
              <button
                type="button"
                className={estilos.botonLanzarDadosModal}
                onClick={manejarTirarDados}
                disabled={sinUsosDisponibles && !rasgo.noGastarAlTirarDados}
                title={
                  esCuracion
                    ? esPreservarVida && usosPadre
                      ? `Gastar 1 uso de ${usosPadre.nombre} (${usosRestantes}/${usosMaximos}) y disponer de ${formulaEfectiva} PV para repartir`
                      : rasgo.gastarDePadre && usosPadre
                      ? `Gastar 1 uso de ${usosPadre.nombre} (${usosRestantes}/${usosMaximos}) y curar ${formulaEfectiva}`
                      : `Gastar 1 ${tieneDadosReales ? "dado" : "uso"} de la reserva (${usosRestantes}/${usosMaximos}) y curar ${formulaEfectiva}`
                    : rasgo.gastarDePadre && usosPadre
                    ? `Lanzar ${formulaEfectiva} a TaleSpire (Gasta 1 uso de ${usosPadre.nombre}: ${usosRestantes}/${usosMaximos})`
                    : `Lanzar tirada de ${formulaEfectiva} a TaleSpire`
                }
              >
                {esCuracion ? <Heart size={14} color="var(--pj-texto-exito)" /> : <Dices size={14} />}
                <span>
                  {esCuracion
                    ? `Curar ${formulaEfectiva} (${etiquetaGasto})`
                    : rasgo.gastarDePadre && usosPadre
                    ? `Lanzar ${formulaEfectiva} (${etiquetaGasto})`
                    : `Lanzar ${formulaEfectiva}`}
                </span>
              </button>
            )}

            {activacion.modal}<ControlesRecursosDeclarativos rasgo={rasgo} idPersonaje={idPersonaje} vista="detalle" />
            {rasgo.recuperarEspacios && (
              <button
                type="button"
                className={estilos.botonLanzarDadosModal}
                onClick={() => setMostrarTienda(true)}
                disabled={sinUsosDisponibles}
                title={
                  sinUsosDisponibles
                    ? "No quedan usos disponibles (requiere descanso largo)"
                    : "Abrir recuperación de espacios de conjuro"
                }
              >
                <Sparkles size={14} color="var(--pj-texto-magia)" />
                <span>Recuperar Espacios</span>
              </button>
            )}
          </div>
        )}

        {/* Cuerpo con la Descripción Completa y Tablas / Selectores */}
        <div className={estilos.cuerpoModalDetalle}>
          <TextoEnriquecidoDND texto={rasgo.descripcion} />

          {/* Tabla de Progresión y Escalado por Nivel */}
          {rasgo.tablaProgresion && (
            <TablaProgresionRasgo tabla={rasgo.tablaProgresion} nivelPersonaje={nivelPersonaje} />
          )}

          {Array.isArray(rasgo.tablasProgresion) &&
            rasgo.tablasProgresion.map((tablaAdicional, idx) => (
              <TablaProgresionRasgo
                key={idx}
                tabla={tablaAdicional}
                nivelPersonaje={nivelPersonaje}
              />
            ))}

          {/* Selectores de opciones interactivas */}
          {Array.isArray(rasgo.selectores) && rasgo.selectores.length > 0 && (
            <SeccionSelectoresModalRasgo
              selectores={rasgo.selectores}
              nivelPersonaje={nivelPersonaje}
              alActualizarSeleccion={alActualizarSeleccion}
            />
          )}

          {rasgo.notas && (
            <div className={estilos.seccionNotasModal}>
              <strong className={estilos.tituloNotasModal}>Notas y Modificadores:</strong>
              <p className={estilos.textoNotasModal}>{rasgo.notas}</p>
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className={estilos.pieModalDetalle}>
          {esHomebrewOPersonalizado && (
            <div className="u-flex u-gap-1">
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
          >
            Cerrar
          </button>
        </div>
      </div>

      {mostrarTienda && personajeActivoAlmacen && (
        <ModalTiendaRecuperacionEspacios
          personaje={personajeActivoAlmacen}
          rasgo={rasgo}
          alCerrar={() => setMostrarTienda(false)}
          alConfirmar={manejarConfirmarRecuperacion}
        />
      )}
    </div>
  );
};
