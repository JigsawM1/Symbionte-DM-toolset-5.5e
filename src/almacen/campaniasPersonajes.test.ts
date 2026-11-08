import { afterEach, describe, expect, it, vi } from 'vitest';
import { crearStoreSyncV4 } from '@/servicios/sincronizacion/mesaSyncV4.pruebas';
import { pjSyncV4, filaSyncV4 } from '@/servicios/sincronizacion/fixturesSyncV4.pruebas';
import { personajesDelContexto } from './campaniasPersonajes';
import { migrarContextosSync } from '@/servicios/sincronizacion/contextosSyncV4';
import { prepararCargaPersistida } from './cargaPersistida';
import { construirBlobPersistencia } from './persistencia';
import { EsquemaPersonajeJugador } from '@/tipos/personaje';
import { capturarSyncV4, proyectarSyncV4 } from '@/servicios/sincronizacion/proyeccionSyncV4';

const contexto = { campania: { id: 'campania', nombre: 'La misma campaña renombrada' }, tableroId: 'tablero' };
afterEach(() => { vi.restoreAllMocks(); });
function preparar() {
  const store = crearStoreSyncV4();
  const ajena = { ...pjSyncV4(true), id: 'ajena', campaniaTaleSpire: { id: 'otra', nombre: contexto.campania.nombre },
    movimientoGastado: 20, movimientoMaximoTemporal: 60, condicionesActivas: ['Envenenado'] };
  store.setState({ contextoTaleSpire: contexto, esGM: true, personajes: [pjSyncV4(true), ajena], colaIniciativa: [filaSyncV4()] });
  return { store, ajena };
}
describe('Afiliación explícita y operaciones acotadas', () => {
  it('importar un archivo conserva lo existente y no convierte sus datos en estado compartido', () => {
    const { store } = preparar(); const original = store.getState().colaIniciativa;
    const externo = { memorias: {}, cola: [{ ...filaSyncV4(), id: 'fila-externa' }], ronda: 4, indice: 0 };
    expect(store.getState().importarBaseDatosJSONCompleta(externo)).toBe(true);
    expect(store.getState().colaIniciativa).toBe(original);
    const migracion = migrarContextosSync(store.getState());
    expect(migracion.recuperacionContextosSync?.combates?.some(c => c.cola[0]?.id === 'fila-externa')).toBe(true);
    expect(migracion.recuperacionContextosSync?.combates?.some(c => c.cola[0]?.id === 'mini')).toBe(true);
  });
  it('una importación con ID de otra campaña conserva ambas fichas y no publica el combate antiguo', () => {
    const { store } = preparar();
    const importada = { ...pjSyncV4(), nombre: 'Importada', campaniaTaleSpire: { id: 'otra', nombre: 'Otra' } };
    expect(store.getState().importarBaseDatosJSONCompleta({ personajes: [importada], cola_iniciativa: [{ ...filaSyncV4(), id: 'antigua' }] })).toBe(true);
    expect(store.getState().personajes.filter(p => p.nombre === 'Importada')).toHaveLength(1);
    const copia = store.getState().personajes.find(p => p.nombre === 'Importada')!;
    expect(copia.id).not.toBe('pj'); expect(copia.idMiniaturaTS).toBeNull();
    expect(store.getState().personajes.find(p => p.id === 'pj')?.campaniaTaleSpire?.id).toBe('campania');
    expect(store.getState().colaIniciativa[0].id).toBe('mini');
    expect(store.getState().recuperacionContextosSync?.combates?.[0].cola[0].id).toBe('antigua');
  });
  it('afiliar no copia los PV provisionales de una fila física aún no asociada a la ficha', () => {
    const { store } = preparar();
    store.setState({ personajes: [{ ...pjSyncV4(), campaniaTaleSpire: null }], colaIniciativa: [
      { ...filaSyncV4(), idPersonajeDuenio: undefined, vidaActual: 1, vidaMaxima: 10 },
    ] });
    store.getState().afiliarPersonajeACampania('pj');
    expect(capturarSyncV4(store.getState(), 'master').entidades[0].grupos.vitalidad.actual).toBe(25);
  });
  it('selecciona por ID, mantiene referencias y no aplica estados remotos a la campaña ajena', () => {
    const { store, ajena } = preparar(); const s = store.getState();
    expect(personajesDelContexto(s).map(p => p.id)).toEqual(['pj']);
    expect(personajesDelContexto(s)).toBe(personajesDelContexto(s));
    const datos = capturarSyncV4(s, 'master');
    expect(datos.entidades.some(e => e.ficha === 'ajena')).toBe(false);
    datos.entidades[0].grupos.vitalidad.actual = 2;
    expect(proyectarSyncV4(s, datos).personajes?.[1]).toBe(ajena);
  });
  it('vida, estados, rondas y acciones de ficha conservan las fichas ajenas', () => {
    const { store, ajena } = preparar();
    store.getState().modificarVidaCriaturaIniciativa('mini', 12);
    store.getState().agregarCondicionACriatura('mini', 'Derribado');
    store.getState().avanzarRonda();
    store.getState().establecerHPActualPersonaje('ajena', 1);
    store.getState().actualizarPersonaje('ajena', { nombre: 'No modificar' });
    expect(store.getState().personajes[1]).toBe(ajena);
    expect(store.getState().personajes[0].hpActual).toBe(12);
  });
  it('las fichas antiguas no se afilian solas y la asignación es explícita', () => {
    const { store } = preparar(); const antigua = EsquemaPersonajeJugador.parse({ id: 'antigua' });
    expect(antigua.campaniaTaleSpire).toBeNull();
    store.setState({ personajes: [antigua] });
    expect(personajesDelContexto(store.getState())).toEqual([]);
    expect(store.getState().afiliarPersonajeACampania('antigua')).toBe(true);
    expect(store.getState().personajes[0].campaniaTaleSpire).toEqual(contexto.campania);
  });
  it('crear y duplicar respetan la campaña, cambian identidades y limpian vínculos físicos', () => {
    const { store, ajena } = preparar();
    const nuevo = store.getState().crearPersonaje();
    expect(store.getState().personajes.find(p => p.id === nuevo)?.campaniaTaleSpire).toEqual(contexto.campania);
    const id = store.getState().duplicarPersonaje('ajena');
    const copia = store.getState().personajes.find(p => p.id === id)!;
    expect(copia.idMiniaturaTS).toBeNull(); expect(copia.campaniaTaleSpire).toEqual(contexto.campania);
    expect(copia.acompanantes[0].id).not.toBe(ajena.acompanantes[0].id);
    expect(copia.acompanantes[0].idMiniaturaTS).toBeNull();
    expect(store.getState().personajes[1]).toBe(ajena);
  });
  it('impide activar fichas ajenas y vincular una miniatura ya usada en esta campaña', () => {
    const { store } = preparar(); store.setState({ idPersonajeActivo: 'pj' });
    store.getState().seleccionarPersonajeActivo('ajena'); expect(store.getState().idPersonajeActivo).toBe('pj');
    const id = store.getState().crearPersonaje(); store.getState().vincularMiniaturaTSPersonaje(id, 'MINI');
    expect(store.getState().personajes.find(p => p.id === id)?.idMiniaturaTS).toBeNull();
  });
  it('la migración conserva originales, persiste el archivo y es idempotente', () => {
    const { store } = preparar(); const original = store.getState();
    store.setState(migrarContextosSync(original));
    expect(store.getState().colaIniciativa).toEqual([]);
    expect(store.getState().recuperacionContextosSync?.cola).toEqual(original.colaIniciativa);
    expect(migrarContextosSync(store.getState())).toEqual({});
    const cargado = prepararCargaPersistida(construirBlobPersistencia(store.getState()));
    expect(cargado.versionContextosSync).toBe(2);
    expect(cargado.recuperacionContextosSync).toEqual(store.getState().recuperacionContextosSync);
    expect(cargado.personajes?.[0].campaniaTaleSpire?.id).toBe('campania');
  });
});
