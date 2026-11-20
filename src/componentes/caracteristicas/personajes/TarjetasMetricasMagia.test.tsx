import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TarjetasMetricasMagia, type TarjetasMetricasMagiaProps } from "./TarjetasMetricasMagia";

describe("TarjetasMetricasMagia - Etiquetas compactas", () => {
  const propsBase: Omit<TarjetasMetricasMagiaProps, "modelo"> = {
    conteoConjurosLibres: 3,
    conteoConjurosSubclase: 1,
    maxConjuros: 6,
    conteoTrucosLibres: 2,
    conteoTrucosSubclase: 0,
    maxTrucos: 3
  };

  it("muestra los conteos sin los subtextos 'PREPARADOS (LIBRES)' ni 'CONOCIDOS'", () => {
    const html = renderToStaticMarkup(
      <TarjetasMetricasMagia {...propsBase} modelo="grimorio" />
    );

    expect(html).toContain("CONJUROS");
    expect(html).toContain("3 / 6");
    expect(html).toContain("+1 Subclase");
    expect(html).toContain("TRUCOS");
    expect(html).toContain("2 / 3");
    expect(html).not.toContain("PREPARADOS (LIBRES)");
    expect(html).not.toContain("CONOCIDOS");
  });
});
