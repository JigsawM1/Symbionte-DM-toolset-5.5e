import { EsquemaMensajeSyncV4, type MensajeSyncV4 } from '@/tipos/protocoloSync';
import { logger } from '@/utiles/logger';

export const INACTIVIDAD_FRAGMENTOS_V4_MS = 10000;
const MAX_SESIONES = 32;
const MAX_UNIDADES = 4000000;
type Fragmento = Extract<MensajeSyncV4, { t: 'FRAG' }>;

/** Presupuesta el sobre y sus escapes, no sólo el contenido del fragmento. */
export function fragmentarMensajeSyncV4(mensaje: Exclude<MensajeSyncV4, { t: 'FRAG' }>, id: string): string[] {
  const texto = JSON.stringify(mensaje);
  if (texto.length <= 400) return [texto];
  const c = mensaje.contexto;
  const identidad = mensaje.t === 'LOTE' ? `${mensaje.snapshot}.${mensaje.parte}` : id;
  const base = { v: 4, t: 'F', c: [c.campania, c.tablero, c.sesion, c.director], e: mensaje.emisor, s: mensaje.sesionEmisor, i: identidad, k: mensaje.t };
  const partes: string[] = [];
  let posicion = 0;
  while (posicion < texto.length) {
    let izquierda = 1;
    let derecha = Math.min(400, texto.length - posicion);
    let cantidad = 0;
    while (izquierda <= derecha) {
      const medio = Math.floor((izquierda + derecha) / 2);
      if (JSON.stringify({ ...base, p: 4096, n: 4096, x: texto.slice(posicion, posicion + medio) }).length <= 400) {
        cantidad = medio;
        izquierda = medio + 1;
      } else derecha = medio - 1;
    }
    if (!cantidad || partes.length >= 4096) throw new Error('Mensaje v4 demasiado grande para el transporte');
    partes.push(texto.slice(posicion, posicion + cantidad));
    posicion += cantidad;
  }
  return partes.map((parte, indice) => JSON.stringify({ ...base, p: indice + 1, n: partes.length, x: parte }));
}
interface Ensamblaje {
  total: number;
  tipoMensaje: string | undefined;
  partes: Map<number, string>;
  unidades: number;
  timer: ReturnType<typeof setTimeout>;
}
export type ResultadoFragmentoV4 = { estado: 'completo'; mensaje: Exclude<MensajeSyncV4, { t: 'FRAG' }> }
  | { estado: 'progreso' | 'duplicado' | 'rechazado' };

/** Se invoca únicamente tras verificar el remitente nativo y el contexto activo. */
export class BufferTransporteSyncV4 {
  private sesiones = new Map<string, Ensamblaje>();
  private unidades = 0;
  constructor(private readonly alExpirar: () => void) {}

  registrar(remitente: string, fragmento: Fragmento): ResultadoFragmentoV4 {
    if (remitente !== fragmento.emisor || !Number.isInteger(fragmento.parte)
      || !Number.isInteger(fragmento.total) || fragmento.parte < 1 || fragmento.total < 2
      || fragmento.total > 4096 || fragmento.parte > fragmento.total
      || !fragmento.texto.length || fragmento.texto.length > 400) return { estado: 'rechazado' };
    const contexto = JSON.stringify(fragmento.contexto);
    const clave = JSON.stringify([remitente, fragmento.sesionEmisor, contexto, fragmento.id]);
    let sesion = this.sesiones.get(clave);
    if (sesion && (sesion.total !== fragmento.total || sesion.tipoMensaje !== fragmento.tipoMensaje)) {
      this.descartar(clave);
      return { estado: 'rechazado' };
    }
    const previo = sesion?.partes.get(fragmento.parte);
    if (previo !== undefined) {
      if (previo === fragmento.texto) return { estado: 'duplicado' };
      this.descartar(clave);
      return { estado: 'rechazado' };
    }
    if (this.unidades + fragmento.texto.length > MAX_UNIDADES
      || (!sesion && this.sesiones.size >= MAX_SESIONES)) return { estado: 'rechazado' };
    if (sesion) clearTimeout(sesion.timer);
    const timer = setTimeout(() => { this.descartar(clave); this.alExpirar(); }, INACTIVIDAD_FRAGMENTOS_V4_MS);
    if (!sesion) {
      sesion = { total: fragmento.total, tipoMensaje: fragmento.tipoMensaje, partes: new Map(), unidades: 0, timer };
      this.sesiones.set(clave, sesion);
    }
    sesion.timer = timer;
    sesion.partes.set(fragmento.parte, fragmento.texto);
    sesion.unidades += fragmento.texto.length;
    this.unidades += fragmento.texto.length;
    if (sesion.partes.size !== sesion.total) return { estado: 'progreso' };
    const texto = Array.from({ length: sesion.total }, (_, i) => sesion.partes.get(i + 1)).join('');
    this.descartar(clave);
    try {
      const resultado = EsquemaMensajeSyncV4.safeParse(JSON.parse(texto));
      if (resultado.success && resultado.data.t !== 'FRAG' && resultado.data.emisor === remitente
        && (!fragmento.tipoMensaje || resultado.data.t === fragmento.tipoMensaje)
        && (resultado.data.t !== 'LOTE' || fragmento.id === `${resultado.data.snapshot}.${resultado.data.parte}`)
        && resultado.data.sesionEmisor === fragmento.sesionEmisor && JSON.stringify(resultado.data.contexto) === contexto) {
        return { estado: 'completo', mensaje: resultado.data };
      }
    } catch (error) {
      logger.warn('[Sync v4] Mensaje reensamblado no válido:', error);
    }
    return { estado: 'rechazado' };
  }

  private descartar(clave: string): void {
    const sesion = this.sesiones.get(clave);
    if (!sesion) return;
    clearTimeout(sesion.timer);
    this.unidades -= sesion.unidades;
    this.sesiones.delete(clave);
  }

  limpiar(): void {
    for (const clave of this.sesiones.keys()) this.descartar(clave);
  }
}
