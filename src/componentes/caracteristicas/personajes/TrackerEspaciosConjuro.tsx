import React from "react";
import {
  TrackerRecursoMagico,
  GrupoRanurasMagicas
} from "./magia/TrackerRecursoMagico";

interface TrackerEspaciosConjuroProps {
  espaciosMaximos: Record<string, number>;
  espaciosGastados: Record<string, number>;
  alGastarEspacio?: (nivel: number) => void;
  alRecuperarEspacio?: (nivel: number) => void;
  soloLectura?: boolean;
}

export const TrackerEspaciosConjuro: React.FC<TrackerEspaciosConjuroProps> = ({
  espaciosMaximos,
  espaciosGastados,
  alGastarEspacio,
  alRecuperarEspacio,
  soloLectura = false
}) => {
  const nivelesDisponibles = Object.keys(espaciosMaximos)
    .map(Number)
    .filter((n) => n >= 1 && n <= 9 && (espaciosMaximos[String(n)] || 0) > 0)
    .sort((a, b) => a - b);

  if (nivelesDisponibles.length === 0) {
    return null;
  }

  const grupos: GrupoRanurasMagicas[] = nivelesDisponibles.map((nivel) => ({
    id: `espacio-nv-${nivel}`,
    etiqueta: `Nivel ${nivel}`,
    max: espaciosMaximos[String(nivel)] || 0,
    gastados: espaciosGastados[String(nivel)] || 0,
    alGastar: () => alGastarEspacio?.(nivel),
    alRecuperar: () => alRecuperarEspacio?.(nivel),
    colorTema: "var(--pj-texto-acento)"
  }));

  return (
    <TrackerRecursoMagico
      titulo="Espacios de Conjuro"
      iconoColor="var(--pj-texto-acento)"
      grupos={grupos}
      soloLectura={soloLectura}
      modoGrid={true}
    />
  );
};
