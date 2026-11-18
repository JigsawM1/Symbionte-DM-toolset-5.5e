import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import estilos from "./SelectorDesplegable.module.css";

export interface OpcionDesplegable<T extends string = string> {
  valor?: T;
  clave?: T;
  etiqueta?: string;
  nombre?: string;
  color?: string;
  icono?: React.ReactNode;
}

export type OpcionEntrada<T extends string = string> = T | OpcionDesplegable<T>;

export interface SelectorDesplegableProps<T extends string = string> {
  valor: T;
  alCambiar: (nuevoValor: T) => void;
  opciones: readonly OpcionEntrada<T>[] | OpcionEntrada<T>[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  tamano?: "normal" | "compacto" | "mini";
  titulo?: string;
  id?: string;
  enFlujo?: boolean;
}

export function SelectorDesplegable<T extends string = string>({
  valor,
  alCambiar,
  opciones,
  placeholder = "Seleccionar...",
  className,
  disabled = false,
  tamano = "normal",
  titulo,
  id,
  enFlujo = false
}: SelectorDesplegableProps<T>) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const gatilloRef = useRef<HTMLButtonElement>(null);
  const idLista = React.useId();
  const indiceInicial = useRef<number | null>(null);

  // Normalizar opciones a formato estándar { valor, etiqueta, color, icono }
  const opcionesNormalizadas = React.useMemo(() => {
    return opciones.map((op) => {
      if (typeof op === "string") {
        return { valor: op as T, etiqueta: op, color: undefined, icono: undefined };
      }
      const val = (op.valor !== undefined ? op.valor : op.clave) as T;
      const etiq = op.etiqueta || op.nombre || String(val);
      return {
        valor: val,
        etiqueta: etiq,
        color: op.color,
        icono: op.icono
      };
    });
  }, [opciones]);

  // Obtener la opción actualmente seleccionada
  const opcionActual = React.useMemo(() => {
    return opcionesNormalizadas.find((op) => op.valor === valor);
  }, [opcionesNormalizadas, valor]);

  useEffect(() => {
    if (!abierto) return;
    // Un render del padre no debe reiniciar la navegación que ya está dentro de la lista.
    if (contenedorRef.current?.contains(document.activeElement) && document.activeElement?.getAttribute("role") === "option") return;
    const botones = contenedorRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
    const elegido = opcionesNormalizadas.findIndex(op => op.valor === valor);
    botones?.[indiceInicial.current ?? Math.max(0, elegido)]?.focus();
    indiceInicial.current = null;
  }, [abierto, opcionesNormalizadas, valor]);

  const manejarTeclado = (evento: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (evento.key === "Escape" && abierto) {
      evento.preventDefault(); evento.stopPropagation();
      setAbierto(false); gatilloRef.current?.focus();
    } else if (evento.key === "Tab" && abierto) {
      // Continuar desde el gatillo conserva el siguiente control en el orden de tabulación.
      gatilloRef.current?.focus(); setAbierto(false);
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(evento.key)) {
      evento.preventDefault(); evento.stopPropagation();
      const botones = Array.from(contenedorRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') || []);
      const actual = botones.indexOf(document.activeElement as HTMLButtonElement);
      const total = opcionesNormalizadas.length;
      const indice = evento.key === "Home" ? 0 : evento.key === "End" ? total - 1
        : abierto ? (actual + (evento.key === "ArrowDown" ? 1 : -1) + total) % total
        : evento.key === "ArrowUp" ? total - 1 : Math.max(0, opcionesNormalizadas.findIndex(op => op.valor === valor));
      if (abierto) botones[indice]?.focus();
      else { indiceInicial.current = indice; setAbierto(true); }
    }
  };

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const manejarClicFuera = (event: MouseEvent | TouchEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    };

    document.addEventListener("mousedown", manejarClicFuera);
    document.addEventListener("touchstart", manejarClicFuera);

    return () => {
      document.removeEventListener("mousedown", manejarClicFuera);
      document.removeEventListener("touchstart", manejarClicFuera);
    };
  }, []);

  const alternar = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!disabled) {
      setAbierto((prev) => !prev);
    }
  };

  const seleccionar = (nuevoValor: T, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    alCambiar(nuevoValor);
    setAbierto(false);
    gatilloRef.current?.focus();
  };

  const claseTamano = tamano === "compacto" 
    ? estilos.tamanoCompacto 
    : tamano === "mini" 
      ? estilos.tamanoMini 
      : "";

  return (
    <div
      ref={contenedorRef}
      onKeyDown={manejarTeclado}
      onBlur={evento => { if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) setAbierto(false); }}
      className={`${estilos.contenedor} ${enFlujo ? estilos.contenedorEnFlujo : ""} ${className || ""}`}
    >
      <button
        id={id}
        ref={gatilloRef}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={idLista}
        type="button"
        onClick={alternar}
        disabled={disabled}
        title={titulo}
        className={`${estilos.gatillo} ${claseTamano} ${abierto ? estilos.gatilloAbierto : ""}`}
      >
        <div className={estilos.contenidoGatillo}>
          {opcionActual?.icono}
          {opcionActual?.color && (
            <span
              className={estilos.indicadorColor}
              // eslint-disable-next-line react/forbid-dom-props -- color de opción dinámico provisto por props
              style={{ backgroundColor: opcionActual.color }}
            />
          )}
          <span className={opcionActual ? estilos.textoSeleccionado : estilos.textoPlaceholder}>
            {opcionActual ? opcionActual.etiqueta : placeholder}
          </span>
        </div>
        <ChevronDown
          size={tamano === "mini" ? 12 : 14}
          className={`${estilos.chevronIcono} ${abierto ? estilos.chevronIconoAbierto : ""}`}
        />
      </button>

      {abierto && !disabled && (
        <div id={idLista} role="listbox" aria-label={titulo || placeholder} className={`${estilos.dropdown} ${enFlujo ? estilos.dropdownEnFlujo : ""}`}>
          {opcionesNormalizadas.length > 0 ? (
            opcionesNormalizadas.map((op) => {
              const estaSeleccionada = op.valor === valor;
              return (
                <button
                  key={String(op.valor)}
                  type="button"
                  role="option"
                  aria-selected={estaSeleccionada}
                  tabIndex={-1}
                  onClick={(e) => seleccionar(op.valor, e)}
                  className={`${estilos.opcion} ${estaSeleccionada ? estilos.opcionSeleccionada : ""}`}
                >
                  <div className={estilos.opcionContenido}>
                    {op.icono}
                    {op.color && (
                      <span
                        className={estilos.indicadorColor}
                        // eslint-disable-next-line react/forbid-dom-props -- color de opción dinámico provisto por props
                        style={{ backgroundColor: op.color }}
                      />
                    )}
                    <span className={estilos.opcionTexto}>{op.etiqueta}</span>
                  </div>
                  {estaSeleccionada && <Check size={13} className={estilos.checkIcono} />}
                </button>
              );
            })
          ) : (
            <div className={estilos.sinOpciones}>No hay opciones</div>
          )}
        </div>
      )}
    </div>
  );
}
