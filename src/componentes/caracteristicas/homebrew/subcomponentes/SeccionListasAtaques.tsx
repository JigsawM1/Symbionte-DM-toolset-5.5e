import React, { useRef } from "react";
import type { usarFormularioCriatura } from "@/hooks/usarFormularioCriatura";
import type { ParametrosExtraccionAtaque } from "@/utiles/procesadorAtaques";
import estilos from "../FormularioCriatura.module.css";
import { BloqueAtaquesRapidos } from "./BloqueAtaquesRapidos";
import { BloqueListaCriatura } from "./BloqueListaCriatura";

type SeccionListasAtaquesProps = Pick<ReturnType<typeof usarFormularioCriatura>,
  "monstruoForm" | "actualizarGeneral" | "listaRasgos" | "listaAcciones" |
  "listaAccionesAdicionales" | "listaReacciones" | "listaLegendarias" |
  "listaQuickActions" | "danyosExtraQA" | "agregarDanoExtraQA" |
  "actualizarDanoExtraQA" | "eliminarDanoExtraQA" | "agregarQuickAction" |
  "iniciarEditarQuickAction" | "cancelarEditarQuickAction" | "preRellenarAtaqueRapido"
>;

/**
 * Orquestador de las listas de combate y rasgos en el formulario de criaturas homebrew.
 */
export const SeccionListasAtaques: React.FC<SeccionListasAtaquesProps> = (props) => {
  const bloqueAtaquesRapidosRef = useRef<HTMLDivElement>(null);

  const manejarCopiarAAtaqueRapido = (accion: ParametrosExtraccionAtaque) => {
    props.preRellenarAtaqueRapido(accion);
    bloqueAtaquesRapidosRef.current?.scrollIntoView({ block: "start" });
  };

  return (
    <div className={estilos.seccionContenido}>
      <BloqueAtaquesRapidos
        contenedorRef={bloqueAtaquesRapidosRef}
        accionesRapidas={props.monstruoForm.accionesRapidas}
        editor={props.listaQuickActions}
        danyosExtraQA={props.danyosExtraQA}
        agregarDanoExtraQA={props.agregarDanoExtraQA}
        actualizarDanoExtraQA={props.actualizarDanoExtraQA}
        eliminarDanoExtraQA={props.eliminarDanoExtraQA}
        agregarQuickAction={props.agregarQuickAction}
        iniciarEditarQuickAction={props.iniciarEditarQuickAction}
        cancelarEditarQuickAction={props.cancelarEditarQuickAction}
      />

      <BloqueListaCriatura
        titulo="RASGOS Y HABILIDADES PASIVAS"
        tituloEditando="EDITANDO RASGO PASIVO"
        items={props.monstruoForm.rasgos || []}
        editor={props.listaRasgos}
        placeholderNombre="Nombre del rasgo"
        placeholderUso="Uso (ej. 3/día)"
        placeholderDescripcion="Descripción detallada del rasgo..."
        textoBotonAgregar="Agregar Rasgo"
        textoBotonGuardar="Guardar Cambios del Rasgo"
      />

      <BloqueListaCriatura
        titulo="ACCIONES Y ATAQUES PRINCIPALES"
        tituloEditando="EDITANDO ACCIÓN PRINCIPAL"
        items={props.monstruoForm.acciones || []}
        conCamposAtaque
        usarBotonNumerico
        editor={props.listaAcciones}
        placeholderNombre="Nombre de la acción"
        placeholderUso="Uso (ej. 1/día)"
        placeholderDescripcion="Descripción detallada de la acción o ataque..."
        textoBotonAgregar="Agregar Acción"
        textoBotonGuardar="Guardar Cambios de la Acción"
        alPreRellenarAtaqueRapido={manejarCopiarAAtaqueRapido}
      />

      <BloqueListaCriatura
        titulo="ACCIONES ADICIONALES (BONUS ACTIONS)"
        tituloEditando="EDITANDO ACCIÓN ADICIONAL"
        items={props.monstruoForm.accionesAdicionales || []}
        conCamposAtaque
        usarBotonNumerico
        editor={props.listaAccionesAdicionales}
        placeholderNombre="Nombre de la acción adicional"
        placeholderUso="Uso (ej. 1/día)"
        placeholderDescripcion="Descripción detallada de la acción adicional..."
        textoBotonAgregar="Agregar Acción Adicional"
        textoBotonGuardar="Guardar Acción Adicional"
        alPreRellenarAtaqueRapido={manejarCopiarAAtaqueRapido}
      />

      <BloqueListaCriatura
        titulo="REACCIONES"
        tituloEditando="EDITANDO REACCIÓN"
        items={props.monstruoForm.reacciones || []}
        editor={props.listaReacciones}
        placeholderNombre="Nombre de la reacción"
        placeholderUso="Uso (ej. 1/turno)"
        placeholderDescripcion="Descripción detallada de la reacción..."
        textoBotonAgregar="Agregar Reacción"
        textoBotonGuardar="Guardar Cambios de la Reacción"
      />

      <BloqueListaCriatura
        titulo="ACCIONES LEGENDARIAS"
        tituloEditando="EDITANDO ACCIÓN LEGENDARIA"
        items={props.monstruoForm.accionesLegendarias || []}
        editor={props.listaLegendarias}
        placeholderNombre="Nombre de la acción legendaria"
        placeholderUso="Costo (ej. 1 acción)"
        placeholderDescripcion="Descripción detallada de la acción legendaria..."
        textoBotonAgregar="Agregar Acción Legendaria"
        textoBotonGuardar="Guardar Cambios Legendaria"
        totalLegendarias={props.monstruoForm.accionesLegendariasTotal}
        alCambiarTotalLegendarias={(valor) => props.actualizarGeneral("accionesLegendariasTotal", valor)}
      />
    </div>
  );
};
