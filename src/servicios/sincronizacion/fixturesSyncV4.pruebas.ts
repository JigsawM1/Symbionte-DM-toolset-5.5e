import { PERSONAJE_POR_DEFECTO } from '@/constantes';
import type { CriaturaIniciativa } from '@/almacen/usarAlmacenDM';
import { EsquemaAcompanantePersonaje, type PersonajeJugador } from '@/tipos/personaje';
import { MesaSyncV4 } from './mesaSyncV4.pruebas';

export function pjSyncV4(acompanante = false): PersonajeJugador {
  return { ...structuredClone(PERSONAJE_POR_DEFECTO), id: 'pj', nombre: 'Heroína', idMiniaturaTS: 'mini',
    campaniaTaleSpire: { id: 'campania', nombre: 'Campaña de pruebas' },
    hpActual: 25, hpMaximo: 30, hpTemporal: 5,
    acompanantes: acompanante ? [EsquemaAcompanantePersonaje.parse({ id: 'ac', nombre: 'Familiar',
      idPlantilla: 'familiar', idMiniaturaTS: 'mini-ac', vidaActual: 8, vidaMaxima: 12 })] : [] };
}
export function filaSyncV4(): CriaturaIniciativa {
  return { id: 'mini', idPersonajeDuenio: 'pj', nombre: 'Heroína', iniciativa: 12,
    vidaActual: 25, vidaMaxima: 30, vidaTemporal: 5, ca: 10, condiciones: [], efectos: [], esMonstruo: false,
    velocidad: '30 pies', bonificadorIniciativa: 0 };
}
export function prepararMesaSyncV4(transporte = false, acompanante = false) {
  const mesa = new MesaSyncV4([{ id: 'dm', clientMode: 'gm', player: { id: 'master', name: 'Máster' } },
    { id: 'jugador', clientMode: 'player', player: { id: 'duenio', name: 'Dueño' } }],
  new Map([['duenio', new Set(['mini', 'mini-ac'])]]));
  const cola = [filaSyncV4()];
  if (acompanante) cola.push({ ...filaSyncV4(), id: 'mini-ac', idAcompanante: 'ac', esAcompanante: true,
    nombre: 'Familiar', vidaActual: 8, vidaMaxima: 12, vidaTemporal: 0 });
  const dm = mesa.agregar('dm', { esGM: true, personajes: [pjSyncV4(acompanante)], colaIniciativa: structuredClone(cola) }, transporte);
  const pj = mesa.agregar('jugador', { esGM: false, personajes: [pjSyncV4(acompanante)], colaIniciativa: structuredClone(cola) }, transporte);
  mesa.iniciar(); return { mesa, dm, pj };
}
