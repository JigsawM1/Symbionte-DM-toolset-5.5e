import { useMemo, useState } from "react";
import type { SelectorRasgo, RasgoPersonaje } from "@/tipos";
import type { ReactNode } from "react";
import { Check, ChevronRight, ListChecks, Search } from "lucide-react";
import { TextoEnriquecidoDND, ControlPaginacion } from "@/componentes/comunes";
import extras from "./ExtrasRasgos.module.css";

/** Caja informativa reutilizable; la ejecución de cada opción se configura aparte. */
export function SelectorOpcionesAcordeon({ selector, nivelPersonaje = 1, alActualizarSeleccion, rasgosAprendidos, renderizarTarjetaRasgo }: {
  selector: SelectorRasgo; nivelPersonaje?: number;
  alActualizarSeleccion?: (idSelector: string, valores: string[]) => void;
  rasgosAprendidos?: RasgoPersonaje[];
  renderizarTarjetaRasgo?: (rasgo: RasgoPersonaje, indice: number) => ReactNode;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [soloAprendidas, setSoloAprendidas] = useState(false);
  const seleccionados = selector.valorActual;
  const max = [...(selector.escaladoMaxSelecciones ?? [])].sort((a, b) => b.nivelMinimo - a.nivelMinimo)
    .find(e => nivelPersonaje >= e.nivelMinimo)?.valor ?? selector.maxSelecciones;
  const consulta = selector.modo === "consulta";
  const opciones = useMemo(() => selector.opciones.filter(o => o.categoriaMecanica !== "extension"
    && (o.nivelMinimo ?? 1) <= nivelPersonaje
    && (!soloAprendidas || seleccionados.includes(o.id))
    && `${o.nombre} ${o.descripcion}`.toLocaleLowerCase("es").includes(busqueda.toLocaleLowerCase("es"))), [selector.opciones, nivelPersonaje, busqueda, soloAprendidas, seleccionados]);
  const paginas = Math.max(1, Math.ceil(opciones.length / 6));
  const actual = Math.min(pagina, paginas);
  return <section className={extras.cajaOpciones} aria-label={selector.etiqueta}>
    {!renderizarTarjetaRasgo && <strong className={extras.etiquetaOpciones}>{selector.etiqueta}</strong>}
    <div className={extras.herramientasOpciones}>
      <span className={extras.contadorOpciones}>
        <ListChecks size={15} aria-hidden="true" />
        <strong>{consulta ? opciones.length : `${seleccionados.length} / ${max}`}</strong>
        {consulta ? "disponibles" : "aprendidas"}
      </span>
      {!consulta && <div className={extras.filtrosOpciones} role="group" aria-label="Filtrar opciones">
        <button type="button" className={extras.filtroOpciones} aria-pressed={soloAprendidas}
          onClick={() => { setSoloAprendidas(true); setPagina(1); }}>Aprendidas</button>
        <button type="button" className={extras.filtroOpciones} aria-pressed={!soloAprendidas}
          onClick={() => { setSoloAprendidas(false); setPagina(1); }}>Todas</button>
      </div>}
      <label className={extras.buscadorOpciones}>
        <Search size={15} aria-hidden="true" />
        <input type="search" aria-label={`Buscar en ${selector.etiqueta}`} value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setPagina(1); }} placeholder="Buscar por nombre o descripción" />
      </label>
    </div>
    <div className={extras.listaOpciones}>
      {opciones.slice((actual - 1) * 6, actual * 6).map((op, indice) => {
        const elegido = seleccionados.includes(op.id);
        const hijo = rasgosAprendidos?.find(r => r.idSelectorOrigen === selector.id && r.requiereOpcion === op.id);
        return <details key={op.id} className={`${extras.opcion} ${elegido ? extras.opcionAprendida : ""}`}>
          <summary>
            <span className={extras.nombreOpcion}>{op.nombre}</span>
            {elegido && <span className={extras.marcaAprendida} title="Aprendida" aria-label="Aprendida"><Check size={13} aria-hidden="true" /></span>}
            <ChevronRight size={15} className={extras.chevronOpcion} aria-hidden="true" />
          </summary>
          <div className={extras.cuerpoOpcion}>
            {!consulta && <label className={extras.aprenderOpcion}>
              <input type="checkbox" checked={elegido} aria-label={`Aprender ${op.nombre}`}
                disabled={!alActualizarSeleccion || (!elegido && seleccionados.length >= max)}
                onChange={() => alActualizarSeleccion?.(selector.id, elegido ? seleccionados.filter(id => id !== op.id)
                  : selector.tipo === "unico" ? [op.id] : [...seleccionados, op.id])} />
              {elegido ? "Aprendida" : "Marcar como aprendida"}
            </label>}
            {hijo && renderizarTarjetaRasgo ? renderizarTarjetaRasgo(hijo, indice)
              : <TextoEnriquecidoDND texto={op.descripcion} className={extras.descripcionOpcion} />}
          </div>
        </details>;
      })}
    </div>
    {opciones.length === 0 && <p className={extras.opcionesVacias}>No hay opciones que coincidan con estos filtros.</p>}
    <ControlPaginacion paginaActual={actual} totalElementos={opciones.length} elementosPorPagina={6} alCambiarPagina={setPagina}
      tamano="compacto" etiquetaElementos="opciones" />
  </section>;
}
