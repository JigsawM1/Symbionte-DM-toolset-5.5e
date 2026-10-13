import React from "react";
import {
  TrackerRecursoMagico,
  GrupoRanurasMagicas
} from "./magia/TrackerRecursoMagico";

interface TrackerEspaciosPactoProps {
  espaciosPactoMaximos: number;
  espaciosPactoGastados: number;
  nivelEspacioPacto: number;
  alGastarEspacioPacto?: () => void;
  alRecuperarEspaciosPacto?: () => void;
  mostrarBotonRecuperar?: boolean;
  soloLectura?: boolean;
}

export const TrackerEspaciosPacto: React.FC<TrackerEspaciosPactoProps> = ({
  espaciosPactoMaximos,
  espaciosPactoGastados,
  nivelEspacioPacto,
  alGastarEspacioPacto,
  alRecuperarEspaciosPacto,
  mostrarBotonRecuperar = false,
  soloLectura = false
}) => {
  if (espaciosPactoMaximos <= 0) {
    return null;
  }

  const grupos: GrupoRanurasMagicas[] = [
    {
      id: "pacto-slots",
      etiqueta: "Ranuras de Pacto",
      badge: `NIVEL ${nivelEspacioPacto}`,
      max: espaciosPactoMaximos,
      gastados: espaciosPactoGastados,
      alGastar: alGastarEspacioPacto,
      alRecuperar: alRecuperarEspaciosPacto,
      colorTema: "var(--pj-texto-magia)",
      colorTemaFondo: "var(--pj-acento-magia-solido)"
    }
  ];

  return (
    <TrackerRecursoMagico
      titulo="Magia de Pacto"
      iconoColor="var(--pj-texto-magia)"
      grupos={grupos}
      alRestablecerTodos={alRecuperarEspaciosPacto}
      etiquetaRestablecer="Descanso Corto"
      mostrarBotonRestablecer={mostrarBotonRecuperar}
      soloLectura={soloLectura}
      modoGrid={false}
      colorBordeContenedor="var(--pj-borde-magia)"
      pieDePagina={`Ranuras fijas de nivel ${nivelEspacioPacto} • Recuperación en descanso corto`}
    />
  );
};
