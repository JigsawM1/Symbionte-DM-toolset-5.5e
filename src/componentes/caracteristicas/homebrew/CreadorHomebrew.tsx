import React, { useState } from "react";
import {
  usarEstadoHomebrew,
  usarAccionesHomebrew,
} from "@/almacen/selectores";
import { MonstruoBase, HechizoBase, ObjetoHomebrew } from "@/tipos";
import { IDS_INICIALES_MONSTRUOS, IDS_INICIALES_HECHIZOS, IDS_INICIALES_OBJETOS } from "@/utiles/datosIniciales";
import { Plus, Sparkles, BookOpen, Swords, Edit2 } from "lucide-react";
import { FormularioCriatura } from "./FormularioCriatura";
import { FormularioHechizo } from "./FormularioHechizo";
import { FormularioObjeto } from "./FormularioObjeto";
import { ListaHomebrew } from "./ListaHomebrew";
import estilos from "./CreadorHomebrew.module.css";

export const CreadorHomebrew: React.FC = () => {
  const {
    baseDatosMonstruos,
    baseDatosHechizos,
    objetosHomebrew,
    modoHomebrew,
    tipoHomebrewActivo: tipoHomebrew,
  } = usarEstadoHomebrew();
  const {
    establecerModoHomebrew,
    establecerTipoHomebrew,
  } = usarAccionesHomebrew();
  const [idEnEdicion, setIdEnEdicion] = useState<string | null>(null);
  const [objetoPlantilla, setObjetoPlantilla] = useState<ObjetoHomebrew | null>(null);

  const cancelarEdicion = () => {
    setIdEnEdicion(null);
    setObjetoPlantilla(null);
    establecerModoHomebrew("lista");
  };

  const cambiarTipoHomebrew = (tipo: "criatura" | "hechizo" | "objeto") => {
    establecerTipoHomebrew(tipo);
    cancelarEdicion();
  };

  const alGuardarExitoso = () => {
    setIdEnEdicion(null);
    setObjetoPlantilla(null);
    establecerModoHomebrew("lista");
  };

  const iniciarEdicionCriatura = (m: MonstruoBase) => {
    setIdEnEdicion(m.id);
    setObjetoPlantilla(null);
    establecerModoHomebrew("crear");
  };

  const iniciarEdicionHechizo = (h: HechizoBase) => {
    setIdEnEdicion(h.id);
    setObjetoPlantilla(null);
    establecerModoHomebrew("crear");
  };

  const iniciarEdicionObjeto = (o: ObjetoHomebrew) => {
    setIdEnEdicion(o.id);
    setObjetoPlantilla(null);
    establecerModoHomebrew("crear");
  };

  const iniciarPlantillaObjeto = (o: ObjetoHomebrew) => {
    setIdEnEdicion(null);
    setObjetoPlantilla(o);
    establecerTipoHomebrew("objeto");
    establecerModoHomebrew("crear");
  };

  // Filtrar creaciones homebrew por exclusión de datos por defecto de fábrica para el contador
  const monstruosHomebrew = baseDatosMonstruos.filter((m) => !IDS_INICIALES_MONSTRUOS.has(m.id));
  const hechizosHomebrew = baseDatosHechizos.filter((h) => !IDS_INICIALES_HECHIZOS.has(h.id));
  const objetosHomebrewSolo = objetosHomebrew.filter((o) => !IDS_INICIALES_OBJETOS.has(o.id));

  return (
    <div className={estilos.contenedorHomebrew}>
      {/* Selector de sub-sección homebrew principal */}
      <div className={estilos.subNavegacion}>
        <button
          onClick={() => cambiarTipoHomebrew("criatura")}
          className={`${estilos.subBotonNav} ${tipoHomebrew === "criatura" ? estilos.subBotonNavActivo : ""}`}
          type="button"
        >
          <Swords size={14} />
          Criaturas Homebrew ({monstruosHomebrew.length})
        </button>

        <button
          onClick={() => cambiarTipoHomebrew("hechizo")}
          className={`${estilos.subBotonNav} ${tipoHomebrew === "hechizo" ? estilos.subBotonNavActivo : ""}`}
          type="button"
        >
          <BookOpen size={14} />
          Hechizos Homebrew ({hechizosHomebrew.length})
        </button>

        <button
          onClick={() => cambiarTipoHomebrew("objeto")}
          className={`${estilos.subBotonNav} ${tipoHomebrew === "objeto" ? estilos.subBotonNavActivo : ""}`}
          type="button"
        >
          <Sparkles size={14} />
          Objetos Mágicos ({objetosHomebrewSolo.length})
        </button>
      </div>

      {/* Selector de Modo Homebrew (Pestañas Crear / Listado) */}
      <div className={estilos.pestanasModoHomebrew}>
        <button
          type="button"
          onClick={() => establecerModoHomebrew("crear")}
          className={`${estilos.botonModoHomebrew} ${modoHomebrew === "crear" ? estilos.botonModoHomebrewActivo : ""}`}
        >
          <Plus size={13} />
          <span>{idEnEdicion ? "Modo Edición" : "Crear Nuevo"}</span>
        </button>
        <button
          type="button"
          onClick={() => establecerModoHomebrew("lista")}
          className={`${estilos.botonModoHomebrew} ${modoHomebrew === "lista" ? estilos.botonModoHomebrewActivo : ""}`}
        >
          <Edit2 size={13} />
          <span>
            Ver / Editar Existentes (
            {tipoHomebrew === "criatura"
              ? monstruosHomebrew.length
              : tipoHomebrew === "hechizo"
              ? hechizosHomebrew.length
              : objetosHomebrewSolo.length}
            )
          </span>
        </button>
      </div>

      {/* Grid de Creación: Formulario a la izquierda | Lista a la derecha */}
      <div className={estilos.cuerpoSeccion}>
        {/* FORMULARIOS */}
        {modoHomebrew === "crear" && (
          <div className={estilos.panelFormulario}>
            <div className={estilos.cabeceraPanel}>
              {idEnEdicion ? `EDITANDO CONTENIDO (ID: ${idEnEdicion})` : "CREAR CONTENIDO NUEVO"}
            </div>

            {tipoHomebrew === "criatura" && (
              <FormularioCriatura
                idEnEdicion={idEnEdicion}
                alGuardarExitoso={alGuardarExitoso}
                cancelarEdicion={cancelarEdicion}
              />
            )}

            {tipoHomebrew === "hechizo" && (
              <FormularioHechizo
                idEnEdicion={idEnEdicion}
                alGuardarExitoso={alGuardarExitoso}
                cancelarEdicion={cancelarEdicion}
              />
            )}

            {tipoHomebrew === "objeto" && (
              <FormularioObjeto
                idEnEdicion={idEnEdicion}
                objetoPlantilla={objetoPlantilla}
                alGuardarExitoso={alGuardarExitoso}
                cancelarEdicion={cancelarEdicion}
              />
            )}
          </div>
        )}

        {/* LISTADOS DE ELEMENTOS CREADOS (PERSISTIDOS) */}
        {modoHomebrew === "lista" && (
          <ListaHomebrew
            tipoHomebrew={tipoHomebrew}
            iniciarEdicionCriatura={iniciarEdicionCriatura}
            iniciarEdicionHechizo={iniciarEdicionHechizo}
            iniciarEdicionObjeto={iniciarEdicionObjeto}
            iniciarPlantillaObjeto={iniciarPlantillaObjeto}
            cancelarEdicion={cancelarEdicion}
            idEnEdicion={idEnEdicion}
          />
        )}
      </div>
    </div>
  );
};
