import { useState } from "react";
import type { RasgoPersonaje, SelectorRasgo } from "@/tipos";
import type { ReactNode } from "react";
import { Lock, Plus, Trash2, Search } from "lucide-react";
import { TextoEnriquecidoDND, SelectorDesplegable, ControlPaginacion } from "@/componentes/comunes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { descomponerSeleccion, seleccionOpcionValida, opcionesElegiblesConjuros } from "@/servicios/rasgos/seleccionesRasgos";
import { SeccionSelectoresModalRasgo } from "./SeccionSelectoresModalRasgo";
import estilos from "./SelectorInvocacionesAcordeon.module.css";

export const ELEMENTOS_POR_PAGINA_INVOCACIONES = 6;
interface Props {
  selector: SelectorRasgo; nivelPersonaje?: number;
  alActualizarSeleccion?: (id: string, valores: string[]) => void;
  elementosPorPagina?: number; tamanoPaginacion?: "compacto" | "normal";
  rasgosAprendidos?: RasgoPersonaje[];
  renderizarTarjetaRasgo?: (rasgo: RasgoPersonaje, indice: number) => ReactNode;
}

/** Las elecciones y su configuración se derivan del catálogo validado. */
export function SelectorInvocacionesAcordeon({ selector, nivelPersonaje = 1, alActualizarSeleccion,
  elementosPorPagina = ELEMENTOS_POR_PAGINA_INVOCACIONES, tamanoPaginacion = "normal", rasgosAprendidos, renderizarTarjetaRasgo }: Props) {
  const pj = usarAlmacenDM(s => s.personajes.find(p => p.id === s.idPersonajeActivo));
  const actualizar = usarAlmacenDM(s => s.actualizarSeleccionRasgo);
  const valores = selector.valorActual;
  const [filtro, setFiltro] = useState(valores.length ? "aprendidas" : "todas");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const max = [...(selector.escaladoMaxSelecciones ?? [])].sort((a,b) => b.nivelMinimo-a.nivelMinimo)
    .find(e => nivelPersonaje >= e.nivelMinimo)?.valor ?? selector.maxSelecciones;
  const opciones = selector.opciones.filter(o => (filtro !== "aprendidas" || valores.some(v => descomponerSeleccion(v).base === o.id
      && (!rasgosAprendidos || rasgosAprendidos.some(r => r.requiereOpcion === v))))
    && o.nombre.toLocaleLowerCase("es").includes(busqueda.toLocaleLowerCase("es")));
  const paginaActual = Math.max(1, Math.min(pagina, Math.ceil(opciones.length / elementosPorPagina) || 1));
  const cambiar = (nuevos: string[]) => alActualizarSeleccion?.(selector.id, nuevos);
  const padre = pj?.rasgos.find(r => r.selectores?.some(s => s.id === selector.id));
  return <div className={estilos.contenedorAcordeonInvocaciones}>
    <div className={estilos.barraHerramientasInvocaciones}>
      <div className={estilos.contenedorBuscador}><Search size={14} /><input className={estilos.inputBuscadorInvocaciones}
        aria-label="Buscar invocaciones" placeholder="Buscar invocaciones" value={busqueda}
        onChange={e => { setBusqueda(e.target.value); setPagina(1); }} /></div>
      <div className={estilos.filtrosEstadoInvocaciones}>
        <button type="button" className={estilos.botonFiltroEstado} aria-pressed={filtro === "aprendidas"}
          onClick={() => { setFiltro("aprendidas"); setPagina(1); }}>Aprendidas ({valores.length}/{max})</button>
        <button type="button" className={estilos.botonFiltroEstado} aria-pressed={filtro === "todas"}
          onClick={() => { setFiltro("todas"); setPagina(1); }}>Todas</button>
      </div>
    </div>
    <div className={estilos.listaCajasInvocaciones}>
      {opciones.slice((paginaActual-1)*elementosPorPagina, paginaActual*elementosPorPagina).map(op => {
        const instancias = valores.filter(v => descomponerSeleccion(v).base === op.id);
        const permitido = valores.length < max && seleccionOpcionValida(selector, op.id, [...valores, op.id], nivelPersonaje, pj);
        const dependientes = valores.some(v => selector.opciones.find(o => o.id === descomponerSeleccion(v).base)?.requisitoInvocacion === op.id);
        const referencia = op.repetible && op.selectores?.length === 1 ? op.selectores[0] : undefined;
        return <details key={op.id} className={estilos.tarjetaInvocacionCaja}>
          <summary className={estilos.cabeceraInvocacionCaja}>{op.nombre}{instancias.length > 0 ? ` (${instancias.length} aprendida${instancias.length > 1 ? "s" : ""})` : ""}</summary>
          <div className={estilos.cuerpoInvocacionCaja}>
          {(filtro !== "aprendidas" || !renderizarTarjetaRasgo) && <TextoEnriquecidoDND texto={op.descripcion} />}
          {instancias.map((valor, indice) => {
            const hijo = pj?.rasgos.find(r => r.ligadoA === padre?.id && r.idSelectorOrigen === selector.id && r.requiereOpcion === valor);
            if (filtro === "aprendidas" && rasgosAprendidos && !rasgosAprendidos.some(r => r.id === hijo?.id)) return null;
            const argumento = descomponerSeleccion(valor).argumento;
            const opcionesReferencia = referencia ? opcionesElegiblesConjuros(referencia, pj).filter(o =>
              !instancias.some(v => v !== valor && descomponerSeleccion(v).argumento === o.id)) : [];
            return <div key={valor} className={estilos.zonaConfiguracionMecanica}>
              {filtro === "aprendidas" && hijo && renderizarTarjetaRasgo?.(hijo, indice)}
              {referencia ? <SelectorDesplegable valor={argumento ?? ""} placeholder="Elige una opción válida"
                titulo={`${op.nombre}: ${referencia.etiqueta} ${indice+1}`}
                opciones={opcionesReferencia.map(o => ({ valor:o.id, etiqueta:o.nombre }))}
                alCambiar={id => cambiar(valores.map(v => v === valor ? `${descomponerSeleccion(v).instancia}:${id}` : v))} />
                : hijo?.selectores?.length ? <SeccionSelectoresModalRasgo selectores={hijo.selectores} nivelPersonaje={nivelPersonaje}
                    alActualizarSeleccion={(id, seleccion) => { if (pj) actualizar(pj.id, hijo.id, id, seleccion); }} /> : null}
              <button type="button" className={estilos.botonAccionQuitar} disabled={!alActualizarSeleccion || dependientes}
                title={dependientes ? "Otra invocación requiere esta elección; retira primero sus dependientes." : `Quitar ${op.nombre} ${indice+1}`}
                onClick={() => cambiar(valores.filter(v => v !== valor))}><Trash2 size={13} />Quitar {op.nombre} {indice+1}</button>
            </div>;
          })}
          {(!instancias.length || op.repetible) && <button type="button" className={permitido ? estilos.botonAccionAgregar : estilos.botonAccionBloqueado}
            disabled={!alActualizarSeleccion || (!op.repetible && !permitido) || valores.length >= max
              || (op.nivelMinimo ?? 1) > nivelPersonaje || Boolean(op.requisitoInvocacion && !valores.some(v => descomponerSeleccion(v).base === op.requisitoInvocacion))}
            onClick={() => cambiar([...valores, instancias.length ? `${op.id}__${crypto.randomUUID()}` : op.id])}>
            {permitido || op.repetible ? <Plus size={13} /> : <Lock size={13} />} {instancias.length ? "Aprender otra" : "Aprender invocación"}
          </button>}
          </div>
        </details>;
      })}
    </div>
    {opciones.length > elementosPorPagina && <ControlPaginacion paginaActual={paginaActual} totalElementos={opciones.length}
      elementosPorPagina={elementosPorPagina} alCambiarPagina={setPagina} tamano={tamanoPaginacion} etiquetaElementos="invocaciones" />}
  </div>;
}
