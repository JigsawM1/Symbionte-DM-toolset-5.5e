import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { EsquemaRasgoPersonaje } from "@/tipos/rasgos";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import type { RasgoAccionCombate } from "@/servicios/calculadorAccionesCombate";
import {
  esRasgoSwitchCombate,
  requiereTarjetaEnFeedAdemasDeSwitch,
  dividirRasgosParaFlujoPlano
} from "./clasificadorSwitchesCombate";
import { BarraSwitchesCombate } from "./BarraSwitchesCombate";

const crearRasgoAccion = (
  parcial: { id: string; nombre: string } & Partial<RasgoPersonaje>,
  overridesItem: Partial<RasgoAccionCombate> = {}
): RasgoAccionCombate => {
  const rasgo = EsquemaRasgoPersonaje.parse(parcial);
  const tieneDados = Boolean(rasgo.formulaDados && rasgo.formulaDados.trim() !== "");
  return {
    rasgo,
    categoriasCombate: [rasgo.esActivable ? "activable" : "accion"],
    tipoAccionCalculado: "accion",
    esConsumible: Boolean(rasgo.tieneUsosLimitados),
    esActivable: Boolean(rasgo.esActivable || rasgo.categoriaMecanica === "activable"),
    tieneDados,
    usosRestantes: rasgo.usosRestantes ?? rasgo.usosMaximos ?? 1,
    usosMaximos: rasgo.usosMaximos ?? 1,
    ...overridesItem
  };
};

describe("clasificadorSwitchesCombate — Criterio declarativo A + C", () => {
  it("promueve activables simples (Furia, Ataque Temerario) a switches y los excluye del feed sin duplicar", () => {
    const furia = crearRasgoAccion({
      id: "rasgo_cls_barbaro_furia",
      nombre: "Furia",
      esActivable: true,
      activo: false,
      tieneUsosLimitados: true,
      usosMaximos: 3,
      usosRestantes: 2
    });
    const ataqueTemerario = crearRasgoAccion({
      id: "rasgo_cls_barbaro_temerario",
      nombre: "Ataque Temerario",
      esActivable: true,
      activo: true
    });
    const segundoAliento = crearRasgoAccion({
      id: "rasgo_segundo_aliento",
      nombre: "Segundo Aliento",
      esActivable: false,
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      usosMaximos: 1,
      usosRestantes: 1,
      formulaDados: "1d10+3"
    });

    const resultado = dividirRasgosParaFlujoPlano([furia, ataqueTemerario, segundoAliento]);

    expect(resultado.rasgosSwitches.map((i) => i.rasgo.id)).toEqual([
      "rasgo_cls_barbaro_furia",
      "rasgo_cls_barbaro_temerario"
    ]);
    expect(resultado.rasgosFeed.map((i) => i.rasgo.id)).toEqual(["rasgo_segundo_aliento"]);
  });

  it("excluye rasgos ocultos, formasBestia, resolucionAsistida, lanzamientoConRecurso, conversionEspacios y lanzamientoConActivacion inactivo", () => {
    const oculto = crearRasgoAccion({ id: "oculto", nombre: "Oculto", esActivable: true, oculto: true });
    const formaSalvaje = crearRasgoAccion({
      id: "forma",
      nombre: "Forma salvaje",
      esActivable: true,
      formasBestia: { progresion: [{ nivelMinimo: 2, conocidas: 4, vdMaximo: 0.25, vuelo: false }] }
    });
    const asistido = crearRasgoAccion({
      id: "asistido",
      nombre: "Castigo divino",
      esActivable: true,
      resolucionAsistida: {
        integrarEnDanoDeArma: true,
        soloAtaqueBestia: false,
        opciones: [{ id: "base", etiqueta: "Base", tipo: "dano", formula: "2d8" }]
      }
    });
    const conLista = crearRasgoAccion({
      id: "lista",
      nombre: "Hechicero",
      esActivable: true,
      lanzamientoConRecurso: { lista: "clases", nivelMaximo: 1 }
    });
    const conversion = crearRasgoAccion({
      id: "conv",
      nombre: "Font",
      esActivable: true,
      conversionEspacios: {
        tabla: [{ nivelEspacio: 1, coste: 2, nivelMinimo: 2 }],
        permiteConvertir: true
      }
    });
    const lanzamientoInactivo = crearRasgoAccion({
      id: "lanz_inactivo",
      nombre: "Aura al activar",
      esActivable: true,
      activo: false,
      lanzamientoConActivacion: { conjuroId: "escudo", nivel: 1 }
    });
    const lanzamientoActivo = crearRasgoAccion({
      id: "lanz_activo",
      nombre: "Aura ya activa",
      esActivable: true,
      activo: true,
      lanzamientoConActivacion: { conjuroId: "escudo", nivel: 1 }
    });
    const preguntarInactivo = crearRasgoAccion({
      id: "preg_inactivo",
      nombre: "Ataque temerario",
      esActivable: true,
      activo: false,
      preguntarAlAtacar: { caracteristica: "fuerza", soloArmaODesarmado: true }
    });
    const preguntarActivo = crearRasgoAccion({
      id: "preg_activo",
      nombre: "Ataque temerario",
      esActivable: true,
      activo: true,
      preguntarAlAtacar: { caracteristica: "fuerza", soloArmaODesarmado: true }
    });

    for (const item of [oculto, formaSalvaje, asistido, conLista, conversion, lanzamientoInactivo, preguntarInactivo]) {
      expect(esRasgoSwitchCombate(item)).toBe(false);
    }
    expect(esRasgoSwitchCombate(lanzamientoActivo)).toBe(true);
    expect(esRasgoSwitchCombate(preguntarActivo)).toBe(true);
  });

  it("conserva tarjeta en feed además del switch cuando el rasgo activable tiene tirada de dados propia", () => {
    const auraConDados = crearRasgoAccion({
      id: "rasgo_aura_dano",
      nombre: "Aura Flameante",
      esActivable: true,
      activo: true,
      formulaDados: "1d6"
    });

    expect(esRasgoSwitchCombate(auraConDados)).toBe(true);
    expect(requiereTarjetaEnFeedAdemasDeSwitch(auraConDados)).toBe(true);

    const resultado = dividirRasgosParaFlujoPlano([auraConDados]);
    expect(resultado.rasgosSwitches).toHaveLength(1);
    expect(resultado.rasgosFeed).toHaveLength(1);
  });
});

describe("BarraSwitchesCombate — Renderizado accesible A + C", () => {
  const pjBase: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-barbaro-1",
    nombre: "Kael",
    clase: "Bárbaro",
    nivel: 5
  };

  const propsBase = {
    personajeActivo: pjBase,
    rasgosSwitches: [] as RasgoAccionCombate[],
    alAlternarActivo: vi.fn(),
    alAbrirDetalle: vi.fn(),
    obtenerBloqueoToggleRasgo: vi.fn().mockReturnValue({ bloqueado: false }),
    resolverRecursosPadre: vi.fn().mockReturnValue({})
  };

  it("devuelve cadena vacía cuando no hay switches ni Forma Salvaje activa", () => {
    const html = renderToStaticMarkup(<BarraSwitchesCombate {...propsBase} />);
    expect(html).toBe("");
  });

  it("renderiza chips con aria-pressed, badge ON, contador tabular, botón hermano de ficha y bloqueo", () => {
    const furiaActiva = crearRasgoAccion({
      id: "furia",
      nombre: "Furia",
      esActivable: true,
      activo: true,
      tieneUsosLimitados: true,
      usosMaximos: 3,
      usosRestantes: 2
    });
    const temerario = crearRasgoAccion({
      id: "temerario",
      nombre: "Ataque Temerario",
      esActivable: true,
      activo: false
    });
    const ligadoPadre = crearRasgoAccion({
      id: "hijo",
      nombre: "Frenesí",
      esActivable: true,
      activo: false,
      gastarDePadre: true
    });

    const html = renderToStaticMarkup(
      <BarraSwitchesCombate
        {...propsBase}
        rasgosSwitches={[furiaActiva, temerario, ligadoPadre]}
        obtenerBloqueoToggleRasgo={(r) =>
          r.id === "temerario" ? { bloqueado: true, motivo: "Requiere armadura ligera" } : { bloqueado: false }
        }
        resolverRecursosPadre={(r) =>
          r.id === "hijo"
            ? { usosPadre: { restantes: 1, maximos: 4, nombre: "Dado Superioridad" } }
            : {}
        }
      />
    );

    expect(html).toContain('aria-label="Modos activos y switches de combate"');
    expect(html).toContain("Modos de combate");
    expect(html).toContain("1 activo");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain(">ON<");
    expect(html).toContain("2/3");
    expect(html).toContain("1/4");
    expect(html).toContain('disabled=""');
    expect(html).toContain('title="Requiere armadura ligera"');
    expect(html).toContain('aria-label="Ver ficha de Furia"');

    // Verifica que el botón toggle se cierra antes de abrir el botón hermano de detalle
    const idxFuria = html.indexOf(">Furia<");
    const idxCierreToggle = html.indexOf("</button>", idxFuria);
    const idxDetalleFuria = html.indexOf('aria-label="Ver ficha de Furia"');
    expect(idxFuria).toBeGreaterThan(-1);
    expect(idxCierreToggle).toBeGreaterThan(idxFuria);
    expect(idxDetalleFuria).toBeGreaterThan(idxCierreToggle);
  });

  it("muestra chip contextual verde cuando hay una Forma Salvaje activa aunque no haya otros switches", () => {
    const pjDruida: PersonajeJugador = {
      ...pjBase,
      clase: "Druida",
      formaSalvaje: {
        formasConocidasIds: ["m_lobo"],
        formaActivaId: "m_lobo",
        hpTemporalAlTransformar: 2
      },
      condicionesActivas: ["Forma salvaje"]
    };

    const html = renderToStaticMarkup(
      <BarraSwitchesCombate {...propsBase} personajeActivo={pjDruida} rasgosSwitches={[]} />
    );

    expect(html).toContain("Lobo");
    expect(html).toContain(">ON<");
    expect(html).toContain("1 activo");
  });
});
