import { usarAlmacenDM, type EstadoDM } from '@/almacen/usarAlmacenDM';
/** Arnés con stores reales independientes y transporte nativo simulado. */
import { createStore } from 'zustand/vanilla';
import { crearSliceIniciativa } from '@/almacen/slices/sliceIniciativa';
import { crearSliceHomebrew } from '@/almacen/slices/sliceHomebrew';
import { crearSliceConfiguracion } from '@/almacen/slices/sliceConfiguracion';
import { crearSlicePersonajes } from '@/almacen/slices/slicePersonajes';
import { crearSliceSync } from '@/almacen/slices/sliceSync';

import type { InfoCliente } from '@/tipos/talespire';
import { TaleSpireSyncAdapter } from '@/utiles/talespire/talespireSync';
import { capturarSyncV4, proyectarSyncV4 } from './proyeccionSyncV4';
import { MotorSyncV4 } from './motorSyncV4';
import { BufferTransporteSyncV4 } from './bufferTransporteSyncV4';
import { EsquemaMensajeSyncV4, type MensajeSyncV4 } from '@/tipos/protocoloSync';

export function crearStoreSyncV4() {
  usarAlmacenDM.getState();
  return createStore<EstadoDM>()((set, get, api) => ({
    ...crearSliceIniciativa(set, get, api), ...crearSliceHomebrew(set, get, api),
    ...crearSliceConfiguracion(set, get, api), ...crearSlicePersonajes(set, get, api), ...crearSliceSync(set, get, api),
  }));
}
export interface PaquetePruebaV4 { origen: string; destino: string; texto: string }
export class MesaSyncV4 {
  clientes = new Map<string, { motor: MotorSyncV4; store: ReturnType<typeof crearStoreSyncV4>; adaptador: TaleSpireSyncAdapter; parar: () => void }>();
  paquetes: PaquetePruebaV4[] = [];
  mensajes: { origen: string; destino: string; mensaje: MensajeSyncV4 }[] = [];
  private colector = new BufferTransporteSyncV4(() => {});
  errores: string[] = [];
  rechazar: (p: PaquetePruebaV4) => string | undefined = () => undefined;
  descartar: (p: PaquetePruebaV4) => boolean = () => false;
  demora: (p: PaquetePruebaV4) => number = () => 20;
  copias: (p: PaquetePruebaV4) => number = () => 1;
  constructor(readonly miembros: InfoCliente[], readonly minis: Map<string, Set<string>>, readonly contexto = { campania: 'campania', tablero: 'tablero' }) {}
  agregar(id: string, estado: Partial<EstadoDM>, conTransporte = false) {
    const cliente = this.miembros.find(c => c.id === id)!;
    const store = crearStoreSyncV4();
    store.setState({ ...estado, aplicandoSync: false, datosInicialesCargados: true });
    const publicar = async (texto: string, destino = 'board'): Promise<void> => {
      const p = { origen: id, destino, texto }; this.paquetes.push(p);
      const rechazo = this.rechazar(p); if (rechazo) throw new Error(rechazo);
      const m = EsquemaMensajeSyncV4.parse(JSON.parse(texto));
      if (m.t === 'FRAG') {
        const resultado = this.colector.registrar(id, m);
        if (resultado.estado === 'completo') this.mensajes.push({ origen: id, destino, mensaje: resultado.mensaje });
      } else this.mensajes.push({ origen: id, destino, mensaje: m });
      if (this.descartar(p)) return;
      for (const [otroId, otro] of this.clientes) if (otroId !== id && (destino === 'board' || destino === otroId)) {
        for (let copia = 0; copia < this.copias(p); copia++) {
          setTimeout(() => { void otro.motor.recibir(JSON.parse(texto), cliente).catch(e => this.errores.push(String(e))); }, this.demora(p));
        }
      }
    };
    const adaptador = new TaleSpireSyncAdapter(() => ({ sync: { send: (texto, destino) => publicar(texto, typeof destino === 'string' ? destino : destino?.id) } }));
    const motor = new MotorSyncV4({ cliente, miembros: this.miembros, ...this.contexto,
      consultar: async otro => this.miembros.find(c => c.id === otro),
      propiedades: async jugador => this.minis.get(jugador) ?? new Set(),
      enviar: conTransporte ? (texto, destino) => adaptador.send(texto, destino)
        : async (texto, destino) => { await publicar(texto, destino); return true; },
      leer: () => capturarSyncV4(store.getState(), cliente.player.id),
      aplicar: datos => {
        store.setState({ aplicandoSync: true });
        try { store.setState(proyectarSyncV4(store.getState(), datos)); }
        finally { store.setState({ aplicandoSync: false }); }
      },
      guardar: memoria => { store.setState({ memoriaSyncV4: { mesa: memoria } }); },
      mostrar: conexionSyncV4 => store.setState({ conexionSyncV4 }),
      notificar: texto => store.getState().agregarNotificacion(texto, 'advertencia'),
      memoria: estado.memoriaSyncV4?.mesa,
    });
    const parar = store.subscribe((s, antes) => {
      if (!s.aplicandoSync && (s.personajes !== antes.personajes || s.colaIniciativa !== antes.colaIniciativa
        || s.rondaActual !== antes.rondaActual || s.indiceTurnoActivo !== antes.indiceTurnoActivo
        || s.mostrarPorcentajeVidaAJugadores !== antes.mostrarPorcentajeVidaAJugadores)) motor.observar();
    });
    this.clientes.set(id, { motor, store, adaptador, parar });
    return this.clientes.get(id)!;
  }
  iniciar(): void { for (const c of this.clientes.values()) { c.motor.iniciar(); c.motor.observar(); } }
  destruir(): void { this.colector.limpiar(); for (const c of this.clientes.values()) { c.parar(); c.motor.destruir(); c.adaptador.purgarColaSync(); } }
}
