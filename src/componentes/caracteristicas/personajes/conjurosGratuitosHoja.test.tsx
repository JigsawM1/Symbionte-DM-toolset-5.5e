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

  const hechizoHechizarPersona: HechizoBase = {
    id: "hechizo-hechizar-persona",
    nombre: "Hechizar persona",
    nivel: 1,
    escuela: "Encantamiento",
    tiempoLanzamiento: "1 Accion",
    alcance: "30 pies",
    componentesSeleccionados: { verbal: true, somatico: true, material: false },
    duracion: "1 hora",
    concentracion: false,
    ritual: false,
    descripcion: "Intentas hechizar a un humanoide que puedas ver."
  };

  const hechizoImagenMultiple: HechizoBase = {
    id: "hechizo-imagen-multiple",
    nombre: "Imagen múltiple",
    nivel: 2,
    escuela: "Ilusion",
    tiempoLanzamiento: "1 Accion",
    alcance: "Personal",
    componentesSeleccionados: { verbal: true, somatico: true, material: false },
    duracion: "1 minuto",
    concentracion: false,
    ritual: false,
    descripcion: "Creas tres duplicados ilusorios de ti mismo."
  };

  const personajeConMagiaCautivadora: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-bardo-glamour-magia-cautivadora",
    nombre: "Bardo Cautivador",
    clase: "Bardo",
    subclase: "Colegio del Glamour",
    nivel: 3,
    condicionesActivas: [],
    rasgos: [
      EsquemaRasgoPersonaje.parse({
        id: "rasgo_cls_bardo_magia_cautivadora",
        nombre: "Magia cautivadora",
        categoriaMecanica: "consumible",
        tipoAccion: "reaccion",
        tieneUsosLimitados: true,
        usosMaximos: 1,
        usosRestantes: 1,
        recuperacion: "descanso_largo",
        conjurosOtorgados: ["Hechizar persona", "Imagen múltiple"],
        efectos: [
          {
            tipo: "conjuro_otorgado",
            objetivo: "Hechizar persona",
            valor: "siempre_preparado",
            activo: true
          },
          {
            tipo: "conjuro_otorgado",
            objetivo: "Imagen múltiple",
            valor: "siempre_preparado",
            activo: true
          }
        ],
        descripcion: "Siempre tienes preparados Hechizar persona e Imagen múltiple."
      })
    ],
    espaciosConjuroMaximos: { "1": 4, "2": 2 },
    espaciosConjuroGastados: { "1": 0, "2": 0 }
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

    it("muestra el botón 'Gratis' para 'Orden imperiosa' con rasgo Manto de majestad instanciado y activo (incluso con usosRestantes = 0)", () => {
      const pjConRasgoReal: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-bardo-glamour-rasgo-real",
        clase: "Bardo",
        subclase: "Colegio del Glamour",
        nivel: 6,
        condicionesActivas: ["Manto de Majestad (Mantle of Majesty)"],
        rasgos: [
          EsquemaRasgoPersonaje.parse({
            id: "rasgo_manto_majestad",
            nombre: "Manto de majestad",
            tipoAccion: "accion_adicional",
            esActivable: true,
            activo: true,
            tieneUsosLimitados: true,
            usosMaximos: 1,
            usosRestantes: 0,
            condicionAlActivar: "Manto de Majestad (Mantle of Majesty)",
            conjurosOtorgados: ["Orden imperiosa"],
            efectos: [
              {
                tipo: "conjuro_gratuito",
                objetivo: "Orden imperiosa",
                valor: "sin_espacio",
                activo: true
              }
            ]
          })
        ],
        espaciosConjuroMaximos: { "1": 4 },
        espaciosConjuroGastados: { "1": 0 }
      };

      const html = renderToStaticMarkup(
        <SeccionNivelConjuros
          titulo="Nivel 1"
          nivel={1}
          conjurosVisibles={[hechizoOrdenImperiosa]}
          conjurosFiltrados={[hechizoOrdenImperiosa]}
          estaAbierta={true}
          alAlternar={vi.fn()}
          hayFiltrosActivos={false}
          personaje={pjConRasgoReal}
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

    it("NO muestra el botón 'Gratis' para 'Hechizar persona' ni 'Imagen múltiple' con Magia cautivadora", () => {
      const htmlNivel1 = renderToStaticMarkup(
        <SeccionNivelConjuros
          titulo="Nivel 1"
          nivel={1}
          conjurosVisibles={[hechizoHechizarPersona]}
          conjurosFiltrados={[hechizoHechizarPersona]}
          estaAbierta={true}
          alAlternar={vi.fn()}
          hayFiltrosActivos={false}
          personaje={personajeConMagiaCautivadora}
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

      expect(htmlNivel1).not.toContain("<span>Gratis</span>");

      const htmlNivel2 = renderToStaticMarkup(
        <SeccionNivelConjuros
          titulo="Nivel 2"
          nivel={2}
          conjurosVisibles={[hechizoImagenMultiple]}
          conjurosFiltrados={[hechizoImagenMultiple]}
          estaAbierta={true}
          alAlternar={vi.fn()}
          hayFiltrosActivos={false}
          personaje={personajeConMagiaCautivadora}
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

      expect(htmlNivel2).not.toContain("<span>Gratis</span>");
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

    it("NO muestra el botón 'Gratis' para conjuros otorgados como preparados en Magia cautivadora", () => {
      const html = renderToStaticMarkup(
        <SeccionConjurosOcultos
          personaje={personajeConMagiaCautivadora}
          todosConjurosOcultos={[hechizoHechizarPersona, hechizoImagenMultiple]}
          conjurosOcultosFiltrados={[hechizoHechizarPersona, hechizoImagenMultiple]}
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
