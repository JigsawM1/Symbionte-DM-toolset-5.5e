import { z } from 'zod';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import { ts } from '@/utiles/TaleSpireAdapter';
import { obtenerTSGlobal } from '@/utiles/talespire/comun';
import { logger } from '@/utiles/logger';
import type { FragmentoCliente, EventoClienteTS } from '@/tipos/talespire';
import type { GrupoSyncV4, EntidadSyncV4 } from '@/tipos/protocoloSync';
import { CONEXION_SYNC_V4_INICIAL } from '@/tipos/estadoSyncV4';
import { MotorSyncV4 } from './motorSyncV4';
import { capturarSyncV4, proyectarSyncV4 } from './proyeccionSyncV4';
import { migrarContextosSync } from './contextosSyncV4';

let motor: MotorSyncV4 | undefined;
let generacion = 0;
let desuscribir: (() => void) | undefined;
let localId: string | undefined;
let enTransito = false;
const identidad = z.object({ id: z.string().min(1), name: z.string().optional() });
async function miembrosDelTablero(g: number) {
  const api = obtenerTSGlobal();
  if (!api?.clients?.getClientsInThisBoard || !api.sync?.getClientsConnected) {
    throw new Error('TaleSpire no permite comprobar los clientes del tablero y del canal de sincronización.');
  }
  const [enTablero, conectados] = await Promise.all([api.clients.getClientsInThisBoard(), api.sync.getClientsConnected()]);
  if (g !== generacion || enTransito) return [];
  const ids = new Set(conectados.map(c => c.id));
  return ts.clients.getMoreInfo(enTablero.filter(c => ids.has(c.id) || c.id === localId).map(c => c.id));
}

export function reiniciarConexionSyncV4(): void {
  generacion++;
  desuscribir?.(); desuscribir = undefined;
  motor?.destruir(); motor = undefined;
  usarAlmacenDM.setState({ conexionSyncV4: { ...CONEXION_SYNC_V4_INICIAL }, contextoTaleSpire: null, referenciaIniciativaFisica: null });
  ts.sync.purgarColaSync();
  ts.initiative.invalidarLectura();
}

async function arrancar(g: number): Promise<void> {
  const api = obtenerTSGlobal();
  if (!api?.clients?.whoAmI || !api.campaigns?.whereAmI || !api.boards?.whereAmI) return;
  const yo = await api.clients.whoAmI();
  if (g !== generacion) return;
  localId = yo.id;
  const [campaniaRaw, tableroRaw] = await Promise.all([
    api.campaigns.whereAmI(), api.boards.whereAmI(),
  ]);
  if (g !== generacion) return;
  const campania = identidad.parse(campaniaRaw).id; const tablero = identidad.parse(tableroRaw).id;
  const miembros = await miembrosDelTablero(g);
  if (g !== generacion) return;
  const propio = miembros.find(c => c.id === yo.id);
  if (!propio) throw new Error('No se pudo verificar el rol propio en el tablero.');
  usarAlmacenDM.setState({ ...migrarContextosSync(usarAlmacenDM.getState()), esGM: propio.clientMode === 'gm',
    contextoTaleSpire: { campania: { id: campania, nombre: identidad.parse(campaniaRaw).name ?? usarAlmacenDM.getState().campañaNombre }, tableroId: tablero },
    referenciaIniciativaFisica: null });
  const clave = JSON.stringify([campania, tablero]);
  const guardado = usarAlmacenDM.getState().memoriaSyncV4[clave];
  usarAlmacenDM.setState({ aplicandoSync: true });
  try { usarAlmacenDM.setState(proyectarSyncV4(usarAlmacenDM.getState(), {
    entidades: Object.values({ ...guardado?.base, ...guardado?.pendientes }), meta: guardado?.metaConfirmada ?? { orden: [], activo: null, ronda: 1, porcentaje: true },
  }, campania)); } finally { usarAlmacenDM.setState({ aplicandoSync: false }); }
  const instancia = new MotorSyncV4({ cliente: yo, campania, tablero, miembros, memoria: guardado,
    consultar: async id => (await ts.clients.getMoreInfo([id])).find(c => c.id === id),
    propiedades: async jugador => new Set((await ts.creatures.getCreaturesOwnedByPlayer(jugador)).map(c => c.id.toLowerCase())),
    enviar: (texto, destino) => g === generacion ? ts.sync.send(texto, destino) : Promise.resolve(false),
    leer: () => capturarSyncV4(usarAlmacenDM.getState(), yo.player.id, campania),
    aplicar: datos => {
      if (g !== generacion) return;
      usarAlmacenDM.setState({ aplicandoSync: true });
      try { usarAlmacenDM.setState(proyectarSyncV4(usarAlmacenDM.getState(), datos, campania)); }
      finally { usarAlmacenDM.setState({ aplicandoSync: false }); }
    },
    guardar: memoria => {
      if (JSON.stringify(usarAlmacenDM.getState().memoriaSyncV4[clave]) !== JSON.stringify(memoria)) {
        usarAlmacenDM.setState(s => ({ memoriaSyncV4: { ...s.memoriaSyncV4, [clave]: memoria } }));
      }
    },
    mostrar: estado => {
      if (g === generacion && JSON.stringify(usarAlmacenDM.getState().conexionSyncV4) !== JSON.stringify(estado)) {
        usarAlmacenDM.setState({ conexionSyncV4: estado });
      }
    },
    notificar: texto => usarAlmacenDM.getState().agregarNotificacion(texto, 'advertencia'),
  });
  if (g !== generacion) { instancia.destruir(); return; }
  motor = instancia;
  instancia.iniciar();
  instancia.observar();
}

export function inicializarConexionSyncV4(): () => void {
  reiniciarConexionSyncV4();
  const g = generacion;
  let arrancando = false;
  const intentar = (): void => {
    const s = usarAlmacenDM.getState();
    if (enTransito || !s.datosInicialesCargados || arrancando || motor || !ts.estaDisponible) return;
    arrancando = true;
    void arrancar(g).catch(error => {
      logger.error('[Sync v4] No se pudo inicializar la conexión:', error);
      if (g === generacion) s.agregarNotificacion('No se pudo iniciar la sincronización. Se conservan tus datos locales.', 'advertencia');
    }).finally(() => { arrancando = false; });
  };
  desuscribir = usarAlmacenDM.subscribe((s, anterior) => {
    if (s.esGM !== anterior.esGM && motor) {
      queueMicrotask(() => inicializarConexionSyncV4()); return;
    }
    if (!motor) { intentar(); return; }
    if (!s.aplicandoSync && (s.personajes !== anterior.personajes || s.colaIniciativa !== anterior.colaIniciativa
      || s.rondaActual !== anterior.rondaActual || s.indiceTurnoActivo !== anterior.indiceTurnoActivo
      || s.mostrarPorcentajeVidaAJugadores !== anterior.mostrarPorcentajeVidaAJugadores)) motor.observar();
  });
  intentar();
  return () => reiniciarConexionSyncV4();
}

export function solicitarSyncV4(): void { motor?.solicitar(); }
export function generacionConexionSyncV4(): number { return generacion; }
export function conexionSyncV4Suspendida(): boolean { return enTransito; }
export function emitirLocalSyncV4(): void { motor?.observar(); }
export function recibirSyncV4(datos: unknown, desde?: FragmentoCliente): Promise<void> {
  return motor?.recibir(datos, desde) ?? Promise.resolve();
}
export function esDirectorSyncV4(): boolean { return motor?.soyDirector ?? (!ts.estaDisponible && usarAlmacenDM.getState().esGM); }
export function votarDirectorSyncV4(id: string): Promise<void> { return motor?.votar(id) ?? Promise.resolve(); }
export function reintentarSyncV4(): void { motor?.reintentar(); }
export function exportarPendientesSyncV4() { return motor?.exportarPendientes() ?? {}; }
export async function recuperarArchivadoSyncV4(entidad: EntidadSyncV4): Promise<boolean> {
  let ok = false;
  try { ok = await motor?.recuperar(entidad) ?? false; }
  catch (error) { logger.error('[Sync v4] No se pudo revisar el archivo de recuperación:', error); }
  if (!ok) usarAlmacenDM.getState().agregarNotificacion('No se puede recuperar aún: verifica campaña, ficha, propiedad y conexión. El original sigue archivado.', 'advertencia');
  return ok;
}
export function descartarPendienteSyncV4(id: string): void { motor?.descartar(id); }
export function resolverConflictoSyncV4(id: string, grupo: GrupoSyncV4, opcion: 'local' | 'compartido', revision: number): boolean {
  return motor?.resolver(id, grupo, opcion, revision) ?? false;
}
export function eventoClienteSyncV4(evento: EventoClienteTS): void {
  const e = evento as EventoClienteTS & { payload?: { client?: FragmentoCliente; id?: string } };
  const id = evento.client?.id ?? evento.clientId ?? e.payload?.client?.id ?? e.payload?.id;
  const propio = localId !== undefined && id === localId;
  if (propio && evento.kind === 'clientLeftBoard') { enTransito = true; reiniciarConexionSyncV4(); return; }
  if (propio && evento.kind === 'clientJoinedBoard') { enTransito = false; inicializarConexionSyncV4(); return; }
  if (enTransito) return;
  const g = generacion;
  if (propio && evento.kind === 'clientModeChanged') {
    void ts.clients.esGM(true).then(esGM => {
      if (g === generacion && !enTransito) usarAlmacenDM.getState().establecerEsGM(esGM);
    }).catch(error => logger.error('[Sync v4] No se pudo verificar el cambio de rol propio:', error));
  }
  void miembrosDelTablero(g).then(miembros => {
    if (g === generacion) motor?.actualizarMiembros(miembros);
  }).catch(error => logger.warn('[Sync v4] No se pudo refrescar la lista de clientes:', error));
}
