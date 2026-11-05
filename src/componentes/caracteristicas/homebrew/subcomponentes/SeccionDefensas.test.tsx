import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SeccionDefensas } from "./SeccionDefensas";
import { TIPOS_DAÑO_DND, CONDICIONES_DND } from "@/constantes/homebrewConstantes";

describe("SeccionDefensas", () => {
  const monstruoFormMock = {
    vulnerabilidades: ["fuego", "ácido"],
    resistencias: ["frío"],
    inmunidadesDaño: ["veneno"],
    inmunidadesCondicion: ["envenenado", "asustado"]
  };

  describe("Renderizado Estático y Marcado HTML", () => {
    it("renderiza los botones de navegación con los contadores correctos", () => {
      const html = renderToStaticMarkup(
        <SeccionDefensas
          monstruoForm={monstruoFormMock}
          subDefensas="inmunidades"
          setSubDefensas={vi.fn()}
          alternarCheckArray={vi.fn()}
        />
      );

      expect(html).toContain("Inm. Daño (1)");
      expect(html).toContain("Res. Daño (1)");
      expect(html).toContain("Vuln. Daño (2)");
      expect(html).toContain("Inm. Condic (2)");
    });

    it("maneja monstruoForm con arrays indefinidos mostrando contador 0", () => {
      const html = renderToStaticMarkup(
        <SeccionDefensas
          monstruoForm={{}}
          subDefensas="inmunidades"
          setSubDefensas={vi.fn()}
          alternarCheckArray={vi.fn()}
        />
      );

      expect(html).toContain("Inm. Daño (0)");
      expect(html).toContain("Res. Daño (0)");
      expect(html).toContain("Vuln. Daño (0)");
      expect(html).toContain("Inm. Condic (0)");
    });

    it("renderiza la pestaña activa con la clase CSS correspondiente", () => {
      const htmlInmunidades = renderToStaticMarkup(
        <SeccionDefensas
          monstruoForm={monstruoFormMock}
          subDefensas="inmunidades"
          setSubDefensas={vi.fn()}
          alternarCheckArray={vi.fn()}
        />
      );
      expect(htmlInmunidades).toMatch(/subDefBotonActivo[^>]*>Inm. Daño/);

      const htmlResistencias = renderToStaticMarkup(
        <SeccionDefensas
          monstruoForm={monstruoFormMock}
          subDefensas="resistencias"
          setSubDefensas={vi.fn()}
          alternarCheckArray={vi.fn()}
        />
      );
      expect(htmlResistencias).toMatch(/subDefBotonActivo[^>]*>Res. Daño/);
    });

    it("renderiza correctamente las opciones de inmunidades de daño cuando subDefensas es 'inmunidades'", () => {
      const html = renderToStaticMarkup(
        <SeccionDefensas
          monstruoForm={monstruoFormMock}
          subDefensas="inmunidades"
          setSubDefensas={vi.fn()}
          alternarCheckArray={vi.fn()}
        />
      );

      TIPOS_DAÑO_DND.forEach((daño) => {
        expect(html).toContain(daño);
      });

      // Checkbox de 'veneno' debe estar checked
      expect(html).toMatch(/<input[^>]*type="checkbox"[^>]*checked=""[^>]*>veneno/);
    });

    it("renderiza correctamente las opciones de resistencias de daño cuando subDefensas es 'resistencias'", () => {
      const html = renderToStaticMarkup(
        <SeccionDefensas
          monstruoForm={monstruoFormMock}
          subDefensas="resistencias"
          setSubDefensas={vi.fn()}
          alternarCheckArray={vi.fn()}
        />
      );

      TIPOS_DAÑO_DND.forEach((daño) => {
        expect(html).toContain(daño);
      });

      // Checkbox de 'frío' debe estar checked
      expect(html).toMatch(/<input[^>]*type="checkbox"[^>]*checked=""[^>]*>frío/);
    });

    it("renderiza correctamente las opciones de vulnerabilidades de daño cuando subDefensas es 'vulnerabilidades'", () => {
      const html = renderToStaticMarkup(
        <SeccionDefensas
          monstruoForm={monstruoFormMock}
          subDefensas="vulnerabilidades"
          setSubDefensas={vi.fn()}
          alternarCheckArray={vi.fn()}
        />
      );

      TIPOS_DAÑO_DND.forEach((daño) => {
        expect(html).toContain(daño);
      });

      // Checkbox de 'fuego' y 'ácido' deben estar checked
      expect(html).toMatch(/<input[^>]*type="checkbox"[^>]*checked=""[^>]*>fuego/);
      expect(html).toMatch(/<input[^>]*type="checkbox"[^>]*checked=""[^>]*>ácido/);
    });

    it("renderiza correctamente las opciones de condiciones cuando subDefensas es 'condiciones'", () => {
      const html = renderToStaticMarkup(
        <SeccionDefensas
          monstruoForm={monstruoFormMock}
          subDefensas="condiciones"
          setSubDefensas={vi.fn()}
          alternarCheckArray={vi.fn()}
        />
      );

      CONDICIONES_DND.forEach((condicion) => {
        expect(html).toContain(condicion);
      });

      // Checkbox de 'envenenado' y 'asustado' deben estar checked
      expect(html).toMatch(/<input[^>]*type="checkbox"[^>]*checked=""[^>]*>envenenado/);
      expect(html).toMatch(/<input[^>]*type="checkbox"[^>]*checked=""[^>]*>asustado/);
    });
  });

  describe("Interacciones de Botones de Navegación (setSubDefensas)", () => {
    it.each([
      ["inmunidades", "resistencias", 0],
      ["resistencias", "inmunidades", 1],
      ["vulnerabilidades", "inmunidades", 2],
      ["condiciones", "inmunidades", 3]
    ] as const)("selecciona %s desde %s", (destino, inicial, indice) => {
      const setSubDefensas = vi.fn();
      const tree = SeccionDefensas({
        monstruoForm: monstruoFormMock,
        subDefensas: inicial,
        setSubDefensas,
        alternarCheckArray: vi.fn()
      }) as JSX.Element;

      tree.props.children[0].props.children[indice].props.onClick();

      expect(setSubDefensas).toHaveBeenCalledTimes(1);
      expect(setSubDefensas).toHaveBeenCalledWith(destino);
    });
  });

  describe("Interacciones de Checkboxes (alternarCheckArray)", () => {
    it.each([
      ["inmunidades", "inmunidadesDaño", 0, TIPOS_DAÑO_DND],
      ["resistencias", "resistencias", 1, TIPOS_DAÑO_DND],
      ["vulnerabilidades", "vulnerabilidades", 2, TIPOS_DAÑO_DND],
      ["condiciones", "inmunidadesCondicion", 3, CONDICIONES_DND]
    ] as const)("alterna %s en el campo %s", (pestana, campo, indice, opciones) => {
      const alternarCheckArray = vi.fn();
      const tree = SeccionDefensas({
        monstruoForm: monstruoFormMock,
        subDefensas: pestana,
        setSubDefensas: vi.fn(),
        alternarCheckArray
      }) as JSX.Element;

      const gridChecks = tree.props.children[1].props.children[indice];
      gridChecks.props.children[0].props.children[0].props.onChange();

      expect(alternarCheckArray).toHaveBeenCalledTimes(1);
      expect(alternarCheckArray).toHaveBeenCalledWith(campo, opciones[0]);
    });
  });
});
