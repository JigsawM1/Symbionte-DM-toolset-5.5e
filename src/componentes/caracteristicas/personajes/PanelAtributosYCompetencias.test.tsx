import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PanelAtributosPersonaje } from "./PanelAtributosPersonaje";
import { PanelVitalidadPersonaje } from "./PanelVitalidadPersonaje";
import { ModalSelectorCompetencias } from "./ModalSelectorCompetencias";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { calcularEstadisticasPersonaje } from "@/servicios/personajes/calculadorEstadisticasPersonaje";
import type { PersonajeJugador } from "@/tipos";

describe("Rediseño UI/UX Hoja de Personaje — Atributos 2x3 Completos, Vitalidad y Competencias", () => {
  const personajeMock: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-rediseno-test",
    nombre: "Kaelen Vane",
    nivel: 8,
    hpActual: 0,
    hpMaximo: 68,
    hpMaximoBase: 68,
    hpTemporal: 12,
    salvacionesMuerte: { exitos: 2, fallos: 1 },
    cansancio: 1,
    caracteristicas: {
      fuerza: 18,
      destreza: 14,
      constitucion: 16,
      inteligencia: 10,
      sabiduria: 12,
      carisma: 8
    },
    competenciasSalvacion: {
      fuerza: true,
      destreza: false,
      constitucion: true,
      inteligencia: false,
      sabiduria: false,
      carisma: false
    },
    gradosHabilidades: {
      ...PERSONAJE_POR_DEFECTO.gradosHabilidades,
      atletismo: "pericia",
      acrobacias: "competente",
      sigilo: "medio",
      intimidacion: "competente"
    }
  };

  it("renderiza la leyenda completa de 4 grados (BASE, MEDIO, COMP, PERICIA) y los 6 cuadros 2x3 con bloques tácticos completos", () => {
    const stats = calcularEstadisticasPersonaje(personajeMock, []);
    const html = renderToStaticMarkup(
      <PanelAtributosPersonaje
        personaje={personajeMock}
        statsCalculadas={stats}
        alTirarHabilidad={vi.fn()}
        alCiclarGradoHabilidad={vi.fn()}
        alTirarCaracteristica={vi.fn()}
        alTirarSalvacion={vi.fn()}
        alAlternarSalvacion={vi.fn()}
        alModificarCaracteristicaBase={vi.fn()}
      />
    );

    // Leyenda de 4 grados
    expect(html).toContain("BASE");
    expect(html).toContain("MEDIO");
    expect(html).toContain("COMP");
    expect(html).toContain("PERICIA");

    // Bloques tácticos que completan la altura de FUE y CON en el grid 2x3
    expect(html).toContain("Carga máx. / Empujar");
    expect(html).toContain("270 lb / 540 lb");
    expect(html).toContain("Sin habilidades asociadas");
    expect(html).toContain("Concentración +6 · PG/Nivel +3");
    expect(html).not.toContain("Presencia Social");

    // Píldoras de grado y signo negativo
    expect(html).toContain('data-grado="pericia"');
    expect(html).toContain('data-grado="medio"');
    expect(html).toContain('data-negativo="true"');
  });

  it("separa PG TEMP como columna accesible dedicada y marca estado crítico + aria-pressed en Salvaciones de Muerte a 0 PV", () => {
    const html = renderToStaticMarkup(
      <PanelVitalidadPersonaje
        personaje={personajeMock}
        alModificarHP={vi.fn()}
        alEstablecerHPActual={vi.fn()}
        alModificarHPMaximoEfectivo={vi.fn()}
        alModificarHPTemporal={vi.fn()}
        alGastarDadoGolpe={vi.fn()}
        alEstablecerDadosGolpeRestantes={vi.fn()}
        alEstablecerSalvacionMuerte={vi.fn()}
        alReiniciarSalvacionesMuerte={vi.fn()}
        alModificarCansancio={vi.fn()}
        alTirarSalvacionMuerte3D={vi.fn()}
      />
    );

    expect(html).toContain('aria-label="Ajustar puntos de golpe temporales"');
    expect(html).toContain('data-critico="true"');
    expect(html).toContain('aria-label="Éxito de muerte 1"');
    expect(html).toContain('aria-pressed="true"');
  });

  it("renderiza ModalSelectorCompetencias con role=dialog, cuerpoModal válido y barra de 4 pestañas simétricas", () => {
    const html = renderToStaticMarkup(
      <ModalSelectorCompetencias
        categoriaInicial="armas"
        estadoInicial={{
          competenciasArmasGrupos: ["sencillas", "marciales"],
          competenciasArmasLista: ["Espada Larga"],
          competenciasArmadurasGrupos: ["ligeras", "medias", "escudos"],
          competenciasArmadurasLista: [],
          idiomasLista: ["Común", "Élfico"],
          herramientasLista: ["Herramientas de Herrero"]
        }}
        alGuardar={vi.fn()}
        alCerrar={vi.fn()}
      />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("cuerpoModal");
    expect(html).toContain("barraPestanasCompetencias");
    expect(html).not.toContain("undefined");
  });
});
