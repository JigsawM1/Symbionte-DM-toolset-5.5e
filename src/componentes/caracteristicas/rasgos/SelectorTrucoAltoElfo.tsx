import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { coincideBusquedaTolerante, compararPorRelevanciaTitulo } from "@/utiles/busquedaTolerante";
import estilos from "@/componentes/comunes/SelectorSugerencias.module.css";

export interface OpcionTrucoMago {
  id: string;
  nombre: string;
  subtitulo?: string;
}

interface SelectorTrucoAltoElfoProps {
  idSelector: string;
  trucoIdActual: string;
  opciones: OpcionTrucoMago[];
  alActualizarSeleccion?: (idSelector: string, valores: string[]) => void;
  placeholder?: string;
}

export const SelectorTrucoAltoElfo: React.FC<SelectorTrucoAltoElfoProps> = ({
  idSelector,
  trucoIdActual,
  opciones,
  alActualizarSeleccion,
  placeholder = "Buscar truco de mago..."
}) => {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Encontrar el truco actualmente seleccionado
  const trucoActual = useMemo(() => {
    return (
      opciones.find((o) => o.id === trucoIdActual) ||
      opciones.find((o) => o.id === "prestidigitacion") ||
      opciones[0]
    );
  }, [opciones, trucoIdActual]);

  const nombreActual = trucoActual?.nombre || "Prestidigitación";

  // Estado del texto escrito en el input
  const [texto, setTexto] = useState(nombreActual);
  const [estaAbierto, setEstaAbierto] = useState(false);
  const [estaEditando, setEstaEditando] = useState(false);

  // Sincronizar el texto cuando cambia el truco seleccionado externamente
  useEffect(() => {
    if (!estaEditando) {
      setTexto(nombreActual);
    }
  }, [nombreActual, estaEditando]);

  // Cerrar al hacer clic fuera y restaurar el nombre del truco si quedó incompleto
  useEffect(() => {
    const manejarClicFuera = (e: MouseEvent | TouchEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setEstaAbierto(false);
        setEstaEditando(false);
        setTexto(nombreActual);
      }
    };

    document.addEventListener("mousedown", manejarClicFuera);
    document.addEventListener("touchstart", manejarClicFuera);
    return () => {
      document.removeEventListener("mousedown", manejarClicFuera);
      document.removeEventListener("touchstart", manejarClicFuera);
    };
  }, [nombreActual]);

  // Filtrar trucos disponibles en base a lo que el usuario escribe
  const opcionesFiltradas = useMemo(() => {
    const busqueda = texto.trim();
    // Si el usuario borró todo o el texto es igual al truco actual, mostrar todas las opciones
    if (!busqueda || (!estaEditando && busqueda.toLowerCase() === nombreActual.toLowerCase())) {
      return opciones;
    }

    return opciones
      .filter((op) => coincideBusquedaTolerante([op.nombre, op.subtitulo, op.id], busqueda))
      .sort(
        compararPorRelevanciaTitulo(
          (op) => op.nombre,
          busqueda,
          (a, b) => a.nombre.localeCompare(b.nombre, "es"),
          (op) => [op.subtitulo]
        )
      );
  }, [opciones, texto, estaEditando, nombreActual]);

  const seleccionarOpcion = (opcion: OpcionTrucoMago, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setTexto(opcion.nombre);
    setEstaEditando(false);
    setEstaAbierto(false);
    if (alActualizarSeleccion) {
      alActualizarSeleccion(idSelector, [opcion.id]);
    }
  };

  const limpiarCampo = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setTexto("");
    setEstaEditando(true);
    setEstaAbierto(true);
    inputRef.current?.focus();
  };

  const alternarDesplegable = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEstaAbierto((prev) => !prev);
    if (!estaAbierto) {
      inputRef.current?.focus();
    }
  };

  return (
    <div ref={contenedorRef} className={estilos.contenedor}>
      <input
        ref={inputRef}
        type="text"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setEstaEditando(true);
          if (!estaAbierto) setEstaAbierto(true);
        }}
        onFocus={() => {
          setEstaAbierto(true);
        }}
        placeholder={placeholder}
        className={estilos.input}
        autoComplete="off"
      />

      <div style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 2 }}>
        {texto && (
          <button
            type="button"
            onClick={limpiarCampo}
            tabIndex={-1}
            className={estilos.botonDesplegable}
            style={{ position: "static", transform: "none" }}
            title="Borrar texto para buscar"
          >
            <X size={13} />
          </button>
        )}

        <button
          type="button"
          onClick={alternarDesplegable}
          tabIndex={-1}
          className={`${estilos.botonDesplegable} ${estaAbierto ? estilos.botonDesplegableAbierto : ""}`}
          style={{ position: "static", transform: "none" }}
          title="Mostrar todos los trucos de mago"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {estaAbierto && (
        <div className={estilos.dropdown}>
          {opcionesFiltradas.length > 0 ? (
            opcionesFiltradas.map((op) => {
              const estaSeleccionada = op.id === (trucoActual?.id || "prestidigitacion");
              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={(e) => seleccionarOpcion(op, e)}
                  className={`${estilos.opcion} ${estaSeleccionada ? estilos.opcionSeleccionada : ""}`}
                >
                  <div className={estilos.infoOpcion}>
                    <span className={estilos.nombreOpcion}>{op.nombre}</span>
                    {op.subtitulo && (
                      <span className={estilos.subtituloOpcion}>{op.subtitulo}</span>
                    )}
                  </div>
                  {estaSeleccionada && <Check size={12} />}
                </button>
              );
            })
          ) : (
            <div className={estilos.sinResultados}>
              No se encontraron trucos de mago que coincidan
            </div>
          )}
        </div>
      )}
    </div>
  );
};
