import React from "react";
import { ObjetoHomebrew } from "@/tipos";
import { SelectorDesplegable } from "@/componentes/comunes";
import { Copy } from "lucide-react";

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
  if (idEnEdicion) return null;

  const opcionesPlantillas = listaTodosObjetos.map((obj) => ({
    valor: obj.id,
    etiqueta: `${obj.nombre} (${obj.tipoPrincipal} - ${obj.rareza})`
  }));

  return (
    <div className={estilos.contenedorPlantillaBase}>
      <label className={estilos.labelPlantillaBase}>
        <Copy size={13} />
        Usar objeto base como plantilla:
      </label>
      <SelectorDesplegable
        valor=""
        alCambiar={(id) => id && alSeleccionarPlantilla(id)}
        opciones={opcionesPlantillas}
        placeholder="-- Seleccionar objeto base (ej. Cimatarra, Escudo, Poción) --"
      />
    </div>
  );
};
