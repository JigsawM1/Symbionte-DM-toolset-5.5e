import React, { useEffect } from "react";
import { usarFormularioHechizo } from "@/hooks/usarFormularioHechizo";
import { usarEstadoHomebrew } from "@/almacen/selectores";
import { Plus } from "lucide-react";
import { CLASES_DND, Escuelas_Magia, TIPOS_DAÑO_DND } from "@/constantes/homebrewConstantes";
import { SelectorDesplegable } from "@/componentes/comunes";
import estilos from "./FormularioHechizo.module.css";

const OPCIONES_NIVEL_HECHIZO = [
  { valor: "0", etiqueta: "Truco (Cantrip)" },
  { valor: "1", etiqueta: "Nivel 1" },
  { valor: "2", etiqueta: "Nivel 2" },
  { valor: "3", etiqueta: "Nivel 3" },
  { valor: "4", etiqueta: "Nivel 4" },
  { valor: "5", etiqueta: "Nivel 5" },
  { valor: "6", etiqueta: "Nivel 6" },
  { valor: "7", etiqueta: "Nivel 7" },
  { valor: "8", etiqueta: "Nivel 8" },
  { valor: "9", etiqueta: "Nivel 9" }
];

const OPCIONES_SI_NO = [
  { valor: "No", etiqueta: "No" },
  { valor: "Sí", etiqueta: "Sí" }
];

const OPCIONES_ATAQUE_CD: Array<{ valor: "ATAQUE" | "CD" | "N/A"; etiqueta: string }> = [
  { valor: "N/A", etiqueta: "N/A" },
  { valor: "ATAQUE", etiqueta: "Ataque" },
  { valor: "CD", etiqueta: "CD (Dificultad)" }
];

const OPCIONES_SALVACION_ATTR = [
  { valor: "N/A", etiqueta: "N/A" },
  { valor: "Fuerza", etiqueta: "Fuerza (FUE)" },
  { valor: "Destreza", etiqueta: "Destreza (DES)" },
  { valor: "Constitución", etiqueta: "Constitución (CON)" },
  { valor: "Inteligencia", etiqueta: "Inteligencia (INT)" },
  { valor: "Sabiduría", etiqueta: "Sabiduría (SAB)" },
  { valor: "Carisma", etiqueta: "Carisma (CAR)" }
];

const OPCIONES_TIPO_DANO_HECHIZO = [
  { valor: "N/A", etiqueta: "N/A" },
  ...TIPOS_DAÑO_DND.map((t) => ({
    valor: t,
    etiqueta: t.charAt(0).toUpperCase() + t.slice(1)
  }))
];

interface Props {
  idEnEdicion: string | null;
  alGuardarExitoso: () => void;
  cancelarEdicion: () => void;
}

/** Calcula el número de filas necesarias para mostrar todo el texto sin scroll */
const calcFilas = (valor: string, minFilas = 2, maxFilas = 20): number => {
  if (!valor) return minFilas;
  const lineas = valor.split("\n").length;
  const porLongitud = Math.ceil(valor.length / 80);
  return Math.min(maxFilas, Math.max(minFilas, lineas, porLongitud));
};

export const FormularioHechizo: React.FC<Props> = ({
  idEnEdicion,
  alGuardarExitoso,
  cancelarEdicion
}) => {
  const { baseDatosHechizos } = usarEstadoHomebrew();

  const {
    hNombre,
    setHNombre,
    hNivel,
    setHNivel,
    hEscuela,
    setHEscuela,
    hTiempo,
    setHTiempo,
    hAlcance,
    setHAlcance,
    hDescripcion,
    setHDescripcion,
    hDescNivelSuperior,
    setHDescNivelSuperior,
    hMateriales,
    setHMateriales,
    hCompVerbal,
    setHCompVerbal,
    hCompSomatico,
    setHCompSomatico,
    hCompMaterial,
    setHCompMaterial,
    hRitual,
    setHRitual,
    hDuracion,
    setHDuracion,
    hConcentracion,
    setHConcentracion,
    hClases,
    setHClases,
    hAtaqueCd,
    setHAtaqueCd,
    hDadosDaño,
    setHDadosDaño,
    hDadosDañoNivelSuperior,
    setHDadosDañoNivelSuperior,
    hCdSalvacion,
    setHCdSalvacion,
    hAgregarModificador,
    setHAgregarModificador,
    hTipoDaño,
    setHTipoDaño,
    cargarHechizo,
    limpiarFormulario,
    manejarGuardarHechizo
  } = usarFormularioHechizo(idEnEdicion, alGuardarExitoso);

  // Sincronizar edición con la base de datos si cambia idEnEdicion
  useEffect(() => {
    if (idEnEdicion) {
      const hechizo = baseDatosHechizos.find((h) => h.id === idEnEdicion);
      if (hechizo) {
        cargarHechizo(hechizo);
      }
    } else {
      limpiarFormulario();
    }
  }, [idEnEdicion, baseDatosHechizos]);

  // Detener clics accidentales al lienzo 3D de TaleSpire
  const detenerPropagacion = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <form 
      onSubmit={manejarGuardarHechizo} 
      className={estilos.formularioBrutal}
      onMouseDown={detenerPropagacion}
      onMouseUp={detenerPropagacion}
    >
      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Nombre del Conjuro:</label>
          <input
            type="text"
            value={hNombre}
            onChange={(e) => setHNombre(e.target.value)}
            placeholder="Ej. Bola de Fuego"
            className={estilos.inputForm}
            required
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Nivel del Hechizo:</label>
          <SelectorDesplegable
            valor={String(hNivel)}
            alCambiar={(val) => setHNivel(parseInt(val, 10) || 0)}
            opciones={OPCIONES_NIVEL_HECHIZO}
            placeholder="Seleccionar nivel..."
          />
        </div>
      </div>

      <div className={estilos.filaTripleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Escuela:</label>
          <SelectorDesplegable
            valor={hEscuela}
            alCambiar={(val) => setHEscuela(val)}
            opciones={Escuelas_Magia}
            placeholder="Seleccionar escuela..."
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Tiempo Lanzamiento:</label>
          <input
            type="text"
            value={hTiempo}
            onChange={(e) => setHTiempo(e.target.value)}
            placeholder="1 acción"
            className={estilos.inputForm}
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Alcance:</label>
          <input
            type="text"
            value={hAlcance}
            onChange={(e) => setHAlcance(e.target.value)}
            placeholder="150 pies"
            className={estilos.inputForm}
          />
        </div>
      </div>

      <div className={estilos.filaTripleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Duración:</label>
          <input
            type="text"
            value={hDuracion}
            onChange={(e) => setHDuracion(e.target.value)}
            placeholder="Instantáneo"
            className={estilos.inputForm}
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Concentración:</label>
          <SelectorDesplegable
            valor={hConcentracion}
            alCambiar={(val) => setHConcentracion(val)}
            opciones={OPCIONES_SI_NO}
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Ritual:</label>
          <SelectorDesplegable
            valor={hRitual}
            alCambiar={(val) => setHRitual(val)}
            opciones={OPCIONES_SI_NO}
          />
        </div>
      </div>

      {/* COMPONENTES DE CONJURO */}
      <div className={estilos.bloqueDinamicoForm}>
        <div className={estilos.tituloBloqueDinamico}>COMPONENTES DE CONJURO</div>
        <div className={estilos.filaCheckboxes}>
          <label className={estilos.labelCheckbox}>
            <input
              type="checkbox"
              checked={hCompVerbal}
              onChange={(e) => setHCompVerbal(e.target.checked)}
              className={estilos.checkMini}
            />
            <span>Verbal (V)</span>
          </label>
          <label className={estilos.labelCheckbox}>
            <input
              type="checkbox"
              checked={hCompSomatico}
              onChange={(e) => setHCompSomatico(e.target.checked)}
              className={estilos.checkMini}
            />
            <span>Somático (S)</span>
          </label>
          <label className={estilos.labelCheckbox}>
            <input
              type="checkbox"
              checked={hCompMaterial}
              onChange={(e) => setHCompMaterial(e.target.checked)}
              className={estilos.checkMini}
            />
            <span>Material (M)</span>
          </label>
        </div>
        {hCompMaterial && (
          <div className={estilos.campoForm}>
            <label className={estilos.labelForm}>Materiales Detallados:</label>
            <input
              type="text"
              value={hMateriales}
              onChange={(e) => setHMateriales(e.target.value)}
              placeholder="Ej. una pizca de azufre y guano de murciélago"
              className={estilos.inputForm}
            />
          </div>
        )}
      </div>

      {/* CLASES QUE LO APRENDEN */}
      <div className={estilos.bloqueDinamicoForm}>
        <div className={estilos.tituloBloqueDinamico}>CLASES DISPONIBLES</div>
        <div className={estilos.gridClasesDnd}>
          {CLASES_DND.map((clase) => {
            const estaSeleccionada = hClases.includes(clase);
            return (
              <label key={clase} className={estilos.labelCheckbox}>
                <input
                  type="checkbox"
                  checked={estaSeleccionada}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setHClases((prev) => [...prev, clase]);
                    } else {
                      setHClases((prev) => prev.filter((c) => c !== clase));
                    }
                  }}
                  className={estilos.checkMini}
                />
                <span>{clase}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* MECÁNICAS DE COMBATE */}
      <div className={estilos.bloqueDinamicoForm} style={{ borderColor: "rgba(0,245,212,0.25)" }}>
        <div className={estilos.tituloBloqueDinamico} style={{ color: "var(--color-borde-cian)" }}>
          MECÁNICAS DE COMBATE
        </div>

        <div className={estilos.filaDobleForm}>
          <div className={estilos.campoForm}>
            <label className={estilos.labelForm}>Ataque o CD:</label>
            <SelectorDesplegable
              valor={hAtaqueCd}
              alCambiar={(val) => setHAtaqueCd(val)}
              opciones={OPCIONES_ATAQUE_CD}
            />
          </div>
          <div className={estilos.campoForm}>
            <label className={estilos.labelForm}>CD de Salvación (Atributo):</label>
            <SelectorDesplegable
              valor={hCdSalvacion}
              alCambiar={(val) => setHCdSalvacion(val)}
              opciones={OPCIONES_SALVACION_ATTR}
            />
          </div>
        </div>

        <div className={estilos.filaDobleForm}>
          <div className={estilos.campoForm}>
            <label className={estilos.labelForm}>Dados de Daño:</label>
            <input
              type="text"
              value={hDadosDaño}
              onChange={(e) => setHDadosDaño(e.target.value)}
              placeholder="Ej. 8d6"
              className={estilos.inputForm}
            />
          </div>
          <div className={estilos.campoForm}>
            <label className={estilos.labelForm}>Dados Daño Nivel Superior:</label>
            <input
              type="text"
              value={hDadosDañoNivelSuperior}
              onChange={(e) => setHDadosDañoNivelSuperior(e.target.value)}
              placeholder="Ej. 1d6"
              className={estilos.inputForm}
            />
          </div>
        </div>

        <div className={estilos.filaDobleForm}>
          <div className={estilos.campoForm}>
            <label className={estilos.labelForm}>Tipo de Daño:</label>
            <SelectorDesplegable
              valor={hTipoDaño}
              alCambiar={(val) => setHTipoDaño(val)}
              opciones={OPCIONES_TIPO_DANO_HECHIZO}
            />
          </div>
          <div className={estilos.campoForm}>
            <label className={estilos.labelForm}>Sumar Mod. Habilidad al Daño:</label>
            <SelectorDesplegable
              valor={hAgregarModificador}
              alCambiar={(val) => setHAgregarModificador(val)}
              opciones={OPCIONES_SI_NO}
            />
          </div>
        </div>
      </div>

      <div className={estilos.campoForm}>
        <label className={estilos.labelForm}>Descripción / Efectos:</label>
        <textarea
          value={hDescripcion}
          onChange={(e) => setHDescripcion(e.target.value)}
          placeholder="Escribe la descripción del conjuro..."
          className={estilos.textareaBrutal}
          rows={calcFilas(hDescripcion, 5, 25)}
          required
        />
      </div>

      <div className={estilos.campoForm}>
        <label className={estilos.labelForm}>A Niveles Superiores (Descripción Opcional):</label>
        <textarea
          value={hDescNivelSuperior}
          onChange={(e) => setHDescNivelSuperior(e.target.value)}
          placeholder="Ej. Cuando lanzas este hechizo usando un espacio de conjuro de nivel 4 o superior, el daño aumenta en 1d6 por cada nivel..."
          className={estilos.textareaBrutal}
          rows={calcFilas(hDescNivelSuperior, 3, 12)}
        />
      </div>

      {/* STICKY BOTTOM BAR (Barra de Acción Flotante) */}
      <div 
        className={estilos.stickyBottomBar}
        onMouseDown={detenerPropagacion}
        onMouseUp={detenerPropagacion}
      >
        {idEnEdicion && (
          <button 
            type="button" 
            onClick={cancelarEdicion} 
            className={estilos.botonStickyCancelar}
          >
            Cancelar
          </button>
        )}
        <button 
          type="submit" 
          className={estilos.botonStickyGuardar}
          disabled={!hNombre.trim()}
        >
          <Plus size={14} />
          {idEnEdicion ? "Guardar Cambios" : "Guardar en Compendio"}
        </button>
      </div>
    </form>
  );
};
