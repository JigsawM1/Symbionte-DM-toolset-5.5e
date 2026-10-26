import { useState, useEffect, useRef } from "react";
import type { z } from "zod";
import { logger } from "@/utiles/logger";
import estilos from "../ConstructorRasgoDote.module.css";

/** Edita capacidades estructuradas conservando sus contratos y mostrando errores antes de guardar. */
export function EditorCapacidadJSON<T>({ etiqueta, valor, esquema, cambiar, plantillaInicial, ayuda }: {
  etiqueta: string; valor: T | undefined; esquema: z.ZodType<T>; cambiar: (valor: T | undefined) => void;
  plantillaInicial?: T; ayuda?: string;
}) {
  const plantillaRef = useRef(plantillaInicial);
  plantillaRef.current = plantillaInicial;
  const [texto, editar] = useState(() => JSON.stringify(valor ?? plantillaInicial ?? {}, null, 2));
  const [mensaje, informar] = useState("");

  useEffect(() => {
    editar(JSON.stringify(valor ?? plantillaRef.current ?? {}, null, 2));
  }, [valor]);
  return <details><summary>{etiqueta}</summary>
    {ayuda && <p>{ayuda}</p>}
    <label>{etiqueta}<textarea className={estilos.inputControl} aria-label={etiqueta} rows={8} value={texto} onChange={e => editar(e.target.value)} /></label>
    <button type="button" onClick={() => {
      try { cambiar(esquema.parse(JSON.parse(texto))); informar("Configuración aplicada."); }
      catch (error) { logger.warn("[EditorCapacidadJSON] Configuración inválida:", error); informar(error instanceof Error ? error.message : "Configuración inválida."); }
    }}>Aplicar configuración</button>
    <button type="button" onClick={() => { cambiar(undefined); informar("Configuración retirada."); }}>Retirar configuración</button>
    {mensaje && <p role="status">{mensaje}</p>}
  </details>;
}
