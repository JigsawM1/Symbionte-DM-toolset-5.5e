import React, { useState } from "react";
import { usarAlmacenDM, CriaturaIniciativa } from "../almacen/usarAlmacenDM";
import { MonstruoBase } from "../utiles/datosIniciales";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "../utiles/lanzadorDados";
import { ModalDetalleHechizo } from "./ModalDetalleHechizo";
import { TarjetaCriaturaIniciativa } from "./iniciativa/TarjetaCriaturaIniciativa";
import { PanelFichaDnD } from "./iniciativa/PanelFichaDnD";
import { VinculadorPlantilla } from "./iniciativa/VinculadorPlantilla";
import { Activity, FileText, X } from "lucide-react";
import estilosClases from "./GestorIniciativa.module.css";

export const GestorIniciativa: React.FC = () => {
  const {
    colaIniciativa,
    indiceTurnoActivo,
    baseDatosMonstruos,
    baseDatosHechizos,
    quitarCriaturaDeIniciativa,
    modificarVidaCriaturaIniciativa,
    actualizarVidaTemporal,
    asociarPlantillaACriatura,
    quitarCondicionDeCriatura,
    agregarCondicionACriatura,
    agregarEfectoACriatura,
    quitarEfectoDeCriatura,
    importarIniciativaTaleSpire
  } = usarAlmacenDM();

  // Estados locales
  const [idCriaturaDetalle, setIdCriaturaDetalle] = useState<string | null>(null);
  const [hechizoFlotanteDetalle, setHechizoFlotanteDetalle] = useState<any | null>(null);

  // Buscar plantilla de estadísticas para una criatura
  const obtenerPlantillaAsociada = (criatura: CriaturaIniciativa): MonstruoBase | null => {
    if (criatura.idPlantillaAsociada) {
      return baseDatosMonstruos.find((m) => m.id === criatura.idPlantillaAsociada) || null;
    }
    return baseDatosMonstruos.find((m) => m.nombre.toLowerCase() === criatura.nombre.toLowerCase()) || null;
  };

  // Cómputo de Percepción Pasiva
  const obtenerPercepcionPasiva = (plantilla: MonstruoBase | null): number => {
    if (!plantilla) return 10;

    if (plantilla.sentidos) {
      const match = String(plantilla.sentidos).match(/percepci[oó]n\s+pasiva\s*[:\s]\s*(\d+)/i);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    const sab = plantilla.caracteristicas?.sabiduria ?? 10;
    const modSab = Math.floor((sab - 10) / 2);
    
    const percBono = plantilla.habilidades?.percepcion;
    if (percBono !== undefined) {
      return 10 + percBono;
    }

    return 10 + modSab;
  };

  // Lanzar Ataques y Habilidades en TaleSpire 3D
  const lanzarAtaqueRapido = (criaturaNombre: string, ataqueNombre: string, bonoAtaqueStr: string, dadosDaño: string, tipoDaño: string) => {
    const bono = parseInt(bonoAtaqueStr.replace(/[^\d-]/g, ""), 10) || 0;
    const formulaDados = `!Ataque ${sanitizarEtiqueta(ataqueNombre)}:1d20${bono >= 0 ? "+" : ""}${bono}/Daño ${sanitizarEtiqueta(tipoDaño)}:${dadosDaño.replace(/\s+/g, "")}`;
    lanzarDadosTaleSpire(formulaDados, `${criaturaNombre} - ${ataqueNombre}`);
  };

  const lanzarTiradaD20Interactiva = (criaturaNombre: string, etiqueta: string, bonificador: number) => {
    const formulaDados = `!${sanitizarEtiqueta(etiqueta)}:1d20${bonificador >= 0 ? "+" : ""}${bonificador}`;
    lanzarDadosTaleSpire(formulaDados, `${criaturaNombre} - ${etiqueta}`);
  };

  // Métodos de HP controlados
  const aplicarCuracion = (id: string, actual: number, maximo: number, valor: number) => {
    const nuevaVida = Math.min(maximo, actual + valor);
    modificarVidaCriaturaIniciativa(id, nuevaVida);
    if ((window as any).TS) {
      (window as any).TS.debug.log(`[Combat Tracker] Curación aplicada a la criatura ${id}: ${actual} -> ${nuevaVida}`);
    }
  };

  const aplicarDaño = (id: string, actual: number, temporal: number, valor: number) => {
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
  };

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

            <div className={estilosClases.listaTarjetasIniciativa}>
              {colaIniciativa.map((criatura, indice) => {
                const esTurnoActivo = indice === indiceTurnoActivo;
                const plantilla = obtenerPlantillaAsociada(criatura);
                return (
                  <TarjetaCriaturaIniciativa
                    key={criatura.id}
                    criatura={criatura}
                    esTurnoActivo={esTurnoActivo}
                    plantilla={plantilla}
                    onEliminar={() => {
                      if (idCriaturaDetalle === criatura.id) {
                        setIdCriaturaDetalle(null);
                      }
                      quitarCriaturaDeIniciativa(criatura.id);
                    }}
                    onSeleccionar={() => {
                      setIdCriaturaDetalle(criatura.id);
                    }}
                    onCurar={(cant) => aplicarCuracion(criatura.id, criatura.vidaActual, criatura.vidaMaxima, cant)}
                    onDañar={(cant) => aplicarDaño(criatura.id, criatura.vidaActual, criatura.vidaTemporal || 0, cant)}
                    onCambiarTempHP={(cant) => actualizarVidaTemporal(criatura.id, cant)}
                    onAñadirCondicion={(cond) => agregarCondicionACriatura(criatura.id, cond)}
                    onQuitarCondicion={(cond) => quitarCondicionDeCriatura(criatura.id, cond)}
                    onAñadirEfecto={(nom, dur) => agregarEfectoACriatura(criatura.id, nom, dur)}
                    onQuitarEfecto={(efId) => quitarEfectoDeCriatura(criatura.id, efId)}
                    onLanzarIniciativa={() => lanzarDadosTaleSpire(
                      `!Iniciativa:1d20${(criatura.bonificadorIniciativa ?? 0) >= 0 ? "+" : ""}${criatura.bonificadorIniciativa ?? 0}`, 
                      `Iniciativa (${criatura.nombre})`,
                      { tipo: "iniciativa", criaturaId: criatura.id }
                    )}
                    onLanzarAtaqueRapido={(accNom, accBono, accDados, accTipo) => 
                      lanzarAtaqueRapido(criatura.nombre, accNom, accBono, accDados, accTipo)
                    }
                    obtenerPercepcionPasiva={obtenerPercepcionPasiva}
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
                    {criaturaSeleccionadaDetalle.nombre.toUpperCase()}
                  </span>
                  {plantillaDeDetalle && (
                    <span className={estilosClases.subFichaAsociada}>
                      [ {plantillaDeDetalle.nombre.toUpperCase()} ]
                    </span>
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
        <ModalDetalleHechizo
          hechizo={hechizoFlotanteDetalle}
          onClose={() => setHechizoFlotanteDetalle(null)}
        />
      )}
    </div>
  );
};
