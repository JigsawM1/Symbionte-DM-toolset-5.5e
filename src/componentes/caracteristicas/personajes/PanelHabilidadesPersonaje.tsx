import React from "react";
import type { PersonajeJugador, Habilidad, GradoCompetencia } from "@/tipos";
import { HABILIDADES_LISTA, MAPA_HABILIDAD_A_CARACTERISTICA } from "@/constantes";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import estilos from "./HojaPersonaje.module.css";

interface PanelHabilidadesPersonajeProps {
  personaje: PersonajeJugador;
  statsCalculadas: EstadisticasCalculadasPersonaje;
  alTirarHabilidad: (hab: Habilidad, nombre: string, bono: number) => void;
  alCiclarGradoHabilidad: (hab: Habilidad) => void;
}

const ABREVIATURA_CARACTERISTICA: Record<string, string> = {
  fuerza: "Fue",
  destreza: "Des",
  constitucion: "Con",
  inteligencia: "Int",
  sabiduria: "Sab",
  carisma: "Car"
};

function obtenerClaseGrado(grado: GradoCompetencia, estilosMap: Record<string, string>): string {
  switch (grado) {
    case "medio":
      return `${estilosMap.puntoGradoHabilidad} ${estilosMap.puntoGradoMedio}`;
    case "competente":
      return `${estilosMap.puntoGradoHabilidad} ${estilosMap.puntoGradoCompetente}`;
    case "pericia":
      return `${estilosMap.puntoGradoHabilidad} ${estilosMap.puntoGradoPericia}`;
    case "ninguna":
    default:
      return `${estilosMap.puntoGradoHabilidad} ${estilosMap.puntoGradoVacio}`;
  }
}

function obtenerTituloGrado(grado: GradoCompetencia): string {
  switch (grado) {
    case "medio":
      return "Medio Bono (0.5x PB) — Clic para cambiar a Competente";
    case "competente":
      return "Competente (1x PB) — Clic para cambiar a Pericia";
    case "pericia":
      return "Pericia (2x PB) — Clic para quitar competencia";
    case "ninguna":
    default:
      return "Sin competencia — Clic para asignar Medio Bono";
  }
}

export const PanelHabilidadesPersonaje: React.FC<PanelHabilidadesPersonajeProps> = ({
  personaje,
  statsCalculadas,
  alTirarHabilidad,
  alCiclarGradoHabilidad
}) => {
  const { habilidades } = statsCalculadas;

  return (
    <section className={estilos.filaHabilidadesCompetencias}>
      {/* Columna Izquierda: 18 Habilidades en 2 columnas */}
      <div className={`${estilos.neoRaised} ${estilos.panelHabilidades}`}>
        <span className={estilos.tituloPanelLateral}>Habilidades</span>

        <div className={estilos.gridHabilidadesDobleColumna}>
          {HABILIDADES_LISTA.map(({ clave, nombre }) => {
            const hab = clave as Habilidad;
            const bono = habilidades[hab] || 0;
            const bonoTexto = bono >= 0 ? `+${bono}` : `${bono}`;
            const grado = (personaje.gradosHabilidades?.[hab] || "ninguna") as GradoCompetencia;
            const esCompetente = grado !== "ninguna";
            const caracAsociada = MAPA_HABILIDAD_A_CARACTERISTICA[hab] || "destreza";
            const abrevCarac = ABREVIATURA_CARACTERISTICA[caracAsociada] || "Des";

            return (
              <div
                key={hab}
                className={estilos.itemHabilidad}
                onClick={() => alTirarHabilidad(hab, nombre, bono)}
                title={`Prueba de ${nombre} (${bonoTexto}). Clic para tirar en 3D.`}
              >
                <div className={estilos.infoHabilidadIzquierda}>
                  {/* Botón envoltorio exclusivo para ciclar competencia sin disparar tirada */}
                  <button
                    type="button"
                    className={estilos.botonToggleHabilidad}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      alCiclarGradoHabilidad(hab);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    title={obtenerTituloGrado(grado)}
                  >
                    <div className={obtenerClaseGrado(grado, estilos)} />
                  </button>
                  <span className={estilos.nombreHabilidad}>{nombre}</span>
                  <span className={estilos.caracAbrevHabilidad}>({abrevCarac})</span>
                </div>

                <span
                  className={`${estilos.valorBonoHabilidad} ${
                    esCompetente ? estilos.valorBonoHabilidadDestacado : ""
                  }`}
                >
                  {bonoTexto}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Columna Derecha: Competencias de Armas, Armaduras, Idiomas y Herramientas */}
      <div className={`${estilos.neoRaised} ${estilos.panelCompetencias}`}>
        <span className={estilos.tituloPanelLateral}>Competencias</span>

        <div className={estilos.grupoCompetenciaItem}>
          <span className={estilos.tituloGrupoCompetencia}>Armas</span>
          <div className={`${estilos.cajaTextoCompetencia} ${estilos.neoPressed}`}>
            {personaje.competenciasArmas || "Ninguna"}
          </div>
        </div>

        <div className={estilos.grupoCompetenciaItem}>
          <span className={estilos.tituloGrupoCompetencia}>Armaduras</span>
          <div className={`${estilos.cajaTextoCompetencia} ${estilos.neoPressed}`}>
            {personaje.competenciasArmaduras || "Ninguna"}
          </div>
        </div>

        <div className={estilos.grupoCompetenciaItem}>
          <span className={estilos.tituloGrupoCompetencia}>Idiomas</span>
          <div className={`${estilos.cajaTextoCompetencia} ${estilos.neoPressed}`}>
            {personaje.idiomas || "Común"}
          </div>
        </div>

        <div className={estilos.grupoCompetenciaItem}>
          <span className={estilos.tituloGrupoCompetencia}>Herramientas</span>
          <div className={`${estilos.cajaTextoCompetencia} ${estilos.neoPressed}`}>
            {personaje.herramientas || "Ninguna"}
          </div>
        </div>
      </div>
    </section>
  );
};
