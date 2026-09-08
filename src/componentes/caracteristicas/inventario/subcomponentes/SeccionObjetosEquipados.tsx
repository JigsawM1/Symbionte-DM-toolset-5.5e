import React from "react";
import type { ObjetoInventario } from "@/tipos";
import { Swords, ChevronDown, ChevronRight } from "lucide-react";
import estilos from "@/componentes/caracteristicas/personajes/HojaPersonaje.module.css";

interface SeccionObjetosEquipadosProps {
  estaAbierta: boolean;
  zonaDropActiva: string | null;
  objetosEquipados: ObjetoInventario[];
  alAlternarSeccion: () => void;
  alDragOver: (e: React.DragEvent, zona: string) => void;
  alDragLeave: (e: React.DragEvent, zona: string) => void;
  alDrop: (e: React.DragEvent, zona: string) => void;
  renderizarTarjeta: (obj: ObjetoInventario) => React.ReactNode;
}

export const SeccionObjetosEquipados: React.FC<SeccionObjetosEquipadosProps> = ({
  estaAbierta,
  zonaDropActiva,
  objetosEquipados,
  alAlternarSeccion,
  alDragOver,
  alDragLeave,
  alDrop,
  renderizarTarjeta
}) => {
  return (
    <div
      className={`${estilos.neoRaised} ${estilos.grupoListaInventario} ${
        zonaDropActiva === "equipados" ? estilos.zonaDropActiva : ""
      }`}
      onDragOver={(e) => alDragOver(e, "equipados")}
      onDragLeave={(e) => alDragLeave(e, "equipados")}
      onDrop={(e) => alDrop(e, "equipados")}
    >
      <div
        className={`${estilos.cabeceraGrupoInventario} ${estilos.cabeceraColapsableInventario}`}
        onClick={alAlternarSeccion}
        title="Haz clic para colapsar o expandir (o arrastra aquí para equipar)"
      >
        <div className={estilos.tituloGrupoInventario}>
          <span className={estilos.iconoChevronColapso}>
            {estaAbierta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <Swords size={14} color="#60a5fa" />
          <span>Equipados Activos</span>
        </div>
        <span className={estilos.contadorGrupoInventario}>
          {objetosEquipados.length}
        </span>
      </div>

      {estaAbierta && (
        <div
          className={estilos.listaItemsInventario}
          onDragOver={(e) => alDragOver(e, "equipados")}
          onDrop={(e) => alDrop(e, "equipados")}
        >
          {objetosEquipados.length === 0 ? (
            <div
              className={estilos.mensajeVacioInventario}
              onDragOver={(e) => alDragOver(e, "equipados")}
              onDrop={(e) => alDrop(e, "equipados")}
            >
              No hay armas o armaduras equipadas actualmente. Arrastra objetos aquí para equiparlos.
            </div>
          ) : (
            objetosEquipados.map(renderizarTarjeta)
          )}
        </div>
      )}
    </div>
  );
};
