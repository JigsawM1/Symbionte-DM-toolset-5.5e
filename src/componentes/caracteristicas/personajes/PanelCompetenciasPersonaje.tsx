import React from "react";
import type { PersonajeJugador } from "@/tipos";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { Swords, Shield, Languages, Wrench } from "lucide-react";
import type { CategoriaCompetencia } from "./ModalSelectorCompetencias";
import estilos from "./AtributosPersonaje.module.css";

interface Props {
  personaje: PersonajeJugador;
  statsCalculadas: EstadisticasCalculadasPersonaje;
  alAbrirSelectorCompetencias: (categoria: CategoriaCompetencia) => void;
}

export const PanelCompetenciasPersonaje: React.FC<Props> = ({ personaje, statsCalculadas, alAbrirSelectorCompetencias }) => (
      <div className={estilos.panelCompetencias}>
        <span className={estilos.tituloPanelLateral}>Competencias</span>

        <div className={estilos.grupoCompetenciaItem}>
          <span className={estilos.tituloGrupoCompetencia}>
            <Swords size={11} color="var(--pj-texto-terciario)" /> Armas
          </span>
          <button
            type="button"
            className={estilos.cajaTextoCompetencia}
            onClick={() => alAbrirSelectorCompetencias("armas")}
            title={"Haz clic para editar competencias en Armas"}
          >
            {statsCalculadas?.competenciasEfectivas?.armasTexto || personaje.competenciasArmas || "Ninguna"}
          </button>
        </div>

        <div className={estilos.grupoCompetenciaItem}>
          <span className={estilos.tituloGrupoCompetencia}>
            <Shield size={11} color="var(--pj-texto-terciario)" /> Armaduras
          </span>
          <button
            type="button"
            className={estilos.cajaTextoCompetencia}
            onClick={() => alAbrirSelectorCompetencias("armaduras")}
            title={"Haz clic para editar competencias en Armaduras"}
          >
            {statsCalculadas?.competenciasEfectivas?.armadurasTexto || personaje.competenciasArmaduras || "Ninguna"}
          </button>
        </div>

        <div className={estilos.grupoCompetenciaItem}>
          <span className={estilos.tituloGrupoCompetencia}>
            <Languages size={11} color="var(--pj-texto-terciario)" /> Idiomas
          </span>
          <button
            type="button"
            className={estilos.cajaTextoCompetencia}
            onClick={() => alAbrirSelectorCompetencias("idiomas")}
            title={"Haz clic para editar Idiomas conocidos"}
          >
            {personaje.idiomas || "Común"}
          </button>
        </div>

        <div className={estilos.grupoCompetenciaItem}>
          <span className={estilos.tituloGrupoCompetencia}>
            <Wrench size={11} color="var(--pj-texto-terciario)" /> Herramientas
          </span>
          <button
            type="button"
            className={estilos.cajaTextoCompetencia}
            onClick={() => alAbrirSelectorCompetencias("herramientas")}
            title={"Haz clic para editar competencias en Herramientas"}
          >
            {statsCalculadas?.competenciasEfectivas?.herramientasTexto || personaje.herramientas || "Ninguna"}
          </button>
        </div>
      </div>
);
