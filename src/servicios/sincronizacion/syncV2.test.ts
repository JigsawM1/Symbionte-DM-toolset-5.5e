import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  calcularAbsorcionDeltaVida,
} from "./absorbenteDeltasVida";
import {
  emitirHolaSync,
  emitirEstadoPJSync,
  reiniciarSesionMotorSyncV2,
  procesarEventoSyncV2,
} from "./motorEventosSync";
import {
  autorizarMensajeSyncV2,
  invalidarAutoridadSync,
} from "./autoridadSync";
import {
  LIMITE_SEGURO_PAQUETE_SYNC,
  VERSION_PROTOCOLO_SYNC_V2,
  type MensajeSyncV2,
} from "@/tipos/protocoloSync";
import { usarAlmacenDM, type CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import { ts } from "@/utiles/TaleSpireAdapter";
import type { FragmentoCliente, InfoCliente, FragmentoOId } from "@/tipos/talespire";
import { EsquemaAcompanantePersonaje } from "@/tipos/personaje";

const esperarSync = () => new Promise((resolve) => setTimeout(resolve, 25));

describe("Sync v2 — Suite Exhaustiva de Regresión Permanente (Hallazgos 1 al 9)", () => {
  const paquetesEnviados: string[] = [];

  // Configuración de clientes para autorización real
  const clientesRegistrados = new Map<string, InfoCliente>();
  const miniaturasPorJugador = new Map<string, string[]>();

  beforeEach(() => {
    paquetesEnviados.length = 0;
    clientesRegistrados.clear();
    miniaturasPorJugador.clear();
    invalidarAutoridadSync();
    reiniciarSesionMotorSyncV2();

    // Mock realista de TaleSpireAdapter a nivel transporte y datos nativos
    vi.spyOn(ts.sync, "send").mockImplementation(async (str: string) => {
      paquetesEnviados.push(str);
      return true;
    });

    vi.spyOn(ts.clients, "getMoreInfo").mockImplementation(async (ids: string[]) => {
      return ids.map((id) => clientesRegistrados.get(id)).filter(Boolean) as InfoCliente[];
    });

    vi.spyOn(ts.creatures, "getCreaturesOwnedByPlayer").mockImplementation(
      async (playerFragmentOrId: FragmentoOId) => {
        const playerId = typeof playerFragmentOrId === "string" ? playerFragmentOrId : playerFragmentOrId.id;
        const minis = miniaturasPorJugador.get(playerId) || [];
        return minis.map((mId) => ({ id: mId, name: mId }));
      }
    );

    vi.spyOn(ts.clients, "obtenerPlayerId").mockImplementation(async () => "jugador-1");

    // Registro de identidades típicas
    clientesRegistrados.set("cliente-dm", {
      id: "cliente-dm",
      player: { id: "jugador-dm", name: "Dungeon Master" },
      clientMode: "gm",
    });

    clientesRegistrados.set("cliente-pj1", {
      id: "cliente-pj1",
      player: { id: "jugador-1", name: "Jugador 1" },
      clientMode: "player",
    });
    miniaturasPorJugador.set("jugador-1", [
      "mini-pj-1",
      "mini-soberano",
      "mini-guardabosques",
      "mini-mago",
      "mini-concentrado",
      "mini-uuid-abcdef01-2345-6789-abcd-ef0123456789",
      "mini-acomp-familiar-extenso-12345",
    ]);

    clientesRegistrados.set("cliente-espectador", {
      id: "cliente-espectador",
      player: { id: "jugador-esp", name: "Espectador" },
      clientMode: "spectator",
    });

    // Estado inicial limpio del almacén DM
    usarAlmacenDM.setState({
      esGM: false,
      aplicandoSync: false,
      discrepanciaVitalidadPendiente: null,
      notificaciones: [],
      colaIniciativa: [],
      personajes: [],
      rondaActual: 1,
      indiceTurnoActivo: 0,
    });
  });

  // =========================================================================
  // HALLAZGO 1 (P1): Mensajes sin identidad o identidad incompleta rechazados
  // =========================================================================
  describe("Hallazgo 1 (P1): Exigencia estricta de identidad del remitente", () => {
    it("rechaza mensaje si falta fromClient por completo y no muta el estado (ronda se mantiene en 1)", async () => {
      const msgMeta: MensajeSyncV2 = {
        v: VERSION_PROTOCOLO_SYNC_V2,
        s: "ses-maliciosa",
        t: "META_COMBATE",
        r: 99,
        idx: 0,
        vPorcentaje: false,
      };

      const procesado = await procesarEventoSyncV2(msgMeta, undefined);

      expect(procesado).toBe(false);
      expect(usarAlmacenDM.getState().rondaActual).toBe(1);
    });

    it("rechaza mensaje si fromClient tiene id pero falta player o player.id", async () => {
      const msgMeta: MensajeSyncV2 = {
        v: VERSION_PROTOCOLO_SYNC_V2,
        s: "ses-maliciosa",
        t: "META_COMBATE",
        r: 99,
        idx: 0,
        vPorcentaje: false,
      };

      const procesadoSinPlayer = await procesarEventoSyncV2(
        msgMeta,
        { id: "cliente-anonimo" } as FragmentoCliente
      );
      expect(procesadoSinPlayer).toBe(false);

      const procesadoPlayerIdVacio = await procesarEventoSyncV2(
        msgMeta,
        { id: "cliente-anonimo", player: { id: "", name: "Sin Nombre" } }
      );
      expect(procesadoPlayerIdVacio).toBe(false);
      expect(usarAlmacenDM.getState().rondaActual).toBe(1);
    });
  });

  // =========================================================================
  // HALLAZGO 2 (P1): HOLA con ficha verifica propiedad y previene sobrescritura
  // =========================================================================
  describe("Hallazgo 2 (P1): Autorización estricta de fichas en HOLA", () => {
    it("rechaza HOLA si adjunta una ficha sin miniatura (pj.m ausente) intentando sobrescribir un PJ", async () => {
      const remitenteJugador: FragmentoCliente = {
        id: "cliente-pj1",
        player: { id: "jugador-1", name: "Jugador 1" },
      };

      // Ficha con ID ajeno, sin miniatura (m = undefined) y p obligatoria
      const msgHolaConFichaSinMini: MensajeSyncV2 = {
        v: VERSION_PROTOCOLO_SYNC_V2,
        s: "ses-pj1",
        t: "HOLA",
        pj: {
          id: "pj-ajeno",
          n: "Personaje Ajeno",
          va: 1, // Intenta forzar 1 PV
          vm: 30,
          i: 10,
          ca: 15,
          p: [10, 10, 10],
        },
      };

      const autorizado = await autorizarMensajeSyncV2(msgHolaConFichaSinMini, remitenteJugador);
      expect(autorizado).toBe(false);

      const procesado = await procesarEventoSyncV2(msgHolaConFichaSinMini, remitenteJugador);
      expect(procesado).toBe(false);
    });

    it("rechaza HOLA si adjunta una ficha cuya miniatura pertenece a otro jugador", async () => {
      const remitenteJugador: FragmentoCliente = {
        id: "cliente-pj1",
        player: { id: "jugador-1", name: "Jugador 1" },
      };

      // Miniatura que NO está en miniaturasPorJugador("jugador-1")
      const msgHolaMiniAjena: MensajeSyncV2 = {
        v: VERSION_PROTOCOLO_SYNC_V2,
        s: "ses-pj1",
        t: "HOLA",
        pj: {
          id: "pj-victima",
          n: "Victima",
          va: 1,
          vm: 30,
          i: 12,
          ca: 15,
          p: [10, 10, 10],
          m: "mini-de-otro-jugador",
        },
      };

      const autorizado = await autorizarMensajeSyncV2(msgHolaMiniAjena, remitenteJugador);
      expect(autorizado).toBe(false);
    });

    it("permite HOLA legítimo sin ficha para solicitar estado inicial si el cliente no es espectador", async () => {
      const remitenteJugador: FragmentoCliente = {
        id: "cliente-pj1",
        player: { id: "jugador-1", name: "Jugador 1" },
      };

      const msgHolaSinFicha: MensajeSyncV2 = {
        v: VERSION_PROTOCOLO_SYNC_V2,
        s: "ses-pj1",
        t: "HOLA",
      };

      const autorizado = await autorizarMensajeSyncV2(msgHolaSinFicha, remitenteJugador);
      expect(autorizado).toBe(true);
    });

    it("rechaza HOLA de un espectador", async () => {
      const remitenteEspectador: FragmentoCliente = {
        id: "cliente-espectador",
        player: { id: "jugador-esp", name: "Espectador" },
      };

      const msgHolaEspectador: MensajeSyncV2 = {
        v: VERSION_PROTOCOLO_SYNC_V2,
        s: "ses-esp",
        t: "HOLA",
      };

      const autorizado = await autorizarMensajeSyncV2(msgHolaEspectador, remitenteEspectador);
      expect(autorizado).toBe(false);
    });
  });

  // =========================================================================
  // HALLAZGO 3 (P1): Integración limpia, reintentos y deduplicación sin doble daño
  // =========================================================================
  describe("Hallazgo 3 (P1): Flujo coherente de sincronización y deduplicación", () => {
    it("la emisión de saludo inicial emite HOLA v3 hacia TaleSpire", async () => {
      const pj = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-1",
        idMiniaturaTS: "mini-pj-1",
        nombre: "Valeros",
      };

      await emitirHolaSync(pj, []);
      expect(paquetesEnviados.length).toBeGreaterThanOrEqual(1);

      const msg = JSON.parse(paquetesEnviados[0]);
      expect(msg.v).toBe(VERSION_PROTOCOLO_SYNC_V2);
      expect(msg.t).toBe("HOLA");
      expect(msg.pj?.id).toBe("pj-1");
    });

    it("un micro-evento DELTA_VIDA duplicado no aplica el daño dos veces gracias al cmdId", async () => {
      const pjLocal = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-1",
        idMiniaturaTS: "mini-pj-1",
        nombre: "Valeros",
        hpActual: 30,
        hpMaximo: 30,
        hpTemporal: 0,
      };

      usarAlmacenDM.setState({
        esGM: false,
        personajes: [pjLocal],
        colaIniciativa: [
          {
            id: "mini-pj-1",
            idPersonajeDuenio: "pj-1",
            nombre: "Valeros",
            iniciativa: 12,
            vidaActual: 30,
            vidaMaxima: 30,
            vidaTemporal: 0,
            ca: 16,
            condiciones: [],
            efectos: [],
            bonificadorIniciativa: 1,
            esMonstruo: false,
            velocidad: "30 pies",
          },
        ],
      });

      const msgDelta: MensajeSyncV2 = {
        v: VERSION_PROTOCOLO_SYNC_V2,
        s: "ses-dm",
        t: "DELTA_VIDA",
        cmdId: "cmd-dedup-1",
        idObjetivo: "pj-1",
        delta: 10,
        tipo: "dano",
      };

      const fromDM = { id: "cliente-dm", player: { id: "jugador-dm", name: "DM" } };
      await procesarEventoSyncV2(msgDelta, fromDM);

      expect(usarAlmacenDM.getState().personajes[0].hpActual).toBe(20);

      // Segundo envío con el mismo cmdId (duplicado en la red)
      await procesarEventoSyncV2(msgDelta, fromDM);

      // No se aplica el daño por segunda vez
      expect(usarAlmacenDM.getState().personajes[0].hpActual).toBe(20);
    });
  });

  // =========================================================================
  // HALLAZGO 4 (P1): El daño al PJ no afecta a sus acompañantes
  // =========================================================================
  describe("Hallazgo 4 (P1): Distinción estricta entre PJ y acompañantes", () => {
    it("daño dirigido al PJ no reduce los PV del acompañante en cola ni en ficha", async () => {
      const acompanante = EsquemaAcompanantePersonaje.parse({
        id: "acomp-lobo",
        nombre: "Lobo Fiel",
        idPlantilla: "plantilla-lobo",
        vidaActual: 15,
        vidaMaxima: 15,
        vidaTemporal: 0,
        ca: 13,
        iniciativa: 14,
        idMiniaturaTS: "mini-lobo",
      });

      const pjConAcomp = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-guardabosques",
        idMiniaturaTS: "mini-guardabosques",
        nombre: "Alisa",
        hpActual: 35,
        hpMaximo: 35,
        hpTemporal: 0,
        acompanantes: [acompanante],
      };

      const criaturaPJ: CriaturaIniciativa = {
        id: "mini-guardabosques",
        idPersonajeDuenio: "pj-guardabosques",
        nombre: "Alisa",
        iniciativa: 16,
        vidaActual: 35,
        vidaMaxima: 35,
        vidaTemporal: 0,
        ca: 15,
        condiciones: [],
        efectos: [],
        bonificadorIniciativa: 2,
        esMonstruo: false,
        velocidad: "30 pies",
      };

      const criaturaAcomp: CriaturaIniciativa = {
        id: "mini-lobo",
        idPersonajeDuenio: "pj-guardabosques",
        idAcompanante: "acomp-lobo",
        esAcompanante: true,
        nombre: "Lobo Fiel",
        iniciativa: 14,
        vidaActual: 15,
        vidaMaxima: 15,
        vidaTemporal: 0,
        ca: 13,
        condiciones: [],
        efectos: [],
        bonificadorIniciativa: 2,
        esMonstruo: false,
        velocidad: "40 pies",
      };

      usarAlmacenDM.setState({
        esGM: false,
        personajes: [pjConAcomp],
        colaIniciativa: [criaturaPJ, criaturaAcomp],
      });

      // El DM envía 10 de daño dirigido al PJ dueño
      const msgDanoPJ: MensajeSyncV2 = {
        v: VERSION_PROTOCOLO_SYNC_V2,
        s: "ses-dm",
        t: "DELTA_VIDA",
        cmdId: "cmd-dano-pj",
        idObjetivo: "pj-guardabosques",
        delta: 10,
        tipo: "dano",
      };

      const fromDM = { id: "cliente-dm", player: { id: "jugador-dm", name: "DM" } };
      await procesarEventoSyncV2(msgDanoPJ, fromDM);

      const estado = usarAlmacenDM.getState();
      const pj = estado.personajes[0];
      const acomp = pj.acompanantes?.[0];
      const cPJ = estado.colaIniciativa.find((c) => c.id === "mini-guardabosques");
      const cAcomp = estado.colaIniciativa.find((c) => c.id === "mini-lobo");

      // El PJ recibió los 10 de daño
      expect(pj.hpActual).toBe(25);
      expect(cPJ?.vidaActual).toBe(25);

      // El acompañante se mantiene intacto con 15 PV
      expect(acomp?.vidaActual).toBe(15);
      expect(cAcomp?.vidaActual).toBe(15);
    });

    it("daño dirigido al acompañante no reduce los PV del PJ dueño", async () => {
      const acompanante = EsquemaAcompanantePersonaje.parse({
        id: "acomp-familiar",
        nombre: "Búho",
        idPlantilla: "plantilla-buho",
        vidaActual: 8,
        vidaMaxima: 8,
        vidaTemporal: 0,
        ca: 11,
        iniciativa: 10,
        idMiniaturaTS: "mini-buho",
      });

      const pj = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-mago",
        idMiniaturaTS: "mini-mago",
        nombre: "Gale",
        hpActual: 20,
        hpMaximo: 20,
        hpTemporal: 0,
        acompanantes: [acompanante],
      };

      usarAlmacenDM.setState({
        esGM: false,
        personajes: [pj],
        colaIniciativa: [
          {
            id: "mini-mago",
            idPersonajeDuenio: "pj-mago",
            nombre: "Gale",
            iniciativa: 12,
            vidaActual: 20,
            vidaMaxima: 20,
            vidaTemporal: 0,
            ca: 12,
            condiciones: [],
            efectos: [],
            bonificadorIniciativa: 1,
            esMonstruo: false,
            velocidad: "30 pies",
          },
          {
            id: "mini-buho",
            idPersonajeDuenio: "pj-mago",
            idAcompanante: "acomp-familiar",
            esAcompanante: true,
            nombre: "Búho",
            iniciativa: 10,
            vidaActual: 8,
            vidaMaxima: 8,
            vidaTemporal: 0,
            ca: 11,
            condiciones: [],
            efectos: [],
            bonificadorIniciativa: 2,
            esMonstruo: false,
            velocidad: "60 pies",
          },
        ],
      });

      const msgDanoAcomp: MensajeSyncV2 = {
        v: VERSION_PROTOCOLO_SYNC_V2,
        s: "ses-dm",
        t: "DELTA_VIDA",
        cmdId: "cmd-dano-acomp",
        idObjetivo: "acomp-familiar",
        delta: 5,
        tipo: "dano",
      };

      const fromDM = { id: "cliente-dm", player: { id: "jugador-dm", name: "DM" } };
      await procesarEventoSyncV2(msgDanoAcomp, fromDM);

      const estado = usarAlmacenDM.getState();
      expect(estado.personajes[0].hpActual).toBe(20); // Gale intacto
      expect(estado.personajes[0].acompanantes?.[0].vidaActual).toBe(3); // Búho 8 - 5 = 3
      expect(estado.colaIniciativa.find((c) => c.id === "mini-buho")?.vidaActual).toBe(3);
    });
  });

  // =========================================================================
  // HALLAZGO 5 (P1): Presupuesto <= 400 UTF-16, fragmentación y control de error
  // =========================================================================
  describe("Hallazgo 5 (P1): Fragmentación garantizada <= 400 chars y manejo de errores", () => {
    it("fragmenta un mensaje grande (> 500 chars) en paquetes FRAG <= 400 chars UTF-16 y los reensambla", async () => {
      const acompExtenso = EsquemaAcompanantePersonaje.parse({
        id: "acomp-familiar-extenso-12345",
        nombre: "Familiar de pelaje mágico brillante",
        idPlantilla: "plantilla-familiar",
        vidaActual: 12,
        vidaMaxima: 12,
        vidaTemporal: 5,
        ca: 14,
        iniciativa: 15,
        idMiniaturaTS: "mini-acomp-familiar-extenso-12345",
      });

      const pjExtenso = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-uuid-12345678-abcd-ef01-2345-6789abcdef01",
        idMiniaturaTS: "mini-uuid-abcdef01-2345-6789-abcd-ef0123456789",
        nombre: 'Señor "Ágata" el \'Bárbaro Encantado\' & Valiente',
        avatarUrl: "https://ejemplo.com/recursos/avatares/imagenes/resolucion/alta/personaje-epico-guerrero-con-armadura-de-placas.png",
        hpActual: 88,
        hpMaximo: 95,
        hpTemporal: 15,
        condicionesActivas: ["Acelerado", "Bendecido", "Envenenado"],
        efectos: [
          { id: "ef-1", nombre: "Piel pétrea de resistencia suprema", expiraRonda: 5 },
          { id: "ef-2", nombre: "Fuerza de toro ancestral potenciada", expiraRonda: 4 },
          { id: "ef-3", nombre: "Aceleración con reflejos relámpago", expiraRonda: 3 },
          { id: "ef-4", nombre: "Bendición divina de los cielos", expiraRonda: 6 },
        ],
        acompanantes: [acompExtenso],
      };

      const criaturas = [
        {
          id: pjExtenso.idMiniaturaTS,
          idPersonajeDuenio: pjExtenso.id,
          nombre: pjExtenso.nombre,
          iniciativa: 18,
          vidaActual: 88,
          vidaMaxima: 95,
          vidaTemporal: 15,
          ca: 20,
          condiciones: ["Acelerado", "Bendecido"],
          efectos: pjExtenso.efectos,
          bonificadorIniciativa: 3,
          esMonstruo: false,
          velocidad: "40 pies",
        },
      ];

      await emitirEstadoPJSync(pjExtenso, criaturas, "cmd-payload-gigante");

      // Verificamos que se enviaron paquetes y NINGUNO supera los 400 caracteres
      expect(paquetesEnviados.length).toBeGreaterThanOrEqual(2);
      for (const pkt of paquetesEnviados) {
        expect(pkt.length).toBeLessThanOrEqual(LIMITE_SEGURO_PAQUETE_SYNC);
      }

      // Simulamos la recepción de los fragmentos en el DM
      const fromPJ = { id: "cliente-pj1", player: { id: "jugador-1", name: "Jugador 1" } };
      let reensambladoExitoso = false;

      for (const pkt of paquetesEnviados) {
        const parsed = JSON.parse(pkt);
        const resultado = await procesarEventoSyncV2(parsed, fromPJ);
        if (resultado) reensambladoExitoso = true;
      }

      expect(reensambladoExitoso).toBe(true);
    });

    it("gestiona proactivamente fallos de transporte sin lanzar excepciones no controladas", async () => {
      vi.spyOn(ts.sync, "send").mockRejectedValueOnce(new Error("Conexión de TaleSpire caída"));

      const pj = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-1",
        nombre: "Test Error",
      };

      // No debe lanzar excepción no controlada
      await expect(emitirHolaSync(pj, [])).resolves.toBe(false);
    });
  });

  // =========================================================================
  // HALLAZGO 6 (P2): Lote inicial reconstruye páginas fuera de orden
  // =========================================================================
  describe("Hallazgo 6 (P2): Lote inicial resiliente a desorden de páginas", () => {
    it("espera a recibir todas las partes de 1 a total antes de reemplazar la cola cuando parte 2 llega antes que parte 1", async () => {
      const criatura1: CriaturaIniciativa = {
        id: "mini-1",
        nombre: "Criatura 1",
        iniciativa: 18,
        vidaActual: 10,
        vidaMaxima: 10,
        vidaTemporal: 0,
        ca: 12,
        condiciones: [],
        efectos: [],
        bonificadorIniciativa: 1,
        esMonstruo: true,
        velocidad: "30 pies",
      };

      const criatura2: CriaturaIniciativa = {
        id: "mini-2",
        nombre: "Criatura 2",
        iniciativa: 12,
        vidaActual: 14,
        vidaMaxima: 14,
        vidaTemporal: 0,
        ca: 14,
        condiciones: [],
        efectos: [],
        bonificadorIniciativa: 0,
        esMonstruo: true,
        velocidad: "30 pies",
      };

      const parte2: MensajeSyncV2 = {
        v: VERSION_PROTOCOLO_SYNC_V2,
        s: "ses-lote-desorden",
        t: "LOTE_INICIAL",
        parte: 2,
        total: 2,
        r: 1,
        idx: 0,
        vPorcentaje: false,
        criaturas: [
          {
            id: criatura2.id,
            n: criatura2.nombre,
            i: criatura2.iniciativa,
            va: criatura2.vidaActual,
            vm: criatura2.vidaMaxima,
            ca: criatura2.ca,
            mon: true,
          },
        ],
      };

      const parte1: MensajeSyncV2 = {
        v: VERSION_PROTOCOLO_SYNC_V2,
        s: "ses-lote-desorden",
        t: "LOTE_INICIAL",
        parte: 1,
        total: 2,
        r: 1,
        idx: 0,
        vPorcentaje: false,
        criaturas: [
          {
            id: criatura1.id,
            n: criatura1.nombre,
            i: criatura1.iniciativa,
            va: criatura1.vidaActual,
            vm: criatura1.vidaMaxima,
            ca: criatura1.ca,
            mon: true,
          },
        ],
      };

      const fromDM = { id: "cliente-dm", player: { id: "jugador-dm", name: "DM" } };

      // Llega primero la parte 2 de 2
      await procesarEventoSyncV2(parte2, fromDM);

      // La cola aún no debe contener las criaturas porque falta la parte 1
      expect(usarAlmacenDM.getState().colaIniciativa).toHaveLength(0);

      // Ahora llega la parte 1 de 2
      await procesarEventoSyncV2(parte1, fromDM);

      // Ahora el lote está completo y se reconstruyeron ambas criaturas en orden
      const colaFinal = usarAlmacenDM.getState().colaIniciativa;
      expect(colaFinal).toHaveLength(2);
      expect(colaFinal[0].id).toBe("mini-1");
      expect(colaFinal[1].id).toBe("mini-2");
    });
  });

  // =========================================================================
  // HALLAZGO 7 (P2): Concentración calculada con daño total vs absorción
  // =========================================================================
  describe("Hallazgo 7 (P2): Cálculo exacto de concentración con daño íntegro", () => {
    it("daño de 30 con 20 PV temporales absorbe 20 temp, pierde 10 de vida y solicita CD 15", () => {
      const pj = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-concentrado",
        idMiniaturaTS: "mini-concentrado",
        nombre: "Sacerdotisa",
        hpActual: 30,
        hpMaximo: 35,
        hpTemporal: 20,
        concentracionActiva: { hechizoId: "h-bendicion", nombreHechizo: "Bendición" },
      };

      const criatura: CriaturaIniciativa = {
        id: "mini-concentrado",
        idPersonajeDuenio: "pj-concentrado",
        nombre: "Sacerdotisa",
        iniciativa: 15,
        vidaActual: 30,
        vidaMaxima: 35,
        vidaTemporal: 20,
        ca: 16,
        condiciones: ["Concentración"],
        efectos: [],
        bonificadorIniciativa: 1,
        esMonstruo: false,
        velocidad: "30 pies",
      };

      usarAlmacenDM.setState({
        esGM: false,
        personajes: [pj],
        colaIniciativa: [criatura],
        notificaciones: [],
      });

      // El absorbente calcula el impacto con el daño íntegro de 30
      const absorcion = calcularAbsorcionDeltaVida(
        {
          hpActual: pj.hpActual,
          hpMaximo: pj.hpMaximo,
          hpTemporal: pj.hpTemporal,
          tieneConcentracion: true,
          nombreHechizoConcentrado: "Bendición",
        },
        30,
        "dano"
      );

      expect(absorcion.hpTemporal).toBe(0);
      expect(absorcion.hpActual).toBe(20); // 30 - (30 - 20) = 20
      expect(absorcion.cdConcentracionRequerida).toBe(15); // Math.floor(30 / 2) = 15
      expect(absorcion.mensajeConcentracion).toContain("CD 15");
    });

    it("daño de 15 con 20 PV temporales (totalmente absorbido) solicita CD 10", () => {
      const absorcion = calcularAbsorcionDeltaVida(
        {
          hpActual: 30,
          hpMaximo: 35,
          hpTemporal: 20,
          tieneConcentracion: true,
          nombreHechizoConcentrado: "Bendición",
        },
        15,
        "dano"
      );

      expect(absorcion.hpTemporal).toBe(5);
      expect(absorcion.hpActual).toBe(30); // Vida intacta
      expect(absorcion.cdConcentracionRequerida).toBe(10); // Mínimo 10 según D&D 5.5e
      expect(absorcion.mensajeConcentracion).toContain("CD 10");
    });

    it("dañarCriaturaIniciativa transporta el daño íntegro en una sola emisión al ser ejecutado por el DM", () => {
      const criaturaPJ: CriaturaIniciativa = {
        id: "mini-pj-1",
        idPersonajeDuenio: "pj-1",
        nombre: "Valeros",
        iniciativa: 14,
        vidaActual: 30,
        vidaMaxima: 35,
        vidaTemporal: 20,
        ca: 16,
        condiciones: [],
        efectos: [],
        bonificadorIniciativa: 1,
        esMonstruo: false,
        velocidad: "30 pies",
      };

      usarAlmacenDM.setState({
        esGM: true,
        colaIniciativa: [criaturaPJ],
      });

      usarAlmacenDM.getState().dañarCriaturaIniciativa("mini-pj-1", 30);

      // Emite exactamente un delta con el daño completo 30
      expect(paquetesEnviados).toHaveLength(1);
      const msg = JSON.parse(paquetesEnviados[0]);
      expect(msg.t).toBe("DELTA_VIDA");
      expect(msg.delta).toBe(30);
      expect(msg.tipo).toBe("dano");
    });
  });

  // =========================================================================
  // HALLAZGO 8 (P2): Discrepancias de temporales detectadas y resueltas
  // =========================================================================
  describe("Hallazgo 8 (P2): Detección y resolución de discrepancias en vida temporal", () => {
    it("detecta discrepancia cuando la vida actual es igual pero la vida temporal difiere", async () => {
      const pjLocal = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-soberano",
        idMiniaturaTS: "mini-soberano",
        nombre: "Merisiel",
        hpActual: 25,
        hpMaximo: 30,
        hpTemporal: 10, // El jugador tiene 10 PV temporales
      };

      usarAlmacenDM.setState({
        esGM: false,
        personajes: [pjLocal],
        colaIniciativa: [],
      });

      // El DM envía LOTE_INICIAL con misma vida actual (25) pero sin temporales (vt: 0)
      const msgLote: MensajeSyncV2 = {
        v: VERSION_PROTOCOLO_SYNC_V2,
        s: "ses-dm",
        t: "LOTE_INICIAL",
        parte: 1,
        total: 1,
        r: 1,
        idx: 0,
        vPorcentaje: false,
        criaturas: [
          {
            id: "mini-soberano",
            n: "Merisiel",
            i: 18,
            va: 25,
            vm: 30,
            vt: 0,
            ca: 16,
            mon: false,
            duenio: "pj-soberano",
          },
        ],
      };

      const fromDM = { id: "cliente-dm", player: { id: "jugador-dm", name: "DM" } };
      await procesarEventoSyncV2(msgLote, fromDM);

      const estado = usarAlmacenDM.getState();
      expect(estado.discrepanciaVitalidadPendiente).not.toBeNull();
      expect(estado.discrepanciaVitalidadPendiente?.hpLocal).toBe(25);
      expect(estado.discrepanciaVitalidadPendiente?.hpTempLocal).toBe(10);
      expect(estado.discrepanciaVitalidadPendiente?.hpTempRemotoDM).toBe(0);

      // Si el jugador elige "aceptar_dm", adopta los 0 temporales del DM
      estado.resolverDiscrepanciaVitalidad("aceptar_dm");
      expect(usarAlmacenDM.getState().personajes[0].hpTemporal).toBe(0);
    });
  });

  // =========================================================================
  // HALLAZGO 9 (P2): Una única confirmación de emisión sin duplicar desde React
  // =========================================================================
  describe("Hallazgo 9 (P2): Emisión única y no redundante al resolver discrepancia", () => {
    it("al resolver discrepancia eligiendo 'conservar_local', emite exactamente un paquete PJ_ESTADO", async () => {
      const pj = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-soberano",
        idMiniaturaTS: "mini-soberano",
        nombre: "Merisiel",
        hpActual: 28,
        hpMaximo: 30,
        hpTemporal: 5,
      };

      usarAlmacenDM.setState({
        esGM: false,
        personajes: [pj],
        colaIniciativa: [
          {
            id: "mini-soberano",
            idPersonajeDuenio: "pj-soberano",
            nombre: "Merisiel",
            iniciativa: 18,
            vidaActual: 20,
            vidaMaxima: 30,
            vidaTemporal: 0,
            ca: 16,
            condiciones: [],
            efectos: [],
            bonificadorIniciativa: 2,
            esMonstruo: false,
            velocidad: "30 pies",
          },
        ],
        discrepanciaVitalidadPendiente: {
          idPJ: "pj-soberano",
          nombrePJ: "Merisiel",
          hpLocal: 28,
          hpTempLocal: 5,
          hpRemotoDM: 20,
          hpTempRemotoDM: 0,
          timestampDeteccion: Date.now(),
        },
      });

      // Se resuelve la discrepancia
      usarAlmacenDM.getState().resolverDiscrepanciaVitalidad("conservar_local");
      await esperarSync();

      // Debe haber exactamente un paquete emitido a la red (PJ_ESTADO)
      expect(paquetesEnviados).toHaveLength(1);
      const msg = JSON.parse(paquetesEnviados[0]);
      expect(msg.t).toBe("PJ_ESTADO");
      expect(msg.d.va).toBe(28);
    });
  });
});
