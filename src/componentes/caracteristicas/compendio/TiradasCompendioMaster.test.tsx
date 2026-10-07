import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TextoEnriquecidoDND } from "@/componentes/comunes";
import { FichaHechizo } from "./FichaHechizo";
import { ListaHomebrew } from "@/componentes/caracteristicas/homebrew/ListaHomebrew";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { MONSTRUOS_INICIALES } from "@/utiles/datosIniciales";
import type { HechizoBase, Arma } from "@/tipos";

describe("Tiradas del Compendio para Master (Sin requerir iniciativa)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usarAlmacenDM.setState({
      esGM: true,
      baseDatosMonstruos: [],
      baseDatosHechizos: [],
      objetosHomebrew: []
    });
  });

  describe("TextoEnriquecidoDND con tiradas interactivas", () => {
    it("convierte fórmulas de dados en botones interactivos cuando permitirTiradas es true", () => {
      const texto = "El arma inflige 2d6 de daño cortante adicional y 1d8+2 de fuego.";
      const html = renderToStaticMarkup(
        <TextoEnriquecidoDND
          texto={texto}
          permitirTiradas={true}
          etiquetaTirada="DM - Espada Llameante"
        />
      );

      expect(html).toContain("dado-interactivo-inline");
      expect(html).toContain("2d6");
      expect(html).toContain("1d8+2");
    });

    it("mantiene el texto plano sin botones interactivos si permitirTiradas es false", () => {
      const texto = "El arma inflige 2d6 de daño cortante adicional.";
      const html = renderToStaticMarkup(
        <TextoEnriquecidoDND
          texto={texto}
          permitirTiradas={false}
        />
      );

      expect(html).not.toContain("dado-interactivo-inline");
      expect(html).toContain("2d6");
    });
  });

  describe("FichaHechizo con lanzamiento habilitado para DM", () => {
    it("muestra la botonera de lanzamiento y mecánicas de combate cuando ocultarLanzamiento es false", () => {
      const hechizoFuego: HechizoBase = {
        id: "bola-de-fuego",
        nombre: "Bola de fuego",
        nivel: 3,
        escuela: "Evocación",
        tiempoLanzamiento: "1 acción",
        alcance: "150 pies",
        componentesSeleccionados: { verbal: true, somatico: true, material: true },
        duracion: "Instantáneo",
        descripcion: "Una brillante ráfaga de fuego que inflige 8d6 de daño.",
        dadosDaño: "8d6",
        tipoDaño: "fuego",
        dadosDañoNivelSuperior: "1d6",
        ritual: false,
        concentracion: false
      };

      const html = renderToStaticMarkup(
        <FichaHechizo
          hechizo={hechizoFuego}
          ocultarLanzamiento={false}
          permitirUpcastLibre={true}
          nombrePersonaje="DM"
          onClose={() => {}}
        />
      );

      expect(html).toContain("Mecánicas de Combate Integradas");
      expect(html).toContain("Tirar Daño en TaleSpire");
      expect(html).toContain("8d6");
      expect(html).toContain("Lanzar con Ranura:");
    });

    it("permite lanzamiento como ritual si el conjuro tiene la propiedad ritual", () => {
      const hechizoRitual: HechizoBase = {
        id: "identificar",
        nombre: "Identificar",
        nivel: 1,
        escuela: "Adivinación",
        tiempoLanzamiento: "1 minuto",
        alcance: "Toque",
        componentesSeleccionados: { verbal: true, somatico: true, material: true },
        duracion: "Instantáneo",
        descripcion: "Descubres las propiedades mágicas de un objeto.",
        ritual: true,
        concentracion: false
      };

      const html = renderToStaticMarkup(
        <FichaHechizo
          hechizo={hechizoRitual}
          ocultarLanzamiento={false}
          permitirUpcastLibre={true}
          nombrePersonaje="DM"
          onClose={() => {}}
        />
      );

      expect(html).toContain("Lanzar como Ritual");
      expect(html).toContain("+10 min, sin gastar ranura");
    });
  });

  describe("ListaHomebrew - Tiradas de Armas y Objetos para Master", () => {
    it("renderiza botones de tirar ataque y daño para armas en el compendio si esGM es true", () => {
      const armaMagica: Arma = {
        id: "espada-larga-mas-uno",
        nombre: "Espada Larga +1",
        categoria: "armas",
        subcategoria: "Marcial",
        rareza: "Poco Común",
        esMagico: true,
        tipoAtaque: "Cuerpo a Cuerpo",
        dadoDano: "1d8",
        tipoDano: "cortante",
        danoVersatil: "1d10",
        modificadorAtaqueDano: 1,
        pesoLb: 3,
        valorPO: 500,
        esConsumible: false,
        equipable: true,
        propiedades: ["Versátil"],
        descripcion: "Una espada afilada mágicamente con +1 al ataque y daño."
      };

      usarAlmacenDM.setState({
        esGM: true,
        objetosHomebrew: [armaMagica]
      });

      const html = renderToStaticMarkup(
        <ListaHomebrew tipoHomebrew="objeto" soloLectura={true} />
      );

      // La lista muestra el arma en el compendio
      expect(html).toContain("Espada Larga +1");
    });

    it("renderiza criaturas en el bestiario del compendio en soloLectura", () => {
      const criaturaPrueba = {
        ...MONSTRUOS_INICIALES[0],
        id: "dragon-rojo-anciano",
        nombre: "Dragón Rojo Anciano"
      };

      usarAlmacenDM.setState({
        esGM: true,
        baseDatosMonstruos: [criaturaPrueba]
      });

      const html = renderToStaticMarkup(
        <ListaHomebrew tipoHomebrew="criatura" soloLectura={true} />
      );

      expect(html).toContain("Dragón Rojo Anciano");
      expect(html).toContain("BESTIARIO DEL COMPENDIO (1)");
    });
  });

  describe("Seguridad de roles: Ocultamiento para Jugadores (esGM: false)", () => {
    it("FichaHechizo no muestra botón de lanzamiento si ocultarLanzamiento es true", () => {
      const hechizoFuego: HechizoBase = {
        id: "bola-de-fuego",
        nombre: "Bola de fuego",
        nivel: 3,
        escuela: "Evocación",
        tiempoLanzamiento: "1 acción",
        alcance: "150 pies",
        componentesSeleccionados: { verbal: true, somatico: true, material: true },
        duracion: "Instantáneo",
        descripcion: "Una brillante ráfaga de fuego que inflige 8d6 de daño.",
        dadosDaño: "8d6",
        tipoDaño: "fuego",
        ritual: false,
        concentracion: false
      };

      const html = renderToStaticMarkup(
        <FichaHechizo
          hechizo={hechizoFuego}
          ocultarLanzamiento={true}
          onClose={() => {}}
        />
      );

      expect(html).not.toContain("Tirar Daño en TaleSpire");
      expect(html).not.toContain("Mecánicas de Combate Integradas");
    });
  });
});
