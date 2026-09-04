import { useCallback, useMemo } from "react";
import type { PersonajeJugador, HechizoBase } from "@/tipos";
import type { PenalizacionArmadura } from "@/almacen/selectores/usarEstadoPersonajes";
import { COSTE_PUNTOS_POR_NIVEL } from "@/constantes";
import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";
import {
  validarLanzamiento,
  prepararLanzamiento,
  type ModoLanzamiento,
  type SolicitudLanzamiento,
  type ContextoMagicoPersonaje,
  type ResultadoValidacion
} from "@/servicios/servicioLanzamientoConjuros";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { usarAccionesConfiguracion, usarEstadoConfiguracion } from "@/almacen/selectores/usarEstadoConfiguracion";
import { tieneConjuroGratuitoActivo } from "@/servicios/evaluadorEfectosRasgos";

export interface OpcionesLanzadorConjuros {
  personaje?: PersonajeJugador | null;
  penalizacionArmadura?: PenalizacionArmadura | null;
  bonoAtaqueMagico?: number;
  permitirUpcastLibre?: boolean;
  sistemaMagia?: "espacios" | "puntos";
}

export interface ControlLanzadorConjuros {
  puedeLanzar: boolean;
  motivoBloqueo?: string;
  validar: (solicitud: Partial<SolicitudLanzamiento> & { hechizo: HechizoBase; modo: ModoLanzamiento }) => ResultadoValidacion;
  lanzar: (solicitud: Partial<SolicitudLanzamiento> & { hechizo: HechizoBase; modo: ModoLanzamiento }) => Promise<boolean>;
}

/**
 * Hook centralizado para orquestar la validación, construcción de fórmulas,
 * tirada de dados 3D en TaleSpire, deducción de recursos mágicos en Zustand
 * y gestión de concentración.
 */
export function usarLanzadorConjuros(opciones: OpcionesLanzadorConjuros): ControlLanzadorConjuros {
  const {
    personaje,
    penalizacionArmadura,
    bonoAtaqueMagico = 0,
    sistemaMagia: sistemaMagiaProp
  } = opciones;

  const { sistemaMagia: sistemaMagiaConfigurado } = usarEstadoConfiguracion();
  const sistemaMagiaEfectivo = sistemaMagiaProp ?? sistemaMagiaConfigurado ?? "espacios";

  const {
    gastarEspacioConjuro,
    gastarPuntosConjuro,
    gastarEspacioPacto,
    gastarArcanoMistico,
    establecerConcentracion,
    modificarCargasObjeto
  } = usarAlmacenDM();

  const { agregarNotificacion } = usarAccionesConfiguracion();

  // 1. Construir contexto del personaje
  const contexto = useMemo<ContextoMagicoPersonaje>(() => {
    if (!personaje) {
      return {
        penalizacionArmadura: penalizacionArmadura ?? null,
        espaciosConjuroMaximos: {},
        nivelConjuroMaximo: 0,
        sistemaMagia: sistemaMagiaEfectivo,
        esLanzadorPacto: false,
        nivelEspacioPacto: 0,
        espaciosPactoMaximos: 0,
        espaciosPactoGastados: 0,
        arcanoMisticoGastados: []
      };
    }

    const tienePacto =
      (personaje.espaciosPactoMaximos || 0) > 0 ||
      (personaje.clasesLanzadoras || []).some((c) => c.tipoLanzador === "pacto");

    // Identificar conjuros que el personaje puede lanzar gratis actualmente (ej: Orden imperiosa con Manto de Majestad)
    const conjurosGratuitos: string[] = [];
    if (tieneConjuroGratuitoActivo(personaje, "Orden imperiosa")) {
      conjurosGratuitos.push("Orden imperiosa");
    }

    return {
      penalizacionArmadura: penalizacionArmadura ?? null,
      espaciosConjuroMaximos: personaje.espaciosConjuroMaximos || {},
      nivelConjuroMaximo: personaje.nivelConjuroMaximo || 0,
      sistemaMagia: sistemaMagiaEfectivo,
      costePuntosPorNivel: COSTE_PUNTOS_POR_NIVEL,
      esLanzadorPacto: tienePacto,
      nivelEspacioPacto: personaje.nivelEspacioPacto || 0,
      espaciosPactoMaximos: personaje.espaciosPactoMaximos || 0,
      espaciosPactoGastados: personaje.espaciosPactoGastados || 0,
      arcanoMisticoGastados: personaje.arcanoMisticoGastados || [],
      conjurosGratuitosActivos: conjurosGratuitos
    };
  }, [personaje, penalizacionArmadura, sistemaMagiaEfectivo]);

  // 2. Estado general de bloqueo por armadura
  const estaBloqueadoPorArmadura = Boolean(penalizacionArmadura?.sinCompetencia);
  const motivoBloqueoArmadura = estaBloqueadoPorArmadura
    ? `No puedes lanzar conjuros mientras vistas ${[
        penalizacionArmadura?.armaduraNoCompetente,
        penalizacionArmadura?.escudoNoCompetente
      ]
        .filter(Boolean)
        .join(" o ")} sin competencia.`
    : undefined;

  // 3. Validador reactivo
  const validar = useCallback(
    (solicitudIncompleta: Partial<SolicitudLanzamiento> & { hechizo: HechizoBase; modo: ModoLanzamiento }): ResultadoValidacion => {
      const solicitudCompleta: SolicitudLanzamiento = {
        nombrePersonaje: personaje?.nombre || "Personaje",
        nivelPersonaje: personaje?.nivel || 1,
        bonoAtaqueMagico,
        ...solicitudIncompleta
      };
      return validarLanzamiento(solicitudCompleta, contexto);
    },
    [personaje, bonoAtaqueMagico, contexto]
  );

  // 4. Ejecutor central de lanzamiento
  const lanzar = useCallback(
    async (
      solicitudIncompleta: Partial<SolicitudLanzamiento> & { hechizo: HechizoBase; modo: ModoLanzamiento }
    ): Promise<boolean> => {
      const solicitudCompleta: SolicitudLanzamiento = {
        nombrePersonaje: personaje?.nombre || "Personaje",
        nivelPersonaje: personaje?.nivel || 1,
        bonoAtaqueMagico,
        ...solicitudIncompleta
      };

      // A. Validar precondiciones
      const resultadoValidacion = validarLanzamiento(solicitudCompleta, contexto);
      if (!resultadoValidacion.permitido) {
        if (resultadoValidacion.motivo) {
          agregarNotificacion(resultadoValidacion.motivo, "advertencia");
        }
        return false;
      }

      try {
        // B. Preparar fórmula y gasto con la estrategia correspondiente
        const preparado = prepararLanzamiento(solicitudCompleta, contexto);

        // C. Ejecutar deducción garantizada de recursos en Zustand si el personaje existe
        if (personaje) {
          switch (preparado.gasto.tipo) {
            case "espacio":
              gastarEspacioConjuro(personaje.id, preparado.gasto.nivel);
              break;
            case "puntos":
              gastarPuntosConjuro(personaje.id, preparado.gasto.cantidad);
              break;
            case "pacto":
              gastarEspacioPacto(personaje.id);
              break;
            case "cargasObjeto":
              modificarCargasObjeto(personaje.id, preparado.gasto.objetoInstanciaId, -preparado.gasto.cantidad);
              break;
            case "arcanoMistico":
              gastarArcanoMistico(personaje.id, preparado.gasto.nivel);
              break;
            case "ninguno":
            default:
              break;
          }

          // D. Activar concentración si el conjuro lo requiere
          if (preparado.activarConcentracion && solicitudCompleta.hechizo.id) {
            establecerConcentracion(
              personaje.id,
              solicitudCompleta.hechizo.id,
              solicitudCompleta.hechizo.nombre
            );
          }
        }

        // E. Enviar tirada física / chat a TaleSpire de forma segura y no bloqueante
        try {
          await lanzarDadosTaleSpire(
            preparado.formula.formulaTaleSpire,
            preparado.formula.etiquetaLog
          );
        } catch (errTaleSpire) {
          console.error("[usarLanzadorConjuros] Error al enviar tirada a TaleSpire:", errTaleSpire);
        }

        return true;
      } catch (err) {
        console.error("[usarLanzadorConjuros] Error al ejecutar lanzamiento:", err);
        agregarNotificacion("Error al procesar el lanzamiento del conjuro.", "error");
        return false;
      }
    },
    [
      personaje,
      bonoAtaqueMagico,
      contexto,
      agregarNotificacion,
      gastarEspacioConjuro,
      gastarPuntosConjuro,
      gastarEspacioPacto,
      gastarArcanoMistico,
      establecerConcentracion,
      modificarCargasObjeto
    ]
  );

  return {
    puedeLanzar: !estaBloqueadoPorArmadura,
    motivoBloqueo: motivoBloqueoArmadura,
    validar,
    lanzar
  };
}
