import { describe, it, expect } from "vitest";
import {
  normalizarNombreTaleSpire,
  resolverPlantillaPorCriatura,
  calcularVidaInicial,
} from "./resolutorCriaturas";
import { crearIndiceMonstruos } from "./indiceMonstruos";
import type { MonstruoBase } from "@/almacen/usarAlmacenDM";

describe("resolutorCriaturas - normalizarNombreTaleSpire", () => {
  it("debe convertir a minúsculas y recortar espacios en blanco", () => {
    const res = normalizarNombreTaleSpire("   Orco Gigante   ");
    expect(res.completo).toBe("orco gigante");
    expect(res.base).toBe("orco gigante");
  });

  it("debe remover sufijos numéricos de TaleSpire", () => {
    const res1 = normalizarNombreTaleSpire("Trasgo 5");
    expect(res1.base).toBe("trasgo");

    const res2 = normalizarNombreTaleSpire("Trasgo 12");
    expect(res2.base).toBe("trasgo");
  });

  it("debe remover sufijos de ID con numeral", () => {
    const res = normalizarNombreTaleSpire("Lobo #abc123d");
    expect(res.base).toBe("lobo");
  });

  it("debe remover sufijos de letras solas de grupo", () => {
    const res = normalizarNombreTaleSpire("Duende A");
    expect(res.base).toBe("duende");
  });

  it("debe manejar combinaciones complejas", () => {
    const res = normalizarNombreTaleSpire("Esqueleto Guerrero B #789");
    // El primer replace quita el '#' y lo que sigue: "esqueleto guerrero b"
    // El segundo replace quita la 'b' sola al final: "esqueleto guerrero"
    expect(res.base).toBe("esqueleto guerrero");
  });
});

describe("resolutorCriaturas - resolverPlantillaPorCriatura", () => {
  // Mock de monstruos de base de datos
  const mockMonstruos = [
    { id: "id-trasgo", nombre: "Trasgo", vidaMaxima: 7, caracteristicas: { fuerza: 8 } },
    { id: "id-lobo", nombre: "Lobo", vidaMaxima: 11, caracteristicas: { fuerza: 12 } },
    { id: "id-lobo-artico", nombre: "Lobo Ártico", vidaMaxima: 19, caracteristicas: { fuerza: 14 } },
  ] as unknown as MonstruoBase[];

  const indice = crearIndiceMonstruos(mockMonstruos);

  it("debe encontrar por coincidencia exacta de nombre", () => {
    const res = resolverPlantillaPorCriatura("mini-1", "Trasgo", {}, indice);
    expect(res).toBeDefined();
    expect(res?.id).toBe("id-trasgo");
  });

  it("debe encontrar por coincidencia exacta usando nombre normalizado", () => {
    const res = resolverPlantillaPorCriatura("mini-1", "Lobo 3", {}, indice);
    expect(res).toBeDefined();
    expect(res?.id).toBe("id-lobo");
  });

  it("debe encontrar por asociación directa de ID física", () => {
    const asociaciones = {
      "mini-fisica-123": "id-lobo-artico",
    };
    const res = resolverPlantillaPorCriatura("mini-fisica-123", "NombreCualquiera", asociaciones, indice);
    expect(res).toBeDefined();
    expect(res?.id).toBe("id-lobo-artico");
  });

  it("debe encontrar por asociación de nombre completo", () => {
    const asociaciones = {
      "nombre_base:orco mutado": "id-trasgo",
    };
    const res = resolverPlantillaPorCriatura("mini-99", "Orco Mutado", asociaciones, indice);
    expect(res).toBeDefined();
    expect(res?.id).toBe("id-trasgo");
  });

  it("debe encontrar por coincidencia parcial de prefijo en fallback", () => {
    // Lobo Ártico 4 -> base "lobo ártico" -> coincide con la plantilla "Lobo Ártico"
    const res = resolverPlantillaPorCriatura("mini-2", "Lobo Ártico Extra 5", {}, indice);
    expect(res).toBeDefined();
    expect(res?.id).toBe("id-lobo-artico");
  });

  it("debe devolver undefined si no encuentra ninguna coincidencia", () => {
    const res = resolverPlantillaPorCriatura("mini-x", "Dragón Rojo", {}, indice);
    expect(res).toBeUndefined();
  });
});

describe("resolutorCriaturas - calcularVidaInicial", () => {
  const plantillaLobo = {
    id: "id-lobo",
    nombre: "Lobo",
    vidaMaxima: 11,
    vidaNotas: "2d8+2",
  } as unknown as MonstruoBase;

  it("debe usar vida estandar de plantilla si el método es estandar", () => {
    const res = calcularVidaInicial(plantillaLobo, "estandar");
    expect(res.vidaMaxima).toBe(11);
    expect(res.vidaActual).toBe(11);
  });

  it("debe calcular vida por dados si el método es maximo", () => {
    const res = calcularVidaInicial(plantillaLobo, "maximo");
    // 2d8+2 -> maximo es 8*2 + 2 = 18
    expect(res.vidaMaxima).toBe(18);
    expect(res.vidaActual).toBe(18);
  });

  it("debe calcular vida por dados si el método es azar", () => {
    const res = calcularVidaInicial(plantillaLobo, "azar");
    // 2d8+2 -> el rango va de 4 a 18
    expect(res.vidaMaxima).toBeGreaterThanOrEqual(4);
    expect(res.vidaMaxima).toBeLessThanOrEqual(18);
    expect(res.vidaActual).toBe(res.vidaMaxima);
  });

  it("debe usar datos de TaleSpire si no hay plantilla pero se definieron hp/maxHp", () => {
    const res = calcularVidaInicial(undefined, "estandar", 30, 25);
    expect(res.vidaMaxima).toBe(30);
    expect(res.vidaActual).toBe(25);
  });

  it("debe usar valores por defecto si no hay plantilla ni datos válidos de TaleSpire", () => {
    const res = calcularVidaInicial(undefined, "estandar");
    expect(res.vidaMaxima).toBe(10);
    expect(res.vidaActual).toBe(10);
  });
});
