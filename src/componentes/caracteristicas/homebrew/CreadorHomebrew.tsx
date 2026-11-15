import React, { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { SliceConfiguracion } from "@/almacen/slices/sliceConfiguracion";
import {
  usarAccionesHomebrew,
} from "@/almacen/selectores";
import { ObjetoHomebrew } from "@/tipos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import {
  IDS_INICIALES_MONSTRUOS,
  IDS_INICIALES_HECHIZOS,
  IDS_INICIALES_OBJETOS
} from "@/utiles/datosIniciales";
import { Plus, Sparkles, BookOpen, Swords, List, Ghost, Pencil } from "lucide-react";
import { FormularioCriatura } from "./FormularioCriatura";
import { FormularioHechizo } from "./FormularioHechizo";
import { FormularioObjeto } from "./FormularioObjeto";
import { FormularioInvocacion } from "./FormularioInvocacion";
import { ListaHomebrew } from "./ListaHomebrew";
import estilos from "./CreadorHomebrew.module.css";

type TipoHomebrew = SliceConfiguracion["tipoHomebrewActivo"];

const categorias = {
  criatura: { nombre: "Criaturas", singular: "criatura", Icono: Swords },
  hechizo: { nombre: "Hechizos", singular: "hechizo", Icono: BookOpen },
  objeto: { nombre: "Objetos", singular: "objeto mágico", Icono: Sparkles },
  invocacion: { nombre: "Invocaciones PJ", singular: "invocación PJ", Icono: Ghost }
};
const tipos: TipoHomebrew[] = ["criatura", "hechizo", "objeto", "invocacion"];

export const CreadorHomebrew: React.FC = () => {
  const {
    modoHomebrew, tipoHomebrewActivo: tipoHomebrew, monstruos, hechizos, objetos, invocaciones
  } = usarAlmacenDM(useShallow(s => ({
    modoHomebrew: s.modoHomebrew,
    tipoHomebrewActivo: s.tipoHomebrewActivo,
    monstruos: s.baseDatosMonstruos,
    hechizos: s.baseDatosHechizos,
    objetos: s.objetosHomebrew,
    invocaciones: s.baseDatosInvocaciones.length
  })));
  const cantidades = useMemo(() => ({
    criatura: monstruos.filter(m => !IDS_INICIALES_MONSTRUOS.has(m.id)).length,
    hechizo: hechizos.filter(h => !IDS_INICIALES_HECHIZOS.has(h.id)).length,
    objeto: objetos.filter(o => !IDS_INICIALES_OBJETOS.has(o.id)).length,
    invocacion: invocaciones
  }), [monstruos, hechizos, objetos, invocaciones]);
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

  const cambiarTipoHomebrew = (tipo: TipoHomebrew) => {
    if (tipo === tipoHomebrew) return;
    establecerTipoHomebrew(tipo);
    cancelarEdicion();
  };

  const iniciarEdicion = (elemento: { id: string }) => {
    setIdEnEdicion(elemento.id);
    setObjetoPlantilla(null);
    establecerModoHomebrew("crear");
  };

  const iniciarPlantillaObjeto = (o: ObjetoHomebrew) => {
    setIdEnEdicion(null);
    setObjetoPlantilla(o);
    establecerTipoHomebrew("objeto");
    establecerModoHomebrew("crear");
  };

  const categoria = categorias[tipoHomebrew];
  const titulo = modoHomebrew === "lista"
    ? categoria.nombre
    : `${idEnEdicion ? "Editar" : "Crear"} ${categoria.singular}`;
  const formularioConPie = tipoHomebrew === "criatura" || tipoHomebrew === "invocacion";

  return (
    <div className={estilos.contenedorHomebrew}>
      <nav className={estilos.subNavegacion} aria-label="Categorías Homebrew">
        {tipos.map(tipo => {
          const { nombre, Icono } = categorias[tipo];
          return (
            <button
              key={tipo}
              type="button"
              aria-pressed={tipoHomebrew === tipo}
              onClick={() => cambiarTipoHomebrew(tipo)}
              className={estilos.subBotonNav}
            >
              <Icono size={16} aria-hidden="true" />
              <span>{nombre}</span>
              <span className={estilos.contador}>{cantidades[tipo]}</span>
            </button>
          );
        })}
      </nav>

      <header className={estilos.cabecera}>
        <h1 className={estilos.titulo}>{titulo}</h1>
        <div className={estilos.pestanasModoHomebrew} role="group" aria-label="Modo Homebrew">
          <button
            type="button"
            aria-pressed={modoHomebrew === "lista"}
            onClick={() => establecerModoHomebrew("lista")}
            className={estilos.botonModoHomebrew}
          >
            <List size={15} aria-hidden="true" /> Listado
          </button>
          <button
            type="button"
            aria-pressed={modoHomebrew === "crear"}
            onClick={() => establecerModoHomebrew("crear")}
            className={estilos.botonModoHomebrew}
          >
            {idEnEdicion ? <Pencil size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
            {idEnEdicion ? "Edición" : "Crear"}
          </button>
        </div>
      </header>

      <div className={estilos.cuerpoSeccion}>
        {modoHomebrew === "crear" && (
          <div className={`${estilos.panelFormulario} ${formularioConPie ? estilos.panelConPie : "u-scroll-cef"}`}>
            {tipoHomebrew === "criatura" && (
              <FormularioCriatura
                key={idEnEdicion ?? "nueva"}
                idEnEdicion={idEnEdicion}
                alGuardarExitoso={cancelarEdicion}
                cancelarEdicion={cancelarEdicion}
              />
            )}

            {tipoHomebrew === "hechizo" && (
              <FormularioHechizo
                idEnEdicion={idEnEdicion}
                alGuardarExitoso={cancelarEdicion}
                cancelarEdicion={cancelarEdicion}
              />
            )}

            {tipoHomebrew === "objeto" && (
              <FormularioObjeto
                idEnEdicion={idEnEdicion}
                objetoPlantilla={objetoPlantilla}
                alGuardarExitoso={cancelarEdicion}
                cancelarEdicion={cancelarEdicion}
              />
            )}

            {tipoHomebrew === "invocacion" && (
              <FormularioInvocacion
                key={idEnEdicion ?? "nueva"}
                idEnEdicion={idEnEdicion}
                alGuardarExitoso={cancelarEdicion}
                cancelarEdicion={cancelarEdicion}
              />
            )}
          </div>
        )}

        {modoHomebrew === "lista" && (
          <ListaHomebrew
            tipoHomebrew={tipoHomebrew}
            iniciarEdicionCriatura={iniciarEdicion}
            iniciarEdicionHechizo={iniciarEdicion}
            iniciarEdicionObjeto={iniciarEdicion}
            iniciarEdicionInvocacion={iniciarEdicion}
            iniciarPlantillaObjeto={iniciarPlantillaObjeto}
            cancelarEdicion={cancelarEdicion}
            idEnEdicion={idEnEdicion}
          />
        )}
      </div>
    </div>
  );
};
