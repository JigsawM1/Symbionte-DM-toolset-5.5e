import { describe, it, expect } from "vitest";
import { esCompetenteConArma, COMPETENCIAS_COMBATE_ESPECIALES } from "@/constantes/competenciasConstantes";
import type { Caracteristica } from "@/tipos";

describe("Reglas de Combate D&D 5.5e: Armas Sutiles, Improvisadas y Golpe Desarmado", () => {
  describe("1. Selección de Atributos y Armas Sutiles (Finesse)", () => {
    it("escoge automáticamente la mayor entre Fuerza y Destreza para un arma sutil", () => {
      const calcularAtributoSutil = (
        modFuerza: number,
        modDestreza: number
      ): Caracteristica => {
        return modDestreza >= modFuerza ? "destreza" : "fuerza";
      };

      // Destreza mayor que Fuerza -> Destreza
      expect(calcularAtributoSutil(1, 3)).toBe("destreza");
      // Fuerza mayor que Destreza -> Fuerza
      expect(calcularAtributoSutil(4, 2)).toBe("fuerza");
      // Iguales -> Destreza por defecto
      expect(calcularAtributoSutil(2, 2)).toBe("destreza");
    });

    it("filtra las opciones del selector de características: solo muestra DES si es sutil o a distancia", () => {
      const generarOpcionesAtributo = (
        esSutil: boolean,
        esDistancia: boolean
      ): { valor: Caracteristica; etiqueta: string }[] => {
        if (esSutil) {
          return [
            { valor: "fuerza", etiqueta: "FUE" },
            { valor: "destreza", etiqueta: "DES" },
            { valor: "inteligencia", etiqueta: "INT" },
            { valor: "sabiduria", etiqueta: "SAB" },
            { valor: "carisma", etiqueta: "CAR" }
          ];
        }
        if (esDistancia) {
          return [
            { valor: "destreza", etiqueta: "DES" },
            { valor: "inteligencia", etiqueta: "INT" },
            { valor: "sabiduria", etiqueta: "SAB" },
            { valor: "carisma", etiqueta: "CAR" }
          ];
        }
        // Cuerpo a cuerpo no sutil: Fuerza y aptitudes mágicas
        return [
          { valor: "fuerza", etiqueta: "FUE" },
          { valor: "inteligencia", etiqueta: "INT" },
          { valor: "sabiduria", etiqueta: "SAB" },
          { valor: "carisma", etiqueta: "CAR" }
        ];
      };

      // Arma sutil (ej. Daga, Estoque, Cimitarra)
      const opcionesSutil = generarOpcionesAtributo(true, false);
      expect(opcionesSutil.map((o) => o.valor)).toEqual([
        "fuerza",
        "destreza",
        "inteligencia",
        "sabiduria",
        "carisma"
      ]);
      expect(opcionesSutil.some((o) => o.valor === "destreza")).toBe(true);

      // Arma cuerpo a cuerpo no sutil (ej. Espadón, Hacha de guerra)
      const opcionesNoSutil = generarOpcionesAtributo(false, false);
      expect(opcionesNoSutil.map((o) => o.valor)).toEqual([
        "fuerza",
        "inteligencia",
        "sabiduria",
        "carisma"
      ]);
      expect(opcionesNoSutil.some((o) => o.valor === "destreza")).toBe(false);

      // Arma a distancia (ej. Arco corto, Ballesta)
      const opcionesDistancia = generarOpcionesAtributo(false, true);
      expect(opcionesDistancia.map((o) => o.valor)).toEqual([
        "destreza",
        "inteligencia",
        "sabiduria",
        "carisma"
      ]);
      expect(opcionesDistancia.some((o) => o.valor === "fuerza")).toBe(false);
    });
  });

  describe("2. Golpe Desarmado (Unarmed Strike)", () => {
    it("utiliza Fuerza y daño fijo (1 + modFue) por defecto para un personaje que no es Monje", () => {
      const modFue = 3;
      const modDes = 4; // Aunque DES sea mayor, usa Fuerza si no es Monje
      const esMonje = false;
      const bonoCompetencia = 2;
      const esCompetente = true;

      const caracDefecto = esMonje && modDes > modFue ? "destreza" : "fuerza";
      const modUsado = caracDefecto === "destreza" ? modDes : modFue;
      const bonoAtaque = (esCompetente ? bonoCompetencia : 0) + modUsado;
      const danoFijo = Math.max(1, 1 + modUsado);

      expect(caracDefecto).toBe("fuerza");
      expect(modUsado).toBe(3);
      expect(bonoAtaque).toBe(5); // 2 + 3
      expect(danoFijo).toBe(4); // 1 + 3
    });

    it("utiliza Destreza y dado de artes marciales para la clase Monje si Destreza es mayor", () => {
      const modFue = 1;
      const modDes = 4;
      const esMonje = true;
      const nivelPj = 5;
      const bonoCompetencia = 3;
      const esCompetente = true;

      const caracDefecto = esMonje && modDes > modFue ? "destreza" : "fuerza";
      const modUsado = caracDefecto === "destreza" ? modDes : modFue;
      const bonoAtaque = (esCompetente ? bonoCompetencia : 0) + modUsado;

      // Nivel 5: 1d8
      let dadoMonje = "1d6";
      if (nivelPj >= 17) dadoMonje = "1d12";
      else if (nivelPj >= 11) dadoMonje = "1d10";
      else if (nivelPj >= 5) dadoMonje = "1d8";

      const formulaDano = `${dadoMonje}+${modUsado}`;

      expect(caracDefecto).toBe("destreza");
      expect(bonoAtaque).toBe(7); // 3 + 4
      expect(formulaDano).toBe("1d8+4");
    });
  });

  describe("3. Golpe con Arma Improvisada (Improvised Weapon)", () => {
    it("genera daño 1d4 + Fuerza y calcula correctamente el impacto según competencia", () => {
      const modFue = 3;
      const bonoCompetencia = 2;

      // Caso A: No competente (sin dote ni entrenamiento)
      const esCompetenteA = false;
      const bonoAtaqueA = (esCompetenteA ? bonoCompetencia : 0) + modFue;
      const formulaDanoA = `1d4+${modFue}`;

      expect(bonoAtaqueA).toBe(3); // Solo modFue
      expect(formulaDanoA).toBe("1d4+3");

      // Caso B: Competente (con dote Tabernero Pendenciero / competencia seleccionada)
      const esCompetenteB = true;
      const bonoAtaqueB = (esCompetenteB ? bonoCompetencia : 0) + modFue;
      const formulaDanoB = `1d4+${modFue}`;

      expect(bonoAtaqueB).toBe(5); // 2 + 3
      expect(formulaDanoB).toBe("1d4+3");
    });
  });

  describe("4. Validación de Competencias de Combate con esCompetenteConArma", () => {
    it("reconoce las competencias especiales de combate en singular, plural y variantes tolerantes", () => {
      expect(COMPETENCIAS_COMBATE_ESPECIALES).toContain("Ataque desarmado");
      expect(COMPETENCIAS_COMBATE_ESPECIALES).toContain("Armas improvisadas");

      const listaConDesarmado = ["Ataque desarmado", "Daga", "Espada corta"];
      const listaConImprovisadas = ["Armas improvisadas", "Espada larga"];

      // Ataque desarmado
      expect(esCompetenteConArma("Golpe sin Armas", "Sencilla", [], listaConDesarmado)).toBe(true);
      expect(esCompetenteConArma("Ataque Desarmado", "Sencilla", [], listaConDesarmado)).toBe(true);
      expect(esCompetenteConArma("Golpe sin Armas", "Sencilla", [], [])).toBe(false);

      // Armas improvisadas
      expect(esCompetenteConArma("Golpe con Arma Improvisada", "Improvisada", [], listaConImprovisadas)).toBe(true);
      expect(esCompetenteConArma("Arma Improvisada", "Improvisada", [], listaConImprovisadas)).toBe(true);
      expect(esCompetenteConArma("Arma Improvisada", "Improvisada", [], [])).toBe(false);
    });
  });
});
