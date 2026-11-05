import React, { useState, useCallback, useMemo } from "react";
import { PawPrint } from "lucide-react";
import type {
  PersonajeJugador,
  AcompanantePersonaje,
  MonstruoBase,
  PlantillaInvocacion
} from "@/tipos";
import {
  CATALOGO_INVOCACIONES,
  esIdInvocacionEscalable,
  obtenerPlantillaInvocacionPorId,
  proyectarInvocacionAMonstruo,
  extraerContextoLanzador
} from "@/servicios/factoriaInvocaciones";
import {
  usarEstadoHomebrew,
  usarEstadoIniciativa,
  usarAccionesPersonajes
} from "@/almacen/selectores";
import { ModalEstadisticasAcompanante } from "./ModalEstadisticasAcompanante";
import { normalizarTexto } from "@/almacen/sanitizacion";
import { coincideBusquedaTolerante } from "@/utiles/busquedaTolerante";
import { generarId } from "@/utiles/generarId";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
import { construirFormulaAtaqueRapido } from "@/utiles/procesadorAtaques";
import { ItemAcompanante } from "./ItemAcompanante";
import { CabeceraBuscadorAcompanantes } from "./CabeceraBuscadorAcompanantes";
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
    actualizarAcompanante
  } = usarAccionesPersonajes();

  // Estados locales para búsqueda y modal de estadísticas
  const [busqueda, setBusqueda] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [idAcompananteDetalle, setIdAcompananteDetalle] = useState<string | null>(null);

  const acompanantes = useMemo(
    () => personaje.acompanantes || [],
    [personaje.acompanantes]
  );

  // Contexto del lanzador para escalar invocaciones reactivamente
  const contextoLanzador = useMemo(
    () => extraerContextoLanzador(personaje),
    [personaje]
  );

  // Filtrado reactivo unificado del compendio: Invocaciones PHB 2024 + Monstruos
  const resultadosFiltrados = useMemo(() => {
    const qNorm = normalizarTexto(busqueda);
    if (!qNorm) return [];

    const invocaciones = CATALOGO_INVOCACIONES.filter((inv) =>
      coincideBusquedaTolerante([inv.nombre, inv.tipoCriatura, inv.conjuroAsociado], qNorm)
    ).map((inv) => ({
      esInvocacion: true as const,
      invocacion: inv,
      id: inv.id,
      nombre: inv.nombre,
      tipo: inv.tipoCriatura,
      ca: inv.formulaCA.base,
      vidaMaxima: inv.formulaVida.base,
      desafio: `Invocación (Nv. ${inv.nivelMinimo}-${inv.nivelMaximo})`,
      conjuroAsociado: inv.conjuroAsociado
    }));

    const monstruos = [];
    for (const m of baseDatosMonstruos) {
      if (coincideBusquedaTolerante([m.nombre, m.tipo, m.alineacion || ""], qNorm)) {
        monstruos.push({
          esInvocacion: false as const,
          monstruo: m,
          id: m.id,
          nombre: m.nombre,
          tipo: m.tipo,
          ca: m.ca,
          vidaMaxima: m.vidaMaxima,
          desafio: m.desafio || "—",
        });
        if (monstruos.length >= 8) break;
      }
    }

    return [...invocaciones, ...monstruos].slice(0, 10);
  }, [baseDatosMonstruos, busqueda]);

  // Manejar adición de un nuevo acompañante a partir de una plantilla tradicional
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
        idMiniaturaTS: null,
        velocidad: plantilla.velocidad || "30 pies",
        movimientoGastado: 0,
        movimientoMaximoTemporal: null,
        tipoTerreno: "normal",
        multiplicadorTerreno: 1,
        ultimaPosicionTS: null,
        ultimoBoardIdTS: null,
        historialMovimiento: [],
        esInvocacion: false
      };

      agregarAcompanantePersonaje(personaje.id, nuevoAcompanante);
      setBusqueda("");
      setMostrarSugerencias(false);
    },
    [agregarAcompanantePersonaje, personaje.id]
  );

  // Manejar adición de una invocación escalable (D&D 5.5e / PHB 2024)
  const manejarAgregarInvocacion = useCallback(
    (plantillaInv: PlantillaInvocacion) => {
      const nivelBase = plantillaInv.nivelMinimo;
      const subtipoBase = plantillaInv.subtiposDisponibles[0] || "";
      const proy = proyectarInvocacionAMonstruo(
        plantillaInv,
        nivelBase,
        contextoLanzador,
        subtipoBase
      );

      const nuevoAcompanante: AcompanantePersonaje = {
        id: generarId("acomp"),
        nombre: plantillaInv.nombre,
        idPlantilla: plantillaInv.id,
        vidaActual: proy.vidaMaxima,
        vidaMaxima: proy.vidaMaxima,
        vidaTemporal: 0,
        ca: proy.ca,
        condiciones: [],
        efectos: [],
        iniciativa: 0,
        idMiniaturaTS: null,
        velocidad: proy.velocidad || "30 pies",
        movimientoGastado: 0,
        movimientoMaximoTemporal: null,
        tipoTerreno: "normal",
        multiplicadorTerreno: 1,
        ultimaPosicionTS: null,
        ultimoBoardIdTS: null,
        historialMovimiento: [],
        esInvocacion: true,
        nivelConjuroInvocacion: nivelBase,
        subtipoInvocacion: subtipoBase
      };

      agregarAcompanantePersonaje(personaje.id, nuevoAcompanante);
      setBusqueda("");
      setMostrarSugerencias(false);
    },
    [agregarAcompanantePersonaje, contextoLanzador, personaje.id]
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
      lanzarDadosTaleSpire(formula, `${acomp.nombre} - Iniciativa`, {
        tipo: "iniciativa",
        criaturaId: acomp.id,
        idPersonaje: personaje.id,
        idAcompanante: acomp.id,
        nombrePersonaje: acomp.nombre,
        idMiniaturaTS: acomp.idMiniaturaTS,
      });
    },
    [personaje.id]
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

  // Manejar cambio dinámico del nivel de conjuro para una invocación escalable
  const manejarCambiarNivelConjuro = useCallback(
    (acomp: AcompanantePersonaje, plantillaInv: PlantillaInvocacion, nuevoNivel: number) => {
      const proy = proyectarInvocacionAMonstruo(
        plantillaInv,
        nuevoNivel,
        contextoLanzador,
        acomp.subtipoInvocacion
      );
      const estabaLleno = acomp.vidaActual >= acomp.vidaMaxima;
      const nuevaVidaActual = estabaLleno
        ? proy.vidaMaxima
        : Math.min(acomp.vidaActual, proy.vidaMaxima);

      actualizarAcompanante(personaje.id, acomp.id, {
        nivelConjuroInvocacion: nuevoNivel,
        vidaMaxima: proy.vidaMaxima,
        vidaActual: nuevaVidaActual,
        ca: proy.ca,
        velocidad: proy.velocidad
      });
    },
    [actualizarAcompanante, contextoLanzador, personaje.id]
  );

  // Manejar cambio dinámico del subtipo para una invocación
  const manejarCambiarSubtipo = useCallback(
    (acomp: AcompanantePersonaje, plantillaInv: PlantillaInvocacion, nuevoSubtipo: string) => {
      const proy = proyectarInvocacionAMonstruo(
        plantillaInv,
        acomp.nivelConjuroInvocacion || plantillaInv.nivelMinimo,
        contextoLanzador,
        nuevoSubtipo
      );
      actualizarAcompanante(personaje.id, acomp.id, {
        subtipoInvocacion: nuevoSubtipo,
        ca: proy.ca,
        velocidad: proy.velocidad
      });
    },
    [actualizarAcompanante, contextoLanzador, personaje.id]
  );

  // Buscar el objeto de detalle si el modal está abierto
  const acompananteEnDetalle = useMemo(() => {
    if (!idAcompananteDetalle) return null;
    return acompanantes.find((a) => a.id === idAcompananteDetalle) || null;
  }, [acompanantes, idAcompananteDetalle]);

  const plantillaEnDetalle = useMemo(() => {
    if (!acompananteEnDetalle) return null;
    if (esIdInvocacionEscalable(acompananteEnDetalle.idPlantilla)) {
      const inv = obtenerPlantillaInvocacionPorId(acompananteEnDetalle.idPlantilla);
      if (inv) {
        return proyectarInvocacionAMonstruo(
          inv,
          acompananteEnDetalle.nivelConjuroInvocacion || inv.nivelMinimo,
          contextoLanzador,
          acompananteEnDetalle.subtipoInvocacion
        );
      }
    }
    return (
      baseDatosMonstruos.find((m) => m.id === acompananteEnDetalle.idPlantilla) || null
    );
  }, [acompananteEnDetalle, baseDatosMonstruos, contextoLanzador]);

  return (
    <div className={estilos.contenedorAcompanantes}>
      {/* 1. Cabecera y Buscador de Criaturas del Compendio */}
      <CabeceraBuscadorAcompanantes
        totalAcompanantes={acompanantes.length}
        busqueda={busqueda}
        alCambiarBusqueda={setBusqueda}
        mostrarSugerencias={mostrarSugerencias}
        setMostrarSugerencias={setMostrarSugerencias}
        resultadosFiltrados={resultadosFiltrados}
        alSeleccionarInvocacion={manejarAgregarInvocacion}
        alSeleccionarMonstruo={manejarAgregarAcompanante}
      />

      {/* 2. Listado de Acompañantes */}
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
            const plantillaInvocacion = esIdInvocacionEscalable(acomp.idPlantilla)
              ? obtenerPlantillaInvocacionPorId(acomp.idPlantilla) || null
              : null;

            const plantilla = plantillaInvocacion
              ? proyectarInvocacionAMonstruo(
                  plantillaInvocacion,
                  acomp.nivelConjuroInvocacion || plantillaInvocacion.nivelMinimo,
                  contextoLanzador,
                  acomp.subtipoInvocacion
                )
              : baseDatosMonstruos.find((m) => m.id === acomp.idPlantilla) || null;

            return (
              <ItemAcompanante
                key={acomp.id}
                personajeId={personaje.id}
                acomp={acomp}
                plantilla={plantilla}
                plantillaInvocacion={plantillaInvocacion}
                criaturasSeleccionadas={criaturasSeleccionadas}
                onSeleccionarDetalle={setIdAcompananteDetalle}
                onEliminar={() => eliminarAcompanantePersonaje(personaje.id, acomp.id)}
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
                onEstablecerVidaMaxima={(val) =>
                  actualizarAcompanante(personaje.id, acomp.id, {
                    vidaMaxima: val,
                    vidaActual: Math.min(acomp.vidaActual, val)
                  })
                }
                onLanzarAtaqueRapido={(accNom, accBono, accDados, accTipo) =>
                  manejarLanzarAtaqueRapido(acomp.nombre, accNom, accBono, accDados, accTipo)
                }
                onCambiarNivelConjuroInvocacion={
                  plantillaInvocacion
                    ? (nuevoNivel) =>
                        manejarCambiarNivelConjuro(acomp, plantillaInvocacion, nuevoNivel)
                    : undefined
                }
                onCambiarSubtipoInvocacion={
                  plantillaInvocacion
                    ? (nuevoSubtipo) =>
                        manejarCambiarSubtipo(acomp, plantillaInvocacion, nuevoSubtipo)
                    : undefined
                }
                obtenerPercepcionPasiva={obtenerPercepcionPasiva}
              />
            );
          })}
        </div>
      )}

      {/* 3. Modal de Estadísticas Completas */}
      {idAcompananteDetalle && (
        <ModalEstadisticasAcompanante
          acompanante={acompananteEnDetalle}
          plantilla={plantillaEnDetalle}
          baseDatosHechizos={baseDatosHechizos}
          onCerrar={() => setIdAcompananteDetalle(null)}
          lanzarAtaqueRapido={manejarLanzarAtaqueRapido}
          lanzarTiradaD20={manejarLanzarTiradaD20}
          obtenerPercepcionPasiva={obtenerPercepcionPasiva}
        />
      )}
    </div>
  );
};
