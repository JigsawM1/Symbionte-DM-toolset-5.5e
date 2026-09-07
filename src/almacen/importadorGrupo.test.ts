import { describe, it, expect } from "vitest";
import { importarPersonajesDesdeJSON } from "./importadorJSON";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";

describe("Importador de Personajes y Grupos (Party Backup)", () => {
  it("importa correctamente un personaje individual con envoltorio de exportación", () => {
    const backupIndividual = {
      version: "5.5",
      tipo: "personaje",
      fechaExportacion: "2026-08-27T00:00:00.000Z",
      personaje: {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-alicia-1",
        nombre: "Alicia la Paladina",
        clase: "Paladín",
        nivel: 5,
        hpMaximo: 45,
        hpActual: 45
      }
    };

    const resultado = importarPersonajesDesdeJSON(backupIndividual);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].nombre).toBe("Alicia la Paladina");
    expect(resultado[0].clase).toBe("Paladín");
    expect(resultado[0].nivel).toBe(5);
    expect(resultado[0].hpMaximo).toBe(45);
  });

  it("importa correctamente un respaldo de grupo completo (Party Backup)", () => {
    const backupGrupo = {
      version: "5.5",
      tipo: "grupo_personajes",
      fechaExportacion: "2026-08-27T00:00:00.000Z",
      totalPersonajes: 3,
      personajes: [
        {
          ...PERSONAJE_POR_DEFECTO,
          id: "pj-1",
          nombre: "Kaelen",
          clase: "Pícaro",
          nivel: 4
        },
        {
          ...PERSONAJE_POR_DEFECTO,
          id: "pj-2",
          nombre: "Lyra",
          clase: "Barda",
          nivel: 4
        },
        {
          ...PERSONAJE_POR_DEFECTO,
          id: "pj-3",
          nombre: "Brom",
          clase: "Bárbaro",
          nivel: 4
        }
      ]
    };

    const resultado = importarPersonajesDesdeJSON(backupGrupo);
    expect(resultado).toHaveLength(3);
    expect(resultado[0].nombre).toBe("Kaelen");
    expect(resultado[1].nombre).toBe("Lyra");
    expect(resultado[2].nombre).toBe("Brom");
  });

  it("importa correctamente un array plano de personajes y sanea sus campos", () => {
    const arrayPlano = [
      {
        nombre: "Sombra",
        clase: "Monje",
        nivel: 2
      }
    ];

    const resultado = importarPersonajesDesdeJSON(arrayPlano);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].nombre).toBe("Sombra");
    expect(resultado[0].clase).toBe("Monje");
    expect(resultado[0].caracteristicas.destreza).toBe(10);
    expect(resultado[0].bolsaMonedas).toBeDefined();
    expect(resultado[0].salvacionesMuerte).toBeDefined();
  });
});
