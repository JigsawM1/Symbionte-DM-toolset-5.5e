import { useEffect, useRef, type ReactNode, type KeyboardEvent } from "react";
import estilos from "./DialogoModal.module.css";
import { logger } from "@/utiles/logger";

interface DialogoModalProps {
  etiqueta: string;
  alCerrar: () => void;
  focoInicial?: "campo" | "cierre";
  className?: string;
  children: ReactNode;
}

/** La capa nativa aporta aislamiento, foco y apilado incluso en diálogos anidados. */
export function DialogoModal({ etiqueta, alCerrar, focoInicial = "cierre", className, children }: DialogoModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const cerrarRef = useRef(alCerrar);
  cerrarRef.current = alCerrar;

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    const origen = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    try {
      dialogo.showModal();
      const selector = focoInicial === "campo"
        ? 'input:not([type="hidden"]):not([type="file"]):not(:disabled), textarea:not(:disabled), select:not(:disabled)'
        : 'button[aria-label^="Cerrar"], button[title^="Cerrar"], button';
      dialogo.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
    } catch (error) {
      logger.error("No se pudo abrir el diálogo modal", error);
      cerrarRef.current();
    }
    return () => {
      dialogo.close();
      // Esperar al desmontaje evita interferir con la reapertura de StrictMode.
      queueMicrotask(() => {
        if (dialogo.isConnected && dialogo.open) return;
        if (origen?.isConnected && origen.getClientRects().length && !origen.closest('[inert], dialog:not([open])')) {
          origen.focus({ preventScroll: true });
          return;
        }
        const superiores = document.querySelectorAll<HTMLDialogElement>("dialog[open]");
        const destino = superiores.item(superiores.length - 1) || document.querySelector("main") || document.body;
        destino.querySelector<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')?.focus({ preventScroll: true });
      });
    };
  }, [focoInicial]);

  const mantenerTabulacion = (evento: KeyboardEvent<HTMLDialogElement>) => {
    if (evento.key !== "Tab" || evento.defaultPrevented || (evento.target as HTMLElement).closest("dialog") !== evento.currentTarget) return;
    const controles = Array.from(evento.currentTarget.querySelectorAll<HTMLElement>(
      'button, input, textarea, select, a[href], [tabindex]'
    )).filter(e => e.tabIndex >= 0 && !e.matches(':disabled, [hidden], input[type="hidden"]') && e.getClientRects().length);
    const destino = evento.shiftKey && document.activeElement === controles[0] ? controles.at(-1)
      : !evento.shiftKey && document.activeElement === controles.at(-1) ? controles[0] : undefined;
    // Chromium permite pasar del último control a la barra del navegador; cerrar el ciclo aquí.
    if (destino) { evento.preventDefault(); destino.focus(); }
  };

  return <dialog ref={ref} className={className || estilos.dialogo} aria-label={etiqueta} onClick={evento => evento.stopPropagation()}
    onKeyDown={mantenerTabulacion}
    onCancel={evento => { evento.preventDefault(); evento.stopPropagation(); cerrarRef.current(); }}>
    {children}
  </dialog>;
}
