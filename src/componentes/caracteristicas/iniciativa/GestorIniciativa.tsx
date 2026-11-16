import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usarAlmacenDM, type CriaturaIniciativa, type HechizoBase } from "@/almacen/usarAlmacenDM";
import { usarEstadoIniciativa, usarAccionesIniciativa, usarEstadoHomebrew, usarEstadoConfiguracion } from "@/almacen/selectores";
import { obtenerPasivasCriatura, resolverPersonajePorCriatura } from "@/servicios/resolutorCriaturas";
import { resolverPlantillaCombateCriatura, obtenerPercepcionPasivaPlantilla } from "@/almacen/slices/iniciativa/utilidadesCombateIniciativa";
import { esCriaturaHorda, obtenerResumenHorda } from "@/servicios/combateHordas";
import { usarIndiceMonstruos } from "@/servicios/indiceMonstruos";
import { MonstruoBase } from "@/utiles/datosIniciales";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
import { construirFormulaAtaqueRapido } from "@/utiles/procesadorAtaques";
import { FichaHechizo } from "@/componentes/caracteristicas/compendio";
import { ModalAtaqueHorda, type DatosAtaqueHordaModal } from "./horda/ModalAtaqueHorda";
import { ItemCriaturaIniciativa, type DespachadoresItemIniciativa } from "./subcomponentes/ItemCriaturaIniciativa";
import { PanelDetalleCriaturaIniciativa } from "./subcomponentes/PanelDetalleCriaturaIniciativa";
import { Activity } from "lucide-react";
import estilosClases from "./GestorIniciativa.module.css";
import { ConfirmDialog } from "@/componentes/comunes";
import { logger } from "@/utiles/logger";

export const GestorIniciativa: React.FC = () => {
  const { colaIniciativa, indiceTurnoActivo, rondaActual, criaturasSeleccionadas, asociacionesFichas, personajes } = usarEstadoIniciativa();
  const {
    quitarCriaturaDeIniciativa,
    modificarVidaCriaturaIniciativa,
    dañarCriaturaIniciativa,
    actualizarVidaTemporal,
    asociarPlantillaACriatura,
    desvincularPlantillaDeCriatura,
    quitarCondicionDeCriatura,
    agregarCondicionACriatura,
    agregarEfectoACriatura,
    quitarEfectoDeCriatura,
    importarIniciativaTaleSpire,
    establecerIniciativaCriatura,
    modificarVidaMaximaCriaturaIniciativa,
    configurarBarrasHordaCriatura,
    seleccionarBarraActivaHorda,
    alternarModoDanoHorda,
    alternarRolCriatura,
  } = usarAccionesIniciativa();
  const { baseDatosMonstruos, baseDatosHechizos } = usarEstadoHomebrew();
  const baseDatosInvocaciones = usarAlmacenDM((s) => s.baseDatosInvocaciones);
  const { tipoTirada } = usarEstadoConfiguracion();
  const indiceMonstruos = usarIndiceMonstruos();

  const [idCriaturaDetalle, setIdCriaturaDetalle] = useState<string | null>(null);
  const [hechizoFlotanteDetalle, setHechizoFlotanteDetalle] = useState<HechizoBase | null>(null);
  const [ataqueHordaModal, setAtaqueHordaModal] = useState<DatosAtaqueHordaModal | null>(null);
  const [confirmarAccion, setConfirmarAccion] = useState<{
    titulo: string;
    mensaje: string;
    onConfirmar: () => void;
  } | null>(null);

  const refContenedorScroll = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (refContenedorScroll.current) {
      const elementoActivo = refContenedorScroll.current.querySelector('[data-turno-activo="true"]');
      if (elementoActivo) {
        elementoActivo.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [indiceTurnoActivo]);

  const obtenerPlantillaAsociada = useCallback(
    (criatura: CriaturaIniciativa): MonstruoBase | null =>
      resolverPlantillaCombateCriatura(criatura, {
        asociacionesFichas,
        indiceMonstruos,
        personajes,
        baseDatosInvocaciones
      }),
    [asociacionesFichas, indiceMonstruos, personajes, baseDatosInvocaciones]
  );

  const lanzarAtaqueRapido = useCallback((criaturaNombre: string, ataqueNombre: string, bonoAtaqueStr: string, dadosDaño: string, tipoDaño: string) => {
    const { colaIniciativa: colaActual } = usarAlmacenDM.getState();
    const criaturaHorda = colaActual.find((c) => c.nombre === criaturaNombre && esCriaturaHorda(c));
    if (criaturaHorda) {
      const resumen = obtenerResumenHorda(criaturaHorda);
      setAtaqueHordaModal({
        criaturaId: criaturaHorda.id,
        criaturaNombre: criaturaHorda.nombre,
        miembrosVivos: resumen?.vivos ?? 1,
        ataqueNombre,
        bonificadorAtaqueStr: bonoAtaqueStr,
        dadosDano: dadosDaño,
        tipoDano: tipoDaño
      });
      return;
    }
    const formulaDados = construirFormulaAtaqueRapido(ataqueNombre, bonoAtaqueStr, dadosDaño, tipoDaño, criaturaNombre);
    lanzarDadosTaleSpire(formulaDados, `${criaturaNombre} - ${ataqueNombre}`);
  }, []);

  const lanzarTiradaD20Interactiva = useCallback((criaturaNombre: string, etiqueta: string, bonificador: number) => {
    const etiquetaCompleta = `${sanitizarEtiqueta(criaturaNombre)} - ${sanitizarEtiqueta(etiqueta)}`;
    const formulaDados = `!${etiquetaCompleta}:1d20${bonificador >= 0 ? "+" : ""}${bonificador}`;
    lanzarDadosTaleSpire(formulaDados, `${criaturaNombre} - ${etiqueta}`);
  }, []);

  const alEliminarCriatura = useCallback((id: string) => {
    setIdCriaturaDetalle((prev) => (prev === id ? null : prev));
    quitarCriaturaDeIniciativa(id);
  }, [quitarCriaturaDeIniciativa]);

  const alCurarCriatura = useCallback((id: string, valor: number) => {
    const criatura = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === id);
    if (!criatura) return;
    const nuevaVida = Math.min(criatura.vidaMaxima, criatura.vidaActual + valor);
    modificarVidaCriaturaIniciativa(id, nuevaVida);
    logger.debug(`[Combat Tracker] Curación aplicada a la criatura ${id}: ${criatura.vidaActual} -> ${nuevaVida}`);
  }, [modificarVidaCriaturaIniciativa]);

  const alDañarCriatura = useCallback((id: string, valor: number) => {
    dañarCriaturaIniciativa(id, valor);
  }, [dañarCriaturaIniciativa]);

  const alSolicitarDesvincular = useCallback((criatura: { id: string; nombre: string }, plantilla: { nombre: string }) => {
    setConfirmarAccion({
      titulo: "Desvincular Plantilla",
      mensaje: `¿Estás seguro de que deseas desvincular la plantilla "${plantilla.nombre}" de la criatura "${criatura.nombre}"?`,
      onConfirmar: () => desvincularPlantillaDeCriatura(criatura.id)
    });
  }, [desvincularPlantillaDeCriatura]);

  const alCerrarDetalle = useCallback(() => setIdCriaturaDetalle(null), []);

  const alLanzarIniciativaCriatura = useCallback((criatura: CriaturaIniciativa, plantilla: MonstruoBase | null) => {
    let bonoInic = criatura.bonificadorIniciativa || 0;
    if (bonoInic === 0 && plantilla) {
      if (plantilla.iniciativaBonificador !== undefined && plantilla.iniciativaBonificador !== 0) {
        bonoInic = plantilla.iniciativaBonificador;
      } else if (plantilla.caracteristicas?.destreza !== undefined) {
        bonoInic = Math.floor((plantilla.caracteristicas.destreza - 10) / 2);
      }
    }
    lanzarDadosTaleSpire(
      `!Iniciativa:1d20${bonoInic >= 0 ? "+" : ""}${bonoInic}`,
      `Iniciativa (${criatura.nombre})`,
      { tipo: "iniciativa", criaturaId: criatura.id }
    );
  }, []);

  const despachadores = useMemo<DespachadoresItemIniciativa>(() => ({
    onEliminar: alEliminarCriatura,
    onSeleccionar: setIdCriaturaDetalle,
    onCurar: alCurarCriatura,
    onDañar: alDañarCriatura,
    onCambiarTempHP: actualizarVidaTemporal,
    onAñadirCondicion: agregarCondicionACriatura,
    onQuitarCondicion: quitarCondicionDeCriatura,
    onAñadirEfecto: agregarEfectoACriatura,
    onQuitarEfecto: quitarEfectoDeCriatura,
    onLanzarIniciativa: alLanzarIniciativaCriatura,
    onLanzarAtaqueRapido: lanzarAtaqueRapido,
    obtenerPercepcionPasiva: obtenerPercepcionPasivaPlantilla,
    onEstablecerIniciativa: establecerIniciativaCriatura,
    onEstablecerVidaMaxima: modificarVidaMaximaCriaturaIniciativa,
    onAlternarRol: alternarRolCriatura,
    onConfigurarBarrasHorda: configurarBarrasHordaCriatura,
    onSeleccionarBarraHorda: seleccionarBarraActivaHorda,
    onAlternarModoDanoHorda: alternarModoDanoHorda
  }), [
    alEliminarCriatura, alCurarCriatura, alDañarCriatura, actualizarVidaTemporal,
    agregarCondicionACriatura, quitarCondicionDeCriatura, agregarEfectoACriatura,
    quitarEfectoDeCriatura, alLanzarIniciativaCriatura, lanzarAtaqueRapido,
    establecerIniciativaCriatura, modificarVidaMaximaCriaturaIniciativa,
    alternarRolCriatura, configurarBarrasHordaCriatura, seleccionarBarraActivaHorda,
    alternarModoDanoHorda
  ]);

  const idsSeleccionadosTS = useMemo(
    () => new Set((criaturasSeleccionadas || []).map((s) => s.id)),
    [criaturasSeleccionadas]
  );

  const criaturaSeleccionadaDetalle = colaIniciativa.find((c) => c.id === idCriaturaDetalle);
  const plantillaDeDetalle = criaturaSeleccionadaDetalle ? obtenerPlantillaAsociada(criaturaSeleccionadaDetalle) : null;

  return (
    <div className={estilosClases.contenedorGestor}>
      {colaIniciativa.length === 0 ? (
        <div className={estilosClases.estadoVacio}>
          <div className={estilosClases.cajaVacia}>
            <Activity size={36} className={estilosClases.iconoActividadVacio} />
            <span className={estilosClases.textoVacioTitulo}>COLA DE INICIATIVA VACÍA</span>
            <span className={estilosClases.textoVacioSub}>
              Selecciona criaturas físicas en la mesa de TaleSpire y pulsa "Añadir a la Iniciativa" o búscalas arriba.
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                importarIniciativaTaleSpire();
              }}
              className={estilosClases.botonImportarGrande}
            >
              <Activity size={12} className={estilosClases.iconoBoton} />
              CARGAR INICIATIVA DE TALESPIRE
            </button>
          </div>
        </div>
      ) : (
        <div className={estilosClases.panelIniciativaDividido}>
          <div className={estilosClases.seccionTrackerScroll}>
            <div className={estilosClases.barraHerramientasTracker}>
              <span className={estilosClases.contadorCombatientes}>
                Combatientes Activos: {colaIniciativa.length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  importarIniciativaTaleSpire();
                }}
                className={estilosClases.botonSincronizarTS}
                title="Sincronizar e importar la iniciativa nativa de TaleSpire en caliente"
              >
                <Activity size={10} className={estilosClases.iconoBoton} />
                SINCRONIZAR TALESPIRE
              </button>
            </div>

            <div className={estilosClases.listaTarjetasIniciativa} ref={refContenedorScroll}>
              {colaIniciativa.map((criatura, indice) => (
                <ItemCriaturaIniciativa
                  key={criatura.id}
                  criatura={criatura}
                  esTurnoActivo={indice === indiceTurnoActivo}
                  estaSeleccionadaEnTS={idsSeleccionadosTS.has(criatura.id)}
                  plantilla={obtenerPlantillaAsociada(criatura)}
                  pasivasJugador={obtenerPasivasCriatura(criatura, personajes)}
                  avatarUrlPJ={criatura.avatarUrl || (!criatura.esMonstruo ? resolverPersonajePorCriatura(criatura, personajes)?.avatarUrl : undefined)}
                  rondaActual={rondaActual}
                  despachadores={despachadores}
                />
              ))}
            </div>
          </div>

          {criaturaSeleccionadaDetalle && (
            <PanelDetalleCriaturaIniciativa
              criatura={criaturaSeleccionadaDetalle}
              plantilla={plantillaDeDetalle}
              baseDatosMonstruos={baseDatosMonstruos}
              baseDatosHechizos={baseDatosHechizos}
              onAsociarPlantilla={asociarPlantillaACriatura}
              onSolicitarDesvincular={alSolicitarDesvincular}
              onCerrar={alCerrarDetalle}
              onHacerClicHechizo={setHechizoFlotanteDetalle}
              lanzarAtaqueRapido={lanzarAtaqueRapido}
              lanzarTiradaD20Interactiva={lanzarTiradaD20Interactiva}
              obtenerPercepcionPasiva={obtenerPercepcionPasivaPlantilla}
            />
          )}
        </div>
      )}

      {hechizoFlotanteDetalle && (
        <div className={estilosClases.overlayFlotante} onClick={() => setHechizoFlotanteDetalle(null)}>
          <div className={estilosClases.modalContenedor} onClick={(e) => e.stopPropagation()}>
            <FichaHechizo
              hechizo={hechizoFlotanteDetalle}
              permitirUpcastLibre={true}
              onClose={() => setHechizoFlotanteDetalle(null)}
            />
          </div>
        </div>
      )}

      {ataqueHordaModal && (
        <ModalAtaqueHorda
          datos={ataqueHordaModal}
          colaIniciativa={colaIniciativa}
          tipoTiradaGlobal={tipoTirada}
          onAplicarDanoDirecto={dañarCriaturaIniciativa}
          onCerrar={() => setAtaqueHordaModal(null)}
        />
      )}

      <ConfirmDialog
        abierto={confirmarAccion !== null}
        titulo={confirmarAccion?.titulo || ""}
        mensaje={confirmarAccion?.mensaje || ""}
        onConfirmar={() => {
          if (confirmarAccion) {
            confirmarAccion.onConfirmar();
            setConfirmarAccion(null);
          }
        }}
        onCancelar={() => setConfirmarAccion(null)}
      />
    </div>
  );
};
