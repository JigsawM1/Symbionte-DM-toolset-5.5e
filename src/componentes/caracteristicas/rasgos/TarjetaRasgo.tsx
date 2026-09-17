import React from "react";
import type { RasgoPersonaje, TipoAccionRasgo, OrigenRasgo } from "@/tipos";
import {
  lanzarDadosTaleSpire,
  aplicarResultadoHpTemporalEnEstado,
  type MetadataEspecialRasgo
} from "@/utiles/lanzadorDados";
import {
  calcularHpTemporalDeEfecto,
  obtenerEfectoHpTemporalRasgo
} from "@/servicios/evaluadorEfectosRasgos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { limpiarYTruncarTextoMarkdown } from "@/utiles/formatoTextoDND";
import { logger } from "@/utiles/logger";
import {
  Sparkles,
  Zap,
  Clock,
  Shield,
  Dices,
  Heart,
  Edit2,
  Trash2,
  BookOpen,
  Layers,
  Maximize2
} from "lucide-react";
import estilos from "./VistaRasgosJugador.module.css";

interface TarjetaRasgoProps {
  rasgo: RasgoPersonaje;
  nombrePersonaje: string;
  idPersonaje?: string;
  alGastarUso: () => void;
  alRecuperarUso: () => void;
  alAlternarActivo?: () => void;
  deshabilitadoToggle?: boolean;
  motivoDeshabilitado?: string;
  alEditar?: () => void;
  alEliminar?: () => void;
  alVerDetalle: () => void;
  usosPadre?: { restantes: number; maximos: number; nombre: string };
  formulaDadosEfectiva?: string;
}

const ICONO_POR_ACCION: Record<TipoAccionRasgo, React.ReactNode> = {
  pasivo: <Shield size={10} />,
  accion: <Zap size={10} />,
  accion_adicional: <Clock size={10} />,
  reaccion: <Sparkles size={10} />,
  especial: <Layers size={10} />
};

const CLASE_BADGE_ACCION: Record<TipoAccionRasgo, string> = {
  pasivo: estilos.badgePasivo,
  accion: estilos.badgeAccionPrincipal,
  accion_adicional: estilos.badgeAccionAdicional,
  reaccion: estilos.badgeReaccion,
  especial: estilos.badgeEspecial
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
  subespecie: "Legado / Subraza",
  dote: "Dote",
  trasfondo: "Trasfondo",
  personalizado: "Personalizado / Homebrew"
};

const CLASE_ORIGEN_BORDE: Record<OrigenRasgo, string> = {
  clase: estilos.origenClase,
  subclase: estilos.origenSubclase,
  especie: estilos.origenEspecie,
  subespecie: estilos.origenSubclase,
  dote: estilos.origenDote,
  trasfondo: estilos.origenDote,
  personalizado: estilos.origenPersonalizado
};

export const TarjetaRasgo: React.FC<TarjetaRasgoProps> = ({
  rasgo,
  nombrePersonaje,
  idPersonaje,
  alGastarUso,
  alRecuperarUso,
  alAlternarActivo,
  deshabilitadoToggle,
  motivoDeshabilitado,
  alEditar,
  alEliminar,
  alVerDetalle,
  usosPadre,
  formulaDadosEfectiva
}) => {
  const personajeActivoAlmacen = usarAlmacenDM(
    React.useCallback((s) => s.personajes.find((p) => p.id === idPersonaje), [idPersonaje])
  );
  const esRecursoEspacioPacto = rasgo.recursoGastado === "espacio_pacto";
  const espaciosPactoMaximos = personajeActivoAlmacen?.espaciosPactoMaximos || 0;
  const espaciosPactoGastados = personajeActivoAlmacen?.espaciosPactoGastados || 0;
  const espaciosPactoDisponibles = Math.max(0, espaciosPactoMaximos - espaciosPactoGastados);

  const formulaEfectiva = formulaDadosEfectiva || rasgo.formulaDados;
  const tieneUsosPropios = rasgo.tieneUsosLimitados && typeof rasgo.usosMaximos === "number";
  const tieneUsosPadre = !tieneUsosPropios && Boolean(rasgo.gastarDePadre && usosPadre);

  const usosRestantes = esRecursoEspacioPacto
    ? espaciosPactoDisponibles
    : tieneUsosPropios
    ? (rasgo.usosRestantes ?? (rasgo.usosMaximos || 1))
    : (usosPadre?.restantes ?? 0);
  const usosMaximos = esRecursoEspacioPacto
    ? espaciosPactoMaximos
    : tieneUsosPropios
    ? (rasgo.usosMaximos || 1)
    : (usosPadre?.maximos || 1);

  const sinUsosDisponibles =
    (esRecursoEspacioPacto && espaciosPactoDisponibles <= 0) ||
    ((tieneUsosPropios || tieneUsosPadre) && usosRestantes <= 0);
  
  const normNombre = rasgo.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const esManosCurativas = normNombre.includes("manos curativas");
  const esMantoInspiracion = normNombre.includes("manto de inspiracion");
  const esInspiracionBardica = normNombre.includes("inspiracion bardica");
  const esAtaqueAliento = normNombre.includes("ataque de aliento") || normNombre.includes("arma de aliento");

  // La auto-curación y auto-HP temporal solo se aplican a rasgos exclusivamente personales (ej. Guerrero de los dioses).
  // Rasgos que pueden aplicarse a otras criaturas (como Manos curativas o Manto de inspiración) o consumibles (Ataque de aliento, Inspiración bárdica)
  // tiran los dados y consumen el uso, pero no alteran automáticamente la vida del propio lanzador.
  const esCuracion = rasgo.categoriaMecanica === "curacion" || normNombre.includes("guerrero de los dioses");
  const esCuracionAuto = esCuracion && !esManosCurativas;
  const tieneEfectoHpTemporalAuto = (rasgo.efectos || []).some((ef) => ef.tipo === "hp_temporal") && !esMantoInspiracion;
  const gastaUsoAlTirar =
    esCuracionAuto ||
    tieneEfectoHpTemporalAuto ||
    esManosCurativas ||
    esMantoInspiracion ||
    esInspiracionBardica ||
    esAtaqueAliento ||
    rasgo.categoriaMecanica === "consumible" ||
    rasgo.gastarDePadre;

  const manejarTirarDados = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!formulaEfectiva) return;
    if (sinUsosDisponibles) return;

    try {
      if (esRecursoEspacioPacto && idPersonaje) {
        usarAlmacenDM.getState().gastarEspacioPacto(idPersonaje);
      } else if (gastaUsoAlTirar && alGastarUso) {
        alGastarUso();
      }
      const formula = `!${rasgo.nombre}:${formulaEfectiva}`;
      const etiqueta = `${nombrePersonaje} - ${rasgo.nombre} (${formulaEfectiva})`;

      let metaEspecial: MetadataEspecialRasgo | undefined = undefined;
      if (esCuracionAuto && idPersonaje) {
        metaEspecial = {
          tipo: "curacionRasgo",
          personajeId: idPersonaje,
          rasgoId: rasgo.id,
          nombreRasgo: rasgo.nombre,
          cantidadDadosGastados: 1
        };
      } else if (tieneEfectoHpTemporalAuto && idPersonaje) {
        const efectoHp = (rasgo.efectos || []).find((ef) => ef.tipo === "hp_temporal");
        let multiplicador = 1;
        if (efectoHp?.valor) {
          if (efectoHp.valor === "2_veces_dado_inspiracion") {
            multiplicador = 2;
          } else {
            const num = Number(efectoHp.valor);
            if (!Number.isNaN(num) && num > 0) multiplicador = num;
          }
        }

        metaEspecial = {
          tipo: "hpTemporalRasgo",
          personajeId: idPersonaje,
          rasgoId: rasgo.id,
          nombreRasgo: rasgo.nombre,
          multiplicador
        };
      }

      await lanzarDadosTaleSpire(
        formula,
        etiqueta,
        undefined,
        undefined,
        undefined,
        metaEspecial
      );
    } catch (error) {
      logger.error("[TarjetaRasgo] Error al tirar dados:", error);
    }
  };

  const efectoHpTemporal = obtenerEfectoHpTemporalRasgo(rasgo);
  const esHpTemporalPropio = Boolean(
    efectoHpTemporal &&
    (!efectoHpTemporal.objetivo || efectoHpTemporal.objetivo === "propio" || efectoHpTemporal.objetivo === "hp_temporal")
  );

  const agregarNotificacion = usarAlmacenDM((s) => s.agregarNotificacion);

  const valorHpTemporalCalculado = React.useMemo(() => {
    if (!efectoHpTemporal) return 0;
    if (personajeActivoAlmacen) {
      return calcularHpTemporalDeEfecto(efectoHpTemporal, personajeActivoAlmacen);
    }
    const vStr = String(efectoHpTemporal.valor || "").toLowerCase();
    if (vStr === "bono_competencia" || vStr === "pb" || vStr === "bc") return 2;
    return Math.max(0, Number(efectoHpTemporal.valor) || 0);
  }, [efectoHpTemporal, personajeActivoAlmacen]);

  const manejarAplicarHpTemporal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sinUsosDisponibles) return;
    if (!idPersonaje) return;

    try {
      if (alGastarUso) {
        alGastarUso();
      }
      const valor = valorHpTemporalCalculado > 0 ? valorHpTemporalCalculado : 1;
      aplicarResultadoHpTemporalEnEstado(idPersonaje, valor);
      agregarNotificacion(
        `Has usado ${rasgo.nombre} y obtenido ${valor} PG temporales.`,
        "exito"
      );
    } catch (error) {
      logger.error("[TarjetaRasgo] Error al aplicar HP temporal:", error);
    }
  };

  const claseOrigen = CLASE_ORIGEN_BORDE[rasgo.origen] || estilos.origenPersonalizado;
  const esHomebrewOPersonalizado = rasgo.personalizado || rasgo.origen === "personalizado" || rasgo.origen === "dote";

  // Truncado de descripción para tarjeta compacta
  const LIMITE_CARACTERES = 115;
  const textoTruncado = limpiarYTruncarTextoMarkdown(rasgo.descripcion, LIMITE_CARACTERES);
  const esLargo = (rasgo.descripcion || "").length > LIMITE_CARACTERES;

  const esClase = rasgo.origen === "clase";
  const esSubclase = rasgo.origen === "subclase";

  return (
    <article className={`${estilos.tarjetaRasgo} ${claseOrigen}`}>
      {/* Fila Superior: Título, Badges y Acciones */}
      <div className={estilos.filaSuperiorTarjeta}>
        <div
          className={estilos.tituloYBadges}
          onClick={alVerDetalle}
          style={{ cursor: "pointer", flex: 1 }}
          title="Ver detalle completo del rasgo"
        >
          <span
            className={estilos.nombreRasgo}
            style={{
              color: esClase ? "#d4af37" : esSubclase ? "#38bdf8" : "#f8fafc"
            }}
          >
            {rasgo.nivelRequerido && rasgo.nivelRequerido > 0 ? `Nv ${rasgo.nivelRequerido}: ` : ""}
            {rasgo.nombre}
          </span>

          {/* Badge de Tipo de Acción */}
          <span className={`${estilos.badgeAccion} ${CLASE_BADGE_ACCION[rasgo.tipoAccion]}`}>
            {ICONO_POR_ACCION[rasgo.tipoAccion]}
            <span>{ETIQUETA_ACCION[rasgo.tipoAccion]}</span>
          </span>

          {/* Badge de Fuente u Origen */}
          {rasgo.fuente && (
            <span className={estilos.badgeFuente} title={`Origen: ${ETIQUETA_ORIGEN[rasgo.origen]}`}>
              <BookOpen size={9} />
              <span>{rasgo.fuente}</span>
            </span>
          )}
        </div>

        {/* Zona de Recursos y Botones Interactivos */}
        <div className={estilos.zonaAccionesTarjeta}>
          {/* Conmutador ON / OFF si el rasgo es activable */}
          {rasgo.esActivable && alAlternarActivo && (
            <button
              type="button"
              className={`${estilos.botonToggleRasgo} ${rasgo.activo ? estilos.botonToggleRasgoActivo : estilos.botonToggleRasgoInactivo}`}
              onClick={(e) => {
                e.stopPropagation();
                if (deshabilitadoToggle) return;
                alAlternarActivo();
              }}
              disabled={deshabilitadoToggle}
              style={deshabilitadoToggle ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
              title={
                deshabilitadoToggle
                  ? motivoDeshabilitado || "Acción no disponible"
                  : rasgo.activo
                  ? "Rasgo activo (clic para desactivar)"
                  : "Rasgo inactivo (clic para activar)"
              }
            >
              <span className={estilos.puntoToggle} />
              <span>{rasgo.activo ? "ACTIVO" : "INACTIVO"}</span>
            </button>
          )}

          {/* Contador de Usos (Propios, de Rasgo Padre o Espacios de Pacto) */}
          {(tieneUsosPropios || tieneUsosPadre || esRecursoEspacioPacto) && (
            <div
              className={estilos.contadorUsos}
              title={
                esRecursoEspacioPacto
                  ? `Espacios de Magia del Pacto (${usosRestantes}/${usosMaximos})`
                  : tieneUsosPropios
                  ? `Recuperación: ${rasgo.recuperacion || "Descanso"}`
                  : `Gasta de: ${usosPadre?.nombre || "Rasgo Principal"} (${usosRestantes}/${usosMaximos})`
              }
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className={estilos.botonPasoUso}
                onClick={(e) => {
                  e.stopPropagation();
                  if (esRecursoEspacioPacto && idPersonaje) {
                    usarAlmacenDM.getState().gastarEspacioPacto(idPersonaje);
                  } else {
                    alGastarUso();
                  }
                }}
                disabled={usosRestantes <= 0}
                title={esRecursoEspacioPacto ? "Gastar 1 espacio de pacto" : tieneUsosPropios ? "Gastar 1 uso" : `Gastar 1 uso de ${usosPadre?.nombre || "padre"}`}
              >
                -
              </button>

              <span className={estilos.textoUsos}>
                {usosRestantes} / {usosMaximos}
              </span>

              <button
                type="button"
                className={estilos.botonPasoUso}
                onClick={(e) => {
                  e.stopPropagation();
                  if (esRecursoEspacioPacto && idPersonaje) {
                    usarAlmacenDM.getState().recuperarEspacioPacto(idPersonaje);
                  } else {
                    alRecuperarUso();
                  }
                }}
                disabled={usosRestantes >= usosMaximos}
                title={esRecursoEspacioPacto ? "Recuperar 1 espacio de pacto" : tieneUsosPropios ? "Recuperar 1 uso" : `Recuperar 1 uso de ${usosPadre?.nombre || "padre"}`}
              >
                +
              </button>
            </div>
          )}

          {/* Botón de Tirada de Dados 3D / Curación */}
          {formulaEfectiva && (
            <button
              type="button"
              className={estilos.botonTirarDados}
              onClick={manejarTirarDados}
              disabled={sinUsosDisponibles}
              title={
                esCuracion
                  ? `Gastar 1 dado de la reserva (${usosRestantes}/${usosMaximos}) y curar ${formulaEfectiva}`
                  : esRecursoEspacioPacto
                  ? `Lanzar ${formulaEfectiva} a TaleSpire (Gasta 1 espacio de pacto: ${usosRestantes}/${usosMaximos})`
                  : rasgo.gastarDePadre && usosPadre
                  ? `Lanzar ${formulaEfectiva} a TaleSpire (Gasta 1 uso de ${usosPadre.nombre}: ${usosRestantes}/${usosMaximos})`
                  : `Lanzar ${formulaEfectiva} a TaleSpire`
              }
            >
              {esCuracion ? <Heart size={11} color="#10b981" /> : <Dices size={11} />}
              <span>{esCuracion ? `Curar ${formulaEfectiva}` : formulaEfectiva}</span>
            </button>
          )}

          {/* Botón interactivo de HP Temporal (para rasgos sin fórmula de dados, ej. Descarga de adrenalina) */}
          {!formulaEfectiva && esHpTemporalPropio && (
            <button
              type="button"
              className={estilos.botonTirarDados}
              onClick={manejarAplicarHpTemporal}
              disabled={sinUsosDisponibles}
              title={
                tieneUsosPropios
                  ? `Gastar 1 uso (${usosRestantes}/${usosMaximos}) y obtener ${valorHpTemporalCalculado} PG temporales`
                  : `Obtener ${valorHpTemporalCalculado} PG temporales`
              }
            >
              <Shield size={11} color="#38bdf8" />
              <span>+{valorHpTemporalCalculado} PG Temp</span>
            </button>
          )}

          {/* Botón para expandir modal */}
          <button
            type="button"
            className={estilos.botonIconoAccion}
            onClick={alVerDetalle}
            title="Ver descripción completa en modal"
          >
            <Maximize2 size={12} color="#94a3b8" />
          </button>

          {/* Botones de Editar y Eliminar (para rasgos personalizados / homebrew / dotes) */}
          {esHomebrewOPersonalizado && (alEditar || alEliminar) && (
            <>
              {alEditar && (
                <button
                  type="button"
                  className={estilos.botonIconoAccion}
                  onClick={(e) => {
                    e.stopPropagation();
                    alEditar();
                  }}
                  title="Editar rasgo"
                >
                  <Edit2 size={12} color="#94a3b8" strokeWidth={2} />
                </button>
              )}

              {alEliminar && (
                <button
                  type="button"
                  className={`${estilos.botonIconoAccion} ${estilos.botonIconoPeligro}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    alEliminar();
                  }}
                  title="Eliminar rasgo"
                >
                  <Trash2 size={12} color="#f87171" strokeWidth={2} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Descripción Compacta con opción de ver más */}
      {rasgo.descripcion && (
        <div
          className={estilos.cuerpoTarjetaCompacto}
          onClick={alVerDetalle}
          style={{ cursor: "pointer" }}
        >
          <p className={estilos.descripcionRasgoCompacta}>
            {textoTruncado}
            {esLargo && (
              <span className={estilos.enlaceVerMasRasgo}> Ver detalle completo</span>
            )}
          </p>
        </div>
      )}

      {/* Chips de opciones seleccionadas en selectores (ej. armas de Maestría, tamaño, revelación) */}
      {Array.isArray(rasgo.selectores) && rasgo.selectores.length > 0 && (
        <div className={estilos.contenedorChipsSelectores}>
          {rasgo.selectores.map((sel) => {
            const opcionesElegidas = sel.opciones.filter((o) => (sel.valorActual || []).includes(o.id));
            if (opcionesElegidas.length === 0) return null;
            return (
              <div key={sel.id} className={estilos.filaChipsSelector}>
                <span className={estilos.etiquetaChipsSelector}>{sel.etiqueta}:</span>
                {opcionesElegidas.map((op) => (
                  <span
                    key={op.id}
                    className={estilos.chipOpcionSeleccionada}
                    title={op.descripcion || op.nombre}
                    onClick={(e) => {
                      e.stopPropagation();
                      alVerDetalle();
                    }}
                  >
                    {op.nombre}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
};
