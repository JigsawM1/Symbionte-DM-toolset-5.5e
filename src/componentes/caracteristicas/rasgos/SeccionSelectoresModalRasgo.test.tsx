import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SeccionSelectoresModalRasgo } from "./SeccionSelectoresModalRasgo";
import type { SelectorRasgo } from "@/tipos";
import { obtenerRasgosClaseYSubclase } from "@/servicios/gestorClases";

describe("SeccionSelectoresModalRasgo - Paginación en Modo Lista", () => {
  const opciones12 = Array.from({ length: 12 }, (_, i) => ({
    id: `opcion_${i + 1}`,
    nombre: `Conjuro Ritual ${i + 1}`,
    descripcion: `Descripción del ritual ${i + 1}`
  }));

  const selectorMultipleLista: SelectorRasgo = {
    id: "selector_rituales_nv1",
    tipo: "multiple",
    visualizacion: "lista",
    etiqueta: "Rituales Nivel 1",
    maxSelecciones: 3,
    opciones: opciones12,
    valorActual: ["opcion_1", "opcion_7"]
  };

  it("respeta visualizacion normal aunque el ID y la etiqueta contengan conjuro de nivel 1", () => {
    const html = renderToStaticMarkup(<SeccionSelectoresModalRasgo selectores={[{
      ...selectorMultipleLista, id: "selector_conjuro_nv1", etiqueta: "Conjuro Nivel 1",
      tipoSelector: "general", visualizacion: "normal"
    }]} />);
    expect(html).toContain("Conjuro Ritual 12");
    expect(html).not.toContain("1 / 3");
  });

  it("respeta un selector general aunque el nombre contenga invocacion y dote", () => {
    const html = renderToStaticMarkup(<SeccionSelectoresModalRasgo selectores={[{
      ...selectorMultipleLista, id: "invocacion_dote", etiqueta: "Invocaciones de dote",
      tipoSelector: "general", maxSelecciones: 2, valorActual: []
    }]} />);
    expect(html).toContain("Selecciona hasta 2 (0/2)");
    expect(html).not.toContain("Invocaciones conocidas:");
  });

  it("renderiza en lista los tres selectores reales del mago de niveles 18 y 20", () => {
    const rasgos = obtenerRasgosClaseYSubclase("Mago", 20);
    const selectores = rasgos.filter((r) => r.nivelRequerido === 18 || r.nivelRequerido === 20).flatMap((r) => r.selectores || []);
    expect(selectores).toHaveLength(3);
    for (const selector of selectores) {
      expect(selector.visualizacion).toBe("lista");
      const html = renderToStaticMarkup(<SeccionSelectoresModalRasgo selectores={[selector]} />);
      expect(html).toContain("1-4 de");
    }
  });

  it("renderiza solo los primeros 4 elementos y muestra el control de paginación", () => {
    const html = renderToStaticMarkup(
      <SeccionSelectoresModalRasgo
        selectores={[selectorMultipleLista]}
        opcionesTrucosMago={[]}
        alActualizarSeleccion={vi.fn()}
      />
    );

    // Debe mostrar los primeros 4
    expect(html).toContain("Conjuro Ritual 1");
    expect(html).toContain("Conjuro Ritual 4");
    // NO debe mostrar el 5 en la primera página
    expect(html).not.toContain("Conjuro Ritual 5");

    // Debe mostrar el control de paginación con 3 páginas (ceil(12 / 4) = 3)
    expect(html).toContain("1 / 3");
    expect(html).toContain("1-4 de 12 opciones");
  });

  it("no muestra paginación en selectores con 4 o menos elementos", () => {
    const selectorCorto: SelectorRasgo = {
      id: "selector_corto",
      tipo: "multiple",
      visualizacion: "lista",
      etiqueta: "Opciones Pocas",
      maxSelecciones: 2,
      opciones: opciones12.slice(0, 4),
      valorActual: []
    };

    const html = renderToStaticMarkup(
      <SeccionSelectoresModalRasgo
        selectores={[selectorCorto]}
        opcionesTrucosMago={[]}
        alActualizarSeleccion={vi.fn()}
      />
    );

    expect(html).toContain("Conjuro Ritual 1");
    expect(html).toContain("Conjuro Ritual 4");
    expect(html).not.toContain("1 / 1");
  });

  it("renderiza paginación en selectores de tipo único con visualización en lista (ej. Influencia Sombría)", () => {
    const selectorUnicoLista: SelectorRasgo = {
      id: "selector_conjuro_nv1_influencia_sombria",
      tipo: "unico",
      visualizacion: "lista",
      etiqueta: "Conjuro de Nivel 1 (Ilusión o Nigromancia)",
      maxSelecciones: 1,
      opciones: opciones12,
      valorActual: []
    };

    const html = renderToStaticMarkup(
      <SeccionSelectoresModalRasgo
        selectores={[selectorUnicoLista]}
        opcionesTrucosMago={[]}
        alActualizarSeleccion={vi.fn()}
      />
    );

    // Debe mostrar los primeros 4 elementos de la lista
    expect(html).toContain("Conjuro Ritual 1");
    expect(html).toContain("Conjuro Ritual 4");
    // NO debe mostrar el 5 en la primera página
    expect(html).not.toContain("Conjuro Ritual 5");

    // Debe mostrar el control de paginación
    expect(html).toContain("1 / 3");
    expect(html).toContain("1-4 de 12 opciones");
  });

  describe("Reutilización de Selector Desplegable (DRY) - Magia de Alto Elfo e Iniciado en la Magia", () => {
    const opcionesTrucosMago = [
      { id: "prestidigitacion", nombre: "Prestidigitación", descripcion: "Truco menor arcano" },
      { id: "rayo_de_escarcha", nombre: "Rayo de escarcha", descripcion: "Ataque de frío" },
      { id: "descarga_de_fuego", nombre: "Descarga de fuego", descripcion: "Ataque ardiente" }
    ];

    const selectorIniciadoMago: SelectorRasgo = {
      id: "selector_truco_1_iniciado_mago",
      tipoSelector: "conjuro",
      tipo: "unico",
      etiqueta: "Primer Truco de Mago",
      maxSelecciones: 1,
      opciones: opcionesTrucosMago,
      valorActual: ["prestidigitacion"],
      claveOpcionesDinamicas: "trucos_mago"
    };

    const selectorAltoElfo: SelectorRasgo = {
      id: "selector_truco_alto_elfo",
      tipoSelector: "conjuro",
      tipo: "unico",
      etiqueta: "Truco de Mago (Sustituible tras descanso largo)",
      maxSelecciones: 1,
      opciones: opcionesTrucosMago,
      valorActual: ["prestidigitacion"],
      claveOpcionesDinamicas: "trucos_mago"
    };

    it("renderiza el selector de Magia de alto elfo usando la misma estructura de SelectorDesplegable que Iniciado en la magia", () => {
      const htmlAltoElfo = renderToStaticMarkup(
        <SeccionSelectoresModalRasgo
          selectores={[selectorAltoElfo]}
          alActualizarSeleccion={vi.fn()}
        />
      );

      const htmlIniciado = renderToStaticMarkup(
        <SeccionSelectoresModalRasgo
          selectores={[selectorIniciadoMago]}
          alActualizarSeleccion={vi.fn()}
        />
      );

      // Ambos deben contener el título de su etiqueta
      expect(htmlAltoElfo).toContain("Truco de Mago (Sustituible tras descanso largo)");
      expect(htmlIniciado).toContain("Primer Truco de Mago");

      // Ambos deben indicar 1 seleccionada
      expect(htmlAltoElfo).toContain("1 seleccionada");
      expect(htmlIniciado).toContain("1 seleccionada");

      // Ambos deben renderizar el botón del desplegable común mostrando la opción seleccionada
      expect(htmlAltoElfo).toContain("Prestidigitación");
      expect(htmlIniciado).toContain("Prestidigitación");
    });
  });

  describe("Resolución Declarativa con tipoSelector", () => {
    it("renderiza el acordeón de dotes cuando tipoSelector es 'dote', independientemente del nombre del ID", () => {
      const selectorDoteDeclarativo: SelectorRasgo = {
        id: "selector_talento_marcial_personalizado",
        tipo: "unico",
        tipoSelector: "dote",
        etiqueta: "Talento Especial de Guerrero",
        maxSelecciones: 1,
        opciones: [
          {
            id: "talento_1",
            nombre: "Talento Uno",
            descripcion: "Efecto uno",
            categoria: "general"
          }
        ],
        valorActual: []
      };

      const html = renderToStaticMarkup(
        <SeccionSelectoresModalRasgo
          selectores={[selectorDoteDeclarativo]}
          alActualizarSeleccion={vi.fn()}
        />
      );

      // Debe renderizar la estructura del SelectorDotesAcordeon
      expect(html).toContain("Talento Especial de Guerrero");
      expect(html).toContain("Talento Uno");
      expect(html).toContain("General");
    });

    it("renderiza el acordeón de invocaciones cuando tipoSelector es 'invocacion'", () => {
      const selectorInvocacionDeclarativo: SelectorRasgo = {
        id: "selector_poder_oculto",
        tipo: "multiple",
        tipoSelector: "invocacion",
        etiqueta: "Poder Oculto de Pacto",
        maxSelecciones: 2,
        opciones: [
          {
            id: "invocacion_custom",
            nombre: "Visión Extraña",
            descripcion: "Puedes ver lo invisible",
            categoriaMecanica: "pasivo_permanente"
          }
        ],
        valorActual: ["invocacion_custom"]
      };

      const html = renderToStaticMarkup(
        <SeccionSelectoresModalRasgo
          selectores={[selectorInvocacionDeclarativo]}
          alActualizarSeleccion={vi.fn()}
        />
      );

      expect(html).toContain("Poder Oculto de Pacto");
      expect(html).toContain("Invocaciones conocidas: 1 / 2");
      expect(html).toContain("Visión Extraña");
    });
  });
});
