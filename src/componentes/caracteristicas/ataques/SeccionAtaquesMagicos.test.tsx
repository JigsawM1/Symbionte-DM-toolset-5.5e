import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SeccionAtaquesMagicos } from "./SeccionAtaquesMagicos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { EsquemaRasgoPersonaje } from "@/tipos/rasgos";
import type { HechizoBase, PersonajeJugador } from "@/tipos";
import type { ConjuroAccionElemento } from "./usarCalculoAtaquesJugador";

describe("SeccionAtaquesMagicos - Conjuros fijados en Acciones", () => {
  const personajeBase: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-mago-test",
    nombre: "Elminster",
    espaciosConjuroMaximos: { 1: 4, 2: 3 },
    espaciosConjuroGastados: { 1: 0, 2: 0 },
    conjurosOcultos: [],
    conjurosEnAcciones: ["hechizo-descarga-fuego", "hechizo-proyectil-magico", "hechizo-escudo"]
  };

  const trucoDescarga: HechizoBase = {
    id: "hechizo-descarga-fuego",
    nombre: "Descarga de Fuego",
    nivel: 0,
    escuela: "Evocacion",
    tiempoLanzamiento: "1 Accion",
    alcance: "120 pies",
    componentesSeleccionados: { verbal: true, somatico: true, material: false },
    duracion: "Instantaneo",
    concentracion: false,
    ritual: false,
    descripcion: "Lanzas una mota de fuego."
  };

  const conjuroMisil: HechizoBase = {
    id: "hechizo-proyectil-magico",
    nombre: "Proyectil Mágico",
    nivel: 1,
    escuela: "Evocacion",
    tiempoLanzamiento: "1 Accion",
    alcance: "120 pies",
    componentesSeleccionados: { verbal: true, somatico: true, material: false },
    duracion: "Instantaneo",
    concentracion: false,
    ritual: false,
    descripcion: "Creas tres dardos brillantes de fuerza mágica."
  };

  const conjuroEscudo: HechizoBase = {
    id: "hechizo-escudo",
    nombre: "Escudo",
    nivel: 1,
    escuela: "Abjuracion",
    tiempoLanzamiento: "1 Reaccion",
    alcance: "Personal",
    componentesSeleccionados: { verbal: true, somatico: true, material: false },
    duracion: "1 Asalto",
    concentracion: false,
    ritual: false,
    descripcion: "Una barrera invisible de fuerza mágica te protege."
  };

  const conjurosFiltradosBase: ConjuroAccionElemento[] = [
    { hechizo: trucoDescarga, tipoAccion: "accion" },
    { hechizo: conjuroMisil, tipoAccion: "accion" },
    { hechizo: conjuroEscudo, tipoAccion: "reaccion" }
  ];

  const conjurosPorNivelBase: Record<number, ConjuroAccionElemento[]> = {
    0: [{ hechizo: trucoDescarga, tipoAccion: "accion" }],
    1: [
      { hechizo: conjuroMisil, tipoAccion: "accion" },
      { hechizo: conjuroEscudo, tipoAccion: "reaccion" }
    ],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: []
  };

  const propsBase = {
    conjurosFiltrados: conjurosFiltradosBase,
    conjurosPorNivel: conjurosPorNivelBase,
    seccionesAbiertas: {
      magicos: true,
      magicos_nv_0: true,
      magicos_nv_1: true
    },
    alAlternarSeccion: vi.fn(),
    personajeActivo: personajeBase,
    espaciosConjuroMaximos: personajeBase.espaciosConjuroMaximos,
    bonoAtaqueMagico: 5,
    tienePacto: false,
    sistemaMagia: "espacios" as const,
    estaBloqueadoPorArmadura: false,
    esHechizoDeSubclase: vi.fn().mockReturnValue(false),
    alAbrirDetalle: vi.fn(),
    alLanzar: vi.fn().mockResolvedValue(true),
    alAlternarAcciones: vi.fn()
  };

  it("renderiza conjuros visibles con su toggle activo en Acciones y sin sección Conjuros Ocultos", () => {
    const html = renderToStaticMarkup(<SeccionAtaquesMagicos {...propsBase} />);

    expect(html).toContain("Conjuros y Acciones Mágicas");
    expect(html).toContain("Trucos Listos");
    expect(html).toContain("Nivel 1");
    expect(html).toContain("Descarga de Fuego");
    expect(html).toContain("Proyectil Mágico");
    expect(html).toContain("Escudo");
    expect(html).toContain('title="Quitar de la pestaña Acciones"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain("Conjuros Ocultos");
  });

  it("ignora conjurosOcultos heredados y mantiene visibles los conjuros fijados en Acciones", () => {
    const props = {
      ...propsBase,
      personajeActivo: {
        ...personajeBase,
        conjurosOcultos: ["hechizo-proyectil-magico", "hechizo-escudo"]
      }
    };

    const html = renderToStaticMarkup(<SeccionAtaquesMagicos {...props} />);

    expect(html).toContain("Descarga de Fuego");
    expect(html).toContain("Proyectil Mágico");
    expect(html).toContain("Escudo");
    expect(html).not.toContain("Conjuros Ocultos");
  });

  it("no renderiza nada cuando conjurosFiltrados está completamente vacío", () => {
    const html = renderToStaticMarkup(
      <SeccionAtaquesMagicos
        {...propsBase}
        conjurosFiltrados={[]}
        conjurosPorNivel={{}}
      />
    );

    expect(html).toBe("");
  });

  it("respeta el estado de colapso general (seccionesAbiertas.magicos = false)", () => {
    const html = renderToStaticMarkup(
      <SeccionAtaquesMagicos
        {...propsBase}
        seccionesAbiertas={{ ...propsBase.seccionesAbiertas, magicos: false }}
      />
    );

    expect(html).toContain("Conjuros y Acciones Mágicas");
    expect(html).not.toContain("Trucos Listos");
    expect(html).not.toContain("Descarga de Fuego");
  });

  it("respeta el colapso individual por nivel (seccionesAbiertas.magicos_nv_1 = false)", () => {
    const html = renderToStaticMarkup(
      <SeccionAtaquesMagicos
        {...propsBase}
        seccionesAbiertas={{ ...propsBase.seccionesAbiertas, magicos_nv_1: false }}
      />
    );

    expect(html).toContain("Descarga de Fuego");
    expect(html).toContain("Nivel 1");
    expect(html).not.toContain("Proyectil Mágico");
  });

  it("no muestra el botón 'Gratis' para conjuros solo otorgados como preparados (efecto conjuro_otorgado)", () => {
    const personajeConPreparado: PersonajeJugador = {
      ...personajeBase,
      rasgos: [
        EsquemaRasgoPersonaje.parse({
          id: "rasgo_sub_magia_cautivadora",
          nombre: "Magia cautivadora",
          origen: "subclase",
          fuente: "Colegio del Glamour",
          descripcion: "Siempre tienes preparado Proyectil Mágico.",
          tieneUsosLimitados: true,
          usosMaximos: 1,
          usosRestantes: 1,
          conjurosOtorgados: ["Proyectil Mágico"],
          efectos: [
            {
              tipo: "conjuro_otorgado",
              objetivo: "Proyectil Mágico",
              valor: "Proyectil Mágico"
            }
          ]
        })
      ]
    };

    const html = renderToStaticMarkup(
      <SeccionAtaquesMagicos
        {...propsBase}
        personajeActivo={personajeConPreparado}
      />
    );

    expect(html).toContain("Proyectil Mágico");
    expect(html).not.toContain("<span>Gratis</span>");
  });

  it("ofrece el nivel habilitado por un espacio adicional y descuenta el gasto del máximo efectivo", () => {
    const conjuro = { ...conjuroMisil, nivel: 3 };
    const item: ConjuroAccionElemento = { hechizo: conjuro, tipoAccion: "accion" };
    const html = renderToStaticMarkup(
      <SeccionAtaquesMagicos
        {...propsBase}
        personajeActivo={{ ...personajeBase, espaciosConjuroGastados: { 1: 4, 2: 3 } }}
        espaciosConjuroMaximos={{ 1: 4, 2: 3, 3: 1 }}
        conjurosFiltrados={[item]}
        conjurosPorNivel={{ 3: [item] }}
      />
    );
    expect(html).toContain("Nv. 3 (1/1)");
    expect(html).not.toContain('data-sin-recursos="true"');
  });

  it("propaga disponibilidad de espacios, marca sin recursos cuando están agotados y usa coste real en modo puntos", () => {
    const htmlDisponibles = renderToStaticMarkup(<SeccionAtaquesMagicos {...propsBase} />);
    expect(htmlDisponibles).toContain("Nv. 1 (4/4)");
    expect(htmlDisponibles).not.toContain('data-sin-recursos="true"');

    const htmlSinEspacios = renderToStaticMarkup(
      <SeccionAtaquesMagicos
        {...propsBase}
        personajeActivo={{
          ...personajeBase,
          espaciosConjuroMaximos: { "1": 4 },
          espaciosConjuroGastados: { "1": 4 }
        }}
      />
    );
    expect(htmlSinEspacios).toContain("Nv. 1 (0/4)");
    expect(htmlSinEspacios).toContain('data-sin-recursos="true"');

    const conjuroNv3: HechizoBase = {
      ...conjuroMisil,
      id: "hechizo-bola-fuego",
      nombre: "Bola de Fuego",
      nivel: 3
    };
    const htmlPuntos = renderToStaticMarkup(
      <SeccionAtaquesMagicos
        {...propsBase}
        sistemaMagia="puntos"
        conjurosFiltrados={[{ hechizo: conjuroNv3, tipoAccion: "accion" }]}
        conjurosPorNivel={{ 3: [{ hechizo: conjuroNv3, tipoAccion: "accion" }] }}
        seccionesAbiertas={{ magicos: true, magicos_nv_3: true }}
        personajeActivo={{
          ...personajeBase,
          nivelConjuroMaximo: 3,
          puntosConjuroMaximos: 10,
          puntosConjuroGastados: 6
        }}
      />
    );
    expect(htmlPuntos).toContain("Nv. 3 (5 pts)");
    expect(htmlPuntos).toContain("requiere 5 puntos, tienes 4");
    expect(htmlPuntos).toContain('data-sin-recursos="true"');
  });
});
