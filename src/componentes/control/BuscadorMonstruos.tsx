import React, { useState } from "react";
import { usarAlmacenDM, calcularVidaPorDados, MonstruoBase, formatearVelocidad, normalizarTexto } from "../../almacen/usarAlmacenDM";
import { Skull, Plus } from "lucide-react";
import estilosClases from "./BuscadorMonstruos.module.css";

export const BuscadorMonstruos: React.FC = () => {
  const baseDatosMonstruos = usarAlmacenDM((s) => s.baseDatosMonstruos);
  const metodoVidaMonstruo = usarAlmacenDM((s) => s.metodoVidaMonstruo);
  const agregarCriaturaAIniciativa = usarAlmacenDM((s) => s.agregarCriaturaAIniciativa);

  const [busquedaMonstruo, setBusquedaMonstruo] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Filtrar monstruos por la búsqueda usando normalización de acentos precalculada
  const queryNormalizada = normalizarTexto(busquedaMonstruo);
  const monstruosFiltrados = queryNormalizada === ""
    ? baseDatosMonstruos
    : baseDatosMonstruos.filter((m) =>
        (m.nombreNormalizado || normalizarTexto(m.nombre)).includes(queryNormalizada)
      );

  // Añadir un monstruo de la base de datos a la iniciativa activa
  const manejarAñadirMonstruoPorPlantilla = (plantilla: MonstruoBase, limpiarBuscador = true) => {
    const tiradaInic = Math.floor(Math.random() * 20) + 1;
    const totalInic = tiradaInic + plantilla.iniciativaBonificador;

    const vidaCalculada = calcularVidaPorDados(
      plantilla.vidaNotas || "",
      plantilla.vidaMaxima,
      metodoVidaMonstruo
    );

    agregarCriaturaAIniciativa(
      plantilla.nombre,
      totalInic,
      vidaCalculada,
      plantilla.ca,
      true, // esMonstruo
      formatearVelocidad(plantilla.velocidad),
      plantilla.iniciativaBonificador,
      plantilla.id
    );

    if (window.TS) {
      window.TS.debug?.log(`Añadido monstruo ${plantilla.nombre} a la iniciativa local. Tirada: ${tiradaInic} + ${plantilla.iniciativaBonificador} = ${totalInic}`);
    }

    if (limpiarBuscador) {
      setBusquedaMonstruo("");
      setMostrarSugerencias(false);
    }
  };

  return (
    <div className={estilosClases.campoBusqueda} style={{ position: "relative" }}>
      <Skull size={13} style={{ color: "var(--color-peligro)" }} />
      <input
        type="text"
        value={busquedaMonstruo}
        onChange={(e) => {
          setBusquedaMonstruo(e.target.value);
          setMostrarSugerencias(true);
        }}
        onFocus={() => setMostrarSugerencias(true)}
        onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
        placeholder="Buscar monstruo..."
        className={estilosClases.inputBrutal}
        onKeyDown={(e) => {
          if (e.key === "Enter" && monstruosFiltrados.length > 0) {
            manejarAñadirMonstruoPorPlantilla(monstruosFiltrados[0], true);
          }
        }}
      />
      {busquedaMonstruo && (
        <button
          onClick={() => {
            setBusquedaMonstruo("");
            setMostrarSugerencias(false);
          }}
          className={estilosClases.botonLimpiarBusqueda}
          title="Limpiar"
        >
          x
        </button>
      )}

      {/* Menú de sugerencias flotantes */}
      {mostrarSugerencias && monstruosFiltrados.length > 0 && (
        <div className={estilosClases.sugerenciasContenedor}>
          {monstruosFiltrados.slice(0, 15).map((m) => (
            <div
              key={m.id}
              onClick={() => manejarAñadirMonstruoPorPlantilla(m, true)}
              className={estilosClases.sugerenciaItem}
            >
              <div className={estilosClases.sugerenciaDetalles}>
                <span className={estilosClases.sugerenciaNombre}>{m.nombre}</span>
                <span className={estilosClases.sugerenciaSub}>
                  CA {m.ca} | HP {m.vidaMaxima} | Desafío {m.desafio || "—"}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  manejarAñadirMonstruoPorPlantilla(m, false);
                }}
                onMouseDown={(e) => e.preventDefault()}
                className={estilosClases.botonSugerenciaAñadirMasivo}
                title="Añadir masivo (manteniendo el buscador abierto)"
              >
                <Plus size={10} />
              </button>
            </div>
          ))}
          {monstruosFiltrados.length > 15 && (
            <div className={estilosClases.sugerenciaMas}>
              Y {monstruosFiltrados.length - 15} más...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
