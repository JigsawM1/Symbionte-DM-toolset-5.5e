import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TABLAS_CRITICOS_55E, obtenerEfectoCritico, formatearEfectoCritico } from "./tablasCriticos";
import type { TipoCombate, SentidoTirada } from "./tablasCriticos";

const tipos: TipoCombate[] = ["melee", "distancia", "magico"];
const sentidos: SentidoTirada[] = ["critico", "pifia"];

describe("Tablas de combate d12 del DM", () => {
  it("conserva el contenido y el orden de los 72 efectos del documento del usuario", () => {
    const documento = readFileSync(new URL("./compendios/tabla criticos.md", import.meta.url), "utf8");
    const [criticos, pifias] = documento.replace(/\*/g, "").split("Sistema de Pifias Basado");
    const filasCriticos = criticos.split(/\r?\n/).filter(linea => /^\| \d+ \|/.test(linea))
      .map(linea => linea.split("|").slice(1, -1).map(celda => celda.trim()));
    const filasPifias = [...pifias.matchAll(/(?:^|\r?\n)(\d+)\r?\n(Narrativo \+ Táctico|Mecánico Puro)\r?\n([^\r\n]+)\r?\n([^\r\n]+)\r?\n([^\r\n]+)/g)]
      .map(coincidencia => coincidencia.slice(1));
    const valores = sentidos.flatMap(sentido => tipos.flatMap(tipo => {
      const tabla = sentido === "critico" ? TABLAS_CRITICOS_55E[tipo].criticos : TABLAS_CRITICOS_55E[tipo].pifias;
      return tabla.map(efecto => [String(efecto.numero), efecto.tipo, efecto.nombre, efecto.narrativa, efecto.mecanica]);
    }));
    expect(filasCriticos).toHaveLength(36);
    expect(filasPifias).toHaveLength(36);
    expect(valores).toEqual([...filasCriticos, ...filasPifias]);
  });

  for (const tipo of tipos) for (const sentido of sentidos) {
    it(`${tipo} / ${sentido}: resuelve cada cara, con la división táctica en 6 y 7`, () => {
      for (let numero = 1; numero <= 12; numero++) {
        const efecto = obtenerEfectoCritico(tipo, sentido, numero);
        expect(efecto.numero).toBe(numero);
        expect(efecto.tipo).toBe(numero <= 6 ? "Narrativo + Táctico" : "Mecánico Puro");
        expect(efecto.nombre).not.toBe("");
        expect(formatearEfectoCritico(efecto)).toContain(efecto.narrativa);
        expect(formatearEfectoCritico(efecto)).toContain(efecto.mecanica);
      }
    });
  }

  it("rechaza caras fuera del d12 y resultados fraccionarios", () => {
    for (const numero of [0, 13, 20, -1, 1.5, NaN]) {
      expect(() => obtenerEfectoCritico("melee", "critico", numero)).toThrow(RangeError);
    }
  });

  it("mantiene los efectos extremos correctos por categoría y sentido", () => {
    expect(obtenerEfectoCritico("melee", "critico", 12).nombre).toBe("Impacto Devastador");
    expect(obtenerEfectoCritico("distancia", "critico", 12).nombre).toBe("Precisión Quirúrgica");
    expect(obtenerEfectoCritico("magico", "critico", 12).nombre).toBe("Estallido Sobrenatural");
    expect(obtenerEfectoCritico("melee", "pifia", 12).nombre).toBe("Descalabro Táctico");
    expect(obtenerEfectoCritico("distancia", "pifia", 12).nombre).toBe("Autolesión Catastrófica");
    expect(obtenerEfectoCritico("magico", "pifia", 12).nombre).toBe("Colapso del Tejido");
  });
});
