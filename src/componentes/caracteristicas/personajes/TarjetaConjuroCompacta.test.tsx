import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TarjetaConjuroCompacta } from "./TarjetaConjuroCompacta";
import { SeccionNivelConjuros } from "./SeccionNivelConjuros";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { HECHIZOS_INICIALES } from "@/utiles/datosIniciales";
import type { HechizoBase, PersonajeJugador } from "@/tipos";

describe("TarjetaConjuroCompacta - Renderizado y Optimización", () => {
  const hechizoEjemplo = HECHIZOS_INICIALES.find((h) => h.nivel > 0) || HECHIZOS_INICIALES[0];
  const trucoEncontrado = HECHIZOS_INICIALES.find((h) => h.nivel === 0);
  const trucoEjemplo: HechizoBase = trucoEncontrado || {
    ...hechizoEjemplo,
    id: "h_truco_prueba",
    nombre: "Descarga de Prueba",
    nivel: 0,
    escuela: "Evocación",
    tiempoLanzamiento: "1 acción",
    alcance: "120 pies",
    duracion: "Instantáneo",
    descripcion: "Dispara un rayo de energía.",
    clases: ["Hechicero", "Mago"]
  };

  const propsBase = {
    hechizo: hechizoEjemplo,
    nombrePersonaje: "Garrick",
    nivelPersonaje: 3,
    bonoAtaqueMagico: 5,
    bonoDanoMagico: 0,
    modificadorHabilidad: 3,
    estaPreparado: true,
    alAbrirDetalleCompleto: vi.fn(),
    alLanzar: vi.fn()
  };

  it("renderiza correctamente un conjuro estándar con su botón de Lanzar y metadatos", () => {
    const html = renderToStaticMarkup(<TarjetaConjuroCompacta {...propsBase} />);

    expect(html).toContain(hechizoEjemplo.nombre);
    expect(html).toContain("Lanzar");
    expect(html).toContain(hechizoEjemplo.escuela);
  });

  it("renderiza correctamente un truco con escalado de nivel", () => {
    const html = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        hechizo={trucoEjemplo}
        nivelPersonaje={5}
      />
    );

    expect(html).toContain(trucoEjemplo.nombre);
    expect(html).toContain("Lanzar");
  });

  it("muestra badge de ritual si el hechizo es ritual", () => {
    const hechizoRitual: HechizoBase = {
      ...hechizoEjemplo,
      ritual: true
    };

    const html = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        hechizo={hechizoRitual}
      />
    );

    expect(html).toContain("tagRitual");
    expect(html).toContain("Ritual");
  });

  it("muestra badge de concentración si el hechizo requiere concentración", () => {
    const hechizoConcentracion: HechizoBase = {
      ...hechizoEjemplo,
      concentracion: true
    };

    const html = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        hechizo={hechizoConcentracion}
      />
    );

    expect(html).toContain("tagConcentracion");
  });

  it("aplica clase de concentración cuando es la concentración actual del personaje", () => {
    const html = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        esConcentracionActual={true}
      />
    );

    expect(html).toContain("tarjetaConcentracion");
  });

  it("está memoizado con React.memo para prevenir re-renders de listas completas de conjuros", () => {
    // Verificamos que TarjetaConjuroCompacta exponga la estructura de componente memoizado de React
    expect((TarjetaConjuroCompacta as unknown as { $$typeof: symbol }).$$typeof).toBe(
      Symbol.for("react.memo")
    );
  });

  it("renderiza el toggle para mostrar o quitar el conjuro de la pestaña Acciones", () => {
    const htmlInactivo = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        enAcciones={false}
        alAlternarAcciones={vi.fn()}
      />
    );
    expect(htmlInactivo).toContain('aria-pressed="false"');
    expect(htmlInactivo).toContain('title="Mostrar en la pestaña Acciones"');

    const htmlActivo = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        enAcciones={true}
        alAlternarAcciones={vi.fn()}
      />
    );
    expect(htmlActivo).toContain('aria-pressed="true"');
    expect(htmlActivo).toContain('title="Quitar de la pestaña Acciones"');
  });

  it("muestra coste real en puntos para Nivel 3 (5 puntos) y marca sin recursos cuando no alcanzan", () => {
    const hechizoNv3: HechizoBase = {
      ...hechizoEjemplo,
      id: "h_bola_fuego_test",
      nombre: "Bola de Fuego",
      nivel: 3
    };

    const htmlConPuntos = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        hechizo={hechizoNv3}
        sistemaMagia="puntos"
        nivelConjuroMaximo={3}
        puntosConjuroDisponibles={6}
      />
    );
    expect(htmlConPuntos).toContain("Nv. 3 (5 pts)");
    expect(htmlConPuntos).toContain("descuenta 5 puntos");
    expect(htmlConPuntos).not.toContain("descuenta 2 puntos");
    expect(htmlConPuntos).not.toContain('data-sin-recursos="true"');

    const htmlSinPuntos = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        hechizo={hechizoNv3}
        sistemaMagia="puntos"
        nivelConjuroMaximo={3}
        puntosConjuroDisponibles={4}
      />
    );
    expect(htmlSinPuntos).toContain('data-sin-recursos="true"');
    expect(htmlSinPuntos).toContain("botonLanzarSinRecursos");
    expect(htmlSinPuntos).toContain("requiere 5 puntos, tienes 4");
  });

  it("muestra disponibilidad (disp/max) en estándar y pacto, y marca data-sin-recursos sin bloquear el selector", () => {
    const hechizoNv1: HechizoBase = {
      ...hechizoEjemplo,
      id: "h_proyectil_test",
      nombre: "Proyectil Mágico",
      nivel: 1
    };

    const htmlEstandarAgotado = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        hechizo={hechizoNv1}
        espaciosConjuroMaximos={{ "1": 4, "2": 2 }}
        espaciosConjuroGastados={{ "1": 4, "2": 0 }}
      />
    );
    expect(htmlEstandarAgotado).toContain("Nv. 1 (0/4)");
    expect(htmlEstandarAgotado).toContain('data-sin-recursos="true"');
    expect(htmlEstandarAgotado).toContain("Sin ranuras de Nivel 1 disponibles");
    expect(htmlEstandarAgotado).not.toContain('title="Nivel de ranura de lanzamiento (Upcast)" disabled=""');

    const htmlEstandarDisponible = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        hechizo={hechizoNv1}
        espaciosConjuroMaximos={{ "1": 4 }}
        espaciosConjuroGastados={{ "1": 1 }}
      />
    );
    expect(htmlEstandarDisponible).toContain("Nv. 1 (3/4)");
    expect(htmlEstandarDisponible).not.toContain('data-sin-recursos="true"');

    const htmlPacto = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        hechizo={hechizoNv1}
        esLanzadorPacto={true}
        nivelEspacioPacto={3}
        espaciosPactoMaximos={2}
        espaciosPactoGastados={2}
      />
    );
    expect(htmlPacto).toContain("Pacto Nv. 3 (0/2)");
    expect(htmlPacto).toContain('data-sin-recursos="true"');

    // Multiclase: Pacto Nv. 1 agotado, pero hechizo de Nv. 2 usa opción estándar Nv. 2 (3/3)
    const hechizoNv2: HechizoBase = { ...hechizoNv1, id: "h_nv2_test", nombre: "Paso Brumoso", nivel: 2 };
    const htmlMulticlase = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        hechizo={hechizoNv2}
        esLanzadorPacto={true}
        nivelEspacioPacto={1}
        espaciosPactoMaximos={2}
        espaciosPactoGastados={2}
        espaciosConjuroMaximos={{ "1": 4, "2": 3 }}
        espaciosConjuroGastados={{ "1": 1, "2": 0 }}
      />
    );
    expect(htmlMulticlase).toContain("Nv. 2 (3/3)");
    expect(htmlMulticlase).not.toContain('data-sin-recursos="true"');
  });

  it.each([
    { gastadosPacto: 1, sistema: "espacios", gastados: 3, puntos: 0, etiqueta: "Pacto Nv. 1 (1/2)", agotado: false },
    { gastadosPacto: 2, sistema: "espacios", gastados: 0, puntos: 0, etiqueta: "Nv. 1 (3/3)", agotado: false },
    { gastadosPacto: 2, sistema: "puntos", gastados: 3, puntos: 2, etiqueta: "Nv. 1 (2 pts)", agotado: false },
    { gastadosPacto: 2, sistema: "espacios", gastados: 3, puntos: 0, etiqueta: "Nv. 1 (0/3)", agotado: true }
  ] as const)("refleja $etiqueta después de gastar $gastadosPacto ranuras de Pacto", ({
    gastadosPacto, sistema, gastados, puntos, etiqueta, agotado
  }) => {
    const html = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        hechizo={{ ...hechizoEjemplo, nivel: 1 }}
        sistemaMagia={sistema}
        esLanzadorPacto
        nivelEspacioPacto={1}
        espaciosPactoMaximos={2}
        espaciosPactoGastados={gastadosPacto}
        espaciosConjuroMaximos={{ 1: 3 }}
        espaciosConjuroGastados={{ 1: gastados }}
        nivelConjuroMaximo={1}
        puntosConjuroDisponibles={puntos}
      />
    );
    expect(html).toContain(etiqueta);
    expect(html.includes('data-sin-recursos="true"')).toBe(agotado);
    expect(html).not.toContain('disabled=""');
  });

  it("elimina botón Eye redundante, usa StarOff en preparadores, Trash2 en conocidos y oculta el botón si es otorgado", () => {
    const htmlPreparador = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        esPreparador={true}
        alQuitarDeLista={vi.fn()}
      />
    );
    expect(htmlPreparador).not.toContain("Ver ficha completa y opciones de lanzamiento");
    expect(htmlPreparador).not.toContain("lucide-eye");
    expect(htmlPreparador).toContain('title="Despreparar conjuro"');
    expect(htmlPreparador).toContain(`aria-label="Despreparar ${hechizoEjemplo.nombre}"`);
    expect(htmlPreparador).toContain("lucide-star-off");
    expect(htmlPreparador).toContain("<span>Lanzar</span>");

    const htmlConocido = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        esPreparador={false}
        alQuitarDeLista={vi.fn()}
      />
    );
    expect(htmlConocido).toContain('title="Quitar conjuro de la lista del personaje"');
    expect(htmlConocido).toContain(`aria-label="Quitar ${hechizoEjemplo.nombre} de la lista"`);

    const htmlOtorgado = renderToStaticMarkup(
      <TarjetaConjuroCompacta
        {...propsBase}
        esPreparador={true}
        origenBadge="subclase"
        alQuitarDeLista={vi.fn()}
      />
    );
    expect(htmlOtorgado).not.toContain("Despreparar conjuro");
    expect(htmlOtorgado).not.toContain("Quitar conjuro de la lista del personaje");
  });

  it("SeccionNivelConjuros oculta el botón de quitar en conjuros otorgados y pasa esPreparador en preparadores", () => {
    const hechizoNormal: HechizoBase = {
      ...hechizoEjemplo,
      id: "h_normal_sec",
      nombre: "Escudo",
      nivel: 1
    };
    const hechizoSubclase: HechizoBase = {
      ...hechizoEjemplo,
      id: "h_subclase_sec",
      nombre: "Orden imperiosa",
      nivel: 1
    };
    const personaje: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj-clerigo",
      nombre: "Clérigo Prueba",
      espaciosConjuroMaximos: { "1": 3 },
      espaciosConjuroGastados: { "1": 1 }
    };

    const html = renderToStaticMarkup(
      <SeccionNivelConjuros
        titulo="Nivel 1"
        nivel={1}
        esTruco={false}
        conjurosVisibles={[hechizoNormal, hechizoSubclase]}
        conjurosFiltrados={[hechizoNormal, hechizoSubclase]}
        estaAbierta={true}
        alAlternar={vi.fn()}
        hayFiltrosActivos={false}
        personaje={personaje}
        bonoAtaqueMagico={5}
        estaPreparado={() => true}
        esHechizoDeSubclase={(h) => h.id === "h_subclase_sec"}
        obtenerOrigenConjuro={(h) => (h.id === "h_subclase_sec" ? "subclase" : null)}
        esLanzadorPacto={false}
        nivelEspacioPacto={0}
        sistemaMagia="espacios"
        estaBloqueadoPorArmadura={false}
        alAlternarPreparado={vi.fn()}
        alQuitarDeLista={vi.fn()}
        alAbrirDetalleCompleto={vi.fn()}
        alLanzar={vi.fn()}
      />
    );

    expect(html).toContain("Nv. 1 (2/3)");
    expect(html).toContain('aria-label="Despreparar Escudo"');
    expect(html).not.toContain('aria-label="Despreparar Orden imperiosa"');
  });
});
