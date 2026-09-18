import React, { useState, useMemo, useDeferredValue } from "react";
import { Search, Plus, Check, BookOpen, X } from "lucide-react";
import type { HechizoBase } from "@/tipos";
import { SelectorDesplegable } from "@/componentes/comunes";
import { generarIdSlug } from "@/utiles/generarId";
import { coincideBusquedaTolerante, compararPorRelevanciaTitulo } from "@/utiles/busquedaTolerante";
import styles from "./PanelConjurosPersonaje.module.css";

interface BuscadorConjurosPersonajeProps {
  baseDatosHechizos: HechizoBase[];
  trucosActualesIds: string[];
  conjurosActualesIds: string[];
  alAgregarTruco: (hechizoId: string) => void;
  alAgregarConjuro: (hechizoId: string) => void;
  alCerrar?: () => void;
}

export const BuscadorConjurosPersonaje: React.FC<BuscadorConjurosPersonajeProps> = ({
  baseDatosHechizos,
  trucosActualesIds,
  conjurosActualesIds,
  alAgregarTruco,
  alAgregarConjuro,
  alCerrar
}) => {
  const [busqueda, setBusqueda] = useState("");
  const busquedaDiferida = useDeferredValue(busqueda);
  const [filtroNivel, setFiltroNivel] = useState<string>("todos");
  const [filtroEscuela, setFiltroEscuela] = useState<string>("todas");

  const escuelasDisponibles = useMemo(() => {
    const setEscuelas = new Set<string>();
    for (const h of baseDatosHechizos) {
      if (h.escuela) setEscuelas.add(h.escuela);
    }
    return Array.from(setEscuelas).sort();
  }, [baseDatosHechizos]);

  const resultados = useMemo(() => {
    const busqLimpia = busquedaDiferida.trim();
    const filtrados = baseDatosHechizos.filter((h) => {
      // Filtro de texto tolerante
      if (busqLimpia) {
        const coincide = coincideBusquedaTolerante(
          [h.nombre, h.escuela, h.descripcion],
          busqLimpia
        );
        if (!coincide) return false;
      }

      // Filtro de nivel
      if (filtroNivel !== "todos") {
        if (h.nivel !== Number(filtroNivel)) return false;
      }

      // Filtro de escuela
      if (filtroEscuela !== "todas") {
        if (h.escuela?.toLowerCase() !== filtroEscuela.toLowerCase()) return false;
      }

      return true;
    });

    return filtrados.sort(
      compararPorRelevanciaTitulo(
        (h) => h.nombre,
        busqLimpia,
        (a, b) => {
          if (a.nivel !== b.nivel) return a.nivel - b.nivel;
          return a.nombre.localeCompare(b.nombre, "es");
        },
        (h) => [h.escuela, h.descripcion]
      )
    );
  }, [baseDatosHechizos, busquedaDiferida, filtroNivel, filtroEscuela]);

  const idsYaAgregados = useMemo(() => {
    return new Set([...trucosActualesIds, ...conjurosActualesIds]);
  }, [trucosActualesIds, conjurosActualesIds]);

  return (
    <div className={styles.contenedorBuscadorConjuros}>
      {/* Barra de Búsqueda y Filtros */}
      <div className={styles.cabeceraBuscadorConjuros}>
        <div className={styles.tituloBuscadorFila}>
          <BookOpen size={15} color="#60a5fa" />
          <span className={styles.tituloBuscadorTexto}>
            Añadir Conjuros del Compendio
          </span>
        </div>

        {alCerrar && (
          <button
            type="button"
            onClick={alCerrar}
            className={styles.botonCerrarBuscador}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Controles de Búsqueda */}
      <div className={styles.filaControlesBuscador}>
        {/* Input de Búsqueda */}
        <div className={styles.cajaInputBuscador}>
          <Search size={13} color="#64748b" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={styles.inputTextoBuscador}
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              className={styles.botonLimpiarBusqueda}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filtro por Nivel */}
        <div className={styles.filtroNivelAncho}>
          <SelectorDesplegable
            valor={filtroNivel}
            alCambiar={(val) => setFiltroNivel(val)}
            tamano="compacto"
            opciones={[
              { valor: "todos", etiqueta: "Todos los Niveles" },
              { valor: "0", etiqueta: "Trucos (Niv. 0)" },
              ...Array.from({ length: 9 }).map((_, i) => ({
                valor: String(i + 1),
                etiqueta: `Nivel ${i + 1}`
              }))
            ]}
          />
        </div>

        {/* Filtro por Escuela */}
        <div className={styles.filtroEscuelaAncho}>
          <SelectorDesplegable
            valor={filtroEscuela}
            alCambiar={(val) => setFiltroEscuela(val)}
            tamano="compacto"
            opciones={[
              { valor: "todas", etiqueta: "Todas las Escuelas" },
              ...escuelasDisponibles.map((esc) => ({
                valor: esc,
                etiqueta: esc
              }))
            ]}
          />
        </div>
      </div>

      {/* Lista de Resultados con Scroll */}
      <div className={styles.listaResultadosScroll}>
        {resultados.length === 0 ? (
          <div className={styles.mensajeSinResultados}>
            No se encontraron conjuros con los filtros aplicados.
          </div>
        ) : (
          resultados.slice(0, 50).map((hechizo) => {
            const slug = generarIdSlug("h", hechizo.nombre);
            const yaAgregado =
              idsYaAgregados.has(hechizo.id) ||
              idsYaAgregados.has(slug) ||
              idsYaAgregados.has(hechizo.nombre.toLowerCase().trim());
            const esTruco = hechizo.nivel === 0;

            return (
              <div
                key={`res-h-${hechizo.id}`}
                className={styles.tarjetaResultadoConjuro}
              >
                <div className={styles.infoResultadoConjuro}>
                  <span className={styles.nombreResultadoConjuro}>
                    {hechizo.nombre}
                  </span>
                  <span className={styles.metaResultadoConjuro}>
                    {esTruco ? "Truco" : `Nivel ${hechizo.nivel}`} • {hechizo.escuela}
                    {hechizo.concentracion ? " • [C]" : ""}
                    {hechizo.ritual ? " • [R]" : ""}
                  </span>
                </div>

                <div>
                  {yaAgregado ? (
                    <span className={styles.badgeYaAnadido}>
                      <Check size={11} /> Añadido
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (esTruco) {
                          alAgregarTruco(hechizo.id);
                        } else {
                          alAgregarConjuro(hechizo.id);
                        }
                      }}
                      className={styles.botonAnadirConjuroBuscador}
                    >
                      <Plus size={10} /> Añadir
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {resultados.length > 50 && (
        <span className={styles.textoAvisoLimiteResultados}>
          Mostrando los primeros 50 resultados de {resultados.length}. Refina tu búsqueda para encontrar conjuros específicos.
        </span>
      )}
    </div>
  );
};
