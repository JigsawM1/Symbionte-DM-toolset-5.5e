import { useState } from "react";
import { DialogoModal } from "@/componentes/comunes/DialogoModal";
import { confirmarOpcionDialogo } from "./elegirVarianteConjuro";
import { Sparkles, X } from "lucide-react";
import estilos from "./DialogoRasgo.module.css";

export interface OpcionesDialogoLanzamiento {
  nombre: string;
  etiqueta: string;
  descripcion: string;
  opciones: { id: string; texto: string; detalle?: string; deshabilitado?: boolean }[];
  recordar?: {
    permitido: (idOpcion: string) => boolean;
    alRecordar: (idOpcion: string) => void;
    aviso?: string;
  };
}

export function DialogoVariante({ nombre, etiqueta, descripcion, opciones, recordar, resolver }: OpcionesDialogoLanzamiento & { resolver: (valor?: string) => void }) {
  const [marcado, setMarcado] = useState(false);

  const seleccionar = (idOpcion: string) => {
    confirmarOpcionDialogo(idOpcion, marcado, recordar, resolver);
  };

  return <DialogoModal className={estilos.dialogo} etiqueta={etiqueta} alCerrar={() => resolver()}>
    <header className={estilos.cabecera}><Sparkles size={18} aria-hidden="true" /><h3>{nombre}</h3>
      <button type="button" className={estilos.cerrar} aria-label="Cerrar opciones de lanzamiento" onClick={() => resolver()}><X size={18} /></button></header>
    <div className={`u-scroll-cef ${estilos.cuerpo}`}><p className={estilos.introduccion}>{descripcion}</p>
      <div className={estilos.opcionesLanzamiento}>{opciones.map(o => <button type="button" key={o.id} disabled={o.deshabilitado}
        aria-label={o.texto} onClick={() => seleccionar(o.id)}><strong>{o.texto}</strong>{o.detalle && <span>{o.detalle}</span>}</button>)}</div>
      {recordar && (
        <div className={estilos.bloqueRecordar}>
          <label className={estilos.labelRecordar}>
            <input
              type="checkbox"
              checked={marcado}
              onChange={e => setMarcado(e.target.checked)}
            />
            <span>Recordar mi elección para este rasgo</span>
          </label>
          {recordar.aviso && <small className={estilos.avisoRecordar}>{recordar.aviso}</small>}
        </div>
      )}
    </div>
    <footer className={estilos.acciones}>
      <button type="button" onClick={() => resolver()}>Cancelar</button>
    </footer>
  </DialogoModal>;
}

