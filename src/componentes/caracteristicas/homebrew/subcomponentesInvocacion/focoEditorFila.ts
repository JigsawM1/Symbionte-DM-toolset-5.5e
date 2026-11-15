export function enfocarEditorFila(origen: HTMLElement, indice: number | null = null) {
  const bloque = origen.closest("[data-editor-fila]");
  const botonFila = indice === null
    ? null
    : bloque?.querySelector<HTMLButtonElement>(`[data-editar-fila="${indice}"]`);
  (botonFila ?? bloque?.querySelector<HTMLInputElement>("[data-campo-inicial]"))?.focus();
}
