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
  EyeOff,
  Sparkles
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
import { ModalTiendaRecuperacionEspacios } from "./ModalTiendaRecuperacionEspacios";
import { ModalTiendaRecargaEspacio } from "./ModalTiendaRecargaEspacio";
import { ChipsSelectoresYDadosRasgo } from "./ChipsSelectoresYDadosRasgo";

interface TarjetaRasgoProps {
  rasgo: RasgoPersonaje;
  nombrePersonaje: string;
  idPersonaje?: string;
  alGastarUso: (cantidad?: number) => void;
  alRecuperarUso: (cantidad?: number) => void;
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

  const [mostrarTiendaRecuperacion, setMostrarTiendaRecuperacion] = React.useState(false);
  const [mostrarTiendaRecarga, setMostrarTiendaRecarga] = React.useState(false);
  const personajeActivoAlmacen = usarAlmacenDM(
    React.useCallback((s) => s.personajes.find((p) => p.id === idPersonaje), [idPersonaje])
  );

  const manejarConfirmarRecuperacion = (espacios: Record<number, number>, puntosConjuro?: number) => {
    if (!idPersonaje) return;
    const { recuperarEspacioConjuro, recuperarPuntosConjuro, gastarUsoRasgoPersonaje, agregarNotificacion } = usarAlmacenDM.getState();
    let totalRanuras = 0;
    for (const [lvlStr, cant] of Object.entries(espacios)) {
      const lvl = Number(lvlStr);
      const cantidad = cant || 0;
      for (let i = 0; i < cantidad; i++) {
        recuperarEspacioConjuro(idPersonaje, lvl);
        totalRanuras++;
      }
    }
    const puntos = puntosConjuro || 0;
    if (puntos > 0) {
      recuperarPuntosConjuro(idPersonaje, puntos);
    }
    if (totalRanuras > 0 || puntos > 0) {
      gastarUsoRasgoPersonaje(idPersonaje, rasgo.id, 1);
      const partesMensaje: string[] = [];
      if (totalRanuras > 0) {
        partesMensaje.push(`${totalRanuras} ${totalRanuras === 1 ? "espacio de conjuro" : "espacios de conjuro"}`);
      }
      if (puntos > 0) {
        partesMensaje.push(`${puntos} ${puntos === 1 ? "punto de conjuro" : "puntos de conjuro"}`);
      }
      agregarNotificacion(
        `¡${rasgo.nombre}! Se han recuperado ${partesMensaje.join(" y ")}.`,
        "exito"
      );
    }
  };

  const manejarConfirmarRecargaEspacio = (nivelEspacio: number) => {
    if (!idPersonaje) return;
    const { recargarRasgoConEspacio, agregarNotificacion } = usarAlmacenDM.getState();
    recargarRasgoConEspacio(idPersonaje, rasgo.id, nivelEspacio);
    const mult = rasgo.multiplicadorRecargaEspacio ?? 2;
    agregarNotificacion(
      `¡${rasgo.nombre}! Has gastado un espacio de nivel ${nivelEspacio} y restablecido +${nivelEspacio * mult} PG temporales.`,
      "exito"
    );
  };

  const manejarTirarDadosGuardados = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!idPersonaje) return;
    const formula = formulaEfectiva || rasgo.formulaDados || "2d20";
    const match = formula.match(/^(\d+)d(\d+)$/i);
    const cant = match ? parseInt(match[1], 10) : 2;
    const caras = match ? parseInt(match[2], 10) : 20;
    const nuevosDados: number[] = [];
    for (let i = 0; i < cant; i++) {
      nuevosDados.push(Math.floor(Math.random() * caras) + 1);
    }
    usarAlmacenDM.getState().guardarDadosRasgo(idPersonaje, rasgo.id, nuevosDados);
    usarAlmacenDM.getState().agregarNotificacion(
      `¡${rasgo.nombre}! Tirada de presagio generada: ${nuevosDados.join(", ")}`,
      "exito"
    );
  };

  const esRasgoSelector =
    rasgo.categoriaMecanica === "selector_informativo" ||
    (Array.isArray(rasgo.selectores) && rasgo.selectores.length > 0 && !rasgo.requiereOpcion);

  const claseOrigen = esRasgoSelector
    ? estilos.origenSelector
    : CLASE_ORIGEN_BORDE[rasgo.origen] || estilos.origenPersonalizado;
  const esHomebrewOPersonalizado = rasgo.personalizado || rasgo.origen === "personalizado" || rasgo.origen === "dote";
  const esPreservarVida = (rasgo.nombre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes("preservar vida");

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
                  ? rasgo.recargaDescansoCorto
                    ? `Recuperación: +${rasgo.recargaDescansoCorto} en D. Corto / Todos en D. Largo`
                    : `Recuperación: ${rasgo.recuperacion === "descanso_corto" ? "Descanso Corto" : rasgo.recuperacion === "descanso_largo" ? "Descanso Largo" : rasgo.recuperacion || "Descanso"}`
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

              {rasgo.costeFijo && rasgo.costeFijo > 1 && (
                <button
                  type="button"
                  className={estilos.botonPasoUso}
                  onClick={(e) => {
                    e.stopPropagation();
                    alGastarUso(rasgo.costeFijo);
                  }}
                  disabled={usosRestantes < (rasgo.costeFijo || 1)}
                  title={`Gastar ${rasgo.costeFijo} usos de ${tieneUsosPropios ? rasgo.nombre : usosPadre?.nombre || "padre"}`}
                >
                  -{rasgo.costeFijo}
                </button>
              )}

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

          {/* Botón interactivo de Portento / Dados Guardados */}
          {rasgo.guardaDadosTirada && (
            <button
              type="button"
              className={estilos.botonTirarDados}
              onClick={manejarTirarDadosGuardados}
              title={`Tirar ${formulaEfectiva || "2d20"} y registrar dados de presagio`}
            >
              <Dices size={11} color="#a5b4fc" />
              <span>
                {Array.isArray(rasgo.dadosGuardados) && rasgo.dadosGuardados.length > 0
                  ? `Retirar (${formulaEfectiva || "2d20"})`
                  : `Tirar ${formulaEfectiva || "2d20"}`}
              </span>
            </button>
          )}

          {/* Botón de Tirada de Dados 3D / Curación regular */}
          {formulaEfectiva && !rasgo.guardaDadosTirada && (
            <button
              type="button"
              className={estilos.botonTirarDados}
              onClick={manejarTirarDados}
              disabled={sinUsosDisponibles}
              title={
                esCuracion
                  ? esPreservarVida && usosPadre
                    ? `Gastar 1 uso de ${usosPadre.nombre} (${usosRestantes}/${usosMaximos}) y disponer de ${formulaEfectiva} PV para repartir`
                    : rasgo.gastarDePadre && usosPadre
                    ? `Gastar 1 uso de ${usosPadre.nombre} (${usosRestantes}/${usosMaximos}) y curar ${formulaEfectiva}`
                    : `Gastar 1 ${formulaEfectiva.toLowerCase().includes("d") ? "dado" : "uso"} de la reserva (${usosRestantes}/${usosMaximos}) y curar ${formulaEfectiva}`
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

          {/* Botón interactivo de Recarga con Espacio de Conjuro (ej. Salvaguarda arcana) */}
          {rasgo.recargaConEspacio && (
            <button
              type="button"
              className={estilos.botonTirarDados}
              onClick={(e) => {
                e.stopPropagation();
                setMostrarTiendaRecarga(true);
              }}
              title="Gastar un espacio de conjuro para restablecer PG temporales"
            >
              <Shield size={11} color="#38bdf8" />
              <span>Recargar PG</span>
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

          {/* Botón interactivo de Recuperación de Espacios (ej. Recuperación arcana) */}
          {rasgo.recuperarEspacios && (
            <button
              type="button"
              className={estilos.botonTirarDados}
              onClick={(e) => {
                e.stopPropagation();
                setMostrarTiendaRecuperacion(true);
              }}
              disabled={sinUsosDisponibles}
              title={
                sinUsosDisponibles
                  ? "No quedan usos disponibles (requiere descanso largo)"
                  : "Abrir recuperación de espacios de conjuro"
              }
            >
              <Sparkles size={11} color="#c084fc" />
              <span>Recuperar Espacios</span>
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

      {/* Chips de selectores y dados guardados */}
      <ChipsSelectoresYDadosRasgo
        rasgo={rasgo}
        idPersonaje={idPersonaje}
        alVerDetalle={alVerDetalle}
      />

      {mostrarTiendaRecuperacion && personajeActivoAlmacen && (
        <ModalTiendaRecuperacionEspacios
          personaje={personajeActivoAlmacen}
          rasgo={rasgo}
          alCerrar={() => setMostrarTiendaRecuperacion(false)}
          alConfirmar={manejarConfirmarRecuperacion}
        />
      )}

      {mostrarTiendaRecarga && personajeActivoAlmacen && (
        <ModalTiendaRecargaEspacio
          personaje={personajeActivoAlmacen}
          rasgo={rasgo}
          alCerrar={() => setMostrarTiendaRecarga(false)}
          alConfirmar={manejarConfirmarRecargaEspacio}
        />
      )}
    </article>
  );
};
