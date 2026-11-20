import React from "react";
import { Sparkles } from "lucide-react";
import { FichaHechizo } from "@/componentes/caracteristicas/compendio/FichaHechizo";
import { obtenerBonoDanoConjuroExtra } from "@/servicios/evaluadorEfectosRasgos";
import { obtenerModificadorAptitudMagica } from "@/servicios/calculadorMagia";
import { usarAccionesConfiguracion } from "@/almacen/selectores";
import { DialogoModal } from "@/componentes/comunes/DialogoModal";
import { usarCalculoAtaquesJugador, type FiltroAccion } from "./usarCalculoAtaquesJugador";
import { CabeceraAtaquesJugador } from "./CabeceraAtaquesJugador";
import { SeccionRecursosMagicosAtaque } from "./SeccionRecursosMagicosAtaque";
import { BarraSwitchesCombate } from "./BarraSwitchesCombate";
import { DivisorSeccionAccion } from "./DivisorSeccionAccion";
import { SeccionAtaquesFisicos } from "./SeccionAtaquesFisicos";
import { SeccionAtaquesMagicos } from "./SeccionAtaquesMagicos";
import { SeccionRasgosAtaque } from "./SeccionRasgosAtaque";
import { SeccionConsumiblesAtaque } from "./SeccionConsumiblesAtaque";
import { SeccionHechizosObjetosMagicos } from "./SeccionHechizosObjetosMagicos";
import { ModalDetalleRasgo } from "@/componentes/caracteristicas/rasgos/ModalDetalleRasgo";
import { resolverExtensionesRasgos } from "@/servicios/rasgos/extensionesRasgos";
import estilos from "./VistaAtaquesJugador.module.css";

const ETIQUETA_FILTRO_ACCION: Record<FiltroAccion, string> = {
  todas: "Todas",
  accion: "Acción",
  accionAdicional: "Adicional",
  reaccion: "Reacción",
  consumibles: "Consumibles"
};

export const VistaAtaquesJugador: React.FC = () => {
  const { establecerPestaña, agregarNotificacion } = usarAccionesConfiguracion();
  const {
    personajeActivo,
    statsCalculadas,
    sistemaMagia,
    filtro,
    setFiltro,
    ocultosAbiertos,
    alternarOcultos,
    hechizoDetalle,
    setHechizoDetalle,
    rasgoDetalle,
    setRasgoDetalle,
    bonoAtaqueMagico,
    cdSalvacionConjuros,
    estaBloqueadoPorArmadura,
    motivoBloqueoArmadura,
    ataquesFisicosFiltrados,
    conjurosFiltrados,
    consumiblesFiltrados,
    hechizosObjetosFiltrados,
    rasgosSwitches,
    rasgosFiltrados,
    conteoTotal,
    conteoAccion,
    conteoAccionAdicional,
    conteoReaccion,
    conteoConsumibles,
    espaciosConjuroMaximos,
    tienePacto,
    esHechizoDeSubclase,
    lanzar,
    romperConcentracion,
    gastarUsoRasgoPersonaje,
    recuperarUsoRasgoPersonaje,
    alternarActivoRasgo,
    alternarOcultarRasgo,
    desocultarTodosLosRasgos,
    alternarConjuroEnAcciones,
    obtenerBloqueoToggleRasgo,
    resolverRecursosPadre,
    obtenerNivelEfectivoParaRasgo,
    manejarCambiarCaracteristicaArma,
    manejarTirarAtaque,
    manejarTirarDano,
    manejarTirarCritico,
    manejarAjustarMunicionArma,
    manejarUsarConsumible
  } = usarCalculoAtaquesJugador();

  const rasgoDetalleEfectivo = React.useMemo(() => {
    if (!rasgoDetalle || !personajeActivo) return null;
    const rasgosEfectivos = resolverExtensionesRasgos(personajeActivo.rasgos || [], personajeActivo.nivel);
    return rasgosEfectivos.find((r) => r.id === rasgoDetalle.id) || rasgoDetalle;
  }, [rasgoDetalle, personajeActivo]);

  const manejarAlternarConjuroEnAcciones = React.useCallback(
    (idPj: string, idHechizo: string) => {
      const estabaEnAcciones = Boolean(
        personajeActivo?.conjurosEnAcciones?.includes(idHechizo)
      );
      alternarConjuroEnAcciones(idPj, idHechizo);
      if (estabaEnAcciones) {
        agregarNotificacion(
          "Conjuro quitado de Acciones (sigue disponible en la pestaña Magia).",
          "info"
        );
      }
    },
    [personajeActivo?.conjurosEnAcciones, alternarConjuroEnAcciones, agregarNotificacion]
  );

  const irAMagia = React.useCallback(
    () => establecerPestaña("magia"),
    [establecerPestaña]
  );

  if (!personajeActivo) {
    return (
      <div className={`${estilos.contenedorGeneral} u-scroll-cef`}>
        <div className={estilos.tarjetaVacia}>No hay un personaje activo seleccionado.</div>
      </div>
    );
  }

  const hayAccionesFeed =
    ataquesFisicosFiltrados.length > 0 ||
    conjurosFiltrados.length > 0 ||
    rasgosFiltrados.length > 0 ||
    consumiblesFiltrados.length > 0 ||
    hechizosObjetosFiltrados.length > 0;

  const esVistaTodas = filtro === "todas";
  const totalMagia = conjurosFiltrados.length + hechizosObjetosFiltrados.length;
  const mostrarEstadoVacio = esVistaTodas
    ? !hayAccionesFeed && rasgosSwitches.length === 0
    : !hayAccionesFeed;

  const conteoFiltroActivo =
    esVistaTodas || !hayAccionesFeed
      ? 0
      : filtro === "accion"
      ? conteoAccion
      : filtro === "accionAdicional"
      ? conteoAccionAdicional
      : filtro === "reaccion"
      ? conteoReaccion
      : conteoConsumibles;

  const renderBloqueMagia = () => {
    if (totalMagia === 0) return null;

    const contenidoMagia = (
      <>
        <SeccionAtaquesMagicos
          conjurosFiltrados={conjurosFiltrados}
          mostrarDivisor={false}
          personajeActivo={personajeActivo}
          bonoAtaqueMagico={bonoAtaqueMagico}
          espaciosConjuroMaximos={espaciosConjuroMaximos}
          tienePacto={tienePacto}
          sistemaMagia={sistemaMagia}
          estaBloqueadoPorArmadura={estaBloqueadoPorArmadura}
          motivoBloqueoArmadura={motivoBloqueoArmadura}
          esHechizoDeSubclase={esHechizoDeSubclase}
          alAbrirDetalle={setHechizoDetalle}
          alLanzar={lanzar}
          alAlternarAcciones={manejarAlternarConjuroEnAcciones}
        />

        <SeccionHechizosObjetosMagicos
          hechizosObjetosFiltrados={hechizosObjetosFiltrados}
          mostrarDivisor={false}
          estaBloqueadoPorArmadura={estaBloqueadoPorArmadura}
          motivoBloqueoArmadura={motivoBloqueoArmadura}
          cdSalvacionPersonaje={cdSalvacionConjuros}
          alAbrirDetalle={setHechizoDetalle}
          alLanzar={lanzar}
        />
      </>
    );

    if (!esVistaTodas) {
      return contenidoMagia;
    }

    return (
      <section className={estilos.bloqueSeccionPlana} aria-label="Magia de combate">
        <DivisorSeccionAccion
          icono={<Sparkles size={13} color="var(--pj-texto-magia)" aria-hidden="true" />}
          titulo="Magia de Combate"
          conteo={totalMagia}
          tono="magia"
        />
        {contenidoMagia}
      </section>
    );
  };

  return (
    <div className={`${estilos.contenedorGeneral} u-scroll-cef`}>
      {/* Cabecera Principal con Filtros Tácticos */}
      <CabeceraAtaquesJugador
        conteoTotal={conteoTotal}
        conteoAccion={conteoAccion}
        conteoAccionAdicional={conteoAccionAdicional}
        conteoReaccion={conteoReaccion}
        conteoConsumibles={conteoConsumibles}
        filtro={filtro}
        alCambiarFiltro={setFiltro}
        statsCalculadas={statsCalculadas}
      />

      {/* Puente Compacto de Recursos Mágicos */}
      <SeccionRecursosMagicosAtaque
        personajeActivo={personajeActivo}
        espaciosConjuroMaximos={espaciosConjuroMaximos}
        tienePacto={tienePacto}
        sistemaMagia={sistemaMagia}
        alRomperConcentracion={romperConcentracion}
        alIrAMagia={irAMagia}
      />

      {/* Propuesta C: Barra Superior de Modos Activos / Switches de Combate */}
      <BarraSwitchesCombate
        personajeActivo={personajeActivo}
        rasgosSwitches={rasgosSwitches}
        alAlternarActivo={alternarActivoRasgo}
        alAbrirDetalle={setRasgoDetalle}
        obtenerBloqueoToggleRasgo={obtenerBloqueoToggleRasgo}
        resolverRecursosPadre={resolverRecursosPadre}
      />

      {/* Indicador sutil en vista filtrada */}
      {!esVistaTodas && hayAccionesFeed && (
        <div className={estilos.barraContextoFiltro}>
          <span>
            Mostrando: <strong>{ETIQUETA_FILTRO_ACCION[filtro]}</strong>
          </span>
          <span className={estilos.contadorContextoFiltro}>
            {conteoFiltroActivo}
          </span>
        </div>
      )}

      {/* Feed Táctico Plano (Propuesta A) */}
      <SeccionAtaquesFisicos
        ataquesFisicos={ataquesFisicosFiltrados}
        personajeActivo={personajeActivo}
        statsCalculadas={statsCalculadas}
        mostrarDivisor={esVistaTodas}
        alTirarAtaque={manejarTirarAtaque}
        alTirarDano={manejarTirarDano}
        alTirarCritico={manejarTirarCritico}
        alCambiarCaracteristica={manejarCambiarCaracteristicaArma}
        alAjustarMunicion={manejarAjustarMunicionArma}
      />

      {renderBloqueMagia()}

      <SeccionRasgosAtaque
        personajeActivo={personajeActivo}
        rasgosFiltrados={rasgosFiltrados}
        mostrarDivisor={esVistaTodas}
        ocultosAbiertos={ocultosAbiertos}
        alAlternarOcultos={alternarOcultos}
        alAbrirDetalle={setRasgoDetalle}
        alGastarUso={gastarUsoRasgoPersonaje}
        alRecuperarUso={recuperarUsoRasgoPersonaje}
        alAlternarActivo={alternarActivoRasgo}
        obtenerBloqueoToggleRasgo={obtenerBloqueoToggleRasgo}
        resolverRecursosPadre={resolverRecursosPadre}
        alAlternarOcultar={alternarOcultarRasgo}
        alDesocultarTodos={desocultarTodosLosRasgos}
      />

      <SeccionConsumiblesAtaque
        consumiblesFiltrados={consumiblesFiltrados}
        mostrarDivisor={esVistaTodas}
        alUsarConsumible={manejarUsarConsumible}
      />

      {/* Estado vacío cuando no hay acciones con el filtro seleccionado */}
      {mostrarEstadoVacio && (
        <div className={estilos.tarjetaVacia}>
          <p className={estilos.textoTarjetaVacia}>
            No se encontraron acciones de tipo <strong>«{ETIQUETA_FILTRO_ACCION[filtro]}»</strong> para este personaje.
          </p>
          {!esVistaTodas && conteoTotal > 0 && (
            <button
              type="button"
              className={estilos.botonRestablecerFiltro}
              onClick={() => setFiltro("todas")}
            >
              Ver todas las acciones ({conteoTotal})
            </button>
          )}
        </div>
      )}

      {/* Modal de Detalle Completo de Hechizo */}
      {hechizoDetalle && (
        <DialogoModal
          etiqueta={`Ficha de ${hechizoDetalle.nombre}`}
          alCerrar={() => setHechizoDetalle(null)}
        >
          <div
            className={estilos.overlayModalHechizo}
            onClick={() => setHechizoDetalle(null)}
          >
            <div
              className={`${estilos.contenedorModalHechizo} u-scroll-cef`}
              onClick={(e) => e.stopPropagation()}
            >
              <FichaHechizo
                hechizo={hechizoDetalle}
                nombrePersonaje={personajeActivo.nombre}
                nivelPersonaje={personajeActivo.nivel || 1}
                bonoAtaqueMagico={bonoAtaqueMagico}
                bonoDanoMagico={obtenerBonoDanoConjuroExtra(personajeActivo, {
                  esTruco: hechizoDetalle.nivel === 0,
                  nivelLanzamiento: hechizoDetalle.nivel,
                  tipoDano: hechizoDetalle.tipoDaño,
                  escuela: hechizoDetalle.escuela,
                  nombreConjuro: hechizoDetalle.nombre
                })}
                modificadorHabilidad={obtenerModificadorAptitudMagica(personajeActivo)}
                esLanzadorPacto={tienePacto}
                nivelEspacioPacto={personajeActivo.nivelEspacioPacto || 0}
                espaciosPactoMaximos={personajeActivo.espaciosPactoMaximos || 0}
                espaciosConjuroMaximos={espaciosConjuroMaximos}
                nivelConjuroMaximo={personajeActivo.nivelConjuroMaximo || 0}
                sistemaMagia={sistemaMagia}
                bloqueadoPorArmadura={estaBloqueadoPorArmadura}
                motivoBloqueoArmadura={motivoBloqueoArmadura}
                onClose={() => setHechizoDetalle(null)}
                alLanzar={async (modo, nivelLanzamiento) => {
                  const exito = await lanzar({
                    modo,
                    hechizo: hechizoDetalle,
                    nivelLanzamiento
                  });
                  if (exito) {
                    setHechizoDetalle(null);
                  }
                }}
              />
            </div>
          </div>
        </DialogoModal>
      )}

      {/* Modal de Detalle Completo de Rasgo */}
      {rasgoDetalleEfectivo && (
        <ModalDetalleRasgo
          rasgo={rasgoDetalleEfectivo}
          nombrePersonaje={personajeActivo.nombre || "Personaje"}
          idPersonaje={personajeActivo.id}
          nivelPersonaje={obtenerNivelEfectivoParaRasgo(rasgoDetalleEfectivo)}
          alCerrar={() => setRasgoDetalle(null)}
          alGastarUso={(cant?: number) =>
            gastarUsoRasgoPersonaje(personajeActivo.id, rasgoDetalleEfectivo.id, cant)
          }
          alRecuperarUso={(cant?: number) =>
            recuperarUsoRasgoPersonaje(personajeActivo.id, rasgoDetalleEfectivo.id, cant)
          }
          alAlternarActivo={() => alternarActivoRasgo(personajeActivo.id, rasgoDetalleEfectivo.id)}
          deshabilitadoToggle={obtenerBloqueoToggleRasgo(rasgoDetalleEfectivo).bloqueado}
          motivoDeshabilitado={obtenerBloqueoToggleRasgo(rasgoDetalleEfectivo).motivo}
          {...resolverRecursosPadre(rasgoDetalleEfectivo)}
        />
      )}
    </div>
  );
};
