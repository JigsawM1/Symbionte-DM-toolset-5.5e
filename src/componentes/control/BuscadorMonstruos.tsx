import React, { useState } from "react";
import { usarAlmacenDM, calcularVidaPorDados } from "../../almacen/usarAlmacenDM";
import { Skull, Plus } from "lucide-react";
import estilosClases from "./BuscadorMonstruos.module.css";

export const BuscadorMonstruos: React.FC = () => {
  const {
    baseDatosMonstruos,
    metodoVidaMonstruo,
    agregarCriaturaAIniciativa
  } = usarAlmacenDM();

  const [busquedaMonstruo, setBusquedaMonstruo] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Filtrar monstruos por la búsqueda
  const monstruosFiltrados = busquedaMonstruo.trim() === ""
    ? baseDatosMonstruos
    : baseDatosMonstruos.filter((m) =>
        m.nombre.toLowerCase().includes(busquedaMonstruo.toLowerCase())
      );

  // Añadir un monstruo de la base de datos a la iniciativa activa
  const manejarAñadirMonstruoPorPlantilla = (plantilla: any, limpiarBuscador = true) => {
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
      plantilla.velocidad,
      plantilla.iniciativaBonificador
    );

    // Intentamos asociar el ID de plantilla recién añadido a la criatura de initiative si es posible
    const almacen = usarAlmacenDM.getState();
    const ultimaCriat = almacen.colaIniciativa[almacen.colaIniciativa.length - 1];
    if (ultimaCriat) {
      almacen.asociarPlantillaACriatura(ultimaCriat.id, plantilla.id);
    }

    if ((window as any).TS) {
      (window as any).TS.debug.log(`Añadido monstruo ${plantilla.nombre} a la iniciativa local. Tirada: ${tiradaInic} + ${plantilla.iniciativaBonificador} = ${totalInic}`);
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
