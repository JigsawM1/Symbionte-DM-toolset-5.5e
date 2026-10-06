import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { BufferChunksIniciativa } from "./bufferChunksIniciativa";
import { GestorReintentosSync } from "./gestorReintentosSync";
import {
  calcularFirmaPJ,
  procesarMensajeSyncEntrante,
} from "@/servicios/sincronizacionSimbiote";
import {
  serializarEstadoCombatePJ,
  deserializarEstadoCombatePJ,
  dividirEnChunksIniciativa,
  type EstadoCombatePJ,
  type WireChunkIniciativa,
  type WireEstadoIniciativaDM,
} from "@/tipos/sync";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import { ts } from "@/utiles/TaleSpireAdapter";

describe("Sincronización Robusta - Validación de Mecanismos Anti-Regresión y Optimización", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    usarAlmacenDM.setState({
      esGM: false,
      idPersonajeActivo: "pj-heroe",
      personajes: [
        {
          ...PERSONAJE_POR_DEFECTO,
          id: "pj-heroe",
          nombre: "Paladín Valeroso",
          hpActual: 30,
          hpMaximo: 50,
          hpTemporal: 0,
          iniciativaBono: 1,
        },
      ],
      colaIniciativa: [],
      timestampsModificacionLocal: {},
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("1. Protección Anti-Regresión Temporal (DM vs Jugador)", () => {
    it("descarta la sobreescritura de HP del DM si el jugador editó su vida dentro de la ventana de protección", () => {
      // 1. El jugador se cura localmente
      const estado = usarAlmacenDM.getState();
      estado.establecerHPActualPersonaje("pj-heroe", 45);

      // Verificamos que se actualizó el HP local y se registró el timestamp
      expect(usarAlmacenDM.getState().personajes[0].hpActual).toBe(45);
      expect(
        usarAlmacenDM.getState().timestampsModificacionLocal["pj-heroe"]
      ).toBeDefined();

      // 2. Llega un snapshot rezagado del DM con HP viejo (30)
      const ahora = Date.now();
      usarAlmacenDM.getState().aplicarIniciativaDesdeSync({
        cola: [
          {
            id: "pj-heroe",
            nombre: "Paladín Valeroso",
            iniciativa: 12,
            vidaActual: 30, // HP viejo en la cola del DM
            vidaMaxima: 50,
            vidaTemporal: 0,
            ca: 18,
            esMonstruo: false,
            condiciones: [],
            efectos: [],
            velocidad: "30 pies",
            bonificadorIniciativa: 1,
            movimientoGastado: 0,
            movimientoMaximoTemporal: null,
            esAcompanante: false,
          },
        ],
        indiceTurnoActivo: 0,
        rondaActual: 1,
        mostrarPorcentajeVidaAJugadores: false,
        metodoVidaMonstruo: "maximo",
        ts: ahora - 500, // Snapshot previo a la modificación local
      });

      // 3. El HP del jugador NO debe haber retrocedido a 30
      const pjPostSync = usarAlmacenDM.getState().personajes[0];
      expect(pjPostSync.hpActual).toBe(45);

      // La cola del combate sí debe reflejar el orden de iniciativa del DM
      expect(usarAlmacenDM.getState().colaIniciativa[0].id).toBe("pj-heroe");
    });

    it("permite la actualización del DM si transcurrió la ventana de protección de 2.500 ms", () => {
      // 1. Modificación local
      usarAlmacenDM.getState().establecerHPActualPersonaje("pj-heroe", 40);
      expect(usarAlmacenDM.getState().personajes[0].hpActual).toBe(40);

      // 2. Avanzar el tiempo 3.000 ms (supera la ventana de 2.500 ms)
      vi.advanceTimersByTime(3000);

      // 3. El DM envía una corrección autoritativa (daño ambiental: 20 HP)
      usarAlmacenDM.getState().aplicarIniciativaDesdeSync({
        cola: [
          {
            id: "pj-heroe",
            nombre: "Paladín Valeroso",
            iniciativa: 12,
            vidaActual: 20,
            vidaMaxima: 50,
            vidaTemporal: 0,
            ca: 18,
            esMonstruo: false,
            condiciones: [],
            efectos: [],
            velocidad: "30 pies",
            bonificadorIniciativa: 1,
            movimientoGastado: 0,
            movimientoMaximoTemporal: null,
            esAcompanante: false,
          },
        ],
        indiceTurnoActivo: 0,
        rondaActual: 1,
        mostrarPorcentajeVidaAJugadores: false,
        metodoVidaMonstruo: "maximo",
        ts: Date.now(),
      });

      // 4. Tras expirar la ventana, se acepta la sincronización autoritativa
      expect(usarAlmacenDM.getState().personajes[0].hpActual).toBe(20);
    });
  });

  describe("2. Firma Limpia del PJ sin campos de movimiento 3D", () => {
    it("genera la misma firma aunque varíen movimientoGastado o movimientoMaximoTemporal", () => {
      const pjBase = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-firma-1",
        nombre: "Explorador Elfo",
        hpActual: 28,
        hpMaximo: 35,
        ca: 16,
        movimientoGastado: 0,
        movimientoMaximoTemporal: null as number | null,
      };

      const firmaInicial = calcularFirmaPJ(pjBase);

      // El jugador mueve su miniatura en TaleSpire gastando 15 pies
      const pjConMovimiento = {
        ...pjBase,
        movimientoGastado: 15,
        movimientoMaximoTemporal: 40,
      };

      const firmaPostMovimiento = calcularFirmaPJ(pjConMovimiento);

      // La firma debe ser idéntica para evitar transmisiones espurias
      expect(firmaPostMovimiento).toBe(firmaInicial);

      // Pero si cambia la vida, la firma sí debe cambiar
      const pjConVidaAlterada = {
        ...pjBase,
        hpActual: 20,
      };
      expect(calcularFirmaPJ(pjConVidaAlterada)).not.toBe(firmaInicial);
    });
  });

  describe("3. Desentrelazado de Chunks de Iniciativa por sessionId (sid)", () => {
    it("aísla ráfagas intercaladas y ensambla solo la transmisión correspondiente", () => {
      const buffer = new BufferChunksIniciativa();

      const criatura1 = {
        id: "monstruo-1",
        n: "Goblin",
        i: 15,
        va: 7,
        vm: 7,
        vt: 0,
        ca: 15,
        m: true,
        c: [],
        e: [],
      };
      const criatura2 = {
        id: "monstruo-2",
        n: "Orco",
        i: 12,
        va: 15,
        vm: 15,
        vt: 0,
        ca: 13,
        m: true,
        c: [],
        e: [],
      };

      // Transmisión 1 (sid: 100)
      const chunk1_Sesion1: WireChunkIniciativa = {
        sid: 100,
        chunk: 1,
        total: 2,
        t: 0,
        r: 1,
        v: true,
        mv: "estandar",
        c: [criatura1],
      };

      // Transmisión 2 (sid: 200)
      const chunk1_Sesion2: WireChunkIniciativa = {
        sid: 200,
        chunk: 1,
        total: 2,
        t: 0,
        r: 1,
        v: true,
        mv: "estandar",
        c: [criatura2],
      };
      const chunk2_Sesion2: WireChunkIniciativa = {
        sid: 200,
        chunk: 2,
        total: 2,
        t: 0,
        r: 1,
        v: true,
        mv: "estandar",
        c: [criatura1],
      };

      // Se recibe el primer chunk de la sesión 1
      const res1 = buffer.registrarChunk(chunk1_Sesion1);
      expect(res1).toBeNull();
      expect(buffer.obtenerSesionActiva()).toBe(100);

      // Se intercala el primer chunk de la sesión 2 (más reciente) -> descarta la sesión 1
      const res2 = buffer.registrarChunk(chunk1_Sesion2);
      expect(res2).toBeNull();
      expect(buffer.obtenerSesionActiva()).toBe(200);

      // Se completa la sesión 2
      const resCompleto = buffer.registrarChunk(chunk2_Sesion2);
      expect(resCompleto).not.toBeNull();
      expect(resCompleto).toHaveLength(2);
      expect(resCompleto?.[0].sid).toBe(200);
      expect(resCompleto?.[1].sid).toBe(200);
    });

    it("descarta chunks de sesiones previas que lleguen retrasadas", () => {
      const buffer = new BufferChunksIniciativa();

      // Sesión 300 activa
      buffer.registrarChunk({
        sid: 300,
        chunk: 1,
        total: 2,
        t: 0,
        r: 1,
        v: true,
        mv: "estandar",
        c: [],
      });

      // Llega un chunk rezagado de una sesión 250 anterior
      const resultadoViejo = buffer.registrarChunk({
        sid: 250,
        chunk: 2,
        total: 2,
        t: 0,
        r: 1,
        v: true,
        mv: "estandar",
        c: [],
      });

      expect(resultadoViejo).toBeNull();
      expect(buffer.obtenerSesionActiva()).toBe(300);
    });

    it("dividirEnChunksIniciativa incluye el mismo sid en todos los fragmentos", () => {
      const wireDM: WireEstadoIniciativaDM = {
        t: 0,
        r: 1,
        v: true,
        mv: "estandar",
        c: Array.from({ length: 12 }, (_, i) => ({
          id: `criatura-${i}`,
          n: `Enemigo de prueba largo ${i}`,
          i: 10 + i,
          va: 50,
          vm: 50,
          vt: 0,
          ca: 15,
          m: true,
          c: [],
          e: [],
          vel: "30 pies",
        })),
      };

      const chunks = dividirEnChunksIniciativa(wireDM, 250);
      expect(chunks.length).toBeGreaterThan(1);

      const sidPrimerChunk = chunks[0].sid;
      expect(sidPrimerChunk).toBeGreaterThan(0);
      for (const ch of chunks) {
        expect(ch.sid).toBe(sidPrimerChunk);
      }
    });
  });

  describe("4. Reintentos de REQ y Seguimiento ACK", () => {
    it("el gestor de reintentos ejecuta backoff para REQ y cancela al recibir estado", () => {
      const gestor = new GestorReintentosSync();
      const fnEmisionReq = vi.fn();

      gestor.iniciarReintentosREQ(fnEmisionReq);

      // Primer intento inmediato
      expect(fnEmisionReq).toHaveBeenCalledTimes(1);

      // Avanzamos 1.500 ms (primer escalón de INTERVALOS_BACKOFF_REQ_MS)
      vi.advanceTimersByTime(1500);
      expect(fnEmisionReq).toHaveBeenCalledTimes(2);

      // El DM responde y se cancelan los reintentos
      gestor.cancelarReintentosREQ();

      // Avanzamos más tiempo y verificamos que no se ejecutan más reintentos
      vi.advanceTimersByTime(10000);
      expect(fnEmisionReq).toHaveBeenCalledTimes(2);
    });

    it("registra y confirma ACK de emisiones PJ", () => {
      const gestor = new GestorReintentosSync();
      const fnReintento = vi.fn();

      gestor.registrarEmisionPJ("pj-1", 1000, fnReintento);

      // Confirmamos recepción ACK
      const confirmado = gestor.confirmarACK("pj-1", 1000);
      expect(confirmado).toBe(true);

      // Avanzamos tiempo del timer de reintento (2.000 ms)
      vi.advanceTimersByTime(2500);

      // Al haber recibido ACK, no debe reintentar
      expect(fnReintento).not.toHaveBeenCalled();
    });
  });

  describe("5. Optimización de Pasivas en Payload Wire", () => {
    it("omite las pasivas p cuando incluirPasivas es falso y las incluye cuando es verdadero", () => {
      const dto: EstadoCombatePJ = {
        id: "pj-1",
        nombre: "Clérigo",
        iniciativa: 14,
        hpActual: 20,
        hpMaximo: 25,
        hpTemporal: 0,
        ca: 16,
        condiciones: [],
        efectos: [],
        pasivas: {
          percepcion: 14,
          investigacion: 10,
          perspicacia: 15,
        },
      };

      // 1. Emisión regular durante combate (incluirPasivas = false)
      const wireRegular = serializarEstadoCombatePJ(dto, false);
      expect(wireRegular.p).toBeUndefined();

      // 2. Emisión inicial o completa (incluirPasivas = true)
      const wireConPasivas = serializarEstadoCombatePJ(dto, true);
      expect(wireConPasivas.p).toBeDefined();
      expect(wireConPasivas.p?.[0]).toBe(14);
      expect(wireConPasivas.p?.[1]).toBe(10);
      expect(wireConPasivas.p?.[2]).toBe(15);

      // Deserialización maneja correctamente ambos casos
      const recuperadoRegular = deserializarEstadoCombatePJ(wireRegular);
      expect(recuperadoRegular.pasivas.percepcion).toBe(10); // Valor por defecto seguro

      const recuperadoCompleto = deserializarEstadoCombatePJ(wireConPasivas);
      expect(recuperadoCompleto.pasivas.percepcion).toBe(14);
    });
  });

  describe("6. Confirmación de Recepción ACK por el DM", () => {
    it("el DM responde inmediatamente con un mensaje ACK al procesar un mensaje PJ", () => {
      // Configuramos el almacén como DM
      usarAlmacenDM.setState({
        esGM: true,
        colaIniciativa: [],
      });

      const spySend = vi.spyOn(ts.sync, "send").mockResolvedValue(true);

      const wirePJ = serializarEstadoCombatePJ({
        id: "pj-mago-42",
        nombre: "Mago Arcano",
        iniciativa: 15,
        hpActual: 18,
        hpMaximo: 22,
        hpTemporal: 0,
        ca: 13,
        condiciones: [],
        efectos: [],
        pasivas: { percepcion: 10, investigacion: 10, perspicacia: 10 },
        ts: Date.now(),
      });

      const mensajeWirePJ = {
        v: 1 as const,
        t: "PJ" as const,
        d: wirePJ,
      };

      // El DM procesa el mensaje PJ
      procesarMensajeSyncEntrante({
        datos: mensajeWirePJ,
        strCrudo: JSON.stringify(mensajeWirePJ),
      });

      // Verificamos que el DM envió un mensaje ACK hacia TaleSpire con el id del PJ
      expect(spySend).toHaveBeenCalledWith(
        expect.stringContaining('"t":"ACK"'),
        "board"
      );
      expect(spySend).toHaveBeenCalledWith(
        expect.stringContaining('"id":"pj-mago-42"'),
        "board"
      );
    });
  });
});
