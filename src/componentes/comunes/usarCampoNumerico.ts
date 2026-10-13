import { useRef, useState } from "react";
import { evaluarCampoNumerico, type ReglasCampoNumerico } from "@/utiles/evaluadorCampoNumerico";

export interface OpcionesCampoNumerico extends ReglasCampoNumerico {
  value: number | string | null | undefined;
  alConfirmar: (valor: number) => void;
  alVaciar?: () => void;
  identidad?: string;
  valorBase?: number;
}

const textoValor = (valor: OpcionesCampoNumerico["value"]) =>
  valor === null || valor === undefined || valor === "" ? "" : String(valor);

/** El borrador se conserva separado del valor confirmado y de la sincronización. */
export function usarCampoNumerico(opciones: OpcionesCampoNumerico) {
  const actual = useRef(opciones);
  actual.current = opciones;
  const borrador = useRef({ texto: textoValor(opciones.value), modificado: false, identidad: opciones.identidad });
  const [, actualizar] = useState(0);
  if (borrador.current.identidad !== opciones.identidad) {
    borrador.current = { texto: textoValor(opciones.value), modificado: false, identidad: opciones.identidad };
  }
  if (!borrador.current.modificado) borrador.current.texto = textoValor(opciones.value);
  const base = () => {
    if (actual.current.valorBase !== undefined) return actual.current.valorBase;
    const valor = evaluarCampoNumerico(`=${textoValor(actual.current.value) || "0"}`, 0, { tipo: "decimal" });
    return valor.estado === "valido" ? valor.valor : 0;
  };
  const resolver = () => evaluarCampoNumerico(
    borrador.current.modificado || !borrador.current.texto ? borrador.current.texto : `=${borrador.current.texto}`,
    base(), actual.current
  );
  const cambiarTexto = (texto: string) => {
    borrador.current.texto = texto;
    borrador.current.modificado = true;
    actualizar(v => v + 1);
  };
  const cancelar = () => {
    borrador.current.texto = textoValor(actual.current.value);
    borrador.current.modificado = false;
    actualizar(v => v + 1);
  };
  const confirmar = () => {
    const resultado = resolver();
    if (resultado.estado === "invalido") return resultado;
    const modificado = borrador.current.modificado;
    borrador.current.modificado = false;
    if (resultado.estado === "valido") {
      borrador.current.texto = String(resultado.valor);
      if (modificado && (String(resultado.valor) !== textoValor(actual.current.value))) actual.current.alConfirmar(resultado.valor);
    } else if (actual.current.alVaciar && modificado) {
      borrador.current.texto = "";
      actual.current.alVaciar();
    } else borrador.current.texto = textoValor(actual.current.value);
    actualizar(v => v + 1);
    return resultado;
  };
  return { texto: borrador.current.texto, previsualizacion: resolver(), resolver, confirmar, cancelar, cambiarTexto };
}
