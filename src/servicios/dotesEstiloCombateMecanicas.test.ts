import { describe, it, expect } from "vitest";
import {
  DOTES_ESTILO_COMBATE_DND55,
  TODAS_LAS_DOTES_CANONICAS_DND55,
  DOTES_CANONICAS_DND55
} from "@/constantes/dotesConstantes";
import type { PersonajeJugador, ObjetoInventario, ObjetoJuego, RasgoPersonaje } from "@/tipos";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { calcularAtaqueArmaEquipada } from "@/servicios/calculadorAtaquesArmas";
import { calcularAtaqueDesarmado } from "@/servicios/calculadorAtaqueDesarmado";

function crearPersonajeGuerrero(overrides: Partial<PersonajeJugador> = {}): PersonajeJugador {
  return {
    id: "pj-test-guerrero",
    nombre: "Sir Roderick",
    clase: "Guerrero",
    nivel: 3,
    caracteristicas: {
      fuerza: 16, // Mod +3
      destreza: 14, // Mod +2
      constitucion: 14, // Mod +2
      inteligencia: 10,
      sabiduria: 12,
      carisma: 8
    },
    puntosGolpe: {
      actuales: 28,
      maximos: 28,
      temporales: 0
    },
    velocidad: { caminar: 30, planea: false },
    ca: 10,
    salvacionesMuerte: { exitos: 0, fallos: 0 },
    competenciasArmasLista: ["Todas las armas sencillas", "Todas las armas marciales"],
    competenciasArmadurasGrupos: ["Ligera", "Mediana", "Pesada", "Escudos"],
    inventario: [],
    rasgos: [],
    condicionesActivas: [],
    ...overrides
  } as unknown as PersonajeJugador;
}

function crearArmaInventario(
  idInstancia: string,
  nombre: string,
  categoria: "armas" = "armas",
  equipado: boolean = true
): ObjetoInventario {
  return {
    idInstancia,
    idObjeto: idInstancia,
    nombre,
    categoria,
    cantidad: 1,
    equipado,
    pesoLb: 2,
    sintonizado: false,
    notas: ""
  } as unknown as ObjetoInventario;
}

function instanciarDoteComoRasgo(idDote: string, modificaciones: Partial<RasgoPersonaje> = {}): RasgoPersonaje {
  const dote = DOTES_CANONICAS_DND55.find((d) => d.id === idDote);
  if (!dote) {
    throw new Error(`Dote no encontrada en catálogo: ${idDote}`);
  }
  return {
    id: dote.id,
    nombre: dote.nombre,
    descripcion: dote.descripcion,
    origen: "dote",
    fuente: dote.fuente || "PHB 2024",
    tipoAccion: dote.tipoAccion || "pasivo",
    tieneUsosLimitados: Boolean(dote.tieneUsosLimitados),
    usosMaximos: dote.usosMaximos,
    usosRestantes: dote.usosMaximos,
    recuperacion: dote.recuperacion || "ninguno",
    formulaDados: dote.formulaDados,
    categoriaMecanica: dote.categoriaMecanica,
    personalizado: false,
    activo: true,
    esActivable: dote.esActivable,
    autoDesactivar: dote.autoDesactivar,
    efectos: dote.efectos ? JSON.parse(JSON.stringify(dote.efectos)) : undefined,
    selectores: dote.selectores ? JSON.parse(JSON.stringify(dote.selectores)) : undefined,
    notas: "",
    ...modificaciones
  };
}

describe("Dotes de Estilo de Combate D&D 5.5e (PHB 2024) — Mecánicas y Reglas", () => {
  describe("1. Integridad del Catálogo", () => {
    it("debe contener las 12 dotes oficiales de estilo de combate", () => {
      expect(DOTES_ESTILO_COMBATE_DND55).toHaveLength(12);

      const idsEsperados = [
        "dote_estilo_tiro_con_arco",
        "dote_estilo_lucha_a_ciegas",
        "dote_estilo_defensa",
        "dote_estilo_combate_armas_dos_manos",
        "dote_estilo_intercepcion",
        "dote_estilo_combate_armas_arrojadizas",
        "dote_estilo_proteccion",
        "dote_estilo_combate_dos_armas",
        "dote_estilo_duelo",
        "dote_estilo_guerrero_bendito",
        "dote_estilo_guerrero_druidico",
        "dote_estilo_combate_sin_armas"
      ];

      for (const id of idsEsperados) {
        const dote = DOTES_ESTILO_COMBATE_DND55.find((d) => d.id === id);
        expect(dote, `La dote ${id} debe existir`).toBeDefined();
        expect(dote?.categoria).toBe("estilo_combate");
        expect(dote?.requisito).toBeDefined();
      }
    });

    it("todas las dotes de estilo de combate están presentes en TODAS_LAS_DOTES_CANONICAS_DND55", () => {
      for (const dote of DOTES_ESTILO_COMBATE_DND55) {
        const encontrada = TODAS_LAS_DOTES_CANONICAS_DND55.find((d) => d.id === dote.id);
        expect(encontrada).toBeDefined();
      }
    });
  });

  describe("2. Mecánica de Tiro con arco (+2 a tiradas de ataque a distancia)", () => {
    it("debe sumar +2 a la tirada de ataque de armas a distancia pero no a cuerpo a cuerpo", () => {
      const doteTiroConArco = instanciarDoteComoRasgo("dote_estilo_tiro_con_arco");
      const pj = crearPersonajeGuerrero({
        rasgos: [doteTiroConArco]
      });

      const stats = calcularEstadisticasPersonaje(pj);
      // Nivel 3: PB = +2. DES = 14 (+2). FUE = 16 (+3).

      const arcoLargo = crearArmaInventario("inst-arco", "Arco largo");
      const espadaLarga = crearArmaInventario("inst-espada", "Espada larga");

      const compendioMock: ObjetoJuego[] = [
        {
          id: "inst-arco",
          nombre: "Arco largo",
          categoria: "armas",
          subcategoria: "Marcial",
          tipoAtaque: "A Distancia",
          propiedades: ["A dos manos", "Munición", "Pesada"],
          dadoDano: "1d8",
          tipoDano: "Perforante",
          alcanceNormal: 150,
          alcanceLargo: 600
        } as unknown as ObjetoJuego,
        {
          id: "inst-espada",
          nombre: "Espada larga",
          categoria: "armas",
          subcategoria: "Marcial",
          tipoAtaque: "Cuerpo a Cuerpo",
          propiedades: ["Versátil"],
          dadoDano: "1d8",
          danoVersatil: "1d10",
          tipoDano: "Cortante"
        } as unknown as ObjetoJuego
      ];

      const atkArco = calcularAtaqueArmaEquipada(arcoLargo, {
        personajeActivo: pj,
        statsCalculadas: stats,
        baseDatosObjetos: compendioMock,
        caracteristicasArmas: {},
        gruposArmasConsolidados: ["Todas las armas marciales"],
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      // Ataque de Arco largo: PB (+2) + DES (+2) + Tiro con arco (+2) = +6
      expect(atkArco.bonoAtaque).toBe(6);

      const atkEspada = calcularAtaqueArmaEquipada(espadaLarga, {
        personajeActivo: pj,
        statsCalculadas: stats,
        baseDatosObjetos: compendioMock,
        caracteristicasArmas: {},
        gruposArmasConsolidados: ["Todas las armas marciales"],
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      // Ataque de Espada: PB (+2) + FUE (+3) = +5 (sin bono de Tiro con arco)
      expect(atkEspada.bonoAtaque).toBe(5);
    });
  });

  describe("3. Mecánica de Defensa (+1 a la CA mientras se equipe armadura)", () => {
    it("debe sumar +1 a la CA si el personaje tiene armadura corporal equipada", () => {
      const doteDefensa = instanciarDoteComoRasgo("dote_estilo_defensa");

      // Caso A: con Cota de mallas (CA base 16)
      const pjConArmadura = crearPersonajeGuerrero({
        inventario: [
          {
            idInstancia: "cota-1",
            idObjeto: "cota-mallas",
            nombre: "Cota de mallas",
            categoria: "armaduras",
            cantidad: 1,
            equipado: true,
            pesoLb: 55,
            sintonizado: false,
            notas: ""
          } as unknown as ObjetoInventario
        ],
        rasgos: [doteDefensa]
      });

      const statsConArmadura = calcularEstadisticasPersonaje(pjConArmadura);
      // Cota de mallas (16) + Defensa (+1) = 17
      expect(statsConArmadura.claseArmadura.total).toBe(17);
      expect(statsConArmadura.claseArmadura.desglose).toContain("+1");
    });

    it("no debe sumar +1 a la CA si el personaje no tiene armadura puesta", () => {
      const doteDefensa = instanciarDoteComoRasgo("dote_estilo_defensa");

      // Caso B: sin armadura
      const pjSinArmadura = crearPersonajeGuerrero({
        inventario: [],
        rasgos: [doteDefensa]
      });

      const statsSinArmadura = calcularEstadisticasPersonaje(pjSinArmadura);
      // Base 10 + DES (+2) = 12 (Defensa no aplica)
      expect(statsSinArmadura.claseArmadura.total).toBe(12);
    });
  });

  describe("4. Mecánica de Combate con armas arrojadizas (+2 al daño a distancia)", () => {
    it("debe sumar +2 al daño en tiradas a distancia con armas con propiedad arrojadiza", () => {
      const doteArrojadizas = instanciarDoteComoRasgo("dote_estilo_combate_armas_arrojadizas");
      const pj = crearPersonajeGuerrero({
        rasgos: [doteArrojadizas]
      });
      const stats = calcularEstadisticasPersonaje(pj);

      const jabalina = crearArmaInventario("inst-jabalina", "Jabalina");
      const compendioMock: ObjetoJuego[] = [
        {
          id: "inst-jabalina",
          nombre: "Jabalina",
          categoria: "armas",
          subcategoria: "Sencilla",
          tipoAtaque: "Cuerpo a Cuerpo",
          propiedades: ["Arrojadiza"],
          dadoDano: "1d6",
          tipoDano: "Perforante",
          alcanceNormal: 30,
          alcanceLargo: 120
        } as unknown as ObjetoJuego
      ];

      const atkJabalina = calcularAtaqueArmaEquipada(jabalina, {
        personajeActivo: pj,
        statsCalculadas: stats,
        baseDatosObjetos: compendioMock,
        caracteristicasArmas: {},
        gruposArmasConsolidados: ["Todas las armas sencillas"],
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      // Daño: 1d6 + FUE (+3) + Arrojadiza (+2) = 1d6+5
      expect(atkJabalina.dadoDano).toBe("1d6+5");
      expect(atkJabalina.modificadorDano).toBe(5);
    });
  });

  describe("5. Mecánica de Duelo (+2 a daño a una mano, nunca a dos manos)", () => {
    it("debe sumar +2 al daño normal a 1 mano y excluir el daño versátil a dos manos", () => {
      const doteDuelo = instanciarDoteComoRasgo("dote_estilo_duelo", {
        activo: true
      });
      const pj = crearPersonajeGuerrero({
        rasgos: [doteDuelo]
      });
      const stats = calcularEstadisticasPersonaje(pj);

      const espadaLarga = crearArmaInventario("inst-espada-larga", "Espada larga");
      const compendioMock: ObjetoJuego[] = [
        {
          id: "inst-espada-larga",
          nombre: "Espada larga",
          categoria: "armas",
          subcategoria: "Marcial",
          tipoAtaque: "Cuerpo a Cuerpo",
          propiedades: ["Versátil"],
          dadoDano: "1d8",
          danoVersatil: "1d10",
          tipoDano: "Cortante"
        } as unknown as ObjetoJuego
      ];

      const atkEspada = calcularAtaqueArmaEquipada(espadaLarga, {
        personajeActivo: pj,
        statsCalculadas: stats,
        baseDatosObjetos: compendioMock,
        caracteristicasArmas: {},
        gruposArmasConsolidados: ["Todas las armas marciales"],
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      // A 1 mano: 1d8 + FUE (+3) + Duelo (+2) = 1d8+5
      expect(atkEspada.dadoDano).toBe("1d8+5");
      expect(atkEspada.modificadorDano).toBe(5);

      // A 2 manos (versátil): 1d10 + FUE (+3) = 1d10+3 (¡Duelo NO aplica a 2 manos!)
      expect(atkEspada.danoVersatil).toBe("1d10+3");
    });

    it("cuando Duelo está desactivado (activo: false), no suma el +2 al daño", () => {
      const doteDueloInactiva = instanciarDoteComoRasgo("dote_estilo_duelo", {
        activo: false
      });
      const pj = crearPersonajeGuerrero({
        rasgos: [doteDueloInactiva]
      });
      const stats = calcularEstadisticasPersonaje(pj);

      const espadaLarga = crearArmaInventario("inst-espada-larga", "Espada larga");
      const compendioMock: ObjetoJuego[] = [
        {
          id: "inst-espada-larga",
          nombre: "Espada larga",
          categoria: "armas",
          subcategoria: "Marcial",
          tipoAtaque: "Cuerpo a Cuerpo",
          propiedades: ["Versátil"],
          dadoDano: "1d8",
          danoVersatil: "1d10",
          tipoDano: "Cortante"
        } as unknown as ObjetoJuego
      ];

      const atkEspada = calcularAtaqueArmaEquipada(espadaLarga, {
        personajeActivo: pj,
        statsCalculadas: stats,
        baseDatosObjetos: compendioMock,
        caracteristicasArmas: {},
        gruposArmasConsolidados: ["Todas las armas marciales"],
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      // Sin Duelo: 1d8 + FUE (+3) = 1d8+3
      expect(atkEspada.dadoDano).toBe("1d8+3");
      expect(atkEspada.modificadorDano).toBe(3);
    });
  });

  describe("6. Reacción y Tirada de Dados de Intercepción", () => {
    it("Intercepción declara tipoAccion reaccion y formulaDados 1d10 + bono_competencia", () => {
      const dote = DOTES_ESTILO_COMBATE_DND55.find((d) => d.id === "dote_estilo_intercepcion");
      expect(dote?.tipoAccion).toBe("reaccion");
      expect(dote?.formulaDados).toBe("1d10 + bono_competencia");
    });
  });

  describe("7. Selectores de Guerrero bendito y Guerrero druídico", () => {
    it("Guerrero bendito ofrece trucos de clérigo", () => {
      const dote = DOTES_ESTILO_COMBATE_DND55.find((d) => d.id === "dote_estilo_guerrero_bendito");
      expect(dote?.selectores).toBeDefined();
      const sel = dote?.selectores?.[0];
      expect(sel?.tipo).toBe("multiple");
      expect(sel?.maxSelecciones).toBe(2);
      expect(sel?.claveOpcionesDinamicas).toBe("trucos_clerigo");
      expect(sel?.opciones.length).toBeGreaterThan(0);
    });

    it("Guerrero druídico ofrece trucos de druida", () => {
      const dote = DOTES_ESTILO_COMBATE_DND55.find((d) => d.id === "dote_estilo_guerrero_druidico");
      expect(dote?.selectores).toBeDefined();
      const sel = dote?.selectores?.[0];
      expect(sel?.tipo).toBe("multiple");
      expect(sel?.maxSelecciones).toBe(2);
      expect(sel?.claveOpcionesDinamicas).toBe("trucos_druida");
      expect(sel?.opciones.length).toBeGreaterThan(0);
    });
  });

  describe("8. Mecánica de Combate sin armas (1d8 sin escudo / 1d6 con escudo)", () => {
    it("debe infligir 1d8 + FUE cuando no se lleva escudo equipado", () => {
      const doteCombateSinArmas = instanciarDoteComoRasgo("dote_estilo_combate_sin_armas");
      const pj = crearPersonajeGuerrero({
        rasgos: [doteCombateSinArmas],
        inventario: []
      });
      const stats = calcularEstadisticasPersonaje(pj);

      const ataqueDesarmado = calcularAtaqueDesarmado({
        personajeActivo: pj,
        statsCalculadas: stats,
        caracteristicasArmas: {},
        gruposArmasConsolidados: ["Todas las armas sencillas"],
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      expect(ataqueDesarmado.dadoDanoBase).toBe("1d8");
      expect(ataqueDesarmado.dadoDano).toBe("1d8+3");
      expect(ataqueDesarmado.caracteristicaUsada).toBe("fuerza");
      expect(ataqueDesarmado.modificadorDano).toBe(3);
    });

    it("debe infligir 1d6 + FUE cuando se lleva un escudo equipado", () => {
      const doteCombateSinArmas = instanciarDoteComoRasgo("dote_estilo_combate_sin_armas");
      const escudo: ObjetoInventario = {
        idInstancia: "inst-escudo",
        idObjeto: "escudo",
        nombre: "Escudo",
        categoria: "escudos",
        cantidad: 1,
        equipado: true,
        pesoLb: 6,
        sintonizado: false,
        notas: ""
      } as unknown as ObjetoInventario;

      const pj = crearPersonajeGuerrero({
        rasgos: [doteCombateSinArmas],
        inventario: [escudo]
      });
      const stats = calcularEstadisticasPersonaje(pj);

      const ataqueDesarmado = calcularAtaqueDesarmado({
        personajeActivo: pj,
        statsCalculadas: stats,
        caracteristicasArmas: {},
        gruposArmasConsolidados: ["Todas las armas sencillas"],
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      expect(ataqueDesarmado.dadoDanoBase).toBe("1d6");
      expect(ataqueDesarmado.dadoDano).toBe("1d6+3");
      expect(ataqueDesarmado.caracteristicaUsada).toBe("fuerza");
      expect(ataqueDesarmado.modificadorDano).toBe(3);
    });
  });
});
