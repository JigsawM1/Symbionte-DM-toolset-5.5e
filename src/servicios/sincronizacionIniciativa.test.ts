import { describe, it, expect } from "vitest";
import { filtrarEfectosExpirados, sincronizarConEstadoLocal } from "./sincronizacionIniciativa";
import { crearIndiceMonstruos } from "./indiceMonstruos";
import type { CriaturaIniciativa, MonstruoBase } from "@/almacen/usarAlmacenDM";
import type { ColaIniciativaTS, ItemIniciativaTS } from "@/tipos/talespire";
import type { PersonajeJugador } from "@/tipos";

describe("sincronizacionIniciativa - filtrarEfectosExpirados", () => {
  it("debe retornar la criatura idéntica si no tiene efectos", () => {
    const cola: CriaturaIniciativa[] = [
      { id: "c1", nombre: "Trasgo", efectos: [] } as unknown as CriaturaIniciativa,
    ];
    const filtrada = filtrarEfectosExpirados(cola, 2);
    expect(filtrada[0].efectos).toEqual([]);
  });

  it("debe expirar efectos antiguos que tengan duracion pero no expiraRonda", () => {
    const cola: CriaturaIniciativa[] = [
      {
        id: "c1",
        nombre: "Trasgo",
        efectos: [
          { id: "ef1", nombre: "Bendición", duracion: 10 }, // Sin expiraRonda
        ],
      } as unknown as CriaturaIniciativa,
    ];
    const filtrada = filtrarEfectosExpirados(cola, 2);
    expect(filtrada[0].efectos).toHaveLength(0);
  });

  it("debe mantener efectos cuya ronda de expiración no se haya alcanzado", () => {
    const cola: CriaturaIniciativa[] = [
      {
        id: "c1",
        nombre: "Trasgo",
        efectos: [
          { id: "ef1", nombre: "Escudo de Fe", expiraRonda: 5 }, // Expira en ronda 5
        ],
      } as unknown as CriaturaIniciativa,
    ];
    const filtrada = filtrarEfectosExpirados(cola, 3); // Ronda actual es 3
    expect(filtrada[0].efectos).toHaveLength(1);
    expect(filtrada[0].efectos![0].id).toBe("ef1");
  });

  it("debe expirar efectos cuando la ronda actual es igual o mayor a expiraRonda", () => {
    const cola: CriaturaIniciativa[] = [
      {
        id: "c1",
        nombre: "Trasgo",
        efectos: [
          { id: "ef1", nombre: "Escudo de Fe", expiraRonda: 5 },
          { id: "ef2", nombre: "Bendición", expiraRonda: 6 },
        ],
      } as unknown as CriaturaIniciativa,
    ];
    const filtrada = filtrarEfectosExpirados(cola, 5); // Ronda actual es 5
    expect(filtrada[0].efectos).toHaveLength(1);
    expect(filtrada[0].efectos![0].id).toBe("ef2"); // Se mantiene bendición
  });
});

describe("sincronizacionIniciativa - sincronizarConEstadoLocal", () => {
  const mockMonstruos = [
    { id: "id-trasgo", nombre: "Trasgo", ca: 15, vidaMaxima: 7, iniciativaBonificador: 2 },
  ] as unknown as MonstruoBase[];

  const indice = crearIndiceMonstruos(mockMonstruos);

  it("debe sincronizar una criatura nativa nueva y ordenar la cola", () => {
    const colaTS: ColaIniciativaTS = {
      items: [
        { id: "mini-ts-1", name: "Trasgo", kind: "creature" },
      ],
      activeItemIndex: 0,
    };

    const resultado = sincronizarConEstadoLocal({
      colaTS,
      colaLocal: [],
      asociacionesFichas: {},
      indiceMonstruos: indice,
      metodoVidaMonstruo: "estandar",
      indiceTurnoActivo: 0,
      rondaActual: 1,
    });

    expect(resultado.colaIniciativa).toHaveLength(1);
    const trasgo = resultado.colaIniciativa[0];
    expect(trasgo.id).toBe("mini-ts-1");
    expect(trasgo.nombre).toBe("Trasgo");
    expect(trasgo.ca).toBe(15);
    expect(trasgo.vidaMaxima).toBe(7); // Vida estándar de plantilla
    expect(trasgo.esMonstruo).toBe(true);
    expect(resultado.indiceTurnoActivo).toBe(0);
    expect(resultado.rondaActual).toBe(1);
  });

  it("debe mantener las criaturas locales independientes de TaleSpire", () => {
    const colaTS: ColaIniciativaTS = {
      items: [],
      activeItemIndex: -1,
    };

    const colaLocal: CriaturaIniciativa[] = [
      { id: "c_local_1", nombre: "Aliado Local", iniciativa: 15 } as unknown as CriaturaIniciativa,
    ];

    const resultado = sincronizarConEstadoLocal({
      colaTS,
      colaLocal,
      asociacionesFichas: {},
      indiceMonstruos: indice,
      metodoVidaMonstruo: "estandar",
      indiceTurnoActivo: 0,
      rondaActual: 1,
    });

    expect(resultado.colaIniciativa).toHaveLength(1);
    expect(resultado.colaIniciativa[0].id).toBe("c_local_1");
  });

  it("debe ordenar la cola combinada por iniciativa de forma descendente", () => {
    const colaTS: ColaIniciativaTS = {
      items: [
        { id: "mini-ts-1", name: "Trasgo", kind: "creature" }, // Iniciativa simulada abajo
      ],
      activeItemIndex: 0,
    };

    // Añadir iniciativa física usando custom properties que consume el adaptador
    (colaTS.items[0] as ItemIniciativaTS & { initiative?: number }).initiative = 10;

    const colaLocal: CriaturaIniciativa[] = [
      { id: "c_local_1", nombre: "Aliado Local", iniciativa: 15 } as unknown as CriaturaIniciativa,
    ];

    const resultado = sincronizarConEstadoLocal({
      colaTS,
      colaLocal,
      asociacionesFichas: {},
      indiceMonstruos: indice,
      metodoVidaMonstruo: "estandar",
      indiceTurnoActivo: 0,
      rondaActual: 1,
    });

    expect(resultado.colaIniciativa).toHaveLength(2);
    expect(resultado.colaIniciativa[0].id).toBe("c_local_1"); // Iniciativa 15
    expect(resultado.colaIniciativa[1].id).toBe("mini-ts-1"); // Iniciativa 10
  });

  it("debe detectar wrap-around e incrementar la ronda al pasar del último al primer turno", () => {
    const colaTS: ColaIniciativaTS = {
      items: [
        { id: "mini-1", name: "Trasgo", kind: "creature" },
        { id: "mini-2", name: "Lobo", kind: "creature" },
      ],
      activeItemIndex: 0, // Turno activo en TaleSpire pasa a ser el primero (índice 0)
    };

    (colaTS.items[0] as ItemIniciativaTS & { initiative?: number }).initiative = 20;
    (colaTS.items[1] as ItemIniciativaTS & { initiative?: number }).initiative = 10;

    // En la ronda anterior, el turno activo local estaba en la última criatura (índice 1)
    const colaLocal: CriaturaIniciativa[] = [
      { id: "mini-1", nombre: "Trasgo", iniciativa: 20 } as unknown as CriaturaIniciativa,
      { id: "mini-2", nombre: "Lobo", iniciativa: 10 } as unknown as CriaturaIniciativa,
    ];

    const resultado = sincronizarConEstadoLocal({
      colaTS,
      colaLocal,
      asociacionesFichas: {},
      indiceMonstruos: indice,
      metodoVidaMonstruo: "estandar",
      indiceTurnoActivo: 1, // Anteriormente estaba en la última (Lobo, índice 1)
      rondaActual: 2,
    });

    expect(resultado.rondaActual).toBe(3); // Incrementó ronda de 2 a 3 por wrap-around (1 -> 0)
    expect(resultado.indiceTurnoActivo).toBe(0); // Ahora apunta a Trasgo (índice 0)
  });

  it("debe respetar la ronda enviada explícitamente por TaleSpire", () => {
    const colaTS: ColaIniciativaTS = {
      items: [],
      activeItemIndex: -1,
    };
    (colaTS as ColaIniciativaTS & { round?: number }).round = 4; // TaleSpire dice que es ronda 4

    const resultado = sincronizarConEstadoLocal({
      colaTS,
      colaLocal: [],
      asociacionesFichas: {},
      indiceMonstruos: indice,
      metodoVidaMonstruo: "estandar",
      indiceTurnoActivo: 0,
      rondaActual: 1,
    });

    expect(resultado.rondaActual).toBe(4);
  });

  it("debe resolver una miniatura como Personaje Jugador si coincide su idMiniaturaTS", () => {
    const personajeHeroe = {
      id: "pj_valeros_1",
      nombre: "Valeros",
      clase: "Guerrero",
      nivel: 3,
      hpMaximo: 28,
      hpActual: 24,
      hpTemporal: 5,
      idMiniaturaTS: "mini-valeros-uuid",
      velocidad: "30 pies",
      caracteristicas: { fuerza: 16, destreza: 14, constitucion: 14, inteligencia: 10, sabiduria: 12, carisma: 10 },
      inventario: []
    } as unknown as PersonajeJugador;

    const colaTS: ColaIniciativaTS = {
      items: [
        { id: "mini-valeros-uuid", name: "Valeros (Guerrero)", kind: "creature" }
      ],
      activeItemIndex: 0
    };

    const resultado = sincronizarConEstadoLocal({
      colaTS,
      colaLocal: [],
      asociacionesFichas: {},
      indiceMonstruos: indice,
      metodoVidaMonstruo: "estandar",
      indiceTurnoActivo: 0,
      rondaActual: 1,
      personajes: [personajeHeroe]
    });

    expect(resultado.colaIniciativa).toHaveLength(1);
    const heroe = resultado.colaIniciativa[0];
    expect(heroe.esMonstruo).toBe(false);
    expect(heroe.nombre).toBe("Valeros");
    expect(heroe.vidaMaxima).toBe(28);
    expect(heroe.vidaActual).toBe(24);
    expect(heroe.vidaTemporal).toBe(5);
    expect(heroe.ca).toBe(12); // Sin armadura = 10 + mod DES (14 -> +2)
  });

  it("debe resolver una miniatura como Personaje Jugador por coincidencia de nombre", () => {
    const personajeMago = {
      id: "pj_ezren_1",
      nombre: "Ezren",
      clase: "Mago",
      nivel: 2,
      hpMaximo: 14,
      hpActual: 14,
      hpTemporal: 0,
      idMiniaturaTS: null,
      velocidad: "30 pies",
      caracteristicas: { fuerza: 10, destreza: 12, constitucion: 12, inteligencia: 16, sabiduria: 13, carisma: 10 },
      inventario: []
    } as unknown as PersonajeJugador;

    const colaTS: ColaIniciativaTS = {
      items: [
        { id: "mini-ts-random-id", name: "Ezren", kind: "creature" }
      ],
      activeItemIndex: 0
    };

    const resultado = sincronizarConEstadoLocal({
      colaTS,
      colaLocal: [],
      asociacionesFichas: {},
      indiceMonstruos: indice,
      metodoVidaMonstruo: "estandar",
      indiceTurnoActivo: 0,
      rondaActual: 1,
      personajes: [personajeMago]
    });

    expect(resultado.colaIniciativa).toHaveLength(1);
    const heroe = resultado.colaIniciativa[0];
    expect(heroe.esMonstruo).toBe(false);
    expect(heroe.nombre).toBe("Ezren");
    expect(heroe.vidaMaxima).toBe(14);
    expect(heroe.ca).toBe(11); // 10 + mod DES (12 -> +1)
  });
});

