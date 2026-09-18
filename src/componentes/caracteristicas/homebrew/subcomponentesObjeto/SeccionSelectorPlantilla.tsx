import React, { useState, useMemo } from "react";
import { ObjetoHomebrew } from "@/tipos";
import { SelectorSugerencias, type OpcionSugerencia } from "@/componentes/comunes";
import { Copy } from "lucide-react";

import { DICCIONARIO_CATEGORIAS_EQUIPO } from "@/constantes/categoriasEquipoConstantes";

interface Props {
  idEnEdicion: string | null;
  listaTodosObjetos: ObjetoHomebrew[];
  alSeleccionarPlantilla: (id: string) => void;
  estilos: Record<string, string>;
}

export const SeccionSelectorPlantilla: React.FC<Props> = ({
  idEnEdicion,
  listaTodosObjetos,
  alSeleccionarPlantilla,
  estilos
}) => {
  const [busquedaPlantilla, setBusquedaPlantilla] = useState("");

  const opcionesPlantillas = useMemo<OpcionSugerencia[]>(() => {
    return listaTodosObjetos.map((obj) => {
      const categoriaEtiqueta =
        DICCIONARIO_CATEGORIAS_EQUIPO[obj.categoria]?.etiqueta || obj.categoria;
      return {
        clave: obj.id,
        valor: obj.nombre,
        etiqueta: obj.nombre,
        subtitulo: `${categoriaEtiqueta} • ${obj.rareza}`,
        grupo: categoriaEtiqueta
      };
    });
  }, [listaTodosObjetos]);

  if (idEnEdicion) return null;

  const manejarSeleccionar = (opcion: OpcionSugerencia) => {
    const idObjetivo =
      opcion.clave ||
      listaTodosObjetos.find(
        (o) => o.nombre.toLowerCase() === opcion.valor.trim().toLowerCase()
      )?.id;

    if (idObjetivo) {
      setBusquedaPlantilla(opcion.etiqueta || opcion.valor);
      alSeleccionarPlantilla(idObjetivo);
    }
  };

  return (
    <div className={estilos.contenedorPlantillaBase}>
      <label className={estilos.labelPlantillaBase}>
        <Copy size={13} />
        Usar objeto base como plantilla:
      </label>
      <SelectorSugerencias
        valor={busquedaPlantilla}
        alCambiar={setBusquedaPlantilla}
        alSeleccionar={manejarSeleccionar}
        opciones={opcionesPlantillas}
        placeholder="-- Buscar objeto base como plantilla (ej. Cimatarra, Escudo, Poción) --"
      />
    </div>
  );
};
