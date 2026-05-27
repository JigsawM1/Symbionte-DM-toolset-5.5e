import React from "react";
import { CARACTERISTICAS_CLAVES } from "../../../constantes/homebrewConstantes";
import { Salvaciones } from "../../../tipos";
import estilos from "../FormularioCriatura.module.css";

interface SeccionAtributosProps {
  monstruoForm: {
    caracteristicas: {
      fuerza: number;
      destreza: number;
      constitucion: number;
      inteligencia: number;
      sabiduria: number;
      carisma: number;
    };
    salvaciones?: Salvaciones;
  };
  actualizarCaracteristica: (caract: string, valor: number) => void;
  actualizarSalvacion: (caract: string, valor: string) => void;
}

export const SeccionAtributos: React.FC<SeccionAtributosProps> = ({
  monstruoForm,
  actualizarCaracteristica,
  actualizarSalvacion
}) => {
  return (
    <div className={estilos.seccionContenido}>
      <div className={estilos.cabeceraMiniSeccion}>ATRIBUTOS BÁSICOS</div>
      <div className={estilos.filaSeisForm}>
        {CARACTERISTICAS_CLAVES.map(({ clave, etiqueta }: { clave: string; etiqueta: string }) => {
          const valorCaract = monstruoForm.caracteristicas[clave as keyof typeof monstruoForm.caracteristicas] ?? 10;
          const modificador = Math.floor((valorCaract - 10) / 2);
          
          return (
            <div key={clave} className={estilos.campoMiniForm}>
              <label className={estilos.labelMiniForm}>{etiqueta}</label>
              <input
                type="number"
                value={valorCaract}
                onChange={(e) => actualizarCaracteristica(clave, parseInt(e.target.value, 10) || 10)}
                className={estilos.inputMiniForm}
                min={0}
                max={30}
              />
              <span className={estilos.modificadorPrevisualizado}>
                {modificador >= 0 ? "+" : ""}
                {modificador}
              </span>
            </div>
          );
        })}
      </div>

      <div className={estilos.cabeceraMiniSeccion}>TIRADAS DE SALVACIÓN (Modificador Neto)</div>
      <div className={estilos.filaSeisForm}>
        {CARACTERISTICAS_CLAVES.map(({ clave, etiqueta }: { clave: string; etiqueta: string }) => {
          const valorSalvacion = monstruoForm.salvaciones?.[clave as keyof Salvaciones] ?? "";
          
          return (
            <div key={`salv_${clave}`} className={estilos.campoMiniForm}>
              <label className={estilos.labelMiniForm}>{etiqueta}</label>
              <input
                type="number"
                value={valorSalvacion}
                onChange={(e) => actualizarSalvacion(clave, e.target.value)}
                placeholder="—"
                className={estilos.inputMiniForm}
              />
            </div>
          );
        })}
      </div>
      <div className={estilos.notaAyuda}>
        * Deja en blanco las salvaciones si la criatura no tiene un bonificador especial de salvación.
      </div>
    </div>
  );
};
