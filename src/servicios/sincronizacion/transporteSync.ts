import { EsquemaWireMensajeSync, type WireMensajeSync, type WireEstadoIniciativaDM, type WireEstadoCombatePJ } from '@/tipos/sync';

export const LIMITE_PAQUETE_SYNC = 380; // Unidades UTF-16, incluyendo el sobre JSON.
export const EXPIRACION_FRAGMENTOS_MS = 3500;
export type FragmentoSync = Extract<WireMensajeSync, { t: 'FRAG' }>;
export type EstadoSync = { v: 1; t: 'DM'; d: WireEstadoIniciativaDM } | { v: 1; t: 'PJ'; d: WireEstadoCombatePJ };

export function claveEstadoSync(tipo: 'DM' | 'PJ', id: string): string {
  return `${tipo}:${id}`;
}

/** Divide el mensaje completo; también admite una sola criatura de gran tamaño. */
export function empaquetarEstadoSync(mensaje: EstadoSync): string[] {
  const texto = JSON.stringify(mensaje);
  if (texto.length <= LIMITE_PAQUETE_SYNC) return [texto];
  const ts = mensaje.d.ts;
  if (!ts || !Number.isSafeInteger(ts)) throw new Error('La emisión fragmentada necesita una revisión válida');
  const base = { v: 1 as const, t: 'FRAG' as const, k: mensaje.t,
    id: mensaje.t === 'PJ' ? mensaje.d.id : 'DM', ts };
  const partes: string[] = [];
  let posicion = 0;
  while (posicion < texto.length) {
    let minimo = 1;
    let maximo = Math.min(LIMITE_PAQUETE_SYNC, texto.length - posicion);
    let cantidad = 0;
    // Reservar el ancho máximo de los índices evita exceder el límite al pasar de 9 a 10.
    while (minimo <= maximo) {
      const medio = Math.floor((minimo + maximo) / 2);
      const candidato = JSON.stringify({ ...base, chunk: 4096, total: 4096, d: texto.slice(posicion, posicion + medio) });
      if (candidato.length <= LIMITE_PAQUETE_SYNC) { cantidad = medio; minimo = medio + 1; }
      else maximo = medio - 1;
    }
    if (!cantidad || partes.length >= 4096) throw new Error('Estado de sincronización demasiado grande');
    partes.push(texto.slice(posicion, posicion + cantidad));
    posicion += cantidad;
  }
  return partes.map((d, i) => JSON.stringify({ ...base, chunk: i + 1, total: partes.length, d }));
}

interface SesionFragmentos {
  ts: number;
  total: number;
  partes: Map<number, string>;
  invalida: boolean;
  timer: ReturnType<typeof setTimeout> | null;
}
export type RecepcionFragmento =
  | { tipo: 'completo'; mensaje: EstadoSync }
  | { tipo: 'progreso' | 'ignorado' | 'invalido' };

/** El historial de revisiones aplicadas pertenece al receptor, no a este buffer temporal. */
export class BufferFragmentosSync {
  private sesiones = new Map<string, SesionFragmentos>();

  constructor(private alExpirar: (tipo: 'DM' | 'PJ', id: string) => void) {}

  obtenerRevisionEnCurso(tipo: 'DM' | 'PJ', id: string): number | undefined {
    return this.sesiones.get(claveEstadoSync(tipo, id))?.ts;
  }

  registrar(fragmento: FragmentoSync): RecepcionFragmento {
    const { k, id, ts, chunk, total, d } = fragmento;
    const clave = claveEstadoSync(k, id);
    let sesion = this.sesiones.get(clave);
    if (sesion && ts < sesion.ts) return { tipo: 'ignorado' };
    if (!sesion || ts > sesion.ts) {
      this.descartar(k, id);
      sesion = { ts, total, partes: new Map(), invalida: false, timer: null };
      this.sesiones.set(clave, sesion);
    }
    if (sesion.invalida) return { tipo: 'ignorado' };
    const anterior = sesion.partes.get(chunk);
    if (chunk > total || total !== sesion.total || (anterior !== undefined && anterior !== d)) {
      sesion.invalida = true;
      // No prolongar una sesión corrupta por recibir más datos contradictorios.
      if (!sesion.timer) this.programarExpiracion(sesion, k, id);
      return { tipo: 'invalido' };
    }
    if (anterior === d) return { tipo: 'ignorado' };
    sesion.partes.set(chunk, d);
    this.programarExpiracion(sesion, k, id);
    if (sesion.partes.size !== total) return { tipo: 'progreso' };

    const texto = Array.from({ length: total }, (_, i) => sesion.partes.get(i + 1)).join('');
    this.descartar(k, id);
    try {
      const parseo = EsquemaWireMensajeSync.safeParse(JSON.parse(texto));
      if (parseo.success && (parseo.data.t === 'DM' || parseo.data.t === 'PJ')) {
        const mensaje = parseo.data;
        if (mensaje.t === k && mensaje.d.ts === ts && (mensaje.t === 'PJ' ? mensaje.d.id === id : id === 'DM')) {
          return { tipo: 'completo', mensaje };
        }
      }
    } catch { /* La transmisión completa también necesita JSON y esquema válidos. */ }
    this.alExpirar(k, id);
    return { tipo: 'invalido' };
  }

  private programarExpiracion(sesion: SesionFragmentos, tipo: 'DM' | 'PJ', id: string): void {
    if (sesion.timer) clearTimeout(sesion.timer);
    sesion.timer = setTimeout(() => {
      this.descartar(tipo, id);
      this.alExpirar(tipo, id);
    }, EXPIRACION_FRAGMENTOS_MS);
  }

  descartar(tipo: 'DM' | 'PJ', id: string): void {
    const clave = claveEstadoSync(tipo, id);
    const sesion = this.sesiones.get(clave);
    if (sesion?.timer) clearTimeout(sesion.timer);
    this.sesiones.delete(clave);
  }

  limpiar(): void {
    for (const sesion of this.sesiones.values()) if (sesion.timer) clearTimeout(sesion.timer);
    this.sesiones.clear();
  }
}
