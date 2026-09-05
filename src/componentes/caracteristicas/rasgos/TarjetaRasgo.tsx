import React from "react";
import type { RasgoPersonaje, TipoAccionRasgo, OrigenRasgo } from "@/tipos";
import { lanzarDadosTaleSpire, type MetadataEspecialRasgo } from "@/utiles/lanzadorDados";
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
  alEditar: () => void;
  alEliminar: () => void;
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
  dote: "Dote",
  trasfondo: "Trasfondo",
  personalizado: "Personalizado / Homebrew"
};

const CLASE_ORIGEN_BORDE: Record<OrigenRasgo, string> = {
  clase: estilos.origenClase,
  subclase: estilos.origenSubclase,
  especie: estilos.origenEspecie,
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
  const tieneEfectoHpTemporal =
    (rasgo.efectos || []).some((ef) => ef.tipo === "hp_temporal") ||
    rasgo.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes("manto de inspiracion");

  const manejarTirarDados = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!formulaEfectiva) return;
    if (sinUsosDisponibles) return;

    try {
      if ((esCuracion || tieneEfectoHpTemporal || rasgo.gastarDePadre) && alGastarUso) {
        alGastarUso();
      }
      const formula = `!${rasgo.nombre}:${formulaEfectiva}`;
      const etiqueta = `${nombrePersonaje} - ${rasgo.nombre} (${formulaEfectiva})`;

      let metaEspecial: MetadataEspecialRasgo | undefined = undefined;
      if (esCuracion && idPersonaje) {
        metaEspecial = {
          tipo: "curacionRasgo",
          personajeId: idPersonaje,
          rasgoId: rasgo.id,
          nombreRasgo: rasgo.nombre,
          cantidadDadosGastados: 1
        };
      } else if (tieneEfectoHpTemporal && idPersonaje) {
        const efectoHp = (rasgo.efectos || []).find((ef) => ef.tipo === "hp_temporal");
        let multiplicador = 1;
        if (efectoHp?.valor) {
          if (efectoHp.valor === "2_veces_dado_inspiracion") {
            multiplicador = 2;
          } else {
            const num = Number(efectoHp.valor);
            if (!Number.isNaN(num) && num > 0) multiplicador = num;
          }
        } else if (rasgo.nombre.toLowerCase().includes("manto de inspiracion")) {
          multiplicador = 2;
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
      console.error("[TarjetaRasgo] Error al tirar dados:", error);
    }
  };

  const claseOrigen = CLASE_ORIGEN_BORDE[rasgo.origen] || estilos.origenPersonalizado;
  const esHomebrewOPersonalizado = rasgo.personalizado || rasgo.origen === "personalizado" || rasgo.origen === "dote";

  // Truncado de descripción para tarjeta compacta
  const textoLimpio = (rasgo.descripcion || "")
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .trim();
  const LIMITE_CARACTERES = 115;
  const esLargo = textoLimpio.length > LIMITE_CARACTERES;
  const textoTruncado = esLargo ? `${textoLimpio.slice(0, LIMITE_CARACTERES)}...` : textoLimpio;

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

          {/* Contador de Usos (Propios o de Rasgo Padre) */}
          {(tieneUsosPropios || tieneUsosPadre) && (
            <div
              className={estilos.contadorUsos}
              title={
                tieneUsosPropios
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
                  alGastarUso();
                }}
                disabled={usosRestantes <= 0}
                title={tieneUsosPropios ? "Gastar 1 uso" : `Gastar 1 uso de ${usosPadre?.nombre || "padre"}`}
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
                  alRecuperarUso();
                }}
                disabled={usosRestantes >= usosMaximos}
                title={tieneUsosPropios ? "Recuperar 1 uso" : `Recuperar 1 uso de ${usosPadre?.nombre || "padre"}`}
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
                  : rasgo.gastarDePadre && usosPadre
                  ? `Lanzar ${formulaEfectiva} a TaleSpire (Gasta 1 uso de ${usosPadre.nombre}: ${usosRestantes}/${usosMaximos})`
                  : `Lanzar ${formulaEfectiva} a TaleSpire`
              }
            >
              {esCuracion ? <Heart size={11} color="#10b981" /> : <Dices size={11} />}
              <span>{esCuracion ? `Curar ${formulaEfectiva}` : formulaEfectiva}</span>
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
          {esHomebrewOPersonalizado && (
            <>
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

      {/* Chips de opciones seleccionadas en selectores (ej. armas de Maestría) */}
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
