import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import { calcularEstadisticasPersonaje } from '@/almacen/selectores/usarEstadoPersonajes';
import { usarLanzadorConjuros, type ControlLanzadorConjuros } from '@/hooks/usarLanzadorConjuros';
import { PERSONAJE_POR_DEFECTO } from '@/constantes/personajeConstantes';
import { EsquemaArmadura, EsquemaObjetoInventario, type HechizoBase, type PersonajeJugador } from '@/tipos';
import { lanzarDadosTaleSpire } from '@/utiles/lanzadorDados';

vi.mock('@/utiles/lanzadorDados', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/utiles/lanzadorDados')>();
  return { ...original, lanzarDadosTaleSpire: vi.fn().mockResolvedValue(undefined) };
});

describe('Reproducciones semánticas de auditoría UI', () => {
  it('rechaza un lanzamiento cuando todos los espacios están gastados', async () => {
    const personaje: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO, id: 'auditoria-mago', nombre: 'Mago auditoría',
      espaciosConjuroMaximos: { '1': 1 }, espaciosConjuroGastados: { '1': 1 }, nivelConjuroMaximo: 1
    };
    const hechizo: HechizoBase = {
      id: 'auditoria-escudo', nombre: 'Escudo', nivel: 1, escuela: 'Abjuracion',
      tiempoLanzamiento: '1 Reaccion', alcance: 'Personal',
      componentesSeleccionados: { verbal: true, somatico: true, material: false },
      duracion: '1 ronda', concentracion: false, ritual: false, descripcion: 'Prueba auditoría.'
    };
    usarAlmacenDM.setState({ personajes: [personaje], datosInicialesCargados: false });
    let controlador: ControlLanzadorConjuros | undefined;
    function Harness() {
      controlador = usarLanzadorConjuros({ personaje, sistemaMagia: 'espacios' });
      return null;
    }
    renderToStaticMarkup(<Harness />);
    if (!controlador) throw new Error('No se montó el hook');
    const aceptado = await controlador.lanzar({ hechizo, modo: 'espacio', nivelLanzamiento: 1 });
    expect(aceptado).toBe(false);
    expect(lanzarDadosTaleSpire).not.toHaveBeenCalled();
    expect(usarAlmacenDM.getState().personajes[0].espaciosConjuroGastados).toEqual({ '1': 1 });
  });

  it('invalida CA al editar el catálogo con idéntica referencia de personaje', () => {
    const armadura = EsquemaArmadura.parse({ id: 'auditoria-armadura', nombre: 'Coraza auditoría', caBase: 12, bonoDestreza: 'Sin Bono' });
    const personaje: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO, id: 'auditoria-armadura-pj',
      inventario: [EsquemaObjetoInventario.parse({
        idInstancia: 'inst-auditoria', idObjeto: armadura.id, nombre: armadura.nombre,
        categoria: 'armaduras', equipado: true
      })]
    };
    usarAlmacenDM.setState({ objetosHomebrew: [armadura], personajes: [personaje], datosInicialesCargados: false });
    const inicial = calcularEstadisticasPersonaje(personaje);
    const armaduraEditada = { ...armadura, caBase: 19 };
    usarAlmacenDM.getState().actualizarObjetoHomebrew(armadura.id, armaduraEditada);
    const cacheada = calcularEstadisticasPersonaje(personaje);
    const recalculada = calcularEstadisticasPersonaje(personaje, usarAlmacenDM.getState().objetosHomebrew);
    expect(inicial.claseArmadura.total).toBe(12);
    expect(cacheada.claseArmadura.total).toBe(19);
    expect(recalculada.claseArmadura.total).toBe(19);
  });
});
