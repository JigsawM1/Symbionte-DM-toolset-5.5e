import React from "react";
import type { RasgoPersonaje } from "@/tipos";
import {
  lanzarDadosTaleSpire,
  aplicarResultadoHpTemporalEnEstado,
  type MetadataEspecialRasgo
} from "@/utiles/lanzadorDados";
import {
  calcularHpTemporalDeEfecto,
  obtenerEfectoHpTemporalRasgo
} from "@/servicios/evaluadorEfectosRasgos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { logger } from "@/utiles/logger";

interface ParametrosAccionesTarjetaRasgo {
  rasgo: RasgoPersonaje;
  nombrePersonaje: string;
  idPersonaje?: string;
  alGastarUso: () => void;
  usosPadre?: { restantes: number; maximos: number; nombre: string };
  formulaDadosEfectiva?: string;
}

interface RetornoAccionesTarjetaRasgo {
  usosRestantes: number;
  usosMaximos: number;
  sinUsosDisponibles: boolean;
  esRecursoEspacioPacto: boolean;
  tieneUsosPropios: boolean;
  tieneUsosPadre: boolean;
  formulaEfectiva: string | undefined;
  esCuracion: boolean;
  esHpTemporalPropio: boolean;
  valorHpTemporalCalculado: number;
  manejarTirarDados: (e: React.MouseEvent) => Promise<void>;
  manejarAplicarHpTemporal: (e: React.MouseEvent) => void;
}

export function usarAccionesTarjetaRasgo({
  rasgo,
  nombrePersonaje,
  idPersonaje,
  alGastarUso,
  usosPadre,
  formulaDadosEfectiva
}: ParametrosAccionesTarjetaRasgo): RetornoAccionesTarjetaRasgo {
  const personajeActivoAlmacen = usarAlmacenDM(
    React.useCallback((s) => s.personajes.find((p) => p.id === idPersonaje), [idPersonaje])
  );
  const esRecursoEspacioPacto = rasgo.recursoGastado === "espacio_pacto";
  const espaciosPactoMaximos = personajeActivoAlmacen?.espaciosPactoMaximos || 0;
  const espaciosPactoGastados = personajeActivoAlmacen?.espaciosPactoGastados || 0;
  const espaciosPactoDisponibles = Math.max(0, espaciosPactoMaximos - espaciosPactoGastados);

  const formulaEfectiva = formulaDadosEfectiva || rasgo.formulaDados;
  const tieneUsosPropios = rasgo.tieneUsosLimitados && typeof rasgo.usosMaximos === "number";
  const tieneUsosPadre = !tieneUsosPropios && Boolean(rasgo.gastarDePadre && usosPadre);

  const usosRestantes = esRecursoEspacioPacto
    ? espaciosPactoDisponibles
    : tieneUsosPropios
    ? (rasgo.usosRestantes ?? (rasgo.usosMaximos || 1))
    : (usosPadre?.restantes ?? 0);

  const usosMaximos = esRecursoEspacioPacto
    ? espaciosPactoMaximos
    : tieneUsosPropios
    ? (rasgo.usosMaximos || 1)
    : (usosPadre?.maximos || 1);

  const sinUsosDisponibles =
    (esRecursoEspacioPacto && espaciosPactoDisponibles <= 0) ||
    ((tieneUsosPropios || tieneUsosPadre) && usosRestantes <= 0);

  const normNombre = rasgo.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const esManosCurativas = normNombre.includes("manos curativas");
  const esMantoInspiracion = normNombre.includes("manto de inspiracion");
  const esInspiracionBardica = normNombre.includes("inspiracion bardica");
  const esAtaqueAliento = normNombre.includes("ataque de aliento") || normNombre.includes("arma de aliento");

  const esCuracion = rasgo.categoriaMecanica === "curacion" || normNombre.includes("guerrero de los dioses");
  const esCuracionAuto = esCuracion && !esManosCurativas;
  const tieneEfectoHpTemporalAuto = (rasgo.efectos || []).some((ef) => ef.tipo === "hp_temporal") && !esMantoInspiracion;
  const gastaUsoAlTirar =
    esCuracionAuto ||
    tieneEfectoHpTemporalAuto ||
    esManosCurativas ||
    esMantoInspiracion ||
    esInspiracionBardica ||
    esAtaqueAliento ||
    rasgo.categoriaMecanica === "consumible" ||
    rasgo.gastarDePadre;

  const manejarTirarDados = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    if (!formulaEfectiva) return;
    if (sinUsosDisponibles) return;

    try {
      if (esRecursoEspacioPacto && idPersonaje) {
        usarAlmacenDM.getState().gastarEspacioPacto(idPersonaje);
      } else if (gastaUsoAlTirar && alGastarUso) {
        alGastarUso();
      }
      const formula = `!${rasgo.nombre}:${formulaEfectiva}`;
      const etiqueta = `${nombrePersonaje} - ${rasgo.nombre} (${formulaEfectiva})`;

      let metaEspecial: MetadataEspecialRasgo | undefined = undefined;
      if (esCuracionAuto && idPersonaje) {
        metaEspecial = {
          tipo: "curacionRasgo",
          personajeId: idPersonaje,
          rasgoId: rasgo.id,
          nombreRasgo: rasgo.nombre,
          cantidadDadosGastados: 1
        };
      } else if (tieneEfectoHpTemporalAuto && idPersonaje) {
        const efectoHp = (rasgo.efectos || []).find((ef) => ef.tipo === "hp_temporal");
        let multiplicador = 1;
        if (efectoHp?.valor) {
          if (efectoHp.valor === "2_veces_dado_inspiracion") {
            multiplicador = 2;
          } else {
            const num = Number(efectoHp.valor);
            if (!Number.isNaN(num) && num > 0) multiplicador = num;
          }
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
      logger.error("[usarAccionesTarjetaRasgo] Error al tirar dados:", error);
    }
  };

  const efectoHpTemporal = obtenerEfectoHpTemporalRasgo(rasgo);
  const esHpTemporalPropio = Boolean(
    efectoHpTemporal &&
    (!efectoHpTemporal.objetivo || efectoHpTemporal.objetivo === "propio" || efectoHpTemporal.objetivo === "hp_temporal")
  );

  const agregarNotificacion = usarAlmacenDM((s) => s.agregarNotificacion);

  const valorHpTemporalCalculado = React.useMemo(() => {
    if (!efectoHpTemporal) return 0;
    if (personajeActivoAlmacen) {
      return calcularHpTemporalDeEfecto(efectoHpTemporal, personajeActivoAlmacen);
    }
    const vStr = String(efectoHpTemporal.valor || "").toLowerCase();
    if (vStr === "bono_competencia" || vStr === "pb" || vStr === "bc") return 2;
    return Math.max(0, Number(efectoHpTemporal.valor) || 0);
  }, [efectoHpTemporal, personajeActivoAlmacen]);

  const manejarAplicarHpTemporal = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (sinUsosDisponibles) return;
    if (!idPersonaje) return;

    try {
      if (alGastarUso) {
        alGastarUso();
      }
      const valor = valorHpTemporalCalculado > 0 ? valorHpTemporalCalculado : 1;
      aplicarResultadoHpTemporalEnEstado(idPersonaje, valor);
      agregarNotificacion(
        `Has usado ${rasgo.nombre} y obtenido ${valor} PG temporales.`,
        "exito"
      );
    } catch (error) {
      logger.error("[usarAccionesTarjetaRasgo] Error al aplicar HP temporal:", error);
    }
  };

  return {
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
  };
}
