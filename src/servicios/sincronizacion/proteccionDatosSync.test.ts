import { describe, it, expect, beforeEach } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import type { EstadoIniciativaDM, EstadoCombatePJ } from "@/tipos/sync";
import type { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import { proyectarEstadoCombatePJ } from "./proyeccionEstadoCombate";

function crearCriaturaMock(parcial: Partial<CriaturaIniciativa> & { id: string; nombre: string }): CriaturaIniciativa {
  return {
    iniciativa: 0,
    vidaActual: 10,
    vidaMaxima: 10,
    vidaTemporal: 0,
    ca: 10,
    esMonstruo: false,
    condiciones: [],
    efectos: [],
    velocidad: "30 pies",
    bonificadorIniciativa: 0,
    ...parcial,
  };
}

describe("Protección de Datos en Sincronización (Blindaje Anti-Degradación)", () => {
  beforeEach(() => {
    usarAlmacenDM.setState({
      esGM: false,
      idPersonajeActivo: "pj-valeros",
      personajes: [
        {
          ...PERSONAJE_POR_DEFECTO,
          id: "pj-valeros",
          nombre: "Valeros",
          hpMaximoBase: 48,
          hpMaximo: 48,
          hpActual: 42,
          hpTemporal: 10,
          ca: 18,
          condicionesActivas: ["Invisible"],
          efectosActivos: [
            {
              id: "ef-bendicion",
              nombre: "Bendición",
              expiraRonda: 5,
              concentracion: false,
            },
          ],
          acompanantes: [
            {
              id: "acomp-lobo",
              nombre: "Lobo Espectral",
              idPlantilla: "lobo",
              vidaActual: 22,
              vidaMaxima: 22,
              vidaTemporal: 5,
              ca: 13,
              condiciones: ["Alerta"],
              efectos: [],
              iniciativa: 0,
              idMiniaturaTS: null,
              velocidad: "40 pies",
              movimientoGastado: 0,
              movimientoMaximoTemporal: null,
              tipoTerreno: "normal",
              multiplicadorTerreno: 1,
              ultimaPosicionTS: null,
              ultimoBoardIdTS: null,
              historialMovimiento: [],
            },
          ],
        },
      ],
      colaIniciativa: [],
      timestampsModificacionLocal: {},
    });
  });

  describe("1. Escudo Defensivo en Jugador (aplicarIniciativaDesdeSync)", () => {
    it("no degrada hpMaximo ni hpActual a 10 ante una criatura no inicializada de TaleSpire", () => {
      const snapshotEnFrio: EstadoIniciativaDM = {
        cola: [
          crearCriaturaMock({
            id: "mini-talespire-guid-1",
            nombre: "Valeros",
            iniciativa: 12,
            vidaActual: 10,
            vidaMaxima: 10,
          }),
        ],
        indiceTurnoActivo: 0,
        rondaActual: 1,
        mostrarPorcentajeVidaAJugadores: false,
        metodoVidaMonstruo: "estandar",
      };

      usarAlmacenDM.getState().aplicarIniciativaDesdeSync(snapshotEnFrio);

      const pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.hpMaximo).toBe(48);
      expect(pj.hpActual).toBe(42);
      expect(pj.hpTemporal).toBe(10);
      expect(pj.condicionesActivas).toEqual(["Invisible"]);
      expect(pj.efectosActivos).toHaveLength(1);
      expect(pj.efectosActivos[0].nombre).toBe("Bendición");
    });

    it("aplica daño legítimo infligido por el DM en combate", () => {
      const snapshotDanoDM: EstadoIniciativaDM = {
        cola: [
          crearCriaturaMock({
            id: "mini-talespire-guid-1",
            nombre: "Valeros",
            iniciativa: 12,
            vidaActual: 25,
            vidaMaxima: 48,
            ca: 18,
            condiciones: ["Derribado"],
          }),
        ],
        indiceTurnoActivo: 0,
        rondaActual: 1,
        mostrarPorcentajeVidaAJugadores: false,
        metodoVidaMonstruo: "estandar",
      };

      usarAlmacenDM.getState().aplicarIniciativaDesdeSync(snapshotDanoDM);

      const pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.hpMaximo).toBe(48);
      expect(pj.hpActual).toBe(25);
      expect(pj.condicionesActivas).toEqual(["Derribado"]);
    });

    it("protege a los acompañantes de resetearse a 10 HP o perder estados", () => {
      const snapshotAcompEnFrio: EstadoIniciativaDM = {
        cola: [
          crearCriaturaMock({
            id: "mini-lobo-guid",
            nombre: "Lobo Espectral",
            iniciativa: 10,
            vidaActual: 10,
            vidaMaxima: 10,
            esAcompanante: true,
          }),
        ],
        indiceTurnoActivo: 0,
        rondaActual: 1,
        mostrarPorcentajeVidaAJugadores: false,
        metodoVidaMonstruo: "estandar",
      };

      usarAlmacenDM.getState().aplicarIniciativaDesdeSync(snapshotAcompEnFrio);

      const acomp = usarAlmacenDM.getState().personajes[0].acompanantes?.[0];
      expect(acomp?.vidaMaxima).toBe(22);
      expect(acomp?.vidaActual).toBe(22);
      expect(acomp?.vidaTemporal).toBe(5);
      expect(acomp?.condiciones).toEqual(["Alerta"]);
    });
  });

  describe("2. Corrección de Asimetría en el DM (actualizarPersonajeDesdeSync)", () => {
    it("empareja criatura en la cola del DM por nombre tolerante y actualiza sus valores reales", () => {
      usarAlmacenDM.setState({
        esGM: true,
        colaIniciativa: [
          crearCriaturaMock({
            id: "mini-ts-no-vinculada-guid",
            nombre: "Valeros",
            iniciativa: 12,
            vidaActual: 10,
            vidaMaxima: 10,
            esMonstruo: true,
          }),
        ],
      });

      const dtoJugador: EstadoCombatePJ = {
        id: "pj-valeros",
        nombre: "Valeros",
        iniciativa: 15,
        hpActual: 42,
        hpMaximo: 48,
        hpTemporal: 5,
        ca: 18,
        condiciones: ["Concentrado"],
        efectos: [],
        pasivas: { percepcion: 14, investigacion: 10, perspicacia: 12 },
      };

      usarAlmacenDM.getState().actualizarPersonajeDesdeSync(dtoJugador);

      const criaturaEnCola = usarAlmacenDM.getState().colaIniciativa[0];
      expect(criaturaEnCola.idPersonajeDuenio).toBe("pj-valeros");
      expect(criaturaEnCola.vidaMaxima).toBe(48);
      expect(criaturaEnCola.vidaActual).toBe(42);
      expect(criaturaEnCola.vidaTemporal).toBe(5);
      expect(criaturaEnCola.ca).toBe(18);
      expect(criaturaEnCola.condiciones).toEqual(["Concentrado"]);
      expect(criaturaEnCola.esMonstruo).toBe(false);
    });
  });

  describe("3. Proyección de Iniciativa (proyectarEstadoCombatePJ)", () => {
    it("no fuerza la iniciativa a 0 si la criatura en cola solo tiene el 0 por defecto de TaleSpire", () => {
      usarAlmacenDM.setState({
        colaIniciativa: [
          crearCriaturaMock({
            id: "mini-valeros",
            nombre: "Valeros",
            iniciativa: 0,
            vidaActual: 48,
            vidaMaxima: 48,
            ca: 18,
          }),
        ],
      });

      const pj = usarAlmacenDM.getState().personajes[0];
      const dto = proyectarEstadoCombatePJ(pj);
      expect(dto.iniciativa).toBe(pj.iniciativaBono || 0);
    });

    it("adopta la iniciativa de la cola si esta tiene una tirada real (> 0)", () => {
      usarAlmacenDM.setState({
        colaIniciativa: [
          crearCriaturaMock({
            id: "mini-valeros",
            nombre: "Valeros",
            iniciativa: 19,
            vidaActual: 48,
            vidaMaxima: 48,
            ca: 18,
          }),
        ],
      });

      const pj = usarAlmacenDM.getState().personajes[0];
      const dto = proyectarEstadoCombatePJ(pj);
      expect(dto.iniciativa).toBe(19);
    });
  });
});
