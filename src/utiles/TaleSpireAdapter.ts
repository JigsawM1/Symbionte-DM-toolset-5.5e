/**
 * TaleSpireAdapter.ts
 * -------------------
 * Fachada centralizada y segura para interactuar con la API nativa de TaleSpire (window.TS).
 *
 * Delega en submódulos especializados dentro de '@/utiles/talespire/':
 * - dice: motor físico 3D de dados.
 * - chat: mensajería de chat del tablero y criaturas.
 * - sync: canal de sincronización en tiempo real con rate-limiting.
 * - initiative: cola de iniciativa nativa.
 * - creatures: miniaturas de la mesa y resolución de propietarios.
 * - campaigns / units: información de campaña y escala de distancia.
 * - clients / players: identidades locales, modos de vista y verificación de rol GM.
 * - localStorage / system / debug: utilidades del sistema TaleSpire.
 */

import {
  establecerCacheEsGM,
  obtenerTSGlobal,
  TaleSpireDiceAdapter,
  TaleSpireChatAdapter,
  TaleSpireSyncAdapter,
  TaleSpireInitiativeAdapter,
  TaleSpireCampaignsAdapter,
  TaleSpireUnitsAdapter,
  TaleSpirePlayersAdapter,
  TaleSpireClientsAdapter,
  TaleSpireCreaturesAdapter,
  TaleSpireLocalStorageAdapter,
  TaleSpireSystemAdapter,
  TaleSpireDebugAdapter
} from "./talespire";

export { establecerCacheEsGM };

export class TaleSpireAdapter {
  readonly dice = new TaleSpireDiceAdapter();
  readonly chat = new TaleSpireChatAdapter();
  readonly initiative = new TaleSpireInitiativeAdapter();
  readonly campaigns = new TaleSpireCampaignsAdapter();
  readonly units = new TaleSpireUnitsAdapter();
  readonly clients = new TaleSpireClientsAdapter();
  readonly players = new TaleSpirePlayersAdapter();
  readonly creatures = new TaleSpireCreaturesAdapter();
  readonly localStorage = new TaleSpireLocalStorageAdapter();
  readonly system = new TaleSpireSystemAdapter();
  readonly sync = new TaleSpireSyncAdapter();
  readonly debug = new TaleSpireDebugAdapter();

  /**
   * Indica si la API global de TaleSpire está activa e inicializada.
   */
  get estaDisponible(): boolean {
    return !!obtenerTSGlobal();
  }
}

export const ts = new TaleSpireAdapter();
export default ts;
