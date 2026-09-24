import { describe, it, expect } from "vitest";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import {
  calcularVelocidadPersonaje,
  obtenerDadosExtraAtaque,
  obtenerCompetenciasExtraRasgos,
  evaluarVentajasDeRasgosEnTirada,
  type ContextoAtaquePersonaje
} from "./evaluadorEfectosRasgos";
import {
  DOTES_GENERALES_Y_EPICAS_DND55,
  DOTES_CANONICAS_DND55
} from "@/constantes/rasgosDND55";

function crearPersonajeBase(parcial: Partial<PersonajeJugador> = {}): PersonajeJugador {
  return {
    id: "pj-test-dotes-lote1",
    nombre: "Héroe Nivel 4",
    nivel: 4,
    clase: "Guerrero",
    clases: [{ id: "c1", nombre: "Guerrero", nivel: 4 }],
    caracteristicas: {
      fuerza: 16,
      destreza: 14,
      constitucion: 14,
      inteligencia: 10,
      sabiduria: 12,
      carisma: 10
    },
    velocidad: {
      caminar: 30,
      planea: false
    },
    hpMaximoBase: 36,
    hpMaximo: 36,
    hpActual: 36,
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
    categoriaMecanica: dote.categoriaMecanica || "pasivo_permanente",
    esActivable: Boolean(dote.esActivable),
    autoDesactivar: Boolean(dote.autoDesactivar),
    activo: true,
    efectos: dote.efectos ? JSON.parse(JSON.stringify(dote.efectos)) : [],
    selectores: dote.selectores ? JSON.parse(JSON.stringify(dote.selectores)) : [],
    notas: "",
    ...modificaciones
  } as RasgoPersonaje;
}

describe("Dotes Generales D&D 5.5e (PHB 2024) - Lote 1/4", () => {
  describe("1. Existencia e Integridad en el Catálogo Canónico Oficial", () => {
    const diezDotesRequeridas = [
      { id: "dote_mejora_caracteristica", nombreEsperado: "Mejora de Característica" },
      { id: "dote_actor", nombreEsperado: "Actor" },
      { id: "dote_atleta", nombreEsperado: "Atleta" },
      { id: "dote_atacante_carga", nombreEsperado: "Atacante a la Carga" },
      { id: "dote_chef", nombreEsperado: "Chef" },
      { id: "dote_experto_ballestas", nombreEsperado: "Experto en Ballestas" },
      { id: "dote_triturador", nombreEsperado: "Triturador" },
      { id: "dote_duelista_defensivo", nombreEsperado: "Duelista Defensivo" },
      { id: "dote_combatiente_dos_armas", nombreEsperado: "Combatiente con Dos Armas" },
      { id: "dote_resistente", nombreEsperado: "Resistente" }
    ];

    for (const doteReq of diezDotesRequeridas) {
      it(`la dote ${doteReq.nombreEsperado} (${doteReq.id}) está presente en DOTES_GENERALES_Y_EPICAS_DND55`, () => {
        const dote = DOTES_GENERALES_Y_EPICAS_DND55.find((d) => d.id === doteReq.id);
        expect(dote, `Debe existir ${doteReq.id}`).toBeDefined();
        expect(dote?.categoria).toBe("general");
        expect(dote?.requisito).toBeDefined();
        expect(dote?.descripcion.length).toBeGreaterThan(20);
        expect(dote?.beneficios.length).toBeGreaterThan(0);
      });

      it(`la dote ${doteReq.nombreEsperado} (${doteReq.id}) está exportada en DOTES_CANONICAS_DND55`, () => {
        const dote = DOTES_CANONICAS_DND55.find((d) => d.id === doteReq.id);
        expect(dote, `Debe existir en catálogo global ${doteReq.id}`).toBeDefined();
      });
    }

    it("la dote Mejora de Característica está marcada como repetible", () => {
      const dote = DOTES_CANONICAS_DND55.find((d) => d.id === "dote_mejora_caracteristica");
      expect(dote?.repetible).toBe(true);
    });

    it("la dote Duelista Defensivo posee tipo de acción reaccion", () => {
      const dote = DOTES_CANONICAS_DND55.find((d) => d.id === "dote_duelista_defensivo");
      expect(dote?.tipoAccion).toBe("reaccion");
    });
  });

  describe("2. Dote Atleta: Velocidad Trepando y Movimiento Especial", () => {
    it("otorga velocidad trepando igual a la velocidad al caminar de forma genérica", () => {
      const rasgoAtleta = instanciarDoteComoRasgo("dote_atleta");
      const personaje = crearPersonajeBase({
        velocidad: { caminar: 30, planea: false },
        rasgos: [rasgoAtleta]
      });

      const vel = calcularVelocidadPersonaje(personaje);
      expect(vel.caminar).toBe(30);
      expect(vel.escalar).toBe(30);
    });

    it("respeta incrementos en la velocidad de caminar al calcular la velocidad trepando", () => {
      const rasgoAtleta = instanciarDoteComoRasgo("dote_atleta");
      const personaje = crearPersonajeBase({
        velocidad: { caminar: 35, planea: false },
        rasgos: [rasgoAtleta]
      });

      const vel = calcularVelocidadPersonaje(personaje);
      expect(vel.caminar).toBe(35);
      expect(vel.escalar).toBe(35);
    });
  });

  describe("3. Dote Atacante a la Carga: Activable y Daño Extra al Arma", () => {
    const contextoCuerpoACuerpo: ContextoAtaquePersonaje = {
      tipo: "arma",
      caracteristica: "fuerza",
      esCuerpoACuerpo: true,
      esDistancia: false
    };

    const contextoDistancia: ContextoAtaquePersonaje = {
      tipo: "arma",
      caracteristica: "destreza",
      esCuerpoACuerpo: false,
      esDistancia: true
    };

    it("está definida como activable en el catálogo canónico", () => {
      const dote = DOTES_CANONICAS_DND55.find((d) => d.id === "dote_atacante_carga");
      expect(dote?.esActivable).toBe(true);
      expect(dote?.categoriaMecanica).toBe("activable");
    });

    it("añade 1d8 a los dados de daño de armas cuerpo a cuerpo cuando está activada (activo: true)", () => {
      const rasgoCarga = instanciarDoteComoRasgo("dote_atacante_carga", { activo: true });
      const personaje = crearPersonajeBase({
        rasgos: [rasgoCarga]
      });

      const dadosExtra = obtenerDadosExtraAtaque(personaje, contextoCuerpoACuerpo);
      expect(dadosExtra.length).toBe(1);
      expect(dadosExtra[0].dados).toBe("1d8");
      expect(dadosExtra[0].origen).toContain("Atacante a la Carga");
    });

    it("NO añade dados extra cuando el rasgo está desactivado (activo: false)", () => {
      const rasgoCarga = instanciarDoteComoRasgo("dote_atacante_carga", { activo: false });
      const personaje = crearPersonajeBase({
        rasgos: [rasgoCarga]
      });

      const dadosExtra = obtenerDadosExtraAtaque(personaje, contextoCuerpoACuerpo);
      expect(dadosExtra.length).toBe(0);
    });

    it("NO añade dados extra a ataques con armas a distancia aunque esté activada", () => {
      const rasgoCarga = instanciarDoteComoRasgo("dote_atacante_carga", { activo: true });
      const personaje = crearPersonajeBase({
        rasgos: [rasgoCarga]
      });

      const dadosExtra = obtenerDadosExtraAtaque(personaje, contextoDistancia);
      expect(dadosExtra.length).toBe(0);
    });
  });

  describe("4. Dote Chef: Competencia Declarativa en Útiles de Cocinero", () => {
    it("otorga competencia en Útiles de cocinero a través de la función genérica obtenerCompetenciasExtraRasgos", () => {
      const rasgoChef = instanciarDoteComoRasgo("dote_chef");
      const personaje = crearPersonajeBase({
        rasgos: [rasgoChef]
      });

      const compExtra = obtenerCompetenciasExtraRasgos(personaje);
      expect(compExtra.herramientas).toBeDefined();
      expect(compExtra.herramientas).toContain("Útiles de cocinero");
    });
  });

  describe("5. Dote Resistente: Ventaja en Salvaciones contra la Muerte", () => {
    it("otorga ventaja en tiradas de salvación contra la muerte de forma genérica", () => {
      const rasgoResistente = instanciarDoteComoRasgo("dote_resistente");
      const personaje = crearPersonajeBase({
        rasgos: [rasgoResistente]
      });

      const evalMuerte = evaluarVentajasDeRasgosEnTirada(personaje, {
        tipoTirada: "salvacion",
        subtipo: "muerte"
      });

      expect(evalMuerte.tieneVentaja).toBe(true);
      expect(evalMuerte.tieneDesventaja).toBe(false);
      expect(evalMuerte.razones.length).toBeGreaterThan(0);
    });

    it("NO otorga ventaja en tiradas de salvación normales de atributos (ej. Fuerza, Destreza)", () => {
      const rasgoResistente = instanciarDoteComoRasgo("dote_resistente");
      const personaje = crearPersonajeBase({
        rasgos: [rasgoResistente]
      });

      const evalFuerza = evaluarVentajasDeRasgosEnTirada(personaje, {
        tipoTirada: "salvacion",
        subtipo: "fuerza"
      });

      expect(evalFuerza.tieneVentaja).toBe(false);
    });
  });

  describe("6. Dotes Informativas del Lote 1/4", () => {
    it("las dotes informativas no inyectan efectos mecánicos no deseados", () => {
      const idsInformativas = [
        "dote_mejora_caracteristica",
        "dote_actor",
        "dote_experto_ballestas",
        "dote_triturador",
        "dote_duelista_defensivo",
        "dote_combatiente_dos_armas"
      ];

      for (const id of idsInformativas) {
        const dote = DOTES_CANONICAS_DND55.find((d) => d.id === id);
        expect(dote).toBeDefined();
        // No deben tener efectos mecánicos automáticos parásitos
        expect(dote?.efectos || []).toHaveLength(0);
      }
    });
  });
});
