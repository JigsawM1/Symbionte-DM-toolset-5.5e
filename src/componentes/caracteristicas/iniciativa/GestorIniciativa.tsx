import React, { useState, useRef, useEffect, useCallback } from "react";
import { CriaturaIniciativa, HechizoBase } from "@/almacen/usarAlmacenDM";
import {
  usarEstadoIniciativa,
  usarAccionesIniciativa,
  usarEstadoHomebrew,
} from "@/almacen/selectores";
import { resolverPlantillaPorCriatura, esNombreVacioODot } from "@/servicios/resolutorCriaturas";
import { usarIndiceMonstruos } from "@/servicios/indiceMonstruos";
import { MonstruoBase } from "@/utiles/datosIniciales";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
import { construirFormulaAtaqueRapido } from "@/utiles/procesadorAtaques";
import { FichaHechizo } from "@/componentes/caracteristicas/compendio";
import { TarjetaCriaturaIniciativa } from "./TarjetaCriaturaIniciativa";
import { PanelFichaDnD } from "./PanelFichaDnD";
import { VinculadorPlantilla } from "./VinculadorPlantilla";
import { Activity, FileText, X } from "lucide-react";
import estilosClases from "./GestorIniciativa.module.css";
import { ConfirmDialog } from "@/componentes/comunes";
import { logger } from "@/utiles/logger";

interface ItemCriaturaIniciativaProps {
  criatura: CriaturaIniciativa;
  esTurnoActivo: boolean;
  estaSeleccionadaEnTS: boolean;
  plantilla: MonstruoBase | null;
  rondaActual: number;
  onEliminar: (id: string) => void;
  onSeleccionar: (id: string) => void;
  onCurar: (id: string, vidaActual: number, vidaMaxima: number, cant: number) => void;
  onDañar: (id: string, vidaActual: number, vidaTemporal: number, cant: number) => void;
  onCambiarTempHP: (id: string, cant: number) => void;
  onAñadirCondicion: (id: string, cond: string) => void;
  onQuitarCondicion: (id: string, cond: string) => void;
  onAñadirEfecto: (id: string, nom: string, dur: number, opciones?: { concentracion?: boolean }) => void;
  onQuitarEfecto: (id: string, efId: string) => void;
  onLanzarIniciativa: (criatura: CriaturaIniciativa, plantilla: MonstruoBase | null) => void;
  onLanzarAtaqueRapido: (nombre: string, accNom: string, accBono: string, accDados: string, accTipo: string) => void;
  obtenerPercepcionPasiva: (plantilla: MonstruoBase | null) => number;
  onEstablecerIniciativa: (id: string, nuevaInic: number) => void;
  refTarjetaActiva: (nodo: HTMLDivElement | null) => void;
}

const ItemCriaturaIniciativa: React.FC<ItemCriaturaIniciativaProps> = React.memo(({
  criatura,
  esTurnoActivo,
  estaSeleccionadaEnTS,
  plantilla,
  rondaActual,
  onEliminar,
  onSeleccionar,
  onCurar,
  onDañar,
  onCambiarTempHP,
  onAñadirCondicion,
  onQuitarCondicion,
  onAñadirEfecto,
  onQuitarEfecto,
  onLanzarIniciativa,
  onLanzarAtaqueRapido,
  obtenerPercepcionPasiva,
  onEstablecerIniciativa,
  refTarjetaActiva
}) => {
  const manejarEliminar = useCallback(() => onEliminar(criatura.id), [onEliminar, criatura.id]);
  const manejarSeleccionar = useCallback(() => onSeleccionar(criatura.id), [onSeleccionar, criatura.id]);
  const manejarCurar = useCallback((cant: number) => onCurar(criatura.id, criatura.vidaActual, criatura.vidaMaxima, cant), [onCurar, criatura.id, criatura.vidaActual, criatura.vidaMaxima]);
  const manejarDañar = useCallback((cant: number) => onDañar(criatura.id, criatura.vidaActual, criatura.vidaTemporal || 0, cant), [onDañar, criatura.id, criatura.vidaActual, criatura.vidaTemporal]);
  const manejarCambiarTempHP = useCallback((cant: number) => onCambiarTempHP(criatura.id, cant), [onCambiarTempHP, criatura.id]);
  const manejarAñadirCondicion = useCallback((cond: string) => onAñadirCondicion(criatura.id, cond), [onAñadirCondicion, criatura.id]);
  const manejarQuitarCondicion = useCallback((cond: string) => onQuitarCondicion(criatura.id, cond), [onQuitarCondicion, criatura.id]);
  const manejarAñadirEfecto = useCallback((nom: string, dur: number, opciones?: { concentracion?: boolean }) => onAñadirEfecto(criatura.id, nom, dur, opciones), [onAñadirEfecto, criatura.id]);
  const manejarQuitarEfecto = useCallback((efId: string) => onQuitarEfecto(criatura.id, efId), [onQuitarEfecto, criatura.id]);
  const manejarLanzarIniciativa = useCallback(() => onLanzarIniciativa(criatura, plantilla), [onLanzarIniciativa, criatura, plantilla]);
  const manejarEstablecerIniciativa = useCallback((nuevaInic: number) => onEstablecerIniciativa(criatura.id, nuevaInic), [onEstablecerIniciativa, criatura.id]);
  const manejarLanzarAtaqueRapido = useCallback((accNom: string, accBono: string, accDados: string, accTipo: string) => onLanzarAtaqueRapido(criatura.nombre, accNom, accBono, accDados, accTipo), [onLanzarAtaqueRapido, criatura.nombre]);

  return (
    <div
      ref={esTurnoActivo ? refTarjetaActiva : undefined}
      data-turno-activo={esTurnoActivo ? "true" : undefined}
    >
      <TarjetaCriaturaIniciativa
        criatura={criatura}
        esTurnoActivo={esTurnoActivo}
        estaSeleccionadaEnTS={estaSeleccionadaEnTS}
        plantilla={plantilla}
        rondaActual={rondaActual}
        onEliminar={manejarEliminar}
        onSeleccionar={manejarSeleccionar}
        onCurar={manejarCurar}
        onDañar={manejarDañar}
        onCambiarTempHP={manejarCambiarTempHP}
        onAñadirCondicion={manejarAñadirCondicion}
        onQuitarCondicion={manejarQuitarCondicion}
        onAñadirEfecto={manejarAñadirEfecto}
        onQuitarEfecto={manejarQuitarEfecto}
        onLanzarIniciativa={manejarLanzarIniciativa}
        onLanzarAtaqueRapido={manejarLanzarAtaqueRapido}
        obtenerPercepcionPasiva={obtenerPercepcionPasiva}
        onEstablecerIniciativa={manejarEstablecerIniciativa}
      />
    </div>
  );
});

ItemCriaturaIniciativa.displayName = "ItemCriaturaIniciativa";

export const GestorIniciativa: React.FC = () => {
  const { colaIniciativa, indiceTurnoActivo, rondaActual, criaturasSeleccionadas, asociacionesFichas } = usarEstadoIniciativa();
  const {
    quitarCriaturaDeIniciativa,
    modificarVidaCriaturaIniciativa,
    actualizarVidaTemporal,
    asociarPlantillaACriatura,
    desvincularPlantillaDeCriatura,
    quitarCondicionDeCriatura,
    agregarCondicionACriatura,
    agregarEfectoACriatura,
    quitarEfectoDeCriatura,
    importarIniciativaTaleSpire,
    establecerIniciativaCriatura,
  } = usarAccionesIniciativa();
  const { baseDatosMonstruos, baseDatosHechizos } = usarEstadoHomebrew();

  const indiceMonstruos = usarIndiceMonstruos();

  // Estados locales
  const [idCriaturaDetalle, setIdCriaturaDetalle] = useState<string | null>(null);
  const [hechizoFlotanteDetalle, setHechizoFlotanteDetalle] = useState<HechizoBase | null>(null);
  const [confirmarAccion, setConfirmarAccion] = useState<{
    titulo: string;
    mensaje: string;
    onConfirmar: () => void;
  } | null>(null);

  // Ref para auto-scroll al turno activo
  const refContenedorScroll = useRef<HTMLDivElement>(null);

  // Callback ref para la tarjeta activa — hace scrollIntoView al montarse/cambiar
  const refTarjetaActiva = useCallback((nodo: HTMLDivElement | null) => {
    if (nodo) {
      nodo.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  // Auto-scroll cada vez que cambia el turno activo
  useEffect(() => {
    if (refContenedorScroll.current) {
      const elementoActivo = refContenedorScroll.current.querySelector('[data-turno-activo="true"]');
      if (elementoActivo) {
        elementoActivo.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [indiceTurnoActivo]);

  // Buscar plantilla de estadísticas para una criatura mediante el ResolutorCriaturas
  const obtenerPlantillaAsociada = (criatura: CriaturaIniciativa): MonstruoBase | null => {
    return resolverPlantillaPorCriatura(
      criatura.id,
      criatura.nombre,
      asociacionesFichas,
      indiceMonstruos
    ) || null;
  };

  // Cómputo de Percepción Pasiva (Lectura directa O(1) ya que los datos están saneados en la base de datos)
  const obtenerPercepcionPasiva = (plantilla: MonstruoBase | null): number => {
    if (!plantilla) return 10;

    if (plantilla.sentidos && typeof plantilla.sentidos === "object" && "percepcionPasiva" in plantilla.sentidos) {
      return (plantilla.sentidos as { percepcionPasiva?: number }).percepcionPasiva ?? 10;
    }

    return 10;
  };

  // Lanzar Ataques y Habilidades en TaleSpire 3D
  const lanzarAtaqueRapido = (criaturaNombre: string, ataqueNombre: string, bonoAtaqueStr: string, dadosDaño: string, tipoDaño: string) => {
    const formulaDados = construirFormulaAtaqueRapido(ataqueNombre, bonoAtaqueStr, dadosDaño, tipoDaño, criaturaNombre);
    lanzarDadosTaleSpire(formulaDados, `${criaturaNombre} - ${ataqueNombre}`);
  };

  const lanzarTiradaD20Interactiva = (criaturaNombre: string, etiqueta: string, bonificador: number) => {
    const etiquetaCompleta = `${sanitizarEtiqueta(criaturaNombre)} - ${sanitizarEtiqueta(etiqueta)}`;
    const formulaDados = `!${etiquetaCompleta}:1d20${bonificador >= 0 ? "+" : ""}${bonificador}`;
    lanzarDadosTaleSpire(formulaDados, `${criaturaNombre} - ${etiqueta}`);
  };

  // Callbacks estables para manipulación de criaturas (PERF-01)
  const alEliminarCriatura = useCallback((id: string) => {
    setIdCriaturaDetalle((prev) => (prev === id ? null : prev));
    quitarCriaturaDeIniciativa(id);
  }, [quitarCriaturaDeIniciativa]);

  const alSeleccionarCriatura = useCallback((id: string) => {
    setIdCriaturaDetalle(id);
  }, []);

  const alCurarCriatura = useCallback((id: string, actual: number, maximo: number, valor: number) => {
    const nuevaVida = Math.min(maximo, actual + valor);
    modificarVidaCriaturaIniciativa(id, nuevaVida);
    logger.debug(`[Combat Tracker] Curación aplicada a la criatura ${id}: ${actual} -> ${nuevaVida}`);
  }, [modificarVidaCriaturaIniciativa]);

  const alDañarCriatura = useCallback((id: string, actual: number, temporal: number, valor: number) => {
    if (temporal > 0) {
      if (valor <= temporal) {
        actualizarVidaTemporal(id, temporal - valor);
      } else {
        const excedente = valor - temporal;
        actualizarVidaTemporal(id, 0);
        const nuevaVida = Math.max(0, actual - excedente);
        modificarVidaCriaturaIniciativa(id, nuevaVida);
      }
    } else {
      const nuevaVida = Math.max(0, actual - valor);
      modificarVidaCriaturaIniciativa(id, nuevaVida);
    }
  }, [actualizarVidaTemporal, modificarVidaCriaturaIniciativa]);

  const alCambiarTempHPCriatura = useCallback((id: string, cant: number) => {
    actualizarVidaTemporal(id, cant);
  }, [actualizarVidaTemporal]);

  const alAñadirCondicionCriatura = useCallback((id: string, cond: string) => {
    agregarCondicionACriatura(id, cond);
  }, [agregarCondicionACriatura]);

  const alQuitarCondicionCriatura = useCallback((id: string, cond: string) => {
    quitarCondicionDeCriatura(id, cond);
  }, [quitarCondicionDeCriatura]);

  const alAñadirEfectoCriatura = useCallback((id: string, nom: string, dur: number, opciones?: { concentracion?: boolean }) => {
    agregarEfectoACriatura(id, nom, dur, opciones);
  }, [agregarEfectoACriatura]);

  const alQuitarEfectoCriatura = useCallback((id: string, efId: string) => {
    quitarEfectoDeCriatura(id, efId);
  }, [quitarEfectoDeCriatura]);

  const alEstablecerIniciativaCriatura = useCallback((id: string, nuevaInic: number) => {
    establecerIniciativaCriatura(id, nuevaInic);
  }, [establecerIniciativaCriatura]);

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

  const alLanzarAtaqueRapidoCriatura = useCallback((criaturaNombre: string, ataqueNombre: string, bonoAtaqueStr: string, dadosDaño: string, tipoDaño: string) => {
    const formulaDados = construirFormulaAtaqueRapido(ataqueNombre, bonoAtaqueStr, dadosDaño, tipoDaño, criaturaNombre);
    lanzarDadosTaleSpire(formulaDados, `${criaturaNombre} - ${ataqueNombre}`);
  }, []);

  const criaturaSeleccionadaDetalle = colaIniciativa.find((c) => c.id === idCriaturaDetalle);
  
  const plantillaDeDetalle = criaturaSeleccionadaDetalle ? obtenerPlantillaAsociada(criaturaSeleccionadaDetalle) : null;

  return (
    <div className={estilosClases.contenedorGestor}>
      {colaIniciativa.length === 0 ? (
        <div className={estilosClases.estadoVacio}>
          <div className={estilosClases.cajaVacia}>
            <Activity size={36} style={{ color: "var(--color-borde-cian)", marginBottom: "8px" }} />
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
              <Activity size={12} style={{ marginRight: "4px" }} />
              CARGAR INICIATIVA DE TALESPIRE
            </button>
          </div>
        </div>
      ) : (
        <div className={estilosClases.panelIniciativaDividido}>
          {/* SECCIÓN SUPERIOR: COMBAT TRACKER */}
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
                <Activity size={10} style={{ marginRight: "4px" }} />
                SINCRONIZAR TALESPIRE
              </button>
            </div>

            <div className={estilosClases.listaTarjetasIniciativa} ref={refContenedorScroll}>
              {colaIniciativa.map((criatura, indice) => {
                const esTurnoActivo = indice === indiceTurnoActivo;
                const estaSeleccionadaEnTS = (criaturasSeleccionadas || []).some((s) => s.id === criatura.id);
                const plantilla = obtenerPlantillaAsociada(criatura);
                return (
                  <ItemCriaturaIniciativa
                    key={criatura.id}
                    criatura={criatura}
                    esTurnoActivo={esTurnoActivo}
                    estaSeleccionadaEnTS={estaSeleccionadaEnTS}
                    plantilla={plantilla}
                    rondaActual={rondaActual}
                    onEliminar={alEliminarCriatura}
                    onSeleccionar={alSeleccionarCriatura}
                    onCurar={alCurarCriatura}
                    onDañar={alDañarCriatura}
                    onCambiarTempHP={alCambiarTempHPCriatura}
                    onAñadirCondicion={alAñadirCondicionCriatura}
                    onQuitarCondicion={alQuitarCondicionCriatura}
                    onAñadirEfecto={alAñadirEfectoCriatura}
                    onQuitarEfecto={alQuitarEfectoCriatura}
                    onLanzarIniciativa={alLanzarIniciativaCriatura}
                    onLanzarAtaqueRapido={alLanzarAtaqueRapidoCriatura}
                    obtenerPercepcionPasiva={obtenerPercepcionPasiva}
                    onEstablecerIniciativa={alEstablecerIniciativaCriatura}
                    refTarjetaActiva={refTarjetaActiva}
                  />
                );
              })}
            </div>
          </div>

          {/* SECCIÓN INFERIOR: BLOQUE DE ESTADÍSTICAS */}
          {criaturaSeleccionadaDetalle && (
            <div className={estilosClases.panelDetalleInferior}>
              <div className={estilosClases.cabeceraDetalleFicha}>
                <div className={estilosClases.tituloFichaIzquierda}>
                  <FileText size={13} style={{ color: "var(--color-borde-cian)", marginRight: "5px" }} />
                  <span className={estilosClases.nombreFichaCabecera}>
                    {esNombreVacioODot(criaturaSeleccionadaDetalle.nombre) 
                      ? `[MINI SIN NOMBRE: ${criaturaSeleccionadaDetalle.id.slice(-4).toUpperCase()}]`
                      : criaturaSeleccionadaDetalle.nombre.toUpperCase()}
                  </span>
                  {plantillaDeDetalle && (
                    <div style={{ display: "flex", alignItems: "center", gap: "2px", marginLeft: "4px" }}>
                      <span className={estilosClases.subFichaAsociada}>
                        [ {plantillaDeDetalle.nombre.toUpperCase()} ]
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setConfirmarAccion({
                            titulo: "Desvincular Plantilla",
                            mensaje: `¿Estás seguro de que deseas desvincular la plantilla "${plantillaDeDetalle.nombre}" de la criatura "${criaturaSeleccionadaDetalle.nombre}"?`,
                            onConfirmar: () => desvincularPlantillaDeCriatura(criaturaSeleccionadaDetalle.id)
                          });
                        }}
                        className={estilosClases.botonDesvincularMini}
                        title="Desvincular plantilla"
                        style={{ display: "inline-flex" }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIdCriaturaDetalle(null)}
                  className={estilosClases.botonCerrarDetalle}
                >
                  <X size={14} />
                </button>
              </div>

              <div className={estilosClases.cuerpoDetalleScroll}>
                {!plantillaDeDetalle ? (
                  <VinculadorPlantilla
                    criaturaId={criaturaSeleccionadaDetalle.id}
                    baseDatosMonstruos={baseDatosMonstruos}
                    onAsociar={asociarPlantillaACriatura}
                  />
                ) : (
                  <PanelFichaDnD
                    criaturaNombre={criaturaSeleccionadaDetalle.nombre}
                    plantilla={plantillaDeDetalle}
                    baseDatosHechizos={baseDatosHechizos}
                    alHacerClicHechizo={setHechizoFlotanteDetalle}
                    lanzarAtaqueRapido={lanzarAtaqueRapido}
                    lanzarTiradaD20Interactiva={lanzarTiradaD20Interactiva}
                    obtenerPercepcionPasiva={obtenerPercepcionPasiva}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal flotante e independiente con el detalle del hechizo seleccionado */}
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

      {/* Modal de confirmación personalizado de alta calidad */}
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
