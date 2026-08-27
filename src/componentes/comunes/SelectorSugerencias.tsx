import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check } from "lucide-react";
import { coincideBusquedaTolerante } from "@/utiles/busquedaTolerante";
import estilos from "./SelectorSugerencias.module.css";

export interface OpcionSugerencia {
  valor: string;
  etiqueta?: string;
  grupo?: string;
  subtitulo?: string;
}

export type OpcionEntradaSugerencia = string | OpcionSugerencia;

export interface SelectorSugerenciasProps {
  valor: string;
  alCambiar: (nuevoValor: string) => void;
  opciones: readonly OpcionEntradaSugerencia[] | OpcionEntradaSugerencia[];
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

  // Normalizar opciones a OpcionSugerencia
  const opcionesNormalizadas = useMemo<OpcionSugerencia[]>(() => {
    return opciones.map((opt) => {
      if (typeof opt === "string") {
        return { valor: opt, etiqueta: opt };
      }
      return opt;
    });
  }, [opciones]);

  // Filtrar sugerencias relevantes en base al texto escrito de forma tolerante (tildes, mayúsculas, etc.)
  const opcionesFiltradas = useMemo<OpcionSugerencia[]>(() => {
    if (!valor || !valor.trim()) return opcionesNormalizadas;

    const filtradas = opcionesNormalizadas.filter((opcion) => {
      return coincideBusquedaTolerante(
        [opcion.valor, opcion.etiqueta, opcion.grupo, opcion.subtitulo],
        valor
      );
    });

    return filtradas;
  }, [valor, opcionesNormalizadas]);

  // Agrupar opciones filtradas por categoría/grupo
  const gruposOpciones = useMemo(() => {
    const gruposMap = new Map<string, OpcionSugerencia[]>();
    const sinGrupo: OpcionSugerencia[] = [];

    opcionesFiltradas.forEach((opcion) => {
      if (opcion.grupo) {
        const lista = gruposMap.get(opcion.grupo) || [];
        lista.push(opcion);
        gruposMap.set(opcion.grupo, lista);
      } else {
        sinGrupo.push(opcion);
      }
    });

    return { gruposMap, sinGrupo, tieneGrupos: gruposMap.size > 0 };
  }, [opcionesFiltradas]);

  const seleccionarOpcion = (opcionValor: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    alCambiar(opcionValor);
    setAbierto(false);
  };

  const alternarDesplegable = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!disabled) {
      setAbierto((prev) => !prev);
    }
  };

  const renderFilaOpcion = (opcion: OpcionSugerencia) => {
    const estaSeleccionada = opcion.valor.toLowerCase() === valor.trim().toLowerCase();
    return (
      <button
        key={opcion.valor}
        type="button"
        onClick={(e) => seleccionarOpcion(opcion.valor, e)}
        className={`${estilos.opcion} ${estaSeleccionada ? estilos.opcionSeleccionada : ""}`}
      >
        <div className={estilos.infoOpcion}>
          <span className={estilos.nombreOpcion}>{opcion.etiqueta || opcion.valor}</span>
          {opcion.subtitulo && (
            <span className={estilos.subtituloOpcion}>{opcion.subtitulo}</span>
          )}
        </div>
        {estaSeleccionada && <Check size={12} />}
      </button>
    );
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
            gruposOpciones.tieneGrupos ? (
              <>
                {Array.from(gruposOpciones.gruposMap.entries()).map(([nombreGrupo, items]) => (
                  <div key={nombreGrupo} className={estilos.seccionGrupo}>
                    <div className={estilos.encabezadoGrupo}>
                      <span>{nombreGrupo}</span>
                      <span className={estilos.badgeConteoGrupo}>{items.length}</span>
                    </div>
                    {items.map((opcion) => renderFilaOpcion(opcion))}
                  </div>
                ))}
                {gruposOpciones.sinGrupo.length > 0 &&
                  gruposOpciones.sinGrupo.map((opcion) => renderFilaOpcion(opcion))}
              </>
            ) : (
              opcionesFiltradas.map((opcion) => renderFilaOpcion(opcion))
            )
          ) : (
            <div className={estilos.sinResultados}>No hay sugerencias</div>
          )}
        </div>
      )}
    </div>
  );
};
