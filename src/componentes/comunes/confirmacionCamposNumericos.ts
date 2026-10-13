import { flushSync } from "react-dom";
import type { ResultadoCampoNumerico } from "@/utiles/evaluadorCampoNumerico";

interface ControlNumerico {
  resolver: () => ResultadoCampoNumerico;
  confirmar: () => ResultadoCampoNumerico;
}

export const controlesNumericos = new WeakMap<HTMLInputElement, ControlNumerico>();

/** Resuelve todos los borradores antes de construir el envío del formulario. */
export function confirmarCamposNumericos(ambito: HTMLElement): boolean {
  const entradas = Array.from(ambito.querySelectorAll<HTMLInputElement>("input[data-campo-numerico]"));
  for (const entrada of entradas) {
    if (entrada.disabled || entrada.readOnly) continue;
    const resultado = controlesNumericos.get(entrada)?.resolver();
    if (resultado?.estado === "invalido") {
      entrada.setCustomValidity(resultado.mensaje);
      entrada.reportValidity();
      entrada.focus();
      return false;
    }
  }
  for (const entrada of entradas) {
    // Un máximo confirmado puede cambiar las reglas de la casilla siguiente.
    if (!entrada.disabled && !entrada.readOnly) flushSync(() => controlesNumericos.get(entrada)?.confirmar());
  }
  return true;
}
