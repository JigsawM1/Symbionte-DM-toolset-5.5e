import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { BibliotecaCampanias } from './BibliotecaCampanias';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import { PERSONAJE_POR_DEFECTO } from '@/constantes';

it('la biblioteca presenta sólo la campaña actual de forma predeterminada', () => {
  const campania = { id: 'campania', nombre: 'Campaña' };
  usarAlmacenDM.setState({ contextoTaleSpire: { campania, tableroId: 'tablero' }, personajes: [
    { ...PERSONAJE_POR_DEFECTO, id: 'pj', nombre: '9D-2', campaniaTaleSpire: campania },
    { ...PERSONAJE_POR_DEFECTO, id: 'ajena', nombre: 'Ficha ajena', campaniaTaleSpire: null },
  ] });
  const html = renderToStaticMarkup(createElement(BibliotecaCampanias, { idPersonajeActivo: 'pj',
    alSeleccionarActivo: () => {}, alCrearNuevo: () => {}, alDuplicar: () => {}, alEliminar: () => {}, alAbrirFicha: () => {} }));
  expect(html).toContain('9D-2'); expect(html).not.toContain('Ficha ajena'); expect(html).toContain('Esta campaña');
});
