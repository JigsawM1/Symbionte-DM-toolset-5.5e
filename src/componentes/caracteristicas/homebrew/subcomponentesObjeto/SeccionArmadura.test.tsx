import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SeccionArmadura } from "./SeccionArmadura";
import type { TipoBonoDestreza } from "@/almacen/usarAlmacenDM";

describe("SeccionArmadura - Formulario de Atributos de Protección", () => {
  const estilosMock = {
    bloqueDinamicoForm: "bloqueDinamicoForm-mock",
    bloqueDinamicoArmadura: "bloqueDinamicoArmadura-mock",
    tituloBloqueDinamico: "tituloBloqueDinamico-mock",
    subtituloInformacion: "subtituloInformacion-mock",
    iconoInline2px: "iconoInline2px-mock",
    filaDobleForm: "filaDobleForm-mock",
    campoForm: "campoForm-mock",
    campoFormCentrado: "campoFormCentrado-mock",
    labelForm: "labelForm-mock",
    inputForm: "inputForm-mock",
    labelCheckbox: "labelCheckbox-mock",
    labelCheckboxConMargen: "labelCheckboxConMargen-mock",
    checkMini: "checkMini-mock",
    separadorArmaduraForm: "separadorArmaduraForm-mock"
  };

  const propsDefecto = {
    oCaBase: 14,
    setOCaBase: vi.fn(),
    oRequisitoFuerza: 13 as number | "",
    setORequisitoFuerza: vi.fn(),
    oBonoDestreza: "Máximo 2" as TipoBonoDestreza,
    setOBonoDestreza: vi.fn(),
    oDesventajaSigilo: true,
    setODesventajaSigilo: vi.fn(),
    oTiempoEquipar: "1 minuto",
    setOTiempoEquipar: vi.fn(),
    estilos: estilosMock
  };

  it("renderiza correctamente la estructura HTML con las etiquetas y valores iniciales", () => {
    const html = renderToStaticMarkup(<SeccionArmadura {...propsDefecto} />);

    expect(html).toContain("ATRIBUTOS DE PROTECCIÓN");
    expect(html).toContain("Ficha de Armadura");
    expect(html).toContain("Clase de Armadura (CA Base):");
    expect(html).toContain("Requisito de Fuerza (FUE):");
    expect(html).toContain("Bono de Destreza a la CA:");
    expect(html).toContain("Desventaja en Sigilo");
    expect(html).toContain("Tiempo para Equipar (Don/Doff):");

    // Verificar las clases CSS aplicadas
    expect(html).toContain("bloqueDinamicoForm-mock");
    expect(html).toContain("bloqueDinamicoArmadura-mock");
    expect(html).toContain("inputForm-mock");
  });

  it("pasa las propiedades correspondientes a los componentes CampoNumerico", () => {
    const elemento = <SeccionArmadura {...propsDefecto} />;

    expect(elemento.type).toBe(SeccionArmadura);
    expect(elemento.props.oCaBase).toBe(14);
    expect(elemento.props.oRequisitoFuerza).toBe(13);

    const html = renderToStaticMarkup(elemento);
    expect(html).toContain('value="14"');
    expect(html).toContain('value="13"');
  });

  it("maneja Requisito de Fuerza cuando está vacío (oRequisitoFuerza === '')", () => {
    const props = {
      ...propsDefecto,
      oRequisitoFuerza: "" as const
    };

    const html = renderToStaticMarkup(<SeccionArmadura {...props} />);

    expect(html).toContain('placeholder="Ninguno"');
    expect(html).not.toContain('value="13"');
  });

  it("renderiza la opción de bono de destreza seleccionada en el SelectorDesplegable", () => {
    const html = renderToStaticMarkup(<SeccionArmadura {...propsDefecto} />);

    // Muestra la etiqueta correspondiente al valor seleccionado ("Máximo 2")
    expect(html).toContain("Máximo +2 Destreza (Mediana)");
  });

  it("refleja el estado del checkbox de desventaja en sigilo y del tiempo para equipar", () => {
    const htmlChecked = renderToStaticMarkup(<SeccionArmadura {...propsDefecto} />);
    expect(htmlChecked).toContain("checked");
    expect(htmlChecked).toContain('value="1 minuto"');

    const htmlUnchecked = renderToStaticMarkup(
      <SeccionArmadura {...propsDefecto} oDesventajaSigilo={false} oTiempoEquipar="" />
    );
    expect(htmlUnchecked).not.toContain("checked");
    expect(htmlUnchecked).toContain('placeholder="Ej. 1 acción, 1 minuto, 10 minutos (Opcional)"');
  });
});
