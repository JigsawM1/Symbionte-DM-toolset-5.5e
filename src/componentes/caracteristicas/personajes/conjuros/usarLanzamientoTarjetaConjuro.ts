import { useState, useMemo, useEffect, useRef } from "react";
import type { HechizoBase } from "@/tipos";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
import {
  construirFormulaTaleSpireTruco,
  construirFormulaTaleSpireEspacio
} from "@/utiles/utilesConjuros";
import {
  obtenerOpcionesLanzamientoConjuro,
  gastarRecursoLanzamientoConjuro
} from "@/servicios/calculadorMagia";
import type { ModoLanzamiento } from "@/servicios/servicioLanzamientoConjuros";
import { logger } from "@/utiles/logger";

interface ParametrosLanzamientoTarjeta {
  hechizo: HechizoBase;
  nombrePersonaje: string;
  nivelPersonaje: number;
  bonoAtaqueMagico: number;
  bonoDanoMagico?: number;
  modificadorHabilidad?: number;
  bloqueadoPorArmadura: boolean;
  alLanzar?: (modo: ModoLanzamiento, nivelLanzamiento?: number) => Promise<boolean | void>;
  alGastarEspacio?: (nivel: number) => void;
  alGastarPuntos?: (cantidad: number) => void;
  alGastarEspacioPacto?: () => void;
  esLanzadorPacto?: boolean;
  nivelEspacioPacto?: number;
  espaciosPactoMaximos?: number;
  espaciosPactoGastados?: number;
  espaciosConjuroMaximos?: Record<string, number>;
  nivelConjuroMaximo?: number;
  alEstablecerConcentracion?: (id: string, nombre: string) => void;
  costePuntosPorNivel?: Record<number, number>;
  sistemaMagia?: "espacios" | "puntos";
  permitirUpcastLibre?: boolean;
  alLanzarGratis?: () => Promise<void>;
}

export function usarLanzamientoTarjetaConjuro({
  hechizo,
  nombrePersonaje,
  nivelPersonaje,
  bonoAtaqueMagico,
  bonoDanoMagico = 0,
  modificadorHabilidad = 0,
  bloqueadoPorArmadura,
  alLanzar,
  alGastarEspacio,
  alGastarPuntos,
  alGastarEspacioPacto,
  esLanzadorPacto = false,
  nivelEspacioPacto = 0,
  espaciosPactoMaximos = 0,
  espaciosPactoGastados = 0,
  espaciosConjuroMaximos = {},
  nivelConjuroMaximo = 0,
  alEstablecerConcentracion,
  costePuntosPorNivel,
  sistemaMagia = "espacios",
  permitirUpcastLibre,
  alLanzarGratis
}: ParametrosLanzamientoTarjeta) {
  const esTruco = hechizo.nivel === 0;
  const enCursoRef = useRef(false);

  const opcionesLanzamiento = useMemo(() => {
    return obtenerOpcionesLanzamientoConjuro({
      nivelHechizo: hechizo.nivel,
      espaciosConjuroMaximos,
      nivelConjuroMaximo,
      sistemaMagia,
      esLanzadorPacto,
      nivelEspacioPacto,
      espaciosPactoMaximos,
      permitirUpcastLibre
    });
  }, [
    hechizo.nivel,
    espaciosConjuroMaximos,
    nivelConjuroMaximo,
    sistemaMagia,
    esLanzadorPacto,
    nivelEspacioPacto,
    espaciosPactoMaximos,
    permitirUpcastLibre
  ]);

  const [nivelUpcast, setNivelUpcast] = useState<number>(() => {
    return opcionesLanzamiento[0]?.nivel ?? hechizo.nivel;
  });

  useEffect(() => {
    if (opcionesLanzamiento.length > 0) {
      const existe = opcionesLanzamiento.some((opt) => opt.nivel === nivelUpcast);
      if (!existe) {
        setNivelUpcast(opcionesLanzamiento[0].nivel);
      }
    }
  }, [opcionesLanzamiento, nivelUpcast]);

  const manejarLanzamientoRapido = async () => {
    if (bloqueadoPorArmadura || enCursoRef.current) return;
    enCursoRef.current = true;
    try {
      if (alLanzar) {
        await alLanzar(esTruco ? "truco" : "espacio", nivelUpcast);
        return;
      }

      const nombrePj = nombrePersonaje.trim() || "Personaje";
      const construirFormula = esTruco
        ? construirFormulaTaleSpireTruco
        : construirFormulaTaleSpireEspacio;
      const { formulaTaleSpire, etiquetaLog } = construirFormula(
        hechizo,
        esTruco ? nivelPersonaje : nivelUpcast,
        bonoAtaqueMagico,
        nombrePj,
        bonoDanoMagico,
        modificadorHabilidad
      );

      const emitida = await lanzarDadosTaleSpire(formulaTaleSpire, etiquetaLog);
      if (emitida === false) return;

      if (!esTruco) {
        gastarRecursoLanzamientoConjuro({
          nivelLanzamiento: nivelUpcast,
          esLanzadorPacto,
          nivelEspacioPacto,
          espaciosPactoMaximos,
          espaciosPactoGastados,
          espaciosConjuroMaximos,
          sistemaMagia,
          costePuntosPorNivel,
          alGastarEspacio,
          alGastarPuntos,
          alGastarEspacioPacto
        });
      }

      if (hechizo.concentracion && alEstablecerConcentracion) {
        alEstablecerConcentracion(hechizo.id, hechizo.nombre);
      }
    } catch (err) {
      logger.error("[TarjetaConjuroCompacta] Error al lanzar conjuro:", err);
    } finally {
      enCursoRef.current = false;
    }
  };

  const manejarLanzamientoRitual = async () => {
    if (bloqueadoPorArmadura || enCursoRef.current) return;
    enCursoRef.current = true;
    try {
      if (alLanzar) {
        await alLanzar("ritual", nivelUpcast);
        return;
      }

      const nombrePj = nombrePersonaje.trim() || "Personaje";
      const formulaBase = hechizo.dadosDaño?.trim() || "";
      const formulaTaleSpire = formulaBase
        ? `!Daño Ritual ${sanitizarEtiqueta(hechizo.nombre)}:${formulaBase}`
        : `!Lanzar Ritual:${sanitizarEtiqueta(hechizo.nombre)} (+10 min)`;
      const etiquetaLog = `${nombrePj} - ${hechizo.nombre} (RITUAL - 10 min)`;

      const emitida = await lanzarDadosTaleSpire(formulaTaleSpire, etiquetaLog);
      if (emitida === false) return;

      if (hechizo.concentracion && alEstablecerConcentracion) {
        alEstablecerConcentracion(hechizo.id, hechizo.nombre);
      }
    } catch (err) {
      logger.error("[TarjetaConjuroCompacta] Error al lanzar ritual:", err);
    } finally {
      enCursoRef.current = false;
    }
  };

  const manejarLanzamientoGratis = async () => {
    if (bloqueadoPorArmadura || enCursoRef.current) return;
    enCursoRef.current = true;
    try {
      if (alLanzarGratis) {
        await alLanzarGratis();
        return;
      }
      if (alLanzar) {
        await alLanzar("gratuitoInnato", hechizo.nivel);
        return;
      }

      const nombrePj = nombrePersonaje.trim() || "Personaje";
      const formulaBase = hechizo.dadosDaño?.trim() || "";
      const formulaTaleSpire = formulaBase
        ? `!Daño Gratis ${sanitizarEtiqueta(hechizo.nombre)}:${formulaBase}`
        : `!Lanzar Gratis:${sanitizarEtiqueta(hechizo.nombre)} (1/DL)`;
      const etiquetaLog = `${nombrePj} - ${hechizo.nombre} (GRATUITO INNATO 1/DL)`;

      const emitida = await lanzarDadosTaleSpire(formulaTaleSpire, etiquetaLog);
      if (emitida === false) return;

      if (hechizo.concentracion && alEstablecerConcentracion) {
        alEstablecerConcentracion(hechizo.id, hechizo.nombre);
      }
    } catch (err) {
      logger.error("[TarjetaConjuroCompacta] Error al lanzar conjuro gratuito:", err);
    } finally {
      enCursoRef.current = false;
    }
  };

  return {
    opcionesLanzamiento,
    nivelUpcast,
    setNivelUpcast,
    manejarLanzamientoRapido,
    manejarLanzamientoRitual,
    manejarLanzamientoGratis
  };
}
