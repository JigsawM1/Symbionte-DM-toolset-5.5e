import { describe, it, expect, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CompendioConjurosJugador } from "./CompendioConjurosJugador";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { PersonajeJugador, ClaseLanzadora } from "@/tipos";

describe("CompendioConjurosJugador - Subpestañas del Mago (modeloConjuros: grimorio)", () => {
  beforeEach(() => {
    usarAlmacenDM.setState({
      personajes: [],
      idPersonajeActivo: null,
      baseDatosHechizos: []
    });
  });

  it("renderiza las subpestañas 'Conocido', 'Libro de conjuros', 'Disponibles' y 'Otros' para el Mago", () => {
    const clasesMago: ClaseLanzadora[] = [
      {
        clase: "Mago",
        nivel: 3,
        tipoLanzador: "completo",
        habilidadConjuro: "inteligencia",
        modeloConjuros: "grimorio"
      }
    ];

    const pjMago: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj-mago-subpestanas",
      nombre: "Gale de Aguasprofundas",
      clase: "Mago",
      nivel: 3,
      esLanzador: true,
      clasesLanzadoras: clasesMago,
      conjurosConocidosIds: [],
      conjurosPreparadosIds: [],
      trucosConocidosIds: []
    };

    usarAlmacenDM.setState({
      personajes: [pjMago],
      idPersonajeActivo: pjMago.id
    });

    const html = renderToStaticMarkup(<CompendioConjurosJugador personajeProp={pjMago} />);

    // Comprobamos la presencia de las 4 subpestañas exactas solicitadas
    expect(html).toContain("Conocido");
    expect(html).toContain("Libro de conjuros");
    expect(html).toContain("Disponibles");
    expect(html).toContain("Otros");
    // NO debe decir "Preparados" ni "Todos" para el Mago
    expect(html).not.toContain(">Preparados<");
    expect(html).not.toContain(">Todos<");
  });

  it("renderiza 'Preparados', 'Disponibles' y 'Todos' para un Clérigo (preparador sin grimorio)", () => {
    const clasesClerigo: ClaseLanzadora[] = [
      {
        clase: "Clérigo",
        nivel: 3,
        tipoLanzador: "completo",
        habilidadConjuro: "sabiduria",
        modeloConjuros: "preparados"
      }
    ];

    const pjClerigo: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj-clerigo-subpestanas",
      nombre: "Sombrahedionda",
      clase: "Clérigo",
      nivel: 3,
      esLanzador: true,
      clasesLanzadoras: clasesClerigo,
      conjurosConocidosIds: [],
      conjurosPreparadosIds: [],
      trucosConocidosIds: []
    };

    usarAlmacenDM.setState({
      personajes: [pjClerigo],
      idPersonajeActivo: pjClerigo.id
    });

    const html = renderToStaticMarkup(<CompendioConjurosJugador personajeProp={pjClerigo} />);

    expect(html).toContain("Preparados");
    expect(html).toContain("Disponibles");
    expect(html).toContain("Todos");
    expect(html).not.toContain("Libro de conjuros");
    expect(html).not.toContain("Otros");
  });

  it("renderiza 'Conocidos', 'Disponibles' y 'Todos' para un Bardo (modelo conocidos)", () => {
    const clasesBardo: ClaseLanzadora[] = [
      {
        clase: "Bardo",
        nivel: 3,
        tipoLanzador: "completo",
        habilidadConjuro: "carisma",
        modeloConjuros: "conocidos"
      }
    ];

    const pjBardo: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj-bardo-subpestanas",
      nombre: "Astarion Bardo",
      clase: "Bardo",
      nivel: 3,
      esLanzador: true,
      clasesLanzadoras: clasesBardo,
      conjurosConocidosIds: [],
      conjurosPreparadosIds: [],
      trucosConocidosIds: []
    };

    usarAlmacenDM.setState({
      personajes: [pjBardo],
      idPersonajeActivo: pjBardo.id
    });

    const html = renderToStaticMarkup(<CompendioConjurosJugador personajeProp={pjBardo} />);

    expect(html).toContain("Conocidos");
    expect(html).toContain("Disponibles");
    expect(html).toContain("Todos");
    expect(html).not.toContain("Libro de conjuros");
    expect(html).not.toContain("Preparados");
    expect(html).not.toContain("Otros");
  });
});
