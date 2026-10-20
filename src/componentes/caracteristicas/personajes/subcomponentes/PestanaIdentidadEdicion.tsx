import React from "react";
import type { PersonajeJugador } from "@/tipos";
import { CLASES_DND, ALINEAMIENTOS_DND } from "@/constantes";
import { obtenerSubclasesDeClase } from "@/servicios/gestorClases";
import { obtenerEtiquetaSubespecie } from "@/servicios/gestorEspecies";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { SelectorSugerencias, type OpcionSugerencia } from "@/componentes/comunes/SelectorSugerencias";
import estilos from "../HojaPersonaje.module.css";

interface PestanaIdentidadEdicionProps {
  form: PersonajeJugador;
  opcionesEspecies: OpcionSugerencia[];
  opcionesSubespecies: OpcionSugerencia[];
  actualizarCampo: <K extends keyof PersonajeJugador>(campo: K, valor: PersonajeJugador[K]) => void;
  manejarCambioClase: (nuevaClase: string) => void;
  manejarCambioNivel: (nuevoNivelStr: string) => void;
  alCambiarEspecie: (nuevaEsp: string) => void;
}

export const PestanaIdentidadEdicion: React.FC<PestanaIdentidadEdicionProps> = ({
  form,
  opcionesEspecies,
  opcionesSubespecies,
  actualizarCampo,
  manejarCambioClase,
  manejarCambioNivel,
  alCambiarEspecie
}) => {
  return (
    <>
      <div className={estilos.filaFormulario}>
        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Nombre del Personaje</label>
          <input
            type="text"
            className={estilos.inputFormulario}
            value={form.nombre}
            onChange={(e) => actualizarCampo("nombre", e.target.value)}
            required
          />
        </div>

        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Nombre del Jugador</label>
          <input
            type="text"
            className={estilos.inputFormulario}
            value={form.jugador}
            onChange={(e) => actualizarCampo("jugador", e.target.value)}
            placeholder="Ej. Juan Pérez"
          />
        </div>
      </div>

      <div className={estilos.filaFormulario}>
        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Clase (Sugerencia o Personalizada)</label>
          <SelectorSugerencias
            valor={form.clase}
            alCambiar={manejarCambioClase}
            opciones={CLASES_DND}
            placeholder="Escribe o selecciona una clase..."
          />
        </div>

        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Subclase</label>
          <SelectorSugerencias
            valor={form.subclase}
            alCambiar={(nuevaSub) => actualizarCampo("subclase", nuevaSub)}
            opciones={obtenerSubclasesDeClase(form.clase).map((s) => s.nombre)}
            placeholder="Elegir o escribir subclase..."
          />
        </div>
      </div>

      <div className={estilos.filaFormulario}>
        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Nivel (1 - 20)</label>
          <CampoNumerico
            className={estilos.inputFormulario}
            value={form.nivel}
            alConfirmar={(valor) => manejarCambioNivel(String(valor))}
            min="1"
            max="20"
            required
            identidad={form.id}
          />
        </div>

        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Puntos de Experiencia (PX)</label>
          <CampoNumerico
            className={estilos.inputFormulario}
            value={form.experiencia}
            alConfirmar={(valor) => actualizarCampo("experiencia", valor)}
            min="0"
            identidad={form.id}
          />
        </div>
      </div>

      <div className={estilos.filaFormulario}>
        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Especie / Raza</label>
          <SelectorSugerencias
            valor={form.especie}
            alCambiar={alCambiarEspecie}
            opciones={opcionesEspecies}
            placeholder="Escribe o selecciona una especie..."
          />
        </div>

        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>
            {obtenerEtiquetaSubespecie(form.especie)}
          </label>
          <SelectorSugerencias
            valor={form.subespecie || ""}
            alCambiar={(nuevaSub) => actualizarCampo("subespecie", nuevaSub)}
            opciones={opcionesSubespecies}
            placeholder={
              opcionesSubespecies.length > 0
                ? "Elegir subraza, legado o linaje..."
                : "Sin subespecies oficiales (escribe personalizada)..."
            }
          />
        </div>
      </div>

      <div className={estilos.filaFormulario}>
        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Trasfondo</label>
          <input
            type="text"
            className={estilos.inputFormulario}
            value={form.trasfondo}
            onChange={(e) => actualizarCampo("trasfondo", e.target.value)}
            placeholder="Ej. Soldado, Erudito..."
          />
        </div>

        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Alineamiento</label>
          <SelectorDesplegable
            valor={form.alineacion}
            alCambiar={(val) => actualizarCampo("alineacion", val)}
            opciones={ALINEAMIENTOS_DND}
            tamano="normal"
          />
        </div>
      </div>

      <div className={estilos.filaFormulario}>
        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Miniatura 3D en Tablero</label>
          <div
            className={estilos.indicadorMiniaturaTablero}
            data-detectada={form.idMiniaturaTS ? "true" : "false"}
            title="Auto-detectada automáticamente si la miniatura en el tablero tiene el mismo nombre que tu personaje"
          >
            <span
              className={estilos.puntoMiniaturaTablero}
              data-detectada={form.idMiniaturaTS ? "true" : "false"}
            />
            {form.idMiniaturaTS ? "Auto-detectada en Tablero" : "Sin Miniatura en Tablero"}
          </div>
        </div>
      </div>

      <div className={estilos.campoFormulario}>
        <label className={estilos.labelFormulario}>URL de Imagen de Avatar (Ilustración / Token)</label>
        <div className={estilos.filaAvatarEdicion}>
          {form.avatarUrl ? (
            <img
              src={form.avatarUrl}
              alt="Vista previa"
              className={estilos.avatarEdicionImg}
              onError={(e) => {
                (e.target as HTMLImageElement).classList.add(estilos.inputArchivoOculto);
              }}
            />
          ) : null}
          <input
            type="url"
            className={`${estilos.inputFormulario} ${estilos.inputAvatarEdicion}`}
            value={form.avatarUrl || ""}
            onChange={(e) => actualizarCampo("avatarUrl", e.target.value)}
            placeholder="https://ejemplo.com/retrato-mi-personaje.png"
          />
        </div>
      </div>
    </>
  );
};
