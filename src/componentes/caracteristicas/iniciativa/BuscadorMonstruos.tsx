import React, { useState, useMemo } from "react";
import { calcularVidaPorDados, MonstruoBase, formatearVelocidad, normalizarTexto } from "@/almacen/usarAlmacenDM";
import {
  usarEstadoHomebrew,
  usarEstadoConfiguracion,
  usarAccionesIniciativa,
} from "@/almacen/selectores";
import { Skull, Plus, X, Users } from "lucide-react";
import estilosClases from "./BuscadorMonstruos.module.css";
import { logger } from "@/utiles/logger";

export const BuscadorMonstruos: React.FC = () => {
  const { baseDatosMonstruos } = usarEstadoHomebrew();
  const { metodoVidaMonstruo } = usarEstadoConfiguracion();
  const { agregarCriaturaAIniciativa } = usarAccionesIniciativa();

  const [busquedaMonstruo, setBusquedaMonstruo] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [cantidadHorda, setCantidadHorda] = useState<number>(1);

  // Filtrar monstruos por la búsqueda usando normalización de acentos precalculada
  const queryNormalizada = normalizarTexto(busquedaMonstruo);
  const monstruosFiltrados = useMemo(() => {
    if (!queryNormalizada) return baseDatosMonstruos;
    return baseDatosMonstruos.filter((m) =>
      (m.nombreNormalizado || normalizarTexto(m.nombre)).includes(queryNormalizada)
    );
  }, [baseDatosMonstruos, queryNormalizada]);

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
      plantilla.id,
      cantidadHorda
    );

    logger.debug(`Añadido monstruo ${plantilla.nombre} a la iniciativa local. Tirada: ${tiradaInic} + ${plantilla.iniciativaBonificador} = ${totalInic}`);

    if (limpiarBuscador) {
      setBusquedaMonstruo("");
      setMostrarSugerencias(false);
    }
  };

  return (
    <div className={estilosClases.campoBusqueda}>
      <Skull size={13} className={estilosClases.iconoCalavera} />
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
          type="button"
          onClick={() => {
            setBusquedaMonstruo("");
            setMostrarSugerencias(false);
          }}
          className={estilosClases.botonLimpiarBusqueda}
          title="Limpiar búsqueda"
        >
          <X size={11} />
        </button>
      )}

      {/* Menú de sugerencias flotantes */}
      {mostrarSugerencias && monstruosFiltrados.length > 0 && (
        <div className={estilosClases.sugerenciasContenedor}>
          <div
            className={estilosClases.barraTamanoHorda}
            onMouseDown={(e) => e.preventDefault()}
          >
            <span className={estilosClases.etiquetaHordaBuscador}>
              <Users size={10} /> BARRAS DE VIDA:
            </span>
            <div className={estilosClases.chipsHordaBuscador}>
              {[1, 2, 3, 5, 8, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCantidadHorda(num)}
                  className={estilosClases.chipTamanoHorda}
                  data-activo={cantidadHorda === num}
                  title={num === 1 ? "Añadir como ficha individual (1 barra)" : `Añadir como Horda de ${num} barras de vida`}
                >
                  x{num}
                </button>
              ))}
            </div>
          </div>
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
