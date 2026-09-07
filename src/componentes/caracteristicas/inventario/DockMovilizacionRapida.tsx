import React from "react";
import { Package } from "lucide-react";
import { CAJAS_MOVILIZACION_RAPIDA } from "./usarInventarioOrdenado";
import estilos from "./HojaPersonaje.module.css";

interface DockMovilizacionRapidaProps {
  arrastrandoItem: boolean;
  zonaDropActiva: string | null;
  alDragOver: (e: React.DragEvent, id: string) => void;
  alDragLeave: (e: React.DragEvent, id: string) => void;
  alDrop: (e: React.DragEvent, id: string) => void;
}

export const DockMovilizacionRapida: React.FC<DockMovilizacionRapidaProps> = ({
  arrastrandoItem,
  zonaDropActiva,
  alDragOver,
  alDragLeave,
  alDrop
}) => {
  if (!arrastrandoItem) {
    return null;
  }

  return (
    <div className={estilos.dockMovilizacionFlotanteInferior}>
      <div className={estilos.tituloDockMovilizacion}>
        <Package size={11} color="#38bdf8" />
        <span>Movilización Rápida (Suelta para transferir)</span>
      </div>
      <div className={estilos.gridCajasMovilizacion}>
        {CAJAS_MOVILIZACION_RAPIDA.map((caja) => {
          const estaSobrevolada = zonaDropActiva === caja.id;
          return (
            <div
              key={caja.id}
              className={`${estilos.cajaMovilizacionRapida} ${estaSobrevolada ? estilos.cajaMovilizacionSobrevolada : ""}`}
              style={{
                borderColor: estaSobrevolada ? caja.color : `${caja.color}60`,
                backgroundColor: estaSobrevolada ? `${caja.color}35` : `${caja.color}15`
              }}
              onDragOver={(e) => alDragOver(e, caja.id)}
              onDragLeave={(e) => alDragLeave(e, caja.id)}
              onDrop={(e) => alDrop(e, caja.id)}
              title={`Arrastra y suelta aquí para transferir a ${caja.titulo}`}
            >
              <div className={estilos.iconoCajaMovilizacion}>{caja.icono}</div>
              <div className={estilos.infoCajaMovilizacion}>
                <span className={estilos.nombreCajaMovilizacion} style={{ color: caja.color }}>
                  {caja.titulo}
                </span>
                <span className={estilos.subtituloCajaMovilizacion}>
                  {caja.subtitulo}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
