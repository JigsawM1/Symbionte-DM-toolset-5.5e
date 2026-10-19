import { describe, expect, it } from "vitest";
import { obtenerRasgosClaseYSubclase } from "./gestorClases";
import { EsquemaRasgoPersonaje } from "@/tipos/rasgos";

const obtener = (nivel: number, nombre: string, subclase?: string) =>
  obtenerRasgosClaseYSubclase("Hechicero", nivel, subclase).find((r) => r.nombre === nombre)!;

describe("Hechicero D&D 5.5 - Tablas Canónicas de Progresión", () => {
  it("Crear espacios de conjuro expone su tablaProgresion canónica de 3 columnas", () => {
    const crearEspacios = obtener(2, "Crear espacios de conjuro");
    expect(crearEspacios).toBeDefined();
    expect(crearEspacios.tablaProgresion).toEqual({
      columnas: [
        "Nivel del espacio de conjuro",
        "Coste",
        "Nivel mínimo de hechicero"
      ],
      filas: [
        { nivel: 1, valores: ["2", "2"] },
        { nivel: 2, valores: ["3", "3"] },
        { nivel: 3, valores: ["5", "5"] },
        { nivel: 4, valores: ["6", "7"] },
        { nivel: 5, valores: ["7", "9"] }
      ],
      notaPie: ""
    });
    expect(EsquemaRasgoPersonaje.safeParse(crearEspacios).success).toBe(true);
  });

  it("Metamagia expone su tablaProgresion canónica de niveles 2 a 20 con nota al pie", () => {
    const metamagia = obtener(2, "Metamagia");
    expect(metamagia).toBeDefined();
    expect(metamagia.tablaProgresion).toBeDefined();
    expect(metamagia.tablaProgresion?.columnas).toEqual(["Nivel", "Descripción"]);
    expect(metamagia.tablaProgresion?.notaPie).toBe("Cada nivel reemplaza al anterior");
    expect(metamagia.tablaProgresion?.filas).toHaveLength(19);

    expect(metamagia.tablaProgresion?.filas[0]).toEqual({
      nivel: 2,
      valores: ["Obtienes 2 metamagias (2)"]
    });
    expect(metamagia.tablaProgresion?.filas[1]).toEqual({
      nivel: 3,
      valores: ["Puedes sustituir una (2)"]
    });
    expect(metamagia.tablaProgresion?.filas[8]).toEqual({
      nivel: 10,
      valores: ["Puedes sustituir una y añades 2 nuevas (4)"]
    });
    expect(metamagia.tablaProgresion?.filas[15]).toEqual({
      nivel: 17,
      valores: ["Puedes sustituir una y añades 2 nuevas (6)"]
    });
    expect(metamagia.tablaProgresion?.filas[18]).toEqual({
      nivel: 20,
      valores: ["Puedes sustituir una"]
    });
    expect(EsquemaRasgoPersonaje.safeParse(metamagia).success).toBe(true);
  });

  it("Conjuros dracónicos expone su tablaProgresion canónica y descripción limpia", () => {
    const conjuros = obtener(3, "Conjuros dracónicos", "Hechicería Dracónica");
    expect(conjuros).toBeDefined();
    expect(conjuros.descripcion).toBe(
      'Cuando alcances un nivel de hechicero especificado en la tabla "Conjuros dracónicos", a partir de entonces siempre tendrás preparados los conjuros que se indican.'
    );
    expect(conjuros.tablaProgresion).toEqual({
      columnas: ["Nivel de hechicero", "Conjuros"],
      filas: [
        {
          nivel: 3,
          valores: [
            "Aliento de dragón, Alterar el propio aspecto, Orbe cromático, Orden imperiosa"
          ]
        },
        {
          nivel: 5,
          valores: ["Terror, Volar"]
        },
        {
          nivel: 7,
          valores: ["Hechizar monstruo, Ojo arcano"]
        },
        {
          nivel: 9,
          valores: ["Conocer las leyendas, Invocar dragón"]
        }
      ],
      notaPie: ""
    });
    expect(EsquemaRasgoPersonaje.safeParse(conjuros).success).toBe(true);
  });

  it("Conjuros psiónicos expone su tablaProgresion canónica y descripción limpia", () => {
    const conjuros = obtener(3, "Conjuros psiónicos", "Hechicería Aberrante");
    expect(conjuros).toBeDefined();
    expect(conjuros.descripcion).toBe(
      'Cuando alcances un nivel de hechicero especificado en la tabla "Conjuros psiónicos", a partir de entonces siempre tendrás preparados los conjuros que se indican.'
    );
    expect(conjuros.tablaProgresion).toEqual({
      columnas: ["Nivel de hechicero", "Conjuros"],
      filas: [
        {
          nivel: 3,
          valores: [
            "Brazos de Hadar, Calmar emociones, Detectar pensamientos, Fragmento mental, Susurros disonantes"
          ]
        },
        {
          nivel: 5,
          valores: ["Hambre de Hadar, Recado"]
        },
        {
          nivel: 7,
          valores: ["Invocar aberración, Tentáculos negros de Evard"]
        },
        {
          nivel: 9,
          valores: ["Enlace telepático de Rary, Telequinesis"]
        }
      ],
      notaPie: ""
    });
    expect(EsquemaRasgoPersonaje.safeParse(conjuros).success).toBe(true);
  });

  it("Conjuros mecánicos expone tablaProgresion de conjuros y tablasProgresion de Manifestaciones del orden", () => {
    const conjuros = obtener(3, "Conjuros mecánicos", "Hechicería del Mecanismo de Relojería");
    expect(conjuros).toBeDefined();
    expect(conjuros.tablaProgresion).toEqual({
      columnas: ["Nivel de hechicero", "Conjuros"],
      filas: [
        {
          nivel: 3,
          valores: [
            "Alarma, Auxilio, Protección contra el bien y el mal, Restablecimiento menor"
          ]
        },
        {
          nivel: 5,
          valores: ["Disipar magia, Protección contra energía"]
        },
        {
          nivel: 7,
          valores: ["Invocar autómata, Libertad de movimiento"]
        },
        {
          nivel: 9,
          valores: ["Muro de fuerza, Imagen mayor"]
        }
      ],
      notaPie: ""
    });

    expect(conjuros.tablasProgresion).toBeDefined();
    expect(conjuros.tablasProgresion).toHaveLength(1);
    expect(conjuros.tablasProgresion![0]).toEqual({
      columnas: ["1d6", "Manifestación"],
      filas: [
        {
          nivel: 1,
          valores: [
            "Unos engranajes espectrales levitan tras de ti. Las manecillas de un reloj giran en tus ojos."
          ]
        },
        {
          nivel: 2,
          valores: ["Las manecillas de un reloj giran en tus ojos"]
        },
        {
          nivel: 3,
          valores: ["Tu piel resplandece con un brillo metálico."]
        },
        {
          nivel: 4,
          valores: [
            "Objetos geométricos y ecuaciones flotantes recubren tu cuerpo."
          ]
        },
        {
          nivel: 5,
          valores: [
            "Tu canalizador mágico adopta temporalmente la forma de un mecanismo de relojería Diminuto."
          ]
        },
        {
          nivel: 6,
          valores: [
            "Tanto tú como aquellos afectados por tu magia podéis escuchar el tictac de los engranajes o el timbre de un reloj."
          ]
        }
      ],
      notaPie: ""
    });
    expect(EsquemaRasgoPersonaje.safeParse(conjuros).success).toBe(true);
  });
});
