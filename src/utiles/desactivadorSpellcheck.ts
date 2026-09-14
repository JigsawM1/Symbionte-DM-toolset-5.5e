/**
 * Módulo de Utilidad para Desactivar Spellcheck
 *
 * Desactiva de forma preventiva y global la corrección ortográfica nativa (spellcheck)
 * en todos los campos editables (<input>, <textarea>, [contenteditable]).
 *
 * Motivo: En entornos embebidos como TaleSpire (CEF) o navegadores con diccionario
 * en inglés por defecto, los textos de D&D en español se subrayan masivamente en rojo
 * como falsos positivos ortográficos.
 */

export function inicializarDesactivadorSpellcheck(): void {
  if (typeof document === 'undefined') return;

  const desactivarEnElemento = (elemento: Element): void => {
    if (elemento instanceof HTMLInputElement || elemento instanceof HTMLTextAreaElement) {
      elemento.spellcheck = false;
    } else if (typeof elemento.hasAttribute === 'function' && elemento.hasAttribute('contenteditable')) {
      if (typeof elemento.setAttribute === 'function') {
        elemento.setAttribute('spellcheck', 'false');
      }
    }
  };

  const procesarSubarbol = (nodo: Node): void => {
    if (nodo instanceof HTMLElement) {
      desactivarEnElemento(nodo);
      const campos = nodo.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        'input, textarea, [contenteditable="true"]'
      );
      campos.forEach((campo) => {
        campo.spellcheck = false;
      });
    }
  };

  // 1. Desactivar en elementos existentes al momento de inicializar
  if (document.body) {
    procesarSubarbol(document.body);

    // 2. Observar dinámicamente nuevos elementos insertados (modales, portales, formularios)
    const observador = new MutationObserver((mutaciones) => {
      for (const mutacion of mutaciones) {
        mutacion.addedNodes.forEach(procesarSubarbol);
      }
    });

    observador.observe(document.body, { childList: true, subtree: true });
  }

  // 3. Capturar el evento de foco como red de seguridad ante cualquier interacción
  document.addEventListener(
    'focusin',
    (evento: FocusEvent) => {
      const objetivo = evento.target;
      if (objetivo instanceof HTMLInputElement || objetivo instanceof HTMLTextAreaElement) {
        objetivo.spellcheck = false;
      }
    },
    true
  );
}
