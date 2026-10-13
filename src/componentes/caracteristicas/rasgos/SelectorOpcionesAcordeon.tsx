import { useMemo, useState } from "react";
import type { SelectorRasgo } from "@/tipos";
import { TextoEnriquecidoDND, ControlPaginacion } from "@/componentes/comunes";
import extras from "./ExtrasRasgos.module.css";
import estilos from "./SelectorInvocacionesAcordeon.module.css";

/** Caja informativa reutilizable; la ejecución de cada opción se configura aparte. */
export function SelectorOpcionesAcordeon({ selector, nivelPersonaje = 1, alActualizarSeleccion }: {
  selector: SelectorRasgo; nivelPersonaje?: number;
  alActualizarSeleccion?: (idSelector: string, valores: string[]) => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const seleccionados = selector.valorActual ?? [];
  const max = [...(selector.escaladoMaxSelecciones ?? [])].sort((a, b) => b.nivelMinimo - a.nivelMinimo)
    .find(e => nivelPersonaje >= e.nivelMinimo)?.valor ?? selector.maxSelecciones;
  const consulta = selector.modo === "consulta";
  const opciones = useMemo(() => selector.opciones.filter(o => (o.nivelMinimo ?? 1) <= nivelPersonaje
    && `${o.nombre} ${o.descripcion}`.toLocaleLowerCase("es").includes(busqueda.toLocaleLowerCase("es"))), [selector.opciones, nivelPersonaje, busqueda]);
  const paginas = Math.max(1, Math.ceil(opciones.length / 6));
  const actual = Math.min(pagina, paginas);
  return <section className={`${estilos.contenedorAcordeonInvocaciones} ${extras.cajaOpciones}`} aria-label={selector.etiqueta}>
    <div className={estilos.barraHerramientasInvocaciones}>
      <strong>{selector.etiqueta}</strong>
      <span>{consulta ? `${opciones.length} disponibles` : `${seleccionados.length} / ${max} aprendidas`}</span>
      <input className={estilos.inputBuscadorInvocaciones} aria-label={`Buscar en ${selector.etiqueta}`} value={busqueda}
        onChange={e => { setBusqueda(e.target.value); setPagina(1); }} placeholder="Buscar opciones" />
    </div>
    <div className={estilos.listaCajasInvocaciones}>
      {opciones.slice((actual - 1) * 6, actual * 6).map(op => {
        const elegido = seleccionados.includes(op.id);
        return <details key={op.id} className={estilos.tarjetaInvocacionCaja}>
          <summary>{op.nombre}</summary>
          {!consulta && <label>
            <input type="checkbox" checked={elegido} aria-label={`Aprender ${op.nombre}`}
              disabled={!alActualizarSeleccion || (!elegido && seleccionados.length >= max)}
              onChange={() => alActualizarSeleccion?.(selector.id, elegido ? seleccionados.filter(id => id !== op.id)
                : selector.tipo === "unico" ? [op.id] : [...seleccionados, op.id])} /> Aprendida
          </label>}
          <TextoEnriquecidoDND texto={op.descripcion} />
        </details>;
      })}
    </div>
    <ControlPaginacion paginaActual={actual} totalElementos={opciones.length} elementosPorPagina={6} alCambiarPagina={setPagina} />
  </section>;
}
