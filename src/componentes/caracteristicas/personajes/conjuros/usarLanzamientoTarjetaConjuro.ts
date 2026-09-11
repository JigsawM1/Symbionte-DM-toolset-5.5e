import { useState, useMemo, useEffect } from "react";
import type { HechizoBase } from "@/tipos";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
import {
  calcularFormulaEscalada,
  construirFormulaTaleSpireTruco
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
    try {
      if (bloqueadoPorArmadura) return;

      if (alLanzar) {
        await alLanzar(esTruco ? "truco" : "espacio", nivelUpcast);
        return;
      }

      const nombrePj = nombrePersonaje.trim() || "Personaje";
      let formulaTaleSpire = "";
      let etiquetaLog = "";

      if (esTruco) {
        const resultadoTruco = construirFormulaTaleSpireTruco(
          hechizo,
          nivelPersonaje,
          bonoAtaqueMagico,
          nombrePj
        );
        formulaTaleSpire = resultadoTruco.formulaTaleSpire;
        etiquetaLog = resultadoTruco.etiquetaLog;
      } else {
        const formulaBase = hechizo.dadosDaño?.trim() || "";
        const formulaAdicional = hechizo.dadosDañoNivelSuperior?.trim() || "";

        const formulaFinal =
          formulaBase && nivelUpcast > hechizo.nivel
            ? calcularFormulaEscalada(formulaBase, formulaAdicional, hechizo.nivel, nivelUpcast).formula
            : formulaBase;

        etiquetaLog = `${nombrePj} - ${hechizo.nombre}${nivelUpcast > hechizo.nivel ? ` (Nv.${nivelUpcast})` : ""}`;

        const tieneAtaque =
          hechizo.requiereAtaque === true || hechizo.ataqueCd === "ATAQUE";

        if (tieneAtaque) {
          const formulaAtaque = `!Ataque ${sanitizarEtiqueta(hechizo.nombre)}:1d20${bonoAtaqueMagico >= 0 ? "+" : ""}${bonoAtaqueMagico}`;
          if (formulaFinal) {
            const tipoDano = hechizo.tipoDaño ? ` (${hechizo.tipoDaño})` : "";
            formulaTaleSpire = `${formulaAtaque}/Daño${sanitizarEtiqueta(tipoDano)}:${formulaFinal}`;
          } else {
            formulaTaleSpire = formulaAtaque;
          }
        } else if (formulaFinal) {
          const tipoDano = hechizo.tipoDaño ? ` (${hechizo.tipoDaño})` : "";
          formulaTaleSpire = `!Daño ${sanitizarEtiqueta(hechizo.nombre)}${sanitizarEtiqueta(tipoDano)}:${formulaFinal}`;
        } else {
          formulaTaleSpire = `!Lanzar Conjuro:${sanitizarEtiqueta(hechizo.nombre)}`;
        }
      }

      await lanzarDadosTaleSpire(formulaTaleSpire, etiquetaLog);

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
    }
  };

  const manejarLanzamientoRitual = async () => {
    try {
      if (bloqueadoPorArmadura) return;

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

      await lanzarDadosTaleSpire(formulaTaleSpire, etiquetaLog);

      if (hechizo.concentracion && alEstablecerConcentracion) {
        alEstablecerConcentracion(hechizo.id, hechizo.nombre);
      }
    } catch (err) {
      logger.error("[TarjetaConjuroCompacta] Error al lanzar ritual:", err);
    }
  };

  const manejarLanzamientoGratis = async () => {
    try {
      if (bloqueadoPorArmadura) return;
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

      await lanzarDadosTaleSpire(formulaTaleSpire, etiquetaLog);

      if (hechizo.concentracion && alEstablecerConcentracion) {
        alEstablecerConcentracion(hechizo.id, hechizo.nombre);
      }
    } catch (err) {
      logger.error("[TarjetaConjuroCompacta] Error al lanzar conjuro gratuito:", err);
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
