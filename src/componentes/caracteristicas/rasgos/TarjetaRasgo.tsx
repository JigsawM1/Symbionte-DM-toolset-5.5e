import React from "react";
import type { RasgoPersonaje } from "@/tipos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { limpiarYTruncarTextoMarkdown } from "@/utiles/formatoTextoDND";
import {
  Dices,
  Heart,
  Shield,
  Edit2,
  Trash2,
  BookOpen,
  Maximize2,
  Eye,
  EyeOff
} from "lucide-react";
import estilos from "./VistaRasgosJugador.module.css";
import {
  LIMITE_CARACTERES_DESCRIPCION,
  ICONO_POR_ACCION,
  CLASE_BADGE_ACCION,
  ETIQUETA_ACCION,
  ETIQUETA_ORIGEN,
  CLASE_ORIGEN_BORDE
} from "./TarjetaRasgo.constantes";
import { usarAccionesTarjetaRasgo } from "./usarAccionesTarjetaRasgo";

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
  esOculto?: boolean;
  alAlternarOcultar?: () => void;
}

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
  formulaDadosEfectiva,
  esOculto = false,
  alAlternarOcultar
}) => {
  const {
    usosRestantes,
    usosMaximos,
    sinUsosDisponibles,
    esRecursoEspacioPacto,
    tieneUsosPropios,
    tieneUsosPadre,
    formulaEfectiva,
    esCuracion,
    esHpTemporalPropio,
    valorHpTemporalCalculado,
    manejarTirarDados,
    manejarAplicarHpTemporal
  } = usarAccionesTarjetaRasgo({
    rasgo,
    nombrePersonaje,
    idPersonaje,
    alGastarUso,
    usosPadre,
    formulaDadosEfectiva
  });

  const claseOrigen = CLASE_ORIGEN_BORDE[rasgo.origen] || estilos.origenPersonalizado;
  const esHomebrewOPersonalizado = rasgo.personalizado || rasgo.origen === "personalizado" || rasgo.origen === "dote";

  // Truncado de descripción para tarjeta compacta
  const textoTruncado = limpiarYTruncarTextoMarkdown(rasgo.descripcion, LIMITE_CARACTERES_DESCRIPCION);
  const esLargo = (rasgo.descripcion || "").length > LIMITE_CARACTERES_DESCRIPCION;

  return (
    <article className={`${estilos.tarjetaRasgo} ${claseOrigen}`}>
      {/* Fila Superior: Título, Badges y Acciones */}
      <div className={estilos.filaSuperiorTarjeta}>
        <div
          className={estilos.tituloYBadges}
          onClick={alVerDetalle}
          title="Ver detalle completo del rasgo"
        >
          <span className={estilos.nombreRasgo}>
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
              className={`${estilos.botonToggleRasgo} ${
                rasgo.activo ? estilos.botonToggleRasgoActivo : estilos.botonToggleRasgoInactivo
              } ${deshabilitadoToggle ? estilos.botonToggleRasgoDeshabilitado : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                if (deshabilitadoToggle) return;
                alAlternarActivo();
              }}
              disabled={deshabilitadoToggle}
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

          {/* Botón para alternar ocultar/mostrar rasgo */}
          {alAlternarOcultar && (
            <button
              type="button"
              className={`${estilos.botonIconoAccion} ${esOculto ? estilos.botonIconoOcultoActivo : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                alAlternarOcultar();
              }}
              title={esOculto ? "Mostrar rasgo (restaurar a su categoría)" : "Ocultar rasgo"}
            >
              {esOculto ? <EyeOff size={12} color="#38bdf8" /> : <Eye size={12} color="#94a3b8" />}
            </button>
          )}

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
