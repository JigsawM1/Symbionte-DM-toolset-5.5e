import { describe, expect, it } from "vitest";
import {
  contieneExpresionDados,
  crearDescriptoresManualmente,
  detectarTipoDaño,
  limpiarYNormalizarDadosSimples,
  normalizarFormulaDados,
  sanitizarEtiqueta
} from "./normalizadorFormulasDados";
import {
  extraerValorNumericoDirecto,
  prepararFormulaSegunModoTirada,
  resolverModoTiradaEfectivo
} from "./preparadorModoTirada";

describe("normalizadorFormulasDados (Parser puro de fórmulas y etiquetas)", () => {
  it("sanitiza acentos, eñes y caracteres especiales preservando paréntesis y signos", () => {
    expect(sanitizarEtiqueta("  Salvación de Constitución (Ñandú)!@#  ")).toBe(
      "Salvacion de Constitucion (Nandu)"
    );
    expect(sanitizarEtiqueta("Ataque +3 - Espada")).toBe("Ataque +3 - Espada");
    expect(sanitizarEtiqueta("")).toBe("");
  });

  it("detecta correctamente si una cadena contiene una expresión de dados válida", () => {
    expect(contieneExpresionDados("1d20+5")).toBe(true);
    expect(contieneExpresionDados("d8")).toBe(true);
    expect(contieneExpresionDados("Fuego:2d6+3")).toBe(true);
    expect(contieneExpresionDados("Preservar vida:15")).toBe(false);
    expect(contieneExpresionDados("")).toBe(false);
  });

  it("normaliza fórmulas simples, modificadores numéricos puros, Roll20 kh1/kl1 y entradas inválidas", () => {
    expect(limpiarYNormalizarDadosSimples("d20")).toBe("1d20");
    expect(limpiarYNormalizarDadosSimples("+5")).toBe("1d20+5");
    expect(limpiarYNormalizarDadosSimples("3")).toBe("1d20+3");
    expect(limpiarYNormalizarDadosSimples("-2")).toBe("1d20-2");
    expect(limpiarYNormalizarDadosSimples("2d20kh1+4")).toBe("1d20+4");
    expect(limpiarYNormalizarDadosSimples("2d20kl1")).toBe("1d20");
    expect(limpiarYNormalizarDadosSimples("solo texto")).toBe("1d20");
    expect(limpiarYNormalizarDadosSimples("")).toBe("1d20");
  });

  it("normaliza fórmulas compuestas con etiquetas, prefijos '!' obsoletos y múltiples grupos", () => {
    expect(normalizarFormulaDados("!Ataque Ñoño:d20+5 / Daño Ácido: 2d6+3")).toBe(
      "Ataque Nono:1d20+5/Dano acido:2d6+3"
    );
    expect(normalizarFormulaDados("")).toBe("1d20");
  });

  it("construye descriptores manuales para fórmulas simples, con ':' y con '/'", () => {
    expect(crearDescriptoresManualmente("")).toEqual([{ name: "Tirada", roll: "1d20" }]);
    expect(crearDescriptoresManualmente("2d6+3")).toEqual([{ name: "Tirada", roll: "2d6+3" }]);
    expect(crearDescriptoresManualmente("!Ataque:1d20+4 Dano:1d8+2")).toEqual([
      { name: "Ataque", roll: "1d20+4" },
      { name: "Dano", roll: "1d8+2" }
    ]);
    expect(crearDescriptoresManualmente("Iniciativa:1d20+2/Bendicion:1d4")).toEqual([
      { name: "Iniciativa", roll: "1d20+2" },
      { name: "Bendicion", roll: "1d4" }
    ]);
  });

  it("detecta tipos de daño tanto en español como en inglés", () => {
    expect(detectarTipoDaño("Espada larga cortante")).toBe("Cortante");
    expect(detectarTipoDaño("Explosión de frío glacial")).toBe("Frío");
    expect(detectarTipoDaño("Relampago arcano")).toBe("Relámpago");
    expect(detectarTipoDaño("2d6 radiant damage")).toBe("Radiante");
    expect(detectarTipoDaño("3d8 necrotic")).toBe("Necrótico");
    expect(detectarTipoDaño("Sin tipo conocido", "Sin especificar")).toBe("Sin especificar");
  });

  it("aplica la anulación simétrica de ventaja y desventaja según D&D 5.5e", () => {
    expect(resolverModoTiradaEfectivo("ventaja", undefined)).toBe("ventaja");
    expect(resolverModoTiradaEfectivo("desventaja", undefined)).toBe("desventaja");
    expect(resolverModoTiradaEfectivo("ventaja", "desventaja")).toBe("plano");
    expect(resolverModoTiradaEfectivo("desventaja", "ventaja")).toBe("plano");
    expect(resolverModoTiradaEfectivo("ventaja", "plano")).toBe("plano");
    expect(resolverModoTiradaEfectivo("plano", "ventaja")).toBe("ventaja");
  });

  it("prepara fórmulas con ventaja separando dados adicionales del par d20", () => {
    const res = prepararFormulaSegunModoTirada("1d20+3+1d4", "Sigilo (ventaja)", "ventaja");
    expect(res.tiradaEspecial).toMatchObject({
      tipo: "ventaja",
      nombreGrupoOriginal: "Sigilo",
      grupoAName: "Sigilo (Ventaja 1)",
      grupoBName: "Sigilo (Ventaja 2)",
      grupoBonificacionName: "Sigilo (Dados adicionales)"
    });
    expect(res.formulaLimpia).toBe(
      "Sigilo (Ventaja 1):1d20+3/Sigilo (Ventaja 2):1d20+3/Sigilo (Dados adicionales):1d4"
    );
  });

  it("extrae valores numéricos directos cuando no hay expresión de dados", () => {
    expect(extraerValorNumericoDirecto("Preservar vida:15")).toBe(15);
    expect(extraerValorNumericoDirecto("25")).toBe(25);
    expect(extraerValorNumericoDirecto("sin-numero")).toBe(0);
  });
});
