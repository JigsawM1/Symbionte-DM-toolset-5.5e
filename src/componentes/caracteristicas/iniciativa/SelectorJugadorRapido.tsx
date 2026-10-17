import React, { useState, useMemo, useRef } from "react";
import { User, Plus, X } from "lucide-react";
import {
  usarEstadoIniciativa,
  usarAccionesIniciativa
} from "@/almacen/selectores";
import type { PersonajeJugador } from "@/tipos/personaje";
import { coincidenNombresTaleSpire } from "@/servicios/resolutorCriaturas";
import { normalizarTexto } from "@/almacen/usarAlmacenDM";
import estilosClases from "./SelectorJugadorRapido.module.css";
import { logger } from "@/utiles/logger";

export const SelectorJugadorRapido: React.FC = () => {
  const { personajes, colaIniciativa } = usarEstadoIniciativa();
  const { agregarPersonajeAIniciativa, agregarCriaturaAIniciativa } = usarAccionesIniciativa();

  const [busqueda, setBusqueda] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState<number>(-1);
  const refTemporizadorBlur = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Normalizar consulta de búsqueda para filtrado tolerante
  const queryNorm = normalizarTexto(busqueda);

  // Filtrar personajes del almacén
  const personajesFiltrados = useMemo(() => {
    if (!personajes || personajes.length === 0) return [];
    if (!queryNorm) return personajes.slice(0, 10);

    return personajes.filter((pj) => {
      const nombreNorm = normalizarTexto(pj.nombre);
      const claseNorm = normalizarTexto(pj.clase || "");
      const subclaseNorm = normalizarTexto(pj.subclase || "");
      return (
        nombreNorm.includes(queryNorm) ||
        claseNorm.includes(queryNorm) ||
        subclaseNorm.includes(queryNorm)
      );
    });
  }, [personajes, queryNorm]);

  // Precalcular en O(1) qué personajes ya están en la cola de iniciativa
  const idsPersonajesEnCombate = useMemo(() => {
    const enCombate = new Set<string>();
    if (!personajes?.length || !colaIniciativa?.length) return enCombate;

    for (const pj of personajes) {
      const encontrado = colaIniciativa.some(
        (c) =>
          c.id === pj.id ||
          (pj.idMiniaturaTS && c.id === pj.idMiniaturaTS) ||
          (c.idPersonajeDuenio && c.idPersonajeDuenio === pj.id) ||
          coincidenNombresTaleSpire(c.nombre, pj.nombre)
      );
      if (encontrado) {
        enCombate.add(pj.id);
      }
    }
    return enCombate;
  }, [personajes, colaIniciativa]);

  // Manejar adición de ficha real de jugador
  const manejarSeleccionarPersonaje = (pj: PersonajeJugador) => {
    agregarPersonajeAIniciativa(pj);
    logger.debug(`[SelectorJugadorRapido] Ficha real de ${pj.nombre} agregada o actualizada en la iniciativa.`);
    setBusqueda("");
    setIndiceActivo(-1);
    setMostrarSugerencias(false);
  };

  // Manejar adición genérica o confirmación con Enter
  const manejarAñadirGenericoOPrimero = () => {
    if (mostrarSugerencias && indiceActivo >= 0 && indiceActivo < personajesFiltrados.length) {
      manejarSeleccionarPersonaje(personajesFiltrados[indiceActivo]);
      return;
    }

    const textoLimpio = busqueda.trim();
    if (!textoLimpio) return;

    // Si hay una coincidencia exacta o primer resultado en la lista filtrada, preferir la ficha real
    const coincidenciaExacta = personajes.find(
      (p) => coincidenNombresTaleSpire(p.nombre, textoLimpio)
    );

    if (coincidenciaExacta) {
      manejarSeleccionarPersonaje(coincidenciaExacta);
      return;
    }

    if (personajesFiltrados.length > 0 && queryNorm.length >= 2) {
      manejarSeleccionarPersonaje(personajesFiltrados[0]);
      return;
    }

    // Si no coincide con ninguna ficha existente, crear un combatiente jugador genérico
    agregarCriaturaAIniciativa(
      textoLimpio,
      0, // Inicia en 0 hasta su tirada
      30, // HP estándar
      15, // CA estándar
      false, // esMonstruo: false ESTRICTO
      "30 pies",
      0
    );

    logger.debug(`[SelectorJugadorRapido] Jugador genérico '${textoLimpio}' añadido a la iniciativa.`);
    setBusqueda("");
    setIndiceActivo(-1);
    setMostrarSugerencias(false);
  };

  const manejarFocus = () => {
    if (refTemporizadorBlur.current) {
      clearTimeout(refTemporizadorBlur.current);
      refTemporizadorBlur.current = null;
    }
    setMostrarSugerencias(true);
  };

  const manejarBlur = () => {
    refTemporizadorBlur.current = setTimeout(() => {
      setMostrarSugerencias(false);
      setIndiceActivo(-1);
    }, 180);
  };

  const manejarTeclado = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setMostrarSugerencias(false);
      setIndiceActivo(-1);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!mostrarSugerencias) {
        setMostrarSugerencias(true);
      }
      if (personajesFiltrados.length > 0) {
        setIndiceActivo((prev) => (prev + 1) % personajesFiltrados.length);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (personajesFiltrados.length > 0) {
        setIndiceActivo((prev) => (prev <= 0 ? personajesFiltrados.length - 1 : prev - 1));
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      manejarAñadirGenericoOPrimero();
    }
  };

  return (
    <div className={estilosClases.campoBusqueda}>
      <User size={13} className={estilosClases.iconoUsuario} />
      <input
        type="text"
        role="combobox"
        aria-expanded={mostrarSugerencias}
        aria-autocomplete="list"
        aria-label="Añadir jugador o invocar ficha de personaje a la iniciativa"
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          setIndiceActivo(-1);
          setMostrarSugerencias(true);
        }}
        onFocus={manejarFocus}
        onBlur={manejarBlur}
        placeholder="Añadir jugador..."
        className={estilosClases.inputBrutal}
        onKeyDown={manejarTeclado}
      />
      {busqueda && (
        <button
          type="button"
          onClick={() => {
            setBusqueda("");
            setIndiceActivo(-1);
            setMostrarSugerencias(false);
          }}
          className={estilosClases.botonLimpiarBusqueda}
          aria-label="Limpiar búsqueda"
          title="Limpiar búsqueda"
        >
          <X size={12} />
        </button>
      )}
      <button
        type="button"
        onClick={manejarAñadirGenericoOPrimero}
        className={estilosClases.botonAñadir}
        aria-label="Añadir jugador a la iniciativa"
        title="Añadir jugador a la iniciativa"
      >
        <Plus size={13} />
      </button>

      {/* Menú desplegable de fichas de jugadores */}
      {mostrarSugerencias && (
        <div
          role="listbox"
          className={estilosClases.sugerenciasContenedor}
          onMouseDown={(e) => e.preventDefault()}
        >
          {personajesFiltrados.length > 0 ? (
            personajesFiltrados.map((pj, idx) => {
              const enCombate = idsPersonajesEnCombate.has(pj.id);
              const estaResaltado = idx === indiceActivo;
              const infoClase = [pj.clase, pj.nivel ? `Nv ${pj.nivel}` : null]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={pj.id}
                  role="option"
                  aria-selected={estaResaltado}
                  onClick={() => manejarSeleccionarPersonaje(pj)}
                  onMouseEnter={() => setIndiceActivo(idx)}
                  className={`${estilosClases.sugerenciaItem} ${
                    enCombate ? estilosClases.sugerenciaItemEnCombate : ""
                  } ${estaResaltado ? estilosClases.sugerenciaItemActiva : ""}`}
                  title={enCombate ? "Ya está en la iniciativa (clic para refrescar estadísticas)" : "Añadir a la iniciativa"}
                >
                  <div className={estilosClases.sugerenciaDetalles}>
                    <div className={estilosClases.sugerenciaNombreFila}>
                      <span className={estilosClases.sugerenciaNombre}>{pj.nombre}</span>
                      {enCombate && (
                        <span className={estilosClases.tagEnCombate}>EN COMBATE</span>
                      )}
                    </div>
                    <span className={estilosClases.sugerenciaSub}>
                      {infoClase || "Sin clase definida"}
                    </span>
                  </div>
                  <div className={estilosClases.sugerenciaStats}>
                    HP {pj.hpActual ?? pj.hpMaximo ?? 10}/{pj.hpMaximo || 10}
                  </div>
                </div>
              );
            })
          ) : busqueda.trim() ? (
            <div
              role="option"
              aria-selected={false}
              onClick={manejarAñadirGenericoOPrimero}
              className={estilosClases.sugerenciaItem}
              title="Añadir como combatiente jugador rápido sin ficha"
            >
              <div className={estilosClases.sugerenciaDetalles}>
                <div className={estilosClases.sugerenciaNombreFila}>
                  <span className={estilosClases.sugerenciaNombre}>
                    "{busqueda.trim()}"
                  </span>
                  <span className={estilosClases.tagGenerico}>NUEVO PJ</span>
                </div>
                <span className={estilosClases.sugerenciaSub}>
                  Añadir como jugador genérico rápido (no monstruo)
                </span>
              </div>
              <Plus size={12} className={estilosClases.iconoUsuario} />
            </div>
          ) : (
            <div className={estilosClases.sugerenciaVacia}>
              No hay personajes registrados en la campaña.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
