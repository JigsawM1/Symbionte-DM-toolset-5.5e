import { useEffect, useRef, useState } from "react";
import { Maximize, Minus, Plus, X } from "lucide-react";
import estilos from "./ModalRetratoPersonaje.module.css";

interface ModalRetratoPersonajeProps {
  nombre: string;
  imagen: string;
  alCerrar: () => void;
}

export function ModalRetratoPersonaje({ nombre, imagen, alCerrar }: ModalRetratoPersonajeProps) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const arrastre = useRef<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [posicion, setPosicion] = useState({ x: 0, y: 0 });
  const [errorImagen, setErrorImagen] = useState(false);

  useEffect(() => {
    if (!dialogo.current?.open) dialogo.current?.showModal();
  }, []);

  function ajustarVista() {
    setZoom(1);
    setPosicion({ x: 0, y: 0 });
  }

  function cambiarZoom(valor: number) {
    setZoom(Math.max(1, Math.min(4, valor)));
    if (valor <= 1) setPosicion({ x: 0, y: 0 });
  }

  return (
    <dialog
      ref={dialogo}
      className={estilos.modal}
      aria-label={`Retrato de ${nombre}`}
      onClose={alCerrar}
      onClick={e => { if (e.target === e.currentTarget) dialogo.current?.close(); }}
    >
      <div className={estilos.contenido}>
        <header className={estilos.cabecera}>
          <h2 title={nombre}>{nombre}</h2>
          <button type="button" aria-label="Cerrar retrato" onClick={() => dialogo.current?.close()} autoFocus>
            <X size={18} />
          </button>
        </header>
        <div
          className={estilos.vista}
          role="region"
          aria-label="Vista del retrato. Arrastra o usa las flechas para mover la imagen."
          tabIndex={0}
          onKeyDown={e => {
            const movimiento = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }[e.key];
            if (!movimiento || errorImagen) return;
            e.preventDefault();
            setPosicion(p => ({ x: p.x + movimiento[0], y: p.y + movimiento[1] }));
          }}
          onPointerDown={e => {
            if (e.button !== 0 || !e.isPrimary || errorImagen) return;
            e.currentTarget.focus();
            e.currentTarget.setPointerCapture(e.pointerId);
            arrastre.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerMove={e => {
            if (!arrastre.current) return;
            const dx = e.clientX - arrastre.current.x;
            const dy = e.clientY - arrastre.current.y;
            arrastre.current = { x: e.clientX, y: e.clientY };
            setPosicion(p => ({ x: p.x + dx, y: p.y + dy }));
          }}
          onPointerUp={e => {
            arrastre.current = null;
            if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
          }}
          onLostPointerCapture={() => { arrastre.current = null; }}
          onPointerCancel={() => { arrastre.current = null; }}
        >
          {errorImagen ? <p role="status">No se pudo cargar el retrato. Puedes cambiarlo desde la configuración de la ficha.</p> : (
            <img
              src={imagen}
              alt={`Retrato de ${nombre}`}
              draggable={false}
              onError={() => setErrorImagen(true)}
              // eslint-disable-next-line react/forbid-dom-props -- Zoom y desplazamiento continuos calculados durante la interacción.
              style={{ transform: `translate(${posicion.x}px, ${posicion.y}px) scale(${zoom})` }}
            />
          )}
        </div>
        <footer className={estilos.pie}>
          <div className={estilos.controles}>
            <button type="button" aria-label="Alejar retrato" disabled={zoom <= 1 || errorImagen} onClick={() => cambiarZoom(zoom - 0.25)}><Minus size={16} /></button>
            <label className={estilos.zoom}>
              <span className="u-sr-only">Zoom del retrato</span>
              <input type="range" min="1" max="4" step="0.25" value={zoom} disabled={errorImagen} onChange={e => cambiarZoom(Number(e.target.value))} />
              <output>{Math.round(zoom * 100)}%</output>
            </label>
            <button type="button" aria-label="Acercar retrato" disabled={zoom >= 4 || errorImagen} onClick={() => cambiarZoom(zoom + 0.25)}><Plus size={16} /></button>
            <button type="button" onClick={ajustarVista} disabled={errorImagen}><Maximize size={16} /> Ajustar</button>
          </div>
          <p>Arrastra para mover la imagen. Ajustar restaura la vista completa.</p>
        </footer>
      </div>
    </dialog>
  );
}
