import { describe, it, expect } from "vitest";
import { obtenerRasgosClaseYSubclase } from "./gestorClases";
import {
  obtenerDadosExtraAtaque,
  obtenerDanosSecundariosAtaque,
  obtenerBonoDanoAtaqueExtra,
  ContextoAtaquePersonaje
} from "./rasgos/evaluadorCombateRasgos";
import { obtenerVelocidadesEfectivas } from "./rasgos/evaluadorMovilidadRasgos";
import { generarListaAtaquesFisicos } from "./calculadorAtaquesArmas";
import type { PersonajeJugador } from "@/tipos/personaje";
import type { RasgoPersonaje } from "@/tipos/rasgos";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";

describe("Pícaro D&D 5.5 (2024) - Reglas y Mecánicas Base", () => {
  it("Nivel 1: Ataque furtivo es activable, escala por nivel y aplica a armas sutiles o a distancia", () => {
    const rasgosNv1 = obtenerRasgosClaseYSubclase("Pícaro", 1);
    const furtivo = rasgosNv1.find((r) => r.nombre === "Ataque furtivo");

    expect(furtivo).toBeDefined();
    expect(furtivo?.esActivable).toBe(true);
    expect(furtivo?.autoDesactivarAlTirarDano).toBe(true);
    expect(furtivo?.categoriaMecanica).toBe("activable");
    expect(furtivo?.formulaDados).toBe("1d6");
    expect(furtivo?.efectos?.[0].tipo).toBe("dado_extra_dano");
    expect(furtivo?.efectos?.[0].aplicaA).toBe("arma_sutil_o_distancia");

    // Progresión de dados
    const nivelesProg = [
      { lvl: 1, dado: "1d6" },
      { lvl: 3, dado: "2d6" },
      { lvl: 5, dado: "3d6" },
      { lvl: 7, dado: "4d6" },
      { lvl: 9, dado: "5d6" },
      { lvl: 11, dado: "6d6" },
      { lvl: 13, dado: "7d6" },
      { lvl: 15, dado: "8d6" },
      { lvl: 17, dado: "9d6" },
      { lvl: 19, dado: "10d6" }
    ];

    for (const { lvl, dado } of nivelesProg) {
      const rasgos = obtenerRasgosClaseYSubclase("Pícaro", lvl);
      const f = rasgos.find((r) => r.nombre === "Ataque furtivo");
      expect(f?.formulaDados).toBe(dado);
      expect(f?.efectos?.[0].valor).toBe(dado);
    }
  });

  it("Nivel 1: Maestría con armas ofrece 2 selecciones de entre las 8 propiedades oficiales", () => {
    const rasgosNv1 = obtenerRasgosClaseYSubclase("Pícaro", 1);
    const maestria = rasgosNv1.find((r) => r.nombre === "Maestría con armas");

    expect(maestria).toBeDefined();
    expect(maestria?.categoriaMecanica).toBe("selector_informativo");
    const sel = maestria?.selectores?.[0];
    expect(sel?.id).toBe("maestrias_aprendidas");
    expect(sel?.maxSelecciones).toBe(2);
    expect(sel?.opciones.length).toBe(8);
    expect(sel?.opciones.map((o) => o.id)).toEqual([
      "cleave", "graze", "nick", "push", "sap", "slow", "topple", "vex"
    ]);
  });

  it("Nivel 5: Golpe astuto es activable y reduce dinámicamente dados de Ataque furtivo solo cuando está activo según su selector", () => {
    const rasgosNv5 = obtenerRasgosClaseYSubclase("Pícaro", 5);
    const furtivo = rasgosNv5.find((r) => r.nombre === "Ataque furtivo");
    const golpeAstuto = rasgosNv5.find((r) => r.nombre === "Golpe astuto");

    expect(furtivo).toBeDefined();
    expect(golpeAstuto).toBeDefined();
    expect(golpeAstuto?.esActivable).toBe(true);
    expect(golpeAstuto?.autoDesactivarAlTirarDano).toBe(true);
    expect(golpeAstuto?.categoriaMecanica).toBe("activable");
    expect(golpeAstuto?.reducirDadosPadre).toBe(true);
    expect(golpeAstuto?.ligadoA).toBe("Ataque furtivo");

    const contextoSutil: ContextoAtaquePersonaje = {
      tipo: "arma",
      caracteristica: "destreza",
      esCuerpoACuerpo: true,
      esDistancia: false,
      propiedades: ["Sutil"]
    };

    // 1. Golpe astuto está APAGADO (activo: false), aunque tenga "veneno" seleccionado en su selector
    const golpeApagadoConOpcion: RasgoPersonaje = {
      ...golpeAstuto!,
      activo: false,
      selectores: [
        {
          ...(golpeAstuto!.selectores![0]),
          valorActual: ["veneno"]
        }
      ]
    };

    const pjConGolpeApagado: PersonajeJugador = {
      id: "pj1",
      nombre: "Pícaro Test",
      clase: "Pícaro",
      nivel: 5,
      caracteristicas: { fuerza: 10, destreza: 16, constitucion: 12, inteligencia: 14, sabiduria: 10, carisma: 12 },
      rasgos: [
        { ...furtivo!, activo: true },
        golpeApagadoConOpcion
      ]
    } as unknown as PersonajeJugador;

    // Al estar apagado, Ataque furtivo no sufre reducción (3d6 a nivel 5)
    const dadosApagado = obtenerDadosExtraAtaque(pjConGolpeApagado, contextoSutil);
    expect(dadosApagado).toHaveLength(1);
    expect(dadosApagado[0].dados).toBe("3d6");

    // 2. El jugador ENCIENDE el activable Golpe astuto (activo: true) con la opción "Veneno" (coste 1d6)
    const golpeEncendidoConVeneno: RasgoPersonaje = {
      ...golpeAstuto!,
      activo: true,
      selectores: [
        {
          ...(golpeAstuto!.selectores![0]),
          valorActual: ["veneno"]
        }
      ]
    };

    const pjConGolpeActivo: PersonajeJugador = {
      ...pjConGolpeApagado,
      rasgos: [
        { ...furtivo!, activo: true },
        golpeEncendidoConVeneno
      ]
    };

    // Al estar activo, se descuenta 1d6 según la opción elegida (3d6 - 1d6 = 2d6)
    const dadosConVeneno = obtenerDadosExtraAtaque(pjConGolpeActivo, contextoSutil);
    expect(dadosConVeneno).toHaveLength(1);
    expect(dadosConVeneno[0].dados).toBe("2d6");
  });

  it("Nivel 11: Golpe astuto mejorado amplía maxSelecciones a 2 y descuenta 2d6 cuando está activo", () => {
    const rasgosNv11 = obtenerRasgosClaseYSubclase("Pícaro", 11);
    const golpeAstuto = rasgosNv11.find((r) => r.nombre === "Golpe astuto");
    const furtivo = rasgosNv11.find((r) => r.nombre === "Ataque furtivo");

    expect(golpeAstuto).toBeDefined();
    expect(golpeAstuto?.selectores?.[0].maxSelecciones).toBe(2);

    // Seleccionamos Veneno y Derribar (1d6 + 1d6 = 2d6 de coste) sobre 6d6 de Ataque furtivo
    const golpeConDos: RasgoPersonaje = {
      ...golpeAstuto!,
      activo: true,
      selectores: [
        {
          ...(golpeAstuto!.selectores![0]),
          valorActual: ["veneno", "derribar"]
        }
      ]
    };

    const pjNv11: PersonajeJugador = {
      id: "pj11",
      nombre: "Pícaro Nv11",
      clase: "Pícaro",
      nivel: 11,
      caracteristicas: { fuerza: 10, destreza: 18, constitucion: 14, inteligencia: 12, sabiduria: 10, carisma: 10 },
      rasgos: [
        { ...furtivo!, activo: true },
        golpeConDos
      ]
    } as unknown as PersonajeJugador;

    const contexto: ContextoAtaquePersonaje = {
      tipo: "arma",
      caracteristica: "destreza",
      esCuerpoACuerpo: false,
      esDistancia: true,
      propiedades: ["Munición"]
    };

    const dadosExtra = obtenerDadosExtraAtaque(pjNv11, contexto);
    expect(dadosExtra[0].dados).toBe("4d6"); // 6d6 - 2d6 = 4d6

    // Si se apaga Golpe astuto, vuelve a 6d6
    const pjApagadoNv11: PersonajeJugador = {
      ...pjNv11,
      rasgos: [
        { ...furtivo!, activo: true },
        { ...golpeConDos, activo: false }
      ]
    };
    const dadosSinActivar = obtenerDadosExtraAtaque(pjApagadoNv11, contexto);
    expect(dadosSinActivar[0].dados).toBe("6d6");
  });

  it("Nivel 14: Golpes taimados amplía el selector con opciones de coste variable (Aturdir 2d6, Oscurecer 3d6, Noquear 6d6)", () => {
    const rasgosNv14 = obtenerRasgosClaseYSubclase("Pícaro", 14);
    const golpeAstuto = rasgosNv14.find((r) => r.nombre === "Golpe astuto");
    const furtivo = rasgosNv14.find((r) => r.nombre === "Ataque furtivo");

    const sel = golpeAstuto?.selectores?.[0];
    const opIds = sel?.opciones.map((o) => o.id);
    expect(opIds).toContain("aturdir");
    expect(opIds).toContain("oscurecer");
    expect(opIds).toContain("noquear");

    // Seleccionamos "Noquear" (coste 6d6) a nivel 14 (Ataque furtivo base 7d6) -> queda 1d6
    const golpeConNoquear: RasgoPersonaje = {
      ...golpeAstuto!,
      activo: true,
      selectores: [
        {
          ...sel!,
          valorActual: ["noquear"]
        }
      ]
    };

    const pjNv14: PersonajeJugador = {
      id: "pj14",
      nombre: "Pícaro Nv14",
      clase: "Pícaro",
      nivel: 14,
      caracteristicas: { fuerza: 10, destreza: 20, constitucion: 14, inteligencia: 12, sabiduria: 10, carisma: 10 },
      rasgos: [
        { ...furtivo!, activo: true },
        golpeConNoquear
      ]
    } as unknown as PersonajeJugador;

    const contexto: ContextoAtaquePersonaje = {
      tipo: "arma",
      caracteristica: "destreza",
      esCuerpoACuerpo: true,
      esDistancia: false,
      propiedades: ["Sutil"]
    };

    const dadosExtra = obtenerDadosExtraAtaque(pjNv14, contexto);
    expect(dadosExtra[0].dados).toBe("1d6"); // 7d6 - 6d6 = 1d6
  });

  it("Nivel 3: Puntería estable es activable, requiere no haberse movido, otorga ventaja y fija la velocidad a 0", () => {
    const rasgosNv3 = obtenerRasgosClaseYSubclase("Pícaro", 3);
    const punteria = rasgosNv3.find((r) => r.nombre === "Puntería estable");

    expect(punteria).toBeDefined();
    expect(punteria?.esActivable).toBe(true);
    expect(punteria?.requiereSinMovimiento).toBe(true);
    expect(punteria?.autoDesactivarAlTirarDano).toBe(true);
    expect(punteria?.tipoAccion).toBe("accion_adicional");
    expect(punteria?.categoriaMecanica).toBe("activable");

    const efectoVentaja = punteria?.efectos?.find((e) => e.tipo === "ventaja");
    expect(efectoVentaja).toBeDefined();
    expect(efectoVentaja?.objetivo).toBe("ataque");

    const efectoVelocidad = punteria?.efectos?.find((e) => e.tipo === "fijar_velocidad");
    expect(efectoVelocidad).toBeDefined();
    expect(Number(efectoVelocidad?.valor)).toBe(0);

    // 1. Con Puntería Estable apagada -> velocidad normal (30 ft)
    const pjPunteriaApagada: PersonajeJugador = {
      id: "picaro-punteria-1",
      nombre: "Pícaro Tirador",
      clase: "Pícaro",
      nivel: 3,
      velocidad: { caminar: 30, nadar: 20, volar: 0, escalar: 30, planea: false },
      movimientoGastado: 0,
      rasgos: [{ ...punteria!, activo: false }]
    } as unknown as PersonajeJugador;

    let vel = obtenerVelocidadesEfectivas(pjPunteriaApagada);
    expect(vel.caminar).toBe(30);
    expect(vel.nadar).toBe(20);

    // 2. Con Puntería Estable ENCENDIDA -> velocidad se reduce a 0 ft
    const pjPunteriaActiva: PersonajeJugador = {
      ...pjPunteriaApagada,
      rasgos: [{ ...punteria!, activo: true }]
    };

    vel = obtenerVelocidadesEfectivas(pjPunteriaActiva);
    expect(vel.caminar).toBe(0);
    expect(vel.nadar).toBe(0);
    expect(vel.escalar).toBe(0);
  });

  it("Nivel 20: Golpe de suerte es consumible con 1 uso por descanso corto", () => {
    const rasgosNv20 = obtenerRasgosClaseYSubclase("Pícaro", 20);
    const golpeSuerte = rasgosNv20.find((r) => r.nombre === "Golpe de suerte");

    expect(golpeSuerte).toBeDefined();
    expect(golpeSuerte?.categoriaMecanica).toBe("consumible");
    expect(golpeSuerte?.tieneUsosLimitados).toBe(true);
    expect(golpeSuerte?.usosMaximos).toBe(1);
    expect(golpeSuerte?.recuperacion).toBe("descanso_corto");
  });
});

describe("Pícaro D&D 5.5 - Subclases", () => {
  describe("Embaucador Arcano", () => {
    it("Ladrón de conjuros es consumible de reacción (1 uso por descanso largo)", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Pícaro", 17, "Embaucador Arcano");
      const ladronConjuros = rasgos.find((r) => r.nombre === "Ladrón de conjuros");

      expect(ladronConjuros).toBeDefined();
      expect(ladronConjuros?.tipoAccion).toBe("reaccion");
      expect(ladronConjuros?.categoriaMecanica).toBe("consumible");
      expect(ladronConjuros?.tieneUsosLimitados).toBe(true);
      expect(ladronConjuros?.usosMaximos).toBe(1);
      expect(ladronConjuros?.recuperacion).toBe("descanso_largo");
    });
  });

  describe("Asesino", () => {
    it("Asesinato otorga ventaja permanente en tiradas de iniciativa", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Pícaro", 3, "Asesino");
      const asesinato = rasgos.find((r) => r.nombre === "Asesinato");

      expect(asesinato).toBeDefined();
      expect(asesinato?.categoriaMecanica).toBe("pasivo_permanente");
      expect(asesinato?.efectos?.[0].tipo).toBe("ventaja");
      expect(asesinato?.efectos?.[0].objetivo).toBe("iniciativa");
    });

    it("Golpes sorpresivos es activable y añade daño igual al nivel de pícaro", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Pícaro", 5, "Asesino");
      const sorpresivos = rasgos.find((r) => r.nombre === "Golpes sorpresivos");

      expect(sorpresivos).toBeDefined();
      expect(sorpresivos?.esActivable).toBe(true);
      expect(sorpresivos?.autoDesactivarAlTirarDano).toBe(true);

      const pjAsesino: PersonajeJugador = {
        id: "asesino5",
        nombre: "Asesino 5",
        clase: "Pícaro",
        nivel: 5,
        caracteristicas: { fuerza: 10, destreza: 16, constitucion: 12, inteligencia: 10, sabiduria: 12, carisma: 10 },
        rasgos: [{ ...sorpresivos!, activo: true }]
      } as unknown as PersonajeJugador;

      const contextoSutil: ContextoAtaquePersonaje = {
        tipo: "arma",
        caracteristica: "destreza",
        esCuerpoACuerpo: true,
        esDistancia: false,
        propiedades: ["Sutil"]
      };

      const bonoDano = obtenerBonoDanoAtaqueExtra(pjAsesino, contextoSutil);
      expect(bonoDano).toBe(5); // Nivel 5 de pícaro
    });

    it("Nivel 13: Envenenar armas añade 2d6 de daño de veneno cuando Golpe astuto está activo con la opción Veneno", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Pícaro", 13, "Asesino");
      const golpeAstuto = rasgos.find((r) => r.nombre === "Golpe astuto");

      // Comprobamos que el efecto secundario de Envenenar armas se fusionó en Golpe astuto
      const efectoVeneno = golpeAstuto?.efectos?.find((e) => e.tipo === "dano_secundario" && e.tipoDano === "Veneno");
      expect(efectoVeneno).toBeDefined();
      expect(efectoVeneno?.valor).toBe("2d6");
      expect(efectoVeneno?.condicion).toBe("opcion_veneno");

      const furtivo = rasgos.find((r) => r.nombre === "Ataque furtivo");
      const contexto: ContextoAtaquePersonaje = {
        tipo: "arma",
        caracteristica: "destreza",
        esCuerpoACuerpo: true,
        esDistancia: false,
        propiedades: ["Sutil"]
      };

      // 1. Golpe astuto está APAGADO (activo: false), aunque tenga "veneno" seleccionado
      const pjApagado: PersonajeJugador = {
        id: "as13",
        nombre: "Asesino 13",
        clase: "Pícaro",
        nivel: 13,
        rasgos: [
          { ...furtivo!, activo: true },
          {
            ...golpeAstuto!,
            activo: false,
            selectores: [{ ...(golpeAstuto!.selectores![0]), valorActual: ["veneno"] }]
          }
        ]
      } as unknown as PersonajeJugador;

      const danosApagado = obtenerDanosSecundariosAtaque(pjApagado, contexto);
      expect(danosApagado).toHaveLength(0);

      // 2. Golpe astuto está ENCENDIDO (activo: true) con "veneno" seleccionado -> produce 2d6 Veneno
      const pjEncendido: PersonajeJugador = {
        ...pjApagado,
        rasgos: [
          { ...furtivo!, activo: true },
          {
            ...golpeAstuto!,
            activo: true,
            selectores: [{ ...(golpeAstuto!.selectores![0]), valorActual: ["veneno"] }]
          }
        ]
      };

      const danosConVeneno = obtenerDanosSecundariosAtaque(pjEncendido, contexto);
      expect(danosConVeneno).toHaveLength(1);
      expect(danosConVeneno[0].formula).toBe("2d6");
      expect(danosConVeneno[0].tipoDano).toBe("Veneno");
    });
  });

  describe("Filo del Alma", () => {
    it("Poder psiónico escala usos y tamaño de dados según la tabla oficial", () => {
      const escala = [
        { lvl: 3, dados: "1d6", usos: 4 },
        { lvl: 5, dados: "1d8", usos: 6 },
        { lvl: 9, dados: "1d8", usos: 8 },
        { lvl: 11, dados: "1d10", usos: 8 },
        { lvl: 13, dados: "1d10", usos: 10 },
        { lvl: 17, dados: "1d12", usos: 12 }
      ];

      for (const { lvl, dados, usos } of escala) {
        const rasgos = obtenerRasgosClaseYSubclase("Pícaro", lvl, "Filo del Alma");
        const poder = rasgos.find((r) => r.nombre === "Poder psiónico");
        expect(poder?.formulaDados).toBe(dados);
        expect(poder?.usosMaximos).toBe(usos);
      }
    });

    it("Habilidad reforzada y Susurros psíquicos heredan dados y consumen usos de Poder psiónico", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Pícaro", 5, "Filo del Alma");
      const habilidadRef = rasgos.find((r) => r.nombre === "Habilidad reforzada psiónicamente");
      const susurros = rasgos.find((r) => r.nombre === "Susurros psíquicos");

      expect(habilidadRef?.gastarDePadre).toBe(true);
      expect(habilidadRef?.heredarDadosPadre).toBe(true);
      expect(habilidadRef?.formulaDados).toBe("1d8"); // Heredado de Poder psiónico nv 5

      expect(susurros?.gastarDePadre).toBe(true);
      expect(susurros?.heredarDadosPadre).toBe(true);
      expect(susurros?.formulaDados).toBe("1d8");
    });

    it("Hojas psíquicas genera un ataque otorgado con 1d6 psíquico, sutil, arrojadizo y 1d4 de acción adicional", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Pícaro", 3, "Filo del Alma");
      const hojas = rasgos.find((r) => r.nombre === "Hojas psíquicas");
      const furtivo = rasgos.find((r) => r.nombre === "Ataque furtivo");

      const pj: PersonajeJugador = {
        id: "soulknife3",
        nombre: "Filo del Alma 3",
        clase: "Pícaro",
        nivel: 3,
        caracteristicas: { fuerza: 10, destreza: 16, constitucion: 12, inteligencia: 12, sabiduria: 10, carisma: 10 },
        rasgos: [
          { ...furtivo!, activo: true },
          { ...hojas!, activo: true }
        ],
        inventario: []
      } as unknown as PersonajeJugador;

      const stats: EstadisticasCalculadasPersonaje = {
        modificadores: { fuerza: 0, destreza: 3, constitucion: 1, inteligencia: 1, sabiduria: 0, carisma: 0 },
        bonoCompetencia: 2,
        bonoDanoFuria: 0
      } as unknown as EstadisticasCalculadasPersonaje;

      const listaAtaques = generarListaAtaquesFisicos({
        personajeActivo: pj,
        statsCalculadas: stats,
        baseDatosObjetos: [],
        caracteristicasArmas: {}
      });

      const ataqueHoja = listaAtaques.find((a) => a.nombre === "Hoja psíquica");
      expect(ataqueHoja).toBeDefined();
      expect(ataqueHoja?.tipoDano).toBe("Psíquico");
      expect(ataqueHoja?.esSutil).toBe(true);
      expect(ataqueHoja?.bonoAtaque).toBe(5); // +2 BC + 3 DES
      // Ataque furtivo activo (+2d6 a nv 3) debe sumarse al daño de la hoja psíquica por ser sutil
      expect(ataqueHoja?.dadoDano).toContain("1d6");
      expect(ataqueHoja?.dadoDano).toContain("2d6"); // Daño furtivo
      expect(ataqueHoja?.danoAccionAdicional).toBeDefined();
      expect(ataqueHoja?.danoAccionAdicional).toContain("1d4"); // Daño de acción adicional
    });
  });

  describe("Ladrón", () => {
    it("Trabajo de segunda planta añade velocidad de escalar igual a la velocidad al caminar", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Pícaro", 3, "Ladrón");
      const trabajo = rasgos.find((r) => r.nombre === "Trabajo de segunda planta");

      expect(trabajo).toBeDefined();

      const pjLadron: PersonajeJugador = {
        id: "thief3",
        nombre: "Ladrón 3",
        clase: "Pícaro",
        nivel: 3,
        velocidad: 30,
        rasgos: [{ ...trabajo!, activo: true }]
      } as unknown as PersonajeJugador;

      const velocidades = obtenerVelocidadesEfectivas(pjLadron);
      expect(velocidades.caminar).toBe(30);
      expect(velocidades.escalar).toBe(30);
    });

    it("Nivel 9: Sigilo supremo se consolida en Golpe astuto añadiendo Ataque sigiloso", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Pícaro", 9, "Ladrón");
      const golpeAstuto = rasgos.find((r) => r.nombre === "Golpe astuto");

      const opcionSigilosa = golpeAstuto?.selectores?.[0].opciones.find((o) => o.id === "ataque_sigiloso");
      expect(opcionSigilosa).toBeDefined();
      expect(opcionSigilosa?.costeDados).toBe(1);
    });
  });
});
