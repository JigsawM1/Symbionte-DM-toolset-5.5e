import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check } from "lucide-react";
import { coincideBusquedaTolerante, compararPorRelevanciaTitulo } from "@/utiles/busquedaTolerante";
import estilos from "./SelectorSugerencias.module.css";

export interface OpcionSugerencia {
  valor: string;
  etiqueta?: string;
  grupo?: string;
  subtitulo?: string;
  clave?: string;
}

export type OpcionEntradaSugerencia = string | OpcionSugerencia;

export interface SelectorSugerenciasProps {
  valor: string;
  alCambiar: (nuevoValor: string) => void;
  alSeleccionar?: (opcion: OpcionSugerencia) => void;
  opciones: readonly OpcionEntradaSugerencia[] | OpcionEntradaSugerencia[];
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  tiempoEsperaDebounce?: number;
  abrirAlEnfocar?: boolean;
}

export const SelectorSugerencias: React.FC<SelectorSugerenciasProps> = ({
  valor,
  alCambiar,
  alSeleccionar,
  opciones,
  placeholder,
  className,
  id,
  disabled = false,
  tiempoEsperaDebounce = 500,
  abrirAlEnfocar = true
}) => {
  const [abierto, setAbierto] = useState(false);
  const [estaEscribiendo, setEstaEscribiendo] = useState(false);
  const [terminoDebounced, setTerminoDebounced] = useState("");
  const contenedorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ignorarFoco = useRef(false);
  const idLista = React.useId();
  const [indiceActivo, setIndiceActivo] = useState(-1);

  // Debounce para retrasar la búsqueda/filtrado 500ms tras el último carácter escrito por el usuario
  useEffect(() => {
    if (!valor || !valor.trim()) {
      setTerminoDebounced("");
      setEstaEscribiendo(false);
      return;
    }

    if (!estaEscribiendo) {
      setTerminoDebounced("");
      return;
    }

    const temporizador = setTimeout(() => {
      setTerminoDebounced(valor);
    }, tiempoEsperaDebounce);

    return () => {
      clearTimeout(temporizador);
    };
  }, [valor, tiempoEsperaDebounce, estaEscribiendo]);

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    const manejarClicFuera = (event: MouseEvent | TouchEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) {
        setAbierto(false);
        setEstaEscribiendo(false);
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

  // Filtrar sugerencias relevantes en base al término con debounce de forma tolerante y priorizando el título
  const opcionesFiltradas = useMemo<OpcionSugerencia[]>(() => {
    if (!estaEscribiendo || !terminoDebounced || !terminoDebounced.trim()) {
      return opcionesNormalizadas;
    }

    const filtradas = opcionesNormalizadas.filter((opcion) => {
      return coincideBusquedaTolerante(
        [opcion.etiqueta || opcion.valor, opcion.subtitulo, opcion.grupo],
        terminoDebounced
      );
    });

    return filtradas.sort(
      compararPorRelevanciaTitulo(
        (opt) => opt.etiqueta || opt.valor,
        terminoDebounced,
        (a, b) => (a.etiqueta || a.valor).localeCompare(b.etiqueta || b.valor, "es"),
        (opt) => [opt.subtitulo, opt.grupo]
      )
    );
  }, [estaEscribiendo, terminoDebounced, opcionesNormalizadas]);

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

    return { gruposMap, sinGrupo, tieneGrupos: gruposMap.size > 0,
      ordenadas: gruposMap.size ? [...gruposMap.values()].flat().concat(sinGrupo) : sinGrupo };
  }, [opcionesFiltradas]);
  const opcionesVisibles = gruposOpciones.ordenadas;
  const indiceActivoVisible = Math.min(indiceActivo, opcionesVisibles.length - 1);

  useEffect(() => {
    if (abierto && indiceActivoVisible >= 0) document.getElementById(`${idLista}-${indiceActivoVisible}`)?.scrollIntoView({ block: "nearest" });
  }, [abierto, indiceActivoVisible, idLista, opcionesVisibles]);

  const seleccionarOpcion = (opcion: OpcionSugerencia, e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEstaEscribiendo(false);
    setTerminoDebounced("");
    alCambiar(opcion.valor);
    alSeleccionar?.(opcion);
    setAbierto(false);
    setIndiceActivo(-1);
    ignorarFoco.current = document.activeElement !== inputRef.current;
    inputRef.current?.focus();
  };

  const alternarDesplegable = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!disabled) {
      setEstaEscribiendo(false);
      setTerminoDebounced("");
      setAbierto((prev) => !prev);
    }
  };

  const renderFilaOpcion = (opcion: OpcionSugerencia, indice: number) => {
    const valorLimpio = valor.trim().toLowerCase();
    const estaSeleccionada =
      opcion.valor.toLowerCase() === valorLimpio ||
      (opcion.clave !== undefined && opcion.clave.toLowerCase() === valorLimpio) ||
      (Boolean(opcion.etiqueta) && opcion.etiqueta!.toLowerCase() === valorLimpio);

    return (
      <button
        key={opcion.clave || opcion.valor}
        id={`${idLista}-${indice}`}
        role="option"
        aria-selected={estaSeleccionada}
        data-activa={indice === indiceActivoVisible}
        tabIndex={-1}
        type="button"
        onClick={(e) => seleccionarOpcion(opcion, e)}
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

  const manejarKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["ArrowDown", "ArrowUp"].includes(e.key) || (abierto && ["Home", "End"].includes(e.key))) {
      e.preventDefault(); e.stopPropagation(); setAbierto(true);
      const total = opcionesVisibles.length;
      setIndiceActivo(actual => {
        const visible = Math.min(actual, total - 1);
        return !total ? -1 : e.key === "Home" ? 0 : e.key === "End" ? total - 1
          : visible < 0 ? e.key === "ArrowUp" ? total - 1 : 0
          : (visible + (e.key === "ArrowDown" ? 1 : -1) + total) % total;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (abierto && opcionesVisibles.length > 0) {
        seleccionarOpcion(opcionesVisibles[Math.max(0, indiceActivoVisible)], e);
      } else if (valor.trim()) {
        const coincidencia = opcionesNormalizadas.find(
          (opt) =>
            opt.valor.toLowerCase() === valor.trim().toLowerCase() ||
            (opt.etiqueta && opt.etiqueta.toLowerCase() === valor.trim().toLowerCase())
        );
        if (coincidencia) {
          seleccionarOpcion(coincidencia, e);
        }
      }
    } else if (e.key === "Tab") {
      setAbierto(false); setIndiceActivo(-1);
    }
  };

  let indiceVisual = 0;
  return (
    <div ref={contenedorRef} className={`${estilos.contenedor} ${className || ""}`}
      onKeyDown={evento => {
        if (evento.key !== "Escape" || !abierto) return;
        evento.preventDefault(); evento.stopPropagation();
        setAbierto(false); setEstaEscribiendo(false); setIndiceActivo(-1);
        ignorarFoco.current = document.activeElement !== inputRef.current;
        inputRef.current?.focus();
      }}
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setAbierto(false); }}>
      <input
        id={id}
        ref={inputRef}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={abierto}
        aria-controls={idLista}
        aria-activedescendant={abierto && indiceActivoVisible >= 0 ? `${idLista}-${indiceActivoVisible}` : undefined}
        type="text"
        value={valor}
        onChange={(e) => {
          setEstaEscribiendo(true);
          setIndiceActivo(-1);
          alCambiar(e.target.value);
          if (!abierto) setAbierto(true);
        }}
        onKeyDown={manejarKeyDown}
        onFocus={() => {
          if (ignorarFoco.current) { ignorarFoco.current = false; return; }
          setEstaEscribiendo(false);
          setAbierto(abrirAlEnfocar);
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={estilos.input}
        autoComplete="off"
        spellCheck={false}
      />

      <button
        type="button"
        onClick={alternarDesplegable}
        disabled={disabled}
        tabIndex={-1}
        className={`${estilos.botonDesplegable} ${abierto ? estilos.botonDesplegableAbierto : ""}`}
        title="Mostrar sugerencias"
        aria-expanded={abierto}
        aria-controls={idLista}
        aria-haspopup="listbox"
      >
        <ChevronDown size={14} />
      </button>

      {abierto && !disabled && (
        <div id={idLista} role="listbox" aria-label={placeholder || "Sugerencias"} className={estilos.dropdown}>
          {opcionesFiltradas.length > 0 ? (
            gruposOpciones.tieneGrupos ? (
              <>
                {Array.from(gruposOpciones.gruposMap.entries()).map(([nombreGrupo, items]) => (
                  <div key={nombreGrupo} className={estilos.seccionGrupo}>
                    <div className={estilos.encabezadoGrupo}>
                      <span>{nombreGrupo}</span>
                      <span className={estilos.badgeConteoGrupo}>{items.length}</span>
                    </div>
                    {items.map((opcion) => renderFilaOpcion(opcion, indiceVisual++))}
                  </div>
                ))}
                {gruposOpciones.sinGrupo.length > 0 &&
                  gruposOpciones.sinGrupo.map((opcion) => renderFilaOpcion(opcion, indiceVisual++))}
              </>
            ) : (
              opcionesFiltradas.map(renderFilaOpcion)
            )
          ) : (
            <div className={estilos.sinResultados}>No hay sugerencias</div>
          )}
        </div>
      )}
    </div>
  );
};
