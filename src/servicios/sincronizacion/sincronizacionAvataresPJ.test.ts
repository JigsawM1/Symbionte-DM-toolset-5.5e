import { describe, it, expect, beforeEach } from "vitest";
import {
  serializarEstadoCombatePJ,
  deserializarEstadoCombatePJ,
  serializarIniciativaDM,
  deserializarIniciativaDM,
  type EstadoCombatePJ,
  type EstadoIniciativaDM,
} from "@/tipos/sync";
import { proyectarEstadoCombatePJ } from "./proyeccionEstadoCombate";
import { usarAlmacenDM, type CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador } from "@/tipos/personaje";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";

describe("Sincronización de Retratos (Avatares) de PJs", () => {
  beforeEach(() => {
    usarAlmacenDM.setState({
      personajes: [],
      colaIniciativa: [],
      timestampsModificacionLocal: {},
    });
  });

  describe("Filtro y Proyección (proyectarEstadoCombatePJ)", () => {
    it("incluye avatarUrl si es una URL web válida (https)", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-1",
        nombre: "Aleron",
        avatarUrl: "https://ejemplo.com/retratos/aleron.png",
      };

      const dto = proyectarEstadoCombatePJ(pj);
      expect(dto.avatarUrl).toBe("https://ejemplo.com/retratos/aleron.png");
    });

    it("descarta avatarUrl si es una cadena Base64 para proteger el presupuesto de red", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-2",
        nombre: "Bárbaro",
        avatarUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
      };

      const dto = proyectarEstadoCombatePJ(pj);
      expect(dto.avatarUrl).toBeUndefined();
    });

    it("descarta avatarUrl si está vacío o no es una URL http/https", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-3",
        nombre: "Mago",
        avatarUrl: "",
      };

      const dto = proyectarEstadoCombatePJ(pj);
      expect(dto.avatarUrl).toBeUndefined();
    });
  });

  describe("Serialización Wire de PJs (serializar / deserializar EstadoCombatePJ)", () => {
    it("mapea avatarUrl a la clave compacta 'av' y la reconstruye fielmente", () => {
      const dto: EstadoCombatePJ = {
        id: "pj-1",
        nombre: "Aleron",
        avatarUrl: "https://i.imgur.com/foto123.jpg",
        iniciativa: 15,
        hpActual: 30,
        hpMaximo: 30,
        hpTemporal: 0,
        ca: 16,
        condiciones: [],
        efectos: [],
        pasivas: { percepcion: 12, investigacion: 10, perspicacia: 14 },
      };

      const wire = serializarEstadoCombatePJ(dto);
      expect(wire.av).toBe("https://i.imgur.com/foto123.jpg");

      const reconstruido = deserializarEstadoCombatePJ(wire);
      expect(reconstruido.avatarUrl).toBe("https://i.imgur.com/foto123.jpg");
    });

    it("omite la clave 'av' si el PJ no tiene avatar", () => {
      const dto: EstadoCombatePJ = {
        id: "pj-sin-foto",
        nombre: "SinFoto",
        iniciativa: 10,
        hpActual: 20,
        hpMaximo: 20,
        hpTemporal: 0,
        ca: 10,
        condiciones: [],
        efectos: [],
        pasivas: { percepcion: 10, investigacion: 10, perspicacia: 10 },
      };

      const wire = serializarEstadoCombatePJ(dto);
      expect(wire.av).toBeUndefined();

      const reconstruido = deserializarEstadoCombatePJ(wire);
      expect(reconstruido.avatarUrl).toBeUndefined();
    });
  });

  describe("Iniciativa DM: Exclusividad para PJs (serializarIniciativaDM)", () => {
    it("incluye 'av' únicamente para Personajes Jugadores y lo omite para Monstruos", () => {
      const criaturaPJ: CriaturaIniciativa = {
        id: "pj-1",
        nombre: "Aleron",
        avatarUrl: "https://ejemplo.com/aleron.png",
        iniciativa: 18,
        vidaActual: 30,
        vidaMaxima: 30,
        ca: 16,
        esMonstruo: false,
        bonificadorIniciativa: 3,
        velocidad: "30 pies",
        condiciones: [],
      };

      const criaturaMonstruo: CriaturaIniciativa = {
        id: "mon-1",
        nombre: "Trasgo Capitán",
        avatarUrl: "https://ejemplo.com/trasgo.png", // Aunque tuviera URL, debe excluirse
        iniciativa: 12,
        vidaActual: 21,
        vidaMaxima: 21,
        ca: 15,
        esMonstruo: true,
        bonificadorIniciativa: 2,
        velocidad: "30 pies",
        condiciones: [],
      };

      const estadoDM: EstadoIniciativaDM = {
        cola: [criaturaPJ, criaturaMonstruo],
        indiceTurnoActivo: 0,
        rondaActual: 1,
        mostrarPorcentajeVidaAJugadores: true,
        metodoVidaMonstruo: "estandar",
      };

      const wireDM = serializarIniciativaDM(estadoDM);

      // El PJ sí debe incluir 'av'
      expect(wireDM.c[0].av).toBe("https://ejemplo.com/aleron.png");
      expect(wireDM.c[0].m).toBeUndefined();

      // El Monstruo NO debe incluir 'av'
      expect(wireDM.c[1].av).toBeUndefined();
      expect(wireDM.c[1].m).toBe(true);

      // Deserializar reconstruye el avatar para el jugador y undefined para el monstruo
      const reconstruidoDM = deserializarIniciativaDM(wireDM);
      expect(reconstruidoDM.cola[0].avatarUrl).toBe("https://ejemplo.com/aleron.png");
      expect(reconstruidoDM.cola[1].avatarUrl).toBeUndefined();
    });
  });

  describe("Integración con Almacén DM (actualizarPersonajeDesdeSync)", () => {
    it("asigna avatarUrl a la criatura en cola cuando el DM recibe la sincronización del PJ", () => {
      // 1. DM tiene al PJ en la cola sin avatar inicial
      usarAlmacenDM.setState({
        colaIniciativa: [
          {
            id: "pj-1",
            nombre: "Aleron",
            iniciativa: 15,
            vidaActual: 30,
            vidaMaxima: 30,
            ca: 15,
            esMonstruo: false,
            bonificadorIniciativa: 2,
            velocidad: "30 pies",
            condiciones: [],
          },
        ],
      });

      // 2. Llega DTO del jugador con avatarUrl
      const dtoPJ: EstadoCombatePJ = {
        id: "pj-1",
        nombre: "Aleron",
        avatarUrl: "https://ejemplo.com/aleron_nuevo.png",
        iniciativa: 15,
        hpActual: 25,
        hpMaximo: 30,
        hpTemporal: 0,
        ca: 16,
        condiciones: [],
        efectos: [],
        pasivas: { percepcion: 12, investigacion: 10, perspicacia: 14 },
      };

      usarAlmacenDM.getState().actualizarPersonajeDesdeSync(dtoPJ, "remoto");

      const criaturaEnCola = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === "pj-1");
      expect(criaturaEnCola?.avatarUrl).toBe("https://ejemplo.com/aleron_nuevo.png");
      expect(criaturaEnCola?.vidaActual).toBe(25);
    });
  });
});
