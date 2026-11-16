import { describe, it, expect } from "vitest";
import {
  aplicarDanoACriaturaIndividual,
  obtenerCondicionesVisibles,
  esEfectoConcentracion,
  construirEfectoCombate,
  filtrarCondicionesSolapadasPorEfecto,
  resolverPlantillaCombateCriatura,
  obtenerPercepcionPasivaPlantilla
} from "./utilidadesCombateIniciativa";
import { crearIndiceMonstruos } from "@/servicios/indiceMonstruos";
import { CATALOGO_INVOCACIONES } from "@/servicios/factoriaInvocaciones";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { EsquemaAcompanantePersonaje, type PersonajeJugador } from "@/tipos";
import type { CriaturaIniciativa, MonstruoBase } from "@/almacen/usarAlmacenDM";

describe("utilidadesCombateIniciativa - Pruebas Unitarias", () => {
  describe("aplicarDanoACriaturaIndividual", () => {
    it("absorbe el daño parcial en vidaTemporal sin reducir vidaActual", () => {
      const res = aplicarDanoACriaturaIndividual(
        { vidaActual: 20, vidaMaxima: 25, vidaTemporal: 10 },
        6
      );
      expect(res).toEqual({ vidaActual: 20, vidaTemporal: 4 });
    });

    it("agota vidaTemporal y aplica el excedente sobre vidaActual", () => {
      const res = aplicarDanoACriaturaIndividual(
        { vidaActual: 20, vidaMaxima: 25, vidaTemporal: 5 },
        12
      );
      expect(res).toEqual({ vidaActual: 13, vidaTemporal: 0 });
    });

    it("no permite que vidaActual baje de 0 ante daño letal masivo", () => {
      const res = aplicarDanoACriaturaIndividual(
        { vidaActual: 8, vidaMaxima: 20, vidaTemporal: 2 },
        50
      );
      expect(res).toEqual({ vidaActual: 0, vidaTemporal: 0 });
    });

    it("ignora daño cero o negativo preservando los puntos de vida", () => {
      const res = aplicarDanoACriaturaIndividual(
        { vidaActual: 14, vidaMaxima: 20, vidaTemporal: 3 },
        -5
      );
      expect(res).toEqual({ vidaActual: 14, vidaTemporal: 3 });
    });
  });

  describe("obtenerCondicionesVisibles", () => {
    it("oculta condiciones duplicadas con efectos activos y variantes de Concentración", () => {
      const visibles = obtenerCondicionesVisibles(
        ["Envenenado", "Concentración", "Bendición", "Cansado (Niv. 1)", "Derribado"],
        [
          { id: "ef_concentracion", nombre: "Concentración: Bendición", concentracion: true },
          { id: "ef_cansado", nombre: "Cansado" }
        ]
      );

      expect(visibles).toEqual(["Envenenado", "Bendición", "Derribado"]);
    });

    it("oculta la condición exacta cuando coincide con el nombre base del efecto", () => {
      const visibles = obtenerCondicionesVisibles(
        ["Invisibilidad", "Aturdido"],
        [{ id: "ef_inv", nombre: "Invisibilidad (Conjuro)" }]
      );

      expect(visibles).toEqual(["Aturdido"]);
    });
  });

  describe("construirEfectoCombate y filtrarCondicionesSolapadasPorEfecto", () => {
    it("calcula expiraRonda en efectos normales y filtra la condición equivalente", () => {
      const { efecto, esConcentracion } = construirEfectoCombate("Escudo de Fe (Conjuro)", 10, 3);
      expect(esConcentracion).toBe(false);
      expect(efecto.expiraRonda).toBe(13);
      expect(efecto.concentracion).toBeUndefined();

      const filtradas = filtrarCondicionesSolapadasPorEfecto(
        ["Escudo de Fe", "Envenenado"],
        "Escudo de Fe (Conjuro)",
        esConcentracion
      );
      expect(filtradas).toEqual(["Envenenado"]);
    });

    it("omite expiraRonda en efectos de concentración y limpia condiciones de concentración", () => {
      expect(esEfectoConcentracion("Concentración")).toBe(true);
      const { efecto, esConcentracion } = construirEfectoCombate("Muro de Fuego", 10, 4, {
        concentracion: true
      });
      expect(esConcentracion).toBe(true);
      expect(efecto.expiraRonda).toBeUndefined();
      expect(efecto.concentracion).toBe(true);

      const filtradas = filtrarCondicionesSolapadasPorEfecto(
        ["Concentración", "Cegado"],
        "Muro de Fuego",
        true
      );
      expect(filtradas).toEqual(["Cegado"]);
    });
  });

  describe("resolverPlantillaCombateCriatura y obtenerPercepcionPasivaPlantilla", () => {
    const monstruoGoblin = {
      id: "mon_goblin",
      nombre: "Trasgo Explorador",
      ca: 15,
      vidaMaxima: 14,
      iniciativaBonificador: 2,
      sentidos: { percepcionPasiva: 13 }
    } as unknown as MonstruoBase;

    const indiceMonstruos = crearIndiceMonstruos([monstruoGoblin]);

    it("proyecta una invocación escalable usando el nivel y subtipo del acompañante", () => {
      const plantillaBase = CATALOGO_INVOCACIONES[0];
      const acomp = EsquemaAcompanantePersonaje.parse({
        id: "acomp_inv_1",
        nombre: "Espíritu Invocado",
        idPlantilla: plantillaBase.id,
        idMiniaturaTS: "mini_inv_1",
        vidaActual: 30,
        vidaMaxima: 30,
        ca: 13,
        esInvocacion: true,
        nivelConjuroInvocacion: 5,
        subtipoInvocacion: plantillaBase.subtiposDisponibles?.[0]
      });

      const duenio: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_lanzador",
        clase: "Druida",
        nivel: 9,
        caracteristicas: {
          fuerza: 10,
          destreza: 14,
          constitucion: 14,
          inteligencia: 10,
          sabiduria: 18,
          carisma: 10
        },
        acompanantes: [acomp]
      };

      const criaturaInv = {
        id: "mini_inv_1",
        nombre: "Espíritu Invocado",
        esMonstruo: false,
        idPlantillaAsociada: plantillaBase.id,
        idPersonajeDuenio: duenio.id,
        idAcompanante: acomp.id
      } as unknown as CriaturaIniciativa;

      const proyectada = resolverPlantillaCombateCriatura(criaturaInv, {
        asociacionesFichas: {},
        indiceMonstruos,
        personajes: [duenio],
        baseDatosInvocaciones: [plantillaBase]
      });

      expect(proyectada).not.toBeNull();
      expect(proyectada?.nombre).toContain(plantillaBase.nombre);
    });

    it("resuelve un monstruo desde IndiceMonstruos y extrae percepcionPasiva con fallback seguro", () => {
      const criaturaMon = {
        id: "mini_goblin_1",
        nombre: "Trasgo Explorador 2",
        esMonstruo: true
      } as unknown as CriaturaIniciativa;

      const resuelta = resolverPlantillaCombateCriatura(criaturaMon, {
        asociacionesFichas: {},
        indiceMonstruos,
        personajes: [],
        baseDatosInvocaciones: []
      });

      expect(resuelta?.id).toBe("mon_goblin");
      expect(obtenerPercepcionPasivaPlantilla(resuelta)).toBe(13);
      expect(obtenerPercepcionPasivaPlantilla(null)).toBe(10);

      const criaturaPJ = {
        id: "pj_1",
        nombre: "Héroe",
        esMonstruo: false
      } as unknown as CriaturaIniciativa;

      expect(
        resolverPlantillaCombateCriatura(criaturaPJ, {
          asociacionesFichas: {},
          indiceMonstruos,
          personajes: [],
          baseDatosInvocaciones: []
        })
      ).toBeNull();
    });
  });
});
