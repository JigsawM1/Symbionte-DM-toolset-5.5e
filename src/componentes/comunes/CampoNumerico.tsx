import { forwardRef, useEffect, useId, useRef, useState, type InputHTMLAttributes, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { usarCampoNumerico, type OpcionesCampoNumerico } from "./usarCampoNumerico";
import { controlesNumericos } from "./confirmacionCamposNumericos";
import estilos from "./CampoNumerico.module.css";

export interface CampoNumericoProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "min" | "max">, Omit<OpcionesCampoNumerico, "min" | "max"> {
  min?: number | string;
  max?: number | string;
}

export const CampoNumerico = forwardRef<HTMLInputElement, CampoNumericoProps>(function CampoNumerico(props, ref) {
  const { value, valorBase, alConfirmar, alVaciar, identidad, tipo, min, max, step, required, onBlur, onKeyDown, title, ...atributos } = props;
  const campo = usarCampoNumerico({ value, valorBase, alConfirmar, alVaciar, identidad, tipo, min: min === undefined ? undefined : Number(min), max: max === undefined ? undefined : Number(max) });
  const entrada = useRef<HTMLInputElement | null>(null);
  const actuales = useRef({ campo, onBlur, onKeyDown });
  actuales.current = { campo, onBlur, onKeyDown };
  const [error, setError] = useState("");
  const idError = useId();
  useEffect(() => {
    setError("");
    entrada.current?.setCustomValidity("");
  }, [identidad]);
  useEffect(() => {
    const elemento = entrada.current;
    if (!elemento) return;
    controlesNumericos.set(elemento, {
      resolver: () => actuales.current.campo.resolver(),
      confirmar: () => actuales.current.campo.confirmar()
    });
    return () => { controlesNumericos.delete(elemento); };
  }, []);
  const confirmar = () => {
    if (entrada.current?.readOnly || entrada.current?.disabled) {
      flushSync(() => actuales.current.campo.cancelar());
      entrada.current?.setCustomValidity("");
      setError("");
      return true;
    }
    const resultado = actuales.current.campo.resolver();
    const mensaje = resultado.estado === "invalido" ? resultado.mensaje : "";
    entrada.current?.setCustomValidity(mensaje);
    setError(mensaje);
    if (mensaje) return false;
    // Los atajos y acciones posteriores leen los valores normalizados de este mismo evento.
    flushSync(() => actuales.current.campo.confirmar());
    return true;
  };
  const teclado = (evento: KeyboardEvent<HTMLInputElement>) => {
    if (atributos.readOnly || atributos.disabled) return;
    if (evento.key === "Escape") {
      evento.preventDefault();
      flushSync(() => actuales.current.campo.cancelar());
      setError("");
      evento.currentTarget.setCustomValidity("");
      evento.currentTarget.blur();
      return;
    }
    if (evento.key === "ArrowUp" || evento.key === "ArrowDown") {
      evento.preventDefault();
      const resultado = campo.resolver();
      if (resultado.estado === "invalido") { confirmar(); return; }
      const base = resultado.estado === "valido" ? resultado.valor : Number(value) || 0;
      const paso = step === "any" || step === undefined ? 1 : Number(step);
      campo.cambiarTexto(`=${base + (evento.key === "ArrowUp" ? paso : -paso)}`);
      confirmar();
      return;
    }
    if (evento.key === "Enter") {
      evento.preventDefault();
      if (!confirmar()) { evento.currentTarget.reportValidity(); return; }
      if (actuales.current.onKeyDown) actuales.current.onKeyDown(evento);
      else evento.currentTarget.blur();
      return;
    }
    actuales.current.onKeyDown?.(evento);
  };
  return <>
    <input {...atributos} type="text" inputMode={tipo === "decimal" ? "decimal" : "numeric"}
      ref={elemento => {
        entrada.current = elemento;
        if (typeof ref === "function") ref(elemento);
        else if (ref) ref.current = elemento;
      }}
      data-campo-numerico="true" aria-required={required || undefined}
      aria-invalid={error ? true : atributos["aria-invalid"]}
      aria-describedby={[atributos["aria-describedby"], error ? idError : ""].filter(Boolean).join(" ") || undefined}
      value={campo.texto} title={error || `${title ? `${title}. ` : ""}Número o cálculo; +5/-5 ajusta, =-5 establece un negativo.`}
      onChange={evento => {
        campo.cambiarTexto(evento.target.value);
        const resultado = campo.resolver();
        evento.currentTarget.setCustomValidity(resultado.estado === "invalido" ? resultado.mensaje : "");
        setError("");
      }}
      onBlur={evento => { if (confirmar()) actuales.current.onBlur?.(evento); }}
      onKeyDown={teclado} />
    {error && <span id={idError} role="alert" className={estilos.errorAccesible}>{error}</span>}
  </>;
});
