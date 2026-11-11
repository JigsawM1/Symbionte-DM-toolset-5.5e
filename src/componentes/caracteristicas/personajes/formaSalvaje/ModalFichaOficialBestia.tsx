import React from "react";
import type { MonstruoBase } from "@/tipos";
import { PawPrint, X, Zap } from "lucide-react";
import { PanelFichaDnD } from "@/componentes/caracteristicas/iniciativa/PanelFichaDnD";
import { extraerSentidosBestia } from "@/servicios/reglasFormaSalvaje";
import estilos from "../PanelFormaSalvaje.module.css";

interface ModalFichaOficialBestiaProps {
  bestia: MonstruoBase | null;
  alCerrar: () => void;
  alAdoptar: (id: string) => void;
  estaActiva: boolean;
  puedeAdoptar: boolean;
}

/**
 * Modal para inspeccionar la ficha oficial completa de D&D de una criatura (PanelFichaDnD).
 */
export const ModalFichaOficialBestia: React.FC<ModalFichaOficialBestiaProps> = ({
  bestia,
  alCerrar,
  alAdoptar,
  estaActiva,
  puedeAdoptar
}) => {
  if (!bestia) return null;

  return (
    <div className={estilos.modalFichaOverlay} onClick={alCerrar}>
      <div className={estilos.modalFichaContenido} onClick={(e) => e.stopPropagation()}>
        <header className={estilos.modalFichaCabecera}>
          <div className={estilos.modalFichaTituloBloque}>
            <PawPrint size={18} className={estilos.iconoEmblema} />
            <h3 className={estilos.modalFichaTitulo}>
              Ficha Oficial: {bestia.nombre}
            </h3>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            className={estilos.botonCerrarModal}
            title="Cerrar ficha"
          >
            <X size={18} />
          </button>
        </header>

        <div className={estilos.modalFichaCuerpo}>
          <PanelFichaDnD
            criaturaNombre={bestia.nombre}
            plantilla={bestia}
            baseDatosHechizos={[]}
            alHacerClicHechizo={() => {}}
            lanzarAtaqueRapido={() => {}}
            lanzarTiradaD20Interactiva={() => {}}
            obtenerPercepcionPasiva={(plantilla) =>
              extraerSentidosBestia(plantilla ?? bestia).percepcionPasiva ?? 10
            }
          />
        </div>

        <footer className={estilos.modalFichaPie}>
          <button
            type="button"
            className={estilos.botonGestionarPool}
            onClick={alCerrar}
          >
            Cerrar
          </button>
          <button
            type="button"
            className={estilos.botonAdoptar}
            onClick={() => {
              const id = bestia.id;
              alCerrar();
              alAdoptar(id);
            }}
            disabled={!puedeAdoptar}
          >
            <Zap size={14} />
            {estaActiva ? "Volver a adoptar" : "Adoptar Esta Forma"}
          </button>
        </footer>
      </div>
    </div>
  );
};
