import React, { useMemo } from "react";
import { Sparkles } from "lucide-react";
import type { PersonajeJugador } from "@/tipos";
import { ALINEAMIENTOS_DND, obtenerRangoExperienciaPorNivel } from "@/constantes";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { SelectorSugerencias, type OpcionSugerencia } from "@/componentes/comunes/SelectorSugerencias";
import { obtenerCatalogoEspecies, obtenerSubespeciesDeEspecie } from "@/servicios/gestorEspecies";
import { SeccionMulticlase } from "./SeccionMulticlase";
import estilos from "./ConfiguracionPersonaje.module.css";

export interface PestanaIdentidadProps {
  form: PersonajeJugador;
  alActualizarCampo: <K extends keyof PersonajeJugador>(campo: K, valor: PersonajeJugador[K]) => void;
  alDetectarJugadorTaleSpire: () => void;
  alCambiarClaseNombre: (index: number, nuevoNombre: string) => void;
  alCambiarClaseSubclase: (index: number, nuevaSubclase: string) => void;
  alCambiarClaseNivel: (index: number, nuevoNivelStr: string) => void;
  alEliminarClase: (index: number) => void;
  alAgregarClase: () => void;
  alAplicarBuildSugerida: (index: number) => void;
  alCambiarNivelTotal: (nuevoNivelStr: string) => void;
  alCambiarExperiencia: (nuevaXpStr: string) => void;
  alCambiarEspecie?: (nuevaEspecie: string) => void;
  alCambiarSubespecie?: (nuevaSubespecie: string) => void;
}

/**
 * Pestaña de Identidad del personaje:
 * Nombre, jugador, clases y multiclase, nivel global/PX, especie, subespecie, trasfondo, alineación y avatar/miniatura.
 */
export const PestanaIdentidad: React.FC<PestanaIdentidadProps> = ({
  form,
  alActualizarCampo,
  alDetectarJugadorTaleSpire,
  alCambiarClaseNombre,
  alCambiarClaseSubclase,
  alCambiarClaseNivel,
  alEliminarClase,
  alAgregarClase,
  alAplicarBuildSugerida,
  alCambiarNivelTotal,
  alCambiarExperiencia,
  alCambiarEspecie,
  alCambiarSubespecie
}) => {
  const rangoXP = obtenerRangoExperienciaPorNivel(form.nivel || 1);
  const clasesActuales = form.clases && form.clases.length > 0
    ? form.clases
    : [{ nombre: form.clase || "Guerrero", subclase: form.subclase || "", nivel: form.nivel || 1 }];

  const opcionesEspecies = useMemo<OpcionSugerencia[]>(() => {
    return obtenerCatalogoEspecies().map((esp) => {
      const tamanoStr = esp.tamanoOpciones ? esp.tamanoOpciones.join("/") : esp.tamanoPorDefecto || "Mediano";
      const subtitulo = `${esp.tipoCriatura || "Humanoide"} • ${tamanoStr} • ${esp.velocidadBase} pies`;
      return {
        valor: esp.nombre,
        etiqueta: esp.nombre,
        subtitulo
      };
    });
  }, []);

  const opcionesSubespecies = useMemo<OpcionSugerencia[]>(() => {
    const subespecies = obtenerSubespeciesDeEspecie(form.especie);
    return subespecies.map((sub) => ({
      valor: sub.nombre,
      etiqueta: sub.nombre,
      subtitulo: sub.descripcion || undefined
    }));
  }, [form.especie]);

  const manejarEspecieChange = (nuevaEspecie: string) => {
    if (alCambiarEspecie) {
      alCambiarEspecie(nuevaEspecie);
    } else {
      alActualizarCampo("especie", nuevaEspecie);
    }
  };

  const manejarSubespecieChange = (nuevaSub: string) => {
    if (alCambiarSubespecie) {
      alCambiarSubespecie(nuevaSub);
    } else {
      alActualizarCampo("subespecie", nuevaSub);
    }
  };

  return (
    <>
      <div className={estilos.filaFormulario}>
        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Nombre del Personaje</label>
          <input
            type="text"
            className={estilos.inputFormulario}
            value={form.nombre}
            onChange={(e) => alActualizarCampo("nombre", e.target.value)}
            required
          />
        </div>

        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Nombre del Jugador</label>
          <div className={estilos.cajaDetectarJugador}>
            <input
              type="text"
              className={estilos.inputFormulario}
              value={form.jugador}
              onChange={(e) => alActualizarCampo("jugador", e.target.value)}
              placeholder="Ej. Nombre del Jugador"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className={estilos.botonDetectarJugador}
              onClick={alDetectarJugadorTaleSpire}
              title="Auto-detectar tu nombre desde TaleSpire"
            >
              <Sparkles size={13} />
              Detectar
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN MULTICLASE */}
      <SeccionMulticlase
        clases={clasesActuales}
        nivelGlobal={form.nivel || 1}
        alCambiarClaseNombre={alCambiarClaseNombre}
        alCambiarClaseSubclase={alCambiarClaseSubclase}
        alCambiarClaseNivel={alCambiarClaseNivel}
        alEliminarClase={alEliminarClase}
        alAgregarClase={alAgregarClase}
        alAplicarBuildSugerida={alAplicarBuildSugerida}
      />

      {/* FILA DE NIVEL GLOBAL Y EXPERIENCIA BIDIRECCIONAL */}
      <div className={estilos.filaFormulario}>
        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Nivel Global Total (1 - 20)</label>
          <input
            type="number"
            className={estilos.inputFormulario}
            value={form.nivel}
            onChange={(e) => alCambiarNivelTotal(e.target.value)}
            min="1"
            max="20"
            required
            style={{ fontWeight: 800, color: "#60a5fa" }}
          />
        </div>

        <div className={estilos.campoFormulario}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label className={estilos.labelFormulario} style={{ margin: 0 }}>
              Puntos de Experiencia (PX)
            </label>
            <span className={estilos.badgeRangoXP}>
              Rango Nv. {form.nivel}: {rangoXP.texto}
            </span>
          </div>
          <input
            type="number"
            className={estilos.inputFormulario}
            value={form.experiencia}
            onChange={(e) => alCambiarExperiencia(e.target.value)}
            min="0"
            style={{ fontWeight: 700 }}
          />
        </div>
      </div>

      {/* ESPECIE, SUBESPECIE, TRASFONDO Y ALINEACIÓN */}
      <div className={estilos.filaFormulario}>
        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Especie / Raza</label>
          <SelectorSugerencias
            valor={form.especie}
            alCambiar={manejarEspecieChange}
            opciones={opcionesEspecies}
            placeholder="Escribe o selecciona una especie..."
          />
        </div>

        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>
            {form.especie?.toLowerCase().includes("dracon")
              ? "Legado Dracónico"
              : form.especie?.toLowerCase().includes("tiefling")
              ? "Legado Infernal"
              : form.especie?.toLowerCase().includes("goliat")
              ? "Linaje Gigante"
              : form.especie?.toLowerCase().includes("gnomo")
              ? "Linaje Gnomo"
              : form.especie?.toLowerCase().includes("elfo")
              ? "Linaje Élfico"
              : "Subespecie / Legado / Linaje"}
          </label>
          <SelectorSugerencias
            valor={form.subespecie || ""}
            alCambiar={manejarSubespecieChange}
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
            onChange={(e) => alActualizarCampo("trasfondo", e.target.value)}
            placeholder="Ej. Soldado, Erudito..."
          />
        </div>

        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Alineamiento</label>
          <SelectorDesplegable
            valor={form.alineacion}
            alCambiar={(val) => alActualizarCampo("alineacion", val)}
            opciones={ALINEAMIENTOS_DND}
            tamano="normal"
          />
        </div>
      </div>

      <div className={estilos.filaFormulario}>
        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>Miniatura 3D en Tablero</label>
          <div
            className={`${estilos.indicadorMiniatura} ${
              form.idMiniaturaTS
                ? estilos.indicadorMiniaturaDetectada
                : estilos.indicadorMiniaturaAusente
            }`}
            title="Auto-detectada automáticamente si la miniatura en el tablero tiene el mismo nombre que tu personaje"
          >
            <span
              className={estilos.puntoMiniatura}
              style={{ backgroundColor: form.idMiniaturaTS ? "#10b981" : "#64748b" }}
            />
            {form.idMiniaturaTS ? "Auto-detectada en Tablero" : "Sin Miniatura en Tablero"}
          </div>
        </div>

        <div className={estilos.campoFormulario}>
          <label className={estilos.labelFormulario}>URL de Imagen de Avatar (Token)</label>
          <div className={estilos.avatarPreviewContenedor}>
            {form.avatarUrl ? (
              <img
                src={form.avatarUrl}
                alt="Vista previa"
                className={estilos.avatarImg}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : null}
            <input
              type="url"
              className={estilos.inputFormulario}
              value={form.avatarUrl || ""}
              onChange={(e) => alActualizarCampo("avatarUrl", e.target.value)}
              placeholder="https://ejemplo.com/retrato.png"
              style={{ flexGrow: 1 }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
