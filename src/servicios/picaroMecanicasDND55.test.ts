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
import { sincronizarRasgosAutomaticos } from "./compendioRasgos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
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

    it("Nivel 13: Embaucador versátil no debe generar erróneamente la dote Alerta de origen", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "ea-13",
        nombre: "Embaucador 13",
        clase: "Pícaro",
        subclase: "Embaucador Arcano",
        nivel: 13,
        especie: "Elfo",
        rasgos: []
      };

      const sincronizados = sincronizarRasgosAutomaticos(pj);
      const tieneDoteAlerta = sincronizados.some(
        (r) => r.origen === "dote" && r.nombre === "Alerta" && r.ligadoA?.includes("versatil")
      );
      expect(tieneDoteAlerta).toBe(false);
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

      const furtivo = rasgos.find((r) => r.nombre === "Ataque furtivo");
      const pjAsesino: PersonajeJugador = {
        id: "asesino5",
        nombre: "Asesino 5",
        clase: "Pícaro",
        nivel: 5,
        caracteristicas: { fuerza: 10, destreza: 16, constitucion: 12, inteligencia: 10, sabiduria: 12, carisma: 10 },
        rasgos: [{ ...sorpresivos!, activo: true }, { ...furtivo!, activo: true }]
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

  // ── TABLAS DE PROGRESIÓN OFICIALES DEL PÍCARO ──
  describe("Tablas de progresión del Pícaro (D&D 5.5 / Nivel20)", () => {
    it("Pericia (Nivel 1 y Nivel 6) incluye tablaProgresion apilable ('Se apilan los niveles') con filas 1 y 6", () => {
      const rasgosNv1 = obtenerRasgosClaseYSubclase("Pícaro", 1);
      const periciaNv1 = rasgosNv1.find((r) => r.nombre === "Pericia");

      expect(periciaNv1?.tablaProgresion).toBeDefined();
      expect(periciaNv1?.tablaProgresion?.columnas).toEqual(["Nivel", "Descripción"]);
      expect(periciaNv1?.tablaProgresion?.notaPie).toBe("Se apilan los niveles");
      expect(periciaNv1?.tablaProgresion?.filas).toEqual([
        { nivel: 1, valores: ["Ganas dos pericias (2)"] },
        { nivel: 6, valores: ["Ganas dos pericias (4)"] }
      ]);

      const rasgosNv6 = obtenerRasgosClaseYSubclase("Pícaro", 6);
      const periciaNv6 = rasgosNv6.find((r) => r.nombre === "Pericia" && r.nivelRequerido === 6);
      expect(periciaNv6?.tablaProgresion).toBeDefined();
      expect(periciaNv6?.tablaProgresion?.notaPie).toBe("Se apilan los niveles");
      expect(periciaNv6?.tablaProgresion?.filas).toEqual([
        { nivel: 1, valores: ["Ganas dos pericias (2)"] },
        { nivel: 6, valores: ["Ganas dos pericias (4)"] }
      ]);
    });

    it("Ataque furtivo incluye tablaProgresion con 'Cada nivel reemplaza al anterior' y 10 filas de progresión", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Pícaro", 1);
      const furtivo = rasgos.find((r) => r.nombre === "Ataque furtivo");

      expect(furtivo?.tablaProgresion).toBeDefined();
      expect(furtivo?.tablaProgresion?.columnas).toEqual(["Nivel", "Descripción"]);
      expect(furtivo?.tablaProgresion?.notaPie).toBe("Cada nivel reemplaza al anterior");
      expect(furtivo?.tablaProgresion?.filas).toHaveLength(10);
      expect(furtivo?.tablaProgresion?.filas[0]).toEqual({ nivel: 1, valores: ["1d6"] });
      expect(furtivo?.tablaProgresion?.filas[9]).toEqual({ nivel: 19, valores: ["10d6"] });
    });

    it("Maestría con armas incluye tablaProgresion canónica a nivel 1", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Pícaro", 1);
      const maestria = rasgos.find((r) => r.nombre === "Maestría con armas");

      expect(maestria?.tablaProgresion).toBeDefined();
      expect(maestria?.tablaProgresion?.columnas).toEqual(["Nivel", "Descripción"]);
      expect(maestria?.tablaProgresion?.notaPie).toBe("Cada nivel reemplaza al anterior");
      expect(maestria?.tablaProgresion?.filas).toEqual([
        { nivel: 1, valores: ["2 tipos de armas elegidas"] }
      ]);
    });

    it("Poder psiónico (Filo del Alma) expone tabla de progresión de Dados de energía psiónica", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Pícaro", 3, "Filo del Alma");
      const poder = rasgos.find((r) => r.nombre === "Poder psiónico");

      expect(poder?.tablaProgresion).toBeDefined();
      expect(poder?.tablaProgresion?.columnas).toEqual([
        "Nivel de pícaro",
        "Tamaño del dado",
        "Cantidad"
      ]);
      expect(poder?.tablaProgresion?.filas).toHaveLength(6);
      expect(poder?.tablaProgresion?.filas[0]).toEqual({ nivel: 3, valores: ["D6", "4"] });
      expect(poder?.tablaProgresion?.filas[5]).toEqual({ nivel: 17, valores: ["D12", "12"] });
      expect(poder?.tablaProgresion?.notaPie).toBe(
        "Recuperas 1 dado gastado en un descanso corto y todos en un descanso largo"
      );
    });
  });
});
