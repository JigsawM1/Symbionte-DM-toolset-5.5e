export interface Suscripcion {
  desuscribir: () => void;
}

export interface Suscribible<T> {
  subscribe: (callback: (data: T) => void) => Suscripcion;
}

export interface TSLocalStorageBlob {
  setBlob: (data: string) => Promise<unknown>;
  getBlob: () => Promise<unknown>;
  deleteBlob?: () => Promise<unknown>;
}

export interface TSLocalStorage {
  global: TSLocalStorageBlob;
  campaign: TSLocalStorageBlob;
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
    send: (message: string, target?: string) => Promise<boolean>;
  };
  debug?: {
    log: (msg: string) => void;
  };
  creatures?: {
    onCreatureSelectionChange?: Suscribible<unknown[]>;
    getSelectedCreatures?: () => Promise<unknown[]>;
  };
  initiative?: {
    onInitiativeEvent?: Suscribible<void>;
    getQueue?: () => Promise<unknown>;
    nextTurn?: () => Promise<unknown>;
    prevTurn?: () => Promise<unknown>;
  };
  campaigns?: {
    whereAmI?: () => Promise<{
      name: string;
      playerRole?: string;
      isGm?: boolean;
    }>;
  };
  localStorage?: TSLocalStorage;
  /** API de portapapeles nativa de TaleSpire (disponible en algunas versiones) */
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
