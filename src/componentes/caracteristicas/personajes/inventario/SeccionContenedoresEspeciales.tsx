import React from "react";
import type { ObjetoInventario } from "@/tipos";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CONTENEDORES_ESPECIALES_CONFIG } from "../usarInventarioOrdenado";
import estilos from "../HojaPersonaje.module.css";

interface SeccionContenedoresEspecialesProps {
  mapaContenedoresEspeciales: Record<string, ObjetoInventario[]>;
  seccionesAbiertas: Record<string, boolean>;
  zonaDropActiva: string | null;
  alAlternarSeccion: (id: string) => void;
  alDragOver: (e: React.DragEvent, zona: string) => void;
  alDragLeave: (e: React.DragEvent, zona: string) => void;
  alDrop: (e: React.DragEvent, zona: string) => void;
  renderizarTarjeta: (obj: ObjetoInventario) => React.ReactNode;
}

export const SeccionContenedoresEspeciales: React.FC<SeccionContenedoresEspecialesProps> = ({
  mapaContenedoresEspeciales,
  seccionesAbiertas,
  zonaDropActiva,
  alAlternarSeccion,
  alDragOver,
  alDragLeave,
  alDrop,
  renderizarTarjeta
}) => {
  return (
    <>
      {CONTENEDORES_ESPECIALES_CONFIG
        .filter((cont) => (mapaContenedoresEspeciales[cont.id] || []).length > 0)
        .map((cont) => {
          const itemsContenedor = mapaContenedoresEspeciales[cont.id] || [];
          const pesoContenedor =
            Math.round(
              itemsContenedor.reduce((acc, o) => acc + (o.pesoLb || 0) * (o.cantidad || 1), 0) * 100
            ) / 100;
          const abierta = seccionesAbiertas[cont.id] !== false;
          const estaSobrevolada = zonaDropActiva === cont.id;

          return (
            <div
              key={cont.id}
              className={`${estilos.neoRaised} ${estilos.grupoListaInventario} ${
                estaSobrevolada ? estilos.zonaDropActiva : ""
              }`}
              onDragOver={(e) => alDragOver(e, cont.id)}
              onDragLeave={(e) => alDragLeave(e, cont.id)}
              onDrop={(e) => alDrop(e, cont.id)}
            >
              <div
                className={`${estilos.cabeceraGrupoInventario} ${estilos.cabeceraColapsableInventario}`}
                onClick={() => alAlternarSeccion(cont.id)}
                title={`Haz clic para colapsar o expandir (o arrastra aquí para mover a ${cont.titulo})`}
              >
                <div className={estilos.tituloGrupoInventario} style={{ color: cont.color }}>
                  <span className={estilos.iconoChevronColapso}>
                    {abierta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                  {cont.icono}
                  <span>{cont.titulo}</span>
                </div>
                <div className={estilos.metaSubseccionMochila}>
                  {pesoContenedor > 0 && (
                    <span className={estilos.pesoSubseccionMochila}>
                      {pesoContenedor} lb (0 lb carga)
                    </span>
                  )}
                  <span className={estilos.contadorGrupoInventario}>
                    {itemsContenedor.length}
                  </span>
                </div>
              </div>

              {abierta && (
                <div className={estilos.listaItemsInventario}>
                  {itemsContenedor.length === 0 ? (
                    <div className={estilos.mensajeVacioInventario}>
                      No hay objetos en este compartimento. Arrastra objetos aquí para transferirlos.
                    </div>
                  ) : (
                    itemsContenedor.map(renderizarTarjeta)
                  )}
                </div>
              )}
            </div>
          );
        })}
    </>
  );
};
