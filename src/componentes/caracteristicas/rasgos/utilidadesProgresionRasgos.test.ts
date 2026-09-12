import { describe, it, expect } from "vitest";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { obtenerNivelEfectivoParaRasgo } from "./utilidadesProgresionRasgos";

describe("obtenerNivelEfectivoParaRasgo - Nivel contextual de clase vs nivel general (Multiclase)", () => {
  const personajeMulticlaseBardoBarbaro: PersonajeJugador = {
    id: "pj_multiclase_test",
    nombre: "Bardo Bárbaro",
    jugador: "Tester",
    clase: "Bardo",
    subclase: "Colegio del Saber",
    clases: [
      { nombre: "Bardo", subclase: "Colegio del Saber", nivel: 5 },
      { nombre: "Bárbaro", subclase: "Berserker", nivel: 15 }
    ],
    nivel: 20, // Nivel total general del personaje
    especie: "Humano",
    subespecie: "",
    tamano: "Mediano",
    tipoCriatura: "Humanoide",
    trasfondo: "Personalizado",
    alineacion: "Neutral",
    experiencia: 355000,
    avatarUrl: "",
    idMiniaturaTS: null,
    inspiracion: false,
    caracteristicas: { fuerza: 18, destreza: 14, constitucion: 16, inteligencia: 10, sabiduria: 12, carisma: 16 },
    overridesFijos: { fuerza: null, destreza: null, constitucion: null, inteligencia: null, sabiduria: null, carisma: null },
    personalizacionesCaracteristicas: {},
    competenciasSalvacion: { fuerza: true, destreza: false, constitucion: true, inteligencia: false, sabiduria: false, carisma: false },
    gradosHabilidades: {
      acrobacias: "ninguna",
      manejoAnimales: "ninguna",
      arcanos: "ninguna",
      atletismo: "competente",
      engaño: "ninguna",
      historia: "ninguna",
      perspicacia: "ninguna",
      intimidacion: "competente",
      investigacion: "ninguna",
      medicina: "ninguna",
      naturaleza: "ninguna",
      percepcion: "competente",
      interpretacion: "competente",
      persuasion: "competente",
      religion: "ninguna",
      juegoManos: "ninguna",
      sigilo: "ninguna",
      supervivencia: "ninguna"
    },
    personalizacionesHabilidades: {},
    hpMaximoBase: 160,
    hpMaximo: 160,
    hpActual: 160,
    hpTemporal: 0,
    tipoDadoGolpe: "d12",
    dadosGolpeTotal: 20,
    dadosGolpeRestantes: 20,
    salvacionesMuerte: { exitos: 0, fallos: 0 },
    cansancio: 0,
    condicionesActivas: [],
    efectosActivos: [],
    ca: 15,
    caNotas: "",
    iniciativaBono: 2,
    velocidad: "30 pies",
    sentidos: "",
    competenciasArmas: "",
    competenciasArmasGrupos: [],
    competenciasArmasLista: [],
    competenciasArmaduras: "",
    competenciasArmadurasGrupos: [],
    competenciasArmadurasLista: [],
    idiomas: "Común",
    idiomasLista: ["Común"],
    herramientas: "",
    herramientasLista: [],
    esLanzador: true,
    clasesLanzadoras: [],
    concentracionActiva: null,
    trucosConocidosIds: [],
    conjurosConocidosIds: [],
    conjurosPreparadosIds: [],
    conjurosSiemprePreparadosIds: [],
    espaciosConjuroMaximos: {},
    espaciosConjuroGastados: {},
    puntosConjuroMaximos: 0,
    puntosConjuroGastados: 0,
    nivelConjuroMaximo: 0,
    espaciosPactoMaximos: 0,
    espaciosPactoGastados: 0,
    nivelEspacioPacto: 0,
    arcanoMisticoIds: [],
    arcanoMisticoGastados: [],
    puntosHechiceriaMaximos: 0,
    puntosHechiceriaActuales: 0,
    overrideEspaciosConjuro: null,
    overridePuntosConjuro: null,
    inventario: [],
    bolsaMonedas: { pc: 0, pp: 0, pe: 0, po: 0, ppt: 0 },
    rasgos: [],
    dotes: []
  };

  it("resuelve el nivel de clase propio (5) para rasgos de Bardo en multiclase 5/15", () => {
    const rasgoBardo: RasgoPersonaje = {
      id: "rasgo_cls_bardo_inspiracion_bardica",
      nombre: "Inspiración bárdica",
      descripcion: "Puedes recurrir a tus palabras...",
      origen: "clase",
      fuente: "Bardo (Nivel 1)",
      tipoAccion: "accion_adicional",
      nivelRequerido: 1,
      tieneUsosLimitados: true,
      usosMaximos: 4,
      usosRestantes: 4,
      recuperacion: "descanso_corto",
      formulaDados: "1d8",
      personalizado: false,
      activo: true,
      notas: "",
      tablaProgresion: {
        columnas: ["Nivel", "Descripción"],
        filas: [
          { nivel: 1, valores: ["Dado de bardo: 1d6"] },
          { nivel: 5, valores: ["Dado de bardo: 1d8"] },
          { nivel: 10, valores: ["Dado de bardo: 1d10"] },
          { nivel: 15, valores: ["Dado de bardo: 1d12"] }
        ],
        notaPie: "Cada nivel reemplaza al anterior"
      }
    };

    const nivelEfectivo = obtenerNivelEfectivoParaRasgo(personajeMulticlaseBardoBarbaro, rasgoBardo);
    expect(nivelEfectivo).toBe(5);
  });

  it("resuelve el nivel de clase propio (15) para rasgos de Bárbaro en multiclase 5/15", () => {
    const rasgoBarbaro: RasgoPersonaje = {
      id: "rasgo_cls_barbaro_furia",
      nombre: "Furia",
      descripcion: "Cuando haces un ataque usando Fuerza...",
      origen: "clase",
      fuente: "Bárbaro (Nivel 1)",
      tipoAccion: "accion_adicional",
      nivelRequerido: 1,
      tieneUsosLimitados: true,
      usosMaximos: 5,
      usosRestantes: 5,
      recuperacion: "descanso_largo",
      personalizado: false,
      activo: false,
      esActivable: true,
      notas: "",
      tablaProgresion: {
        columnas: ["Nivel", "Descripción"],
        filas: [
          { nivel: 1, valores: ["2 veces/día, +2 daño"] },
          { nivel: 3, valores: ["3 veces/día, +2 daño"] },
          { nivel: 6, valores: ["4 veces/día, +2 daño"] },
          { nivel: 9, valores: ["4 veces/día, +3 daño"] },
          { nivel: 12, valores: ["5 veces/día, +3 daño"] },
          { nivel: 16, valores: ["5 veces/día, +4 daño"] },
          { nivel: 17, valores: ["6 veces/día, +4 daño"] },
          { nivel: 20, valores: ["6 veces/día, +4 daño"] }
        ],
        notaPie: "Cada nivel reemplaza al anterior"
      }
    };

    const nivelEfectivo = obtenerNivelEfectivoParaRasgo(personajeMulticlaseBardoBarbaro, rasgoBarbaro);
    expect(nivelEfectivo).toBe(15);
  });

  it("resuelve el nivel de subclase de bárbaro (15) para rasgos de subclase Berserker", () => {
    const rasgoSubclase: RasgoPersonaje = {
      id: "rasgo_sub_berserker_frenesi",
      nombre: "Frenesí",
      descripcion: "Si entras en furia...",
      origen: "subclase",
      fuente: "Bárbaro (Berserker - Nivel 3)",
      tipoAccion: "pasivo",
      nivelRequerido: 3,
      tieneUsosLimitados: false,
      recuperacion: "ninguno",
      personalizado: false,
      activo: true,
      notas: ""
    };

    const nivelEfectivo = obtenerNivelEfectivoParaRasgo(personajeMulticlaseBardoBarbaro, rasgoSubclase);
    expect(nivelEfectivo).toBe(15);
  });

  it("resuelve el nivel general (20) para rasgos raciales / especie", () => {
    const rasgoEspecie: RasgoPersonaje = {
      id: "rasgo_esp_humano_versatilidad",
      nombre: "Versatilidad habilidosa",
      descripcion: "Obtienes competencia...",
      origen: "especie",
      fuente: "Especie: Humano",
      tipoAccion: "pasivo",
      tieneUsosLimitados: false,
      recuperacion: "ninguno",
      personalizado: false,
      activo: true,
      notas: ""
    };

    const nivelEfectivo = obtenerNivelEfectivoParaRasgo(personajeMulticlaseBardoBarbaro, rasgoEspecie);
    expect(nivelEfectivo).toBe(20);
  });

  it("resuelve el nivel general (20) para dotes", () => {
    const rasgoDote: RasgoPersonaje = {
      id: "dote_alerta",
      nombre: "Alerta",
      descripcion: "Ganas +PB a la iniciativa...",
      origen: "dote",
      fuente: "PHB 2024",
      tipoAccion: "pasivo",
      tieneUsosLimitados: false,
      recuperacion: "ninguno",
      personalizado: false,
      activo: true,
      notas: ""
    };

    const nivelEfectivo = obtenerNivelEfectivoParaRasgo(personajeMulticlaseBardoBarbaro, rasgoDote);
    expect(nivelEfectivo).toBe(20);
  });

  it("resuelve el nivel de la única clase en personajes monoclase", () => {
    const personajeMonoclase = {
      ...personajeMulticlaseBardoBarbaro,
      clase: "Mago",
      subclase: "Evocación",
      clases: [{ nombre: "Mago", subclase: "Evocación", nivel: 8 }],
      nivel: 8
    };

    const rasgoMago: RasgoPersonaje = {
      id: "rasgo_cls_mago_recuperacion_arcana",
      nombre: "Recuperación arcana",
      descripcion: "Has aprendido a recuperar energía...",
      origen: "clase",
      fuente: "Mago (Nivel 1)",
      tipoAccion: "especial",
      nivelRequerido: 1,
      tieneUsosLimitados: true,
      usosMaximos: 1,
      usosRestantes: 1,
      recuperacion: "descanso_largo",
      personalizado: false,
      activo: true,
      notas: ""
    };

    const nivelEfectivo = obtenerNivelEfectivoParaRasgo(personajeMonoclase, rasgoMago);
    expect(nivelEfectivo).toBe(8);
  });
});
