import React from "react";
import { X } from "lucide-react";
import type { AcompanantePersonaje, MonstruoBase, HechizoBase } from "@/tipos";
import { PanelFichaDnD } from "@/componentes/caracteristicas/iniciativa/PanelFichaDnD";
import estilos from "./SeccionAcompanantesPersonaje.module.css";

export interface ModalEstadisticasAcompananteProps {
  acompanante: AcompanantePersonaje | null;
  plantilla: MonstruoBase | null;
  baseDatosHechizos: HechizoBase[];
  onCerrar: () => void;
  lanzarAtaqueRapido: (nombre: string, accNom: string, accBono: string, accDados: string, accTipo: string) => void;
  lanzarTiradaD20: (criaturaNombre: string, etiqueta: string, bonificador: number) => void;
  obtenerPercepcionPasiva: (plantilla: MonstruoBase | null) => number;
}

export const ModalEstadisticasAcompanante: React.FC<ModalEstadisticasAcompananteProps> = ({
  acompanante,
  plantilla,
  baseDatosHechizos,
  onCerrar,
  lanzarAtaqueRapido,
  lanzarTiradaD20,
  obtenerPercepcionPasiva
}) => {
  if (!acompanante || !plantilla) return null;

  return (
    <div className={estilos.modalFichaOverlay} onClick={onCerrar}>
      <div className={estilos.modalFichaContenido} onClick={(e) => e.stopPropagation()}>
        <div className={estilos.modalFichaCabecera}>
          <h3 className={estilos.modalFichaTitulo}>
            Estadísticas: {acompanante.nombre}
          </h3>
          <button
            type="button"
            onClick={onCerrar}
            className={estilos.botonCerrarModal}
            title="Cerrar ficha"
          >
            <X size={16} />
          </button>
        </div>
        <div className={estilos.modalFichaCuerpo}>
          <PanelFichaDnD
            criaturaNombre={acompanante.nombre}
            plantilla={plantilla}
            baseDatosHechizos={baseDatosHechizos}
            alHacerClicHechizo={(_hechizo: HechizoBase) => {}}
            lanzarAtaqueRapido={lanzarAtaqueRapido}
            lanzarTiradaD20Interactiva={lanzarTiradaD20}
            obtenerPercepcionPasiva={obtenerPercepcionPasiva}
          />
        </div>
      </div>
    </div>
  );
};
