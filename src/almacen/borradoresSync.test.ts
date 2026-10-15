import { beforeEach, describe, expect, it } from 'vitest';
import { PERSONAJE_POR_DEFECTO } from '@/constantes';
import { proyectarBorradorCombatePJ, proyectarEstadoCombatePJ } from '@/servicios/sincronizacion/proyeccionEstadoCombate';
import { EsquemaWireMensajeSync, serializarEstadoCombatePJ, deserializarEstadoCombatePJ } from '@/tipos/sync';
import { usarAlmacenDM } from './usarAlmacenDM';
import { construirBlobPersistencia } from './persistencia';
import { prepararCargaPersistida } from './cargaPersistida';

function personaje() {
  return {
    ...structuredClone(PERSONAJE_POR_DEFECTO), id: 'pj', hpActual: 15, hpMaximo: 30,
    espaciosConjuroMaximos: { '1': 4 }, espaciosConjuroGastados: { '1': 2 },
    puntosConjuroMaximos: 8, puntosConjuroGastados: 3,
    espaciosPactoMaximos: 2, espaciosPactoGastados: 1, nivelEspacioPacto: 3,
    movimientoGastado: 15, movimientoMaximoTemporal: 60,
    acompanantes: [{
      id: 'ac', nombre: 'Corcel', idPlantilla: 'corcel', idMiniaturaTS: 'mini-ac',
      vidaActual: 12, vidaMaxima: 20, vidaTemporal: 5, ca: 13, iniciativa: 12,
      condiciones: ['derribado'], efectos: [], velocidad: '60 pies',
      movimientoGastado: 20, movimientoMaximoTemporal: null,
      tipoTerreno: 'normal' as const, multiplicadorTerreno: 1,
      ultimaPosicionTS: null, ultimoBoardIdTS: null, historialMovimiento: [],
      esInvocacion: true, nivelConjuroInvocacion: 3, subtipoInvocacion: 'celestial',
    }],
  };
}

// Representa un borrador compacto existente, sin depender del serializador nuevo.
const legado = {
  id: 'pj', n: 'Personaje', i: 12, va: 7, vm: 30,
  cj: { em: { '1': 4 }, eg: { '1': 1 }, pm: 8, pg: 2, pc: [2, 0, 3] },
  gast: 10, maxT: null,
  ac: [{ id: 'ac', n: 'Corcel', va: 8, vm: 20, plant: 'corcel-antiguo', vel: '50 pies',
    gast: 5, maxT: 70, inv: true, lvl: 2, sub: 'feérico' }],
};

beforeEach(() => usarAlmacenDM.setState({
  personajes: [personaje()], colaIniciativa: [], borradoresSync: {}, timestampsModificacionLocal: {},
}));

describe('Separación del contrato de red y recuperación local', () => {
  it('la proyección de red excluye datos locales y conserva el combate del acompañante', () => {
    const dto = proyectarEstadoCombatePJ(personaje());
    expect(dto).not.toHaveProperty('conjuros');
    expect(dto).not.toHaveProperty('movimientoGastado');
    for (const campo of ['idPlantilla', 'velocidad', 'esInvocacion', 'nivelConjuroInvocacion', 'subtipoInvocacion']) {
      expect(dto.acompanantes?.[0]).not.toHaveProperty(campo);
    }
    const recibido = deserializarEstadoCombatePJ(serializarEstadoCombatePJ(dto));
    expect(recibido.acompanantes?.[0]).toMatchObject({
      id: 'ac', idMiniaturaTS: 'mini-ac', vidaActual: 12, vidaTemporal: 5, condiciones: ['derribado'],
    });
  });

  it('guardar, recargar y reaplicar conserva los recursos y la configuración del borrador', () => {
    const borrador = proyectarBorradorCombatePJ(personaje());
    const blob = JSON.parse(JSON.stringify(construirBlobPersistencia({ borradoresSync: { pj: borrador } })));
    const recuperados = prepararCargaPersistida(blob).borradoresSync!;
    expect(recuperados.pj.conjuros).toEqual(borrador.conjuros);
    expect(recuperados.pj.acompanantes?.[0]).toMatchObject({
      idPlantilla: 'corcel', velocidad: '60 pies', esInvocacion: true, nivelConjuroInvocacion: 3, subtipoInvocacion: 'celestial',
    });
    const pjEditado = personaje();
    pjEditado.espaciosConjuroGastados = { '1': 4 };
    pjEditado.puntosConjuroGastados = 8;
    pjEditado.acompanantes[0].velocidad = '90 pies';
    usarAlmacenDM.setState({ personajes: [pjEditado], borradoresSync: recuperados });
    expect(usarAlmacenDM.getState().reaplicarBorradorSync('pj')).toBe(true);
    expect(usarAlmacenDM.getState().personajes[0]).toMatchObject({
      espaciosConjuroGastados: { '1': 2 }, puntosConjuroGastados: 3,
      acompanantes: [{ velocidad: '60 pies', idPlantilla: 'corcel' }],
    });
  });

  it('conserva campos locales de borradores antiguos, incluidos cero y null', () => {
    const cambios = prepararCargaPersistida({ borradores_sync: { pj: legado } });
    const recargados = prepararCargaPersistida(JSON.parse(JSON.stringify(construirBlobPersistencia(cambios))));
    usarAlmacenDM.setState({ borradoresSync: recargados.borradoresSync });
    usarAlmacenDM.getState().reaplicarBorradorSync('pj');
    expect(usarAlmacenDM.getState().personajes[0]).toMatchObject({
      hpActual: 7, espaciosPactoGastados: 0, movimientoGastado: 10, movimientoMaximoTemporal: null,
      acompanantes: [{ vidaActual: 8, velocidad: '50 pies', movimientoGastado: 5,
        movimientoMaximoTemporal: 70, idPlantilla: 'corcel-antiguo', nivelConjuroInvocacion: 2 }],
    });
  });

  it('los mismos campos antiguos recibidos por red no modifican recursos, movimiento ni configuración', () => {
    const mensaje = EsquemaWireMensajeSync.parse({ v: 2, s: 'cliente', t: 'PJ', d: legado });
    if (mensaje.t !== 'PJ') throw new Error('Mensaje inesperado');
    expect(mensaje.d).not.toHaveProperty('cj');
    expect(mensaje.d).not.toHaveProperty('gast');
    expect(mensaje.d.ac?.[0]).not.toHaveProperty('plant');
    usarAlmacenDM.getState().actualizarPersonajeDesdeSync(deserializarEstadoCombatePJ(mensaje.d));
    expect(usarAlmacenDM.getState().personajes[0]).toMatchObject({
      hpActual: 7, espaciosConjuroGastados: { '1': 2 }, puntosConjuroGastados: 3,
      espaciosPactoGastados: 1, movimientoGastado: 15, movimientoMaximoTemporal: 60,
      acompanantes: [{ vidaActual: 8, velocidad: '60 pies', movimientoGastado: 20,
        movimientoMaximoTemporal: null, idPlantilla: 'corcel', nivelConjuroInvocacion: 3 }],
    });
  });

  it('la red del DM también descarta campos retirados y conserva turno, ronda y combate', () => {
    const mensaje = EsquemaWireMensajeSync.parse({ v: 2, s: 'dm', t: 'DM', d: {
      c: [{ id: 'mini', n: 'Criatura', i: 15, va: 8, vm: 20, plant: 'plantilla', vel: '60 pies', gast: 20, maxT: 90 }],
      t: 0, r: 3, v: false, mv: 'maximo', ts: 1,
    } });
    if (mensaje.t !== 'DM') throw new Error('Mensaje inesperado');
    expect(mensaje.d).toMatchObject({ t: 0, r: 3, c: [{ id: 'mini', va: 8, vm: 20 }] });
    for (const campo of ['plant', 'vel', 'gast', 'maxT']) expect(mensaje.d.c[0]).not.toHaveProperty(campo);
  });

  it('un borrador antiguo inválido detiene la carga sin mutar la ficha', () => {
    const personajes = usarAlmacenDM.getState().personajes;
    expect(() => prepararCargaPersistida({ notas: 'No aplicar', borradores_sync: {
      pj: { ...legado, cj: { ...legado.cj, pg: 'inválido' } },
    } })).toThrow();
    expect(usarAlmacenDM.getState().personajes).toBe(personajes);
  });
});
