import { describe, it, expect } from "vitest";
import {
  DOTES_EPICAS_DND55,
  DOTES_GENERALES_Y_EPICAS_DND55,
  TODAS_LAS_DOTES_CANONICAS_DND55,
  OPCIONES_DANOS_RESISTENCIA_ENERGIAS
} from "@/constantes/dotesConstantes";
import type { RasgoPersonaje } from "@/tipos/rasgos";
import type { PersonajeJugador } from "@/tipos";
import { calcularBonoHPMaximoRasgos } from "./rasgos/evaluadorVitalidadRasgos";
import { calcularBonoVelocidadRasgos } from "./rasgos/evaluadorMovilidadRasgos";
import { ejecutarDescansoCorto, ejecutarDescansoLargo } from "./procesadorDescansos";
import { normalizarFormulaDados } from "@/utiles/lanzadorDados";

function crearPersonajeEpico(overrides: Partial<PersonajeJugador> = {}): PersonajeJugador {
  return {
    id: "pj-test-epico",
    nombre: "Archimago Legendario",
    clase: "Mago",
    nivel: 20,
    caracteristicas: {
      fuerza: 10,
      destreza: 16,
      constitucion: 18,
      inteligencia: 22,
      sabiduria: 14,
      carisma: 12
    },
    puntosGolpe: {
      actuales: 142,
      maximos: 142,
      temporales: 0
    },
    velocidad: { caminar: 30, planea: false },
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
  const todasConAdicionales = TODAS_LAS_DOTES_CANONICAS_DND55.flatMap((d) => [d, ...(d.rasgosAdicionales || [])]);
  const dote = todasConAdicionales.find((d) => d.id === idDote);
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
    formulaDados: dote.formulaDados,
    efectos: dote.efectos ? JSON.parse(JSON.stringify(dote.efectos)) : [],
    selectores: dote.selectores ? JSON.parse(JSON.stringify(dote.selectores)) : [],
    conjurosOtorgados: dote.conjurosOtorgados ? [...dote.conjurosOtorgados] : [],
    notas: "",
    ...modificaciones
  } as RasgoPersonaje;
}

describe("Dotes Épicas Canónicas D&D 5.5e (Epic Boons — PHB 2024)", () => {
  const idsDotesEpicas = [
    "dote_don_pericia_combate",
    "dote_don_viaje_dimensional",
    "dote_don_resistencia_energias",
    "dote_don_destino",
    "dote_don_fortaleza",
    "dote_don_ataque_imparable",
    "dote_don_recuperacion",
    "dote_don_habilidad",
    "dote_don_velocidad",
    "dote_don_recuerdo_conjuros",
    "dote_don_espiritu_noche",
    "dote_don_vision_verdadera"
  ];

  it("1. Contrato Canónico: Las 12 dotes épicas oficiales existen en el catálogo y cumplen especificaciones", () => {
    expect(DOTES_EPICAS_DND55.length).toBe(12);
    for (const id of idsDotesEpicas) {
      const dote = DOTES_EPICAS_DND55.find((d) => d.id === id);
      expect(dote, `La dote con id ${id} debe existir en DOTES_EPICAS_DND55`).toBeDefined();
      expect(dote?.categoria).toBe("don_epico");
      expect(dote?.fuente).toBe("PHB 2024");
      expect(dote?.descripcion).toBeTruthy();
      expect(dote?.requisito).toContain("Nivel 19 o más");
      expect(dote?.beneficios.length).toBeGreaterThan(0);
      expect(dote?.tipoAccion).toBeDefined();
      expect(dote?.categoriaMecanica).toBeDefined();

      const enGeneralesYEpicas = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === id);
      expect(enGeneralesYEpicas).toBeDefined();

      const enTodas = TODAS_LAS_DOTES_CANONICAS_DND55.find((d) => d.id === id);
      expect(enTodas).toBeDefined();
    }
  });

  describe("2. Don de la Pericia en Combate (dote_don_pericia_combate)", () => {
    const dote = DOTES_EPICAS_DND55.find((d) => d.id === "dote_don_pericia_combate");

    it("es un consumible con 1 uso de acción especial y recuperación manual", () => {
      expect(dote?.categoriaMecanica).toBe("consumible");
      expect(dote?.tieneUsosLimitados).toBe(true);
      expect(dote?.usosMaximos).toBe(1);
      expect(dote?.tipoAccion).toBe("especial");
      expect(dote?.recuperacion).toBe("manual");
    });

    it("recoge el beneficio oficial de Puntería inigualable para convertir fallo en impacto", () => {
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("puntería inigualable") || b.toLowerCase().includes("punteria"))).toBe(true);
      expect(dote?.descripcion).toContain("Puntería inigualable");
    });
  });

  describe("3. Don del Viaje Dimensional (dote_don_viaje_dimensional)", () => {
    const dote = DOTES_EPICAS_DND55.find((d) => d.id === "dote_don_viaje_dimensional");

    it("es pasivo permanente de acción especial e informativo táctico", () => {
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.tipoAccion).toBe("especial");
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("pasos intermitentes"))).toBe(true);
      expect(dote?.descripcion).toContain("teletransportarte hasta 30 pies");
    });
  });

  describe("4. Don de la Resistencia a Energías (dote_don_resistencia_energias)", () => {
    const dote = DOTES_EPICAS_DND55.find((d) => d.id === "dote_don_resistencia_energias");

    it("posee selector de 2 tipos de resistencia entre los 9 tipos elementales canónicos", () => {
      expect(dote?.selectores).toBeDefined();
      const sel = dote?.selectores?.find((s) => s.id === "selector_resistencias_energias");
      expect(sel).toBeDefined();
      expect(sel?.tipo).toBe("multiple");
      expect(sel?.maxSelecciones).toBe(2);
      expect(sel?.opciones).toEqual(OPCIONES_DANOS_RESISTENCIA_ENERGIAS);
      expect(sel?.opciones.length).toBe(9);

      const ids = sel?.opciones.map((o) => o.id);
      expect(ids).toContain("acido");
      expect(ids).toContain("frio");
      expect(ids).toContain("fuego");
      expect(ids).toContain("relampago");
      expect(ids).toContain("necrotico");
      expect(ids).toContain("veneno");
      expect(ids).toContain("psiquico");
      expect(ids).toContain("radiante");
      expect(ids).toContain("trueno");
    });

    it("posee reacción para redirigir energía con fórmula de tirada de 2d12", () => {
      expect(dote?.tipoAccion).toBe("reaccion");
      expect(dote?.formulaDados).toBe("2d12");
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("redirigir energía") || b.toLowerCase().includes("redirigir energia"))).toBe(true);
    });
  });

  describe("5. Don del Destino (dote_don_destino)", () => {
    const dote = DOTES_EPICAS_DND55.find((d) => d.id === "dote_don_destino");

    it("es consumible con 1 uso, fórmula de dados 2d4 y recarga en descanso corto", () => {
      expect(dote?.categoriaMecanica).toBe("consumible");
      expect(dote?.tieneUsosLimitados).toBe(true);
      expect(dote?.usosMaximos).toBe(1);
      expect(dote?.formulaDados).toBe("2d4");
      expect(dote?.recuperacion).toBe("descanso_corto");
    });

    it("recupera su uso tanto en descanso corto como en descanso largo", () => {
      const rasgo = instanciarDoteComoRasgo("dote_don_destino", { usosRestantes: 0 });
      const pj = crearPersonajeEpico({ rasgos: [rasgo] });

      const resCorto = ejecutarDescansoCorto(pj, 0);
      const rasgoCorto = resCorto.personajeActualizado.rasgos?.find((r) => r.id === dote!.id);
      expect(rasgoCorto?.usosRestantes).toBe(1);

      const resLargo = ejecutarDescansoLargo(pj);
      const rasgoLargo = resLargo.personajeActualizado.rasgos?.find((r) => r.id === dote!.id);
      expect(rasgoLargo?.usosRestantes).toBe(1);
    });
  });

  describe("6. Don de la Fortaleza (dote_don_fortaleza)", () => {
    const dote = DOTES_EPICAS_DND55.find((d) => d.id === "dote_don_fortaleza");

    it("declara efecto mecánico activo de modificador_hp_maximo igual a 40", () => {
      expect(dote?.efectos).toBeDefined();
      const ef = dote?.efectos?.find((e) => e.tipo === "modificador_hp_maximo");
      expect(ef).toBeDefined();
      expect(ef?.objetivo).toBe("hp_maximo");
      expect(ef?.valor).toBe(40);
    });

    it("aumenta los puntos de golpe máximos en exactamente +40 cuando está activo", () => {
      const rasgo = instanciarDoteComoRasgo("dote_don_fortaleza", { activo: true });
      const pj = crearPersonajeEpico({ rasgos: [rasgo] });

      const bonoHp = calcularBonoHPMaximoRasgos(pj);
      expect(bonoHp).toBe(40);
    });

    it("retorna bono 0 cuando el rasgo está inactivo", () => {
      const rasgo = instanciarDoteComoRasgo("dote_don_fortaleza", { activo: false });
      const pj = crearPersonajeEpico({ rasgos: [rasgo] });

      const bonoHp = calcularBonoHPMaximoRasgos(pj);
      expect(bonoHp).toBe(0);
    });

    it("recoge el beneficio informativo de curación fortalecida (+CON)", () => {
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("curación fortalecida") || b.toLowerCase().includes("curacion"))).toBe(true);
    });
  });

  describe("7. Don del Ataque Imparable (dote_don_ataque_imparable)", () => {
    const dote = DOTES_EPICAS_DND55.find((d) => d.id === "dote_don_ataque_imparable");

    it("es pasivo permanente y requiere Fuerza o Destreza 19 o más", () => {
      expect(dote?.tipoAccion).toBe("pasivo");
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.requisito).toContain("Fuerza o Destreza 19 o más");
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("superar defensas"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("golpe arrollador"))).toBe(true);
    });
  });

  describe("8. Don de la Recuperación (Dote unificada con rasgo complementario Vitalidad)", () => {
    const doteRecuperacion = DOTES_EPICAS_DND55.find((d) => d.id === "dote_don_recuperacion");
    const doteVitalidad = doteRecuperacion?.rasgosAdicionales?.[0];

    it("Don de la recuperación es una sola dote en el catálogo y contiene el rasgo adicional Vitalidad", () => {
      expect(doteRecuperacion?.nombre).toBe("Don de la Recuperación");
      expect(doteRecuperacion?.categoriaMecanica).toBe("consumible");
      expect(doteRecuperacion?.tipoAccion).toBe("reaccion");
      expect(doteRecuperacion?.tieneUsosLimitados).toBe(true);
      expect(doteRecuperacion?.usosMaximos).toBe(1);
      expect(doteRecuperacion?.recuperacion).toBe("descanso_largo");
      expect(doteRecuperacion?.rasgosAdicionales?.length).toBe(1);
      expect(doteVitalidad?.id).toBe("dote_don_recuperacion_vitalidad");
    });

    it("Vitalidad es acción adicional, categoría curación con 10 dados d10 por descanso largo y formulaDados '1d10'", () => {
      expect(doteVitalidad?.categoriaMecanica).toBe("curacion");
      expect(doteVitalidad?.tipoAccion).toBe("accion_adicional");
      expect(doteVitalidad?.tieneUsosLimitados).toBe(true);
      expect(doteVitalidad?.usosMaximos).toBe(10);
      expect(doteVitalidad?.recuperacion).toBe("descanso_largo");
      expect(doteVitalidad?.formulaDados).toBe("1d10");
      expect(doteVitalidad?.beneficios.some((b) => b.toLowerCase().includes("vitalidad"))).toBe(true);
    });

    it("el descanso largo restaura de forma independiente ambos recursos gastados", () => {
      const rasgoBastion = instanciarDoteComoRasgo("dote_don_recuperacion", { usosRestantes: 0 });
      const rasgoVitalidad: RasgoPersonaje = {
        id: "dote_don_recuperacion_vitalidad",
        nombre: doteVitalidad!.nombre,
        descripcion: doteVitalidad!.descripcion,
        origen: "dote",
        fuente: "PHB 2024",
        tipoAccion: doteVitalidad!.tipoAccion || "accion_adicional",
        tieneUsosLimitados: true,
        usosMaximos: 10,
        usosRestantes: 2,
        recuperacion: "descanso_largo",
        formulaDados: "1d10",
        categoriaMecanica: "curacion",
        personalizado: true,
        activo: true,
        notas: ""
      };

      const pj = crearPersonajeEpico({ rasgos: [rasgoBastion, rasgoVitalidad] });
      const res = ejecutarDescansoLargo(pj);

      const bastionRestaurado = res.personajeActualizado.rasgos?.find((r) => r.id === doteRecuperacion!.id);
      const vitalidadRestaurada = res.personajeActualizado.rasgos?.find((r) => r.id === "dote_don_recuperacion_vitalidad");

      expect(bastionRestaurado?.usosRestantes).toBe(1);
      expect(vitalidadRestaurada?.usosRestantes).toBe(10);
    });
  });

  describe("9. Don de la Habilidad (dote_don_habilidad)", () => {
    const dote = DOTES_EPICAS_DND55.find((d) => d.id === "dote_don_habilidad");

    it("es pasivo permanente y registra beneficios de competencia total y pericia", () => {
      expect(dote?.tipoAccion).toBe("pasivo");
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("competencia total"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("pericia"))).toBe(true);
    });
  });

  describe("10. Don de la Velocidad (dote_don_velocidad)", () => {
    const dote = DOTES_EPICAS_DND55.find((d) => d.id === "dote_don_velocidad");

    it("declara efecto de velocidad.caminar con valor 30", () => {
      expect(dote?.efectos).toBeDefined();
      const ef = dote?.efectos?.find((e) => e.tipo === "modificador_velocidad");
      expect(ef).toBeDefined();
      expect(ef?.objetivo).toBe("velocidad.caminar");
      expect(ef?.valor).toBe(30);
    });

    it("incrementa en +30 pies la velocidad de desplazamiento calculada cuando está activo", () => {
      const rasgo = instanciarDoteComoRasgo("dote_don_velocidad", { activo: true });
      const pj = crearPersonajeEpico({ rasgos: [rasgo] });

      const bonoVel = calcularBonoVelocidadRasgos(pj);
      expect(bonoVel).toBe(30);
    });

    it("no aporta bono de velocidad cuando el rasgo está inactivo", () => {
      const rasgo = instanciarDoteComoRasgo("dote_don_velocidad", { activo: false });
      const pj = crearPersonajeEpico({ rasgos: [rasgo] });

      const bonoVel = calcularBonoVelocidadRasgos(pj);
      expect(bonoVel).toBe(0);
    });

    it("registra el beneficio informativo de Artista del escape", () => {
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("artista del escape"))).toBe(true);
    });
  });

  describe("11. Don del Recuerdo de Conjuros (dote_don_recuerdo_conjuros)", () => {
    const dote = DOTES_EPICAS_DND55.find((d) => d.id === "dote_don_recuerdo_conjuros");

    it("posee requisito de magia y fórmula de tirada 1d4 para lanzamiento gratuito", () => {
      expect(dote?.requisito).toContain("rasgo Lanzamiento de conjuros o Magia del pacto");
      expect(dote?.formulaDados).toBe("1d4");
      expect(dote?.tipoAccion).toBe("especial");
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("lanzamiento gratuito"))).toBe(true);
    });
  });

  describe("12. Don del Espíritu de la Noche (dote_don_espiritu_noche)", () => {
    const dote = DOTES_EPICAS_DND55.find((d) => d.id === "dote_don_espiritu_noche");

    it("posee tipo de acción acción adicional y registra fundirse con las sombras y forma sombría", () => {
      expect(dote?.tipoAccion).toBe("accion_adicional");
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("fundirse con las sombras"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("forma sombría") || b.toLowerCase().includes("forma sombria"))).toBe(true);
    });
  });

  describe("13. Don de la Visión Verdadera (dote_don_vision_verdadera)", () => {
    const dote = DOTES_EPICAS_DND55.find((d) => d.id === "dote_don_vision_verdadera");

    it("es pasivo permanente y registra visión verdadera a 60 pies", () => {
      expect(dote?.tipoAccion).toBe("pasivo");
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.beneficios.some((b) => b.toLowerCase().includes("visión verdadera") || b.toLowerCase().includes("vision verdadera"))).toBe(true);
      expect(dote?.descripcion).toContain("60 pies");
    });
  });

  describe("14. Integración Conjunta Épica en Personaje de Nivel 20", () => {
    it("combina Fortaleza (+40 HP), Velocidad (+30 pies), Destino (2d4) y Recuperación simultáneamente", () => {
      const rasgoFortaleza = instanciarDoteComoRasgo("dote_don_fortaleza");
      const rasgoVelocidad = instanciarDoteComoRasgo("dote_don_velocidad");
      const rasgoDestino = instanciarDoteComoRasgo("dote_don_destino");
      const rasgoBastion = instanciarDoteComoRasgo("dote_don_recuperacion");
      const rasgoVitalidad = instanciarDoteComoRasgo("dote_don_recuperacion_vitalidad");

      const pjEpicoCompleto = crearPersonajeEpico({
        rasgos: [
          rasgoFortaleza,
          rasgoVelocidad,
          rasgoDestino,
          rasgoBastion,
          rasgoVitalidad
        ]
      });

      // 1. Bono de HP Máximos
      expect(calcularBonoHPMaximoRasgos(pjEpicoCompleto)).toBe(40);

      // 2. Bono de Velocidad
      expect(calcularBonoVelocidadRasgos(pjEpicoCompleto)).toBe(30);

      // 3. Recursos y fórmulas
      const destino = pjEpicoCompleto.rasgos.find((r) => r.id === "dote_don_destino");
      expect(destino?.formulaDados).toBe("2d4");
      expect(destino?.usosMaximos).toBe(1);

      const vitalidad = pjEpicoCompleto.rasgos.find((r) => r.id === "dote_don_recuperacion_vitalidad");
      expect(vitalidad?.formulaDados).toBe("1d10");
      expect(vitalidad?.usosMaximos).toBe(10);
      expect(vitalidad?.categoriaMecanica).toBe("curacion");

      const bastion = pjEpicoCompleto.rasgos.find((r) => r.id === "dote_don_recuperacion");
      expect(bastion?.usosMaximos).toBe(1);
    });
  });

  describe("15. Resolución de Incidencias de Usuario (Puntos 1, 2 y 3)", () => {
    it("1. La selección contiene exactamente una entrada para 'Don de la Recuperación' y declara su rasgo complementario Vitalidad", () => {
      const dotesRecuperacionEnCatalogo = DOTES_EPICAS_DND55.filter(
        (d) => d.id === "dote_don_recuperacion" || d.id === "dote_don_recuperacion_vitalidad"
      );
      // Debe ser exactamente 1 en el catálogo/selector desplegable
      expect(dotesRecuperacionEnCatalogo.length).toBe(1);
      expect(dotesRecuperacionEnCatalogo[0].nombre).toBe("Don de la Recuperación");
      expect(dotesRecuperacionEnCatalogo[0].rasgosAdicionales).toBeDefined();
      expect(dotesRecuperacionEnCatalogo[0].rasgosAdicionales?.length).toBe(1);

      const complementario = dotesRecuperacionEnCatalogo[0].rasgosAdicionales![0];
      expect(complementario.id).toBe("dote_don_recuperacion_vitalidad");
      expect(complementario.nombre).toBe("Don de la Recuperación: Vitalidad");
    });

    it("2. Vitalidad posee formulaDados '1d10' y categoría 'curacion' para posibilitar autocuración", () => {
      const doteRecuperacion = DOTES_EPICAS_DND55.find((d) => d.id === "dote_don_recuperacion");
      const vitalidad = doteRecuperacion?.rasgosAdicionales?.[0];
      expect(vitalidad).toBeDefined();
      expect(vitalidad?.formulaDados).toBe("1d10");
      expect(vitalidad?.categoriaMecanica).toBe("curacion");
      expect(vitalidad?.usosMaximos).toBe(10);
      expect(vitalidad?.tipoAccion).toBe("accion_adicional");
    });

    it("3. Don de la Resistencia a Energías posee formulaDados '2d12' para la tirada de Redirigir energía", () => {
      const resistencia = DOTES_EPICAS_DND55.find((d) => d.id === "dote_don_resistencia_energias");
      expect(resistencia).toBeDefined();
      expect(resistencia?.formulaDados).toBe("2d12");
      expect(resistencia?.tipoAccion).toBe("reaccion");
      expect(resistencia?.selectores?.length).toBe(1);
    });

    it("4. Simulación de guardado de Don de la Recuperación genera ambos rasgos en el personaje", () => {
      const dote = DOTES_EPICAS_DND55.find((d) => d.id === "dote_don_recuperacion")!;
      const rasgoPrincipal = instanciarDoteComoRasgo(dote.id);
      const rasgosAdicionalesGenerados: RasgoPersonaje[] = (dote.rasgosAdicionales || []).map((rad) => ({
        id: rad.id,
        nombre: rad.nombre,
        descripcion: rad.descripcion,
        origen: "dote",
        fuente: rad.fuente || "PHB 2024",
        tipoAccion: rad.tipoAccion || "accion_adicional",
        tieneUsosLimitados: Boolean(rad.tieneUsosLimitados),
        usosMaximos: rad.usosMaximos || 1,
        usosRestantes: rad.usosMaximos || 1,
        recuperacion: rad.recuperacion || "descanso_largo",
        formulaDados: rad.formulaDados,
        categoriaMecanica: rad.categoriaMecanica,
        personalizado: true,
        activo: true,
        notas: ""
      }));

      const pj = crearPersonajeEpico();
      const todosLosRasgos = [...pj.rasgos, rasgoPrincipal, ...rasgosAdicionalesGenerados];
      const pjActualizado = { ...pj, rasgos: todosLosRasgos };

      expect(pjActualizado.rasgos.length).toBe(2);
      expect(pjActualizado.rasgos.some((r) => r.id === "dote_don_recuperacion")).toBe(true);
      const rasgoVit = pjActualizado.rasgos.find((r) => r.id === "dote_don_recuperacion_vitalidad");
      expect(rasgoVit).toBeDefined();
      expect(rasgoVit?.formulaDados).toBe("1d10");
      expect(rasgoVit?.categoriaMecanica).toBe("curacion");
    });

    it("5. normalizarFormulaDados preserva '1d10' y no degrada a '1d20' ante nombres con dos puntos", () => {
      // Caso 1: Cadena con dos puntos en el nombre del rasgo
      const formulaConSubtitulo = "!Don de la Recuperación: Vitalidad:1d10";
      const normalizada1 = normalizarFormulaDados(formulaConSubtitulo);
      expect(normalizada1).toContain("1d10");
      expect(normalizada1).not.toContain("1d20");

      // Caso 2: Cadena con dos puntos sanitizados como guion
      const formulaSanitizada = "!Don de la Recuperación - Vitalidad:1d10";
      const normalizada2 = normalizarFormulaDados(formulaSanitizada);
      expect(normalizada2).toBe("Don de la Recuperacion - Vitalidad:1d10");
    });
  });
});
