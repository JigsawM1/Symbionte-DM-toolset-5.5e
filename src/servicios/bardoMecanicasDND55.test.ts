import { describe, it, expect, beforeEach } from "vitest";
import { obtenerRasgosClaseYSubclase } from "./gestorClases";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { PersonajeJugador } from "@/tipos/personaje";
import type { RasgoPersonaje } from "@/tipos/rasgos";

function crearRasgoMock(parcial: Partial<RasgoPersonaje> & { id: string; nombre: string }): RasgoPersonaje {
  return {
    fuente: "Bardo",
    origen: "clase",
    tipoAccion: "pasivo",
    tieneUsosLimitados: false,
    recuperacion: "ninguno",
    personalizado: false,
    activo: true,
    descripcion: "",
    notas: "",
    ...parcial
  };
}

describe("Bardo D&D 5.5e (PHB 2024) - Mecánicas Declarativas y Subclases Canónicas", () => {
  beforeEach(() => {
    usarAlmacenDM.setState({
      personajes: [],
      idPersonajeActivo: null
    });
  });

  // ───────────────────────────────────────────────────────────
  // FASE 1: CLASE BASE (NIVELES 1 A 20)
  // ───────────────────────────────────────────────────────────
  describe("Fase 1: Clase Base (Niveles 1 a 20)", () => {
    it("Nivel 1: Inspiración bárdica es consumible, escala dados (1d6 a 1d12) y recuperación a nv 5", () => {
      const rasgosNv1 = obtenerRasgosClaseYSubclase("Bardo", 1);
      const inspiracionNv1 = rasgosNv1.find((r) => r.nombre === "Inspiración bárdica");

      expect(inspiracionNv1).toBeDefined();
      expect(inspiracionNv1?.categoriaMecanica).toBe("consumible");
      expect(inspiracionNv1?.tipoAccion).toBe("accion_adicional");
      expect(inspiracionNv1?.tieneUsosLimitados).toBe(true);
      expect(inspiracionNv1?.formulaDados).toBe("1d6");
      expect(inspiracionNv1?.recuperacion).toBe("descanso_largo");
      expect(inspiracionNv1?.tablaProgresion?.columnas).toEqual(["Nivel", "Dado de Inspiración bárdica"]);

      // Escalado de dados por nivel
      const inspiracionNv5 = obtenerRasgosClaseYSubclase("Bardo", 5).find((r) => r.nombre === "Inspiración bárdica");
      expect(inspiracionNv5?.formulaDados).toBe("1d8");
      expect(inspiracionNv5?.recuperacion).toBe("descanso_corto");

      const inspiracionNv10 = obtenerRasgosClaseYSubclase("Bardo", 10).find((r) => r.nombre === "Inspiración bárdica");
      expect(inspiracionNv10?.formulaDados).toBe("1d10");

      const inspiracionNv15 = obtenerRasgosClaseYSubclase("Bardo", 15).find((r) => r.nombre === "Inspiración bárdica");
      expect(inspiracionNv15?.formulaDados).toBe("1d12");
    });

    it("Nivel 1: Lanzamiento de conjuros es pasivo_permanente sin contadores de usos artificiales", () => {
      const rasgosNv1 = obtenerRasgosClaseYSubclase("Bardo", 1);
      const conjuros = rasgosNv1.find((r) => r.nombre === "Lanzamiento de conjuros");

      expect(conjuros).toBeDefined();
      expect(conjuros?.categoriaMecanica).toBe("pasivo_permanente");
      expect(conjuros?.tipoAccion).toBe("pasivo");
      expect(conjuros?.tieneUsosLimitados).toBe(false);
      expect(conjuros?.recuperacion).toBe("ninguno");
    });

    it("Nivel 2: Pericia y Aprendiz de mucho son pasivo_permanente", () => {
      const rasgosNv2 = obtenerRasgosClaseYSubclase("Bardo", 2);

      const pericia = rasgosNv2.find((r) => r.nombre === "Pericia");
      expect(pericia).toBeDefined();
      expect(pericia?.categoriaMecanica).toBe("pasivo_permanente");
      expect(pericia?.tablaProgresion?.filas[0].nivel).toBe(2);

      const aprendiz = rasgosNv2.find((r) => r.nombre === "Aprendiz de mucho");
      expect(aprendiz).toBeDefined();
      expect(aprendiz?.categoriaMecanica).toBe("pasivo_permanente");
      expect(aprendiz?.efectos?.[0].tipo).toBe("medio_bono_habilidades");
      expect(aprendiz?.efectos?.[0].valor).toBe("mitad_competencia");
    });

    it("Niveles 4, 8, 12 y 16: Mejora de característica se clasifica como selector_informativo con selector de dotes", () => {
      for (const nivel of [4, 8, 12, 16]) {
        const rasgos = obtenerRasgosClaseYSubclase("Bardo", nivel);
        const mejoras = rasgos.filter((r) => r.nombre.includes("Mejora de característica"));
        expect(mejoras.length).toBeGreaterThanOrEqual(1);
        const ultimaMejora = mejoras[mejoras.length - 1];
        expect(ultimaMejora.categoriaMecanica).toBe("selector_informativo");
        expect(ultimaMejora.selectores?.[0].tipoSelector).toBe("dote");
      }
    });

    it("Nivel 5: Fuente de inspiración se fusiona como extensión en Inspiración bárdica", () => {
      const rasgosNv5 = obtenerRasgosClaseYSubclase("Bardo", 5);
      const inspiracion = rasgosNv5.find((r) => r.nombre === "Inspiración bárdica");

      expect(inspiracion).toBeDefined();
      expect(inspiracion?.descripcion).toContain("Fuente de inspiración (Nv. 5)");
      expect(inspiracion?.fuente).toContain("Niveles 1, 5");

      // No debe existir una tarjeta residual independiente de Fuente de inspiración
      const fuenteSeparada = rasgosNv5.find((r) => r.nombre === "Fuente de inspiración");
      expect(fuenteSeparada).toBeUndefined();
    });

    it("Nivel 7: Contraencantamiento es pasivo_permanente con tipoAccion reaccion", () => {
      const rasgosNv7 = obtenerRasgosClaseYSubclase("Bardo", 7);
      const contraencantamiento = rasgosNv7.find((r) => r.nombre === "Contraencantamiento");

      expect(contraencantamiento).toBeDefined();
      expect(contraencantamiento?.categoriaMecanica).toBe("pasivo_permanente");
      expect(contraencantamiento?.tipoAccion).toBe("reaccion");
      expect(contraencantamiento?.tieneUsosLimitados).toBe(false);
    });

    it("Nivel 10: Secretos mágicos es pasivo_permanente", () => {
      const rasgosNv10 = obtenerRasgosClaseYSubclase("Bardo", 10);
      const secretos = rasgosNv10.find((r) => r.nombre === "Secretos mágicos");

      expect(secretos).toBeDefined();
      expect(secretos?.categoriaMecanica).toBe("pasivo_permanente");
    });

    it("Nivel 18: Inspiración superior recarga reactivamente hasta 2 usos de Inspiración bárdica en iniciativa", () => {
      const rasgosNv18 = obtenerRasgosClaseYSubclase("Bardo", 18);
      const superior = rasgosNv18.find((r) => r.nombre === "Inspiración superior");

      expect(superior).toBeDefined();
      expect(superior?.categoriaMecanica).toBe("pasivo_permanente");
      expect(superior?.dispararAlTirarIniciativa).toBe(true);
      expect(superior?.restaurarUsosAlActivar).toEqual({
        idRasgoObjetivo: "Inspiración bárdica",
        hastaCantidad: 2,
        soloSiMenorOIgual: 1
      });

      // Prueba reactiva en Zustand
      const idPj = "pj-bardo-iniciativa-18";
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: idPj,
        nombre: "Bardo Nv 18",
        clase: "Bardo",
        nivel: 18,
        rasgos: [
          crearRasgoMock({
            id: "rasgo_cls_bardo_inspiracion_bardica",
            nombre: "Inspiración bárdica",
            tieneUsosLimitados: true,
            usosMaximos: 5,
            usosRestantes: 0,
            recuperacion: "descanso_corto"
          }),
          crearRasgoMock({
            id: "rasgo_cls_bardo_inspiracion_superior",
            nombre: "Inspiración superior",
            dispararAlTirarIniciativa: true,
            restaurarUsosAlActivar: {
              idRasgoObjetivo: "Inspiración bárdica",
              hastaCantidad: 2,
              soloSiMenorOIgual: 1
            }
          })
        ]
      };

      usarAlmacenDM.setState({
        personajes: [pjInicial],
        idPersonajeActivo: idPj
      });

      const { dispararRasgosIniciativaPersonaje } = usarAlmacenDM.getState();
      dispararRasgosIniciativaPersonaje(idPj);

      const pjTrasIniciativa = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj);
      const inspiracionTras = pjTrasIniciativa?.rasgos?.find((r) => r.nombre === "Inspiración bárdica");
      expect(inspiracionTras?.usosRestantes).toBe(2);
    });

    it("Nivel 19: Don épico es selector_informativo y Nivel 20: Palabras de creación es pasivo_permanente con conjuros", () => {
      const rasgosNv20 = obtenerRasgosClaseYSubclase("Bardo", 20);

      const donEpico = rasgosNv20.find((r) => r.nombre.includes("Don épico"));
      expect(donEpico?.categoriaMecanica).toBe("selector_informativo");
      expect(donEpico?.selectores?.[0].valorActual).toContain("dote_don_recuerdo_conjuros");

      const palabras = rasgosNv20.find((r) => r.nombre === "Palabras de creación");
      expect(palabras?.categoriaMecanica).toBe("pasivo_permanente");
      expect(palabras?.conjurosOtorgados).toEqual(["Palabra de poder: sanar", "Palabra de poder: matar"]);
    });
  });

  // ───────────────────────────────────────────────────────────
  // FASE 2: SUBCLASES CANÓNICAS
  // ───────────────────────────────────────────────────────────
  describe("Fase 2: Subclases Canónicas D&D 5.5e", () => {
    describe("Colegio de la Danza", () => {
      it("integra los 4 rasgos de la subclase y estandariza ligadoA a Inspiración bárdica", () => {
        const rasgos = obtenerRasgosClaseYSubclase("Bardo", 14, "Colegio de la Danza");

        const pies = rasgos.find((r) => r.nombre === "Juego de pies deslumbrante");
        expect(pies?.categoriaMecanica).toBe("pasivo_permanente");
        expect(pies?.efectos?.some((e) => e.tipo === "modificador_ca")).toBe(true);
        expect(pies?.efectos?.some((e) => e.tipo === "ataque_desarmado")).toBe(true);
        expect(pies?.efectos?.some((e) => e.tipo === "ventaja")).toBe(true);

        const mov = rasgos.find((r) => r.nombre === "Movimiento inspirador");
        expect(mov?.categoriaMecanica).toBe("consumible");
        expect(mov?.tipoAccion).toBe("reaccion");
        expect(mov?.ligadoA).toBe("rasgo_cls_bardo_inspiracion_bardica");
        expect(mov?.gastarDePadre).toBe(true);

        const tandem = rasgos.find((r) => r.nombre === "Juego de pies en tándem");
        expect(tandem?.categoriaMecanica).toBe("consumible");
        expect(tandem?.ligadoA).toBe("rasgo_cls_bardo_inspiracion_bardica");
        expect(tandem?.gastarDePadre).toBe(true);
        expect(tandem?.heredarDadosPadre).toBe(true);

        const evasion = rasgos.find((r) => r.nombre === "Evasión líder");
        expect(evasion?.categoriaMecanica).toBe("pasivo_permanente");
      });
    });

    describe("Colegio del Glamour", () => {
      it("Magia cautivadora es consumible con conjuros, y Manto de inspiración gasta de Inspiración bárdica", () => {
        const rasgos = obtenerRasgosClaseYSubclase("Bardo", 14, "Colegio del Glamour");

        const magia = rasgos.find((r) => r.nombre === "Magia cautivadora");
        expect(magia?.categoriaMecanica).toBe("consumible");
        expect(magia?.tieneUsosLimitados).toBe(true);
        expect(magia?.usosMaximos).toBe(1);
        expect(magia?.conjurosOtorgados).toEqual(["Hechizar persona", "Imagen múltiple"]);

        const manto = rasgos.find((r) => r.nombre === "Manto de inspiración");
        expect(manto?.categoriaMecanica).toBe("consumible");
        expect(manto?.ligadoA).toBe("rasgo_cls_bardo_inspiracion_bardica");
        expect(manto?.gastarDePadre).toBe(true);
        expect(manto?.heredarDadosPadre).toBe(true);

        const majestad = rasgos.find((r) => r.nombre === "Manto de majestad");
        expect(majestad?.categoriaMecanica).toBe("activable");

        const inquebrantable = rasgos.find((r) => r.nombre === "Majestad inquebrantable");
        expect(inquebrantable?.categoriaMecanica).toBe("activable");
      });
    });

    describe("Colegio del Conocimiento", () => {
      it("Competencias adicionales es selector_informativo interactivo y Palabras cortantes gasta de padre", () => {
        const rasgos = obtenerRasgosClaseYSubclase("Bardo", 14, "Colegio del Conocimiento");

        const comp = rasgos.find((r) => r.nombre === "Competencias adicionales");
        expect(comp?.categoriaMecanica).toBe("selector_informativo");
        expect(comp?.selectores?.[0].maxSelecciones).toBe(3);
        expect(comp?.selectores?.[0].opciones.length).toBe(18);

        const palabras = rasgos.find((r) => r.nombre === "Palabras cortantes");
        expect(palabras?.categoriaMecanica).toBe("consumible");
        expect(palabras?.ligadoA).toBe("rasgo_cls_bardo_inspiracion_bardica");
        expect(palabras?.gastarDePadre).toBe(true);
        expect(palabras?.heredarDadosPadre).toBe(true);

        const descubrimientos = rasgos.find((r) => r.nombre === "Descubrimientos mágicos");
        expect(descubrimientos?.categoriaMecanica).toBe("pasivo_permanente");

        const habilidad = rasgos.find((r) => r.nombre === "Habilidad inigualable");
        expect(habilidad?.categoriaMecanica).toBe("consumible");
        expect(habilidad?.ligadoA).toBe("rasgo_cls_bardo_inspiracion_bardica");
        expect(habilidad?.gastarDePadre).toBe(true);
      });
    });

    describe("Colegio del Valor", () => {
      it("Inspiración en combate se consolida como extensión en Inspiración bárdica y Entrenamiento marcial otorga competencias", () => {
        const rasgos = obtenerRasgosClaseYSubclase("Bardo", 14, "Colegio del Valor");

        const inspiracion = rasgos.find((r) => r.nombre === "Inspiración bárdica");
        expect(inspiracion?.descripcion).toContain("Inspiración en combate (Nv. 3)");

        const entrenamiento = rasgos.find((r) => r.nombre === "Entrenamiento marcial");
        expect(entrenamiento?.categoriaMecanica).toBe("pasivo_permanente");
        expect(entrenamiento?.efectos?.length).toBe(3);

        const ataqueExtra = rasgos.find((r) => r.nombre === "Ataque adicional");
        expect(ataqueExtra?.categoriaMecanica).toBe("pasivo_permanente");

        const magia = rasgos.find((r) => r.nombre === "Magia de batalla");
        expect(magia?.categoriaMecanica).toBe("pasivo_permanente");
      });
    });
  });
});
