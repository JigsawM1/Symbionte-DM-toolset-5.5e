import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import { obtenerCatalogoEspecies, obtenerSubespeciesDeEspecie } from "@/servicios/gestorEspecies";
import { PestanaIdentidad } from "./PestanaIdentidad";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";
import type { PersonajeJugador } from "@/tipos";

describe("Selector de Sugerencias de Especies y Subrazas / Legados en Configuración", () => {
  const personajeMock: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-test-especies",
    nombre: "Héroe de Prueba",
    jugador: "Tester",
    clase: "Guerrero",
    subclase: "Campeón",
    nivel: 3,
    experiencia: 900,
    especie: "Humano",
    subespecie: "",
    trasfondo: "Soldado",
    alineacion: "Neutral Bueno",
    tamano: "Mediano",
    tipoCriatura: "Humanoide",
    velocidad: "30 pies",
    hpMaximo: 28,
    hpMaximoBase: 28,
    hpActual: 28,
    clases: [
      { nombre: "Guerrero", subclase: "Campeón", nivel: 3 }
    ]
  };

  it("1. El catálogo canónico contiene todas las especies oficiales de D&D 5.5e con sus nombres", () => {
    const catalogo = obtenerCatalogoEspecies();
    expect(catalogo.length).toBeGreaterThanOrEqual(10);
    const nombres = catalogo.map((e) => e.nombre);
    expect(nombres).toContain("Humano");
    expect(nombres).toContain("Elfo");
    expect(nombres).toContain("Enano");
    expect(nombres).toContain("Gnomo");
    expect(nombres).toContain("Goliat");
    expect(nombres).toContain("Orco");
    expect(nombres).toContain("Tiefling");
    expect(nombres).toContain("Dracónido");
    expect(nombres).toContain("Aasimar");
    expect(nombres).toContain("Mediano");
  });

  it("2. Retorna las subrazas/legados correspondientes a Tiefling, Dracónido, Elfo, Gnomo y Goliat", () => {
    // Tiefling -> 3 legados
    const subsTiefling = obtenerSubespeciesDeEspecie("Tiefling").map((s) => s.nombre);
    expect(subsTiefling).toEqual(["Legado abisal", "Legado ctónico", "Legado infernal"]);

    // Elfo -> 3 subrazas/linajes
    const subsElfo = obtenerSubespeciesDeEspecie("Elfo").map((s) => s.nombre);
    expect(subsElfo).toEqual(["Drow", "Alto elfo", "Elfo de los bosques"]);

    // Dracónido -> 10 ancestros dracónicos
    const subsDraconido = obtenerSubespeciesDeEspecie("Dracónido").map((s) => s.nombre);
    expect(subsDraconido.length).toBe(10);
    expect(subsDraconido).toContain("Dragón Rojo");
    expect(subsDraconido).toContain("Dragón Azul");

    // Goliat -> 6 linajes de gigantes
    const subsGoliat = obtenerSubespeciesDeEspecie("Goliat").map((s) => s.nombre);
    expect(subsGoliat.length).toBe(6);
    expect(subsGoliat).toContain("Gigante de fuego");
    expect(subsGoliat).toContain("Gigante de las nubes");

    // Gnomo -> 2 linajes
    const subsGnomo = obtenerSubespeciesDeEspecie("Gnomo").map((s) => s.nombre);
    expect(subsGnomo).toEqual(["Gnomo de los bosques", "Gnomo de las rocas"]);
  });

  it("3. Retorna lista vacía para especies sin subrazas/legados oficiales (Humano, Orco, Mediano)", () => {
    expect(obtenerSubespeciesDeEspecie("Humano")).toEqual([]);
    expect(obtenerSubespeciesDeEspecie("Orco")).toEqual([]);
    expect(obtenerSubespeciesDeEspecie("Mediano")).toEqual([]);
  });

  it("4. PestanaIdentidad renderiza los Selectores de Sugerencias para especie y subespecie/legado", () => {
    const htmlHumano = renderToStaticMarkup(
      <PestanaIdentidad
        form={personajeMock}
        alActualizarCampo={vi.fn()}
        alDetectarJugadorTaleSpire={vi.fn()}
        alCambiarClaseNombre={vi.fn()}
        alCambiarClaseSubclase={vi.fn()}
        alCambiarClaseNivel={vi.fn()}
        alEliminarClase={vi.fn()}
        alAgregarClase={vi.fn()}
        alAplicarBuildSugerida={vi.fn()}
        alCambiarNivelTotal={vi.fn()}
        alCambiarExperiencia={vi.fn()}
      />
    );

    expect(htmlHumano).toContain('value="Humano"');
    expect(htmlHumano).toContain("Especie / Raza");
    expect(htmlHumano).toContain("Subespecie / Legado / Linaje");

    // Probar etiqueta adaptativa para Tiefling
    const pjTiefling: PersonajeJugador = {
      ...personajeMock,
      especie: "Tiefling",
      subespecie: "Legado infernal"
    };

    const htmlTiefling = renderToStaticMarkup(
      <PestanaIdentidad
        form={pjTiefling}
        alActualizarCampo={vi.fn()}
        alDetectarJugadorTaleSpire={vi.fn()}
        alCambiarClaseNombre={vi.fn()}
        alCambiarClaseSubclase={vi.fn()}
        alCambiarClaseNivel={vi.fn()}
        alEliminarClase={vi.fn()}
        alAgregarClase={vi.fn()}
        alAplicarBuildSugerida={vi.fn()}
        alCambiarNivelTotal={vi.fn()}
        alCambiarExperiencia={vi.fn()}
      />
    );

    expect(htmlTiefling).toContain('value="Tiefling"');
    expect(htmlTiefling).toContain('value="Legado infernal"');
    expect(htmlTiefling).toContain("Legado Infernal");
  });

  it("5. Sincronización automática de rasgos al cambiar especie y subespecie", () => {
    const pjTiefling: PersonajeJugador = {
      ...personajeMock,
      especie: "Tiefling",
      subespecie: "Legado infernal"
    };

    const rasgosSincronizados = sincronizarRasgosAutomaticos(pjTiefling);
    const nombres = rasgosSincronizados.map((r) => r.nombre);

    expect(nombres).toContain("Presencia sobrenatural");
    expect(nombres).toContain("Resistencia infernal");
    expect(nombres).toContain("Magia infernal: Descarga de fuego");
  });
});
