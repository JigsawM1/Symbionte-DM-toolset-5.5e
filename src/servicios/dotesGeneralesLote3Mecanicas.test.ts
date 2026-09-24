import { describe, it, expect, vi } from "vitest";
import {
  DOTES_GENERALES_Y_EPICAS_DND55,
  TODAS_LAS_DOTES_CANONICAS_DND55,
  generarOpcionesRituales
} from "@/constantes/dotesConstantes";
import type { RasgoPersonaje } from "@/tipos/rasgos";
import type { PersonajeJugador, AtaquePersonajeCalculado } from "@/tipos";
import {
  obtenerCompetenciasExtraRasgos,
  obtenerLimiteDesArmaduraMedia,
  obtenerDadosExtraCriticoArma,
  obtenerConjurosOtorgadosPorRasgos
} from "./evaluadorEfectosRasgos";
import { resolverOrigenConjuro } from "./resolutorOrigenConjuros";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { ejecutarTiradaCritico } from "./ejecutorTiradasCombate";
import * as moduloLanzadorDados from "@/utiles/lanzadorDados";
import { ejecutarDescansoLargo } from "./procesadorDescansos";

function crearPersonajeBase(overrides: Partial<PersonajeJugador> = {}): PersonajeJugador {
  return {
    id: "pj-test-lote3",
    nombre: "Héroe del Lote 3",
    clase: "Guerrero",
    nivel: 4,
    caracteristicas: {
      fuerza: 16, // Mod +3
      destreza: 16, // Mod +3
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

describe("Dotes Generales Canónicas D&D 5.5e — Lote 3/4", () => {
  const idsLote3 = [
    "dote_entrenamiento_armas_marciales",
    "dote_maestro_armaduras_medias",
    "dote_moderadamente_acorazado",
    "dote_combatiente_montado",
    "dote_observador",
    "dote_perforador",
    "dote_envenenador",
    "dote_resiliente",
    "dote_lanzador_ritual",
    "dote_maestro_armas_asta"
  ];

  it("1. Contrato Canónico: Las 10 dotes del Lote 3/4 están presentes en el catálogo y cumplen especificaciones", () => {
    for (const id of idsLote3) {
      const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === id);
      expect(dote, `La dote con id ${id} debe existir en DOTES_GENERALES_Y_EPICAS_DND55`).toBeDefined();
      expect(dote?.categoria).toBe("general");
      expect(dote?.fuente).toBe("PHB 2024");
      expect(dote?.nombre.trim().length).toBeGreaterThan(0);
      expect(dote?.descripcion.trim().length).toBeGreaterThan(20);
      expect(dote?.beneficios.length).toBeGreaterThanOrEqual(1);

      const enCatalogoGlobal = TODAS_LAS_DOTES_CANONICAS_DND55.find((d) => d.id === id);
      expect(enCatalogoGlobal).toBeDefined();
    }
  });

  describe("2. Entrenamiento con Armas Marciales", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_entrenamiento_armas_marciales");

    it("posee efecto declarativo de competencia con armas marciales", () => {
      const ef = dote?.efectos?.find((e) => e.tipo === "competencia");
      expect(ef).toBeDefined();
      expect(ef?.objetivo).toBe("armas_marciales");
      expect(ef?.valor).toBe("marciales");
    });

    it("otorga competencia efectiva con armas marciales a un personaje", () => {
      const rasgo = instanciarDoteComoRasgo("dote_entrenamiento_armas_marciales");
      const pj = crearPersonajeBase({ rasgos: [rasgo] });
      const comp = obtenerCompetenciasExtraRasgos(pj);
      expect(comp.armasGrupos).toContain("marciales");
    });
  });

  describe("3. Maestro en Armaduras Medias", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_maestro_armaduras_medias");

    it("posee efecto declarativo de limite_des_armadura_media igual a 3", () => {
      const ef = dote?.efectos?.find((e) => e.tipo === "limite_des_armadura_media");
      expect(ef).toBeDefined();
      expect(ef?.valor).toBe(3);
    });

    it("obtenerLimiteDesArmaduraMedia devuelve 3 con la dote activa y 2 por defecto", () => {
      const pjSinDote = crearPersonajeBase();
      expect(obtenerLimiteDesArmaduraMedia(pjSinDote)).toBe(2);

      const rasgo = instanciarDoteComoRasgo("dote_maestro_armaduras_medias");
      const pjConDote = crearPersonajeBase({ rasgos: [rasgo] });
      expect(obtenerLimiteDesArmaduraMedia(pjConDote)).toBe(3);

      // Si el rasgo se desactiva
      rasgo.activo = false;
      expect(obtenerLimiteDesArmaduraMedia(pjConDote)).toBe(2);
    });

    it("permite sumar hasta +3 de Destreza a la CA con armaduras medias si DES >= 16", () => {
      const pjSinDote = crearPersonajeBase({
        caracteristicas: { fuerza: 10, destreza: 16, constitucion: 12, inteligencia: 10, sabiduria: 10, carisma: 10 }
      });
      const limiteSinDote = obtenerLimiteDesArmaduraMedia(pjSinDote);
      const modDesSinDote = Math.min(limiteSinDote, 3);
      expect(modDesSinDote).toBe(2);

      const rasgo = instanciarDoteComoRasgo("dote_maestro_armaduras_medias");
      const pjConDote = crearPersonajeBase({
        caracteristicas: { fuerza: 10, destreza: 16, constitucion: 12, inteligencia: 10, sabiduria: 10, carisma: 10 },
        rasgos: [rasgo]
      });
      const limiteConDote = obtenerLimiteDesArmaduraMedia(pjConDote);
      const modDesConDote = Math.min(limiteConDote, 3);
      expect(modDesConDote).toBe(3);
    });
  });

  describe("4. Moderadamente Acorazado", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_moderadamente_acorazado");

    it("posee efecto declarativo de competencia con armaduras medias", () => {
      const ef = dote?.efectos?.find((e) => e.tipo === "competencia");
      expect(ef).toBeDefined();
      expect(ef?.objetivo).toBe("armaduras_medias");
      expect(ef?.valor).toBe("medias");
    });

    it("concede competencia con armaduras medias al personaje", () => {
      const rasgo = instanciarDoteComoRasgo("dote_moderadamente_acorazado");
      const pj = crearPersonajeBase({ rasgos: [rasgo] });
      const comp = obtenerCompetenciasExtraRasgos(pj);
      expect(comp.armadurasGrupos).toContain("medias");
    });
  });

  describe("5. Combatiente Montado", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_combatiente_montado");

    it("es informativa táctica e incluye todos sus beneficios oficiales", () => {
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.beneficios.some((b) => b.includes("Golpe montado"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.includes("Esquivar de un salto"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.includes("Girar bruscamente"))).toBe(true);
    });
  });

  describe("6. Observador", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_observador");

    it("es informativa táctica e incluye Observador perspicaz y Búsqueda rápida como acción adicional", () => {
      expect(dote?.tipoAccion).toBe("accion_adicional");
      expect(dote?.beneficios.some((b) => b.includes("Observador perspicaz"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.includes("Búsqueda rápida"))).toBe(true);
    });
  });

  describe("7. Perforador", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_perforador");

    it("posee efecto declarativo dado_extra_critico para daño perforante", () => {
      const ef = dote?.efectos?.find((e) => e.tipo === "dado_extra_critico");
      expect(ef).toBeDefined();
      expect(ef?.aplicaA).toBe("perforante");
      expect(ef?.valor).toBe(1);
    });

    it("obtenerDadosExtraCriticoArma devuelve 1 para daño perforante y 0 para otros", () => {
      const rasgo = instanciarDoteComoRasgo("dote_perforador");
      const pj = crearPersonajeBase({ rasgos: [rasgo] });

      expect(obtenerDadosExtraCriticoArma(pj, "perforante")).toBe(1);
      expect(obtenerDadosExtraCriticoArma(pj, "cortante")).toBe(0);
      expect(obtenerDadosExtraCriticoArma(pj, "contundente")).toBe(0);
    });

    it("ejecutarTiradaCritico calcula (x2 + 1) dados en arma perforante (ej. 1d8 -> 3d8)", async () => {
      const rasgo = instanciarDoteComoRasgo("dote_perforador");
      const pj = crearPersonajeBase({ rasgos: [rasgo] });

      const espiaTaleSpire = vi.spyOn(moduloLanzadorDados, "lanzarDadosTaleSpire").mockResolvedValue(undefined as never);

      const ataquePerforante: AtaquePersonajeCalculado = {
        id: "atk-lanza",
        nombre: "Lanza",
        tipo: "Arma",
        tipoAccion: "accion",
        caracteristicaUsada: "fuerza",
        bonoAtaque: 5,
        dadoDano: "1d8+3",
        dadoDanoBase: "1d8",
        modificadorDano: 3,
        esDanoFijo: false,
        tipoDano: "perforante",
        propiedades: ["arrojadiza"],
        tieneTiradaAtaque: true
      };

      await ejecutarTiradaCritico(ataquePerforante, pj, false);

      expect(espiaTaleSpire).toHaveBeenCalled();
      const formulaLanzada = espiaTaleSpire.mock.calls[0][0];
      // 1d8 en crítico habitual es 2d8+3; con Perforador (+1 dado) debe ser 3d8+3
      expect(formulaLanzada).toContain("3d8+3");

      espiaTaleSpire.mockRestore();
    });

    it("ejecutarTiradaCritico no añade dado extra a ataques cortantes o a bonos secundarios de daño", async () => {
      const rasgo = instanciarDoteComoRasgo("dote_perforador");
      const pj = crearPersonajeBase({ rasgos: [rasgo] });

      const espiaTaleSpire = vi.spyOn(moduloLanzadorDados, "lanzarDadosTaleSpire").mockResolvedValue(undefined as never);

      // Arma cortante: 1d8 cortante -> debe ser 2d8+3 sin sumar dado extra
      const ataqueCortante: AtaquePersonajeCalculado = {
        id: "atk-espada",
        nombre: "Espada larga",
        tipo: "Arma",
        tipoAccion: "accion",
        caracteristicaUsada: "fuerza",
        bonoAtaque: 5,
        dadoDano: "1d8+3",
        dadoDanoBase: "1d8",
        modificadorDano: 3,
        esDanoFijo: false,
        tipoDano: "cortante",
        propiedades: ["versatil"],
        tieneTiradaAtaque: true
      };

      await ejecutarTiradaCritico(ataqueCortante, pj, false);
      let formulaLanzada = espiaTaleSpire.mock.calls[0][0];
      expect(formulaLanzada).toContain("2d8+3");
      expect(formulaLanzada).not.toContain("3d8");

      // Arma perforante con daño secundario (ej. Lanza con 1d8 perforante / 1d6 fuego):
      // El 1d8 perforante se convierte en 3d8, pero el 1d6 fuego se queda en 2d6 (sin +1)
      const ataqueCompuesto: AtaquePersonajeCalculado = {
        id: "atk-compuesto",
        nombre: "Lanza Flamígera",
        tipo: "Arma",
        tipoAccion: "accion",
        caracteristicaUsada: "fuerza",
        bonoAtaque: 5,
        dadoDano: "1d8/1d6+3",
        dadoDanoBase: "1d8/1d6",
        modificadorDano: 3,
        esDanoFijo: false,
        tipoDano: "perforante/fuego",
        propiedades: [],
        tieneTiradaAtaque: true
      };

      await ejecutarTiradaCritico(ataqueCompuesto, pj, false);
      formulaLanzada = espiaTaleSpire.mock.calls[1][0];
      expect(formulaLanzada).toContain("3d8+3");
      expect(formulaLanzada).toContain("2d6");
      expect(formulaLanzada).not.toContain("3d6");

      espiaTaleSpire.mockRestore();
    });
  });

  describe("8. Envenenador", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_envenenador");

    it("posee efecto declarativo de competencia con Útiles de envenenador", () => {
      const ef = dote?.efectos?.find((e) => e.tipo === "competencia");
      expect(ef).toBeDefined();
      expect(ef?.objetivo).toBe("herramientas");
      expect(ef?.valor).toBe("Útiles de envenenador");
    });

    it("otorga competencia con Útiles de envenenador al personaje", () => {
      const rasgo = instanciarDoteComoRasgo("dote_envenenador");
      const pj = crearPersonajeBase({ rasgos: [rasgo] });
      const comp = obtenerCompetenciasExtraRasgos(pj);
      expect(comp.herramientas).toContain("Útiles de envenenador");
    });
  });

  describe("9. Resiliente", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_resiliente");

    it("es informativa permanente con beneficios de +1 característica y competencia en salvación", () => {
      expect(dote?.categoriaMecanica).toBe("pasivo_permanente");
      expect(dote?.tipoAccion).toBe("pasivo");
      expect(dote?.beneficios.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("10. Lanzador Ritual", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_lanzador_ritual");

    it("es consumible con 1 uso de Ritual Rápido y recuperación en descanso largo", () => {
      expect(dote?.categoriaMecanica).toBe("consumible");
      expect(dote?.tieneUsosLimitados).toBe(true);
      expect(dote?.usosMaximos).toBe(1);
      expect(dote?.recuperacion).toBe("descanso_largo");
    });

    it("posee selector de Aptitud Mágica y selector múltiple de Rituales de nivel 1", () => {
      const selAptitud = dote?.selectores?.find((s) => s.id === "selector_aptitud_lanzador_ritual");
      expect(selAptitud).toBeDefined();
      expect(selAptitud?.tipo).toBe("unico");

      const selRituales = dote?.selectores?.find((s) => s.id === "selector_rituales_nv1");
      expect(selRituales).toBeDefined();
      expect(selRituales?.tipo).toBe("multiple");
      expect(selRituales?.visualizacion).toBe("lista");
      expect(selRituales?.maxSelecciones).toBe(2);
    });

    it("el selector de rituales escala según el PB del personaje (2 a nv1-4, 3 a nv5-8, etc.)", () => {
      const selRituales = dote?.selectores?.find((s) => s.id === "selector_rituales_nv1");
      expect(selRituales?.escaladoMaxSelecciones).toBeDefined();
      expect(selRituales?.escaladoMaxSelecciones).toEqual([
        { nivelMinimo: 1, valor: 2 },
        { nivelMinimo: 5, valor: 3 },
        { nivelMinimo: 9, valor: 4 },
        { nivelMinimo: 13, valor: 5 },
        { nivelMinimo: 17, valor: 6 }
      ]);
    });

    it("generarOpcionesRituales(1) extrae hechizos de nivel 1 marcados como ritual de all.json", () => {
      const opciones = generarOpcionesRituales(1);
      expect(opciones.length).toBeGreaterThan(0);
      for (const op of opciones) {
        expect(op.descripcion).toContain("Ritual");
      }
    });

    it("Ritual Rápido recupera su uso en descanso largo", () => {
      const rasgo = instanciarDoteComoRasgo("dote_lanzador_ritual", {
        usosRestantes: 0
      });
      const pj = crearPersonajeBase({
        id: "pj-ritual-rest",
        rasgos: [rasgo]
      });

      const resultado = ejecutarDescansoLargo(pj);

      const rasgoActualizado = resultado.personajeActualizado.rasgos?.find((r) => r.id === "dote_lanzador_ritual");
      expect(rasgoActualizado?.usosRestantes).toBe(1);
    });

    it("asigna los rituales seleccionados a conjurosOtorgados y conjurosSiemprePreparados del personaje", () => {
      const rasgo = instanciarDoteComoRasgo("dote_lanzador_ritual");
      const pj = crearPersonajeBase({
        id: "pj-ritual-magia",
        nivel: 4,
        rasgos: [rasgo],
        conjurosSiemprePreparadosIds: [],
        conjurosPreparadosIds: [],
        conjurosConocidosIds: []
      });

      // Configurar el personaje en el almacén de Zustand
      usarAlmacenDM.setState({
        personajes: [pj],
        idPersonajeActivo: pj.id
      });

      // El jugador selecciona dos rituales de nivel 1 en el selector múltiple
      const ritualesSeleccionados = ["h_alarma", "h_detectar-magia"];
      usarAlmacenDM.getState().actualizarSeleccionRasgo(
        pj.id,
        "dote_lanzador_ritual",
        "selector_rituales_nv1",
        ritualesSeleccionados
      );

      const pjActualizado = usarAlmacenDM.getState().personajes.find((p) => p.id === pj.id);
      expect(pjActualizado).toBeDefined();

      const rasgoActualizado = pjActualizado?.rasgos?.find((r) => r.id === "dote_lanzador_ritual");
      expect(rasgoActualizado?.conjurosOtorgados).toEqual(expect.arrayContaining(ritualesSeleccionados));

      // Comprobar que se asignaron a los arrays de conjuros del personaje
      expect(pjActualizado?.conjurosSiemprePreparadosIds).toEqual(expect.arrayContaining(ritualesSeleccionados));
      expect(pjActualizado?.conjurosPreparadosIds).toEqual(expect.arrayContaining(ritualesSeleccionados));
      expect(pjActualizado?.conjurosConocidosIds).toEqual(expect.arrayContaining(ritualesSeleccionados));

      // Comprobar que obtenerConjurosOtorgadosPorRasgos los detecta
      if (pjActualizado) {
        const otorgados = obtenerConjurosOtorgadosPorRasgos(pjActualizado);
        expect(otorgados).toEqual(expect.arrayContaining(ritualesSeleccionados));

        // Comprobar que resolverOrigenConjuro asigna badge 'rasgos'
        const badgeAlarma = resolverOrigenConjuro(pjActualizado, {
          id: "h_alarma",
          nombre: "Alarma",
          nivel: 1,
          escuela: "Abjuracion",
          tiempoLanzamiento: "1 Minuto",
          alcance: "9 m",
          componentesSeleccionados: { verbal: true, somatico: true, material: true },
          duracion: "8 Horas",
          concentracion: false,
          ritual: true,
          descripcion: "Crea una alarma mágica."
        });
        expect(badgeAlarma).toBe("rasgos");
      }
    });

    it("actualiza reactivamente los rituales asignados al modificar la selección", () => {
      const { actualizarSeleccionRasgo } = usarAlmacenDM.getState();
      const idPj = "pj-ritual-magia";

      // Modificamos la selección reemplazando Alarma por Comprensión idiomática
      const nuevosRituales = ["h_detectar-magia", "h_comprension-idiomatica"];
      actualizarSeleccionRasgo(idPj, "dote_lanzador_ritual", "selector_rituales_nv1", nuevosRituales);

      const pjActualizado = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj);
      expect(pjActualizado?.conjurosSiemprePreparadosIds).toContain("h_comprension-idiomatica");
      expect(pjActualizado?.conjurosSiemprePreparadosIds).toContain("h_detectar-magia");
      expect(pjActualizado?.conjurosSiemprePreparadosIds).not.toContain("h_alarma");
    });
  });

  describe("11. Maestro en Armas de Asta", () => {
    const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === "dote_maestro_armas_asta");

    it("es de acción adicional/pasivo y detalla Golpe con asta y Golpe reactivo en beneficios", () => {
      expect(dote?.tipoAccion).toBe("accion_adicional");
      expect(dote?.beneficios.some((b) => b.includes("Golpe con asta"))).toBe(true);
      expect(dote?.beneficios.some((b) => b.includes("Golpe reactivo"))).toBe(true);
    });
  });
});
