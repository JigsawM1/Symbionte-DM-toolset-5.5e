import { describe, it, expect } from "vitest";
import {
  calcularFormulaEscalada,
  extraerDadosBaseTruco,
  calcularMultiplicadorTruco,
  calcularFormulaTruco,
  esTrucoDeAtaquesMultiples,
  calcularInfoTruco,
  construirFormulaTaleSpireTruco,
  construirFormulaTaleSpireEspacio,
  obtenerInfoProyectilesMultiples,
  aplicarBonoNumericoAFormulaDados,
  formatearComponentes
} from "./utilesConjuros";

describe("utilesConjuros - Sistema de Escalado de Conjuros y Trucos (D&D 5.5e)", () => {
  describe("calcularMultiplicadorTruco", () => {
    it("debe devolver 1 para niveles 1 a 4", () => {
      expect(calcularMultiplicadorTruco(1)).toBe(1);
      expect(calcularMultiplicadorTruco(2)).toBe(1);
      expect(calcularMultiplicadorTruco(3)).toBe(1);
      expect(calcularMultiplicadorTruco(4)).toBe(1);
    });

    it("debe devolver 2 para niveles 5 a 10", () => {
      expect(calcularMultiplicadorTruco(5)).toBe(2);
      expect(calcularMultiplicadorTruco(8)).toBe(2);
      expect(calcularMultiplicadorTruco(10)).toBe(2);
    });

    it("debe devolver 3 para niveles 11 a 16", () => {
      expect(calcularMultiplicadorTruco(11)).toBe(3);
      expect(calcularMultiplicadorTruco(14)).toBe(3);
      expect(calcularMultiplicadorTruco(16)).toBe(3);
    });

    it("debe devolver 4 para niveles 17 a 20", () => {
      expect(calcularMultiplicadorTruco(17)).toBe(4);
      expect(calcularMultiplicadorTruco(20)).toBe(4);
    });
  });

  describe("extraerDadosBaseTruco", () => {
    it("extrae dados de dadosDaño si están definidos", () => {
      expect(extraerDadosBaseTruco({ dadosDaño: "1d10" })).toBe("1d10");
      expect(extraerDadosBaseTruco({ dadosDaño: "2d4", descripcion: "algo" })).toBe("2d4");
    });

    it("devuelve vacío cuando dadosDaño no está presente o es N/A", () => {
      expect(extraerDadosBaseTruco({})).toBe("");
      expect(extraerDadosBaseTruco({ dadosDaño: "N/A" })).toBe("");
      expect(extraerDadosBaseTruco({ dadosDaño: "" })).toBe("");
    });

    it("nunca extrae dados de la descripción si dadosDaño no está explícito", () => {
      const toqueHelado = {
        descripcion: "Canalizas un frío sepulcral... el objetivo recibirá 1d10 de daño necrótico."
      };
      expect(extraerDadosBaseTruco(toqueHelado)).toBe("");

      const saetaFuego = {
        descripcion: "Lanzas una mota de fuego que inflige 1d10 de daño ígneo."
      };
      expect(extraerDadosBaseTruco(saetaFuego)).toBe("");

      const rayoEscarcha = {
        descripcion: "Un rayo gélido hace 1d8 de daño por frío."
      };
      expect(extraerDadosBaseTruco(rayoEscarcha)).toBe("");
    });

    it("NO extrae dados de trucos utilitarios como Guía (1d4 para tiradas) o Luz", () => {
      const guia = {
        nombre: "Guía",
        descripcion: "Tocas a una criatura voluntaria. Una vez antes de que el conjuro termine, el objetivo puede tirar un 1d4 y añadir el número obtenido a una prueba de característica."
      };
      expect(extraerDadosBaseTruco(guia)).toBe("");

      const luz = {
        nombre: "Luz",
        descripcion: "Tocas un objeto que no mida más de 10 pies en cualquier dimensión. Hasta que el conjuro termine, el objeto emite luz brillante..."
      };
      expect(extraerDadosBaseTruco(luz)).toBe("");
    });
  });

  describe("calcularFormulaTruco", () => {
    it("escala Toque Helado (1d10) según el nivel del personaje", () => {
      // Nivel 1 -> 1d10
      expect(calcularFormulaTruco("1d10", 1)).toEqual({
        formula: "1d10",
        multiplicador: 1,
        cantDados: 1,
        caras: "10",
        base: "1d10"
      });

      // Nivel 5 -> 2d10
      expect(calcularFormulaTruco("1d10", 5)).toEqual({
        formula: "2d10",
        multiplicador: 2,
        cantDados: 2,
        caras: "10",
        base: "1d10"
      });

      // Nivel 11 -> 3d10
      expect(calcularFormulaTruco("1d10", 11)).toEqual({
        formula: "3d10",
        multiplicador: 3,
        cantDados: 3,
        caras: "10",
        base: "1d10"
      });

      // Nivel 17 -> 4d10
      expect(calcularFormulaTruco("1d10", 17)).toEqual({
        formula: "4d10",
        multiplicador: 4,
        cantDados: 4,
        caras: "10",
        base: "1d10"
      });
    });

    it("escala trucos con dados base múltiples (ej. 2d4)", () => {
      expect(calcularFormulaTruco("2d4", 5)).toEqual({
        formula: "4d4",
        multiplicador: 2,
        cantDados: 4,
        caras: "4",
        base: "2d4"
      });
    });
  });

  describe("esTrucoDeAtaquesMultiples & calcularInfoTruco (Descarga Sobrenatural)", () => {
    const descarga = {
      nombre: "Descarga sobrenatural",
      dadosDaño: "1d10",
      tipoDaño: "fuerza",
      descripcion: "Lanzas un rayo de energía chisporroteante... Mejora de truco. El conjuro crea dos rayos a nivel 5, tres rayos a nivel 11 y cuatro rayos a nivel 17.",
      requiereAtaque: true
    };

    it("detecta correctamente Descarga sobrenatural como truco de ataques múltiples", () => {
      expect(esTrucoDeAtaquesMultiples(descarga)).toBe(true);
      expect(esTrucoDeAtaquesMultiples({ nombre: "Toque helado", descripcion: "Aumenta en 1d10" })).toBe(false);
    });

    it("calcula información de rayos en Descarga sobrenatural según el nivel del personaje", () => {
      // Nivel 1: 1 rayo (1d10)
      const nv1 = calcularInfoTruco(descarga, 1);
      expect(nv1.esAtaqueMultiple).toBe(true);
      expect(nv1.cantidadAtaques).toBe(1);
      expect(nv1.formula).toBe("1d10");
      expect(nv1.etiquetaVisual).toBe("1d10");

      // Nivel 5: 2 rayos (1d10 c/u)
      const nv5 = calcularInfoTruco(descarga, 5);
      expect(nv5.esAtaqueMultiple).toBe(true);
      expect(nv5.cantidadAtaques).toBe(2);
      expect(nv5.formula).toBe("1d10");
      expect(nv5.etiquetaVisual).toBe("2 rayos (1d10 c/u)");

      // Nivel 11: 3 rayos (1d10 c/u)
      const nv11 = calcularInfoTruco(descarga, 11);
      expect(nv11.cantidadAtaques).toBe(3);
      expect(nv11.etiquetaVisual).toBe("3 rayos (1d10 c/u)");

      // Nivel 17: 4 rayos (1d10 c/u)
      const nv17 = calcularInfoTruco(descarga, 17);
      expect(nv17.cantidadAtaques).toBe(4);
      expect(nv17.etiquetaVisual).toBe("4 rayos (1d10 c/u)");
    });

    it("construye fórmula TaleSpire con grupos de ataque/daño separados para cada rayo", () => {
      // Nivel 5 (+5 bono ataque mágico) -> 2 ataques independientes con daño de fuerza
      const resultadoNv5 = construirFormulaTaleSpireTruco(descarga, 5, 5, "Valeros");
      expect(resultadoNv5.formulaTaleSpire).toBe(
        "!Ataque Rayo 1:1d20+5/Daño Rayo 1 (fuerza):1d10/Ataque Rayo 2:1d20+5/Daño Rayo 2 (fuerza):1d10"
      );
      expect(resultadoNv5.etiquetaLog).toBe("Valeros - Descarga sobrenatural (Truco Nv.5 -> 2 rayos)");

      // Nivel 11 -> 3 ataques independientes
      const resultadoNv11 = construirFormulaTaleSpireTruco(descarga, 11, 7, "Valeros");
      expect(resultadoNv11.formulaTaleSpire).toBe(
        "!Ataque Rayo 1:1d20+7/Daño Rayo 1 (fuerza):1d10/Ataque Rayo 2:1d20+7/Daño Rayo 2 (fuerza):1d10/Ataque Rayo 3:1d20+7/Daño Rayo 3 (fuerza):1d10"
      );
    });

    it("construye fórmula TaleSpire estándar para trucos de daño concentrado con mejora (ej. Toque Helado)", () => {
      const toqueHelado = {
        nombre: "Toque helado",
        dadosDaño: "1d10",
        tipoDaño: "necrótico",
        descripcion: "Canalizas frío sepulcral. Mejora de truco. El daño aumenta en 1d10 cuando alcanzas el nivel 5 (2d10), 11 (3d10) y 17 (4d10).",
        requiereAtaque: true
      };
      const res = construirFormulaTaleSpireTruco(toqueHelado, 5, 5, "Valeros");
      expect(res.formulaTaleSpire).toBe("!Ataque Toque helado:1d20+5/Daño (necrótico):2d10");
      expect(res.etiquetaLog).toBe("Valeros - Toque helado (Truco Nv.5 -> 2d10)");
    });

    it("NO escala trucos que no tienen cláusula de Mejora de truco (ej. Garrote / Shillelagh)", () => {
      const garrote = {
        nombre: "Garrote",
        dadosDaño: "1d8",
        tipoDaño: "contundente",
        descripcion: "La madera de una porra o bastón que sostienes se imbuye con el poder de la naturaleza. Puedes usar tu modificador de lanzamiento de conjuros para las tiradas de ataque y daño, y el dado de daño del arma pasa a ser un d8.",
        requiereAtaque: true
      };
      const infoGarroteNv5 = calcularInfoTruco(garrote, 5);
      expect(infoGarroteNv5.formula).toBe("1d8");
      expect(infoGarroteNv5.multiplicador).toBe(1);
      expect(infoGarroteNv5.etiquetaVisual).toBe("1d8");

      const resGarrote = construirFormulaTaleSpireTruco(garrote, 5, 4, "Druida");
      expect(resGarrote.formulaTaleSpire).toBe("!Ataque Garrote:1d20+4/Daño (contundente):1d8");
      expect(resGarrote.etiquetaLog).toBe("Druida - Garrote (Truco Nv.5)");
    });

    it("construye fórmula TaleSpire limpia para trucos utilitarios (ej. Guía, Luz, Mano de mago)", () => {
      const guia = {
        nombre: "Guía",
        descripcion: "Tocas a una criatura voluntaria. Una vez antes de que el conjuro termine, el objetivo puede tirar un 1d4..."
      };
      const resGuia = construirFormulaTaleSpireTruco(guia, 5, 5, "Valeros");
      expect(resGuia.formulaTaleSpire).toBe("!Lanzar Truco:Guía");
      expect(resGuia.etiquetaLog).toBe("Valeros - Guía (Truco)");

      const infoGuia = calcularInfoTruco(guia, 5);
      expect(infoGuia.formula).toBe("");
      expect(infoGuia.etiquetaVisual).toBe("");
    });
  });

  describe("calcularFormulaEscalada (Upcasting Conjuros Nivel 1+)", () => {
    it("devuelve la fórmula base si se lanza al nivel base", () => {
      const res = calcularFormulaEscalada("3d6", "1d6", 1, 1);
      expect(res.formula).toBe("3d6");
      expect(res.adicionalText).toBe("");
    });

    it("combina correctamente dados compatibles de nivel superior", () => {
      // Bola de Fuego lanzada a nivel 5 (base 8d6 en nivel 3, +1d6 por nivel superior)
      const res = calcularFormulaEscalada("8d6", "1d6", 3, 5);
      expect(res.formula).toBe("10d6");
      expect(res.adicionalText).toBe("+2d6 (Combinado)");
    });
  });

  describe("formatearComponentes (Canónico sin Legacy)", () => {
    it("formatea correctamente componentes verbales, somáticos y materiales", () => {
      expect(formatearComponentes({ verbal: true, somatico: true, material: true })).toBe("V, S, M");
    });

    it("formatea correctamente solo verbal y somático", () => {
      expect(formatearComponentes({ verbal: true, somatico: true, material: false })).toBe("V, S");
    });

    it("formatea correctamente solo verbal", () => {
      expect(formatearComponentes({ verbal: true, somatico: false, material: false })).toBe("V");
    });

    it("formatea correctamente solo material", () => {
      expect(formatearComponentes({ verbal: false, somatico: false, material: true })).toBe("M");
    });

    it("devuelve 'Ninguno' si ningún componente está activo o es nulo/indefinido", () => {
      expect(formatearComponentes({ verbal: false, somatico: false, material: false })).toBe("Ninguno");
      expect(formatearComponentes(undefined)).toBe("Ninguno");
      expect(formatearComponentes(null)).toBe("Ninguno");
    });
  });

  describe("Proyectiles Múltiples (Proyectil Mágico, Rayo Abrasador, Descarga Sobrenatural)", () => {
    const proyectilMagico = {
      id: "h_proyectil-magico",
      nombre: "Proyectil mágico",
      nivel: 1,
      dadosDaño: "1d4+1",
      tipoDaño: "fuerza",
      requiereAtaque: false
    };

    const rayoAbrasador = {
      id: "h_rayo-abrasador",
      nombre: "Rayo abrasador",
      nivel: 2,
      dadosDaño: "2d6",
      tipoDaño: "fuego",
      requiereAtaque: true
    };

    it("detecta y calcula correctamente Proyectil Mágico a nivel 1 (3 dardos)", () => {
      const info = obtenerInfoProyectilesMultiples(proyectilMagico, { nivelLanzamiento: 1 });
      expect(info).not.toBeNull();
      expect(info?.cantidadProyectiles).toBe(3);
      expect(info?.requiereAtaque).toBe(false);
      expect(info?.formulaPorProyectil).toBe("1d4+1");
      expect(info?.etiquetaSingular).toBe("Dardo");
      expect(info?.etiquetaVisual).toBe("3 dardos (1d4+1 c/u)");

      const ts = construirFormulaTaleSpireEspacio(proyectilMagico, 1, 4, "Mago");
      expect(ts.formulaTaleSpire).toBe(
        "!Daño Dardo 1 (fuerza):1d4+1/Daño Dardo 2 (fuerza):1d4+1/Daño Dardo 3 (fuerza):1d4+1"
      );
      expect(ts.etiquetaLog).toBe("Mago - Proyectil mágico (3 dardos)");
    });

    it("escala Proyectil Mágico con Upcast a nivel 3 (5 dardos)", () => {
      const info = obtenerInfoProyectilesMultiples(proyectilMagico, { nivelLanzamiento: 3 });
      expect(info?.cantidadProyectiles).toBe(5);

      const ts = construirFormulaTaleSpireEspacio(proyectilMagico, 3, 4, "Mago");
      expect(ts.formulaTaleSpire).toBe(
        "!Daño Dardo 1 (fuerza):1d4+1/Daño Dardo 2 (fuerza):1d4+1/Daño Dardo 3 (fuerza):1d4+1/Daño Dardo 4 (fuerza):1d4+1/Daño Dardo 5 (fuerza):1d4+1"
      );
      expect(ts.etiquetaLog).toBe("Mago - Proyectil mágico (Nv.3 -> 5 dardos)");
    });

    it("detecta y calcula correctamente Rayo Abrasador a nivel 2 (3 rayos con tirada de ataque individual)", () => {
      const info = obtenerInfoProyectilesMultiples(rayoAbrasador, { nivelLanzamiento: 2 });
      expect(info).not.toBeNull();
      expect(info?.cantidadProyectiles).toBe(3);
      expect(info?.requiereAtaque).toBe(true);
      expect(info?.formulaPorProyectil).toBe("2d6");
      expect(info?.etiquetaSingular).toBe("Rayo");
      expect(info?.etiquetaVisual).toBe("3 rayos (2d6 c/u)");

      const ts = construirFormulaTaleSpireEspacio(rayoAbrasador, 2, 5, "Hechicero");
      expect(ts.formulaTaleSpire).toBe(
        "!Ataque Rayo 1:1d20+5/Daño Rayo 1 (fuego):2d6/Ataque Rayo 2:1d20+5/Daño Rayo 2 (fuego):2d6/Ataque Rayo 3:1d20+5/Daño Rayo 3 (fuego):2d6"
      );
      expect(ts.etiquetaLog).toBe("Hechicero - Rayo abrasador (3 rayos)");
    });

    it("escala Rayo Abrasador con Upcast a nivel 4 (5 rayos independientes)", () => {
      const info = obtenerInfoProyectilesMultiples(rayoAbrasador, { nivelLanzamiento: 4 });
      expect(info?.cantidadProyectiles).toBe(5);

      const ts = construirFormulaTaleSpireEspacio(rayoAbrasador, 4, 6, "Hechicero");
      expect(ts.formulaTaleSpire).toContain("Ataque Rayo 5:1d20+6/Daño Rayo 5 (fuego):2d6");
      expect(ts.etiquetaLog).toBe("Hechicero - Rayo abrasador (Nv.4 -> 5 rayos)");
    });
  });

  describe("Bono Numérico de Daño Mágico a Conjuros (+PB / Revelación Celestial y Rasgos)", () => {
    describe("aplicarBonoNumericoAFormulaDados", () => {
      it("aplica bono positivo a fórmula de dados simple sin modificador previo", () => {
        expect(aplicarBonoNumericoAFormulaDados("1d10", 2)).toBe("1d10+2");
        expect(aplicarBonoNumericoAFormulaDados("8d6", 3)).toBe("8d6+3");
        expect(aplicarBonoNumericoAFormulaDados("2d8", 4)).toBe("2d8+4");
      });

      it("compone y suma aritméticamente modificadores existentes (directo a la fórmula para TaleSpire)", () => {
        expect(aplicarBonoNumericoAFormulaDados("1d4+1", 2)).toBe("1d4+3");
        expect(aplicarBonoNumericoAFormulaDados("2d6-1", 3)).toBe("2d6+2");
        expect(aplicarBonoNumericoAFormulaDados("2d6-2", 2)).toBe("2d6");
      });

      it("devuelve la fórmula sin cambios si el bono es 0 o la fórmula está vacía", () => {
        expect(aplicarBonoNumericoAFormulaDados("1d10", 0)).toBe("1d10");
        expect(aplicarBonoNumericoAFormulaDados("", 2)).toBe("");
        expect(aplicarBonoNumericoAFormulaDados("N/A", 2)).toBe("N/A");
      });
    });

    describe("construirFormulaTaleSpireTruco con bonoDanoMagico (+PB)", () => {
      it("añade el bono al daño de un truco concentrado simple (Saeta de fuego)", () => {
        const saetaFuego = {
          id: "saeta-de-fuego",
          nombre: "Saeta de fuego",
          nivel: 0,
          dadosDaño: "1d10",
          tipoDaño: "fuego",
          requiereAtaque: true
        };
        const res = construirFormulaTaleSpireTruco(saetaFuego, 1, 5, "Asimar Mago", 2);
        expect(res.formulaTaleSpire).toBe("!Ataque Saeta de fuego:1d20+5/Daño (fuego):1d10+2");
      });

      it("en trucos de múltiples rayos (Descarga sobrenatural), suma el bono sólo al primer rayo (regla 1 vez por turno)", () => {
        const descargaSobrenatural = {
          id: "descarga-sobrenatural",
          nombre: "Descarga sobrenatural",
          nivel: 0,
          dadosDaño: "1d10",
          tipoDaño: "fuerza",
          requiereAtaque: true
        };
        // Nivel 5 -> 2 rayos, bonoDanoMagico = 3 (+PB)
        const res = construirFormulaTaleSpireTruco(descargaSobrenatural, 5, 6, "Brujo Asimar", 3);
        expect(res.formulaTaleSpire).toBe(
          "!Ataque Rayo 1:1d20+6/Daño Rayo 1 (fuerza):1d10+3/Ataque Rayo 2:1d20+6/Daño Rayo 2 (fuerza):1d10"
        );
      });
    });

    describe("construirFormulaTaleSpireEspacio con bonoDanoMagico (+PB)", () => {
      it("añade el bono directamente al daño de un conjuro de espacio estándar (Bola de fuego)", () => {
        const bolaFuego = {
          id: "bola-de-fuego",
          nombre: "Bola de fuego",
          nivel: 3,
          dadosDaño: "8d6",
          tipoDaño: "fuego",
          ataqueCd: "CD",
          cdSalvacion: "15"
        };
        const res = construirFormulaTaleSpireEspacio(bolaFuego, 3, 5, "Mago Asimar", 3);
        expect(res.formulaTaleSpire).toBe("!Daño Bola de fuego(fuego):8d6+3");
      });

      it("en Proyectil Mágico, suma el bono al primer dardo de forma directa (1d4+1 + 2 -> 1d4+3)", () => {
        const proyectilMagico = {
          id: "proyectil-magico",
          nombre: "Proyectil mágico",
          nivel: 1,
          dadosDaño: "1d4+1",
          tipoDaño: "fuerza"
        };
        const res = construirFormulaTaleSpireEspacio(proyectilMagico, 1, 4, "Mago Asimar", 2);
        expect(res.formulaTaleSpire).toBe(
          "!Daño Dardo 1 (fuerza):1d4+3/Daño Dardo 2 (fuerza):1d4+1/Daño Dardo 3 (fuerza):1d4+1"
        );
      });

      it("en Rayo Abrasador, suma el bono al daño del primer rayo y conserva el daño base en los siguientes", () => {
        const rayoAbrasador = {
          id: "rayo-abrasador",
          nombre: "Rayo abrasador",
          nivel: 2,
          dadosDaño: "2d6",
          tipoDaño: "fuego",
          requiereAtaque: true
        };
        const res = construirFormulaTaleSpireEspacio(rayoAbrasador, 2, 5, "Hechicero Asimar", 3);
        expect(res.formulaTaleSpire).toBe(
          "!Ataque Rayo 1:1d20+5/Daño Rayo 1 (fuego):2d6+3/Ataque Rayo 2:1d20+5/Daño Rayo 2 (fuego):2d6/Ataque Rayo 3:1d20+5/Daño Rayo 3 (fuego):2d6"
        );
      });
    });
  });
});


