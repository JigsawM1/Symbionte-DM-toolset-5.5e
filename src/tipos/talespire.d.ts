export interface Suscripcion {
  desuscribir: () => void;
}

export interface Suscribible<T> {
  subscribe: (callback: (data: T) => void) => Suscripcion;
}

// LocalStorage
export interface TSLocalStorageBlob {
  setBlob: (data: string) => Promise<void>;
  getBlob: () => Promise<string>;
  deleteBlob?: () => Promise<void>;
}

export interface TSLocalStorage {
  global: TSLocalStorageBlob;
  campaign: TSLocalStorageBlob;
}

// Campañas
export interface FragmentoCampania {
  id: string;
}

export interface InfoCampania {
  id: string;
  name: string;
}

// Criaturas
export interface FragmentoCriatura {
  id: string;
}

export interface SeleccionCriaturas {
  creatures: FragmentoCriatura[];
}

export interface EstadisticaCriatura {
  name: string;
  value: number;
  max: number;
}

export interface MorfoCriatura {
  boardAssetId: string;
  scale: number;
}

export interface PosicionTS {
  locId: number;
  x: number;
  y: number;
  z: number;
}

export interface RotacionEulerTS {
  x: number;
  y: number;
  z: number;
}

export interface InfoCriatura {
  id: string;
  isUnique: boolean;
  name: string;
  nameSet: boolean;
  link: string;
  position: PosicionTS;
  rotation: RotacionEulerTS;
  boardId: string;
  morphs: MorfoCriatura[];
  activeMorphIndex: number;
  hp: EstadisticaCriatura;
  stats: EstadisticaCriatura[];
  torchIsOn: boolean;
  isExplicitlyHidden: boolean;
  isFlying: boolean;
  idsOfActivePersistentEmotes: string[];
  ownerIds: string[];
}

// Jugadores y Clientes
export interface FragmentoJugador {
  id: string;
  name: string;
}

export interface FragmentoCliente {
  id: string;
  player: FragmentoJugador;
}

export type ModoCliente = "spectator" | "player" | "gm";

export interface InfoCliente {
  id: string;
  clientMode: ModoCliente;
  player: FragmentoJugador;
}

export type FragmentoOId = string | { id: string };

// Iniciativa
export interface ElementoTurnoIniciativa {
  id: string;
  name: string;
  kind: "creature";
}

export interface ColaIniciativaTS {
  items: ElementoTurnoIniciativa[];
  activeItemIndex: number;
}

export interface EventoIniciativaActualizada {
  queue: ColaIniciativaTS;
}

// Dados y Tiradas
export interface DescriptorTirada {
  name: string;
  roll: string;
}

export interface ValorTirada {
  value: number;
}

export interface ResultadoDado {
  kind: string;
  results: number[];
}

export interface OperacionResultados {
  operator: string;
  operands: (OperacionResultados | ResultadoDado | ValorTirada)[];
}

export interface GrupoResultadosTirada {
  name: string;
  result: OperacionResultados | ResultadoDado | ValorTirada;
}

export interface ResultadosTirada {
  rollId: string;
  clientId: string;
  resultsGroups: GrupoResultadosTirada[];
  gmOnly: boolean;
  quiet: boolean;
}

// API Principal de TaleSpire
export interface TaleSpireAPI {
  dice: {
    isValidRollString: (rollStr: string) => boolean;
    makeRollDescriptors: (rollStr: string) => Promise<DescriptorTirada[]>;
    putDiceInTray: (descriptors: DescriptorTirada[], silenceDefaultChatCard?: boolean) => Promise<string>;
    evaluateDiceResultsGroup: (group: GrupoResultadosTirada | any) => Promise<number>;
    sendDiceResult: (groups: GrupoResultadosTirada[] | any[], rollId: string) => Promise<void>;
    onRollResults?: Suscribible<ResultadosTirada>;
  };
  chat?: {
    send: (message: string, target?: string | FragmentoJugador) => Promise<boolean>;
    multiSend?: (message: string, targets: string[]) => Promise<boolean>;
    sendAsCreature?: (creatureFragmentOrId: FragmentoOId, message: string) => Promise<boolean>;
    multiSendAsCreature?: (creatureFragmentOrId: FragmentoOId, message: string, targets: string[]) => Promise<boolean>;
  };
  debug?: {
    log: (msg: string) => void;
  };
  creatures?: {
    onCreatureSelectionChange?: Suscribible<SeleccionCriaturas>;
    getSelectedCreatures?: () => Promise<FragmentoCriatura[]>;
    getMoreInfo?: (creatureFragmentOrIds: FragmentoOId[]) => Promise<InfoCriatura[]>;
    getCreaturesOwnedByPlayer?: (playerId: string) => Promise<FragmentoCriatura[]>;
    getUniqueCreaturesInThisCampaign?: () => Promise<FragmentoCriatura[]>;
  };
  initiative?: {
    onInitiativeEvent?: Suscribible<EventoIniciativaActualizada>;
    getQueue?: () => Promise<ColaIniciativaTS>;
    nextTurn?: () => Promise<unknown>;
    prevTurn?: () => Promise<unknown>;
  };
  campaigns?: {
    whereAmI?: () => Promise<FragmentoCampania>;
    getMoreInfoAboutCurrentCampaign?: () => Promise<InfoCampania>;
  };
  players?: {
    whoAmI?: () => Promise<FragmentoJugador>;
    isMe?: (playerFragmentOrId: FragmentoOId) => Promise<boolean>;
  };
  clients?: {
    whoAmI?: () => Promise<FragmentoCliente>;
    getMoreInfo?: (clientFragmentsOrIds: FragmentoOId[]) => Promise<InfoCliente[]>;
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
    initiativeUpdated?: (evento?: EventoIniciativaActualizada) => void;
    manejarEventoIniciativa?: (evento?: EventoIniciativaActualizada) => void;
    manejarCambioEstadoCriatura?: (evento: unknown) => void;
    manejarCambioSeleccionCriatura?: (evento: SeleccionCriaturas) => void;
    manejarResultadosDados?: (resultados: ResultadosTirada) => Promise<void>;
  }
}
