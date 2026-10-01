import { describe, it, expect } from "vitest";
import { obtenerRasgosClaseYSubclase, obtenerClasePorNombre } from "./gestorClases";
import { obtenerBonosSalvacionesRasgos } from "./rasgos/evaluadorSalvacionesRasgos";
import {
  obtenerDanosSecundariosAtaque,
  obtenerBonoAtaqueExtra,
  type ContextoAtaquePersonaje
} from "./rasgos/evaluadorCombateRasgos";
import {
  obtenerConjurosOtorgadosPorRasgos,
  obtenerNombresConjurosGratuitosActivos,
  tieneConjuroGratuitoActivo,
  resolverIdRasgoObjetivoGasto
} from "./rasgos/evaluadorConjurosRasgos";
import { sincronizarRasgosAutomaticos } from "./compendioRasgos";
import {
  esRasgoCanalizarDivinidad,
  resolverRecursosPadre
} from "./rasgos/evaluadorRecursosRasgos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { PersonajeJugador } from "@/tipos/personaje";
import type { RasgoPersonaje } from "@/tipos/rasgos";
import { calcularBonoVelocidadRasgos } from "./rasgos/evaluadorMovilidadRasgos";
import { resolverFormulaDinamica } from "./rasgos/evaluadorExpresionesRasgos";
import efectosPredefinidos from "@/datos/efectos-predefinidos.json";

describe("Paladín D&D 5.5 (2024) - Fase 1: Reglas y Mecánicas de la Clase Base", () => {
  // ── NIVEL 1 ──
  describe("Nivel 1: Imposición de manos, Lanzamiento de conjuros y Maestría con armas", () => {
    it("Imposición de manos escala a nivel * 5 puntos y expone costeFijo de 5", () => {
      const rasgosNv1 = obtenerRasgosClaseYSubclase("Paladín", 1);
      const impManosNv1 = rasgosNv1.find((r) => r.nombre === "Imposición de manos");
      expect(impManosNv1).toBeDefined();
      expect(impManosNv1?.categoriaMecanica).toBe("consumible");
      expect(impManosNv1?.costeFijo).toBe(5);
      expect(impManosNv1?.usosMaximos).toBe(5);
      expect(impManosNv1?.recuperacion).toBe("descanso_largo");

      const rasgosNv5 = obtenerRasgosClaseYSubclase("Paladín", 5);
      const impManosNv5 = rasgosNv5.find((r) => r.nombre === "Imposición de manos");
      expect(impManosNv5?.usosMaximos).toBe(25);

      const rasgosNv10 = obtenerRasgosClaseYSubclase("Paladín", 10);
      const impManosNv10 = rasgosNv10.find((r) => r.nombre === "Imposición de manos");
      expect(impManosNv10?.usosMaximos).toBe(50);

      const rasgosNv20 = obtenerRasgosClaseYSubclase("Paladín", 20);
      const impManosNv20 = rasgosNv20.find((r) => r.nombre === "Imposición de manos");
      expect(impManosNv20?.usosMaximos).toBe(100);
    });

    it("Lanzamiento de conjuros es pasivo permanente y Maestría con armas es selector informativo interactivo", () => {
      const rasgosNv1 = obtenerRasgosClaseYSubclase("Paladín", 1);
      const lanzamiento = rasgosNv1.find((r) => r.nombre === "Lanzamiento de conjuros");
      const maestria = rasgosNv1.find((r) => r.nombre === "Maestría con armas");

      expect(lanzamiento?.categoriaMecanica).toBe("pasivo_permanente");
      expect(lanzamiento?.tieneUsosLimitados).toBe(false);

      expect(maestria?.categoriaMecanica).toBe("selector_informativo");
      expect(maestria?.tieneUsosLimitados).toBe(false);
      expect(maestria?.selectores).toBeDefined();

      const selectorMaestrias = maestria?.selectores?.find((s) => s.id === "maestrias_aprendidas");
      expect(selectorMaestrias).toBeDefined();
      expect(selectorMaestrias?.tipo).toBe("multiple");
      expect(selectorMaestrias?.maxSelecciones).toBe(2);
      expect(selectorMaestrias?.opciones.length).toBe(8);
      expect(selectorMaestrias?.opciones.some((o) => o.id === "topple")).toBe(true);
      expect(selectorMaestrias?.opciones.some((o) => o.id === "cleave")).toBe(true);
    });
  });

  // ── NIVEL 2 ──
  describe("Nivel 2: Estilo de combate & Castigo de paladín", () => {
    it("Estilo de combate inyecta selector con la dote exclusiva 'Guerrero bendecido'", () => {
      const rasgosNv2 = obtenerRasgosClaseYSubclase("Paladín", 2);
      const estiloCombate = rasgosNv2.find((r) => r.nombre === "Estilo de combate");

      expect(estiloCombate).toBeDefined();
      expect(estiloCombate?.selectores).toBeDefined();
      expect(estiloCombate?.selectores?.length).toBeGreaterThan(0);

      const selectorDote = estiloCombate?.selectores?.find((s) => s.id.startsWith("selector_dote_estilo_combate"));
      expect(selectorDote).toBeDefined();

      const opcionGuerreroBendecido = selectorDote?.opciones.find(
        (op) => op.id === "dote_estilo_guerrero_bendito"
      );
      expect(opcionGuerreroBendecido).toBeDefined();
      expect(opcionGuerreroBendecido?.nombre).toMatch(/Guerrero bend(ito|ecido)/);
    });

    it("La dote Guerrero bendecido seleccionada sintetiza selector de 2 trucos de clérigo", () => {
      const rasgosNv2 = obtenerRasgosClaseYSubclase("Paladín", 2);
      const estilo = rasgosNv2.find((r) => r.nombre === "Estilo de combate");
      expect(estilo).toBeDefined();

      const estiloConSeleccion: RasgoPersonaje = {
        ...estilo!,
        selectores: (estilo!.selectores || []).map((s) => ({
          ...s,
          valorActual: ["dote_estilo_guerrero_bendito"]
        }))
      };

      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Paladín",
        nivel: 2,
        rasgos: [estiloConSeleccion]
      };

      const rasgosSincronizados = sincronizarRasgosAutomaticos(pj);
      const doteSintetizada = rasgosSincronizados.find(
        (r) => r.origen === "dote" && r.nombre.includes("Guerrero bend")
      );
      expect(doteSintetizada).toBeDefined();
      expect(doteSintetizada?.nombre).toMatch(/Guerrero bend(ito|ecido)/);

      const selectorTrucos = doteSintetizada?.selectores?.[0];
      expect(selectorTrucos).toBeDefined();
      expect(selectorTrucos?.maxSelecciones).toBe(2);
      expect(selectorTrucos?.claveOpcionesDinamicas).toBe("trucos_clerigo");
      expect(selectorTrucos?.opciones.length).toBeGreaterThan(0);
    });

    it("Castigo de paladín otorga 'Castigo divino' como conjuro gratuito 1 vez por descanso largo y se agota al gastar el uso", () => {
      const rasgosNv2 = obtenerRasgosClaseYSubclase("Paladín", 2);
      const castigoPaladin = rasgosNv2.find((r) => r.nombre === "Castigo de paladín");

      expect(castigoPaladin).toBeDefined();
      expect(castigoPaladin?.categoriaMecanica).toBe("consumible");
      expect(castigoPaladin?.usosMaximos).toBe(1);
      expect(castigoPaladin?.recuperacion).toBe("descanso_largo");
      expect(castigoPaladin?.conjurosOtorgados).toContain("Castigo divino");

      const pjDisponible: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Paladín",
        nivel: 2,
        rasgos: [{ ...castigoPaladin!, usosRestantes: 1 }]
      };

      const otorgados = obtenerConjurosOtorgadosPorRasgos(pjDisponible);
      expect(otorgados).toContain("Castigo divino");

      const gratuitos = obtenerNombresConjurosGratuitosActivos(pjDisponible);
      expect(gratuitos).toContain("Castigo divino");
      expect(tieneConjuroGratuitoActivo(pjDisponible, "Castigo divino")).toBe(true);

      // Al gastar el uso (usosRestantes = 0), deja de ser gratuito
      const pjAgotado: PersonajeJugador = {
        ...pjDisponible,
        rasgos: [{ ...castigoPaladin!, usosRestantes: 0 }]
      };

      const gratuitosAgotado = obtenerNombresConjurosGratuitosActivos(pjAgotado);
      expect(gratuitosAgotado).not.toContain("Castigo divino");
      expect(tieneConjuroGratuitoActivo(pjAgotado, "Castigo divino")).toBe(false);
    });
  });

  // ── NIVEL 3 ──
  describe("Nivel 3: Canalizar divinidad y Sentidos divinos", () => {
    it("Canalizar divinidad otorga 2 usos a nivel 3 y recupera en descanso corto", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Paladín", 3);
      const canalizar = rasgosNv3.find((r) => r.nombre === "Canalizar divinidad");

      expect(canalizar).toBeDefined();
      expect(canalizar?.categoriaMecanica).toBe("consumible");
      expect(canalizar?.usosMaximos).toBe(2);
      expect(canalizar?.recuperacion).toBe("descanso_corto");
    });

    it("Sentidos divinos consume uso del padre 'Canalizar divinidad'", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Paladín", 3);
      const sentidosDivinos = rasgosNv3.find((r) => r.nombre === "Sentidos divinos");
      const canalizar = rasgosNv3.find((r) => r.nombre === "Canalizar divinidad");

      expect(sentidosDivinos).toBeDefined();
      expect(sentidosDivinos?.gastarDePadre).toBe(true);
      expect(sentidosDivinos?.ligadoA).toBe("Canalizar divinidad");

      const idObjetivo = resolverIdRasgoObjetivoGasto(sentidosDivinos, rasgosNv3);
      expect(idObjetivo).toBe(canalizar?.id);

      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Paladín",
        nivel: 3,
        rasgos: [canalizar!, sentidosDivinos!]
      };

      const recursos = resolverRecursosPadre(pj, sentidosDivinos!);
      expect(recursos.usosPadre).toBeDefined();
      expect(recursos.usosPadre?.maximos).toBe(2);
      expect(recursos.usosPadre?.nombre).toBe("Canalizar divinidad");
    });

    it("Tanto Canalizar divinidad como Sentidos divinos se identifican con esRasgoCanalizarDivinidad", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Paladín", 3);
      const canalizar = rasgosNv3.find((r) => r.nombre === "Canalizar divinidad");
      const sentidos = rasgosNv3.find((r) => r.nombre === "Sentidos divinos");

      expect(esRasgoCanalizarDivinidad(canalizar!)).toBe(true);
      expect(esRasgoCanalizarDivinidad(sentidos!)).toBe(true);
    });
  });

  describe("Nivel 5: Corcel fiel", () => {
    it("Corcel fiel otorga 'Hallar corcel' como conjuro gratuito 1 vez por descanso largo y se agota al gastar el uso", () => {
      const rasgosNv5 = obtenerRasgosClaseYSubclase("Paladín", 5);
      const corcel = rasgosNv5.find((r) => r.nombre === "Corcel fiel");

      expect(corcel).toBeDefined();
      expect(corcel?.categoriaMecanica).toBe("consumible");
      expect(corcel?.usosMaximos).toBe(1);
      expect(corcel?.recuperacion).toBe("descanso_largo");
      expect(corcel?.conjurosOtorgados).toContain("Hallar corcel");

      const pjDisponible: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Paladín",
        nivel: 5,
        rasgos: [{ ...corcel!, usosRestantes: 1 }]
      };

      expect(obtenerConjurosOtorgadosPorRasgos(pjDisponible)).toContain("Hallar corcel");
      expect(obtenerNombresConjurosGratuitosActivos(pjDisponible)).toContain("Hallar corcel");
      expect(tieneConjuroGratuitoActivo(pjDisponible, "Hallar corcel")).toBe(true);

      // Al gastar el uso (usosRestantes = 0), deja de ser gratuito
      const pjAgotado: PersonajeJugador = {
        ...pjDisponible,
        rasgos: [{ ...corcel!, usosRestantes: 0 }]
      };

      expect(obtenerNombresConjurosGratuitosActivos(pjAgotado)).not.toContain("Hallar corcel");
      expect(tieneConjuroGratuitoActivo(pjAgotado, "Hallar corcel")).toBe(false);
    });
  });

  // ── NIVEL 6: AURA DE PROTECCIÓN ──
  describe("Nivel 6: Aura de protección (activable con max(1, Carisma) a todas las salvaciones)", () => {
    it("Inactiva: no aplica bonos a las salvaciones", () => {
      const rasgosNv6 = obtenerRasgosClaseYSubclase("Paladín", 6);
      const aura = rasgosNv6.find((r) => r.nombre === "Aura de protección");

      expect(aura).toBeDefined();
      expect(aura?.esActivable).toBe(true);
      expect(aura?.categoriaMecanica).toBe("activable");

      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Paladín",
        nivel: 6,
        caracteristicas: {
          fuerza: 16,
          destreza: 10,
          constitucion: 14,
          inteligencia: 10,
          sabiduria: 12,
          carisma: 16 // Modificador +3
        },
        rasgos: [{ ...aura!, activo: false }]
      };

      const bonos = obtenerBonosSalvacionesRasgos(pj);
      expect(bonos.fuerza).toBe(0);
      expect(bonos.carisma).toBe(0);
    });

    it("Activa con Carisma 16 (+3): suma +3 a todas las tiradas de salvación", () => {
      const rasgosNv6 = obtenerRasgosClaseYSubclase("Paladín", 6);
      const aura = rasgosNv6.find((r) => r.nombre === "Aura de protección");

      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Paladín",
        nivel: 6,
        caracteristicas: {
          fuerza: 16,
          destreza: 10,
          constitucion: 14,
          inteligencia: 10,
          sabiduria: 12,
          carisma: 16 // Modificador +3
        },
        rasgos: [{ ...aura!, activo: true }]
      };

      const bonos = obtenerBonosSalvacionesRasgos(pj);
      expect(bonos.fuerza).toBe(3);
      expect(bonos.destreza).toBe(3);
      expect(bonos.constitucion).toBe(3);
      expect(bonos.inteligencia).toBe(3);
      expect(bonos.sabiduria).toBe(3);
      expect(bonos.carisma).toBe(3);
    });

    it("Activa con Carisma 8 (-1): garantiza el mínimo de +1 gracias a max(1, carisma)", () => {
      const rasgosNv6 = obtenerRasgosClaseYSubclase("Paladín", 6);
      const aura = rasgosNv6.find((r) => r.nombre === "Aura de protección");

      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Paladín",
        nivel: 6,
        caracteristicas: {
          fuerza: 16,
          destreza: 10,
          constitucion: 14,
          inteligencia: 10,
          sabiduria: 12,
          carisma: 8 // Modificador -1
        },
        rasgos: [{ ...aura!, activo: true }]
      };

      const bonos = obtenerBonosSalvacionesRasgos(pj);
      expect(bonos.fuerza).toBe(1);
      expect(bonos.destreza).toBe(1);
      expect(bonos.constitucion).toBe(1);
      expect(bonos.inteligencia).toBe(1);
      expect(bonos.sabiduria).toBe(1);
      expect(bonos.carisma).toBe(1);
    });
  });

  // ── NIVEL 9: ABJURAR ENEMIGOS ──
  describe("Nivel 9: Abjurar enemigos", () => {
    it("Abjurar enemigos consume usos del padre 'Canalizar divinidad'", () => {
      const rasgosNv9 = obtenerRasgosClaseYSubclase("Paladín", 9);
      const abjurar = rasgosNv9.find((r) => r.nombre === "Abjurar enemigos");
      const canalizar = rasgosNv9.find((r) => r.nombre === "Canalizar divinidad");

      expect(abjurar).toBeDefined();
      expect(abjurar?.categoriaMecanica).toBe("consumible");
      expect(abjurar?.gastarDePadre).toBe(true);
      expect(abjurar?.ligadoA).toBe("Canalizar divinidad");

      const idObjetivo = resolverIdRasgoObjetivoGasto(abjurar, rasgosNv9);
      expect(idObjetivo).toBe(canalizar?.id);
      expect(esRasgoCanalizarDivinidad(abjurar!)).toBe(true);
    });
  });

  // ── NIVEL 10: AURA DE VALOR (EXTENSIÓN DE AURA DE PROTECCIÓN) ──
  describe("Nivel 10: Aura de valor (Extensión decoradora de Aura de protección)", () => {
    it("Aura de valor decora a 'Aura de protección' integrando su texto y notas sin duplicar tarjeta", () => {
      const rasgosNv10 = obtenerRasgosClaseYSubclase("Paladín", 10);
      const aura = rasgosNv10.find((r) => r.nombre === "Aura de protección");
      const auraValorSeparada = rasgosNv10.find((r) => r.nombre === "Aura de valor");

      expect(aura).toBeDefined();
      expect(auraValorSeparada).toBeUndefined(); // No debe ser una tarjeta independiente
      expect(aura?.descripcion).toContain("Aura de valor");
      expect(aura?.notas).toContain("10");

      const defPaladin = obtenerClasePorNombre("Paladín");
      const valorBase = defPaladin?.rasgos.find((r) => r.nombre === "Aura de valor");
      expect(valorBase).toBeDefined();
      expect(valorBase?.categoriaMecanica).toBe("extension");
      expect(valorBase?.ligadoA).toBe("Aura de protección");
    });
  });

  // ── NIVEL 11: GOLPES RADIANTES Y ESCALADO CANALIZAR DIVINIDAD ──
  describe("Nivel 11: Golpes radiantes y aumento de Canalizar divinidad a 3 usos", () => {
    it("Canalizar divinidad escala a 3 usos al nivel 11", () => {
      const rasgosNv11 = obtenerRasgosClaseYSubclase("Paladín", 11);
      const canalizar = rasgosNv11.find((r) => r.nombre === "Canalizar divinidad");
      expect(canalizar?.usosMaximos).toBe(3);
    });

    it("Golpes radiantes otorga 1d8 de daño radiante adicional en ataques cuerpo a cuerpo", () => {
      const rasgosNv11 = obtenerRasgosClaseYSubclase("Paladín", 11);
      const golpesRadiantes = rasgosNv11.find((r) => r.nombre === "Golpes radiantes");

      expect(golpesRadiantes).toBeDefined();
      expect(golpesRadiantes?.categoriaMecanica).toBe("pasivo_permanente");
      expect(golpesRadiantes?.formulaDados).toBe("1d8");

      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Paladín",
        nivel: 11,
        rasgos: [golpesRadiantes!]
      };

      // Contexto A: Arma cuerpo a cuerpo (ej. Espada larga)
      const ctxEspada: ContextoAtaquePersonaje = {
        tipo: "arma",
        caracteristica: "fuerza",
        esCuerpoACuerpo: true,
        esDistancia: false
      };
      const danoEspada = obtenerDanosSecundariosAtaque(pj, ctxEspada);
      expect(danoEspada.length).toBe(1);
      expect(danoEspada[0].formula).toBe("1d8");
      expect(danoEspada[0].tipoDano).toBe("Radiante");

      // Contexto B: Ataque desarmado cuerpo a cuerpo
      const ctxDesarmado: ContextoAtaquePersonaje = {
        tipo: "desarmado",
        caracteristica: "fuerza",
        esCuerpoACuerpo: true,
        esDistancia: false
      };
      const danoDesarmado = obtenerDanosSecundariosAtaque(pj, ctxDesarmado);
      expect(danoDesarmado.length).toBe(1);
      expect(danoDesarmado[0].formula).toBe("1d8");
      expect(danoDesarmado[0].tipoDano).toBe("Radiante");

      // Contexto C: Ataque a distancia (ej. Arco largo) -> NO debe recibir el 1d8
      const ctxArco: ContextoAtaquePersonaje = {
        tipo: "arma",
        caracteristica: "destreza",
        esCuerpoACuerpo: false,
        esDistancia: true
      };
      const danoArco = obtenerDanosSecundariosAtaque(pj, ctxArco);
      expect(danoArco.length).toBe(0);
    });
  });

  // ── NIVEL 14: TOQUE RESTAURADOR ──
  describe("Nivel 14: Toque restaurador", () => {
    it("Toque restaurador decora a 'Imposición de manos' incorporando sus efectos y nivel", () => {
      const rasgosNv14 = obtenerRasgosClaseYSubclase("Paladín", 14);
      const impManos = rasgosNv14.find((r) => r.nombre === "Imposición de manos");

      expect(impManos).toBeDefined();
      expect(impManos?.descripcion).toContain("Toque restaurador");
      expect(impManos?.notas).toContain("14");

      const defPaladin = obtenerClasePorNombre("Paladín");
      const toqueBase = defPaladin?.rasgos.find((r) => r.nombre === "Toque restaurador");
      expect(toqueBase).toBeDefined();
      expect(toqueBase?.categoriaMecanica).toBe("extension");
      expect(toqueBase?.ligadoA).toBe("Imposición de manos");
    });
  });

  // ── NIVEL 18: EXPANSIÓN DEL AURA Y 3 USOS CANALIZAR DIVINIDAD ──
  describe("Nivel 18: Expansión del aura y usos de Canalizar divinidad", () => {
    it("Canalizar divinidad mantiene 3 usos y Expansión del aura decora a Aura de protección", () => {
      const rasgosNv18 = obtenerRasgosClaseYSubclase("Paladín", 18);
      const canalizar = rasgosNv18.find((r) => r.nombre === "Canalizar divinidad");
      const expansionSeparada = rasgosNv18.find((r) => r.nombre === "Expansión del aura");
      const aura = rasgosNv18.find((r) => r.nombre === "Aura de protección");

      expect(canalizar?.usosMaximos).toBe(3);
      expect(expansionSeparada).toBeUndefined(); // Decorado en Aura de protección
      expect(aura).toBeDefined();
      expect(aura?.descripcion).toContain("Expansión del aura");
      expect(aura?.notas).toContain("18");
      expect(aura?.notas?.split(",")).toEqual(["6", "10", "18"]);

      const defPaladin = obtenerClasePorNombre("Paladín");
      const expBase = defPaladin?.rasgos.find((r) => r.nombre === "Expansión del aura");
      expect(expBase).toBeDefined();
      expect(expBase?.categoriaMecanica).toBe("extension");
      expect(expBase?.ligadoA).toBe("Aura de protección");
    });
  });

  // ── MECÁNICAS DE IDENTIFICACIÓN DE CANALIZAR DIVINIDAD ──
  describe("Identificación de Rasgos de Canalizar divinidad", () => {
    it("Identifica correctamente los rasgos de Canalizar divinidad y los discrimina de los rasgos base", () => {
      const rasgosNv9 = obtenerRasgosClaseYSubclase("Paladín", 9);
      const canalizar = rasgosNv9.find((r) => r.nombre === "Canalizar divinidad");
      const sentidos = rasgosNv9.find((r) => r.nombre === "Sentidos divinos");
      const abjurar = rasgosNv9.find((r) => r.nombre === "Abjurar enemigos");
      const imposicion = rasgosNv9.find((r) => r.nombre === "Imposición de manos");
      const aura = rasgosNv9.find((r) => r.nombre === "Aura de protección");

      expect(canalizar).toBeDefined();
      expect(sentidos).toBeDefined();
      expect(abjurar).toBeDefined();
      expect(esRasgoCanalizarDivinidad(canalizar!)).toBe(true);
      expect(esRasgoCanalizarDivinidad(sentidos!)).toBe(true);
      expect(esRasgoCanalizarDivinidad(abjurar!)).toBe(true);

      expect(imposicion).toBeDefined();
      expect(aura).toBeDefined();
      expect(esRasgoCanalizarDivinidad(imposicion!)).toBe(false);
      expect(esRasgoCanalizarDivinidad(aura!)).toBe(false);
    });
  });
});

describe("Paladín D&D 5.5 (2024) - Fase 2: Subclase Juramento de Entrega (Oath of Devotion)", () => {
  it("Carga la progresión de conjuros y rasgos de subclase del Juramento de Entrega a nivel 3", () => {
    const rasgosNv3 = obtenerRasgosClaseYSubclase("Paladín", 3, "Juramento de Entrega");
    const conjurosEntrega = rasgosNv3.find((r) => r.nombre === "Conjuros del Juramento de Entrega");
    const armaSagrada = rasgosNv3.find((r) => r.nombre === "Arma sagrada");

    expect(conjurosEntrega).toBeDefined();
    expect(conjurosEntrega?.subclase).toBe("Juramento de Entrega");
    expect(armaSagrada).toBeDefined();
    expect(armaSagrada?.subclase).toBe("Juramento de Entrega");

    const defPaladin = obtenerClasePorNombre("Paladín");
    const subEntrega = defPaladin?.subclases.find((s) => s.nombre === "Juramento de Entrega");
    expect(subEntrega).toBeDefined();
    expect(subEntrega?.progresionConjuros).toBeDefined();
    expect(subEntrega?.progresionConjuros?.length).toBe(5);

    const conjurosNv3 = subEntrega?.progresionConjuros?.find((p) => p.nivelClase === 3)?.conjuros;
    expect(conjurosNv3).toContain("Protección contra el bien y el mal");
    expect(conjurosNv3).toContain("Escudo de fe");
  });

  describe("Arma sagrada: Canalizar divinidad activable con bono al ataque cuerpo a cuerpo", () => {
    it("Consume del padre 'Canalizar divinidad', tiene duración 100 rondas y es activable", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Paladín", 3, "Juramento de Entrega");
      const armaSagrada = rasgosNv3.find((r) => r.nombre === "Arma sagrada");
      const canalizar = rasgosNv3.find((r) => r.nombre === "Canalizar divinidad");

      expect(armaSagrada).toBeDefined();
      expect(armaSagrada?.categoriaMecanica).toBe("activable");
      expect(armaSagrada?.esActivable).toBe(true);
      expect(armaSagrada?.gastarDePadre).toBe(true);
      expect(armaSagrada?.ligadoA).toBe("Canalizar divinidad");
      expect(armaSagrada?.duracionEfectoAlActivar).toBe(100);
      expect(armaSagrada?.condicionAlActivar).toBe("Arma sagrada");

      const idObjetivo = resolverIdRasgoObjetivoGasto(armaSagrada, rasgosNv3);
      expect(idObjetivo).toBe(canalizar?.id);
    });

    it("Inactiva: no aplica bonos al ataque", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Paladín", 3, "Juramento de Entrega");
      const armaSagrada = rasgosNv3.find((r) => r.nombre === "Arma sagrada");

      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Paladín",
        subclase: "Juramento de Entrega",
        nivel: 3,
        caracteristicas: {
          fuerza: 16,
          destreza: 10,
          constitucion: 14,
          inteligencia: 10,
          sabiduria: 12,
          carisma: 16 // Modificador +3
        },
        rasgos: [{ ...armaSagrada!, activo: false }]
      };

      const ctxCaC: ContextoAtaquePersonaje = {
        tipo: "arma",
        caracteristica: "fuerza",
        esCuerpoACuerpo: true,
        esDistancia: false
      };

      const bonoAtaque = obtenerBonoAtaqueExtra(pj, ctxCaC);
      expect(bonoAtaque).toBe(0);
    });

    it("Activa con Carisma 16 (+3): otorga +3 a tiradas de ataque con armas CaC pero no a distancia", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Paladín", 3, "Juramento de Entrega");
      const armaSagrada = rasgosNv3.find((r) => r.nombre === "Arma sagrada");

      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Paladín",
        subclase: "Juramento de Entrega",
        nivel: 3,
        caracteristicas: {
          fuerza: 16,
          destreza: 10,
          constitucion: 14,
          inteligencia: 10,
          sabiduria: 12,
          carisma: 16 // Modificador +3
        },
        rasgos: [{ ...armaSagrada!, activo: true }]
      };

      // Contexto CaC (Espada larga) -> Debe recibir +3
      const ctxCaC: ContextoAtaquePersonaje = {
        tipo: "arma",
        caracteristica: "fuerza",
        esCuerpoACuerpo: true,
        esDistancia: false
      };
      expect(obtenerBonoAtaqueExtra(pj, ctxCaC)).toBe(3);

      // Contexto Distancia (Arco) -> NO debe recibir el bono de Arma sagrada
      const ctxDistancia: ContextoAtaquePersonaje = {
        tipo: "arma",
        caracteristica: "destreza",
        esCuerpoACuerpo: false,
        esDistancia: true
      };
      expect(obtenerBonoAtaqueExtra(pj, ctxDistancia)).toBe(0);
    });

    it("Activa con Carisma 8 (-1): garantiza el mínimo de +1 gracias a max(1, carisma)", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Paladín", 3, "Juramento de Entrega");
      const armaSagrada = rasgosNv3.find((r) => r.nombre === "Arma sagrada");

      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Paladín",
        subclase: "Juramento de Entrega",
        nivel: 3,
        caracteristicas: {
          fuerza: 16,
          destreza: 10,
          constitucion: 14,
          inteligencia: 10,
          sabiduria: 12,
          carisma: 8 // Modificador -1
        },
        rasgos: [{ ...armaSagrada!, activo: true }]
      };

      const ctxCaC: ContextoAtaquePersonaje = {
        tipo: "arma",
        caracteristica: "fuerza",
        esCuerpoACuerpo: true,
        esDistancia: false
      };
      expect(obtenerBonoAtaqueExtra(pj, ctxCaC)).toBe(1);
    });
  });

  describe("Niveles 7, 15 y 20: Aura de entrega, Castigo de protección y Nimbo sagrado", () => {
    it("Aura de entrega a nivel 7 otorga inmunidad a la condición hechizado", () => {
      const rasgosNv7 = obtenerRasgosClaseYSubclase("Paladín", 7, "Juramento de Entrega");
      const auraEntrega = rasgosNv7.find((r) => r.nombre === "Aura de entrega");

      expect(auraEntrega).toBeDefined();
      expect(auraEntrega?.categoriaMecanica).toBe("pasivo_permanente");
      expect(auraEntrega?.efectos?.[0]?.tipo).toBe("inmunidad_condicion");
      expect(auraEntrega?.efectos?.[0]?.objetivo).toBe("hechizado");
    });

    it("Castigo de protección a nivel 15 está presente como pasivo permanente", () => {
      const rasgosNv15 = obtenerRasgosClaseYSubclase("Paladín", 15, "Juramento de Entrega");
      const castigoProteccion = rasgosNv15.find((r) => r.nombre === "Castigo de protección");

      expect(castigoProteccion).toBeDefined();
      expect(castigoProteccion?.categoriaMecanica).toBe("pasivo_permanente");
    });

    it("Nimbo sagrado a nivel 20 es activable con 1 uso por descanso largo y duración 100 rondas", () => {
      const rasgosNv20 = obtenerRasgosClaseYSubclase("Paladín", 20, "Juramento de Entrega");
      const nimbo = rasgosNv20.find((r) => r.nombre === "Nimbo sagrado");

      expect(nimbo).toBeDefined();
      expect(nimbo?.categoriaMecanica).toBe("activable");
      expect(nimbo?.esActivable).toBe(true);
      expect(nimbo?.tieneUsosLimitados).toBe(true);
      expect(nimbo?.usosMaximos).toBe(1);
      expect(nimbo?.recuperacion).toBe("descanso_largo");
      expect(nimbo?.duracionEfectoAlActivar).toBe(100);
      expect(nimbo?.condicionAlActivar).toBe("Nimbo sagrado");
    });

    it("Arma sagrada se identifica como rasgo de Canalizar divinidad", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Paladín", 3, "Juramento de Entrega");
      const armaSagrada = rasgosNv3.find((r) => r.nombre === "Arma sagrada");
      const sentidos = rasgosNv3.find((r) => r.nombre === "Sentidos divinos");

      expect(armaSagrada).toBeDefined();
      expect(sentidos).toBeDefined();
      expect(esRasgoCanalizarDivinidad(armaSagrada!)).toBe(true);
      expect(esRasgoCanalizarDivinidad(sentidos!)).toBe(true);
    });
  });

  // ── TABLAS DE PROGRESIÓN Y EFECTOS PREDEFINIDOS DE PALADÍN ──
  describe("Tablas de progresión en pies y Efectos Predefinidos", () => {
    it("Canalizar divinidad expone su tablaProgresion con niveles 3 y 11 y nota al pie", () => {
      const defPaladin = obtenerClasePorNombre("Paladín");
      const canalizar = defPaladin?.rasgos.find((r) => r.nombre === "Canalizar divinidad");

      expect(canalizar?.tablaProgresion).toBeDefined();
      expect(canalizar?.tablaProgresion?.columnas).toEqual(["Nivel", "Descripción"]);
      expect(canalizar?.tablaProgresion?.notaPie).toBe("Cada nivel reemplaza al anterior");
      expect(canalizar?.tablaProgresion?.filas).toEqual([
        { nivel: 3, valores: ["2 usos"] },
        { nivel: 11, valores: ["3 usos"] }
      ]);
    });

    it("Aura de protección expone su tablaProgresion en pies (10 pies y 30 pies)", () => {
      const defPaladin = obtenerClasePorNombre("Paladín");
      const aura = defPaladin?.rasgos.find((r) => r.nombre === "Aura de protección");

      expect(aura?.tablaProgresion).toBeDefined();
      expect(aura?.tablaProgresion?.columnas).toEqual(["Nivel", "Descripción"]);
      expect(aura?.tablaProgresion?.notaPie).toBe("Cada nivel reemplaza al anterior");
      expect(aura?.tablaProgresion?.filas).toEqual([
        { nivel: 6, valores: ["Emanación de 10 pies"] },
        { nivel: 10, valores: ["Emanación de 10 pies + inmunidad a Asustado"] },
        { nivel: 18, valores: ["Emanación de 30 pies + inmunidad a Asustado"] }
      ]);
    });

    it("Arma sagrada y Nimbo sagrado están registrados en el catálogo de efectos predefinidos con duración 100", () => {
      const efectoArmaSagrada = (efectosPredefinidos as Array<{ nombre: string; duracionEstandar: number; aliases?: string[] }>).find(
        (e) => e.nombre.toLowerCase() === "arma sagrada"
      );
      expect(efectoArmaSagrada).toBeDefined();
      expect(efectoArmaSagrada?.duracionEstandar).toBe(100);
      expect(efectoArmaSagrada?.aliases).toContain("sacred weapon");

      const efectoNimbo = (efectosPredefinidos as Array<{ nombre: string; duracionEstandar: number; aliases?: string[] }>).find(
        (e) => e.nombre.toLowerCase() === "nimbo sagrado"
      );
      expect(efectoNimbo).toBeDefined();
      expect(efectoNimbo?.duracionEstandar).toBe(100);
      expect(efectoNimbo?.aliases).toContain("holy nimbus");

      const efectoAtleta = (efectosPredefinidos as Array<{ nombre: string; duracionEstandar: number; aliases?: string[] }>).find(
        (e) => e.nombre.toLowerCase() === "atleta sin par"
      );
      expect(efectoAtleta).toBeDefined();
      expect(efectoAtleta?.duracionEstandar).toBe(100);
      expect(efectoAtleta?.aliases).toContain("peerless athlete");

      const efectoLeyenda = (efectosPredefinidos as Array<{ nombre: string; duracionEstandar: number; aliases?: string[] }>).find(
        (e) => e.nombre.toLowerCase() === "leyenda viviente"
      );
      expect(efectoLeyenda).toBeDefined();
      expect(efectoLeyenda?.duracionEstandar).toBe(100);
      expect(efectoLeyenda?.aliases).toContain("living legend");
    });
  });

  // ── FASE 3: SUBCLASE JURAMENTO DE GLORIA (OATH OF GLORY) ──
  describe("Fase 3: Subclase Juramento de Gloria (Oath of Glory)", () => {
    it("Progresión canónica de conjuros preparados del Juramento de Gloria en niveles 3, 5, 9, 13 y 17", () => {
      const defPaladin = obtenerClasePorNombre("Paladín");
      const subGloria = defPaladin?.subclases?.find((s) => s.id === "juramento_de_gloria");
      expect(subGloria).toBeDefined();
      expect(subGloria?.progresionConjuros).toHaveLength(5);

      const nv3Spells = subGloria?.progresionConjuros?.find((p) => p.nivelClase === 3)?.conjuros;
      expect(nv3Spells).toContain("Saeta guía");
      expect(nv3Spells).toContain("Heroísmo");

      const nv5Spells = subGloria?.progresionConjuros?.find((p) => p.nivelClase === 5)?.conjuros;
      expect(nv5Spells).toContain("Arma mágica");
      expect(nv5Spells).toContain("Potenciar característica");

      const nv9Spells = subGloria?.progresionConjuros?.find((p) => p.nivelClase === 9)?.conjuros;
      expect(nv9Spells).toContain("Acelerar");
      expect(nv9Spells).toContain("Faro de esperanza");

      const nv13Spells = subGloria?.progresionConjuros?.find((p) => p.nivelClase === 13)?.conjuros;
      expect(nv13Spells).toContain("Compulsión");
      expect(nv13Spells).toContain("Libertad de movimiento");

      const nv17Spells = subGloria?.progresionConjuros?.find((p) => p.nivelClase === 17)?.conjuros;
      expect(nv17Spells).toContain("Comunión");
      expect(nv17Spells).toContain("Golpe de viento acerado");
    });

    it("Castigo inspirador a nivel 3 es consumible, delega en Canalizar divinidad y escala su fórmula de dados a '2d8 + nivel'", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Paladín", 3, "Juramento de Gloria");
      const castigo = rasgosNv3.find((r) => r.nombre === "Castigo inspirador");
      const canalizar = rasgosNv3.find((r) => r.nombre === "Canalizar divinidad");

      expect(castigo).toBeDefined();
      expect(castigo?.categoriaMecanica).toBe("consumible");
      expect(castigo?.tipoAccion).toBe("reaccion");
      expect(castigo?.gastarDePadre).toBe(true);
      expect(castigo?.ligadoA).toBe("Canalizar divinidad");
      expect(castigo?.formulaDados).toBe("2d8 + nivel");
      expect(esRasgoCanalizarDivinidad(castigo!)).toBe(true);

      const idObjetivo = resolverIdRasgoObjetivoGasto(castigo, rasgosNv3);
      expect(idObjetivo).toBe(canalizar?.id);
    });

    it("Atleta sin par a nivel 3 es activable, gasta de Canalizar divinidad y otorga ventaja en Atletismo y Acrobacias", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Paladín", 3, "Juramento de Gloria");
      const atleta = rasgosNv3.find((r) => r.nombre === "Atleta sin par");

      expect(atleta).toBeDefined();
      expect(atleta?.categoriaMecanica).toBe("activable");
      expect(atleta?.esActivable).toBe(true);
      expect(atleta?.gastarDePadre).toBe(true);
      expect(atleta?.ligadoA).toBe("Canalizar divinidad");
      expect(atleta?.duracionEfectoAlActivar).toBe(100);
      expect(atleta?.condicionAlActivar).toBe("Atleta sin par");

      const efAtletismo = atleta?.efectos?.find((e) => e.tipo === "ventaja" && e.objetivo === "atletismo");
      expect(efAtletismo).toBeDefined();

      const efAcrobacias = atleta?.efectos?.find((e) => e.tipo === "ventaja" && e.objetivo === "acrobacias");
      expect(efAcrobacias).toBeDefined();

      expect(esRasgoCanalizarDivinidad(atleta!)).toBe(true);
    });

    it("Aura de presteza a nivel 7 es pasivo permanente y otorga +10 pies de velocidad de movimiento", () => {
      const rasgosNv7 = obtenerRasgosClaseYSubclase("Paladín", 7, "Juramento de Gloria");
      const auraPresteza = rasgosNv7.find((r) => r.nombre === "Aura de presteza");

      expect(auraPresteza).toBeDefined();
      expect(auraPresteza?.categoriaMecanica).toBe("pasivo_permanente");

      const efVel = auraPresteza?.efectos?.find((e) => e.tipo === "modificador_velocidad");
      expect(efVel).toBeDefined();
      expect(efVel?.valor).toBe(10);

      const pjGloriaNv7: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-gloria-nv7",
        nivel: 7,
        clase: "Paladín",
        subclase: "Juramento de Gloria",
        rasgos: sincronizarRasgosAutomaticos({
          ...PERSONAJE_POR_DEFECTO,
          nivel: 7,
          clase: "Paladín",
          subclase: "Juramento de Gloria"
        })
      };

      const bonoVelocidad = calcularBonoVelocidadRasgos(pjGloriaNv7);
      expect(bonoVelocidad).toBe(10);
    });

    it("Defensa gloriosa a nivel 15 es consumible por reacción y escala usos por modificador de Carisma", () => {
      const rasgosNv15 = obtenerRasgosClaseYSubclase("Paladín", 15, "Juramento de Gloria");
      const defensa = rasgosNv15.find((r) => r.nombre === "Defensa gloriosa");

      expect(defensa).toBeDefined();
      expect(defensa?.categoriaMecanica).toBe("consumible");
      expect(defensa?.tipoAccion).toBe("reaccion");
      expect(defensa?.tieneUsosLimitados).toBe(true);
      expect(defensa?.recuperacion).toBe("descanso_largo");
      expect(defensa?.escaladoUsos?.tipo).toBe("por_modificador");
      expect(defensa?.escaladoUsos?.modificador).toBe("carisma");
      expect(defensa?.escaladoUsos?.minimo).toBe(1);

      // Personaje con Carisma 16 (+3)
      const pjCarisma16: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-gloria-nv15",
        nivel: 15,
        clase: "Paladín",
        subclase: "Juramento de Gloria",
        caracteristicas: {
          fuerza: 16,
          destreza: 10,
          constitucion: 14,
          inteligencia: 10,
          sabiduria: 10,
          carisma: 16
        }
      };

      const rasgosSincronizados = sincronizarRasgosAutomaticos(pjCarisma16);
      const defensaSincronizada = rasgosSincronizados.find((r) => r.nombre === "Defensa gloriosa");
      expect(defensaSincronizada?.usosMaximos).toBe(3);
      expect(defensaSincronizada?.usosRestantes).toBe(3);

      // Personaje con Carisma 8 (-1) respeta el suelo mínimo de 1 uso
      const pjCarisma8: PersonajeJugador = {
        ...pjCarisma16,
        caracteristicas: {
          ...pjCarisma16.caracteristicas,
          carisma: 8
        }
      };
      const rasgosSinc8 = sincronizarRasgosAutomaticos(pjCarisma8);
      const defensaSinc8 = rasgosSinc8.find((r) => r.nombre === "Defensa gloriosa");
      expect(defensaSinc8?.usosMaximos).toBe(1);
    });

    it("Leyenda viviente a nivel 20 es activable por 100 rondas, con 1 uso por descanso largo y otorga ventaja en Carisma", () => {
      const rasgosNv20 = obtenerRasgosClaseYSubclase("Paladín", 20, "Juramento de Gloria");
      const leyenda = rasgosNv20.find((r) => r.nombre === "Leyenda viviente");

      expect(leyenda).toBeDefined();
      expect(leyenda?.categoriaMecanica).toBe("activable");
      expect(leyenda?.esActivable).toBe(true);
      expect(leyenda?.tieneUsosLimitados).toBe(true);
      expect(leyenda?.usosMaximos).toBe(1);
      expect(leyenda?.recuperacion).toBe("descanso_largo");
      expect(leyenda?.duracionEfectoAlActivar).toBe(100);
      expect(leyenda?.condicionAlActivar).toBe("Leyenda viviente");

      const efCarisma = leyenda?.efectos?.find((e) => e.tipo === "ventaja" && e.objetivo === "carisma");
      expect(efCarisma).toBeDefined();
    });

    it("Castigo inspirador y Atleta sin par se identifican como rasgos de Canalizar divinidad", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Paladín", 3, "Juramento de Gloria");
      const castigo = rasgosNv3.find((r) => r.nombre === "Castigo inspirador");
      const atleta = rasgosNv3.find((r) => r.nombre === "Atleta sin par");
      const sentidos = rasgosNv3.find((r) => r.nombre === "Sentidos divinos");

      expect(castigo).toBeDefined();
      expect(atleta).toBeDefined();
      expect(sentidos).toBeDefined();
      expect(esRasgoCanalizarDivinidad(castigo!)).toBe(true);
      expect(esRasgoCanalizarDivinidad(atleta!)).toBe(true);
      expect(esRasgoCanalizarDivinidad(sentidos!)).toBe(true);
    });
  });

  // ── FASE 4: SUBCLASE JURAMENTO DE LOS ANTIGUOS (OATH OF THE ANCIENTS) ──
  describe("Fase 4: Subclase Juramento de los Antiguos (Oath of the Ancients)", () => {
    it("Progresión canónica de conjuros preparados del Juramento de los Antiguos en niveles 3, 5, 9, 13 y 17", () => {
      const defPaladin = obtenerClasePorNombre("Paladín");
      const subAntiguos = defPaladin?.subclases?.find((s) => s.id === "juramento_de_los_antiguos");
      expect(subAntiguos).toBeDefined();
      expect(subAntiguos?.progresionConjuros).toHaveLength(5);

      const nv3Spells = subAntiguos?.progresionConjuros?.find((p) => p.nivelClase === 3)?.conjuros;
      expect(nv3Spells).toContain("Golpe atrapador");
      expect(nv3Spells).toContain("Hablar con los animales");

      const nv5Spells = subAntiguos?.progresionConjuros?.find((p) => p.nivelClase === 5)?.conjuros;
      expect(nv5Spells).toContain("Rayo lunar");
      expect(nv5Spells).toContain("Paso brumoso");

      const nv9Spells = subAntiguos?.progresionConjuros?.find((p) => p.nivelClase === 9)?.conjuros;
      expect(nv9Spells).toContain("Crecimiento vegetal");
      expect(nv9Spells).toContain("Protección contra la energía");

      const nv13Spells = subAntiguos?.progresionConjuros?.find((p) => p.nivelClase === 13)?.conjuros;
      expect(nv13Spells).toContain("Tormenta de hielo");
      expect(nv13Spells).toContain("Piel pétrea");

      const nv17Spells = subAntiguos?.progresionConjuros?.find((p) => p.nivelClase === 17)?.conjuros;
      expect(nv17Spells).toContain("Comunión con la naturaleza");
      expect(nv17Spells).toContain("Ola destructiva");
    });

    it("Ira de la naturaleza a nivel 3 es consumible, gasta de Canalizar divinidad y se agrupa en su sección colapsable", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Paladín", 3, "Juramento de los Antiguos");
      const ira = rasgosNv3.find((r) => r.nombre === "Ira de la naturaleza");
      const canalizar = rasgosNv3.find((r) => r.nombre === "Canalizar divinidad");

      expect(ira).toBeDefined();
      expect(ira?.categoriaMecanica).toBe("consumible");
      expect(ira?.tipoAccion).toBe("accion");
      expect(ira?.gastarDePadre).toBe(true);
      expect(ira?.ligadoA).toBe("Canalizar divinidad");
      expect(esRasgoCanalizarDivinidad(ira!)).toBe(true);

      const idObjetivo = resolverIdRasgoObjetivoGasto(ira, rasgosNv3);
      expect(idObjetivo).toBe(canalizar?.id);

      const sentidos = rasgosNv3.find((r) => r.nombre === "Sentidos divinos");
      expect(sentidos).toBeDefined();
      expect(esRasgoCanalizarDivinidad(sentidos!)).toBe(true);
    });

    it("Aura de custodia a nivel 7 es pasivo permanente y otorga resistencia a daño necrótico, psíquico y radiante", () => {
      const rasgosNv7 = obtenerRasgosClaseYSubclase("Paladín", 7, "Juramento de los Antiguos");
      const auraCustodia = rasgosNv7.find((r) => r.nombre === "Aura de custodia");

      expect(auraCustodia).toBeDefined();
      expect(auraCustodia?.categoriaMecanica).toBe("pasivo_permanente");
      expect(auraCustodia?.tipoAccion).toBe("pasivo");

      const resNecrotico = auraCustodia?.efectos?.find((e) => e.tipo === "personalizado" && e.objetivo === "resistencia_dano.necrotico");
      expect(resNecrotico).toBeDefined();

      const resPsiquico = auraCustodia?.efectos?.find((e) => e.tipo === "personalizado" && e.objetivo === "resistencia_dano.psiquico");
      expect(resPsiquico).toBeDefined();

      const resRadiante = auraCustodia?.efectos?.find((e) => e.tipo === "personalizado" && e.objetivo === "resistencia_dano.radiante");
      expect(resRadiante).toBeDefined();
    });

    it("Centinela imperecedero a nivel 15 es curación de 1 uso por descanso largo con fórmula '3 * nivel' que evalúa dinámicamente", () => {
      const rasgosNv15 = obtenerRasgosClaseYSubclase("Paladín", 15, "Juramento de los Antiguos");
      const centinela = rasgosNv15.find((r) => r.nombre === "Centinela imperecedero");

      expect(centinela).toBeDefined();
      expect(centinela?.categoriaMecanica).toBe("curacion");
      expect(centinela?.tipoAccion).toBe("especial");
      expect(centinela?.tieneUsosLimitados).toBe(true);
      expect(centinela?.usosMaximos).toBe(1);
      expect(centinela?.recuperacion).toBe("descanso_largo");
      expect(centinela?.formulaDados).toBe("3 * nivel");

      // Verificación de resolución dinámica de curación en contexto de personaje (3 * nivel = 45 a Nv 15, 60 a Nv 20)
      const pj15: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Paladín",
        subclase: "Juramento de los Antiguos",
        nivel: 15
      };
      const curacionNv15 = resolverFormulaDinamica(centinela!.formulaDados!, pj15, "Paladín");
      expect(curacionNv15).toBe("45");

      const pj20: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Paladín",
        subclase: "Juramento de los Antiguos",
        nivel: 20
      };
      const curacionNv20 = resolverFormulaDinamica(centinela!.formulaDados!, pj20, "Paladín");
      expect(curacionNv20).toBe("60");
    });

    it("Campeón anciano a nivel 20 es activable por 10 rondas, con 1 uso por descanso largo, regeneración de 10 PG y efectos informativos", () => {
      const rasgosNv20 = obtenerRasgosClaseYSubclase("Paladín", 20, "Juramento de los Antiguos");
      const campeon = rasgosNv20.find((r) => r.nombre === "Campeón anciano");

      expect(campeon).toBeDefined();
      expect(campeon?.categoriaMecanica).toBe("activable");
      expect(campeon?.esActivable).toBe(true);
      expect(campeon?.tieneUsosLimitados).toBe(true);
      expect(campeon?.usosMaximos).toBe(1);
      expect(campeon?.recuperacion).toBe("descanso_largo");
      expect(campeon?.duracionEfectoAlActivar).toBe(10);
      expect(campeon?.condicionAlActivar).toBe("Campeón anciano");

      const efRegeneracion = campeon?.efectos?.find((e) => e.tipo === "personalizado" && e.objetivo === "regeneracion");
      expect(efRegeneracion).toBeDefined();
      expect(efRegeneracion?.valor).toBe("10");

      const efConjuros = campeon?.efectos?.find((e) => e.tipo === "personalizado" && e.objetivo === "conjuros_veloces");
      expect(efConjuros).toBeDefined();

      const efResistencia = campeon?.efectos?.find((e) => e.tipo === "personalizado" && e.objetivo === "disminuir_resistencia");
      expect(efResistencia).toBeDefined();
    });

    it("Campeón anciano está registrado en el catálogo de efectos predefinidos con duración 10 rondas y alias elder champion", () => {
      const efectoCampeon = (efectosPredefinidos as Array<{ nombre: string; duracionEstandar: number; aliases?: string[] }>).find(
        (e) => e.nombre.toLowerCase() === "campeón anciano"
      );
      expect(efectoCampeon).toBeDefined();
      expect(efectoCampeon?.duracionEstandar).toBe(10);
      expect(efectoCampeon?.aliases).toContain("elder champion");
    });
  });

  // ── FASE 5: SUBCLASE JURAMENTO DE VENGANZA (OATH OF VENGEANCE) ──
  describe("Fase 5: Subclase Juramento de Venganza (Oath of Vengeance)", () => {
    it("Progresión canónica de conjuros preparados del Juramento de Venganza en niveles 3, 5, 9, 13 y 17", () => {
      const defPaladin = obtenerClasePorNombre("Paladín");
      const subVenganza = defPaladin?.subclases?.find((s) => s.id === "juramento_de_venganza");
      expect(subVenganza).toBeDefined();
      expect(subVenganza?.progresionConjuros).toHaveLength(5);

      const nv3Spells = subVenganza?.progresionConjuros?.find((p) => p.nivelClase === 3)?.conjuros;
      expect(nv3Spells).toContain("Perdición");
      expect(nv3Spells).toContain("Marca del cazador");

      const nv5Spells = subVenganza?.progresionConjuros?.find((p) => p.nivelClase === 5)?.conjuros;
      expect(nv5Spells).toContain("Inmovilizar persona");
      expect(nv5Spells).toContain("Paso brumoso");

      const nv9Spells = subVenganza?.progresionConjuros?.find((p) => p.nivelClase === 9)?.conjuros;
      expect(nv9Spells).toContain("Acelerar");
      expect(nv9Spells).toContain("Protección contra la energía");

      const nv13Spells = subVenganza?.progresionConjuros?.find((p) => p.nivelClase === 13)?.conjuros;
      expect(nv13Spells).toContain("Destierro");
      expect(nv13Spells).toContain("Puerta dimensional");

      const nv17Spells = subVenganza?.progresionConjuros?.find((p) => p.nivelClase === 17)?.conjuros;
      expect(nv17Spells).toContain("Inmovilizar monstruo");
      expect(nv17Spells).toContain("Escrudiñar");
    });

    it("Voto de enemistad a nivel 3 es consumible de acción adicional, gasta de Canalizar divinidad y se agrupa en su sección colapsable", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Paladín", 3, "Juramento de Venganza");
      const voto = rasgosNv3.find((r) => r.nombre === "Voto de enemistad");
      const canalizar = rasgosNv3.find((r) => r.nombre === "Canalizar divinidad");

      expect(voto).toBeDefined();
      expect(voto?.categoriaMecanica).toBe("consumible");
      expect(voto?.tipoAccion).toBe("accion_adicional");
      expect(voto?.gastarDePadre).toBe(true);
      expect(voto?.ligadoA).toBe("Canalizar divinidad");
      expect(esRasgoCanalizarDivinidad(voto!)).toBe(true);

      const idObjetivo = resolverIdRasgoObjetivoGasto(voto, rasgosNv3);
      expect(idObjetivo).toBe(canalizar?.id);

      const sentidos = rasgosNv3.find((r) => r.nombre === "Sentidos divinos");
      expect(sentidos).toBeDefined();
      expect(esRasgoCanalizarDivinidad(sentidos!)).toBe(true);
    });

    it("Vengador implacable a nivel 7 es reacción y pasivo permanente", () => {
      const rasgosNv7 = obtenerRasgosClaseYSubclase("Paladín", 7, "Juramento de Venganza");
      const vengador = rasgosNv7.find((r) => r.nombre === "Vengador implacable");

      expect(vengador).toBeDefined();
      expect(vengador?.categoriaMecanica).toBe("pasivo_permanente");
      expect(vengador?.tipoAccion).toBe("reaccion");
    });

    it("Alma de venganza a nivel 15 es reacción y pasivo permanente", () => {
      const rasgosNv15 = obtenerRasgosClaseYSubclase("Paladín", 15, "Juramento de Venganza");
      const alma = rasgosNv15.find((r) => r.nombre === "Alma de venganza");

      expect(alma).toBeDefined();
      expect(alma?.categoriaMecanica).toBe("pasivo_permanente");
      expect(alma?.tipoAccion).toBe("reaccion");
    });

    it("Ángel vengador a nivel 20 es activable por 100 rondas, con 1 uso por descanso largo, velocidad de vuelo 60 pies y aura aterradora", () => {
      const rasgosNv20 = obtenerRasgosClaseYSubclase("Paladín", 20, "Juramento de Venganza");
      const angel = rasgosNv20.find((r) => r.nombre === "Ángel vengador");

      expect(angel).toBeDefined();
      expect(angel?.categoriaMecanica).toBe("activable");
      expect(angel?.esActivable).toBe(true);
      expect(angel?.tieneUsosLimitados).toBe(true);
      expect(angel?.usosMaximos).toBe(1);
      expect(angel?.recuperacion).toBe("descanso_largo");
      expect(angel?.duracionEfectoAlActivar).toBe(100);
      expect(angel?.condicionAlActivar).toBe("Ángel vengador");

      const efVuelo = angel?.efectos?.find((e) => e.tipo === "movimiento_especial" && e.objetivo === "volar");
      expect(efVuelo).toBeDefined();
      expect(efVuelo?.valor).toBe(60);

      const efAura = angel?.efectos?.find((e) => e.tipo === "personalizado" && e.objetivo === "aura_aterradora");
      expect(efAura).toBeDefined();
      expect(efAura?.valor).toBe("asustado");
    });

    it("Ángel vengador está registrado en el catálogo de efectos predefinidos con duración 100 rondas y alias avenging angel", () => {
      const efectoAngel = (efectosPredefinidos as Array<{ nombre: string; duracionEstandar: number; aliases?: string[] }>).find(
        (e) => e.nombre.toLowerCase() === "ángel vengador"
      );
      expect(efectoAngel).toBeDefined();
      expect(efectoAngel?.duracionEstandar).toBe(100);
      expect(efectoAngel?.aliases).toContain("avenging angel");
    });
  });

  describe("Tablas de progresión estructuradas de conjuros de subclase (PHB 2024)", () => {
    const subclasesPaladin = [
      { id: "Entrega", nombreSubclase: "Juramento de Entrega", nombreRasgo: "Conjuros del Juramento de Entrega" },
      { id: "Gloria", nombreSubclase: "Juramento de Gloria", nombreRasgo: "Conjuros del Juramento de Gloria" },
      { id: "Antiguos", nombreSubclase: "Juramento de los Antiguos", nombreRasgo: "Conjuros del Juramento de los Antiguos" },
      { id: "Venganza", nombreSubclase: "Juramento de Venganza", nombreRasgo: "Conjuros del Juramento de Venganza" }
    ];

    it.each(subclasesPaladin)(
      "La subclase $nombreSubclase posee el rasgo de conjuros con tablaProgresion de 5 filas (niveles 3, 5, 9, 13, 17)",
      ({ nombreSubclase, nombreRasgo }) => {
        const rasgos = obtenerRasgosClaseYSubclase("Paladín", 3, nombreSubclase);
        const rasgoConjuros = rasgos.find((r) => r.nombre === nombreRasgo);

        expect(rasgoConjuros).toBeDefined();
        expect(rasgoConjuros?.tablaProgresion).toBeDefined();
        expect(rasgoConjuros?.tablaProgresion?.columnas).toEqual(["Nivel de paladín", "Conjuros"]);
        expect(rasgoConjuros?.tablaProgresion?.filas).toHaveLength(5);

        const niveles = rasgoConjuros?.tablaProgresion?.filas.map((f) => f.nivel);
        expect(niveles).toEqual([3, 5, 9, 13, 17]);

        for (const fila of rasgoConjuros?.tablaProgresion?.filas || []) {
          expect(fila.valores[0]).toBeTruthy();
          expect(fila.valores[0].length).toBeGreaterThan(0);
        }
      }
    );
  });
});



