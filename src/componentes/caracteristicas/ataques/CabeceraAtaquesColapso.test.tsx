import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CabeceraAtaquesJugador } from "./CabeceraAtaquesJugador";

describe("CabeceraAtaquesJugador - Controles de Contraer y Expandir Todo", () => {
  it("renderiza correctamente los botones de Expandir y Contraer en la cabecera", () => {
    const fnColapsar = vi.fn();
    const fnExpandir = vi.fn();

    const html = renderToStaticMarkup(
      <CabeceraAtaquesJugador
        conteoTotal={5}
        conteoAccion={3}
        conteoAccionAdicional={1}
        conteoReaccion={1}
        conteoConsumibles={0}
        conteoActivables={0}
        filtro="todas"
        alCambiarFiltro={vi.fn()}
        statsCalculadas={null}
        alColapsarTodas={fnColapsar}
        alExpandirTodas={fnExpandir}
      />
    );

    // Debe contener el botón de Contraer con su título y texto
    expect(html).toContain("Contraer");
    expect(html).toContain("Contraer todas las secciones de combate");

    // Debe contener el botón de Expandir con su título y texto
    expect(html).toContain("Expandir");
    expect(html).toContain("Expandir todas las secciones de combate");
  });

  it("no renderiza el grupo de controles de colapso si no se proporcionan las funciones callback", () => {
    const html = renderToStaticMarkup(
      <CabeceraAtaquesJugador
        conteoTotal={5}
        conteoAccion={3}
        conteoAccionAdicional={1}
        conteoReaccion={1}
        conteoConsumibles={0}
        conteoActivables={0}
        filtro="todas"
        alCambiarFiltro={vi.fn()}
        statsCalculadas={null}
      />
    );

    expect(html).not.toContain("Contraer todas las secciones de combate");
    expect(html).not.toContain("Expandir todas las secciones de combate");
  });

});
