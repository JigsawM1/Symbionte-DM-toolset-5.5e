import type { ReactNode } from "react";
import type { RasgoPersonaje } from "@/tipos";
import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { SelectorOpcionesAcordeon } from "./SelectorOpcionesAcordeon";
import estilos from "./VistaRasgosJugador.module.css";
import extras from "./ExtrasRasgos.module.css";

export function SeccionOpcionesRasgos({ rasgo, nivel, colapsada, alternar, hijos, renderizar, actualizar }: {
  rasgo: RasgoPersonaje; nivel: number; colapsada: boolean; alternar: () => void; hijos: RasgoPersonaje[];
  renderizar: (rasgo: RasgoPersonaje, indice: number) => ReactNode;
  actualizar: (idSelector: string, valores: string[]) => void;
}) {
  const etiqueta = rasgo.selectores?.find(s => s.ubicacion === "seccion")?.etiqueta ?? rasgo.nombre;
  return <section className={`${estilos.seccionPrincipal} ${extras.seccionOpciones}`} aria-label={etiqueta} data-seccion-rasgos="opciones">
    <button type="button" className={`${estilos.cabeceraSeccionPrincipal} ${extras.cabeceraOpciones}`}
      aria-expanded={!colapsada} aria-controls={`opciones-${rasgo.id}`} onClick={alternar}>
      <span className={extras.tituloCabeceraOpciones}>
        {colapsada ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
        <BookOpen size={14} className={extras.iconoOpciones} aria-hidden="true" />
        <span className={estilos.tituloSeccion}>{etiqueta}</span>
      </span>
    </button>
    {!colapsada && <div id={`opciones-${rasgo.id}`} className={`${estilos.cuerpoSeccionPrincipal} ${extras.cuerpoSeccionOpciones}`}>
      {rasgo.selectores?.map(selector => <SelectorOpcionesAcordeon key={selector.id} selector={selector}
        nivelPersonaje={nivel} alActualizarSeleccion={actualizar} rasgosAprendidos={hijos} renderizarTarjetaRasgo={renderizar} />)}
    </div>}
  </section>;
}
