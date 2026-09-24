import { describe, it, expect } from "vitest";
import {
  DOTES_GENERALES_Y_EPICAS_DND55,
  TODAS_LAS_DOTES_CANONICAS_DND55
} from "@/constantes/dotesConstantes";
import type { RasgoPersonaje } from "@/tipos/rasgos";
import type { PersonajeJugador, ObjetoInventario } from "@/tipos";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import {
  obtenerCompetenciasExtraRasgos,
  obtenerBonoDanoAtaqueExtra
} from "./evaluadorEfectosRasgos";
import { calcularAtaqueArmaEquipada } from "./calculadorAtaquesArmas";
import { ejecutarDescansoCorto, ejecutarDescansoLargo } from "./procesadorDescansos";
import { usarAlmacenDM } from "@/almacen";

function crearPersonajeBase(overrides: Partial<PersonajeJugador> = {}): PersonajeJugador {
  return {
    id: "pj-test-lote2",
    nombre: "Héroe del Lote 2",
    clase: "Guerrero",
    nivel: 4,
    caracteristicas: {
      fuerza: 16, // Mod +3
      destreza: 14, // Mod +2
      constitucion: 14, // Mod +2
      inteligencia: 10,
      sabiduria: 12,
      carisma: 10
    },
    puntosGolpe: {
      actuales: 34,
      maximos: 34,
      temporales: 0
    },
    velocidad: 30,
    ca: 16,
    salvacionesMuerte: {
      exitos: 0,
      fallos: 0
    },
    inventario: [],
    rasgos: [],
    condicionesActivas: [],
    ...overrides
  } as unknown as PersonajeJugador;
}

function instanciarDoteComoRasgo(idDote: string, modificaciones: Partial<RasgoPersonaje> = {}): RasgoPersonaje {
  const dote = TODAS_LAS_DOTES_CANONICAS_DND55.find((d) => d.id === idDote);
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
    categoriaMecanica: dote.categoriaMecanica || "pasivo_permanente",
    esActivable: Boolean(dote.esActivable),
    autoDesactivar: Boolean(dote.autoDesactivar),
    personalizado: false,
    activo: true,
    efectos: dote.efectos ? JSON.parse(JSON.stringify(dote.efectos)) : [],
    selectores: dote.selectores ? JSON.parse(JSON.stringify(dote.selectores)) : [],
    conjurosOtorgados: dote.conjurosOtorgados ? [...dote.conjurosOtorgados] : [],
    notas: "",
    ...modificaciones
  } as RasgoPersonaje;
}

describe("Dotes Generales Canónicas D&D 5.5e — Lote 2/4", () => {
  const idsLote2 = [
    "dote_versado_elemento",
    "dote_influencia_feerica",
    "dote_apresador",
    "dote_maestro_armas_pesadas",
    "dote_muy_acorazado",
    "dote_maestro_armaduras_pesadas",
    "dote_lider_inspirador",
    "dote_mente_aguda",
    "dote_ligeramente_acorazado",
    "dote_azote_magos"
  ];

  it("1. Contrato Canónico: Las 10 dotes del Lote 2/4 están presentes en el catálogo y cumplen especificaciones", () => {
    for (const id of idsLote2) {
      const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === id);
      expect(dote, `La dote con id ${id} debe existir en DOTES_GENERALES_Y_EPICAS_DND55`).toBeDefined();
      expect(dote?.categoria).toBe("general");
      expect(dote?.fuente).toBe("PHB 2024");
      expect(dote?.nombre.trim().length).toBeGreaterThan(0);
      expect(dote?.descripcion.trim().length).toBeGreaterThan(20);
      expect(dote?.beneficios.length).toBeGreaterThanOrEqual(1);

      // Verificar presencia en el catálogo global
      const enCatalogoGlobal = TODAS_LAS_DOTES_CANONICAS_DND55.find((d) => d.id === id);
      expect(enCatalogoGlobal).toBeDefined();
    }
  });

  describe("2. Versado en un Elemento", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_versado_elemento");

    it("es repetible y posee categoría selector_informativo", () => {
      expect(dote?.repetible).toBe(true);
      expect(dote?.categoriaMecanica).toBe("selector_informativo");
    });

    it("posee el selector de tipos elementales con las 5 opciones oficiales", () => {
      const sel = dote?.selectores?.find((s) => s.id === "selector_elemento_versado");
      expect(sel).toBeDefined();
      expect(sel?.tipo).toBe("unico");
      expect(sel?.maxSelecciones).toBe(1);

      const idsOpciones = sel?.opciones.map((o) => o.id);
      expect(idsOpciones).toEqual(["acido", "frio", "fuego", "relampago", "trueno"]);
    });
  });

  describe("3. Influencia Feérica", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_influencia_feerica");

    it("es consumible con 2 usos y recuperación en descanso largo", () => {
      expect(dote?.categoriaMecanica).toBe("consumible");
      expect(dote?.tieneUsosLimitados).toBe(true);
      expect(dote?.usosMaximos).toBe(2);
      expect(dote?.recuperacion).toBe("descanso_largo");
      expect(dote?.tipoAccion).toBe("accion_adicional");
    });

    it("concede de forma predefinida el conjuro Paso brumoso", () => {
      expect(dote?.conjurosOtorgados).toContain("h_paso-brumoso");
    });

    it("posee selector de conjuro nv1 en formato lista restringido a Adivinación y Encantamiento", () => {
      const selConjuro = dote?.selectores?.find(
        (s) => s.id === "selector_conjuro_nv1_influencia_feerica"
      );
      expect(selConjuro).toBeDefined();
      expect(selConjuro?.tipo).toBe("unico");
      expect(selConjuro?.visualizacion).toBe("lista");
      expect(selConjuro?.opciones.length).toBeGreaterThan(0);

      // Todas las opciones deben ser conjuros válidos de la escuela
      for (const op of selConjuro?.opciones || []) {
        const descNorm = op.descripcion.toLowerCase();
        expect(
          descNorm.includes("adivinación") ||
          descNorm.includes("adivinacion") ||
          descNorm.includes("encantamiento")
        ).toBe(true);
      }
    });

    it("posee selector de aptitud mágica entre Inteligencia, Sabiduría y Carisma", () => {
      const selAptitud = dote?.selectores?.find(
        (s) => s.id === "selector_aptitud_influencia_feerica"
      );
      expect(selAptitud).toBeDefined();
      const idsStats = selAptitud?.opciones.map((o) => o.id);
      expect(idsStats).toEqual(["inteligencia", "sabiduria", "carisma"]);
    });

    it("en el almacén preserva Paso brumoso al seleccionar un conjuro en el selector", () => {
      const rasgoFeerico = instanciarDoteComoRasgo("dote_influencia_feerica", {
        usosRestantes: 2
      });
      const pj = crearPersonajeBase({
        rasgos: [rasgoFeerico]
      });

      usarAlmacenDM.setState({
        personajes: [pj],
        idPersonajeActivo: pj.id
      });

      const conjuroElegidoId = dote!.selectores![0].opciones[0].id;

      // Actualizar selección del selector de conjuro
      usarAlmacenDM.getState().actualizarSeleccionRasgo(
        pj.id,
        dote!.id,
        "selector_conjuro_nv1_influencia_feerica",
        [conjuroElegidoId]
      );

      const pjActualizado = usarAlmacenDM.getState().personajes.find((p) => p.id === pj.id)!;
      const rasgoActualizado = pjActualizado.rasgos?.find((r) => r.id === dote!.id);

      expect(rasgoActualizado?.conjurosOtorgados).toContain("h_paso-brumoso");
      expect(rasgoActualizado?.conjurosOtorgados).toContain(conjuroElegidoId);
    });
  });

  describe("4. Apresador", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_apresador");

    it("es pasivo permanente y registra sus beneficios informativos oficiales", () => {
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.requisito).toContain("Fuerza o Destreza 13");
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("golpear y agarrar"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("ventaja"))).toBe(true);
    });
  });

  describe("5. Maestro en Armas Pesadas (+PB al daño con armas pesadas)", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_maestro_armas_pesadas");

    it("declara el efecto mecánico genérico bono_dano_ataque con objetivo arma_pesada y valor bono_competencia", () => {
      expect(dote?.efectos).toBeDefined();
      const ef = dote?.efectos?.[0];
      expect(ef?.tipo).toBe("bono_dano_ataque");
      expect(ef?.aplicaA).toBe("arma_pesada");
      expect(ef?.valor).toBe("bono_competencia");
    });

    it("aplica +PB (+2 a nivel 4) al daño cuando se evalúa un ataque con arma pesada", () => {
      const pj = crearPersonajeBase({
        nivel: 4,
        rasgos: [instanciarDoteComoRasgo("dote_maestro_armas_pesadas")]
      });

      const bonoPesada = obtenerBonoDanoAtaqueExtra(pj, {
        tipo: "arma",
        caracteristica: "fuerza",
        esCuerpoACuerpo: true,
        esDistancia: false,
        propiedades: ["Pesada", "A dos manos"],
        esPesada: true
      });

      // A nivel 4, el Bono de Competencia es +2
      expect(bonoPesada).toBe(2);
    });

    it("escala dinámicamente a +4 de daño a nivel 9 (+4 PB)", () => {
      const pj = crearPersonajeBase({
        nivel: 9,
        rasgos: [instanciarDoteComoRasgo("dote_maestro_armas_pesadas")]
      });

      const bonoPesada = obtenerBonoDanoAtaqueExtra(pj, {
        tipo: "arma",
        caracteristica: "fuerza",
        esCuerpoACuerpo: true,
        esDistancia: false,
        propiedades: ["Pesada"],
        esPesada: true
      });

      expect(bonoPesada).toBe(4);
    });

    it("NO aplica bono de daño si el arma carece de la propiedad pesada", () => {
      const pj = crearPersonajeBase({
        nivel: 4,
        rasgos: [instanciarDoteComoRasgo("dote_maestro_armas_pesadas")]
      });

      const bonoArmaNormal = obtenerBonoDanoAtaqueExtra(pj, {
        tipo: "arma",
        caracteristica: "fuerza",
        esCuerpoACuerpo: true,
        esDistancia: false,
        propiedades: ["Versátil"],
        esPesada: false
      });

      expect(bonoArmaNormal).toBe(0);
    });

    it("en el calculador de ataques de armas equipadas suma +PB en modDanoTotal con un espadón", () => {
      const espadonInstancia = {
        idInstancia: "arma-espadon-1",
        idObjeto: "espadon",
        nombre: "Espadón",
        tipo: "cuerpo_a_cuerpo",
        cantidad: 1,
        equipado: true,
        sintonizado: false,
        notas: "",
        pesoLb: 6,
        categoria: "armas"
      } as unknown as ObjetoInventario;

      const pjConEspadon = crearPersonajeBase({
        nivel: 4, // PB = 2
        caracteristicas: {
          fuerza: 16, // Mod +3
          destreza: 10,
          constitucion: 14,
          inteligencia: 10,
          sabiduria: 10,
          carisma: 10
        },
        inventario: [espadonInstancia],
        rasgos: [instanciarDoteComoRasgo("dote_maestro_armas_pesadas")]
      });

      const resultadoAtaque = calcularAtaqueArmaEquipada(espadonInstancia, {
        personajeActivo: pjConEspadon,
        statsCalculadas: {
          bonoCompetencia: 2,
          modificadores: { fuerza: 3, destreza: 0, constitucion: 2, inteligencia: 0, sabiduria: 0, carisma: 0 }
        } as unknown as EstadisticasCalculadasPersonaje,
        baseDatosObjetos: [],
        caracteristicasArmas: {},
        gruposArmasConsolidados: ["marciales"],
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      // modificadorDano = Mod Fuerza (3) + Bono PB Maestro en Armas Pesadas (2) = 5
      expect(resultadoAtaque.modificadorDano).toBe(5);
    });

    it("en el calculador de ataques NO suma +PB con una espada corta", () => {
      const espadaCortaInstancia = {
        idInstancia: "arma-espada-corta-1",
        idObjeto: "espada_corta",
        nombre: "Espada corta",
        tipo: "cuerpo_a_cuerpo",
        cantidad: 1,
        equipado: true,
        sintonizado: false,
        notas: "",
        pesoLb: 2,
        categoria: "armas"
      } as unknown as ObjetoInventario;

      const pjConEspadaCorta = crearPersonajeBase({
        nivel: 4,
        caracteristicas: {
          fuerza: 16, // Mod +3
          destreza: 14,
          constitucion: 14,
          inteligencia: 10,
          sabiduria: 10,
          carisma: 10
        },
        inventario: [espadaCortaInstancia],
        rasgos: [instanciarDoteComoRasgo("dote_maestro_armas_pesadas")]
      });

      const resultadoAtaque = calcularAtaqueArmaEquipada(espadaCortaInstancia, {
        personajeActivo: pjConEspadaCorta,
        statsCalculadas: {
          bonoCompetencia: 2,
          modificadores: { fuerza: 3, destreza: 2, constitucion: 2, inteligencia: 0, sabiduria: 0, carisma: 0 }
        } as unknown as EstadisticasCalculadasPersonaje,
        baseDatosObjetos: [],
        caracteristicasArmas: {},
        gruposArmasConsolidados: ["marciales"],
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      // modificadorDano = Mod Fuerza (3) + 0 = 3
      expect(resultadoAtaque.modificadorDano).toBe(3);
    });
  });

  describe("6. Muy Acorazado", () => {
    it("concede competencia con armaduras pesadas", () => {
      const pj = crearPersonajeBase({
        rasgos: [instanciarDoteComoRasgo("dote_muy_acorazado")]
      });

      const comps = obtenerCompetenciasExtraRasgos(pj);
      expect(comps.armadurasGrupos).toContain("pesadas");
    });
  });

  describe("7. Maestro en Armaduras Pesadas", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_maestro_armaduras_pesadas");

    it("es pasivo permanente y registra reducción de daño -PB de forma informativa", () => {
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.requisito).toContain("entrenamiento con armaduras pesadas");
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("reducción de daño"))).toBe(true);
    });
  });

  describe("8. Líder Inspirador", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_lider_inspirador");

    it("es pasivo permanente/especial y describe la interpretación fortalecedora", () => {
      expect(dote?.requisito).toContain("Sabiduría o Carisma 13");
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("interpretación fortalecedora"))).toBe(true);
    });
  });

  describe("9. Mente Aguda", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_mente_aguda");

    it("es informativo y registra sabiduría popular y estudio rápido como acción adicional", () => {
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.tipoAccion).toBe("accion_adicional");
      expect(dote?.requisito).toContain("Inteligencia 13");
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("sabiduría popular"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("estudio rápido"))).toBe(true);
    });
  });

  describe("10. Ligeramente Acorazado", () => {
    it("concede competencias con armaduras ligeras y escudos", () => {
      const pj = crearPersonajeBase({
        rasgos: [instanciarDoteComoRasgo("dote_ligeramente_acorazado")]
      });

      const comps = obtenerCompetenciasExtraRasgos(pj);
      expect(comps.armadurasGrupos).toContain("ligeras");
      expect(comps.armadurasGrupos).toContain("escudos");
    });
  });

  describe("11. Azote de Magos", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_azote_magos");

    it("es consumible con 1 uso, tipo acción reacción y recuperación en descanso corto", () => {
      expect(dote?.categoriaMecanica).toBe("consumible");
      expect(dote?.tieneUsosLimitados).toBe(true);
      expect(dote?.usosMaximos).toBe(1);
      expect(dote?.recuperacion).toBe("descanso_corto");
      expect(dote?.tipoAccion).toBe("reaccion");
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("mente robusta"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("anticoncentración"))).toBe(true);
    });

    it("recupera su uso tanto en descanso corto como en descanso largo", () => {
      const rasgoGastado = instanciarDoteComoRasgo("dote_azote_magos", {
        usosRestantes: 0
      });

      const pjGastado = crearPersonajeBase({
        rasgos: [rasgoGastado]
      });

      // 1. Descanso Corto
      const resCorto = ejecutarDescansoCorto(pjGastado, 0);
      const rasgoTrasCorto = resCorto.personajeActualizado.rasgos?.find((r) => r.id === dote!.id);
      expect(rasgoTrasCorto?.usosRestantes).toBe(1);

      // 2. Descanso Largo
      const resLargo = ejecutarDescansoLargo(pjGastado);
      const rasgoTrasLargo = resLargo.personajeActualizado.rasgos?.find((r) => r.id === dote!.id);
      expect(rasgoTrasLargo?.usosRestantes).toBe(1);
    });
  });
});
