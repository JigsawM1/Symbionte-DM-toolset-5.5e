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
  id
}: SelectorDesplegableProps<T>) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

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
  };

  const claseTamano = tamano === "compacto" 
    ? estilos.tamanoCompacto 
    : tamano === "mini" 
      ? estilos.tamanoMini 
      : "";

  return (
    <div ref={contenedorRef} className={`${estilos.contenedor} ${className || ""}`}>
      <button
        id={id}
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
        <div className={estilos.dropdown}>
          {opcionesNormalizadas.length > 0 ? (
            opcionesNormalizadas.map((op) => {
              const estaSeleccionada = op.valor === valor;
              return (
                <button
                  key={String(op.valor)}
                  type="button"
                  onClick={(e) => seleccionar(op.valor, e)}
                  className={`${estilos.opcion} ${estaSeleccionada ? estilos.opcionSeleccionada : ""}`}
                >
                  <div className={estilos.opcionContenido}>
                    {op.icono}
                    {op.color && (
                      <span
                        className={estilos.indicadorColor}
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
