import { useEffect, useRef } from "react";
import { Sparkles, X } from "lucide-react";
import estilos from "./DialogoRasgo.module.css";

export interface OpcionesDialogoLanzamiento {
  nombre: string;
  etiqueta: string;
  descripcion: string;
  opciones: { id: string; texto: string; detalle?: string; deshabilitado?: boolean }[];
}

export function DialogoVariante({ nombre, etiqueta, descripcion, opciones, resolver }: OpcionesDialogoLanzamiento & { resolver: (valor?: string) => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialogo.current?.showModal(); }, []);
  return <dialog ref={dialogo} className={estilos.dialogo} aria-label={etiqueta} onCancel={() => resolver()}>
    <header className={estilos.cabecera}><Sparkles size={18} aria-hidden="true" /><h3>{nombre}</h3>
      <button type="button" className={estilos.cerrar} aria-label="Cerrar opciones de lanzamiento" onClick={() => resolver()}><X size={18} /></button></header>
    <div className={`u-scroll-cef ${estilos.cuerpo}`}><p className={estilos.introduccion}>{descripcion}</p>
      <div className={estilos.opcionesLanzamiento}>{opciones.map(o => <button type="button" key={o.id} disabled={o.deshabilitado}
        aria-label={o.texto} onClick={() => resolver(o.id)}><strong>{o.texto}</strong>{o.detalle && <span>{o.detalle}</span>}</button>)}</div>
    </div>
    <footer className={estilos.acciones}>
      <button type="button" onClick={() => resolver()}>Cancelar</button>
    </footer>
  </dialog>;
}

