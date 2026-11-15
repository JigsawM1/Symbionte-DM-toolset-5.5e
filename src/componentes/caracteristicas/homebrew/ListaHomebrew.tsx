import React from "react";
import type { MonstruoBase, HechizoBase, ObjetoHomebrew, PlantillaInvocacion } from "@/tipos";
import { ListaMonstruosHomebrew } from "./ListaMonstruosHomebrew";
import { ListaHechizosHomebrew } from "./ListaHechizosHomebrew";
import { ListaObjetosHomebrew } from "./ListaObjetosHomebrew";
import { ListaInvocacionesHomebrew } from "./ListaInvocacionesHomebrew";

export interface ListaHomebrewProps {
  tipoHomebrew: "criatura" | "hechizo" | "objeto" | "invocacion";
  iniciarEdicionCriatura?: (m: MonstruoBase) => void;
  iniciarEdicionHechizo?: (h: HechizoBase) => void;
  iniciarEdicionObjeto?: (o: ObjetoHomebrew) => void;
  iniciarEdicionInvocacion?: (inv: PlantillaInvocacion) => void;
  iniciarPlantillaObjeto?: (o: ObjetoHomebrew) => void;
  cancelarEdicion?: () => void;
  idEnEdicion?: string | null;
  soloLectura?: boolean;
}

/**
 * ListaHomebrew: Orquestador modular del catálogo y compendio de creaciones (Monstruos, Hechizos, Objetos e Invocaciones PJ).
 * Delega en vistas especializadas de única responsabilidad cumpliendo los principios SOLID y Clean Architecture.
 */
export const ListaHomebrew: React.FC<ListaHomebrewProps> = ({
  tipoHomebrew,
  iniciarEdicionCriatura,
  iniciarEdicionHechizo,
  iniciarEdicionObjeto,
  iniciarEdicionInvocacion,
  iniciarPlantillaObjeto,
  cancelarEdicion,
  idEnEdicion,
  soloLectura = false
}) => {
  switch (tipoHomebrew) {
    case "criatura":
      return (
        <ListaMonstruosHomebrew
          iniciarEdicionCriatura={iniciarEdicionCriatura}
          iniciarEdicionHechizo={iniciarEdicionHechizo}
          cancelarEdicion={cancelarEdicion}
          idEnEdicion={idEnEdicion}
          soloLectura={soloLectura}
        />
      );

    case "hechizo":
      return (
        <ListaHechizosHomebrew
          iniciarEdicionHechizo={iniciarEdicionHechizo}
          cancelarEdicion={cancelarEdicion}
          idEnEdicion={idEnEdicion}
          soloLectura={soloLectura}
        />
      );

    case "objeto":
      return (
        <ListaObjetosHomebrew
          iniciarEdicionObjeto={iniciarEdicionObjeto}
          iniciarPlantillaObjeto={iniciarPlantillaObjeto}
          iniciarEdicionHechizo={iniciarEdicionHechizo}
          cancelarEdicion={cancelarEdicion}
          idEnEdicion={idEnEdicion}
          soloLectura={soloLectura}
        />
      );

    case "invocacion":
      return (
        <ListaInvocacionesHomebrew
          iniciarEdicionInvocacion={iniciarEdicionInvocacion}
          cancelarEdicion={cancelarEdicion}
          idEnEdicion={idEnEdicion}
          soloLectura={soloLectura}
        />
      );

    default:
      return null;
  }
};
