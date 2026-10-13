import { useRef, type FormHTMLAttributes } from "react";
import { confirmarCamposNumericos } from "./confirmacionCamposNumericos";

/** Confirma primero y consulta después el manejador actualizado, sin estados obsoletos. */
export function FormularioNumerico({ onSubmit, ambito, ...props }: FormHTMLAttributes<HTMLFormElement> & { ambito?: string }) {
  const guardar = useRef(onSubmit);
  guardar.current = onSubmit;
  return <form {...props} onSubmit={evento => {
    evento.preventDefault();
    const contenedor = ambito ? evento.currentTarget.closest<HTMLElement>(ambito) : evento.currentTarget;
    if (contenedor && confirmarCamposNumericos(contenedor)) guardar.current?.(evento);
  }} />;
}
