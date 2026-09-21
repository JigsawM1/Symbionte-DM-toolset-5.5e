import { describe, it, expect } from "vitest";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import {
  calcularBonoIniciativaRasgos,
  calcularBonoHPMaximoRasgos,
  evaluarAtaqueDesarmadoEspecial,
  obtenerCompetenciasExtraRasgos,
  obtenerConjurosOtorgadosPorRasgos
} from "./evaluadorEfectosRasgos";
import { calcularAtaqueDesarmado } from "./calculadorAtaqueDesarmado";
import { calcularAtaqueImprovisado } from "./calculadorAtaquesArmas";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import {
  DOTES_ORIGEN_DND55,
  DOTES_CANONICAS_DND55
} from "@/constantes/rasgosDND55";

function crearPersonajeBase(parcial: Partial<PersonajeJugador> = {}): PersonajeJugador {
  return {
    id: "pj-test-dotes",
    nombre: "Héroe de Prueba",
    nivel: 1,
    clase: "Guerrero",
    clases: [{ id: "c1", nombre: "Guerrero", nivel: 1 }],
    caracteristicas: {
      fuerza: 16,
      destreza: 14,
      constitucion: 14,
      inteligencia: 10,
      sabiduria: 12,
      carisma: 10
    },
    hpMaximoBase: 12,
    hpMaximo: 12,
    hpActual: 12,
    iniciativaBono: 0,
    rasgos: [],
    inventario: [],
    condicionesActivas: [],
    efectosActivos: [],
    trucosConocidosIds: [],
    conjurosConocidosIds: [],
    conjurosSiemprePreparadosIds: [],
    ...parcial
  } as PersonajeJugador;
}

function crearRasgoTest(
  parcial: Partial<RasgoPersonaje> & Pick<RasgoPersonaje, "id" | "nombre">
): RasgoPersonaje {
  return {
    descripcion: "",
    origen: "dote",
    fuente: "PHB 2024",
    tipoAccion: "pasivo",
    tieneUsosLimitados: false,
    recuperacion: "ninguno",
    personalizado: false,
    activo: true,
    notas: "",
    ...parcial
  } as RasgoPersonaje;
}

describe("Dotes de Origen Canónicas (D&D 5.5e)", () => {
  describe("1. Catálogo Oficial de Dotes de Origen", () => {
    it("incluye las 12 dotes de origen requeridas", () => {
      const idsRequeridos = [
        "dote_alerta",
        "dote_fabricante",
        "dote_sanador",
        "dote_iniciado_magia_clerigo",
        "dote_iniciado_magia_druida",
        "dote_iniciado_magia_mago",
        "dote_musico",
        "dote_afortunado",
        "dote_atacante_salvaje",
        "dote_habilidoso",
        "dote_duro",
        "dote_maton_taberna"
      ];

      for (const id of idsRequeridos) {
        const dote = DOTES_ORIGEN_DND55.find((d) => d.id === id);
        expect(dote, `La dote con ID ${id} debe existir en DOTES_ORIGEN_DND55`).toBeDefined();
        expect(dote?.categoria).toBe("origen");
      }
    });

    it("reexporta las dotes de origen en DOTES_CANONICAS_DND55", () => {
      const alerta = DOTES_CANONICAS_DND55.find((d) => d.id === "dote_alerta");
      const maton = DOTES_CANONICAS_DND55.find((d) => d.id === "dote_maton_taberna");
      const iniciadoClerigo = DOTES_CANONICAS_DND55.find((d) => d.id === "dote_iniciado_magia_clerigo");

      expect(alerta).toBeDefined();
      expect(maton).toBeDefined();
      expect(iniciadoClerigo).toBeDefined();
    });
  });

  describe("2. Dote Alerta (+PB a la Iniciativa)", () => {
    const plantillaAlerta = DOTES_ORIGEN_DND55.find((d) => d.id === "dote_alerta")!;

    it("suma +2 de iniciativa a nivel 1 (PB = +2)", () => {
      const rasgoAlerta = crearRasgoTest({
        id: "rasgo_alerta",
        nombre: plantillaAlerta.nombre,
        descripcion: plantillaAlerta.descripcion,
        fuente: plantillaAlerta.fuente || "PHB 2024",
        tipoAccion: plantillaAlerta.tipoAccion || "pasivo",
        activo: true,
        efectos: plantillaAlerta.efectos
      });

      const pj = crearPersonajeBase({ nivel: 1, rasgos: [rasgoAlerta] });
      const bonoIniciativa = calcularBonoIniciativaRasgos(pj);
      expect(bonoIniciativa).toBe(2);
    });

    it("escala dinámicamente según el nivel del personaje (+3 a nivel 5, +4 a nivel 9)", () => {
      const rasgoAlerta = crearRasgoTest({
        id: "rasgo_alerta",
        nombre: plantillaAlerta.nombre,
        descripcion: plantillaAlerta.descripcion,
        efectos: plantillaAlerta.efectos
      });

      const pjNivel5 = crearPersonajeBase({ nivel: 5, rasgos: [rasgoAlerta] });
      expect(calcularBonoIniciativaRasgos(pjNivel5)).toBe(3);

      const pjNivel9 = crearPersonajeBase({ nivel: 9, rasgos: [rasgoAlerta] });
      expect(calcularBonoIniciativaRasgos(pjNivel9)).toBe(4);
    });

    it("no aporta bono a iniciativa si el rasgo está desactivado", () => {
      const rasgoAlertaInactivo = crearRasgoTest({
        id: "rasgo_alerta",
        nombre: plantillaAlerta.nombre,
        descripcion: plantillaAlerta.descripcion,
        activo: false,
        efectos: plantillaAlerta.efectos
      });

      const pj = crearPersonajeBase({ nivel: 5, rasgos: [rasgoAlertaInactivo] });
      expect(calcularBonoIniciativaRasgos(pj)).toBe(0);
    });
  });

  describe("3. Dote Duro (+2 HP Máx por Nivel)", () => {
    const plantillaDuro = DOTES_ORIGEN_DND55.find((d) => d.id === "dote_duro")!;

    it("suma 2 HP por nivel a los puntos de golpe máximos", () => {
      const rasgoDuro = crearRasgoTest({
        id: "rasgo_duro",
        nombre: plantillaDuro.nombre,
        descripcion: plantillaDuro.descripcion,
        efectos: plantillaDuro.efectos
      });

      const pjNivel1 = crearPersonajeBase({ nivel: 1, rasgos: [rasgoDuro] });
      expect(calcularBonoHPMaximoRasgos(pjNivel1)).toBe(2);

      const pjNivel5 = crearPersonajeBase({ nivel: 5, rasgos: [rasgoDuro] });
      expect(calcularBonoHPMaximoRasgos(pjNivel5)).toBe(10);

      const pjNivel10 = crearPersonajeBase({ nivel: 10, rasgos: [rasgoDuro] });
      expect(calcularBonoHPMaximoRasgos(pjNivel10)).toBe(20);
    });

    it("convive correctamente con Aguante Enano (+1 HP/nivel) sumando +3 HP por nivel en total", () => {
      const rasgoDuro = crearRasgoTest({
        id: "rasgo_duro",
        nombre: "Duro",
        efectos: [{ tipo: "modificador_hp_maximo", objetivo: "hp_maximo", valor: "2*nivel" }]
      });

      const rasgoEnano = crearRasgoTest({
        id: "rasgo_aguante_enano",
        nombre: "Aguante enano",
        origen: "especie",
        efectos: [{ tipo: "modificador_hp_maximo", objetivo: "hp_maximo", valor: "1*nivel" }]
      });

      const pj = crearPersonajeBase({ nivel: 4, rasgos: [rasgoDuro, rasgoEnano] });
      // 2*4 + 1*4 = 8 + 4 = 12
      expect(calcularBonoHPMaximoRasgos(pj)).toBe(12);
    });
  });

  describe("4. Dote Matón de Taberna (Ataque Desarmado 1d4 + FUE y Armas Improvisadas)", () => {
    const plantillaMaton = DOTES_ORIGEN_DND55.find((d) => d.id === "dote_maton_taberna")!;

    it("aplica 1d4 + FUE al ataque sin armas y sugiere Fuerza", () => {
      const rasgoMaton = crearRasgoTest({
        id: "rasgo_maton",
        nombre: plantillaMaton.nombre,
        descripcion: plantillaMaton.descripcion,
        efectos: plantillaMaton.efectos
      });

      const pj = crearPersonajeBase({
        caracteristicas: { fuerza: 16, destreza: 12, constitucion: 14, inteligencia: 10, sabiduria: 10, carisma: 10 },
        rasgos: [rasgoMaton]
      });

      const evaluacion = evaluarAtaqueDesarmadoEspecial(pj);
      expect(evaluacion.aplica).toBe(true);
      expect(evaluacion.dadoDanoBase).toBe("1d4");
      expect(evaluacion.caracteristicaSugerida).toBe("fuerza");
      expect(evaluacion.propiedades).not.toContain("Sutil");
    });

    it("genera el ataque desarmado calculado con 1d4 y modificador de Fuerza", () => {
      const rasgoMaton = crearRasgoTest({
        id: "rasgo_maton",
        nombre: plantillaMaton.nombre,
        descripcion: plantillaMaton.descripcion,
        efectos: plantillaMaton.efectos
      });

      const pj = crearPersonajeBase({
        caracteristicas: { fuerza: 16, destreza: 12, constitucion: 14, inteligencia: 10, sabiduria: 10, carisma: 10 },
        rasgos: [rasgoMaton]
      });

      const stats = {
        bonoCompetencia: 2,
        modificadores: { fuerza: 3, destreza: 1, constitucion: 2, inteligencia: 0, sabiduria: 0, carisma: 0 }
      } as unknown as EstadisticasCalculadasPersonaje;

      const ataque = calcularAtaqueDesarmado({
        personajeActivo: pj,
        statsCalculadas: stats,
        caracteristicasArmas: {},
        gruposArmasConsolidados: ["sencillas"],
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      expect(ataque.dadoDanoBase).toBe("1d4");
      expect(ataque.dadoDano).toBe("1d4+3");
      expect(ataque.caracteristicaUsada).toBe("fuerza");
      expect(ataque.esSutil).toBe(false);
    });

    it("cede precedencia ante ataques con mayor peso de modificación (Daño Bárdico 1d6-1d12)", () => {
      const rasgoMaton = crearRasgoTest({
        id: "rasgo_maton",
        nombre: "Matón de Taberna",
        efectos: plantillaMaton.efectos
      });

      const rasgoDanza = crearRasgoTest({
        id: "rasgo_virtuoso_danza",
        nombre: "Virtuoso de la danza",
        origen: "subclase",
        efectos: [
          {
            tipo: "ataque_desarmado",
            objetivo: "destreza",
            valor: "dado_inspiracion",
            condicion: "sin_armadura_ni_escudo",
            descripcion: "Daño bárdico"
          }
        ]
      });

      const pjBardo = crearPersonajeBase({
        clase: "Bardo",
        nivel: 5,
        caracteristicas: { fuerza: 14, destreza: 18, constitucion: 12, inteligencia: 10, sabiduria: 12, carisma: 16 },
        rasgos: [rasgoMaton, rasgoDanza]
      });

      const evaluacion = evaluarAtaqueDesarmadoEspecial(pjBardo);
      expect(evaluacion.aplica).toBe(true);
      // Daño bárdico a nivel 5 es 1d8, con mayor peso que 1d4
      expect(evaluacion.dadoDanoBase).toBe("1d8");
      expect(evaluacion.nombreAtaque).toBe("Daño bárdico");
      expect(evaluacion.caracteristicaSugerida).toBe("destreza");
    });

    it("otorga competencia con armas improvisadas vía obtenerCompetenciasExtraRasgos", () => {
      const rasgoMaton = crearRasgoTest({
        id: "rasgo_maton",
        nombre: plantillaMaton.nombre,
        descripcion: plantillaMaton.descripcion,
        efectos: plantillaMaton.efectos
      });

      const pj = crearPersonajeBase({ rasgos: [rasgoMaton] });
      const compExtra = obtenerCompetenciasExtraRasgos(pj);
      expect(compExtra.armasImprovisadas).toBe(true);

      const stats = {
        bonoCompetencia: 2,
        modificadores: { fuerza: 3, destreza: 1, constitucion: 2, inteligencia: 0, sabiduria: 0, carisma: 0 }
      } as unknown as EstadisticasCalculadasPersonaje;

      const ataqueImprovisado = calcularAtaqueImprovisado({
        personajeActivo: pj,
        statsCalculadas: stats,
        caracteristicasArmas: {},
        gruposArmasConsolidados: [],
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      expect(ataqueImprovisado.esCompetenteConArma).toBe(true);
      // Bono ataque = 3 (FUE) + 2 (PB) = 5
      expect(ataqueImprovisado.bonoAtaque).toBe(5);
    });
  });

  describe("5. Dote Afortunado (Recurso Consumible)", () => {
    const plantillaAfortunado = DOTES_ORIGEN_DND55.find((d) => d.id === "dote_afortunado")!;

    it("está configurada como recurso consumible con recuperación en descanso largo y escala por PB", () => {
      expect(plantillaAfortunado.tieneUsosLimitados).toBe(true);
      expect(plantillaAfortunado.recuperacion).toBe("descanso_largo");
      expect(plantillaAfortunado.formulaEscalado).toBe("bono_competencia");
      expect(plantillaAfortunado.categoriaMecanica).toBe("consumible");
    });
  });

  describe("6. Dotes Iniciado en la Magia (Clérigo, Druida, Mago)", () => {
    it("Iniciado en la Magia (Clérigo) incluye 2 selectores independientes de trucos y 1 de conjuro de Clérigo", () => {
      const dote = DOTES_ORIGEN_DND55.find((d) => d.id === "dote_iniciado_magia_clerigo")!;
      expect(dote).toBeDefined();
      expect(dote.selectores).toBeDefined();

      const selTruco1 = dote.selectores?.find((s) => s.id === "selector_truco_1_iniciado_clerigo");
      const selTruco2 = dote.selectores?.find((s) => s.id === "selector_truco_2_iniciado_clerigo");
      const selConjuro = dote.selectores?.find((s) => s.id === "selector_conjuro_nv1_iniciado_clerigo");
      const selAptitud = dote.selectores?.find((s) => s.id === "selector_aptitud_iniciado_clerigo");

      expect(selTruco1?.tipo).toBe("unico");
      expect(selTruco1?.maxSelecciones).toBe(1);
      expect(selTruco1?.opciones.length).toBeGreaterThanOrEqual(5);

      expect(selTruco2?.tipo).toBe("unico");
      expect(selTruco2?.maxSelecciones).toBe(1);
      expect(selTruco2?.opciones.length).toBeGreaterThanOrEqual(5);

      expect(selConjuro?.tipo).toBe("unico");
      expect(selConjuro?.visualizacion).toBe("lista");
      expect(selConjuro?.maxSelecciones).toBe(1);
      expect(selConjuro?.opciones.length).toBeGreaterThanOrEqual(10);

      expect(selAptitud?.opciones.map((o) => o.id)).toEqual(["inteligencia", "sabiduria", "carisma"]);
    });

    it("Iniciado en la Magia (Druida) incluye 2 selectores de trucos y 1 conjuro de Druida", () => {
      const dote = DOTES_ORIGEN_DND55.find((d) => d.id === "dote_iniciado_magia_druida")!;
      expect(dote).toBeDefined();

      const selTruco1 = dote.selectores?.find((s) => s.id === "selector_truco_1_iniciado_druida");
      const selTruco2 = dote.selectores?.find((s) => s.id === "selector_truco_2_iniciado_druida");
      const selConjuro = dote.selectores?.find((s) => s.id === "selector_conjuro_nv1_iniciado_druida");

      expect(selTruco1?.maxSelecciones).toBe(1);
      expect(selTruco2?.maxSelecciones).toBe(1);
      expect(selConjuro?.maxSelecciones).toBe(1);
      expect(selConjuro?.visualizacion).toBe("lista");
    });

    it("Iniciado en la Magia (Mago) incluye 2 selectores de trucos y 1 conjuro de Mago", () => {
      const dote = DOTES_ORIGEN_DND55.find((d) => d.id === "dote_iniciado_magia_mago")!;
      expect(dote).toBeDefined();

      const selTruco1 = dote.selectores?.find((s) => s.id === "selector_truco_1_iniciado_mago");
      const selTruco2 = dote.selectores?.find((s) => s.id === "selector_truco_2_iniciado_mago");
      const selConjuro = dote.selectores?.find((s) => s.id === "selector_conjuro_nv1_iniciado_mago");

      expect(selTruco1?.maxSelecciones).toBe(1);
      expect(selTruco2?.maxSelecciones).toBe(1);
      expect(selConjuro?.maxSelecciones).toBe(1);
      expect(selConjuro?.visualizacion).toBe("lista");
    });

    it("los conjuros y trucos elegidos en los selectores son detectados por obtenerConjurosOtorgadosPorRasgos", () => {
      const rasgoIniciado = crearRasgoTest({
        id: "rasgo_iniciado_clerigo",
        nombre: "Iniciado en la Magia (Clérigo)",
        selectores: [
          {
            id: "selector_truco_1_iniciado_clerigo",
            tipo: "unico",
            etiqueta: "Primer Truco de Clérigo",
            maxSelecciones: 1,
            opciones: [],
            valorActual: ["guia"]
          },
          {
            id: "selector_truco_2_iniciado_clerigo",
            tipo: "unico",
            etiqueta: "Segundo Truco de Clérigo",
            maxSelecciones: 1,
            opciones: [],
            valorActual: ["llama_sagrada"]
          },
          {
            id: "selector_conjuro_nv1_iniciado_clerigo",
            tipo: "unico",
            etiqueta: "1 Conjuro de Nivel 1 de Clérigo",
            maxSelecciones: 1,
            opciones: [],
            valorActual: ["bendicion"]
          }
        ]
      });

      const pj = crearPersonajeBase({ rasgos: [rasgoIniciado] });
      const conjurosOtorgados = obtenerConjurosOtorgadosPorRasgos(pj);

      expect(conjurosOtorgados).toContain("guia");
      expect(conjurosOtorgados).toContain("llama_sagrada");
      expect(conjurosOtorgados).toContain("bendicion");
    });

    it("Iniciado en la Magia declara 1 uso limitado por descanso largo para el lanzamiento gratuito", () => {
      const dote = DOTES_ORIGEN_DND55.find((d) => d.id === "dote_iniciado_magia_clerigo")!;
      expect(dote.tieneUsosLimitados).toBe(true);
      expect(dote.usosMaximos).toBe(1);
      expect(dote.recuperacion).toBe("descanso_largo");
      expect(dote.categoriaMecanica).toBe("consumible");
    });
  });

  describe("7. Escalado Dinámico de Usos por Bono de Competencia (+PB)", () => {
    it("resuelve dinámicamente los usos según el nivel del personaje para rasgos con formulaEscalado bono_competencia", () => {
      const calcularUsosPB = (nivel: number): number => {
        return Math.floor((Math.max(1, nivel) - 1) / 4) + 2;
      };

      expect(calcularUsosPB(1)).toBe(2);
      expect(calcularUsosPB(4)).toBe(2);
      expect(calcularUsosPB(5)).toBe(3);
      expect(calcularUsosPB(8)).toBe(3);
      expect(calcularUsosPB(9)).toBe(4);
      expect(calcularUsosPB(12)).toBe(4);
      expect(calcularUsosPB(13)).toBe(5);
      expect(calcularUsosPB(16)).toBe(5);
      expect(calcularUsosPB(17)).toBe(6);
      expect(calcularUsosPB(20)).toBe(6);
    });
  });

  describe("8. Integración de Dote desde Lecciones de los Primeros en la Ficha", () => {
    it("al agregar Duro como rasgo de dote, suma inmediatamente +2 HP por nivel a la vida máxima", () => {
      const doteDuro = DOTES_ORIGEN_DND55.find((d) => d.id === "dote_duro")!;
      const rasgoDoteDuro = crearRasgoTest({
        id: `dote_invocacion_${doteDuro.id}`,
        nombre: doteDuro.nombre,
        descripcion: doteDuro.descripcion,
        origen: "dote",
        fuente: "Lecciones de los Primeros (Brujo)",
        efectos: doteDuro.efectos
      });

      const pjNivel1 = crearPersonajeBase({ nivel: 1, rasgos: [rasgoDoteDuro] });
      expect(calcularBonoHPMaximoRasgos(pjNivel1)).toBe(2);

      const pjNivel5 = crearPersonajeBase({ nivel: 5, rasgos: [rasgoDoteDuro] });
      expect(calcularBonoHPMaximoRasgos(pjNivel5)).toBe(10);

      const pjNivel10 = crearPersonajeBase({ nivel: 10, rasgos: [rasgoDoteDuro] });
      expect(calcularBonoHPMaximoRasgos(pjNivel10)).toBe(20);
    });

    it("al agregar Alerta como rasgo de dote, suma inmediatamente +PB a la tirada de iniciativa", () => {
      const doteAlerta = DOTES_ORIGEN_DND55.find((d) => d.id === "dote_alerta")!;
      const rasgoDoteAlerta = crearRasgoTest({
        id: `dote_invocacion_${doteAlerta.id}`,
        nombre: doteAlerta.nombre,
        descripcion: doteAlerta.descripcion,
        origen: "dote",
        fuente: "Lecciones de los Primeros (Brujo)",
        efectos: doteAlerta.efectos
      });

      const pjNivel1 = crearPersonajeBase({ nivel: 1, rasgos: [rasgoDoteAlerta] });
      expect(calcularBonoIniciativaRasgos(pjNivel1)).toBe(2);

      const pjNivel5 = crearPersonajeBase({ nivel: 5, rasgos: [rasgoDoteAlerta] });
      expect(calcularBonoIniciativaRasgos(pjNivel5)).toBe(3);

      const pjNivel9 = crearPersonajeBase({ nivel: 9, rasgos: [rasgoDoteAlerta] });
      expect(calcularBonoIniciativaRasgos(pjNivel9)).toBe(4);
    });
  });
});
