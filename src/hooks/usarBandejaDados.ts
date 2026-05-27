import React, { useState } from "react";
import { lanzarDadosTaleSpire } from "../utiles/lanzadorDados";

export interface DadosBandeja {
  d4: number;
  d6: number;
  d8: number;
  d10: number;
  d12: number;
  d20: number;
  d100: number;
}

export function usarBandejaDados() {
  const [minimizado, setMinimizado] = useState(true);
  const [dados, setDados] = useState<DadosBandeja>({
    d4: 0,
    d6: 0,
    d8: 0,
    d10: 0,
    d12: 0,
    d20: 0,
    d100: 0,
  });
  const [modificador, setModificador] = useState<number>(0);
  const [nombreTirada, setNombreTirada] = useState<string>("");

  const tiposDados: (keyof DadosBandeja)[] = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

  const agregarDado = (tipo: keyof DadosBandeja) => {
    setDados((prev) => ({
      ...prev,
      [tipo]: Math.min(prev[tipo] + 1, 99),
    }));
  };

  const removerDado = (tipo: keyof DadosBandeja, e: React.MouseEvent) => {
    e.preventDefault();
    setDados((prev) => ({
      ...prev,
      [tipo]: Math.max(prev[tipo] - 1, 0),
    }));
  };

  const limpiarBandeja = () => {
    setDados({
      d4: 0,
      d6: 0,
      d8: 0,
      d10: 0,
      d12: 0,
      d20: 0,
      d100: 0,
    });
    setModificador(0);
    setNombreTirada("");
  };

  const construirFormula = (): string => {
    const partes: string[] = [];
    tiposDados.forEach((tipo) => {
      const cantidad = dados[tipo];
      if (cantidad > 0) {
        partes.push(`${cantidad}${tipo}`);
      }
    });

    if (partes.length === 0) return "";

    const baseFormula = partes.join("/");
    if (modificador > 0) {
      return `${baseFormula}+${modificador}`;
    } else if (modificador < 0) {
      return `${baseFormula}${modificador}`;
    }
    return baseFormula;
  };

  const manejarLanzamiento = async () => {
    const formula = construirFormula();
    if (!formula) return;

    const etiquetaFinal = nombreTirada.trim() || "Tirada Rápida";
    await lanzarDadosTaleSpire(formula, etiquetaFinal);
  };

  return {
    minimizado,
    setMinimizado,
    dados,
    setDados,
    modificador,
    setModificador,
    nombreTirada,
    setNombreTirada,
    tiposDados,
    agregarDado,
    removerDado,
    limpiarBandeja,
    construirFormula,
    manejarLanzamiento
  };
}
