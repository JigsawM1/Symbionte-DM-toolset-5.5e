import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SeccionGeneralInvocacion } from "./SeccionGeneralInvocacion";
import { SeccionHabilidadesInvocacion } from "./SeccionHabilidadesInvocacion";
import type { DatosFormularioInvocacion } from "@/hooks/usarFormularioInvocacion";
import { CARACTERISTICAS_CLAVES } from "@/constantes/homebrewConstantes";

const crearFormBase = (): DatosFormularioInvocacion => ({
  nombre: "Espíritu Feérico",
  conjuroAsociado: "Convocar Feérico",
  nivelMinimo: 3,
  nivelMaximo: 9,
  tipoCriatura: "Feérico",
  tamano: "Pequeño",
  alineacion: "Caótico neutral",
  subtiposDisponibles: "Astuto, Furioso",
  velocidadBase: { caminar: 40, volar: 30, planea: true },
  velocidadesEspeciales: [{ nivelMinimo: 5, velocidadTexto: "Volar 60 pies" }],
  sentidos: { visionOscuridad: 60, percepcionPasiva: 12 },
  idiomas: "Silvano",
  caracteristicas: {
    fuerza: 13,
    destreza: 16,
    constitucion: 14,
    inteligencia: 10,
    sabiduria: 11,
    carisma: 8
  },
  formulaCA: { base: 12, sumaNivelConjuro: true, bonificadorAdicional: 0 },
  formulaVida: { base: 30, porNivel: 10, porNivelPorEncimaDelMinimo: true, dadoGolpeVisual: "" },
  formulaAtaquesPorAccion: "mitad_nivel_abajo",
  ataques: [
    {
      nombre: "Hoja Feérica",
      tipo: "cuerpo_a_cuerpo",
      alcance: "5 pies",
      usaModificadorAtaqueConjuros: true,
      dadosDanoBase: "2d6",
      modificadorDanoFijo: -1,
      sumaNivelAlDano: true,
      tipoDano: "fuerza",
      descripcionExtra: "Empuja 5 pies"
    }
  ],
  rasgos: [
    {
      nombre: "Paso Bruma",
      subtipoRequerido: "Astuto",
      uso: "1/día",
      recarga: "5-6",
      descripcion: "Se teletransporta 30 pies."
    }
  ],
  accionesAdicionales: [],
  reacciones: [],
  fuente: "Homebrew"
});

const crearEditorMock = <T extends object>(itemForm: T, edicionIdx: number | null = null) => ({
  itemForm,
  hayBorrador: edicionIdx !== null,
  setItemForm: vi.fn(),
  edicionIdx,
  setEdicionIdx: vi.fn(),
  actualizarCampoItem: vi.fn(),
  limpiarItemForm: vi.fn(),
  agregarItem: vi.fn(() => true),
  iniciarEdicion: vi.fn(),
  cancelarEdicion: vi.fn(),
  eliminarItem: vi.fn()
});

describe("Subcomponentes del Formulario de Invocación", () => {
  it("renderiza velocidad y sentidos estructurados, edición de velocidad especial y modificadores de características", () => {
    const form = crearFormBase();
    const html = renderToStaticMarkup(
      <SeccionGeneralInvocacion
        invocacionForm={form}
        actualizarCampo={vi.fn()}
        actualizarCaracteristica={vi.fn()}
        listaVelocidades={crearEditorMock({ nivelMinimo: form.nivelMinimo, velocidadTexto: "" })}
      />
    );

    expect(html).toContain("Velocidad (pies):");
    expect(html).toContain("Planea (hover)");
    expect(html).toContain("Visión en oscuridad (pies)");
    expect(html).toContain("Percepción pasiva");
    expect(html).toContain("Editar velocidad de nivel 5+");
    expect(html).toContain("CARACTERÍSTICAS BASE");
    for (const { etiqueta } of CARACTERISTICAS_CLAVES) {
      expect(html).toContain(etiqueta);
    }
    expect(html).toContain("+1");
    expect(html).toContain("+3");
    expect(html).toContain("+2");
    expect(html).toContain("+0");
    expect(html).toContain("-1");
  });

  it("ofrece campos de texto para editar los calificadores de plantillas anteriores", () => {
    const form = {
      ...crearFormBase(),
      velocidadBase: "30 pies, Volar 40 pies (solo en forma de aire)",
      sentidos: "Visión en la oscuridad 60 pies (Vista del diablo)"
    };
    const html = renderToStaticMarkup(
      <SeccionGeneralInvocacion
        invocacionForm={form}
        actualizarCampo={vi.fn()}
        actualizarCaracteristica={vi.fn()}
        listaVelocidades={crearEditorMock({ nivelMinimo: form.nivelMinimo, velocidadTexto: "" })}
      />
    );
    expect(html).toContain(`value="${form.velocidadBase}"`);
    expect(html).toContain(`value="${form.sentidos}"`);
  });

  it("renderiza ataques escalables con edición, cancelación y rasgos con edición en sitio", () => {
    const form = crearFormBase();
    const html = renderToStaticMarkup(
      <SeccionHabilidadesInvocacion
        invocacionForm={form}
        listaAtaques={crearEditorMock(form.ataques[0], 0)}
        listaRasgos={crearEditorMock(form.rasgos[0], 0)}
        listaAccionesAdicionales={crearEditorMock({ nombre: "", descripcion: "" })}
        listaReacciones={crearEditorMock({ nombre: "", descripcion: "" })}
      />
    );

    expect(html).toContain("EDITANDO ATAQUE ESCALABLE");
    expect(html).toContain("Cancelar edición de ataque");
    expect(html).toContain("2d6-1+Nv (fuerza)");
    expect(html).toContain("Editar Hoja Feérica");
    expect(html).toContain("EDITANDO RASGO");
    expect(html).toContain("Guardar cambios del rasgo");
    expect(html).toContain("Paso Bruma [Astuto] (1/día / Recarga 5-6)");
    expect(html).toContain("Editar Paso Bruma");
  });
});
