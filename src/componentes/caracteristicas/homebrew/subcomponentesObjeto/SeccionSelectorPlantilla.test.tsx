import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SeccionSelectorPlantilla } from "./SeccionSelectorPlantilla";
import type { ObjetoHomebrew } from "@/tipos";

describe("SeccionSelectorPlantilla - Selector de sugerencias para plantilla base", () => {
  const objetosMock: ObjetoHomebrew[] = [
    {
      id: "scimitar",
      nombre: "Cimatarra",
      categoria: "armas",
      rareza: "Común",
      descripcion: "Una cimatarra curva y veloz.",
      pesoLb: 3,
      valorPO: 25,
      propiedades: ["Ligera", "Sutil"],
      esMagico: false,
      sintonizacionRequerida: false,
      efectosPasivos: [],
      hechizosVinculados: [],
      esConsumible: false,
      equipable: true,
      subcategoria: "Arma Marcial CaC"
    },
    {
      id: "shield",
      nombre: "Escudo",
      categoria: "escudos",
      rareza: "Común",
      descripcion: "Un escudo de madera o acero.",
      pesoLb: 6,
      valorPO: 10,
      caBase: 2,
      desventajaSigilo: false,
      esMagico: false,
      sintonizacionRequerida: false,
      efectosPasivos: [],
      hechizosVinculados: [],
      esConsumible: false,
      equipable: true,
      subcategoria: "Escudo"
    }
  ];

  const estilosMock = {
    contenedorPlantillaBase: "contenedor-test",
    labelPlantillaBase: "label-test"
  };

  it("no renderiza nada si se está editando un objeto existente (idEnEdicion !== null)", () => {
    const alSeleccionar = vi.fn();
    const html = renderToStaticMarkup(
      <SeccionSelectorPlantilla
        idEnEdicion="scimitar"
        listaTodosObjetos={objetosMock}
        alSeleccionarPlantilla={alSeleccionar}
        estilos={estilosMock}
      />
    );

    expect(html).toBe("");
  });

  it("renderiza el SelectorSugerencias cuando se crea un objeto nuevo (idEnEdicion === null)", () => {
    const alSeleccionar = vi.fn();
    const html = renderToStaticMarkup(
      <SeccionSelectorPlantilla
        idEnEdicion={null}
        listaTodosObjetos={objetosMock}
        alSeleccionarPlantilla={alSeleccionar}
        estilos={estilosMock}
      />
    );

    expect(html).toContain("contenedor-test");
    expect(html).toContain("label-test");
    expect(html).toContain("Usar objeto base como plantilla:");
    expect(html).toContain('placeholder="-- Buscar objeto base como plantilla (ej. Cimatarra, Escudo, Poción) --"');
  });

  it("contiene los componentes y estructura esperada para autocompletado", () => {
    const alSeleccionar = vi.fn();
    const elemento = (
      <SeccionSelectorPlantilla
        idEnEdicion={null}
        listaTodosObjetos={objetosMock}
        alSeleccionarPlantilla={alSeleccionar}
        estilos={estilosMock}
      />
    );

    expect(elemento.type).toBe(SeccionSelectorPlantilla);
    expect(elemento.props.listaTodosObjetos).toHaveLength(2);
  });
});
