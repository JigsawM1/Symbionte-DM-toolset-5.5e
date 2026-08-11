import React, { useState } from "react";
import { BookOpen, Swords, Sparkles } from "lucide-react";
import { ListaHechizos } from "./ListaHechizos";
import { ListaHomebrew } from "./homebrew/ListaHomebrew";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import estilos from "./Compendio.module.css";

export const Compendio: React.FC = () => {
  const esGM = usarAlmacenDM((s) => s.esGM);
  const [subPestaña, setSubPestaña] = useState<"conjuros" | "bestiario" | "equipo">("conjuros");

  return (
    <div className={estilos.contenedorCompendio}>
      {/* Sub-Navegación del Compendio */}
      <div className={estilos.subNavegacion}>
        <button
          onClick={() => setSubPestaña("conjuros")}
          className={`${estilos.subBotonNav} ${
            subPestaña === "conjuros" ? estilos.subBotonNavActivo : ""
          }`}
          type="button"
        >
          <BookOpen size={14} />
          Conjuros (Spells)
        </button>

        {/* El Bestiario solo es visible para el Dungeon Master */}
        {esGM && (
          <button
            onClick={() => setSubPestaña("bestiario")}
            className={`${estilos.subBotonNav} ${
              subPestaña === "bestiario" ? estilos.subBotonNavActivo : ""
            }`}
            type="button"
          >
            <Swords size={14} />
            Bestiario (Criaturas)
          </button>
        )}

        <button
          onClick={() => setSubPestaña("equipo")}
          className={`${estilos.subBotonNav} ${
            subPestaña === "equipo" ? estilos.subBotonNavActivo : ""
          }`}
          type="button"
        >
          <Sparkles size={14} />
          Equipo y Objetos
        </button>
      </div>

      {/* Área principal según sub-pestaña activa */}
      <div className={estilos.areaContenido}>
        {subPestaña === "conjuros" && <ListaHechizos />}
        {subPestaña === "bestiario" && (
          <ListaHomebrew tipoHomebrew="criatura" soloLectura />
        )}
        {subPestaña === "equipo" && (
          <ListaHomebrew tipoHomebrew="objeto" soloLectura />
        )}
      </div>
    </div>
  );
};
