import React from "react";
import { CheckSquare, Square } from "lucide-react";
import {
  GRUPOS_ARMAS,
  TODAS_ARMAS_SENCILLAS,
  TODAS_ARMAS_MARCIALES,
  ARMAS_DE_FUEGO,
  COMPETENCIAS_COMBATE_ESPECIALES
} from "@/constantes";
import { coincideBusquedaTolerante } from "@/utiles/busquedaTolerante";
import estilos from "./SelectorCompetencias.module.css";

interface PestanaArmasCompetenciasProps {
  armasGrupos: ("sencillas" | "marciales" | "fuego")[];
  armasLista: string[];
  filtroTexto: string;
  alternarGrupoArmas: (grupoId: "sencillas" | "marciales" | "fuego") => void;
  alternarArmaIndividual: (arma: string) => void;
}

export const PestanaArmasCompetencias: React.FC<PestanaArmasCompetenciasProps> = ({
  armasGrupos,
  armasLista,
  filtroTexto,
  alternarGrupoArmas,
  alternarArmaIndividual
}) => {
  const filtro = filtroTexto.trim().toLowerCase();

  return (
    <div className={estilos.contenedorPestana}>
      {/* Checkboxes maestros */}
      <div className={estilos.bloqueSeccion}>
        <span className={estilos.labelSeccion}>
          Grupos Maestros de Armas
        </span>
        <div className={estilos.grupoBotonesMaestros}>
          {GRUPOS_ARMAS.map((g) => {
            const check = armasGrupos.includes(g.id as ("sencillas" | "marciales" | "fuego"));
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => alternarGrupoArmas(g.id as ("sencillas" | "marciales" | "fuego"))}
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

      {/* Lista de Armas Individuales */}
      <div className={estilos.bloqueSeccion}>
        <span className={estilos.labelSeccion}>
          Armas Individuales ({armasLista.length} seleccionadas)
        </span>
        <div className={estilos.gridItemsCompetencias}>
          {[...COMPETENCIAS_COMBATE_ESPECIALES, ...TODAS_ARMAS_SENCILLAS, ...TODAS_ARMAS_MARCIALES, ...ARMAS_DE_FUEGO]
            .filter((a) => coincideBusquedaTolerante(a, filtro))
            .map((arma) => {
              const check = armasLista.includes(arma);
              return (
                <label
                  key={arma}
                  className={estilos.itemCompetenciaLabel}
                  data-check={check}
                >
                  <input
                    type="checkbox"
                    checked={check}
                    onChange={() => alternarArmaIndividual(arma)}
                  />
                  <span>{arma}</span>
                </label>
              );
            })}
        </div>
      </div>
    </div>
  );
};
