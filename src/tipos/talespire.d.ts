export interface Suscripcion {
  desuscribir: () => void;
}

export interface Suscribible<T> {
  subscribe: (callback: (data: T) => void) => Suscripcion;
}

export interface TSLocalStorageBlob {
  setBlob: (key: string, data: string) => Promise<unknown>;
  getBlob: (key: string) => Promise<unknown>;
  deleteBlob?: (key: string) => Promise<unknown>;
}

export interface TSLocalStorage {
  global: TSLocalStorageBlob;
  campaign: TSLocalStorageBlob;
}

export interface CampaignFragment {
  id: string;
}

export interface CampaignInfo {
  id: string;
  name: string;
}

export interface TaleSpireAPI {
  dice: {
    isValidRollString: (rollStr: string) => boolean;
    makeRollDescriptors: (rollStr: string) => Promise<unknown[]>;
    putDiceInTray: (descriptors: unknown[], silenceDefaultChatCard?: boolean) => Promise<string>;
    evaluateDiceResultsGroup: (group: unknown) => Promise<number>;
    sendDiceResult: (groups: unknown[], rollId: string) => Promise<void>;
  };
  chat?: {
    send: (message: string) => Promise<boolean>;
    multiSend?: (message: string, targets: string[]) => Promise<boolean>;
    sendAsCreature?: (creatureFragmentOrId: string, message: string) => Promise<boolean>;
    multiSendAsCreature?: (creatureFragmentOrId: string, message: string, targets: string[]) => Promise<boolean>;
  };
  debug?: {
    log: (msg: string) => void;
  };
  creatures?: {
    onCreatureSelectionChange?: Suscribible<unknown[]>;
    getSelectedCreatures?: () => Promise<unknown[]>;
    getMoreInfo?: (creatureFragmentOrIds: string[]) => Promise<unknown[]>;
    getCreaturesOwnedByPlayer?: (playerId: string) => Promise<unknown[]>;
    getUniqueCreaturesInThisCampaign?: () => Promise<unknown[]>;
  };
  initiative?: {
    onInitiativeEvent?: Suscribible<void>;
    getQueue?: () => Promise<unknown>;
  };
  campaigns?: {
    whereAmI?: () => Promise<CampaignFragment>;
    getMoreInfoAboutCurrentCampaign?: () => Promise<CampaignInfo>;
  };
  players?: {
    whoAmI?: () => Promise<unknown>;
    isMe?: (playerFragmentOrId: string) => Promise<boolean>;
  };
  clients?: {
    whoAmI?: () => Promise<unknown>;
  };
  localStorage?: TSLocalStorage;
  system?: {
    clipboard?: {
      setText: (text: string) => Promise<void>;
    }
  };
  /** API de portapapeles legacy/simulador */
  clipboard?: {
    copyText: (text: string) => Promise<void>;
  };
}

declare global {
  interface Window {
    TS?: TaleSpireAPI;
    manejarCambioEstadoSimbionte?: (evento: unknown) => void;
    initiativeUpdated?: () => void;
    manejarEventoIniciativa?: () => void;
    manejarCambioEstadoCriatura?: (evento: unknown) => void;
    manejarCambioSeleccionCriatura?: (evento: unknown) => void;
    manejarResultadosDados?: (resultados: unknown) => Promise<void>;
  }
}
