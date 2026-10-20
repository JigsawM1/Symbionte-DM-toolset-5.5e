import React from "react";
import type { PersonajeJugador, Caracteristica, Habilidad, GradoCompetencia } from "@/tipos";
import { HABILIDADES_LISTA, CARACTERISTICAS_CLAVES } from "@/constantes";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import estilos from "../HojaPersonaje.module.css";

const OPCIONES_GRADO_HABILIDAD = [
  { valor: "ninguna", etiqueta: "Sin Bono (0x)" },
  { valor: "medio", etiqueta: "Medio Bono (0.5x PB)" },
  { valor: "competente", etiqueta: "Competente (1x PB)" },
  { valor: "pericia", etiqueta: "Pericia (2x PB)" }
];

interface PestanaCompetenciasEdicionProps {
  form: PersonajeJugador;
  alternarCompetenciaSalvacion: (carac: Caracteristica) => void;
  actualizarGradoHabilidad: (hab: Habilidad, grado: GradoCompetencia) => void;
  actualizarCampo: <K extends keyof PersonajeJugador>(campo: K, valor: PersonajeJugador[K]) => void;
}

export const PestanaCompetenciasEdicion: React.FC<PestanaCompetenciasEdicionProps> = ({
  form,
  alternarCompetenciaSalvacion,
  actualizarGradoHabilidad,
  actualizarCampo
}) => {
  return (
    <>
      {/* Salvaciones */}
      <div className={estilos.campoFormulario}>
        <label className={estilos.labelFormulario}>Competencias en Tiradas de Salvación</label>
        <div className={estilos.gridSalvacionesEdicion}>
          {CARACTERISTICAS_CLAVES.map(({ clave, etiqueta }) => {
            const carac = clave as Caracteristica;
            const checked = form.competenciasSalvacion?.[carac] || false;
            return (
              <label
                key={carac}
                className={`${estilos.neoPressed} ${estilos.labelCheckboxSalvacion}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => alternarCompetenciaSalvacion(carac)}
                />
                <span>{etiqueta}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Habilidades */}
      <div className={estilos.campoFormulario}>
        <label className={estilos.labelFormulario}>Grado de Competencia en Habilidades</label>
        <div className={estilos.gridHabilidadesEdicion}>
          {HABILIDADES_LISTA.map(({ clave, nombre }) => {
            const hab = clave as Habilidad;
            const grado = form.gradosHabilidades?.[hab] || "ninguna";

            return (
              <div key={hab} className={estilos.columnaHabilidadEdicion}>
                <span className={estilos.nombreHabilidadEdicion}>{nombre}</span>
                <SelectorDesplegable
                  valor={grado}
                  alCambiar={(val) => actualizarGradoHabilidad(hab, val as GradoCompetencia)}
                  opciones={OPCIONES_GRADO_HABILIDAD}
                  tamano="compacto"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Textos de Armas, Armaduras, Idiomas, Herramientas */}
      <div className={estilos.filaFormulario}>
        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Competencias con Armas</label>
          <input
            type="text"
            className={estilos.inputFormulario}
            value={form.competenciasArmas}
            onChange={(e) => actualizarCampo("competenciasArmas", e.target.value)}
            placeholder="Ej. Armas sencillas, espadas..."
          />
        </div>

        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Competencias con Armaduras</label>
          <input
            type="text"
            className={estilos.inputFormulario}
            value={form.competenciasArmaduras}
            onChange={(e) => actualizarCampo("competenciasArmaduras", e.target.value)}
            placeholder="Ej. Ligeras, medianas, escudos..."
          />
        </div>
      </div>

      <div className={estilos.filaFormulario}>
        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Idiomas Conocidos</label>
          <input
            type="text"
            className={estilos.inputFormulario}
            value={form.idiomas}
            onChange={(e) => actualizarCampo("idiomas", e.target.value)}
            placeholder="Ej. Común, Élfico..."
          />
        </div>

        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Herramientas e Instrumentos</label>
          <input
            type="text"
            className={estilos.inputFormulario}
            value={form.herramientas}
            onChange={(e) => actualizarCampo("herramientas", e.target.value)}
            placeholder="Ej. Herramientas de ladrón..."
          />
        </div>
      </div>
    </>
  );
};
