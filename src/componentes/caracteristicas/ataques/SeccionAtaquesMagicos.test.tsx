import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SeccionAtaquesMagicos } from "./SeccionAtaquesMagicos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { EsquemaRasgoPersonaje } from "@/tipos/rasgos";
import type { HechizoBase, PersonajeJugador } from "@/tipos";
import type { ConjuroAccionElemento } from "./usarCalculoAtaquesJugador";

describe("SeccionAtaquesMagicos — Flujo Plano A + C de Conjuros Fijados", () => {
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
    { hechizo: conjuroMisil, tipoAccion: "accion" },
    { hechizo: trucoDescarga, tipoAccion: "accion" },
    { hechizo: conjuroEscudo, tipoAccion: "reaccion" }
  ];

  const propsBase = {
    conjurosFiltrados: conjurosFiltradosBase,
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

  it("renderiza conjuros en flujo plano ordenados por nivel sin acordeones ni subniveles colapsables", () => {
    const html = renderToStaticMarkup(<SeccionAtaquesMagicos {...propsBase} />);

    expect(html).toContain("<section");
    expect(html).toContain('aria-label="Conjuros y acciones mágicas"');
    expect(html).toContain("Magia de Combate</h3>");
    expect(html).not.toContain("Conjuros y Acciones Mágicas");
    expect(html).not.toContain("Trucos Listos");
    expect(html).not.toContain("Conjuros Ocultos");
    expect(html).not.toContain("Clic para mostrar u ocultar");

    // Truco nivel 0 aparece antes que los de nivel 1 aunque llegase después en el array
    const posDescarga = html.indexOf("Descarga de Fuego");
    const posEscudo = html.indexOf("Escudo");
    const posMisil = html.indexOf("Proyectil Mágico");
    expect(posDescarga).toBeGreaterThan(-1);
    expect(posEscudo).toBeGreaterThan(posDescarga);
    expect(posMisil).toBeGreaterThan(posEscudo);
    expect(html).toContain('title="Quitar de la pestaña Acciones"');
  });

  it("omite el divisor ligero cuando mostrarDivisor es false", () => {
    const html = renderToStaticMarkup(
      <SeccionAtaquesMagicos {...propsBase} mostrarDivisor={false} />
    );

    expect(html).not.toContain("<section");
    expect(html).not.toContain("Magia de Combate");
    expect(html).toContain("Descarga de Fuego");
    expect(html).toContain("Proyectil Mágico");
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
      <SeccionAtaquesMagicos {...propsBase} conjurosFiltrados={[]} />
    );

    expect(html).toBe("");
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
      <SeccionAtaquesMagicos {...propsBase} personajeActivo={personajeConPreparado} />
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
