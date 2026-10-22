import React, { useState } from "react";
import type { PersonajeJugador, Habilidad, GradoCompetencia, Caracteristica } from "@/tipos";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { resolverTiradaHabilidadRasgos } from "@/servicios/rasgos/tiradaHabilidadRasgos";
import { evaluarEfectosCondicionesEnTirada } from "@/servicios/procesadorCondiciones";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { AlertTriangle, Sparkles } from "lucide-react";
import estilos from "./AtributosPersonaje.module.css";

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

interface Props {
  hab: Habilidad;
  nombre: string;
  personaje: PersonajeJugador;
  statsCalculadas: EstadisticasCalculadasPersonaje;
  habilidadesConFuerza: ReadonlySet<string>;
  alTirarHabilidad: (hab: Habilidad, nombre: string, bono: number, caracteristica?: Caracteristica) => void;
  alCiclarGradoHabilidad: (hab: Habilidad) => void;
}

export const FilaHabilidadPersonaje: React.FC<Props> = ({ hab, nombre, personaje, statsCalculadas, habilidadesConFuerza, alTirarHabilidad, alCiclarGradoHabilidad }) => {
  const [caracteristicaElegida, elegirCaracteristica] = useState<Caracteristica>();
  const penalizacionSinComp = !!statsCalculadas.penalizacionArmadura?.sinCompetencia;
  const desventajaSigiloArmadura = !!statsCalculadas.desventajaSigiloArmadura;

  const custom = personaje.personalizacionesHabilidades?.[hab];
  const nombreMostrar = custom?.nombrePersonalizado || nombre;
  const tirada = resolverTiradaHabilidadRasgos(personaje, hab, statsCalculadas.modificadores, statsCalculadas.habilidades[hab] || 0, caracteristicaElegida, habilidadesConFuerza);
  const bono = tirada.bono;
  const bonoTexto = bono >= 0 ? `+${bono}` : `${bono}`;
  const grado = statsCalculadas.gradosHabilidadesEfectivos?.[hab] ||
    ((personaje.gradosHabilidades?.[hab] || "ninguna") as GradoCompetencia);
  const esCompetente = grado !== "ninguna";
  const caracAsociada = tirada.caracteristica;

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
    <div className={estilos.itemHabilidad} data-habilidad={hab}>
      <button type="button" className={estilos.botonToggleHabilidad}
        aria-label={`Competencia de ${nombreMostrar}: ${grado}`} title={obtenerTituloGrado(grado)}
        onClick={() => alCiclarGradoHabilidad(hab)}>
        <span className={obtenerClaseGrado(grado, estilos)} />
      </button>
      <button type="button" className={estilos.tiradaHabilidad} title={tooltipHab}
        onClick={() => alTirarHabilidad(hab, nombreMostrar, bono, caracAsociada)}>
        <span className={estilos.nombreHabilidad}>{nombreMostrar}</span>
        {evalHab.tieneDesventaja && <AlertTriangle size={12} aria-label={`Desventaja: ${motivosHab}`} />}
        {evalHab.tieneVentaja && !evalHab.tieneDesventaja && <Sparkles size={12} aria-label={`Ventaja: ${motivosHab}`} />}
        <span className={`${estilos.valorBonoHabilidad} ${esCompetente ? estilos.valorBonoHabilidadDestacado : ""}`}>{bonoTexto}</span>
      </button>
      {tirada.opciones.length > 0 && <div className={estilos.selectorCaracteristicaHabilidad}>
        <SelectorDesplegable titulo={`Característica para ${nombreMostrar}`} valor={caracAsociada} tamano="mini"
          opciones={tirada.opciones.map(o => ({ valor: o.caracteristica, etiqueta: ABREVIATURA_CARACTERISTICA[o.caracteristica] }))}
          alCambiar={elegirCaracteristica} />
      </div>}
    </div>
  );
};
