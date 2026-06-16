/**
 * Simulador Interactivo de la API de TaleSpire (window.TS)
 *
 * Se encarga de simular de forma reactiva el entorno de TaleSpire
 * cuando ejecutamos la aplicación en un navegador estándar (fuera del juego).
 *
 * Programado 100% en español.
 */

import type {
  TaleSpireAPI,
  ColaIniciativaTS,
  FragmentoCriatura,
  SeleccionCriaturas,
  ResultadosTirada,
  DescriptorTirada,
  GrupoResultadosTirada,
  FragmentoCliente,
  InfoCliente,
  FragmentoJugador,
  FragmentoOId,
  InfoCriatura
} from "../tipos/talespire.d.ts";

// Interfaz para definir la estructura de los callbacks/observables
type SuscriptorFn = (...args: any[]) => void;

class CanalEventosSimulado {
  private suscriptores: Map<string, Set<SuscriptorFn>> = new Map();

  suscribir(evento: string, callback: SuscriptorFn) {
    if (!this.suscriptores.has(evento)) {
      this.suscriptores.set(evento, new Set());
    }
    this.suscriptores.get(evento)!.add(callback);
    return {
      desuscribir: () => {
        this.suscriptores.get(evento)?.delete(callback);
      }
    };
  }

  disparar(evento: string, ...datos: any[]) {
    const callbacks = this.suscriptores.get(evento);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(...datos);
        } catch (e) {
          console.error(`Error al ejecutar suscriptor para el evento "${evento}":`, e);
        }
      });
    }
  }
}

export const canalEventos = new CanalEventosSimulado();

let indiceTurnoActivoSimulado = 0;
let rondaSimulada = 1;

interface CriaturaSimulada {
  id: string;
  name: string;
  kind?: "creature";
  iniciativa: number;
  hp: number;
  maxHp: number;
  ca: number;
}

let colaIniciativaSimulada: CriaturaSimulada[] = [
  { id: "c_jugador_1", name: "Valeros el Guerrero", kind: "creature", iniciativa: 18, hp: 45, maxHp: 45, ca: 18 },
  { id: "c_sim_mon_1", name: "Orco Asaltante", kind: "creature", iniciativa: 14, hp: 15, maxHp: 15, ca: 13 },
  { id: "c_jugador_2", name: "Elysia la Maga", kind: "creature", iniciativa: 11, hp: 28, maxHp: 28, ca: 12 },
  { id: "c_sim_mon_2", name: "Yuan-ti Infiltrator", kind: "creature", iniciativa: 9, hp: 40, maxHp: 40, ca: 14 }
];

let criaturasSeleccionadasSimuladas: string[] = [];

/**
 * Inicializa el simulador de TaleSpire si no estamos corriendo dentro del cliente nativo.
 */
export function inicializarSimulador(): void {
  // Verificamos si ya existe la API de TaleSpire
  if (
    typeof window !== "undefined" &&
    ((window as any).TS || (window as any).com?.bouncyrock?.talespire)
  ) {
    console.log("[TaleSpire] Detectada API nativa en caliente. Simulador omitido.");
    return;
  }

  console.warn(
    "%c[Simulador TaleSpire] Inicializando entorno de simulación local interactivo...",
    "background: #1e1e2e; color: #fab387; font-weight: bold; padding: 4px; border: 1px solid #fab387;"
  );

  // Definimos las estructuras de mock de la API
  const apiSimulada: TaleSpireAPI = {
    // API de depuración nativa
    debug: {
      log: (mensaje: string) => {
        console.log(`%c[TS Debug Log] ${mensaje}`, "color: #a6adc8; border-left: 2px solid #89b4fa; padding-left: 5px;");
      }
    },
    // API de Campañas
    campaigns: {
      whereAmI: async () => {
        return {
          id: "campaña_simulada_123"
        };
      },
      getMoreInfoAboutCurrentCampaign: async () => {
        return {
          id: "campaña_simulada_123",
          name: "La Tumba de la Aniquilación (MOCK)"
        };
      }
    },
    // API de Clientes
    clients: {
      whoAmI: async (): Promise<FragmentoCliente> => {
        return {
          id: "cliente_yo",
          player: {
            id: "jugador_yo",
            name: "DM Simulador"
          }
        };
      },
      getMoreInfo: async (clientFragmentsOrIds: FragmentoOId[]): Promise<InfoCliente[]> => {
        return clientFragmentsOrIds.map((c) => {
          const id = typeof c === "string" ? c : c.id;
          return {
            id,
            clientMode: "gm",
            player: {
              id: "jugador_yo",
              name: "DM Simulador"
            }
          };
        });
      }
    },
    // API de Jugadores
    players: {
      whoAmI: async (): Promise<FragmentoJugador> => {
        return { id: "jugador_yo", name: "DM Simulador" };
      },
      isMe: async (playerFragmentOrId: FragmentoOId): Promise<boolean> => {
        const id = typeof playerFragmentOrId === "string" ? playerFragmentOrId : playerFragmentOrId.id;
        return id === "jugador_yo";
      }
    },
    // API de Iniciativa nativa alineada con activeItemIndex e items de TaleSpire
    initiative: {
      getQueue: async (): Promise<ColaIniciativaTS> => {
        return {
          activeItemIndex: indiceTurnoActivoSimulado,
          items: colaIniciativaSimulada.map((c) => ({
            id: c.id,
            name: c.name,
            kind: "creature"
          }))
        };
      },
      nextTurn: async () => {
        if (colaIniciativaSimulada.length === 0) return {};
        indiceTurnoActivoSimulado++;
        if (indiceTurnoActivoSimulado >= colaIniciativaSimulada.length) {
          indiceTurnoActivoSimulado = 0;
          rondaSimulada++;
        }
        console.log("[Simulador TS] Turno nativo avanzado (nextTurn). Turno activo index:", indiceTurnoActivoSimulado);

        const queue: ColaIniciativaTS = {
          activeItemIndex: indiceTurnoActivoSimulado,
          items: colaIniciativaSimulada.map((c) => ({
            id: c.id,
            name: c.name,
            kind: "creature"
          }))
        };
        canalEventos.disparar("cambioIniciativa", { queue });
        return {};
      },
      prevTurn: async () => {
        if (colaIniciativaSimulada.length === 0) return {};
        indiceTurnoActivoSimulado--;
        if (indiceTurnoActivoSimulado < 0) {
          indiceTurnoActivoSimulado = colaIniciativaSimulada.length - 1;
          rondaSimulada = Math.max(1, rondaSimulada - 1);
        }
        console.log("[Simulador TS] Turno nativo retrocedido (prevTurn). Turno activo index:", indiceTurnoActivoSimulado);

        const queue: ColaIniciativaTS = {
          activeItemIndex: indiceTurnoActivoSimulado,
          items: colaIniciativaSimulada.map((c) => ({
            id: c.id,
            name: c.name,
            kind: "creature"
          }))
        };
        canalEventos.disparar("cambioIniciativa", { queue });
        return {};
      },
      onInitiativeEvent: {
        subscribe: (callback: SuscriptorFn) => {
          return canalEventos.suscribir("cambioIniciativa", callback);
        }
      }
    },
    // API de Criaturas y Selección
    creatures: {
      getSelectedCreatures: async (): Promise<FragmentoCriatura[]> => {
        return colaIniciativaSimulada
          .filter((c) => criaturasSeleccionadasSimuladas.includes(c.id))
          .map((c) => ({
            id: c.id
          }));
      },
      getMoreInfo: async (creatureFragmentOrIds: FragmentoOId[]): Promise<InfoCriatura[]> => {
        const idList = creatureFragmentOrIds.map(id => typeof id === "string" ? id : id.id);
        return colaIniciativaSimulada
          .filter((c) => idList.includes(c.id))
          .map((c) => ({
            id: c.id,
            isUnique: true,
            name: c.name,
            nameSet: true,
            link: "",
            position: { locId: 0, x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            boardId: "board_123",
            morphs: [],
            activeMorphIndex: 0,
            hp: { name: "HP", value: c.hp, max: c.maxHp },
            stats: [
              { name: "HP", value: c.hp, max: c.maxHp },
              { name: "AC", value: c.ca, max: c.ca }
            ],
            torchIsOn: false,
            isExplicitlyHidden: false,
            isFlying: false,
            idsOfActivePersistentEmotes: [],
            ownerIds: ["jugador_yo"]
          }));
      },
      onCreatureSelectionChange: {
        subscribe: (callback: SuscriptorFn) => {
          return canalEventos.suscribir("cambioSeleccionCriatura", callback);
        }
      }
    },
    // API de Chat
    chat: {
      send: async (mensaje: string) => {
        console.log(
          `%c[TS Chat] Enviado a board: %c${mensaje}`,
          "color: #cba6f7; font-weight: bold;",
          "color: #cdd6f4;"
        );
        canalEventos.disparar("mensajeEnviado", { mensaje, target: "board" });
        return true;
      },
      multiSend: async (mensaje: string, targets: string[]) => {
        console.log(
          `%c[TS Chat] Enviado a [${targets.join(", ")}]: %c${mensaje}`,
          "color: #cba6f7; font-weight: bold;",
          "color: #cdd6f4;"
        );
        canalEventos.disparar("mensajeEnviado", { mensaje, targets });
        return true;
      },
      sendAsCreature: async (creatureFragmentOrId: FragmentoOId, mensaje: string) => {
        const id = typeof creatureFragmentOrId === "string" ? creatureFragmentOrId : creatureFragmentOrId.id;
        const criatura = colaIniciativaSimulada.find((c) => c.id === id);
        const nombreCriatura = criatura ? criatura.name : "Desconocido";
        console.log(
          `%c[TS Chat] %c${nombreCriatura} %cdice: %c${mensaje}`,
          "color: #cba6f7; font-weight: bold;",
          "color: #a6e3a1; font-weight: bold;",
          "color: #cba6f7;",
          "color: #cdd6f4;"
        );
        return true;
      },
      multiSendAsCreature: async (creatureFragmentOrId: FragmentoOId, mensaje: string, targets: string[]) => {
        const id = typeof creatureFragmentOrId === "string" ? creatureFragmentOrId : creatureFragmentOrId.id;
        const criatura = colaIniciativaSimulada.find((c) => c.id === id);
        const nombreCriatura = criatura ? criatura.name : "Desconocido";
        console.log(
          `%c[TS Chat] %c${nombreCriatura} %cen [${targets.join(", ")}]: %c${mensaje}`,
          "color: #cba6f7; font-weight: bold;",
          "color: #a6e3a1; font-weight: bold;",
          "color: #cba6f7;",
          "color: #cdd6f4;"
        );
        return true;
      }
    },
    // API de LocalStorage
    localStorage: {
      global: {
        setBlob: async (data: string) => {
          window.localStorage.setItem("ts_global_blob", data);
        },
        getBlob: async () => {
          return window.localStorage.getItem("ts_global_blob") || "{}";
        },
        deleteBlob: async () => {
          window.localStorage.removeItem("ts_global_blob");
        }
      },
      campaign: {
        setBlob: async (data: string) => {
          window.localStorage.setItem("ts_campaign_blob", data);
        },
        getBlob: async () => {
          return window.localStorage.getItem("ts_campaign_blob") || "{}";
        },
        deleteBlob: async () => {
          window.localStorage.removeItem("ts_campaign_blob");
        }
      }
    },
    // API de System
    system: {
      clipboard: {
        setText: async (texto: string) => {
          console.log(`%c[TS Clipboard] Texto copiado: %c${texto.substring(0, 50)}...`, "color: #f38ba8", "color: #cdd6f4");
        }
      }
    },
    // API legacy de portapapeles
    clipboard: {
      copyText: async (texto: string) => {
        console.log(`%c[TS Legacy Clipboard] Texto copiado: %c${texto.substring(0, 50)}...`, "color: #f38ba8", "color: #cdd6f4");
      }
    },
    // API de dados nativa simulada
    dice: {
      isValidRollString: (str: string): boolean => {
        if (!str) return false;
        const limpia = str.replace(/\s+/g, "").toLowerCase();
        return /^[+-]?(\d+)?d\d+([+-]\d+)*$/.test(limpia) || /^[+-]?\d+$/.test(limpia);
      },
      makeRollDescriptors: async (rollStr: string): Promise<DescriptorTirada[]> => {
        const grupos = rollStr.split("/");
        return grupos.map((g) => {
          const matchEtiqueta = g.match(/^!?([^:]+):(.*)$/);
          if (matchEtiqueta) {
            return { name: matchEtiqueta[1].trim(), roll: matchEtiqueta[2].trim() };
          }
          return { name: "Tirada", roll: g.trim() };
        });
      },
      putDiceInTray: async (descriptors: DescriptorTirada[], silenceDefaultChatCard: boolean = false): Promise<string> => {
        const mockRollId = `roll_mock_${Date.now()}`;
        console.log(
          `%c[Simulador TS Dice] Dados colocados en bandeja (MOCK). RollId: ${mockRollId} (Silenciar Chat: ${silenceDefaultChatCard})`,
          "color: #fab387; font-weight: bold;",
          descriptors
        );

        // Simular que el usuario lanza físicamente los dados en 3D
        setTimeout(() => {
          console.log(`%c[Simulador TS Dice] Dados se detuvieron. Generando resultados Groups...`, "color: #fab387;");

          const resultsGroups = descriptors.map((desc) => {
            const name = desc.name;
            const formula = desc.roll;

            let total = 0;
            let faces = 20;
            let qty = 1;
            let mod = 0;

            const match = formula.replace(/\s+/g, "").match(/^(\d+)d(\d+)(?:([+-])(\d+))?$/i);
            if (match) {
              qty = parseInt(match[1], 10);
              faces = parseInt(match[2], 10);
              const sign = match[3] || "+";
              mod = match[4] ? parseInt(match[4], 10) : 0;

              let diceSum = 0;
              for (let i = 0; i < qty; i++) {
                diceSum += Math.floor(Math.random() * faces) + 1;
              }
              total = diceSum + (sign === "-" ? -mod : mod);
            } else {
              total = Math.floor(Math.random() * 20) + 1;
            }

            return {
              name,
              result: {
                value: total
              }
            };
          });

          const rollEvent: ResultadosTirada = {
            rollId: mockRollId,
            clientId: "cliente_yo",
            resultsGroups,
            gmOnly: false,
            quiet: silenceDefaultChatCard
          };

          // Disparamos en canal de eventos del simulador
          canalEventos.disparar("resultadosDados", rollEvent);

          // Llamar directamente al callback global de main.tsx si existe
          const windowAlias = window as any;
          if (typeof windowAlias.manejarResultadosDados === "function") {
            windowAlias.manejarResultadosDados(rollEvent);
          }

          // Si no está silenciada, simulamos que TaleSpire publica de forma nativa la tarjeta
          if (!silenceDefaultChatCard) {
            console.log(
              `%c🎲 [TS Native Chat Card] %cTirada Nativa:`,
              "background: #1e1e2e; color: #89b4fa; font-weight: bold; padding: 4px; border-radius: 4px;",
              "color: #cdd6f4;"
            );
            resultsGroups.forEach((g) => {
              const gObj = g as any;
              console.log(`  %c↳ %c${gObj.name}: %c${gObj.result?.value}`, "color: #89b4fa; font-weight: bold;", "color: #cdd6f4;", "color: #f9e2af; font-weight: bold;");
            });
          }
        }, 1000);

        return mockRollId;
      },
      evaluateDiceResultsGroup: async (group: GrupoResultadosTirada): Promise<number> => {
        if (!group || typeof group !== "object") return 0;
        const gObj = group as any;
        if (!gObj.result) return 0;
        if (typeof gObj.result.value === "number") return gObj.result.value;
        if (typeof gObj.result.total === "number") return gObj.result.total;
        return 0;
      },
      sendDiceResult: async (groups: GrupoResultadosTirada[], rollId: string): Promise<void> => {
        console.log(
          `%c🎲 [TS Chat Dice Card - ${rollId}] %cENVIADO AL CHAT:`,
          "background: #1e1e2e; color: #a6e3a1; font-weight: bold; padding: 4px; border-radius: 4px;",
          "color: #cdd6f4; font-weight: bold;"
        );
        groups.forEach((g) => {
          const gObj = g as any;
          console.log(
            `  %c↳ %c${gObj.name}: %c${gObj.result?.value || gObj.result?.total}`,
            "color: #a6e3a1; font-weight: bold;",
            "color: #cdd6f4; font-weight: bold;",
            "color: #f9e2af; font-weight: bold; font-size: 1.1em;"
          );
        });
      },
      onRollResults: {
        subscribe: (callback: SuscriptorFn) => {
          return canalEventos.suscribir("resultadosDados", callback);
        }
      }
    }
  };

  // Asignamos la API al entorno de ventana global
  const windowAlias = window as any;
  windowAlias.TS = apiSimulada;
  windowAlias.com = {
    bouncyrock: {
      talespire: apiSimulada
    }
  };

  // Proveemos utilidades globales del simulador para simular interacciones de mesa desde la consola del navegador
  (window as any).simuladorTS = {
    // Permite al desarrollador simular que se avanza turno en TaleSpire
    siguienteTurno: () => {
      if (colaIniciativaSimulada.length === 0) return;
      const primerElemento = colaIniciativaSimulada.shift()!;
      colaIniciativaSimulada.push(primerElemento);
      console.log("[Simulador TS] Avanzando turno de iniciativa.");
      
      const queue: ColaIniciativaTS = {
        activeItemIndex: indiceTurnoActivoSimulado,
        items: colaIniciativaSimulada.map((c) => ({
          id: c.id,
          name: c.name,
          kind: "creature"
        }))
      };
      canalEventos.disparar("cambioIniciativa", { queue });
    },
    // Permite añadir una criatura a la iniciativa desde la consola
    agregarCriaturaIniciativa: (nombre: string, iniciativa: number, hp: number, ca: number) => {
      const nuevoId = `c_sim_${Date.now()}`;
      colaIniciativaSimulada.push({
        id: nuevoId,
        name: nombre,
        kind: "creature",
        iniciativa,
        hp,
        ca,
        maxHp: hp
      });
      // Ordenamos la iniciativa descendentemente
      colaIniciativaSimulada.sort((a, b) => b.iniciativa - a.iniciativa);
      console.log(`[Simulador TS] Criatura "${nombre}" añadida a la iniciativa.`);
      
      const queue: ColaIniciativaTS = {
        activeItemIndex: indiceTurnoActivoSimulado,
        items: colaIniciativaSimulada.map((c) => ({
          id: c.id,
          name: c.name,
          kind: "creature"
        }))
      };
      canalEventos.disparar("cambioIniciativa", { queue });
    },
    // Permite simular que el DM selecciona una criatura en el tablero de TaleSpire
    seleccionarCriatura: (id: string) => {
      if (criaturasSeleccionadasSimuladas.includes(id)) {
        criaturasSeleccionadasSimuladas = criaturasSeleccionadasSimuladas.filter((cid) => cid !== id);
        console.log(`[Simulador TS] Criatura con ID "${id}" deseleccionada.`);
      } else {
        criaturasSeleccionadasSimuladas.push(id);
        console.log(`[Simulador TS] Criatura con ID "${id}" seleccionada.`);
      }

      const seleccion: SeleccionCriaturas = {
        creatures: criaturasSeleccionadasSimuladas.map((cid) => ({ id: cid }))
      };

      // Disparar en el canal interno
      canalEventos.disparar("cambioSeleccionCriatura", seleccion);

      // Llamar directamente al callback global de main.tsx si existe
      const windowAlias = window as any;
      if (typeof windowAlias.manejarCambioSeleccionCriatura === "function") {
        windowAlias.manejarCambioSeleccionCriatura(seleccion);
      }
    },
    // Simula una tirada de dados virtuales desde TaleSpire
    lanzarDados: (resultado: number, etiqueta: string = "Ataque") => {
      console.log(`[Simulador TS] Disparando resultado de dados: ${resultado} para "${etiqueta}"`);
      const rollEvent: ResultadosTirada = {
        rollId: `roll_mock_${Date.now()}`,
        clientId: "cliente_yo",
        resultsGroups: [{
          name: etiqueta,
          result: { value: resultado }
        }],
        gmOnly: false,
        quiet: false
      };
      canalEventos.disparar("resultadosDados", rollEvent);
    },
    // Obtener estado actual simulado
    obtenerEstado: () => {
      return {
        colaIniciativa: colaIniciativaSimulada,
        seleccionadas: criaturasSeleccionadasSimuladas
      };
    },
    // Actualizar vida de una criatura simulada
    actualizarVidaCriatura: (id: string, nuevaVida: number) => {
      colaIniciativaSimulada = colaIniciativaSimulada.map((c) => {
        if (c.id === id) {
          const modificado = { ...c, hp: Math.max(0, Math.min(c.maxHp, nuevaVida)) };
          // Disparamos evento de estado modificado de criatura (evento genérico)
          canalEventos.disparar("cambioEstadoCriatura", {
            id,
            name: c.name,
            hp: modificado.hp,
            maxHp: c.maxHp,
            ca: c.ca
          });
          return modificado;
        }
        return c;
      });
    }
  };
}

/**
 * Helper para verificar si estamos corriendo en el entorno simulado.
 */
export function esEntornoSimulado(): boolean {
  return typeof (window as any).simuladorTS !== "undefined";
}
