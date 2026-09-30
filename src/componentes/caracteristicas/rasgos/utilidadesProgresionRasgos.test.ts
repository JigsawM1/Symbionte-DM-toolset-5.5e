import { describe, it, expect } from "vitest";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import {
  obtenerNivelEfectivoParaRasgo,
  resolverDotesDesdeInvocaciones,
  agruparRasgosJerarquicos,
  esRasgoCanalizarDivinidad,
  resolverRecursosPadre
} from "./utilidadesProgresionRasgos";

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

describe("resolverDotesDesdeInvocaciones - Proyección de dotes en el bloque de dotes", () => {
  it("extrae la dote canónica seleccionada en Lecciones de los Primeros y genera un rasgo con origen 'dote'", () => {
    const rasgoInvocaciones: RasgoPersonaje = {
      id: "rasgo_cls_brujo_invocaciones_sobrenaturales",
      nombre: "Invocaciones sobrenaturales",
      descripcion: "En tus estudios sobre el saber arcano...",
      origen: "clase",
      fuente: "Brujo (Nivel 1)",
      tipoAccion: "pasivo",
      tieneUsosLimitados: false,
      recuperacion: "ninguno",
      personalizado: false,
      activo: true,
      notas: "",
      selectores: [
        {
          id: "selector_invocaciones_brujo",
          tipo: "multiple",
          etiqueta: "Invocaciones Sobrenaturales",
          maxSelecciones: 2,
          opciones: [],
          valorActual: ["lecciones_de_los_primeros:dote_alerta"]
        }
      ]
    };

    const dotesExtraidas = resolverDotesDesdeInvocaciones([rasgoInvocaciones]);
    expect(dotesExtraidas).toHaveLength(1);
    expect(dotesExtraidas[0].nombre).toBe("Alerta");
    expect(dotesExtraidas[0].origen).toBe("dote");
    expect(dotesExtraidas[0].fuente).toContain("Lecciones de los Primeros");
    expect(dotesExtraidas[0].efectos).toBeDefined();
    expect(dotesExtraidas[0].efectos?.some((e) => e.objetivo === "iniciativa")).toBe(true);
  });

  it("ubica la dote sintetizada en el bloque 'dotes' mediante agruparRasgosJerarquicos", () => {
    const rasgoInvocaciones: RasgoPersonaje = {
      id: "rasgo_cls_brujo_invocaciones_sobrenaturales",
      nombre: "Invocaciones sobrenaturales",
      descripcion: "...",
      origen: "clase",
      fuente: "Brujo (Nivel 1)",
      tipoAccion: "pasivo",
      tieneUsosLimitados: false,
      recuperacion: "ninguno",
      personalizado: false,
      activo: true,
      notas: "",
      selectores: [
        {
          id: "selector_invocaciones_brujo",
          tipo: "multiple",
          etiqueta: "Invocaciones Sobrenaturales",
          maxSelecciones: 3,
          opciones: [],
          valorActual: [
            "lecciones_de_los_primeros:dote_duro",
            "lecciones_de_los_primeros__timestamp2:dote_maton_taberna"
          ]
        }
      ]
    };

    const dotesExtraidas = resolverDotesDesdeInvocaciones([rasgoInvocaciones]);
    expect(dotesExtraidas).toHaveLength(2);

    const todosLosRasgos = [rasgoInvocaciones, ...dotesExtraidas];
    const datosJerarquicos = agruparRasgosJerarquicos(todosLosRasgos, [
      { nombre: "Brujo", nivel: 2 }
    ]);

    expect(datosJerarquicos.dotes).toHaveLength(2);
    expect(datosJerarquicos.dotes.map((d) => d.nombre)).toContain("Duro");
    expect(datosJerarquicos.dotes.map((d) => d.nombre)).toContain("Matón de Taberna");
  });

  it("no extrae dotes si el rasgo de invocaciones está desactivado", () => {
    const rasgoInvocacionesInactivo: RasgoPersonaje = {
      id: "rasgo_cls_brujo_invocaciones_sobrenaturales",
      nombre: "Invocaciones sobrenaturales",
      descripcion: "...",
      origen: "clase",
      fuente: "Brujo (Nivel 1)",
      tipoAccion: "pasivo",
      tieneUsosLimitados: false,
      recuperacion: "ninguno",
      personalizado: false,
      activo: false,
      notas: "",
      selectores: [
        {
          id: "selector_invocaciones_brujo",
          tipo: "multiple",
          etiqueta: "Invocaciones",
          maxSelecciones: 1,
          opciones: [],
          valorActual: ["lecciones_de_los_primeros:dote_alerta"]
        }
      ]
    };

    const dotesExtraidas = resolverDotesDesdeInvocaciones([rasgoInvocacionesInactivo]);
    expect(dotesExtraidas).toHaveLength(0);
  });
});

describe("Agrupación de Canalizar Divinidad en Clérigo (D&D 5.5e)", () => {
  const crearRasgoMock = (
    id: string,
    nombre: string,
    origen: "clase" | "subclase",
    fuente: string,
    ligadoA?: string,
    nivelRequerido = 2
  ): RasgoPersonaje => ({
    id,
    nombre,
    descripcion: `Descripción de ${nombre}`,
    origen,
    fuente,
    tipoAccion: "accion",
    tieneUsosLimitados: false,
    recuperacion: "ninguno",
    personalizado: false,
    activo: true,
    notas: "",
    ligadoA,
    nivelRequerido
  });

  it("esRasgoCanalizarDivinidad detecta correctamente el recurso padre, efectos y opciones de subclase", () => {
    const padre = crearRasgoMock("rasgo_cls_clerigo_canalizar_divinidad", "Canalizar divinidad", "clase", "Clérigo (Nivel 2)");
    const chispa = crearRasgoMock("rasgo_cls_clerigo_chispa_divina", "Canalizar divinidad: Chispa divina", "clase", "Clérigo (Nivel 2)", "Canalizar divinidad");
    const abrasar = crearRasgoMock("rasgo_cls_clerigo_abrasar_muertos_vivientes", "Abrasar muertos vivientes", "clase", "Clérigo (Nivel 5)", "Canalizar divinidad: Expulsar muertos vivientes", 5);
    const preservar = crearRasgoMock("rasgo_sub_vida_preservar_vida", "Canalizar divinidad: Preservar la vida", "subclase", "Clérigo (Dominio de la Vida - Nivel 3)", "Canalizar divinidad", 3);
    const ordenDivina = crearRasgoMock("rasgo_cls_clerigo_orden_divina", "Orden divina", "clase", "Clérigo (Nivel 1)", undefined, 1);
    const discipulo = crearRasgoMock("rasgo_sub_vida_discipulo_de_la_vida", "Discípulo de la vida", "subclase", "Clérigo (Dominio de la Vida - Nivel 3)", undefined, 3);

    expect(esRasgoCanalizarDivinidad(padre)).toBe(true);
    expect(esRasgoCanalizarDivinidad(chispa)).toBe(true);
    expect(esRasgoCanalizarDivinidad(abrasar)).toBe(true);
    expect(esRasgoCanalizarDivinidad(preservar)).toBe(true);
    expect(esRasgoCanalizarDivinidad(ordenDivina)).toBe(false);
    expect(esRasgoCanalizarDivinidad(discipulo)).toBe(false);
  });

  it("agrupa todos los rasgos de Canalizar divinidad en mc.rasgosCanalizarDivinidad y los excluye de base y subclase", () => {
    const padre = crearRasgoMock("rasgo_cls_clerigo_canalizar_divinidad", "Canalizar divinidad", "clase", "Clérigo (Nivel 2)", undefined, 2);
    const chispa = crearRasgoMock("rasgo_cls_clerigo_chispa_divina", "Canalizar divinidad: Chispa divina", "clase", "Clérigo (Nivel 2)", "Canalizar divinidad", 2);
    const expulsar = crearRasgoMock("rasgo_cls_clerigo_expulsar_muertos_vivientes", "Canalizar divinidad: Expulsar muertos vivientes", "clase", "Clérigo (Nivel 2)", "Canalizar divinidad", 2);
    const preservar = crearRasgoMock("rasgo_sub_vida_preservar_vida", "Canalizar divinidad: Preservar la vida", "subclase", "Clérigo (Dominio de la Vida - Nivel 3)", "Canalizar divinidad", 3);
    const ordenDivina = crearRasgoMock("rasgo_cls_clerigo_orden_divina", "Orden divina", "clase", "Clérigo (Nivel 1)", undefined, 1);
    const discipulo = crearRasgoMock("rasgo_sub_vida_discipulo_de_la_vida", "Discípulo de la vida", "subclase", "Clérigo (Dominio de la Vida - Nivel 3)", undefined, 3);

    const todosLosRasgos = [ordenDivina, chispa, padre, expulsar, discipulo, preservar];
    const datosJerarquicos = agruparRasgosJerarquicos(todosLosRasgos, [
      { nombre: "Clérigo", subclase: "Dominio de la Vida", nivel: 3 }
    ]);

    const grupoClerigo = datosJerarquicos.clases[0];
    expect(grupoClerigo).toBeDefined();

    // 4 rasgos de Canalizar Divinidad (padre + chispa + expulsar + preservar)
    expect(grupoClerigo.rasgosCanalizarDivinidad).toHaveLength(4);

    // El recurso principal "Canalizar divinidad" debe estar primero en el array
    expect(grupoClerigo.rasgosCanalizarDivinidad[0].nombre).toBe("Canalizar divinidad");

    // Los rasgos de clase base no deben contener rasgos de Canalizar Divinidad
    expect(grupoClerigo.rasgosBase).toHaveLength(1);
    expect(grupoClerigo.rasgosBase[0].nombre).toBe("Orden divina");

    // Los rasgos de subclase no deben contener rasgos de Canalizar Divinidad
    expect(grupoClerigo.rasgosSubclase).toHaveLength(1);
    expect(grupoClerigo.rasgosSubclase[0].nombre).toBe("Discípulo de la vida");
  });

  describe("resolverRecursosPadre - Preservar vida dinámico (D&D 5.5)", () => {
    it("resuelve 5 * nivel dinámicamente como 15 y 100 según el nivel de Clérigo", () => {
      const rasgoPreservarVida: RasgoPersonaje = {
        id: "rasgo_sub_vida_preservar_vida",
        nombre: "Canalizar divinidad: Preservar vida",
        descripcion: "Restaura 5*nivel puntos de golpe.",
        tipoAccion: "accion",
        categoriaMecanica: "curacion",
        ligadoA: "Canalizar divinidad",
        gastarDePadre: true,
        formulaDados: "5*nivel",
        fuente: "Clérigo",
        origen: "subclase",
        tieneUsosLimitados: false,
        recuperacion: "ninguno",
        personalizado: false,
        activo: true,
        notas: ""
      };

      const rasgoCanalizar: RasgoPersonaje = {
        id: "rasgo_cls_clerigo_canalizar_divinidad",
        nombre: "Canalizar divinidad",
        descripcion: "Canalizas energía divina.",
        tipoAccion: "accion",
        categoriaMecanica: "consumible",
        tieneUsosLimitados: true,
        usosMaximos: 2,
        usosRestantes: 2,
        origen: "clase",
        fuente: "Clérigo",
        recuperacion: "descanso_corto",
        personalizado: false,
        activo: true,
        notas: ""
      };

      const pjNv3 = {
        id: "pj-3",
        nivel: 3,
        clase: "Clérigo",
        rasgos: [rasgoCanalizar, rasgoPreservarVida]
      } as unknown as PersonajeJugador;

      const resNv3 = resolverRecursosPadre(pjNv3, rasgoPreservarVida);
      expect(resNv3.formulaDadosEfectiva).toBe("15");

      const pjNv20 = {
        id: "pj-20",
        nivel: 20,
        clase: "Clérigo",
        rasgos: [rasgoCanalizar, rasgoPreservarVida]
      } as unknown as PersonajeJugador;

      const resNv20 = resolverRecursosPadre(pjNv20, rasgoPreservarVida);
      expect(resNv20.formulaDadosEfectiva).toBe("100");
    });
  });
});
