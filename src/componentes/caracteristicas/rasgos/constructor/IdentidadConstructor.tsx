import type { OrigenRasgo, TipoAccionRasgo } from "@/tipos";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { Shield } from "lucide-react";
import estilos from "../ConstructorRasgoDote.module.css";
import { OPCIONES_ORIGEN, OPCIONES_TIPO_ACCION, OPCIONES_CATEGORIA_MECANICA } from "./constantesConstructor";
import type { BorradorRasgo } from "@/servicios/rasgos/borradorRasgo";
import type { ActualizarBorradorRasgo } from "./usarConstructorRasgo";
interface Props {
    borrador: Pick<BorradorRasgo, 
      | "nombre"
      | "descripcion"
      | "origen"
      | "fuente"
      | "tipoAccion"
      | "nivelRequerido"
      | "notas"
      | "categoriaMecanica">;
    actualizarBorrador: ActualizarBorradorRasgo;
    errores: Record<string, string>;
}
export function IdentidadConstructor({ borrador, actualizarBorrador, errores }: Props) {
    const { nombre, descripcion, origen, fuente, tipoAccion, nivelRequerido, notas, categoriaMecanica } = borrador;
    return (<div className={estilos.seccionCard}>
        <div className={estilos.cabeceraSeccion}>
          <div className={estilos.tituloSeccion}>
            <Shield size={14} color="#38bdf8"/>
            <span>1. Identidad y Clasificación</span>
          </div>
          <p className={estilos.descripcionSeccion}>Define el nombre, categoría y tiempo de acción del rasgo</p>
        </div>

        <div className={estilos.gridDosColumnas}>
          <div className={estilos.campoGrupo}>
            <label className={estilos.labelCampo}>
              <span>Nombre del Rasgo o Dote *</span>
            </label>
            <input
              type="text"
              className={estilos.inputControl}
              placeholder="ej. Furia Divina, Maestro en Armas..."
              value={nombre}
              aria-label="Nombre del Rasgo o Dote"
              aria-invalid={Boolean(errores.nombre)}
              aria-describedby={errores.nombre ? "error-rasgo-nombre" : undefined}
              onChange={(e) => actualizarBorrador("nombre", e.target.value)}
              required
            />
          </div>

          <div className={estilos.campoGrupo}>
            <label className={estilos.labelCampo}>
              <span>Origen / Categoría</span>
            </label>
            <SelectorDesplegable<OrigenRasgo>
              valor={origen}
              opciones={OPCIONES_ORIGEN}
              alCambiar={(val) => actualizarBorrador("origen", val)}
              tamano="normal"
            />
          </div>
        </div>

        <div className={estilos.gridTresColumnas}>
          <div className={estilos.campoGrupo}>
            <label className={estilos.labelCampo}>
              <span>Tipo de Acción</span>
            </label>
            <SelectorDesplegable<TipoAccionRasgo>
              valor={tipoAccion}
              opciones={OPCIONES_TIPO_ACCION}
              alCambiar={(val) => actualizarBorrador("tipoAccion", val)}
              tamano="normal"
            />
          </div>

          <div className={estilos.campoGrupo}>
            <label className={estilos.labelCampo}>
              <span>Fuente o Libro</span>
            </label>
            <input
              type="text"
              className={estilos.inputControl}
              placeholder="ej. Homebrew, PHB 2024..."
              value={fuente}
              onChange={(e) => actualizarBorrador("fuente", e.target.value)}
            />
          </div>

          <div className={estilos.campoGrupo}>
            <label className={estilos.labelCampo}>
              <span>Nivel Requerido</span>
            </label>
            <input
              type="number"
              min={1}
              max={20}
              className={estilos.inputControl}
              placeholder="Opcional (1-20)"
              value={nivelRequerido ?? ""}
              aria-label="Nivel Requerido"
              aria-invalid={Boolean(errores.nivelRequerido)}
              aria-describedby={errores.nivelRequerido ? "error-rasgo-nivelRequerido" : undefined}
              onChange={(e) => actualizarBorrador("nivelRequerido", e.target.value ? parseInt(e.target.value, 10) : undefined)}
            />
          </div>
        </div>

        <div className={`${estilos.campoGrupo} ${estilos.margenTop4}`}>
          <label className={estilos.labelCampo}>
            <span>Categoría Mecánica Canónica</span>
          </label>
          <SelectorDesplegable<BorradorRasgo["categoriaMecanica"]>
            valor={categoriaMecanica}
            opciones={OPCIONES_CATEGORIA_MECANICA}
            alCambiar={(val) => actualizarBorrador("categoriaMecanica", val)}
            tamano="normal"
          />
          <p className={estilos.pistaCampo}>
            Determina cómo clasifica la ficha y el combate este rasgo (consumible con usos, activable táctico, pasivo permanente, etc.).
          </p>
        </div>

        <div className={estilos.campoGrupo}>
          <label className={estilos.labelCampo}>
            <span>Descripción Completa de las Reglas</span>
          </label>
          <textarea
            className={estilos.textareaControl}
            placeholder="Escribe aquí las reglas, condiciones, beneficios y funcionamiento detallado..."
            rows={3}
            value={descripcion}
            onChange={(e) => actualizarBorrador("descripcion", e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className={estilos.campoGrupo}>
          <label className={estilos.labelCampo}>
            <span>Notas Privadas o Referencia</span>
          </label>
          <textarea
            className={estilos.textareaControl}
            placeholder="Anotaciones personales para la mesa de juego..."
            rows={2}
            value={notas}
            onChange={(e) => actualizarBorrador("notas", e.target.value)}
            spellCheck={false}
          />
        </div>
      </div>);
}
