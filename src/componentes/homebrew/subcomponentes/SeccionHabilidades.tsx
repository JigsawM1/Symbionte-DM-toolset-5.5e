import React from "react";
import { HABILIDADES_LISTA } from "../../../constantes/homebrewConstantes";
import { Habilidades } from "../../../tipos";
import estilos from "../FormularioCriatura.module.css";

interface SeccionHabilidadesProps {
  monstruoForm: {
    habilidades?: Habilidades;
  };
  actualizarHabilidad: (hab: string, valor: string) => void;
}

export const SeccionHabilidades: React.FC<SeccionHabilidadesProps> = ({
  monstruoForm,
  actualizarHabilidad
}) => {
  return (
    <div className={estilos.seccionContenido}>
      <div className={estilos.cabeceraMiniSeccion}>MODIFICADORES DE HABILIDADES (Pericias)</div>
      <div className={estilos.gridHabilidades}>
        {HABILIDADES_LISTA.map(({ clave, nombre }: { clave: string; nombre: string }) => {
          const valorHabilidad = monstruoForm.habilidades?.[clave as keyof Habilidades] ?? "";
          
          return (
            <div key={clave} className={estilos.itemHabilidadFila}>
              <span className={estilos.habilidadNombreEtiqueta}>{nombre}:</span>
              <input
                type="number"
                value={valorHabilidad}
                onChange={(e) => actualizarHabilidad(clave, e.target.value)}
                placeholder="—"
                className={estilos.inputHabilidad}
              />
            </div>
          );
        })}
      </div>
      <div className={estilos.notaAyuda}>
        * Rellena únicamente las habilidades en las que el monstruo esté entrenado o posea bonificadores.
      </div>
    </div>
  );
};
