import { describe, it, expect } from "vitest";
import {
  normalizarParaBusqueda,
  tokenizarBusqueda,
  coincideBusquedaTolerante,
  desduplicarEntidades,
  calcularRelevanciaBusqueda,
  compararPorRelevanciaTitulo
} from "./busquedaTolerante";

describe("busquedaTolerante - Búsqueda insensible a tildes, mayúsculas y orden", () => {
  it("normaliza cadenas con tildes, mayúsculas y diéresis", () => {
    expect(normalizarParaBusqueda("Bastón")).toBe("baston");
    expect(normalizarParaBusqueda("POCIÓN DE CURACIÓN")).toBe("pocion de curacion");
    expect(normalizarParaBusqueda("Pingüino Ágil")).toBe("pinguino agil");
  });

  it("divide cadenas en tokens de búsqueda limpios", () => {
    expect(tokenizarBusqueda("Poción de Curación Mayor")).toEqual([
      "pocion",
      "de",
      "curacion",
      "mayor"
    ]);
    expect(tokenizarBusqueda("   ")).toEqual([]);
  });

  it("encuentra 'Bastón' buscando 'baston'", () => {
    expect(coincideBusquedaTolerante("Bastón", "baston")).toBe(true);
    expect(coincideBusquedaTolerante("Bastón", "BASTON")).toBe(true);
    expect(coincideBusquedaTolerante("Bastón", "bastón")).toBe(true);
  });

  it("encuentra 'Poción de Curación' con palabras en cualquier orden y sin tildes", () => {
    expect(coincideBusquedaTolerante("Poción de Curación", "pocion curacion")).toBe(true);
    expect(coincideBusquedaTolerante("Poción de Curación", "curacion pocion")).toBe(true);
    expect(coincideBusquedaTolerante("Poción de Curación", "curacion")).toBe(true);
    expect(coincideBusquedaTolerante("Poción de Curación", "POCION")).toBe(true);
  });

  it("busca sobre múltiples campos (nombre, subtitulo, categoria)", () => {
    const campos = ["Daga", "Armas Sencillas (Cuerpo a Cuerpo)", "1d4 perforante"];
    expect(coincideBusquedaTolerante(campos, "daga")).toBe(true);
    expect(coincideBusquedaTolerante(campos, "perforante")).toBe(true);
    expect(coincideBusquedaTolerante(campos, "sencillas daga")).toBe(true);
    expect(coincideBusquedaTolerante(campos, "daga 1d4")).toBe(true);
  });

  it("retorna true cuando la consulta está vacía", () => {
    expect(coincideBusquedaTolerante("Cualquier Cosa", "")).toBe(true);
    expect(coincideBusquedaTolerante("Cualquier Cosa", "   ")).toBe(true);
  });

  it("soporta búsqueda de 'ñ' escribiendo 'n' o 'ñ'", () => {
    expect(coincideBusquedaTolerante("Leñador", "lenador")).toBe(true);
    expect(coincideBusquedaTolerante("Leñador", "leñador")).toBe(true);
  });

  it("desduplica entidades por ID y por nombre normalizado (ej. Aceite duplicado)", () => {
    const lista1 = [
      { id: "oil", nombre: "Aceite", pesoLb: 1 },
      { id: "dagger", nombre: "Daga", pesoLb: 1 }
    ];
    const lista2 = [
      { id: "o_homebrew_oil", nombre: "Aceite", pesoLb: 1 }, // Mismo nombre, distinto ID
      { id: "shield", nombre: "Escudo", pesoLb: 6 }
    ];

    const resultado = desduplicarEntidades(lista1, lista2);
    expect(resultado.length).toBe(3);
    expect(resultado.map((r) => r.nombre)).toEqual(["Daga", "Aceite", "Escudo"]);
  });

  describe("Prioridad de Título y Relevancia (QoL)", () => {
    it("otorga mayor puntaje a coincidencias exactas o en título frente a campos secundarios", () => {
      const relExacta = calcularRelevanciaBusqueda("Fuego", "fuego");
      const relInicio = calcularRelevanciaBusqueda("Fuego de Alquimista", "fuego");
      const relContiene = calcularRelevanciaBusqueda("Bola de Fuego", "fuego");
      const relSecundaria = calcularRelevanciaBusqueda(
        "Armadura de Agathys",
        "fuego",
        ["Otorga protección contra daño de fuego."]
      );

      expect(relExacta).toBeGreaterThan(relInicio);
      expect(relInicio).toBeGreaterThan(relContiene);
      expect(relContiene).toBeGreaterThan(relSecundaria);
      expect(relSecundaria).toBeGreaterThan(0);
    });

    it("ordena los hechizos priorizando aquellos con el término en el título sobre los que solo lo tienen en la descripción", () => {
      const hechizos = [
        {
          id: "1",
          nombre: "Armadura de Agathys",
          descripcion: "Ganas resistencia al daño de fuego.",
          nivel: 1
        },
        {
          id: "2",
          nombre: "Rayo de Fuego",
          descripcion: "Disparas un rayo candente.",
          nivel: 1
        },
        {
          id: "3",
          nombre: "Bola de Fuego",
          descripcion: "Una explosión brillante.",
          nivel: 3
        },
        {
          id: "4",
          nombre: "Absorber Elementos",
          descripcion: "Captura energía de fuego, frío o ácido.",
          nivel: 1
        }
      ];

      const ordenados = [...hechizos].sort(
        compararPorRelevanciaTitulo(
          (h) => h.nombre,
          "fuego",
          (a, b) => a.nivel - b.nivel,
          (h) => [h.descripcion]
        )
      );

      // Los que tienen "Fuego" en el título deben ir primero
      expect(ordenados[0].nombre).toBe("Rayo de Fuego");
      expect(ordenados[1].nombre).toBe("Bola de Fuego");
      // Los que solo tienen "fuego" en la descripción deben ir después
      expect(["Absorber Elementos", "Armadura de Agathys"]).toContain(ordenados[2].nombre);
      expect(["Absorber Elementos", "Armadura de Agathys"]).toContain(ordenados[3].nombre);
    });

    it("ordena los objetos de inventario priorizando el nombre sobre notas o tipo", () => {
      const objetos = [
        {
          id: "1",
          nombre: "Mochila de Explorador",
          notas: "Contiene una poción de curación rápida."
        },
        {
          id: "2",
          nombre: "Poción de Curación Mayor",
          notas: "Cura 4d4+4 puntos de golpe."
        },
        {
          id: "3",
          nombre: "Curación Milagrosa (Hierba)",
          notas: "Hierbas medicinales."
        },
        {
          id: "4",
          nombre: "Ungüento de Keoghtom",
          notas: "Aplica curación y neutraliza veneno."
        }
      ];

      const ordenados = [...objetos].sort(
        compararPorRelevanciaTitulo(
          (o) => o.nombre,
          "curacion",
          (a, b) => a.nombre.localeCompare(b.nombre, "es"),
          (o) => [o.notas]
        )
      );

      // Los dos primeros deben tener "Curación" en el nombre
      expect(["Curación Milagrosa (Hierba)", "Poción de Curación Mayor"]).toContain(ordenados[0].nombre);
      expect(["Curación Milagrosa (Hierba)", "Poción de Curación Mayor"]).toContain(ordenados[1].nombre);
      // Los otros dos solo lo tienen en las notas
      expect(["Mochila de Explorador", "Ungüento de Keoghtom"]).toContain(ordenados[2].nombre);
      expect(["Mochila de Explorador", "Ungüento de Keoghtom"]).toContain(ordenados[3].nombre);
    });

    it("si la consulta está vacía, respeta el comparador de desempate original", () => {
      const items = [
        { id: "b", nombre: "Beta" },
        { id: "a", nombre: "Alfa" },
        { id: "c", nombre: "Gamma" }
      ];

      const ordenados = [...items].sort(
        compararPorRelevanciaTitulo(
          (i) => i.nombre,
          "",
          (a, b) => a.nombre.localeCompare(b.nombre, "es")
        )
      );

      expect(ordenados.map((i) => i.nombre)).toEqual(["Alfa", "Beta", "Gamma"]);
    });
  });
});
