import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TarjetasMetricasMagia, type TarjetasMetricasMagiaProps } from "./TarjetasMetricasMagia";

describe("TarjetasMetricasMagia - Etiquetas de modelo de conjuros", () => {
  const propsBase: Omit<TarjetasMetricasMagiaProps, "modelo"> = {
    conteoConjurosLibres: 3,
    conteoConjurosSubclase: 1,
    maxConjuros: 6,
    conteoTrucosLibres: 2,
    conteoTrucosSubclase: 0,
    maxTrucos: 3
  };

  it("muestra 'PREPARADOS (LIBRES)' cuando el modelo es 'grimorio'", () => {
    const html = renderToStaticMarkup(
      <TarjetasMetricasMagia {...propsBase} modelo="grimorio" />
    );

    expect(html).toContain("PREPARADOS (LIBRES)");
    expect(html).not.toContain("CONOCIDOS (LIBRES)");
  });

  it("muestra 'PREPARADOS (LIBRES)' cuando el modelo es 'preparados'", () => {
    const html = renderToStaticMarkup(
      <TarjetasMetricasMagia {...propsBase} modelo="preparados" />
    );

    expect(html).toContain("PREPARADOS (LIBRES)");
    expect(html).not.toContain("CONOCIDOS (LIBRES)");
  });

  it("muestra 'CONOCIDOS (LIBRES)' cuando el modelo es 'conocidos'", () => {
    const html = renderToStaticMarkup(
      <TarjetasMetricasMagia {...propsBase} modelo="conocidos" />
    );

    expect(html).toContain("CONOCIDOS (LIBRES)");
    expect(html).not.toContain("PREPARADOS (LIBRES)");
  });
});
