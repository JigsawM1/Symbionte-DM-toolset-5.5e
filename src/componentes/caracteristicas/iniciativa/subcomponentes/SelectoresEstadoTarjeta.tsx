import React, { useState, useEffect, useRef } from "react";
import { CONDICIONES_2024, EFECTOS_PREDEFINIDOS } from "@/utiles/datosIniciales";
import type { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import { obtenerCondicionesVisibles } from "@/almacen/slices/iniciativa/utilidadesCombateIniciativa";
import { ChipCondicion } from "@/componentes/comunes";
import { PanelBarrasHorda } from "../horda/PanelBarrasHorda";
import estilosClases from "../TarjetaCriaturaIniciativa.module.css";

interface SelectoresEstadoTarjetaProps {
  criatura: CriaturaIniciativa;
  rondaActual?: number;
  esHordaActiva: boolean;
  onAñadirCondicion: (condicion: string) => void;
  onQuitarCondicion: (condicion: string) => void;
  onAñadirEfecto: (nombre: string, duracion: number, opciones?: { concentracion?: boolean }) => void;
  onQuitarEfecto: (efectoId: string) => void;
  onConfigurarBarrasHorda?: (cantidad: number) => void;
  onSeleccionarBarraHorda: (indice: number) => void;
  onAlternarModoDanoHorda: () => void;
}

export const SelectoresEstadoTarjeta: React.FC<SelectoresEstadoTarjetaProps> = React.memo(({
  criatura,
  rondaActual,
  esHordaActiva,
  onAñadirCondicion,
  onQuitarCondicion,
  onAñadirEfecto,
  onQuitarEfecto,
  onConfigurarBarrasHorda,
  onSeleccionarBarraHorda,
  onAlternarModoDanoHorda
}) => {
  const [dropdownAbierto, setDropdownAbierto] = useState<"condicion" | "efecto" | null>(null);
  const refContenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownAbierto) return;
    const manejarClicFuera = (e: MouseEvent) => {
      if (refContenedor.current && !refContenedor.current.contains(e.target as Node)) {
        setDropdownAbierto(null);
      }
    };
    const manejarEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownAbierto(null);
    };
    document.addEventListener("mousedown", manejarClicFuera);
    document.addEventListener("keydown", manejarEscape);
    return () => {
      document.removeEventListener("mousedown", manejarClicFuera);
      document.removeEventListener("keydown", manejarEscape);
    };
  }, [dropdownAbierto]);

  return (
    <div ref={refContenedor}>
      {/* Chips de Condiciones */}
      <div className={estilosClases.filaCondicionesChips}>
        {obtenerCondicionesVisibles(criatura.condiciones, criatura.efectos).map((cond) => (
          <ChipCondicion
            key={cond}
            nombre={cond}
            onQuitar={() => onQuitarCondicion(cond)}
          />
        ))}

        {criatura.vidaActual > 0 && criatura.vidaActual < (criatura.vidaMaxima / 2) && (
          <ChipCondicion nombre="Desangrándose" esDesangrado />
        )}

        <div className={estilosClases.contenedorMiniSelector}>
          <button
            type="button"
            onClick={() => setDropdownAbierto(dropdownAbierto === "condicion" ? null : "condicion")}
            className={estilosClases.miniBotonAdd}
            title="Agregar condición a esta criatura"
          >
            + CONDICIÓN ▾
          </button>

          {dropdownAbierto === "condicion" && (
            <div className={estilosClases.dropdownFlotante}>
              {CONDICIONES_2024.map((c) => {
                const nombreLimpio = c.nombre.split(" (")[0];
                return (
                  <div
                    key={c.nombre}
                    onClick={() => {
                      onAñadirCondicion(nombreLimpio);
                      setDropdownAbierto(null);
                    }}
                    className={estilosClases.dropdownItem}
                  >
                    {nombreLimpio}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chips de Efectos Activos y Selector de Efectos */}
      <div className={`${estilosClases.filaCondicionesChips} ${estilosClases.filaEfectosMargen}`}>
        {criatura.efectos && criatura.efectos.length > 0 ? (
          criatura.efectos.map((ef) => {
            const rondasRestantes = (ef.expiraRonda !== undefined && rondaActual !== undefined)
              ? Math.max(0, ef.expiraRonda - rondaActual)
              : undefined;
            return (
              <ChipCondicion
                key={ef.id}
                nombre={ef.nombre}
                concentracion={ef.concentracion}
                expiraRonda={ef.expiraRonda}
                rondasRestantes={rondasRestantes}
                onQuitar={() => onQuitarEfecto(ef.id)}
              />
            );
          })
        ) : null}

        <div className={estilosClases.contenedorMiniSelector}>
          <button
            type="button"
            onClick={() => setDropdownAbierto(dropdownAbierto === "efecto" ? null : "efecto")}
            className={`${estilosClases.miniBotonAdd} ${estilosClases.miniBotonAddEfectos}`}
            title="Agregar efecto activo a esta criatura"
          >
            + EFECTO ▾
          </button>

          {dropdownAbierto === "efecto" && (
            <div className={`${estilosClases.dropdownFlotante} ${estilosClases.dropdownFlotanteEfectos}`}>
              {EFECTOS_PREDEFINIDOS.map((ep) => {
                const nombreLimpio = ep.nombre.split(" (")[0];
                return (
                  <div
                    key={ep.nombre}
                    onClick={() => {
                      onAñadirEfecto(nombreLimpio, ep.duracionEstandar, { concentracion: ep.esConcentracion });
                      setDropdownAbierto(null);
                    }}
                    className={`${estilosClases.dropdownItem} ${estilosClases.dropdownItemEfecto}`}
                  >
                    {nombreLimpio} ({ep.duracionEstandar}r)
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {criatura.esMonstruo && !esHordaActiva && onConfigurarBarrasHorda && (
          <PanelBarrasHorda
            criatura={criatura}
            onConfigurarBarras={onConfigurarBarrasHorda}
            onSeleccionarBarra={onSeleccionarBarraHorda}
            onAlternarModoDano={onAlternarModoDanoHorda}
          />
        )}
      </div>
    </div>
  );
});

SelectoresEstadoTarjeta.displayName = "SelectoresEstadoTarjeta";
