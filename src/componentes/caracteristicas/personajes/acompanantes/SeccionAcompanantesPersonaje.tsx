import React, { useState, useCallback, useMemo } from "react";
import { PawPrint, Search, X, Link2, Unlink, Plus } from "lucide-react";
import type { PersonajeJugador, AcompanantePersonaje, MonstruoBase, HechizoBase } from "@/tipos";
import type { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import {
  usarEstadoHomebrew,
  usarEstadoIniciativa,
  usarAccionesPersonajes
} from "@/almacen/selectores";
import { TarjetaCriaturaIniciativa } from "@/componentes/caracteristicas/iniciativa/TarjetaCriaturaIniciativa";
import { PanelFichaDnD } from "@/componentes/caracteristicas/iniciativa/PanelFichaDnD";
import { formatearVelocidad, normalizarTexto } from "@/almacen/sanitizacion";
import { coincideBusquedaTolerante } from "@/utiles/busquedaTolerante";
import { generarId } from "@/utiles/generarId";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
import { construirFormulaAtaqueRapido } from "@/utiles/procesadorAtaques";
import estilos from "./SeccionAcompanantesPersonaje.module.css";

interface SeccionAcompanantesPersonajeProps {
  personaje: PersonajeJugador;
}

export const SeccionAcompanantesPersonaje: React.FC<SeccionAcompanantesPersonajeProps> = ({
  personaje
}) => {
  const { baseDatosMonstruos, baseDatosHechizos } = usarEstadoHomebrew();
  const { criaturasSeleccionadas } = usarEstadoIniciativa();
  const {
    agregarAcompanantePersonaje,
    eliminarAcompanantePersonaje,
    modificarVidaAcompanante,
    actualizarAcompanante,
    vincularMiniaturaTSAcompanante
  } = usarAccionesPersonajes();

  // Estados locales para búsqueda y modal de estadísticas
  const [busqueda, setBusqueda] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [idAcompananteDetalle, setIdAcompananteDetalle] = useState<string | null>(null);

  const acompanantes = useMemo(
    () => personaje.acompanantes || [],
    [personaje.acompanantes]
  );

  // Filtrado reactivo de monstruos del compendio
  const monstruosFiltrados = useMemo(() => {
    const qNorm = normalizarTexto(busqueda);
    if (!qNorm) return [];
    return baseDatosMonstruos
      .filter((m) =>
        coincideBusquedaTolerante([m.nombre, m.tipo, m.alineacion || ""], qNorm)
      )
      .slice(0, 8);
  }, [baseDatosMonstruos, busqueda]);

  // Manejar adición de un nuevo acompañante a partir de una plantilla
  const manejarAgregarAcompanante = useCallback(
    (plantilla: MonstruoBase) => {
      const nuevoAcompanante: AcompanantePersonaje = {
        id: generarId("acomp"),
        nombre: plantilla.nombre,
        idPlantilla: plantilla.id,
        vidaActual: plantilla.vidaMaxima,
        vidaMaxima: plantilla.vidaMaxima,
        vidaTemporal: 0,
        ca: plantilla.ca,
        condiciones: [],
        efectos: [],
        iniciativa: 0,
        idMiniaturaTS: null
      };

      agregarAcompanantePersonaje(personaje.id, nuevoAcompanante);
      setBusqueda("");
      setMostrarSugerencias(false);
    },
    [agregarAcompanantePersonaje, personaje.id]
  );

  // Manejadores estables de tiradas y vida para TarjetaCriaturaIniciativa
  const manejarCurar = useCallback(
    (acomp: AcompanantePersonaje, cant: number) => {
      const nuevaVida = Math.min(acomp.vidaMaxima, acomp.vidaActual + cant);
      modificarVidaAcompanante(personaje.id, acomp.id, nuevaVida, acomp.vidaTemporal);
    },
    [modificarVidaAcompanante, personaje.id]
  );

  const manejarDañar = useCallback(
    (acomp: AcompanantePersonaje, cant: number) => {
      const temporal = acomp.vidaTemporal || 0;
      if (temporal > 0) {
        if (cant <= temporal) {
          modificarVidaAcompanante(personaje.id, acomp.id, acomp.vidaActual, temporal - cant);
        } else {
          const excedente = cant - temporal;
          const nuevaVida = Math.max(0, acomp.vidaActual - excedente);
          modificarVidaAcompanante(personaje.id, acomp.id, nuevaVida, 0);
        }
      } else {
        const nuevaVida = Math.max(0, acomp.vidaActual - cant);
        modificarVidaAcompanante(personaje.id, acomp.id, nuevaVida, 0);
      }
    },
    [modificarVidaAcompanante, personaje.id]
  );

  const manejarCambiarTempHP = useCallback(
    (acompId: string, vidaActual: number, cant: number) => {
      modificarVidaAcompanante(personaje.id, acompId, vidaActual, cant);
    },
    [modificarVidaAcompanante, personaje.id]
  );

  const manejarAñadirCondicion = useCallback(
    (acomp: AcompanantePersonaje, condicion: string) => {
      if (acomp.condiciones.includes(condicion)) return;
      actualizarAcompanante(personaje.id, acomp.id, {
        condiciones: [...acomp.condiciones, condicion]
      });
    },
    [actualizarAcompanante, personaje.id]
  );

  const manejarQuitarCondicion = useCallback(
    (acomp: AcompanantePersonaje, condicion: string) => {
      actualizarAcompanante(personaje.id, acomp.id, {
        condiciones: acomp.condiciones.filter((c) => c !== condicion)
      });
    },
    [actualizarAcompanante, personaje.id]
  );

  const manejarAñadirEfecto = useCallback(
    (
      acomp: AcompanantePersonaje,
      nombre: string,
      duracion: number,
      opciones?: { concentracion?: boolean }
    ) => {
      const nuevoEfecto = {
        id: generarId("ef"),
        nombre,
        duracion,
        concentracion: opciones?.concentracion
      };
      actualizarAcompanante(personaje.id, acomp.id, {
        efectos: [...(acomp.efectos || []), nuevoEfecto]
      });
    },
    [actualizarAcompanante, personaje.id]
  );

  const manejarQuitarEfecto = useCallback(
    (acomp: AcompanantePersonaje, efectoId: string) => {
      actualizarAcompanante(personaje.id, acomp.id, {
        efectos: (acomp.efectos || []).filter((e) => e.id !== efectoId)
      });
    },
    [actualizarAcompanante, personaje.id]
  );

  const manejarLanzarAtaqueRapido = useCallback(
    (
      criaturaNombre: string,
      ataqueNombre: string,
      bonoAtaque: string,
      dadosDaño: string,
      tipoDaño: string
    ) => {
      const formula = construirFormulaAtaqueRapido(
        ataqueNombre,
        bonoAtaque,
        dadosDaño,
        tipoDaño,
        criaturaNombre
      );
      lanzarDadosTaleSpire(formula, `${criaturaNombre} - ${ataqueNombre}`);
    },
    []
  );

  const manejarLanzarIniciativa = useCallback(
    (acomp: AcompanantePersonaje, plantilla: MonstruoBase | null) => {
      const bono = plantilla?.iniciativaBonificador || 0;
      const formula = `!${sanitizarEtiqueta(acomp.nombre)}:1d20${bono >= 0 ? "+" : ""}${bono}`;
      lanzarDadosTaleSpire(formula, `${acomp.nombre} - Iniciativa`);
    },
    []
  );

  const manejarLanzarTiradaD20 = useCallback(
    (criaturaNombre: string, etiqueta: string, bonificador: number) => {
      const etiquetaCompleta = `${sanitizarEtiqueta(criaturaNombre)} - ${sanitizarEtiqueta(etiqueta)}`;
      const formula = `!${etiquetaCompleta}:1d20${bonificador >= 0 ? "+" : ""}${bonificador}`;
      lanzarDadosTaleSpire(formula, `${criaturaNombre} - ${etiqueta}`);
    },
    []
  );

  const obtenerPercepcionPasiva = useCallback((plantilla: MonstruoBase | null): number => {
    if (!plantilla) return 10;
    if (typeof plantilla.sentidos === "object" && plantilla.sentidos !== null) {
      return plantilla.sentidos.percepcionPasiva || 10;
    }
    return 10;
  }, []);

  // Buscar el objeto de detalle si el modal está abierto
  const acompananteEnDetalle = useMemo(() => {
    if (!idAcompananteDetalle) return null;
    return acompanantes.find((a) => a.id === idAcompananteDetalle) || null;
  }, [acompanantes, idAcompananteDetalle]);

  const plantillaEnDetalle = useMemo(() => {
    if (!acompananteEnDetalle) return null;
    return (
      baseDatosMonstruos.find((m) => m.id === acompananteEnDetalle.idPlantilla) || null
    );
  }, [acompananteEnDetalle, baseDatosMonstruos]);

  return (
    <div className={estilos.contenedorAcompanantes}>
      {/* 1. Cabecera y Buscador de Criaturas del Compendio */}
      <section className={estilos.cabeceraSeccion}>
        <div className={estilos.tituloFila}>
          <h2 className={estilos.tituloPrincipal}>
            <PawPrint size={18} className={estilos.iconoTitulo} />
            Acompañantes y Sidekicks
          </h2>
          <span className={estilos.contadorAcompanantes}>
            {acompanantes.length} {acompanantes.length === 1 ? "criatura" : "criaturas"}
          </span>
        </div>

        <div className={estilos.barraAcciones}>
          <div className={estilos.cajaBuscador}>
            <Search size={14} className={estilos.iconoBuscador} />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setMostrarSugerencias(true);
              }}
              onFocus={() => setMostrarSugerencias(true)}
              placeholder="Buscar en el compendio para añadir (ej. Lobo, Familiar, Duendecillo...)"
              className={estilos.inputBuscador}
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setMostrarSugerencias(false);
                }}
                className={estilos.botonLimpiar}
                title="Limpiar búsqueda"
              >
                <X size={12} />
              </button>
            )}

            {/* Menú flotante de resultados del compendio */}
            {mostrarSugerencias && busqueda && (
              <div className={estilos.menuSugerencias}>
                {monstruosFiltrados.length === 0 ? (
                  <div className={estilos.vacioSugerencias}>
                    No se encontraron criaturas con "{busqueda}".
                  </div>
                ) : (
                  monstruosFiltrados.map((m) => (
                    <div
                      key={m.id}
                      className={estilos.itemSugerencia}
                      onClick={() => manejarAgregarAcompanante(m)}
                    >
                      <div>
                        <span className={estilos.nombreMonstruo}>{m.nombre}</span>
                        <span className={estilos.metaMonstruo}>
                          {m.tipo} | CA {m.ca} | PV {m.vidaMaxima} | CR {m.desafio || "—"}
                        </span>
                      </div>
                      <Plus size={14} color="#38bdf8" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Listado de Acompañantes con TarjetaCriaturaIniciativa */}
      {acompanantes.length === 0 ? (
        <div className={estilos.estadoVacio}>
          <PawPrint size={32} className={estilos.iconoVacio} />
          <h3 className={estilos.textoVacioTitulo}>Sin acompañantes activos</h3>
          <p className={estilos.textoVacioDesc}>
            Utiliza el buscador superior para vincular familiares, monturas, invocaciones o
            aliados tácticos a tu personaje.
          </p>
        </div>
      ) : (
        <div className={estilos.listaAcompanantes}>
          {acompanantes.map((acomp) => {
            const plantilla =
              baseDatosMonstruos.find((m) => m.id === acomp.idPlantilla) || null;

            const criaturaAdaptada: CriaturaIniciativa = {
              id: acomp.id,
              nombre: acomp.nombre,
              iniciativa: acomp.iniciativa ?? 0,
              vidaMaxima: acomp.vidaMaxima,
              vidaActual: acomp.vidaActual,
              vidaTemporal: acomp.vidaTemporal || 0,
              ca: acomp.ca,
              condiciones: acomp.condiciones,
              efectos: acomp.efectos,
              bonificadorIniciativa: plantilla?.iniciativaBonificador ?? 0,
              esMonstruo: true,
              velocidad:
                typeof plantilla?.velocidad === "string"
                  ? plantilla.velocidad
                  : formatearVelocidad(plantilla?.velocidad),
              idPlantillaAsociada: acomp.idPlantilla
            };

            const tieneMiniVinculada = Boolean(acomp.idMiniaturaTS);
            const miniSeleccionadaEnTablero = criaturasSeleccionadas.length > 0
              ? criaturasSeleccionadas[0]
              : null;

            return (
              <div key={acomp.id} className={estilos.tarjetaWrapper}>
                <TarjetaCriaturaIniciativa
                  criatura={criaturaAdaptada}
                  esTurnoActivo={false}
                  estaSeleccionadaEnTS={Boolean(
                    acomp.idMiniaturaTS &&
                      criaturasSeleccionadas.some((c) => c.id === acomp.idMiniaturaTS)
                  )}
                  plantilla={plantilla}
                  onEliminar={() => eliminarAcompanantePersonaje(personaje.id, acomp.id)}
                  onSeleccionar={() => setIdAcompananteDetalle(acomp.id)}
                  onCurar={(cant) => manejarCurar(acomp, cant)}
                  onDañar={(cant) => manejarDañar(acomp, cant)}
                  onCambiarTempHP={(cant) =>
                    manejarCambiarTempHP(acomp.id, acomp.vidaActual, cant)
                  }
                  onAñadirCondicion={(cond) => manejarAñadirCondicion(acomp, cond)}
                  onQuitarCondicion={(cond) => manejarQuitarCondicion(acomp, cond)}
                  onAñadirEfecto={(nom, dur, opc) =>
                    manejarAñadirEfecto(acomp, nom, dur, opc)
                  }
                  onQuitarEfecto={(efId) => manejarQuitarEfecto(acomp, efId)}
                  onLanzarIniciativa={() => manejarLanzarIniciativa(acomp, plantilla)}
                  onEstablecerIniciativa={(val) =>
                    actualizarAcompanante(personaje.id, acomp.id, { iniciativa: val })
                  }
                  onLanzarAtaqueRapido={(accNom, accBono, accDados, accTipo) =>
                    manejarLanzarAtaqueRapido(acomp.nombre, accNom, accBono, accDados, accTipo)
                  }
                  obtenerPercepcionPasiva={obtenerPercepcionPasiva}
                />

                {/* Barra inferior para vinculación con miniatura 3D TaleSpire */}
                <div className={estilos.barraVinculoTS}>
                  <div className={estilos.infoVinculo}>
                    <span
                      className={`${estilos.puntoVinculo} ${
                        tieneMiniVinculada ? estilos.puntoVinculoActivo : ""
                      }`}
                    />
                    {tieneMiniVinculada ? (
                      <span>Miniatura TaleSpire vinculada</span>
                    ) : (
                      <span>Sin miniatura física en tablero</span>
                    )}
                  </div>

                  <div className={estilos.accionesVinculo}>
                    {tieneMiniVinculada ? (
                      <button
                        type="button"
                        onClick={() =>
                          vincularMiniaturaTSAcompanante(personaje.id, acomp.id, null)
                        }
                        className={estilos.botonDesvincular}
                        title="Desvincular miniatura física de TaleSpire"
                      >
                        <Unlink size={11} />
                        Desvincular
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (miniSeleccionadaEnTablero) {
                            vincularMiniaturaTSAcompanante(
                              personaje.id,
                              acomp.id,
                              miniSeleccionadaEnTablero.id
                            );
                          }
                        }}
                        disabled={!miniSeleccionadaEnTablero}
                        className={estilos.botonVincular}
                        title={
                          miniSeleccionadaEnTablero
                            ? `Vincular a miniatura seleccionada '${miniSeleccionadaEnTablero.name || "Criatura"}'`
                            : "Selecciona una miniatura en TaleSpire para vincularla"
                        }
                      >
                        <Link2 size={11} />
                        {miniSeleccionadaEnTablero
                          ? `Vincular a '${miniSeleccionadaEnTablero.name || "Mini"}'`
                          : "Selecciona mini en TaleSpire"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Modal de Estadísticas Completas (PanelFichaDnD) */}
      {idAcompananteDetalle && acompananteEnDetalle && plantillaEnDetalle && (
        <div
          className={estilos.modalFichaOverlay}
          onClick={() => setIdAcompananteDetalle(null)}
        >
          <div
            className={estilos.modalFichaContenido}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={estilos.modalFichaCabecera}>
              <h3 className={estilos.modalFichaTitulo}>
                Estadísticas: {acompananteEnDetalle.nombre}
              </h3>
              <button
                type="button"
                onClick={() => setIdAcompananteDetalle(null)}
                className={estilos.botonCerrarModal}
                title="Cerrar ficha"
              >
                <X size={16} />
              </button>
            </div>
            <div className={estilos.modalFichaCuerpo}>
              <PanelFichaDnD
                criaturaNombre={acompananteEnDetalle.nombre}
                plantilla={plantillaEnDetalle}
                baseDatosHechizos={baseDatosHechizos}
                alHacerClicHechizo={(_hechizo: HechizoBase) => {}}
                lanzarAtaqueRapido={manejarLanzarAtaqueRapido}
                lanzarTiradaD20Interactiva={manejarLanzarTiradaD20}
                obtenerPercepcionPasiva={obtenerPercepcionPasiva}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
