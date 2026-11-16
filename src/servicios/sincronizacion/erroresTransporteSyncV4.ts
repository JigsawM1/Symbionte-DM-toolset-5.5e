import type { MensajeSyncV4 } from '@/tipos/protocoloSync';
import type { InfoCliente } from '@/tipos/talespire';
import { logger } from '@/utiles/logger';
import { fragmentarMensajeSyncV4 } from './bufferTransporteSyncV4';

export type MensajeNoFragSyncV4 = Exclude<MensajeSyncV4, { t: 'FRAG' }>;
export type TipoMensajeNoFragSyncV4 = MensajeNoFragSyncV4['t'];

export type MapaManejadoresSyncV4 = {
  readonly [K in TipoMensajeNoFragSyncV4]: (
    mensaje: Extract<MensajeNoFragSyncV4, { t: K }>,
    cliente: InfoCliente,
  ) => Promise<void> | void;
};

export type SobreMensajeSyncV4 = Pick<MensajeNoFragSyncV4, 'v' | 'contexto' | 'emisor' | 'sesionEmisor'>;

export type ErrorSyncV4 =
  | { readonly codigo: 'TRANSPORTE_SDK'; readonly operacion: string; readonly destino?: string; readonly causa: unknown }
  | { readonly codigo: 'LIMITE_PAYLOAD'; readonly tipoMensaje: string; readonly causa: unknown }
  | { readonly codigo: 'ESQUEMA_INVALIDO'; readonly remitente: string; readonly detalle: string }
  | { readonly codigo: 'VERSION_INCOMPATIBLE'; readonly remitente: string; readonly versionRecibida: unknown }
  | { readonly codigo: 'REENSAMBLAJE_CORRUPTO'; readonly remitente: string; readonly fragmentoId: string; readonly causa: unknown }
  | { readonly codigo: 'PROCESAMIENTO_INTERNO'; readonly operacion: string; readonly causa: unknown };

export interface OpcionesEnvioFragmentadoSyncV4 {
  mensaje: MensajeNoFragSyncV4;
  destino?: string;
  sesionActual: () => string;
  estaVivo: () => boolean;
  enviarTexto: (texto: string, destino: string) => Promise<boolean>;
}

/** Genera un identificador compacto de 16 caracteres hexadecimales para sesiones y solicitudes. */
export function generarIdSyncV4(): string {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 16);
}

/** Extrae un mensaje legible de cualquier valor lanzado en fronteras asíncronas o WebViews CEF. */
export function extraerMensajeErrorSyncV4(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return String(error);
}

/** Clasifica una excepción de envío en error de límite de payload o fallo de transporte SDK. */
export function clasificarErrorSyncV4(error: unknown, operacion: string, destino?: string): ErrorSyncV4 {
  const texto = extraerMensajeErrorSyncV4(error);
  if (texto.includes('Mensaje v4 demasiado grande para el transporte')) {
    return { codigo: 'LIMITE_PAYLOAD', tipoMensaje: operacion, causa: error };
  }
  return { codigo: 'TRANSPORTE_SDK', operacion, destino, causa: error };
}

/** Registra de forma estructurada errores categorizados de red/transporte y de payload. */
export function registrarErrorSyncV4(error: ErrorSyncV4): void {
  switch (error.codigo) {
    case 'TRANSPORTE_SDK':
    case 'LIMITE_PAYLOAD':
    case 'PROCESAMIENTO_INTERNO':
      logger.error(`[Sync v4] [${error.codigo}]`, error);
      return;
    case 'ESQUEMA_INVALIDO':
    case 'VERSION_INCOMPATIBLE':
    case 'REENSAMBLAJE_CORRUPTO':
      logger.warn(`[Sync v4] [${error.codigo}]`, error);
      return;
  }
}

/** Clasifica un payload entrante no válido como versión incompatible (con throttle de aviso) o esquema inválido. */
export function registrarErrorParseoSyncV4(
  datos: unknown,
  remitente: string,
  detalle: string,
  ultimoAvisoVersion: number,
  notificar: (texto: string) => void,
): number {
  if (typeof datos === 'object' && datos !== null && 'v' in datos && datos.v !== 4) {
    registrarErrorSyncV4({ codigo: 'VERSION_INCOMPATIBLE', remitente, versionRecibida: datos.v });
    if (Date.now() - ultimoAvisoVersion > 60000) {
      notificar('Toda la mesa debe actualizar ToolSet: la sincronización requiere el protocolo v4.');
      return Date.now();
    }
    return ultimoAvisoVersion;
  }
  registrarErrorSyncV4({ codigo: 'ESQUEMA_INVALIDO', remitente, detalle });
  return ultimoAvisoVersion;
}

/** Despacha de forma exhaustiva y tipada cualquier mensaje v4 no fragmentado hacia su manejador. */
export function despacharMensajeSyncV4(
  manejadores: MapaManejadoresSyncV4,
  mensaje: MensajeNoFragSyncV4,
  cliente: InfoCliente,
): Promise<void> | void {
  switch (mensaje.t) {
    case 'DIRECCION': return manejadores.DIRECCION(mensaje, cliente);
    case 'HOLA': return manejadores.HOLA(mensaje, cliente);
    case 'PROPUESTA': return manejadores.PROPUESTA(mensaje, cliente);
    case 'RESULTADO': return manejadores.RESULTADO(mensaje, cliente);
    case 'LOTE': return manejadores.LOTE(mensaje, cliente);
    case 'LATIDO': return manejadores.LATIDO(mensaje, cliente);
    case 'CONFIRMADO': return manejadores.CONFIRMADO(mensaje, cliente);
    case 'COMBATE': return manejadores.COMBATE(mensaje, cliente);
  }
}

/**
 * Envía un mensaje v4 fragmentado si supera el presupuesto seguro, abortando de inmediato
 * si el motor se destruye o cambia la sesión activa durante la ráfaga.
 */
export async function enviarMensajeFragmentadoSyncV4(
  opciones: OpcionesEnvioFragmentadoSyncV4,
): Promise<boolean> {
  const { mensaje, destino = 'board', sesionActual, estaVivo, enviarTexto } = opciones;
  const sesion = sesionActual();
  const fragmentos = fragmentarMensajeSyncV4(mensaje, generarIdSyncV4());
  for (const texto of fragmentos) {
    if (!estaVivo() || sesion !== sesionActual()) return false;
    const enviado = await enviarTexto(texto, destino);
    if (!enviado) return false;
  }
  return estaVivo() && sesion === sesionActual();
}
