import React from "react";
import { Sparkles } from "lucide-react";
import type { EntradaMagiaSalvaje } from "@/servicios/magiaSalvaje/servicioMagiaSalvaje";
import estilos from "./MagiaSalvaje.module.css";
import { TextoEnriquecidoDND } from "@/componentes/comunes/TextoEnriquecidoDND";

export interface OpcionCaosControlado {
  tiradaA: number;
  entradaA: EntradaMagiaSalvaje;
  tiradaB: number;
  entradaB: EntradaMagiaSalvaje;
  origen: "talespire" | "local";
}

interface PanelCaosControladoProps {
  eleccion: OpcionCaosControlado;
  alElegir: (tirada: number, entrada: EntradaMagiaSalvaje) => void;
}

export const PanelCaosControlado: React.FC<PanelCaosControladoProps> = ({ eleccion, alElegir }) => {
  return (
    <section className={estilos.panelCaosControlado} aria-label="Elección de Caos Controlado">
      <h3 className={estilos.cabeceraCaos}>
        <Sparkles size={16} />
        <span>Caos Controlado · Elige un resultado</span>
      </h3>
      <div className={estilos.gridEleccionCaos}>
        {([["A", eleccion.tiradaA, eleccion.entradaA], ["B", eleccion.tiradaB, eleccion.entradaB]] as const)
          .map(([opcion, tirada, entrada]) => <article key={opcion} className={estilos.opcionCaos}>
          <strong>Opción {opcion} (d100: {tirada})</strong>
          <span>{entrada.titulo}</span>
          <TextoEnriquecidoDND texto={entrada.texto} className={estilos.descripcionFila} permitirTiradas={false} />
          <button type="button" className={estilos.botonOpcionCaos}
            onClick={() => alElegir(tirada, entrada)}>Elegir opción {opcion}</button>
        </article>)}
      </div>
    </section>
  );
};
