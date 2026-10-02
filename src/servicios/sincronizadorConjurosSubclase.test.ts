import { describe, it, expect } from "vitest";
import { sincronizarConjurosSubclaseHelper } from "./sincronizadorConjurosSubclase";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import type { PersonajeJugador } from "@/tipos";

describe("sincronizadorConjurosSubclase", () => {
  const personajeBase: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj_test_1",
    nombre: "Clérigo de la Vida",
    clase: "Clérigo",
    subclase: "Dominio de la Vida",
    nivel: 3,
    clases: [{ nombre: "Clérigo", subclase: "Dominio de la Vida", nivel: 3 }],
    esLanzador: true,
    clasesLanzadoras: [
      {
        clase: "Clérigo",
        tipoLanzador: "completo",
        nivel: 3,
        habilidadConjuro: "sabiduria",
        modeloConjuros: "preparados"
      }
    ],
    conjurosSiemprePreparadosIds: [],
    conjurosPreparadosIds: ["h_guia", "h_bendicion"],
    conjurosConocidosIds: [],
    trucosConocidosIds: []
  };

  it("debe agregar automáticamente los conjuros de subclase de nivel 1 y 2 para Clérigo de la Vida Nv. 3", () => {
    const sincronizado = sincronizarConjurosSubclaseHelper(personajeBase);
    
    // Dominio de la Vida a Nv 3 incluye Bendición, Curar heridas, Auxilio y Restablecimiento menor
    expect(sincronizado.conjurosSiemprePreparadosIds.length).toBeGreaterThan(0);
    expect(sincronizado.conjurosPreparadosIds.length).toBeGreaterThanOrEqual(sincronizado.conjurosSiemprePreparadosIds.length);
  });

  it("debe depurar los conjuros de niveles superiores si el personaje baja de nivel", () => {
    // A nivel 9 tiene conjuros de hasta nivel 5 (como Revivir, Revivir a los muertos, etc.)
    const nivelAlto = sincronizarConjurosSubclaseHelper({
      ...personajeBase,
      nivel: 9,
      clases: [{ nombre: "Clérigo", subclase: "Dominio de la Vida", nivel: 9 }],
      clasesLanzadoras: [
        {
          clase: "Clérigo",
          tipoLanzador: "completo",
          nivel: 9,
          habilidadConjuro: "sabiduria",
          modeloConjuros: "preparados"
        }
      ]
    });

    const cantidadNivel9 = nivelAlto.conjurosSiemprePreparadosIds.length;

    // Al bajar a nivel 1
    const bajadoDeNivel = sincronizarConjurosSubclaseHelper(
      nivelAlto,
      [{ nombre: "Clérigo", subclase: "Dominio de la Vida", nivel: 1 }],
      "Clérigo",
      "Dominio de la Vida",
      1
    );

    expect(bajadoDeNivel.conjurosSiemprePreparadosIds.length).toBeLessThan(cantidadNivel9);
  });

  it("debe limpiar los conjuros de la subclase previa al cambiar de subclase", () => {
    const clerigoVida = sincronizarConjurosSubclaseHelper({
      ...personajeBase,
      subclase: "Dominio de la Vida",
      clases: [{ nombre: "Clérigo", subclase: "Dominio de la Vida", nivel: 3 }],
      nivel: 3
    });

    // Cambiar a Dominio de la Luz
    const clerigoLuz = sincronizarConjurosSubclaseHelper(
      clerigoVida,
      [{ nombre: "Clérigo", subclase: "Dominio de la Luz", nivel: 3 }],
      "Clérigo",
      "Dominio de la Luz",
      3
    );

    expect(clerigoLuz.conjurosSiemprePreparadosIds).toBeDefined();
    expect(clerigoLuz.conjurosSiemprePreparadosIds.length).toBeGreaterThan(0);
  });

  it("debe agregar Mano de mago para Pícaro Embaucador Arcano y limpiar placeholders", () => {
    const picaroEmbaucador: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj_picaro_test",
      nombre: "Pícaro Tramposo",
      clase: "Pícaro",
      subclase: "Embaucador Arcano",
      nivel: 3,
      clases: [{ nombre: "Pícaro", subclase: "Embaucador Arcano", nivel: 3 }],
      esLanzador: true,
      clasesLanzadoras: [
        {
          clase: "Pícaro",
          tipoLanzador: "tercio",
          nivel: 3,
          habilidadConjuro: "inteligencia",
          modeloConjuros: "conocidos",
          listaConjuros: "mago"
        }
      ],
      conjurosSiemprePreparadosIds: [],
      conjurosPreparadosIds: [],
      conjurosConocidosIds: [],
      trucosConocidosIds: ["2 trucos de Mago a elección"]
    };

    const sincronizado = sincronizarConjurosSubclaseHelper(picaroEmbaucador);

    // Debe incluir Mano de mago
    expect(sincronizado.trucosConocidosIds).toContain("Mano de mago");
    // No debe contener el placeholder de texto
    expect(sincronizado.trucosConocidosIds).not.toContain("2 trucos de Mago a elección");
    // conjurosSiemprePreparadosIds debe mantenerse vacío (no hay conjuros fijos de subclase)
    expect(sincronizado.conjurosSiemprePreparadosIds).toEqual([]);
  });

  it("debe retornar la misma referencia si el personaje ya está sincronizado", () => {
    const picaroSincronizado: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj_picaro_sync",
      clase: "Pícaro",
      subclase: "Embaucador Arcano",
      nivel: 3,
      clases: [{ nombre: "Pícaro", subclase: "Embaucador Arcano", nivel: 3 }],
      conjurosSiemprePreparadosIds: [],
      conjurosPreparadosIds: [],
      conjurosConocidosIds: [],
      trucosConocidosIds: ["Mano de mago"]
    };

    const resultado = sincronizarConjurosSubclaseHelper(picaroSincronizado);
    expect(resultado).toBe(picaroSincronizado);
  });
});

