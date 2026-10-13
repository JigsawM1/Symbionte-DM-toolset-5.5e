import { useRef, type ButtonHTMLAttributes } from "react";
import { confirmarCamposNumericos } from "./confirmacionCamposNumericos";

/** Confirma la cantidad antes de ejecutar un botón que consume campos numéricos. */
export function BotonNumerico({ onClick, ambito, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { ambito?: string }) {
  const accion = useRef(onClick);
  accion.current = onClick;
  return <button {...props} onClick={evento => {
    const contenedor = ambito ? evento.currentTarget.closest<HTMLElement>(ambito) : evento.currentTarget.parentElement;
    if (contenedor && !confirmarCamposNumericos(contenedor)) return;
    accion.current?.(evento);
  }} />;
}
