import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PanelFormaSalvaje } from "./PanelFormaSalvaje";
import { ModalGestionFormasSalvajes } from "./formaSalvaje";
import { MONSTRUOS_INICIALES } from "@/utiles/datosIniciales";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { PersonajeJugador } from "@/tipos";

describe("PanelFormaSalvaje - Tarjetas de Formas Conocidas en Reserva", () => {
  const pjDruida: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-druida-1",
    clase: "Druida",
    nivel: 2,
    rasgos: [
      {
        id: "rasgo_cls_druida_forma_salvaje",
        nombre: "Forma salvaje",
        descripcion: "Puedes transformarte en bestia.",
        tipoAccion: "accion_adicional",
        origen: "clase",
        fuente: "Druida",
        tieneUsosLimitados: true,
        usosMaximos: 2,
        usosRestantes: 2,
        personalizado: false,
        activo: true,
        recuperacion: "descanso_dinamico",
        notas: "",
        formasBestia: {
          progresion: [{ nivelMinimo: 2, conocidas: 4, vdMaximo: 0.25, vuelo: false }]
        }
      }
    ],
    formaSalvaje: {
      formasConocidasIds: ["m_lobo"],
      formaActivaId: null,
      hpTemporalAlTransformar: 0
    }
  };

  it("renderiza la tarjeta completa de la criatura conocida con sus 6 características y botón Ver Ficha", () => {
    const html = renderToStaticMarkup(
      <PanelFormaSalvaje
        personaje={pjDruida}
        alTransformar={vi.fn()}
        alRevertir={vi.fn()}
        alGuardarFormasConocidas={vi.fn()}
      />
    );

    // Debe renderizar el nombre de la bestia y su VD
    expect(html).toContain("Lobo");
    expect(html).toContain("VD 1/4");

    // Debe renderizar la cuadrícula de características completa
    expect(html).toContain("FUE");
    expect(html).toContain("DES");
    expect(html).toContain("CON");
    expect(html).toContain("INT");
    expect(html).toContain("SAB");
    expect(html).toContain("CAR");

    // Debe renderizar el botón de inspección y adopción
    expect(html).toContain("Ver Ficha");
    expect(html).toContain("Adoptar Forma");
  });

  it("muestra la insignia de Forma Activa cuando el personaje está transformado en esa bestia", () => {
    const pjTransformado: PersonajeJugador = {
      ...pjDruida,
      formaSalvaje: {
        formasConocidasIds: ["m_lobo"],
        formaActivaId: "m_lobo",
        hpTemporalAlTransformar: 2
      },
      condicionesActivas: ["Forma salvaje"]
    };

    const html = renderToStaticMarkup(
      <PanelFormaSalvaje
        personaje={pjTransformado}
        alTransformar={vi.fn()}
        alRevertir={vi.fn()}
        alGuardarFormasConocidas={vi.fn()}
      />
    );

    expect(html).toContain("Activa");
    expect(html).toContain("Volver a adoptar");
    expect(html).toContain("Revertir Forma");
  });

  it("muestra los controles de ordenación en reserva cuando hay más de una forma", () => {
    const pjMultiplesFormas: PersonajeJugador = {
      ...pjDruida,
      formaSalvaje: {
        formasConocidasIds: ["m_lobo", "m_arana"],
        formaActivaId: null,
        hpTemporalAlTransformar: 0
      }
    };

    const html = renderToStaticMarkup(
      <PanelFormaSalvaje
        personaje={pjMultiplesFormas}
        alTransformar={vi.fn()}
        alRevertir={vi.fn()}
        alGuardarFormasConocidas={vi.fn()}
      />
    );

    expect(html).toContain("A-Z");
    expect(html).toContain("VD");
  });

  it("renderiza controles de ordenación y chips de filtro en el modal de selección de bestias", () => {
    const bestiasPrueba = MONSTRUOS_INICIALES.filter(
      (m) => m.id === "m_arana" || m.id === "m_lobo"
    );

    const html = renderToStaticMarkup(
      <ModalGestionFormasSalvajes
        abierto={true}
        alCerrar={vi.fn()}
        alGuardar={vi.fn()}
        bestiasDisponibles={bestiasPrueba}
        maxFormasConocidas={4}
      />
    );

    expect(html).toContain("Ordenar");
    expect(html).toContain("Nombre");
    expect(html).toContain("VD");
    expect(html).toContain("Todas (2)");
    expect(html).toContain("VD 0");
    expect(html).toContain("VD 1/4");
  });
});
