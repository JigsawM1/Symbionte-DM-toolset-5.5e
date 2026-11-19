import { useState, useMemo, useEffect, useRef } from "react";
import type { HechizoBase } from "@/tipos";
import { COSTE_PUNTOS_POR_NIVEL } from "@/constantes";
import {
  obtenerOpcionesLanzamientoConjuro,
  resolverGastoLanzamientoConjuro
} from "@/servicios/magia/lanzamientoYUpcasting";
import type { ModoLanzamiento } from "@/servicios/servicioLanzamientoConjuros";
import { logger } from "@/utiles/logger";

interface ParametrosLanzamientoTarjeta {
  hechizo: HechizoBase;
  bloqueadoPorArmadura: boolean;
  alLanzar: (modo: ModoLanzamiento, nivelLanzamiento?: number) => Promise<boolean | void>;
  esLanzadorPacto?: boolean;
  nivelEspacioPacto?: number;
  espaciosPactoMaximos?: number;
  espaciosPactoGastados?: number;
  espaciosConjuroMaximos?: Record<string, number>;
  espaciosConjuroGastados?: Record<string, number>;
  nivelConjuroMaximo?: number;
  costePuntosPorNivel?: Record<number, number>;
  puntosConjuroDisponibles?: number;
  sistemaMagia?: "espacios" | "puntos";
}

export function usarLanzamientoTarjetaConjuro({
  hechizo,
  bloqueadoPorArmadura,
  alLanzar,
  esLanzadorPacto = false,
  nivelEspacioPacto = 0,
  espaciosPactoMaximos = 0,
  espaciosPactoGastados = 0,
  espaciosConjuroMaximos = {},
  espaciosConjuroGastados,
  nivelConjuroMaximo = 0,
  costePuntosPorNivel = COSTE_PUNTOS_POR_NIVEL,
  puntosConjuroDisponibles,
  sistemaMagia = "espacios"
}: ParametrosLanzamientoTarjeta) {
  const esTruco = hechizo.nivel === 0;
  const enCursoRef = useRef(false);

  const opcionesBase = useMemo(() => obtenerOpcionesLanzamientoConjuro({
    nivelHechizo: hechizo.nivel,
    espaciosConjuroMaximos,
    nivelConjuroMaximo,
    sistemaMagia,
    esLanzadorPacto,
    nivelEspacioPacto,
    espaciosPactoMaximos
  }), [
    hechizo.nivel,
    espaciosConjuroMaximos,
    nivelConjuroMaximo,
    sistemaMagia,
    esLanzadorPacto,
    nivelEspacioPacto,
    espaciosPactoMaximos
  ]);

  const opcionesLanzamiento = useMemo(() => opcionesBase.map((opcion) => {
    const { nivel } = opcion;
    const gasto = resolverGastoLanzamientoConjuro({
      nivelLanzamiento: nivel, esLanzadorPacto, nivelEspacioPacto, espaciosPactoMaximos,
      espaciosPactoGastados, espaciosConjuroMaximos, sistemaMagia, costePuntosPorNivel
    });
    const recurso = gasto.recursoGastado;
    const coste = gasto.puntos ?? 0;
    const opcionConGasto = { ...opcion, recurso, coste };
    if (esTruco) return { ...opcionConGasto, agotado: false };

    const escalado = nivel > hechizo.nivel && opcion.etiqueta.includes("↑") ? " ↑" : "";
    const etiquetaNivel = `Nv. ${nivel}${escalado}`;
    if (recurso === "pacto") {
      const disponibles = Math.max(0, espaciosPactoMaximos - espaciosPactoGastados);
      return {
        ...opcionConGasto, agotado: disponibles === 0,
        etiqueta: `Pacto Nv. ${nivel} (${disponibles}/${espaciosPactoMaximos})${escalado}`
      };
    }

    if (recurso === "puntos") {
      return {
        ...opcionConGasto, etiqueta: `${etiquetaNivel} (${coste} pts)`,
        agotado: puntosConjuroDisponibles !== undefined && puntosConjuroDisponibles < coste
      };
    }

    const maximo = espaciosConjuroMaximos[nivel] ?? 0;
    const disponibles = Math.max(0, maximo - (espaciosConjuroGastados?.[nivel] ?? 0));
    return {
      ...opcionConGasto,
      etiqueta: maximo > 0 && espaciosConjuroGastados !== undefined
        ? `${etiquetaNivel} (${disponibles}/${maximo})` : etiquetaNivel,
      agotado: espaciosConjuroGastados !== undefined && disponibles === 0
    };
  }), [
    opcionesBase, esTruco, hechizo.nivel, esLanzadorPacto, nivelEspacioPacto,
    espaciosPactoMaximos, espaciosPactoGastados, espaciosConjuroMaximos, espaciosConjuroGastados,
    sistemaMagia, costePuntosPorNivel, puntosConjuroDisponibles
  ]);

  const [nivelElegido, setNivelUpcast] = useState(opcionesLanzamiento[0]?.nivel ?? hechizo.nivel);
  const opcionActual = opcionesLanzamiento.find((opcion) => opcion.nivel === nivelElegido) ?? opcionesLanzamiento[0];
  const nivelUpcast = opcionActual?.nivel ?? hechizo.nivel;
  const costeNivelActual = opcionActual?.coste ?? 0;
  const sinRecursosParaNivelActual = opcionActual?.agotado ?? false;

  useEffect(() => {
    if (nivelElegido !== nivelUpcast) setNivelUpcast(nivelUpcast);
  }, [nivelElegido, nivelUpcast]);

  // ponytail: delega siempre en alLanzar; restaurar fallback local solo si aparece un consumidor autónomo.
  const ejecutarLanzamiento = async (modo: ModoLanzamiento, nivel: number, contexto: string) => {
    if (bloqueadoPorArmadura || enCursoRef.current) return;
    enCursoRef.current = true;
    try {
      await alLanzar(modo, nivel);
    } catch (err) {
      logger.error(`[TarjetaConjuroCompacta] Error al lanzar ${contexto}:`, err);
    } finally {
      enCursoRef.current = false;
    }
  };

  return {
    opcionesLanzamiento,
    opcionActual,
    nivelUpcast,
    setNivelUpcast,
    costeNivelActual,
    sinRecursosParaNivelActual,
    manejarLanzamientoRapido: () => ejecutarLanzamiento(esTruco ? "truco" : "espacio", nivelUpcast, "conjuro"),
    manejarLanzamientoRitual: () => ejecutarLanzamiento("ritual", nivelUpcast, "ritual"),
    manejarLanzamientoGratis: () => ejecutarLanzamiento("gratuitoInnato", hechizo.nivel, "conjuro gratuito")
  };
}
