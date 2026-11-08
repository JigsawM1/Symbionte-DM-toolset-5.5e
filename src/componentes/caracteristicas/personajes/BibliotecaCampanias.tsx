import { useState, type ComponentProps } from 'react';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import { personajesDelContexto } from '@/almacen/campaniasPersonajes';
import { GestorPersonajes } from './GestorPersonajes';
import { SelectorDesplegable } from '@/componentes/comunes/SelectorDesplegable';

export function BibliotecaCampanias(props: Omit<ComponentProps<typeof GestorPersonajes>, 'personajes'>) {
  const [filtro, setFiltro] = useState('actual');
  const biblioteca = usarAlmacenDM(s => s.personajes);
  const contexto = usarAlmacenDM(s => s.contextoTaleSpire);
  const afiliar = usarAlmacenDM(s => s.afiliarPersonajeACampania);
  const actuales = personajesDelContexto({ personajes: biblioteca, contextoTaleSpire: contexto });
  const ids = new Set(actuales.map(p => p.id));
  const visibles = biblioteca.filter(p => filtro === 'todas' || (filtro === 'actual' ? ids.has(p.id)
    : filtro === 'sin' ? !p.campaniaTaleSpire : !!p.campaniaTaleSpire && !ids.has(p.id)));
  return <>
    <SelectorDesplegable titulo="Campaña de las fichas" valor={filtro} alCambiar={setFiltro} opciones={[
      { valor: 'actual', etiqueta: 'Esta campaña' }, { valor: 'sin', etiqueta: 'Sin campaña' },
      { valor: 'otras', etiqueta: 'Otras campañas' }, { valor: 'todas', etiqueta: 'Todas' },
    ]} />
    {!actuales.length && <p>No hay fichas afiliadas. Crea una o elige «Sin campaña» para afiliarla explícitamente.</p>}
    <GestorPersonajes {...props} personajes={visibles} puedeActivar={p => ids.has(p.id)}
      alAfiliar={contexto ? id => { afiliar(id); } : undefined} />
  </>;
}
