import React from "react";
import { CheckSquare, Square } from "lucide-react";
import {
  GRUPOS_ARMADURAS,
  ARMADURAS_LIGERAS,
  ARMADURAS_MEDIAS,
  ARMADURAS_PESADAS,
  ESCUDOS
} from "@/constantes";
import { coincideBusquedaTolerante } from "@/utiles/busquedaTolerante";
import estilos from "./SelectorCompetencias.module.css";

interface PestanaArmadurasCompetenciasProps {
  armadurasGrupos: ("ligeras" | "medias" | "pesadas" | "escudos")[];
  armadurasLista: string[];
  filtroTexto: string;
  alternarGrupoArmaduras: (grupoId: "ligeras" | "medias" | "pesadas" | "escudos") => void;
  alternarArmaduraIndividual: (armadura: string) => void;
}

export const PestanaArmadurasCompetencias: React.FC<PestanaArmadurasCompetenciasProps> = ({
  armadurasGrupos,
  armadurasLista,
  filtroTexto,
  alternarGrupoArmaduras,
  alternarArmaduraIndividual
}) => {
  const filtro = filtroTexto.trim().toLowerCase();

  return (
    <div className={estilos.contenedorPestana}>
      {/* Checkboxes maestros */}
      <div className={estilos.bloqueSeccion}>
        <span className={estilos.labelSeccion}>
          Categorías Maestras de Armadura
        </span>
        <div className={estilos.grupoBotonesMaestros}>
          {GRUPOS_ARMADURAS.map((g) => {
            const check = armadurasGrupos.includes(g.id as ("ligeras" | "medias" | "pesadas" | "escudos"));
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => alternarGrupoArmaduras(g.id as ("ligeras" | "medias" | "pesadas" | "escudos"))}
                className={estilos.botonGrupoMaestro}
                data-check={check}
              >
                {check ? <CheckSquare size={14} color="#93c5fd" /> : <Square size={14} color="#64748b" />}
                <span>{g.etiqueta}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Armaduras Individuales */}
      <div className={estilos.bloqueSeccion}>
        <span className={estilos.labelSeccion}>
          Armaduras y Escudos ({armadurasLista.length} seleccionadas)
        </span>
        <div className={`${estilos.gridItemsCompetencias} ${estilos.gridItemsCompetenciasArmaduras}`}>
          {[...ARMADURAS_LIGERAS, ...ARMADURAS_MEDIAS, ...ARMADURAS_PESADAS, ...ESCUDOS]
            .filter((a) => coincideBusquedaTolerante(a, filtro))
            .map((armadura) => {
              const check = armadurasLista.includes(armadura);
              return (
                <label
                  key={armadura}
                  className={estilos.itemCompetenciaLabel}
                  data-check={check}
                >
                  <input
                    type="checkbox"
                    checked={check}
                    onChange={() => alternarArmaduraIndividual(armadura)}
                  />
                  <span>{armadura}</span>
                </label>
              );
            })}
        </div>
      </div>
    </div>
  );
};
