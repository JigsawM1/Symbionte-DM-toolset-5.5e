import React from "react";
import { ObjetoHomebrew } from "@/tipos";
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

  return (
    <div className={estilos.contenedorPlantillaBase}>
      <label className={estilos.labelPlantillaBase}>
        <Copy size={13} />
        Usar objeto base como plantilla:
      </label>
      <select
        className={estilos.selectPlantillaBase}
        value=""
        onChange={(e) => alSeleccionarPlantilla(e.target.value)}
      >
        <option value="" disabled>
          -- Seleccionar objeto base (ej. Cimatarra, Escudo, Poción) --
        </option>
        {listaTodosObjetos.map((obj) => (
          <option key={obj.id} value={obj.id}>
            {obj.nombre} ({obj.tipoPrincipal} - {obj.rareza})
          </option>
        ))}
      </select>
    </div>
  );
};
