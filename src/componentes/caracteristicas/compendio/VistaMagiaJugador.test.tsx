import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Compendio } from "./Compendio";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { ClaseLanzadora, HechizoBase, PersonajeJugador } from "@/tipos";

function crearHechizo(id: string, nombre: string, nivel: number, clases: string[]): HechizoBase {
  return {
    id,
    nombre,
    nivel,
    escuela: "Evocación",
    tiempoLanzamiento: "1 acción",
    alcance: "60 pies",
    componentesSeleccionados: { verbal: true, somatico: true, material: false },
    duracion: "Instantáneo",
    concentracion: false,
    ritual: false,
    descripcion: `Efecto de ${nombre}.`,
    clases
  };
}

function extraerBadgeLanzamiento(html: string): number | null {
  const match = html.match(
    /<span>LANZAMIENTO Y RECURSOS<\/span>(?:<span[^>]*>(\d+)<\/span>)?/
  );
  if (!match) {
    throw new Error("No se encontró el botón LANZAMIENTO Y RECURSOS en el HTML renderizado.");
  }
  return match[1] ? Number(match[1]) : null;
}

describe("Compendio (VistaMagiaJugador) - Badge sincronizado de LANZAMIENTO Y RECURSOS", () => {
  const hechizosPrueba: HechizoBase[] = [
    crearHechizo("h-truco-mago", "Prestidigitación", 0, ["Mago", "Bardo"]),
    crearHechizo("h-truco-clerigo", "Llama sagrada", 0, ["Clérigo"]),
    crearHechizo("h-mago-1", "Proyectil mágico", 1, ["Mago"]),
    crearHechizo("h-mago-2", "Escudo", 1, ["Mago"]),
    crearHechizo("h-mago-3", "Detectar magia", 1, ["Mago"]),
    crearHechizo("h-clerigo-1", "Bendición", 1, ["Clérigo"]),
    crearHechizo("h-clerigo-2", "Curar heridas", 1, ["Clérigo"]),
    crearHechizo("h-clerigo-otorgado", "Manos ardientes", 1, ["Mago", "Clérigo"]),
    crearHechizo("h-bardo-1", "Palabra de curación", 1, ["Bardo"]),
    crearHechizo("h-bardo-2", "Onda atronadora", 1, ["Bardo"])
  ];

  let estadoInicial: ReturnType<typeof usarAlmacenDM.getState>;

  beforeEach(() => {
    estadoInicial = usarAlmacenDM.getState();
    usarAlmacenDM.setState({
      esGM: false,
      baseDatosHechizos: hechizosPrueba,
      objetosHomebrew: [],
      personajes: [],
      idPersonajeActivo: null
    });
  });

  afterEach(() => {
    usarAlmacenDM.setState(estadoInicial);
  });

  it("Mago (grimorio): cuenta solo trucos y conjuros preparados, no todo el libro de conjuros", () => {
    const clasesMago: ClaseLanzadora[] = [
      {
        clase: "Mago",
        nivel: 3,
        tipoLanzador: "completo",
        habilidadConjuro: "inteligencia",
        modeloConjuros: "grimorio"
      }
    ];
    const mago: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj-mago-badge",
      nombre: "Elminster",
      clase: "Mago",
      nivel: 3,
      esLanzador: true,
      clasesLanzadoras: clasesMago,
      trucosConocidosIds: ["h-truco-mago"],
      conjurosConocidosIds: ["h-mago-1", "h-mago-2", "h-mago-3"],
      conjurosPreparadosIds: ["h-mago-1"]
    };

    usarAlmacenDM.setState({
      personajes: [mago],
      idPersonajeActivo: mago.id
    });

    const html = renderToStaticMarkup(<Compendio />);
    expect(extraerBadgeLanzamiento(html)).toBe(2);
  });

  it("Clérigo (preparados): refleja trucos + preparados + otorgados aunque conjurosConocidosIds esté vacío", () => {
    const clasesClerigo: ClaseLanzadora[] = [
      {
        clase: "Clérigo",
        nivel: 3,
        tipoLanzador: "completo",
        habilidadConjuro: "sabiduria",
        modeloConjuros: "preparados"
      }
    ];
    const clerigo: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj-clerigo-badge",
      nombre: "Sombra",
      clase: "Clérigo",
      nivel: 3,
      esLanzador: true,
      clasesLanzadoras: clasesClerigo,
      trucosConocidosIds: ["h-truco-clerigo"],
      conjurosConocidosIds: [],
      conjurosPreparadosIds: ["h-clerigo-1", "h-clerigo-2"],
      conjurosSiemprePreparadosIds: ["h-clerigo-otorgado"]
    };

    usarAlmacenDM.setState({
      personajes: [clerigo],
      idPersonajeActivo: clerigo.id
    });

    const html = renderToStaticMarkup(<Compendio />);
    expect(extraerBadgeLanzamiento(html)).toBe(4);
  });

  it("Bardo (conocidos): refleja trucos + conjuros conocidos", () => {
    const clasesBardo: ClaseLanzadora[] = [
      {
        clase: "Bardo",
        nivel: 3,
        tipoLanzador: "completo",
        habilidadConjuro: "carisma",
        modeloConjuros: "conocidos"
      }
    ];
    const bardo: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj-bardo-badge",
      nombre: "Volo",
      clase: "Bardo",
      nivel: 3,
      esLanzador: true,
      clasesLanzadoras: clasesBardo,
      trucosConocidosIds: ["h-truco-mago"],
      conjurosConocidosIds: ["h-bardo-1", "h-bardo-2"],
      conjurosPreparadosIds: []
    };

    usarAlmacenDM.setState({
      personajes: [bardo],
      idPersonajeActivo: bardo.id
    });

    const html = renderToStaticMarkup(<Compendio />);
    expect(extraerBadgeLanzamiento(html)).toBe(3);
  });
});
