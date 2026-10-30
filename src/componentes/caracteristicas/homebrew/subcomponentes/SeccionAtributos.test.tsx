import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SeccionAtributos } from "./SeccionAtributos";
import { CARACTERISTICAS_CLAVES } from "@/constantes/homebrewConstantes";

describe("SeccionAtributos - Componente de Atributos Básicos y Tiradas de Salvación", () => {
  const monstruoFormBase = {
    caracteristicas: {
      fuerza: 16,
      destreza: 14,
      constitucion: 10,
      inteligencia: 8,
      sabiduria: 18,
      carisma: 1
    },
    salvaciones: {
      fuerza: 5,
      destreza: 4,
      inteligencia: -1,
      sabiduria: 6
    }
  };

  it("renderiza correctamente los encabezados de las mini secciones y la nota de ayuda", () => {
    const fnActualizarCaract = vi.fn();
    const fnActualizarSalv = vi.fn();

    const html = renderToStaticMarkup(
      <SeccionAtributos
        monstruoForm={monstruoFormBase}
        actualizarCaracteristica={fnActualizarCaract}
        actualizarSalvacion={fnActualizarSalv}
      />
    );

    expect(html).toContain("ATRIBUTOS BÁSICOS");
    expect(html).toContain("TIRADAS DE SALVACIÓN (Modificador Neto)");
    expect(html).toContain("Deja en blanco las salvaciones si la criatura no tiene un bonificador especial");
  });

  it("renderiza todas las etiquetas de las 6 características clave", () => {
    const html = renderToStaticMarkup(
      <SeccionAtributos
        monstruoForm={monstruoFormBase}
        actualizarCaracteristica={vi.fn()}
        actualizarSalvacion={vi.fn()}
      />
    );

    for (const { etiqueta } of CARACTERISTICAS_CLAVES) {
      expect(html).toContain(etiqueta);
    }
  });

  it("calcula y muestra correctamente los modificadores previsualizados (positivos, cero y negativos)", () => {
    const html = renderToStaticMarkup(
      <SeccionAtributos
        monstruoForm={{
          caracteristicas: {
            fuerza: 18,      // mod: +4
            destreza: 10,     // mod: +0
            constitucion: 8,  // mod: -1
            inteligencia: 1,  // mod: -5
            sabiduria: 20,    // mod: +5
            carisma: 15       // mod: +2
          }
        }}
        actualizarCaracteristica={vi.fn()}
        actualizarSalvacion={vi.fn()}
      />
    );

    expect(html).toContain("+4");
    expect(html).toContain("+0");
    expect(html).toContain("-1");
    expect(html).toContain("-5");
    expect(html).toContain("+5");
    expect(html).toContain("+2");
  });

  it("asigna el valor predeterminado 10 (modificador +0) si falta una característica en el objeto", () => {
    const html = renderToStaticMarkup(
      <SeccionAtributos
        monstruoForm={{
          caracteristicas: {
            fuerza: 14,
            destreza: 12
            // las demás faltan explícitamente
          } as unknown as typeof monstruoFormBase.caracteristicas
        }}
        actualizarCaracteristica={vi.fn()}
        actualizarSalvacion={vi.fn()}
      />
    );

    // Debe contener el modificador +0 de los valores caídos en fallback 10
    expect(html).toContain("+0");
  });

  it("renderiza los valores de salvaciones y usa placeholder '—'", () => {
    const html = renderToStaticMarkup(
      <SeccionAtributos
        monstruoForm={monstruoFormBase}
        actualizarCaracteristica={vi.fn()}
        actualizarSalvacion={vi.fn()}
      />
    );

    expect(html).toContain('placeholder="—"');
    expect(html).toContain('value="5"');
    expect(html).toContain('value="-1"');
  });

  it("soporta monstruoForm cuando el campo salvaciones no está definido (undefined)", () => {
    const html = renderToStaticMarkup(
      <SeccionAtributos
        monstruoForm={{
          caracteristicas: monstruoFormBase.caracteristicas,
          salvaciones: undefined
        }}
        actualizarCaracteristica={vi.fn()}
        actualizarSalvacion={vi.fn()}
      />
    );

    expect(html).toContain("TIRADAS DE SALVACIÓN (Modificador Neto)");
    expect(html).toContain('placeholder="—"');
  });

});
