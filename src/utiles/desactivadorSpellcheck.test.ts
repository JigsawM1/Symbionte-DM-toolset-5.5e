import { describe, it, expect, vi, afterEach } from "vitest";
import { inicializarDesactivadorSpellcheck } from "./desactivadorSpellcheck";

describe("desactivadorSpellcheck - Prevención global de corrector nativo", () => {
  it("no lanza error si se ejecuta en un entorno sin DOM (ej. Node.js o SSR)", () => {
    expect(() => inicializarDesactivadorSpellcheck()).not.toThrow();
  });

  describe("en entorno con DOM mockeado", () => {
    const originalDocument = globalThis.document;
    const originalMutationObserver = globalThis.MutationObserver;

    afterEach(() => {
      // Restaurar globales
      globalThis.document = originalDocument;
      globalThis.MutationObserver = originalMutationObserver;
    });

    it("desactiva spellcheck en campos existentes, contenteditable y al recibir focusin", () => {
      const inputs = [
        { spellcheck: true },
        { spellcheck: true }
      ];
      const oyentes: Record<string, (e: unknown) => void> = {};

      const mockObserve = vi.fn();
      const mockObserver = vi.fn().mockImplementation(() => ({
        observe: mockObserve,
        disconnect: vi.fn()
      }));

      // Clases para comprobación instanceof
      class MockHTMLElement {
        atributos: Record<string, string> = {};
        hasAttribute(nombre: string): boolean {
          return Boolean(this.atributos[nombre]);
        }
        setAttribute(nombre: string, valor: string): void {
          this.atributos[nombre] = valor;
        }
        getAttribute(nombre: string): string | undefined {
          return this.atributos[nombre];
        }
        getAttributeNames(): string[] {
          return Object.keys(this.atributos);
        }
      }
      class MockHTMLInputElement extends MockHTMLElement {
        spellcheck = true;
      }
      class MockHTMLTextAreaElement extends MockHTMLElement {
        spellcheck = true;
      }

      const mockBody = new MockHTMLElement();
      (mockBody as unknown as { querySelectorAll: unknown }).querySelectorAll = vi
        .fn()
        .mockReturnValue(inputs);

      // Inyectar en global mediante tipado seguro para pruebas
      const globalMock = globalThis as unknown as {
        HTMLElement: unknown;
        HTMLInputElement: unknown;
        HTMLTextAreaElement: unknown;
        MutationObserver: unknown;
        document: unknown;
      };

      globalMock.HTMLElement = MockHTMLElement;
      globalMock.HTMLInputElement = MockHTMLInputElement;
      globalMock.HTMLTextAreaElement = MockHTMLTextAreaElement;
      globalMock.MutationObserver = mockObserver;

      const mockDocument = {
        body: mockBody,
        addEventListener: vi.fn((evento: string, cb: (e: unknown) => void) => {
          oyentes[evento] = cb;
        })
      };

      globalMock.document = mockDocument;

      inicializarDesactivadorSpellcheck();

      // Verificar que los campos encontrados en el DOM tuvieron spellcheck desactivado
      inputs.forEach((campo) => {
        expect(campo.spellcheck).toBe(false);
      });

      // Verificar que se configuró el MutationObserver
      expect(mockObserve).toHaveBeenCalledTimes(1);

      // Simular focusin en un input
      const inputFoco = new MockHTMLInputElement();
      expect(inputFoco.spellcheck).toBe(true);
      oyentes["focusin"]?.({ target: inputFoco });
      expect(inputFoco.spellcheck).toBe(false);

      // Simular elemento contenteditable
      const editable = new MockHTMLElement();
      editable.setAttribute("contenteditable", "true");
      editable.setAttribute("spellcheck", "true");
      oyentes["focusin"]?.({ target: editable });
    });
  });
});
