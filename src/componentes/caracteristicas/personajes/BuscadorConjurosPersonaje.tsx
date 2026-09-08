import React, { useState, useMemo, useDeferredValue } from "react";
import { Search, Plus, Check, BookOpen, X } from "lucide-react";
import type { HechizoBase } from "@/tipos";
import { SelectorDesplegable } from "@/componentes/comunes";
import { generarIdSlug } from "@/utiles/generarId";
import { coincideBusquedaTolerante, compararPorRelevanciaTitulo } from "@/utiles/busquedaTolerante";

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
    <div
      style={{
        backgroundColor: "#111622",
        border: "1px solid rgba(148, 163, 184, 0.16)",
        borderRadius: 8,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12
      }}
    >
      {/* Barra de Búsqueda y Filtros */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <BookOpen size={15} color="#60a5fa" />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "#f1f5f9"
            }}
          >
            Añadir Conjuros del Compendio
          </span>
        </div>

        {alCerrar && (
          <button
            type="button"
            onClick={alCerrar}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: 2
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Controles de Búsqueda */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {/* Input de Búsqueda */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "#0b0f16",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: 4,
            padding: "4px 8px",
            flex: "1 1 180px"
          }}
        >
          <Search size={13} color="#64748b" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: "#f1f5f9",
              fontSize: 11,
              width: "100%"
            }}
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 0 }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filtro por Nivel */}
        <div style={{ width: 140 }}>
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
        <div style={{ width: 150 }}>
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
      <div
        style={{
          maxHeight: 240,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          paddingRight: 4
        }}
      >
        {resultados.length === 0 ? (
          <div
            style={{
              padding: 16,
              textAlign: "center",
              color: "#64748b",
              fontSize: 11
            }}
          >
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
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "#161e2c",
                  border: "1px solid rgba(148, 163, 184, 0.08)",
                  borderRadius: 4,
                  padding: "5px 8px"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#f1f5f9" }}>
                    {hechizo.nombre}
                  </span>
                  <span style={{ fontSize: 10, color: "#64748b" }}>
                    {esTruco ? "Truco" : `Nivel ${hechizo.nivel}`} • {hechizo.escuela}
                    {hechizo.concentracion ? " • [C]" : ""}
                    {hechizo.ritual ? " • [R]" : ""}
                  </span>
                </div>

                <div>
                  {yaAgregado ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        fontSize: 10,
                        color: "#10b981",
                        fontWeight: 600
                      }}
                    >
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
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        backgroundColor: "#1e293b",
                        border: "1px solid rgba(96, 165, 250, 0.3)",
                        borderRadius: 3,
                        color: "#93c5fd",
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 6px",
                        cursor: "pointer"
                      }}
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
        <span style={{ fontSize: 10, color: "#64748b", textAlign: "center" }}>
          Mostrando los primeros 50 resultados de {resultados.length}. Refina tu búsqueda para encontrar conjuros específicos.
        </span>
      )}
    </div>
  );
};
