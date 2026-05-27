export interface Suscripcion {
  desuscribir: () => void;
}

export interface Suscribible<T> {
  subscribe: (callback: (data: T) => void) => Suscripcion;
}

export interface TSLocalStorageBlob {
  setBlob: (data: string) => Promise<any>;
  getBlob: () => Promise<any>;
  deleteBlob?: () => Promise<any>;
}

export interface TSLocalStorage {
  global: TSLocalStorageBlob;
  campaign: TSLocalStorageBlob;
}

export interface TaleSpireAPI {
  dice: {
    isValidRollString: (rollStr: string) => boolean;
    makeRollDescriptors: (rollStr: string) => Promise<any[]>;
    putDiceInTray: (descriptors: any[], silenceDefaultChatCard?: boolean) => Promise<string>;
    evaluateDiceResultsGroup: (group: any) => Promise<number>;
    sendDiceResult: (groups: any[], rollId: string) => Promise<void>;
  };
  chat?: {
    send: (message: string, target?: string) => Promise<boolean>;
  };
  debug?: {
    log: (msg: string) => void;
  };
  creatures?: {
    onCreatureSelectionChange?: Suscribible<any[]>;
    getSelectedCreatures?: () => Promise<any[]>;
  };
  initiative?: {
    onInitiativeEvent?: Suscribible<void>;
    getQueue?: () => Promise<any>;
    nextTurn?: () => Promise<any>;
    prevTurn?: () => Promise<any>;
  };
  campaigns?: {
    whereAmI?: () => Promise<{
      name: string;
      playerRole?: string;
      isGm?: boolean;
    }>;
  };
  localStorage?: TSLocalStorage;
}

declare global {
  interface Window {
    TS?: TaleSpireAPI;
    manejarCambioEstadoSimbionte?: (evento: any) => void;
    initiativeUpdated?: () => void;
    manejarEventoIniciativa?: () => void;
    manejarCambioEstadoCriatura?: (evento: any) => void;
    manejarCambioSeleccionCriatura?: (evento: any) => void;
    manejarResultadosDados?: (resultados: any) => Promise<void>;
  }
}
