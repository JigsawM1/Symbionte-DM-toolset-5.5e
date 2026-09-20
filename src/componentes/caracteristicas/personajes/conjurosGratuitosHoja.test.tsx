import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SeccionNivelConjuros } from "./SeccionNivelConjuros";
import { SeccionConjurosOcultos } from "./conjuros/SeccionConjurosOcultos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { EsquemaRasgoPersonaje } from "@/tipos/rasgos";
import type { HechizoBase, PersonajeJugador } from "@/tipos";

describe("Visualización de Botón 'Gratis' en Panel de Conjuros de la Hoja de Personaje", () => {
  const hechizoOrdenImperiosa: HechizoBase = {
    id: "hechizo-orden-imperiosa",
    nombre: "Orden imperiosa",
    nivel: 1,
    escuela: "Encantamiento",
    tiempoLanzamiento: "1 Accion Adicional",
    alcance: "60 pies",
    componentesSeleccionados: { verbal: true, somatico: false, material: false },
    duracion: "1 ronda",
    concentracion: false,
    ritual: false,
    descripcion: "Das una orden de una palabra a una criatura."
  };

  const hechizoCurarHeridas: HechizoBase = {
    id: "hechizo-curar-heridas",
    nombre: "Curar heridas",
    nivel: 1,
    escuela: "Evocacion",
    tiempoLanzamiento: "1 Accion",
    alcance: "Toque",
    componentesSeleccionados: { verbal: true, somatico: true, material: false },
    duracion: "Instantaneo",
    concentracion: false,
    ritual: false,
    descripcion: "Una criatura recupera puntos de golpe."
  };

  const personajeConMantoMajestad: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-bardo-glamour",
    nombre: "Bardo Glamour",
    clase: "Bardo",
    subclase: "Colegio del Glamour",
    nivel: 6,
    condicionesActivas: ["Manto de Majestad (Mantle of Majesty)"],
    espaciosConjuroMaximos: { "1": 4 },
    espaciosConjuroGastados: { "1": 0 }
  };

  const personajeConRasgoInnato: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-rasgo-innato",
    nombre: "Héroe con Don Mágico",
    clase: "Guerrero",
    nivel: 3,
    condicionesActivas: [],
    rasgos: [
      EsquemaRasgoPersonaje.parse({
        id: "rasgo-don-curacion",
        nombre: "Toque Restaurador",
        tipoAccion: "accion",
        tieneUsosLimitados: true,
        usosMaximos: 1,
        usosRestantes: 1,
        conjurosOtorgados: ["hechizo-curar-heridas"],
        recuperacion: "descanso_largo",
        descripcion: "Puedes lanzar Curar heridas una vez por descanso largo."
      })
    ],
    espaciosConjuroMaximos: {},
    espaciosConjuroGastados: {}
  };

  const personajeSinGratuito: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-bardo-normal",
    nombre: "Bardo Normal",
    clase: "Bardo",
    nivel: 6,
    condicionesActivas: [],
    espaciosConjuroMaximos: { "1": 4 },
    espaciosConjuroGastados: { "1": 0 }
  };

  describe("SeccionNivelConjuros", () => {
    it("muestra el botón 'Gratis' para 'Orden imperiosa' cuando Manto de la Majestad está activo", () => {
      const html = renderToStaticMarkup(
        <SeccionNivelConjuros
          titulo="Nivel 1"
          nivel={1}
          conjurosVisibles={[hechizoOrdenImperiosa, hechizoCurarHeridas]}
          conjurosFiltrados={[hechizoOrdenImperiosa, hechizoCurarHeridas]}
          estaAbierta={true}
          alAlternar={vi.fn()}
          hayFiltrosActivos={false}
          personaje={personajeConMantoMajestad}
          bonoAtaqueMagico={6}
          estaPreparado={() => true}
          esHechizoDeSubclase={() => false}
          requierePreparacion={false}
          esLanzadorPacto={false}
          nivelEspacioPacto={1}
          sistemaMagia="espacios"
          estaBloqueadoPorArmadura={false}
          alAlternarOcultar={vi.fn()}
          alQuitarDeLista={vi.fn()}
          alAbrirDetalleCompleto={vi.fn()}
          alLanzar={vi.fn()}
        />
      );

      // Debe incluir el botón con el texto Gratis
      expect(html).toContain("<span>Gratis</span>");
      // Debe aparecer solo una vez (para Orden imperiosa, no para Curar heridas)
      const conteoGratis = (html.match(/<span>Gratis<\/span>/g) || []).length;
      expect(conteoGratis).toBe(1);
    });

    it("muestra el botón 'Gratis' para 'Curar heridas' cuando proviene de un rasgo innato con usos disponibles", () => {
      const html = renderToStaticMarkup(
        <SeccionNivelConjuros
          titulo="Nivel 1"
          nivel={1}
          conjurosVisibles={[hechizoCurarHeridas]}
          conjurosFiltrados={[hechizoCurarHeridas]}
          estaAbierta={true}
          alAlternar={vi.fn()}
          hayFiltrosActivos={false}
          personaje={personajeConRasgoInnato}
          bonoAtaqueMagico={6}
          estaPreparado={() => true}
          esHechizoDeSubclase={() => false}
          requierePreparacion={false}
          esLanzadorPacto={false}
          nivelEspacioPacto={1}
          sistemaMagia="espacios"
          estaBloqueadoPorArmadura={false}
          alAlternarOcultar={vi.fn()}
          alQuitarDeLista={vi.fn()}
          alAbrirDetalleCompleto={vi.fn()}
          alLanzar={vi.fn()}
        />
      );

      expect(html).toContain("<span>Gratis</span>");
    });

    it("NO muestra el botón 'Gratis' si no hay Manto ni rasgo gratuito activo", () => {
      const html = renderToStaticMarkup(
        <SeccionNivelConjuros
          titulo="Nivel 1"
          nivel={1}
          conjurosVisibles={[hechizoOrdenImperiosa, hechizoCurarHeridas]}
          conjurosFiltrados={[hechizoOrdenImperiosa, hechizoCurarHeridas]}
          estaAbierta={true}
          alAlternar={vi.fn()}
          hayFiltrosActivos={false}
          personaje={personajeSinGratuito}
          bonoAtaqueMagico={6}
          estaPreparado={() => true}
          esHechizoDeSubclase={() => false}
          requierePreparacion={false}
          esLanzadorPacto={false}
          nivelEspacioPacto={1}
          sistemaMagia="espacios"
          estaBloqueadoPorArmadura={false}
          alAlternarOcultar={vi.fn()}
          alQuitarDeLista={vi.fn()}
          alAbrirDetalleCompleto={vi.fn()}
          alLanzar={vi.fn()}
        />
      );

      expect(html).not.toContain("<span>Gratis</span>");
    });
  });

  describe("SeccionConjurosOcultos", () => {
    it("muestra el botón 'Gratis' para un conjuro oculto si el personaje tiene lanzamiento gratuito activo", () => {
      const html = renderToStaticMarkup(
        <SeccionConjurosOcultos
          personaje={personajeConMantoMajestad}
          todosConjurosOcultos={[hechizoOrdenImperiosa]}
          conjurosOcultosFiltrados={[hechizoOrdenImperiosa]}
          estaAbierta={true}
          alAlternar={vi.fn()}
          hayFiltrosActivos={false}
          desocultarTodos={vi.fn()}
          alternarOculto={vi.fn()}
          bonoAtaqueMagico={6}
          estaPreparado={() => true}
          esHechizoDeSubclase={() => false}
          requierePreparacion={false}
          estaBloqueadoPorArmadura={false}
          alAlternarPreparado={vi.fn()}
          alQuitarTruco={vi.fn()}
          alQuitarConjuro={vi.fn()}
          alAbrirDetalleCompleto={vi.fn()}
          alLanzar={vi.fn()}
          esLanzadorPacto={false}
          nivelEspacioPacto={1}
          sistemaMagia="espacios"
        />
      );

      expect(html).toContain("<span>Gratis</span>");
    });

    it("muestra el botón 'Gratis' para un conjuro oculto si proviene de un rasgo innato con usos disponibles", () => {
      const html = renderToStaticMarkup(
        <SeccionConjurosOcultos
          personaje={personajeConRasgoInnato}
          todosConjurosOcultos={[hechizoCurarHeridas]}
          conjurosOcultosFiltrados={[hechizoCurarHeridas]}
          estaAbierta={true}
          alAlternar={vi.fn()}
          hayFiltrosActivos={false}
          desocultarTodos={vi.fn()}
          alternarOculto={vi.fn()}
          bonoAtaqueMagico={6}
          estaPreparado={() => true}
          esHechizoDeSubclase={() => false}
          requierePreparacion={false}
          estaBloqueadoPorArmadura={false}
          alAlternarPreparado={vi.fn()}
          alQuitarTruco={vi.fn()}
          alQuitarConjuro={vi.fn()}
          alAbrirDetalleCompleto={vi.fn()}
          alLanzar={vi.fn()}
          esLanzadorPacto={false}
          nivelEspacioPacto={1}
          sistemaMagia="espacios"
        />
      );

      expect(html).toContain("<span>Gratis</span>");
    });

    it("NO muestra el botón 'Gratis' para conjuros ocultos sin beneficio gratuito", () => {
      const html = renderToStaticMarkup(
        <SeccionConjurosOcultos
          personaje={personajeSinGratuito}
          todosConjurosOcultos={[hechizoCurarHeridas]}
          conjurosOcultosFiltrados={[hechizoCurarHeridas]}
          estaAbierta={true}
          alAlternar={vi.fn()}
          hayFiltrosActivos={false}
          desocultarTodos={vi.fn()}
          alternarOculto={vi.fn()}
          bonoAtaqueMagico={6}
          estaPreparado={() => true}
          esHechizoDeSubclase={() => false}
          requierePreparacion={false}
          estaBloqueadoPorArmadura={false}
          alAlternarPreparado={vi.fn()}
          alQuitarTruco={vi.fn()}
          alQuitarConjuro={vi.fn()}
          alAbrirDetalleCompleto={vi.fn()}
          alLanzar={vi.fn()}
          esLanzadorPacto={false}
          nivelEspacioPacto={1}
          sistemaMagia="espacios"
        />
      );

      expect(html).not.toContain("<span>Gratis</span>");
    });
  });
});
