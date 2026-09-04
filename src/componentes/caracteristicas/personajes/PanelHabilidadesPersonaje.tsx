import React from "react";
import type { PersonajeJugador, Habilidad, GradoCompetencia } from "@/tipos";
import { HABILIDADES_LISTA, MAPA_HABILIDAD_A_CARACTERISTICA } from "@/constantes";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { evaluarEfectosCondicionesEnTirada } from "@/servicios/procesadorCondiciones";
import { Swords, Shield, Languages, Wrench, AlertTriangle, Sparkles } from "lucide-react";
import type { CategoriaCompetencia } from "./ModalSelectorCompetencias";
import estilos from "./HojaPersonaje.module.css";

interface PanelHabilidadesPersonajeProps {
  personaje: PersonajeJugador;
  statsCalculadas: EstadisticasCalculadasPersonaje;
  alTirarHabilidad: (hab: Habilidad, nombre: string, bono: number) => void;
  alCiclarGradoHabilidad: (hab: Habilidad) => void;
  alAbrirSelectorCompetencias?: (categoria: CategoriaCompetencia) => void;
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
  alCiclarGradoHabilidad,
  alAbrirSelectorCompetencias
}) => {
  const { habilidades } = statsCalculadas;
  const penalizacionSinComp = !!statsCalculadas.penalizacionArmadura?.sinCompetencia;
  const desventajaSigiloArmadura = !!statsCalculadas.desventajaSigiloArmadura;

  return (
    <section className={estilos.filaHabilidadesCompetencias}>
      {/* Columna Izquierda: 18 Habilidades en 2 columnas */}
      <div className={`${estilos.neoRaised} ${estilos.panelHabilidades}`}>
        <span className={estilos.tituloPanelLateral}>Habilidades</span>

        <div className={estilos.gridHabilidadesDobleColumna}>
          {HABILIDADES_LISTA.map(({ clave, nombre }) => {
            const hab = clave as Habilidad;
            const custom = personaje.personalizacionesHabilidades?.[hab];
            const nombreMostrar = custom?.nombrePersonalizado || nombre;
            const bono = habilidades[hab] || 0;
            const bonoTexto = bono >= 0 ? `+${bono}` : `${bono}`;
            const grado = statsCalculadas.gradosHabilidadesEfectivos?.[hab] ||
              ((personaje.gradosHabilidades?.[hab] || "ninguna") as GradoCompetencia);
            const esCompetente = grado !== "ninguna";
            const caracAsociada = MAPA_HABILIDAD_A_CARACTERISTICA[hab] || "destreza";
            const abrevCarac = ABREVIATURA_CARACTERISTICA[caracAsociada] || "Des";

            // Evaluación integral de condiciones activas y rasgos para cada habilidad
            const evalHab = evaluarEfectosCondicionesEnTirada({
              tipo: "caracteristica",
              caracteristica: caracAsociada,
              habilidad: hab,
              penalizacionArmadura: penalizacionSinComp,
              desventajaSigiloArmadura,
              condicionesActivas: personaje.condicionesActivas,
              personaje: personaje
            });

            const motivosHab = [
              ...evalHab.motivosDesventaja,
              ...evalHab.motivosVentaja,
              ...evalHab.motivosModificadores
            ].join(", ");

            let tooltipHab = `Prueba de ${nombreMostrar} (${bonoTexto}). Clic para tirar en 3D.`;
            if (evalHab.tieneDesventaja) {
              tooltipHab = `Prueba de ${nombreMostrar} (${bonoTexto}). DESVENTAJA por: ${evalHab.motivosDesventaja.join(", ")}. Clic para tirar.`;
            } else if (evalHab.tieneVentaja) {
              tooltipHab = `Prueba de ${nombreMostrar} (${bonoTexto}). VENTAJA por: ${evalHab.motivosVentaja.join(", ")}. Clic para tirar.`;
            }

            return (
              <div
                key={hab}
                className={estilos.itemHabilidad}
                onClick={() => alTirarHabilidad(hab, nombreMostrar, bono)}
                title={tooltipHab}
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
                  <span className={estilos.nombreHabilidad}>{nombreMostrar}</span>
                  <span className={estilos.caracAbrevHabilidad}>({abrevCarac})</span>
                  {evalHab.tieneDesventaja && (
                    <span title={`Desventaja en ${nombreMostrar} por: ${motivosHab}`}>
                      <AlertTriangle size={10} color="#f59e0b" style={{ marginLeft: 2 }} />
                    </span>
                  )}
                  {evalHab.tieneVentaja && !evalHab.tieneDesventaja && (
                    <span title={`Ventaja en ${nombreMostrar} por: ${motivosHab}`}>
                      <Sparkles size={10} color="#38bdf8" style={{ marginLeft: 2 }} />
                    </span>
                  )}
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
          <span className={estilos.tituloGrupoCompetencia} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Swords size={11} color="#94a3b8" /> Armas
          </span>
          <div
            className={`${estilos.cajaTextoCompetencia} ${estilos.neoPressed} ${alAbrirSelectorCompetencias ? estilos.cajaTextoCompetenciaInteractiva : ""}`}
            onClick={() => alAbrirSelectorCompetencias?.("armas")}
            title={alAbrirSelectorCompetencias ? "Haz clic para editar competencias en Armas" : undefined}
            role={alAbrirSelectorCompetencias ? "button" : undefined}
            tabIndex={alAbrirSelectorCompetencias ? 0 : undefined}
          >
            {statsCalculadas?.competenciasEfectivas?.armasTexto || personaje.competenciasArmas || "Ninguna"}
          </div>
        </div>

        <div className={estilos.grupoCompetenciaItem}>
          <span className={estilos.tituloGrupoCompetencia} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Shield size={11} color="#94a3b8" /> Armaduras
          </span>
          <div
            className={`${estilos.cajaTextoCompetencia} ${estilos.neoPressed} ${alAbrirSelectorCompetencias ? estilos.cajaTextoCompetenciaInteractiva : ""}`}
            onClick={() => alAbrirSelectorCompetencias?.("armaduras")}
            title={alAbrirSelectorCompetencias ? "Haz clic para editar competencias en Armaduras" : undefined}
            role={alAbrirSelectorCompetencias ? "button" : undefined}
            tabIndex={alAbrirSelectorCompetencias ? 0 : undefined}
          >
            {statsCalculadas?.competenciasEfectivas?.armadurasTexto || personaje.competenciasArmaduras || "Ninguna"}
          </div>
        </div>

        <div className={estilos.grupoCompetenciaItem}>
          <span className={estilos.tituloGrupoCompetencia} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Languages size={11} color="#94a3b8" /> Idiomas
          </span>
          <div
            className={`${estilos.cajaTextoCompetencia} ${estilos.neoPressed} ${alAbrirSelectorCompetencias ? estilos.cajaTextoCompetenciaInteractiva : ""}`}
            onClick={() => alAbrirSelectorCompetencias?.("idiomas")}
            title={alAbrirSelectorCompetencias ? "Haz clic para editar Idiomas conocidos" : undefined}
            role={alAbrirSelectorCompetencias ? "button" : undefined}
            tabIndex={alAbrirSelectorCompetencias ? 0 : undefined}
          >
            {personaje.idiomas || "Común"}
          </div>
        </div>

        <div className={estilos.grupoCompetenciaItem}>
          <span className={estilos.tituloGrupoCompetencia} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Wrench size={11} color="#94a3b8" /> Herramientas
          </span>
          <div
            className={`${estilos.cajaTextoCompetencia} ${estilos.neoPressed} ${alAbrirSelectorCompetencias ? estilos.cajaTextoCompetenciaInteractiva : ""}`}
            onClick={() => alAbrirSelectorCompetencias?.("herramientas")}
            title={alAbrirSelectorCompetencias ? "Haz clic para editar competencias en Herramientas" : undefined}
            role={alAbrirSelectorCompetencias ? "button" : undefined}
            tabIndex={alAbrirSelectorCompetencias ? 0 : undefined}
          >
            {personaje.herramientas || "Ninguna"}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PanelHabilidadesPersonaje;

