import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check } from "lucide-react";
import estilos from "./SelectorSugerencias.module.css";

export interface SelectorSugerenciasProps {
  valor: string;
  alCambiar: (nuevoValor: string) => void;
  opciones: readonly string[] | string[];
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export const SelectorSugerencias: React.FC<SelectorSugerenciasProps> = ({
  valor,
  alCambiar,
  opciones,
  placeholder,
  className,
  id,
  disabled = false
}) => {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera del componente
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

  // Filtrar sugerencias relevantes en base al texto escrito
  const opcionesFiltradas = useMemo(() => {
    const textoLimpio = valor.trim().toLowerCase();
    if (!textoLimpio) return opciones;

    const filtradas = opciones.filter((opcion) =>
      opcion.toLowerCase().includes(textoLimpio)
    );

    // Si ninguna coincide exactamente por substring, mostrar todas para que el usuario pueda elegir
    return filtradas.length > 0 ? filtradas : opciones;
  }, [valor, opciones]);

  const seleccionarOpcion = (opcion: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    alCambiar(opcion);
    setAbierto(false);
  };

  const alternarDesplegable = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!disabled) {
      setAbierto((prev) => !prev);
    }
  };

  return (
    <div ref={contenedorRef} className={`${estilos.contenedor} ${className || ""}`}>
      <input
        id={id}
        type="text"
        value={valor}
        onChange={(e) => {
          alCambiar(e.target.value);
          if (!abierto) setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={estilos.input}
        autoComplete="off"
      />

      <button
        type="button"
        onClick={alternarDesplegable}
        disabled={disabled}
        tabIndex={-1}
        className={`${estilos.botonDesplegable} ${abierto ? estilos.botonDesplegableAbierto : ""}`}
        title="Mostrar sugerencias"
      >
        <ChevronDown size={14} />
      </button>

      {abierto && !disabled && (
        <div className={estilos.dropdown}>
          {opcionesFiltradas.length > 0 ? (
            opcionesFiltradas.map((opcion) => {
              const estaSeleccionada = opcion.toLowerCase() === valor.trim().toLowerCase();
              return (
                <button
                  key={opcion}
                  type="button"
                  onClick={(e) => seleccionarOpcion(opcion, e)}
                  className={`${estilos.opcion} ${estaSeleccionada ? estilos.opcionSeleccionada : ""}`}
                >
                  <span>{opcion}</span>
                  {estaSeleccionada && <Check size={12} />}
                </button>
              );
            })
          ) : (
            <div className={estilos.sinResultados}>No hay sugerencias</div>
          )}
        </div>
      )}
    </div>
  );
};
