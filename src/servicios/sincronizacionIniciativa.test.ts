import { describe, it, expect } from "vitest";
import { filtrarEfectosExpirados, sincronizarConEstadoLocal } from "./sincronizacionIniciativa";
import { crearIndiceMonstruos } from "./indiceMonstruos";
import { usarAlmacenDM, type CriaturaIniciativa, type MonstruoBase } from "@/almacen/usarAlmacenDM";
import type { ColaIniciativaTS, ItemIniciativaTS } from "@/tipos/talespire";
import type { PersonajeJugador } from "@/tipos";
import { aplicarResultadoIniciativaEnEstado } from "@/utiles/lanzadorDados";

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

  it("debe respetar el orden nativo de TaleSpire como fuente de la verdad y no auto-ordenar por valor numérico", () => {
    const colaTS: ColaIniciativaTS = {
      items: [
        { id: "mini-ts-1", name: "Trasgo", kind: "creature" },
        { id: "mini-ts-2", name: "Dragón", kind: "creature" },
      ],
      activeItemIndex: 1,
    };

    // Mini 1 tiene iniciativa menor (5) y Mini 2 tiene iniciativa mayor (25), pero en TaleSpire Mini 1 está primero
    (colaTS.items[0] as ItemIniciativaTS & { initiative?: number }).initiative = 5;
    (colaTS.items[1] as ItemIniciativaTS & { initiative?: number }).initiative = 25;

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

    expect(resultado.colaIniciativa).toHaveLength(3);
    // Debe respetar el orden de TaleSpire sin auto-ordenar por iniciativa descendente
    expect(resultado.colaIniciativa[0].id).toBe("mini-ts-1"); // Inic 5 (primero en TaleSpire)
    expect(resultado.colaIniciativa[1].id).toBe("mini-ts-2"); // Inic 25 (segundo en TaleSpire)
    expect(resultado.colaIniciativa[2].id).toBe("c_local_1"); // Local al final
    expect(resultado.indiceTurnoActivo).toBe(1); // Turno activo nativo de TaleSpire
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

  it("debe preservar el orden de múltiples criaturas de TaleSpire sin importar valores de iniciativa mayores o menores", () => {
    const colaTS: ColaIniciativaTS = {
      items: [
        { id: "mini-1", name: "Bárbaro", kind: "creature" },
        { id: "mini-2", name: "Pícaro", kind: "creature" },
        { id: "mini-3", name: "Clérigo", kind: "creature" },
      ],
      activeItemIndex: 2,
    };

    (colaTS.items[0] as ItemIniciativaTS & { initiative?: number }).initiative = 8;
    (colaTS.items[1] as ItemIniciativaTS & { initiative?: number }).initiative = 22;
    (colaTS.items[2] as ItemIniciativaTS & { initiative?: number }).initiative = 14;

    const resultado = sincronizarConEstadoLocal({
      colaTS,
      colaLocal: [],
      asociacionesFichas: {},
      indiceMonstruos: indice,
      metodoVidaMonstruo: "estandar",
      indiceTurnoActivo: 0,
      rondaActual: 1,
    });

    expect(resultado.colaIniciativa).toHaveLength(3);
    // Orden exacto de TaleSpire: Bárbaro (8), Pícaro (22), Clérigo (14)
    expect(resultado.colaIniciativa[0].id).toBe("mini-1");
    expect(resultado.colaIniciativa[0].iniciativa).toBe(8);
    expect(resultado.colaIniciativa[1].id).toBe("mini-2");
    expect(resultado.colaIniciativa[1].iniciativa).toBe(22);
    expect(resultado.colaIniciativa[2].id).toBe("mini-3");
    expect(resultado.colaIniciativa[2].iniciativa).toBe(14);
    expect(resultado.indiceTurnoActivo).toBe(2);
  });
});

describe("Gestión de Iniciativa sin Auto-ordenación Numérica (Almacén y Tiradas)", () => {
  it("establecerIniciativaCriatura no debe alterar el orden posicional de las criaturas", () => {
    usarAlmacenDM.setState({
      colaIniciativa: [
        { id: "c1", nombre: "Primero", iniciativa: 10, vidaActual: 20, vidaMaxima: 20, vidaTemporal: 0, ca: 10, condiciones: [], efectos: [], bonificadorIniciativa: 0, esMonstruo: false, velocidad: "30 pies" },
        { id: "c2", nombre: "Segundo", iniciativa: 15, vidaActual: 20, vidaMaxima: 20, vidaTemporal: 0, ca: 10, condiciones: [], efectos: [], bonificadorIniciativa: 0, esMonstruo: false, velocidad: "30 pies" },
      ],
      indiceTurnoActivo: 0,
    });

    // Cambiar la iniciativa de 'Primero' a 25 (mayor que 'Segundo' con 15)
    usarAlmacenDM.getState().establecerIniciativaCriatura("c1", 25);

    const colaActual = usarAlmacenDM.getState().colaIniciativa;
    expect(colaActual[0].id).toBe("c1");
    expect(colaActual[0].iniciativa).toBe(25);
    expect(colaActual[1].id).toBe("c2");
    expect(colaActual[1].iniciativa).toBe(15);
  });

  it("aplicarResultadoIniciativaEnEstado no debe reordenar la cola existente", () => {
    usarAlmacenDM.setState({
      colaIniciativa: [
        { id: "mini-a", nombre: "A", iniciativa: 5, vidaActual: 10, vidaMaxima: 10, vidaTemporal: 0, ca: 10, condiciones: [], efectos: [], bonificadorIniciativa: 0, esMonstruo: false, velocidad: "30 pies" },
        { id: "mini-b", nombre: "B", iniciativa: 20, vidaActual: 10, vidaMaxima: 10, vidaTemporal: 0, ca: 10, condiciones: [], efectos: [], bonificadorIniciativa: 0, esMonstruo: false, velocidad: "30 pies" },
      ],
    });

    aplicarResultadoIniciativaEnEstado({ tipo: "iniciativa", criaturaId: "mini-a" }, 30);

    const colaActual = usarAlmacenDM.getState().colaIniciativa;
    // 'mini-a' conserva su posición 0 a pesar de tener iniciativa 30 > 20
    expect(colaActual[0].id).toBe("mini-a");
    expect(colaActual[0].iniciativa).toBe(30);
    expect(colaActual[1].id).toBe("mini-b");
  });

  it("autoLanzarIniciativaMonstruos debe lanzar iniciativa SOLO a monstruos y no a jugadores", () => {
    const pjMock = {
      id: "pj-1",
      nombre: "Thorin",
      idMiniaturaTS: "mini-thorin",
      clase: "Guerrero",
      nivel: 3,
      hpMaximo: 30,
      hpActual: 30,
      hpTemporal: 0,
      iniciativaBono: 2,
    } as unknown as PersonajeJugador;

    usarAlmacenDM.setState({
      personajes: [pjMock],
      colaIniciativa: [
        {
          id: "mini-thorin",
          nombre: "Thorin",
          iniciativa: 0, // Jugador aún no ha tirado
          vidaActual: 30,
          vidaMaxima: 30,
          vidaTemporal: 0,
          ca: 18,
          condiciones: [],
          efectos: [],
          bonificadorIniciativa: 2,
          esMonstruo: false, // Jugador
          velocidad: "30 pies",
        },
        {
          id: "mini-orco-1",
          nombre: "Orco Guerrero",
          iniciativa: 0, // Monstruo por tirar
          vidaActual: 15,
          vidaMaxima: 15,
          vidaTemporal: 0,
          ca: 13,
          condiciones: [],
          efectos: [],
          bonificadorIniciativa: 1,
          esMonstruo: true, // Monstruo
          velocidad: "30 pies",
        },
      ],
    });

    // Ejecutar Auto Roll masivo
    usarAlmacenDM.getState().autoLanzarIniciativaMonstruos();

    const colaActual = usarAlmacenDM.getState().colaIniciativa;
    const jugador = colaActual.find((c) => c.id === "mini-thorin");
    const orco = colaActual.find((c) => c.id === "mini-orco-1");

    // El jugador DEBE conservar su iniciativa intacta (0)
    expect(jugador?.iniciativa).toBe(0);
    expect(jugador?.esMonstruo).toBe(false);

    // El orco DEBE haber recibido una tirada automática (entre 1+1=2 y 20+1=21)
    expect(orco?.iniciativa).toBeGreaterThanOrEqual(2);
    expect(orco?.iniciativa).toBeLessThanOrEqual(21);
    expect(orco?.esMonstruo).toBe(true);
  });

  it("autoLanzarIniciativaMonstruos debe proteger a un jugador incluso si estaba erróneamente marcado como monstruo", () => {
    const pjMock = {
      id: "pj-2",
      nombre: "Legolas",
      idMiniaturaTS: "mini-legolas",
      clase: "Explorador",
      nivel: 5,
      hpMaximo: 40,
      hpActual: 40,
    } as unknown as PersonajeJugador;

    usarAlmacenDM.setState({
      personajes: [pjMock],
      colaIniciativa: [
        {
          id: "mini-legolas",
          nombre: "Legolas (Explorador)",
          iniciativa: 12, // Iniciativa fijada por el jugador
          vidaActual: 40,
          vidaMaxima: 40,
          vidaTemporal: 0,
          ca: 16,
          condiciones: [],
          efectos: [],
          bonificadorIniciativa: 3,
          esMonstruo: true, // Erróneamente marcado como monstruo
          velocidad: "30 pies",
        },
      ],
    });

    // Ejecutar Auto Roll
    usarAlmacenDM.getState().autoLanzarIniciativaMonstruos();

    const legolas = usarAlmacenDM.getState().colaIniciativa[0];
    // Debe preservar la iniciativa del jugador (12) y corregir su bandera esMonstruo a false
    expect(legolas.iniciativa).toBe(12);
    expect(legolas.esMonstruo).toBe(false);
  });

  it("agregarCriaturasSeleccionadasAIniciativa no debe hacer auto-roll para jugadores", () => {
    const pjMock = {
      id: "pj-3",
      nombre: "Gandalf",
      idMiniaturaTS: "mini-gandalf",
      clase: "Mago",
      nivel: 10,
      hpMaximo: 60,
      hpActual: 60,
      ca: 12,
      iniciativaBono: 2,
    } as unknown as PersonajeJugador;

    usarAlmacenDM.setState({
      personajes: [pjMock],
      colaIniciativa: [],
      criaturasSeleccionadas: [
        { id: "mini-gandalf", name: "Gandalf" },
        { id: "mini-goblin", name: "Goblin 1" },
      ],
    });

    usarAlmacenDM.getState().agregarCriaturasSeleccionadasAIniciativa();

    const colaActual = usarAlmacenDM.getState().colaIniciativa;
    const gandalf = colaActual.find((c) => c.id === "mini-gandalf");
    const goblin = colaActual.find((c) => c.id === "mini-goblin");

    expect(gandalf).toBeDefined();
    // Jugador: iniciativa 0 (sin auto-roll) y esMonstruo false
    expect(gandalf?.iniciativa).toBe(0);
    expect(gandalf?.esMonstruo).toBe(false);

    expect(goblin).toBeDefined();
    // Monstruo: recibe auto-roll y esMonstruo true
    expect(goblin?.iniciativa).toBeGreaterThan(0);
    expect(goblin?.esMonstruo).toBe(true);
  });
});


