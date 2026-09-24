import { describe, it, expect } from "vitest";
import {
  DOTES_GENERALES_Y_EPICAS_DND55,
  TODAS_LAS_DOTES_CANONICAS_DND55,
  OPCIONES_PROPIEDADES_MAESTRIA
} from "@/constantes/dotesConstantes";
import type { RasgoPersonaje } from "@/tipos/rasgos";
import type { PersonajeJugador, HechizoBase } from "@/tipos";
import {
  obtenerConjurosOtorgadosPorRasgos
} from "./evaluadorEfectosRasgos";
import { calcularBonoVelocidadRasgos } from "./rasgos/evaluadorMovilidadRasgos";
import { obtenerMaestriasArmasAprendidas } from "./rasgos/evaluadorCombateRasgos";
import { resolverOrigenConjuro } from "./resolutorOrigenConjuros";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { ejecutarDescansoLargo } from "./procesadorDescansos";

function crearPersonajeBase(overrides: Partial<PersonajeJugador> = {}): PersonajeJugador {
  return {
    id: "pj-test-lote4",
    nombre: "Héroe del Lote 4",
    clase: "Pícaro",
    nivel: 4,
    caracteristicas: {
      fuerza: 14,
      destreza: 16,
      constitucion: 14,
      inteligencia: 12,
      sabiduria: 12,
      carisma: 10
    },
    puntosGolpe: {
      actuales: 31,
      maximos: 31,
      temporales: 0
    },
    velocidad: { caminar: 30, planea: false },
    ca: 15,
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

describe("Dotes Generales Canónicas D&D 5.5e — Lote 4/4", () => {
  const idsLote4 = [
    "dote_centinela",
    "dote_influencia_sombria",
    "dote_tirador_primera",
    "dote_maestro_escudos",
    "dote_experto_habilidades",
    "dote_rebanador",
    "dote_lanzador_preciso",
    "dote_telequinetico",
    "dote_maestro_de_armas",
    "dote_lanzador_en_combate",
    "dote_telepatico",
    "dote_veloz",
    "dote_acechador"
  ];

  it("1. Contrato Canónico: Las 13 dotes del Lote 4/4 existen en el catálogo y cumplen especificaciones", () => {
    for (const id of idsLote4) {
      const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === id);
      expect(dote, `La dote con id ${id} debe existir en DOTES_GENERALES_Y_EPICAS_DND55`).toBeDefined();
      expect(dote?.categoria).toBe("general");
      expect(dote?.fuente).toBe("PHB 2024");
      expect(dote?.descripcion).toBeTruthy();
      expect(dote?.requisito).toBeTruthy();
      expect(dote?.beneficios.length).toBeGreaterThan(0);
      expect(dote?.tipoAccion).toBeDefined();
      expect(dote?.categoriaMecanica).toBeDefined();

      const enTodas = TODAS_LAS_DOTES_CANONICAS_DND55.find((d) => d.id === id);
      expect(enTodas).toBeDefined();
    }
  });

  describe("2. Centinela (dote_centinela)", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_centinela");

    it("es pasivo permanente con acción de tipo reacción", () => {
      expect(dote?.tipoAccion).toBe("reaccion");
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.requisito).toContain("Fuerza o Destreza 13");
    });

    it("recoge adecuadamente las reglas tácticas de Guardián y Detener en sus beneficios", () => {
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("guardián") || b.toLowerCase().includes("guardian"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("detener"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.includes("+1 Fuerza o Destreza"))).toBe(true);
    });
  });

  describe("3. Influencia Sombría (dote_influencia_sombria)", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_influencia_sombria");

    it("es consumible con 2 usos y recuperación en descanso largo", () => {
      expect(dote?.categoriaMecanica).toBe("consumible");
      expect(dote?.tieneUsosLimitados).toBe(true);
      expect(dote?.usosMaximos).toBe(2);
      expect(dote?.recuperacion).toBe("descanso_largo");
      expect(dote?.tipoAccion).toBe("especial");
    });

    it("otorga el conjuro base Invisibilidad", () => {
      expect(dote?.conjurosOtorgados).toContain("h_invisibilidad");
    });

    it("posee selector de aptitud mágica entre INT, SAB y CAR", () => {
      const selAptitud = dote?.selectores?.find((s) => s.id === "selector_aptitud_influencia_sombria");
      expect(selAptitud).toBeDefined();
      expect(selAptitud?.tipo).toBe("unico");
      const ids = selAptitud?.opciones.map((o) => o.id);
      expect(ids).toEqual(["inteligencia", "sabiduria", "carisma"]);
    });

    it("posee selector de conjuros de nivel 1 filtrados a Ilusión o Nigromancia", () => {
      const selConjuro = dote?.selectores?.find((s) => s.id === "selector_conjuro_nv1_influencia_sombria");
      expect(selConjuro).toBeDefined();
      expect(selConjuro?.tipo).toBe("unico");
      expect(selConjuro?.visualizacion).toBe("lista");
      expect(selConjuro?.opciones.length).toBeGreaterThan(0);

      for (const op of selConjuro?.opciones || []) {
        const descNorm = op.descripcion.toLowerCase();
        expect(
          descNorm.includes("ilusión") ||
          descNorm.includes("ilusion") ||
          descNorm.includes("nigromancia")
        ).toBe(true);
      }
    });

    it("sincroniza reactivamente el conjuro seleccionado en el almacén y mantiene Invisibilidad", () => {
      const rasgo = instanciarDoteComoRasgo("dote_influencia_sombria", {
        usosRestantes: 2
      });
      const pj = crearPersonajeBase({
        rasgos: [rasgo]
      });

      usarAlmacenDM.setState({
        personajes: [pj],
        idPersonajeActivo: pj.id
      });

      const selConjuro = dote?.selectores?.find((s) => s.id === "selector_conjuro_nv1_influencia_sombria");
      const conjuroElegidoId = selConjuro?.opciones[0].id || "h_disfrazarse";

      usarAlmacenDM.getState().actualizarSeleccionRasgo(
        pj.id,
        dote!.id,
        "selector_conjuro_nv1_influencia_sombria",
        [conjuroElegidoId]
      );

      const pjActualizado = usarAlmacenDM.getState().personajes.find((p) => p.id === pj.id)!;
      const rasgoActualizado = pjActualizado.rasgos?.find((r) => r.id === dote!.id);

      expect(rasgoActualizado?.conjurosOtorgados).toContain("h_invisibilidad");
      expect(rasgoActualizado?.conjurosOtorgados).toContain(conjuroElegidoId);

      const todosConjurosOtorgados = obtenerConjurosOtorgadosPorRasgos(pjActualizado);
      expect(todosConjurosOtorgados).toContain("h_invisibilidad");
      expect(todosConjurosOtorgados).toContain(conjuroElegidoId);
    });

    it("recupera sus 2 usos al ejecutar un descanso largo", () => {
      const rasgoGastado = instanciarDoteComoRasgo("dote_influencia_sombria", {
        usosRestantes: 0
      });
      const pjGastado = crearPersonajeBase({
        rasgos: [rasgoGastado]
      });

      const res = ejecutarDescansoLargo(pjGastado);
      const rasgoRestaurado = res.personajeActualizado.rasgos?.find((r) => r.id === dote!.id);
      expect(rasgoRestaurado?.usosRestantes).toBe(2);
    });

    it("resuelve origen de conjuro para Invisibilidad como otorgado por rasgos", () => {
      const rasgo = instanciarDoteComoRasgo("dote_influencia_sombria");
      const pj = crearPersonajeBase({ rasgos: [rasgo] });
      const origen = resolverOrigenConjuro(pj, { id: "h_invisibilidad", nombre: "Invisibilidad" } as unknown as HechizoBase);
      expect(origen).toBe("rasgos");
    });
  });

  describe("4. Tirador de Primera (dote_tirador_primera)", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_tirador_primera");

    it("es pasivo permanente y registra sus beneficios tácticos de disparo a distancia", () => {
      expect(dote?.tipoAccion).toBe("pasivo");
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.requisito).toContain("Destreza 13");
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("sortear cobertura"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("disparar cuerpo a cuerpo"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("tiros lejanos"))).toBe(true);
    });
  });

  describe("5. Maestro en Escudos (dote_maestro_escudos)", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_maestro_escudos");

    it("es de tipo reacción y requiere competencia con escudos", () => {
      expect(dote?.tipoAccion).toBe("reaccion");
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.requisito).toContain("competencia con escudos");
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("golpe con escudo"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("interponer escudo"))).toBe(true);
    });
  });

  describe("6. Experto en Habilidades (dote_experto_habilidades)", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_experto_habilidades");

    it("registra sus beneficios informativos oficiales de mejora, competencia y pericia", () => {
      expect(dote?.tipoAccion).toBe("pasivo");
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("característica a tu elección"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("competencia en habilidad"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("pericia"))).toBe(true);
    });
  });

  describe("7. Rebanador (dote_rebanador)", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_rebanador");

    it("es pasivo permanente y registra sus beneficios tácticos de daño cortante", () => {
      expect(dote?.tipoAccion).toBe("pasivo");
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.requisito).toContain("Fuerza o Destreza 13");
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("lacerar"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("crítico potenciado") || b.toLowerCase().includes("critico"))).toBe(true);
    });
  });

  describe("8. Lanzador Preciso (dote_lanzador_preciso)", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_lanzador_preciso");

    it("es pasivo permanente y registra sus beneficios tácticos de ataques de conjuro", () => {
      expect(dote?.tipoAccion).toBe("pasivo");
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.requisito).toContain("aptitud para lanzar al menos un conjuro");
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("alcance incrementado"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("ignorar cobertura"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("cuerpo a cuerpo"))).toBe(true);
    });
  });

  describe("9. Telequinético (dote_telequinetico)", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_telequinetico");

    it("es pasivo permanente con acción adicional para el empellón telequinético", () => {
      expect(dote?.tipoAccion).toBe("accion_adicional");
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.conjurosOtorgados).toContain("h_mano-de-mago");
    });

    it("posee selector de aptitud mágica", () => {
      const sel = dote?.selectores?.find((s) => s.id === "selector_aptitud_telequinetico");
      expect(sel).toBeDefined();
      expect(sel?.tipo).toBe("unico");
      expect(sel?.opciones.map((o) => o.id)).toEqual(["inteligencia", "sabiduria", "carisma"]);
    });

    it("otorga el truco Mano de mago resuelto por evaluador de rasgos", () => {
      const rasgo = instanciarDoteComoRasgo("dote_telequinetico");
      const pj = crearPersonajeBase({ rasgos: [rasgo] });
      const conjuros = obtenerConjurosOtorgadosPorRasgos(pj);
      expect(conjuros).toContain("h_mano-de-mago");
    });
  });

  describe("10. Maestro de Armas (dote_maestro_de_armas)", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_maestro_de_armas");

    it("posee selector maestrias_aprendidas con las 8 maestrías canónicas oficiales", () => {
      expect(dote?.selectores).toBeDefined();
      const sel = dote?.selectores?.find((s) => s.id === "maestrias_aprendidas");
      expect(sel).toBeDefined();
      expect(sel?.tipo).toBe("unico");
      expect(sel?.maxSelecciones).toBe(1);
      expect(sel?.opciones).toEqual(OPCIONES_PROPIEDADES_MAESTRIA);
      expect(sel?.opciones.length).toBe(8);

      const idsOpciones = sel?.opciones.map((o) => o.id);
      expect(idsOpciones).toEqual([
        "cleave",
        "graze",
        "nick",
        "push",
        "sap",
        "slow",
        "topple",
        "vex"
      ]);
    });

    it("es detectada por el evaluador genérico de maestrías cuando el usuario selecciona una propiedad", () => {
      const rasgo = instanciarDoteComoRasgo("dote_maestro_de_armas", {
        selectores: [
          {
            id: "maestrias_aprendidas",
            tipo: "unico",
            etiqueta: "Maestría de Arma Aprendida",
            maxSelecciones: 1,
            opciones: OPCIONES_PROPIEDADES_MAESTRIA,
            valorActual: ["topple"]
          }
        ]
      });

      const pj = crearPersonajeBase({
        rasgos: [rasgo]
      });

      const maestriasAprendidas = obtenerMaestriasArmasAprendidas(pj);
      expect(maestriasAprendidas.has("topple")).toBe(true);
      // El evaluador incluye sinónimos canónicos como "derribar"
      expect(maestriasAprendidas.has("derribar")).toBe(true);
    });

    it("permite cambiar la maestría seleccionada a otra oficial (ej. cleave / hender)", () => {
      const rasgo = instanciarDoteComoRasgo("dote_maestro_de_armas", {
        selectores: [
          {
            id: "maestrias_aprendidas",
            tipo: "unico",
            etiqueta: "Maestría de Arma Aprendida",
            maxSelecciones: 1,
            opciones: OPCIONES_PROPIEDADES_MAESTRIA,
            valorActual: ["cleave"]
          }
        ]
      });

      const pj = crearPersonajeBase({
        rasgos: [rasgo]
      });

      const maestriasAprendidas = obtenerMaestriasArmasAprendidas(pj);
      expect(maestriasAprendidas.has("cleave")).toBe(true);
      expect(maestriasAprendidas.has("hender")).toBe(true);
      expect(maestriasAprendidas.has("topple")).toBe(false);
    });
  });

  describe("11. Lanzador en Combate (dote_lanzador_en_combate)", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_lanzador_en_combate");

    it("es de tipo reacción y declara ventaja en salvaciones de concentración", () => {
      expect(dote?.tipoAccion).toBe("reaccion");
      expect(dote?.requisito).toContain("aptitud para lanzar al menos un conjuro");
      expect(dote?.efectos).toBeDefined();

      const efVentaja = dote?.efectos?.find(
        (e) => e.tipo === "ventaja" && e.objetivo === "salvacion.constitucion.concentracion"
      );
      expect(efVentaja).toBeDefined();
      expect(efVentaja?.valor).toBe("ventaja");
      expect(efVentaja?.condicion).toBe("concentracion");
    });

    it("registra beneficios de hechizo reactivo y componentes somáticos con manos ocupadas", () => {
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("hechizo reactivo"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("componentes somáticos") || b.toLowerCase().includes("somaticos"))).toBe(true);
    });
  });

  describe("12. Telepático (dote_telepatico)", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_telepatico");

    it("es consumible con 1 uso, tipo acción y recuperación en descanso largo", () => {
      expect(dote?.tipoAccion).toBe("accion");
      expect(dote?.categoriaMecanica).toBe("consumible");
      expect(dote?.tieneUsosLimitados).toBe(true);
      expect(dote?.usosMaximos).toBe(1);
      expect(dote?.recuperacion).toBe("descanso_largo");
      expect(dote?.conjurosOtorgados).toContain("h_detectar-pensamientos");
    });

    it("posee selector de aptitud mágica", () => {
      const sel = dote?.selectores?.find((s) => s.id === "selector_aptitud_telepatico");
      expect(sel).toBeDefined();
      expect(sel?.tipo).toBe("unico");
      expect(sel?.opciones.map((o) => o.id)).toEqual(["inteligencia", "sabiduria", "carisma"]);
    });

    it("otorga Detectar Pensamientos resuelto por evaluador de rasgos y recupera uso en descanso largo", () => {
      const rasgo = instanciarDoteComoRasgo("dote_telepatico", {
        usosRestantes: 0
      });
      const pj = crearPersonajeBase({ rasgos: [rasgo] });

      const conjuros = obtenerConjurosOtorgadosPorRasgos(pj);
      expect(conjuros).toContain("h_detectar-pensamientos");

      const res = ejecutarDescansoLargo(pj);
      const rasgoRestaurado = res.personajeActualizado.rasgos?.find((r) => r.id === dote!.id);
      expect(rasgoRestaurado?.usosRestantes).toBe(1);
    });
  });

  describe("13. Veloz (dote_veloz)", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_veloz");

    it("declara el efecto declarativo de velocidad +10 a velocidad.caminar", () => {
      expect(dote?.efectos).toBeDefined();
      const efVel = dote?.efectos?.find((e) => e.tipo === "modificador_velocidad");
      expect(efVel).toBeDefined();
      expect(efVel?.objetivo).toBe("velocidad.caminar");
      expect(efVel?.valor).toBe(10);
    });

    it("aumenta la velocidad en +10 pies cuando está activo en el personaje", () => {
      const rasgoVeloz = instanciarDoteComoRasgo("dote_veloz", { activo: true });
      const pj = crearPersonajeBase({
        rasgos: [rasgoVeloz]
      });

      const bonoVel = calcularBonoVelocidadRasgos(pj);
      expect(bonoVel).toBe(10);
    });

    it("no aporta bonificación de velocidad cuando el rasgo está inactivo", () => {
      const rasgoVelozInactivo = instanciarDoteComoRasgo("dote_veloz", { activo: false });
      const pj = crearPersonajeBase({
        rasgos: [rasgoVelozInactivo]
      });

      const bonoVel = calcularBonoVelocidadRasgos(pj);
      expect(bonoVel).toBe(0);
    });

    it("registra beneficios informativos de Corredor tenaz y Movimiento ágil", () => {
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("corredor tenaz"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("movimiento ágil") || b.toLowerCase().includes("agil"))).toBe(true);
    });
  });

  describe("14. Acechador (dote_acechador)", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_acechador");

    it("es pasivo permanente y registra visión ciega, niebla de guerra y en la sombra", () => {
      expect(dote?.tipoAccion).toBe("pasivo");
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.requisito).toContain("Destreza 13");
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("visión ciega") || b.toLowerCase().includes("vision"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("niebla de guerra"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("en la sombra"))).toBe(true);
    });
  });

  describe("15. Integración Múltiple del Lote 4/4 en un Personaje", () => {
    it("combina Veloz (+10 pies), Maestro de Armas (derribar/topple) y Telequinético (mano de mago)", () => {
      const rasgoVeloz = instanciarDoteComoRasgo("dote_veloz");
      const rasgoMaestroArmas = instanciarDoteComoRasgo("dote_maestro_de_armas", {
        selectores: [
          {
            id: "maestrias_aprendidas",
            tipo: "unico",
            etiqueta: "Maestría de Arma Aprendida",
            maxSelecciones: 1,
            opciones: OPCIONES_PROPIEDADES_MAESTRIA,
            valorActual: ["topple"]
          }
        ]
      });
      const rasgoTelequinetico = instanciarDoteComoRasgo("dote_telequinetico");

      const pjMulti = crearPersonajeBase({
        rasgos: [rasgoVeloz, rasgoMaestroArmas, rasgoTelequinetico]
      });

      // 1. Bono de velocidad
      expect(calcularBonoVelocidadRasgos(pjMulti)).toBe(10);

      // 2. Maestrías aprendidas
      const maestrias = obtenerMaestriasArmasAprendidas(pjMulti);
      expect(maestrias.has("topple")).toBe(true);

      // 3. Conjuros otorgados
      const conjuros = obtenerConjurosOtorgadosPorRasgos(pjMulti);
      expect(conjuros).toContain("h_mano-de-mago");
    });
  });
});
