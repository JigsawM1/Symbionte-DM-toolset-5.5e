import React from "react";
import { FileText, X } from "lucide-react";
import type { CriaturaIniciativa, HechizoBase, MonstruoBase } from "@/almacen/usarAlmacenDM";
import { esNombreVacioODot } from "@/servicios/resolutorCriaturas";
import { PanelFichaDnD } from "../PanelFichaDnD";
import { VinculadorPlantilla } from "../VinculadorPlantilla";
import estilosClases from "../GestorIniciativa.module.css";

interface PanelDetalleCriaturaIniciativaProps {
  criatura: CriaturaIniciativa;
  plantilla: MonstruoBase | null;
  baseDatosMonstruos: MonstruoBase[];
  baseDatosHechizos: HechizoBase[];
  onAsociarPlantilla: (idCriatura: string, idPlantilla: string) => void;
  onSolicitarDesvincular: (criatura: CriaturaIniciativa, plantilla: MonstruoBase) => void;
  onCerrar: () => void;
  onHacerClicHechizo: (hechizo: HechizoBase) => void;
  lanzarAtaqueRapido: (
    criaturaNombre: string,
    ataqueNombre: string,
    bonoAtaqueStr: string,
    dadosDaño: string,
    tipoDaño: string
  ) => void;
  lanzarTiradaD20Interactiva: (criaturaNombre: string, etiqueta: string, bonificador: number) => void;
  obtenerPercepcionPasiva: (plantilla: MonstruoBase | null) => number;
}

export const PanelDetalleCriaturaIniciativa: React.FC<PanelDetalleCriaturaIniciativaProps> = React.memo(({
  criatura,
  plantilla,
  baseDatosMonstruos,
  baseDatosHechizos,
  onAsociarPlantilla,
  onSolicitarDesvincular,
  onCerrar,
  onHacerClicHechizo,
  lanzarAtaqueRapido,
  lanzarTiradaD20Interactiva,
  obtenerPercepcionPasiva
}) => {
  return (
    <div className={estilosClases.panelDetalleInferior}>
      <div className={estilosClases.cabeceraDetalleFicha}>
        <div className={estilosClases.tituloFichaIzquierda}>
          <FileText size={13} className={estilosClases.iconoFicha} />
          <span className={estilosClases.nombreFichaCabecera}>
            {esNombreVacioODot(criatura.nombre)
              ? `[MINI SIN NOMBRE: ${criatura.id.slice(-4).toUpperCase()}]`
              : criatura.nombre.toUpperCase()}
          </span>
          {plantilla && (
            <div className={estilosClases.contenedorDesvincular}>
              <span className={estilosClases.subFichaAsociada}>
                [ {plantilla.nombre.toUpperCase()} ]
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onSolicitarDesvincular(criatura, plantilla);
                }}
                className={estilosClases.botonDesvincularMini}
                title="Desvincular plantilla"
              >
                <X size={10} />
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onCerrar}
          className={estilosClases.botonCerrarDetalle}
          aria-label="Cerrar ficha de criatura"
          title="Cerrar ficha de criatura"
        >
          <X size={14} />
        </button>
      </div>

      <div className={estilosClases.cuerpoDetalleScroll}>
        {!plantilla ? (
          <VinculadorPlantilla
            criaturaId={criatura.id}
            baseDatosMonstruos={baseDatosMonstruos}
            onAsociar={onAsociarPlantilla}
          />
        ) : (
          <PanelFichaDnD
            criaturaNombre={criatura.nombre}
            plantilla={plantilla}
            baseDatosHechizos={baseDatosHechizos}
            alHacerClicHechizo={onHacerClicHechizo}
            lanzarAtaqueRapido={lanzarAtaqueRapido}
            lanzarTiradaD20Interactiva={lanzarTiradaD20Interactiva}
            obtenerPercepcionPasiva={obtenerPercepcionPasiva}
          />
        )}
      </div>
    </div>
  );
});

PanelDetalleCriaturaIniciativa.displayName = "PanelDetalleCriaturaIniciativa";
