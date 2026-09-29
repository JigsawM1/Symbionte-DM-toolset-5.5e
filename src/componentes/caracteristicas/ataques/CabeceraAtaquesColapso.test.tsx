import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CabeceraAtaquesJugador } from "./CabeceraAtaquesJugador";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { PersonajeJugador } from "@/tipos";

describe("CabeceraAtaquesJugador - Controles de Contraer y Expandir Todo", () => {
  const personajeBase: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-guerrero-test",
    nombre: "Conan",
    clase: "Guerrero"
  };

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
        personajes={[personajeBase]}
        personajeActivo={personajeBase}
        alSeleccionarPersonaje={vi.fn()}
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
        personajes={[personajeBase]}
        personajeActivo={personajeBase}
        alSeleccionarPersonaje={vi.fn()}
        statsCalculadas={null}
      />
    );

    expect(html).not.toContain("Contraer todas las secciones de combate");
    expect(html).not.toContain("Expandir todas las secciones de combate");
  });

  it("lógica pura de colapsarTodasSecciones cierra exhaustivamente todas las secciones y niveles mágicos", () => {
    const SECCIONES_COMBATE_POR_DEFECTO: Record<string, boolean> = {
      recursos: true,
      fisicos: true,
      magicos: true,
      magicos_nv_0: true,
      magicos_nv_1: true,
      magicos_nv_2: true,
      magicos_nv_3: true,
      magicos_nv_4: true,
      magicos_nv_5: true,
      magicos_nv_6: true,
      magicos_nv_7: true,
      magicos_nv_8: true,
      magicos_nv_9: true,
      magicos_ocultos: true,
      rasgos: true,
      consumibles: true,
      hechizosObjetos: true
    };

    let estado: Record<string, boolean> = { ...SECCIONES_COMBATE_POR_DEFECTO, seccion_dinamica: true };

    const colapsarTodasSecciones = () => {
      const colapsadas: Record<string, boolean> = {};
      for (const k of Object.keys({ ...SECCIONES_COMBATE_POR_DEFECTO, ...estado })) {
        colapsadas[k] = false;
      }
      estado = colapsadas;
    };

    const expandirTodasSecciones = () => {
      const expandidas: Record<string, boolean> = {};
      for (const k of Object.keys({ ...SECCIONES_COMBATE_POR_DEFECTO, ...estado })) {
        expandidas[k] = true;
      }
      estado = expandidas;
    };

    // Inicialmente todo en true
    expect(estado.fisicos).toBe(true);
    expect(estado.magicos).toBe(true);
    expect(estado.magicos_nv_1).toBe(true);

    // Ejecutar colapsar
    colapsarTodasSecciones();

    expect(estado.recursos).toBe(false);
    expect(estado.fisicos).toBe(false);
    expect(estado.magicos).toBe(false);
    expect(estado.magicos_nv_0).toBe(false);
    expect(estado.magicos_nv_1).toBe(false);
    expect(estado.magicos_ocultos).toBe(false);
    expect(estado.rasgos).toBe(false);
    expect(estado.consumibles).toBe(false);
    expect(estado.hechizosObjetos).toBe(false);
    expect(estado.seccion_dinamica).toBe(false);

    // Ejecutar re-expandir
    expandirTodasSecciones();

    expect(estado.recursos).toBe(true);
    expect(estado.fisicos).toBe(true);
    expect(estado.magicos).toBe(true);
    expect(estado.magicos_nv_1).toBe(true);
    expect(estado.rasgos).toBe(true);
    expect(estado.seccion_dinamica).toBe(true);
  });
});
