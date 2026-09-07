import React from "react";
import { Award, Trash2, Plus, Sparkles } from "lucide-react";
import type { ClasePersonaje } from "@/tipos";
import { CLASES_DND } from "@/constantes";
import { obtenerSubclasesDeClase, obtenerClasePorNombre } from "@/servicios/gestorClases";
import { SelectorSugerencias } from "@/componentes/comunes/SelectorSugerencias";
import estilos from "./ConfiguracionPersonaje.module.css";

export interface SeccionMulticlaseProps {
  clases: ClasePersonaje[];
  nivelGlobal: number;
  alCambiarClaseNombre: (index: number, nuevoNombre: string) => void;
  alCambiarClaseSubclase: (index: number, nuevaSubclase: string) => void;
  alCambiarClaseNivel: (index: number, nuevoNivelStr: string) => void;
  alEliminarClase: (index: number) => void;
  alAgregarClase: () => void;
  alAplicarBuildSugerida: (index: number) => void;
}

/**
 * Subcomponente para la gestión visual e interactiva de clases y progresión multiclase.
 */
export const SeccionMulticlase: React.FC<SeccionMulticlaseProps> = ({
  clases,
  nivelGlobal,
  alCambiarClaseNombre,
  alCambiarClaseSubclase,
  alCambiarClaseNivel,
  alEliminarClase,
  alAgregarClase,
  alAplicarBuildSugerida
}) => {
  const esNivelMaximo = nivelGlobal >= 20;

  return (
    <div className={estilos.seccionMulticlase}>
      {/* Cabecera */}
      <div className={estilos.cabeceraMulticlase}>
        <div className={estilos.tituloIconoFila}>
          <Award size={14} color="#60a5fa" />
          <strong className={estilos.tituloSeccion}>
            Clases y Progresión Multiclase
          </strong>
        </div>
        <div>
          <span className={esNivelMaximo ? estilos.badgeNivelGlobalMax : estilos.badgeNivelGlobal}>
            Nivel Global: {nivelGlobal} / 20
          </span>
        </div>
      </div>

      {/* Lista de Clases */}
      <div className={estilos.listaClases}>
        {clases.map((claseItem, index) => {
          const sumaOtros = clases.reduce(
            (acc, c, i) => (i === index ? acc : acc + (c.nivel || 1)),
            0
          );
          const maxNivelClase = Math.max(1, 20 - sumaOtros);
          const infoClase = obtenerClasePorNombre(claseItem.nombre);

          return (
            <div key={index} className={estilos.tarjetaClaseFila}>
              <div className={estilos.gridCamposClase}>
                <div>
                  <label className={estilos.labelPequeno}>
                    Clase #{index + 1}
                  </label>
                  <SelectorSugerencias
                    valor={claseItem.nombre}
                    alCambiar={(nuevoNombre) => alCambiarClaseNombre(index, nuevoNombre)}
                    opciones={CLASES_DND}
                    placeholder="Clase..."
                  />
                </div>

                <div>
                  <label className={estilos.labelPequeno}>
                    Subclase (Nivel 3+)
                  </label>
                  <SelectorSugerencias
                    valor={claseItem.subclase || ""}
                    alCambiar={(nuevaSub) => alCambiarClaseSubclase(index, nuevaSub)}
                    opciones={obtenerSubclasesDeClase(claseItem.nombre).map((s) => s.nombre)}
                    placeholder="Elegir subclase..."
                  />
                </div>

                <div>
                  <label className={estilos.labelPequeno}>
                    Nivel (Max {maxNivelClase})
                  </label>
                  <input
                    type="number"
                    className={estilos.inputFormulario}
                    value={claseItem.nivel}
                    onChange={(e) => alCambiarClaseNivel(index, e.target.value)}
                    min="1"
                    max={maxNivelClase}
                    required
                    style={{ height: 34, textAlign: "center", fontWeight: 700, fontSize: 12 }}
                  />
                </div>

                <div style={{ paddingTop: 16 }}>
                  {clases.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => alEliminarClase(index)}
                      title="Eliminar clase"
                      className={estilos.botonEliminarClase}
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <div className={estilos.espacioBotonVacio} />
                  )}
                </div>
              </div>

              {/* Metadatos y Build Sugerida */}
              {infoClase && (
                <div className={estilos.barraInfoClase}>
                  <div className={estilos.infoClaseTags}>
                    <span>
                      Dado: <strong style={{ color: "#38bdf8" }}>{infoClase.dadoGolpe}</strong>
                    </span>
                    <span>
                      Salvaciones:{" "}
                      <strong style={{ color: "#a78bfa" }}>
                        {infoClase.salvacionesCompetentes.map((s) => s.slice(0, 3).toUpperCase()).join(", ")}
                      </strong>
                    </span>
                    {infoClase.configuracionMagica && (
                      <span style={{ color: "#fbbf24" }}>
                        Magia: {infoClase.configuracionMagica.habilidadConjuro.slice(0, 3).toUpperCase()} ({infoClase.configuracionMagica.tipoLanzador})
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => alAplicarBuildSugerida(index)}
                    className={estilos.botonAplicarBuild}
                    title="Aplica automáticamente las salvaciones, competencias de equipo y dados de golpe oficiales de esta clase"
                  >
                    <Sparkles size={11} /> Aplicar Build Sugerida
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botón para Añadir Multiclase */}
      <div className={estilos.pieMulticlase}>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>
          {esNivelMaximo
            ? "Alcanzaste el nivel máximo total de 20."
            : `Puedes asignar hasta ${20 - nivelGlobal} niveles más en otras clases.`}
        </span>

        <button
          type="button"
          onClick={alAgregarClase}
          disabled={esNivelMaximo}
          className={`${estilos.botonAnadirMulticlase} ${
            esNivelMaximo ? estilos.botonAnadirMulticlaseDeshabilitado : ""
          }`}
        >
          <Plus size={13} />
          Añadir Multiclase
        </button>
      </div>
    </div>
  );
};
