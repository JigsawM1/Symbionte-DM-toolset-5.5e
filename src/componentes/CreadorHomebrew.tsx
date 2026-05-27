import React, { useState } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { MonstruoBase, HechizoBase, ObjetoHomebrew } from "../tipos";
import { MONSTRUOS_INICIALES, HECHIZOS_INICIALES } from "../utiles/datosIniciales";
import { Plus, Sparkles, BookOpen, Swords, Edit2 } from "lucide-react";
import { FormularioCriatura } from "./homebrew/FormularioCriatura";
import { FormularioHechizo } from "./homebrew/FormularioHechizo";
import { FormularioObjeto } from "./homebrew/FormularioObjeto";
import { ListaHomebrew } from "./homebrew/ListaHomebrew";
import estilos from "./CreadorHomebrew.module.css";

export const CreadorHomebrew: React.FC = () => {
  const baseDatosMonstruos = usarAlmacenDM((s) => s.baseDatosMonstruos);
  const baseDatosHechizos = usarAlmacenDM((s) => s.baseDatosHechizos);
  const objetosHomebrew = usarAlmacenDM((s) => s.objetosHomebrew);
  const modoHomebrew = usarAlmacenDM((s) => s.modoHomebrew);
  const establecerModoHomebrew = usarAlmacenDM((s) => s.establecerModoHomebrew);

  const [tipoHomebrew, setTipoHomebrew] = useState<"criatura" | "hechizo" | "objeto">("criatura");
  const [idEnEdicion, setIdEnEdicion] = useState<string | null>(null);

  const cancelarEdicion = () => {
    setIdEnEdicion(null);
    establecerModoHomebrew("lista");
  };

  const cambiarTipoHomebrew = (tipo: "criatura" | "hechizo" | "objeto") => {
    setTipoHomebrew(tipo);
    cancelarEdicion();
  };

  const alGuardarExitoso = () => {
    setIdEnEdicion(null);
    establecerModoHomebrew("lista");
  };

  const iniciarEdicionCriatura = (m: MonstruoBase) => {
    setIdEnEdicion(m.id);
    establecerModoHomebrew("crear");
  };

  const iniciarEdicionHechizo = (h: HechizoBase) => {
    setIdEnEdicion(h.id);
    establecerModoHomebrew("crear");
  };

  const iniciarEdicionObjeto = (o: ObjetoHomebrew) => {
    setIdEnEdicion(o.id);
    establecerModoHomebrew("crear");
  };

  // Filtrar creaciones homebrew por exclusión de datos por defecto de fábrica para el contador
  const idsInicialesMonstruos = new Set(MONSTRUOS_INICIALES.map((m) => m.id));
  const idsInicialesHechizos = new Set(HECHIZOS_INICIALES.map((h) => h.id));
  const monstruosHomebrew = baseDatosMonstruos.filter((m) => !idsInicialesMonstruos.has(m.id));
  const hechizosHomebrew = baseDatosHechizos.filter((h) => !idsInicialesHechizos.has(h.id));

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
          Objetos Mágicos ({objetosHomebrew.length})
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
              : objetosHomebrew.length}
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
            cancelarEdicion={cancelarEdicion}
            idEnEdicion={idEnEdicion}
          />
        )}
      </div>
    </div>
  );
};
