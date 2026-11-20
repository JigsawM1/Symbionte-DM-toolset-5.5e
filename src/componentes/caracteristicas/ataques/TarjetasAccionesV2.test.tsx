import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SeccionHechizosObjetosMagicos } from "./SeccionHechizosObjetosMagicos";
import { SeccionConsumiblesAtaque } from "./SeccionConsumiblesAtaque";
import type { HechizoObjetoMagicoAccion, ConsumibleAccionCalculado } from "./usarCalculoAtaquesJugador";
import type { HechizoBase } from "@/tipos";

const mockHechizosCompendio: HechizoBase[] = [
  {
    id: "proyectil-magico",
    nombre: "Proyectil Mágico",
    nivel: 1,
    escuela: "Evocación",
    tiempoLanzamiento: "1 Acción",
    alcance: "120 pies",
    componentesSeleccionados: { verbal: true, somatico: true, material: false },
    duracion: "Instantáneo",
    concentracion: false,
    ritual: false,
    descripcion: "Tres dardos de fuerza mágica.",
    dadosDaño: "3d4+3",
    tipoDaño: "Fuerza"
  }
];

vi.mock("@/almacen/selectores/usarEstadoHomebrew", () => ({
  usarEstadoHomebrew: () => ({
    baseDatosHechizos: mockHechizosCompendio
  })
}));

describe("TarjetasAccionesV2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SeccionHechizosObjetosMagicos (Flujo Plano A+C)", () => {
    const alLanzar = vi.fn().mockResolvedValue(true);
    const alAbrirDetalle = vi.fn();

    const itemCompendio: HechizoObjetoMagicoAccion = {
      objetoInstanciaId: "varita-1",
      objetoNombre: "Varita de Proyectiles",
      cargasActuales: 5,
      cargasMaximas: 7,
      tipoAccion: "accion",
      hechizo: {
        hechizoId: "proyectil-magico",
        nombre: "Proyectil Mágico",
        costeCargas: 1,
        bonoAtaque: 7
      }
    };

    const itemVoluntadAdicional: HechizoObjetoMagicoAccion = {
      objetoInstanciaId: "anillo-1",
      objetoNombre: "Anillo de Salto",
      cargasActuales: 0,
      cargasMaximas: 0,
      tipoAccion: "accionAdicional",
      hechizo: {
        nombre: "Salto",
        costeCargas: 0
      }
    };

    const itemSinCargasReaccion: HechizoObjetoMagicoAccion = {
      objetoInstanciaId: "capa-1",
      objetoNombre: "Capa Protectora",
      cargasActuales: 0,
      cargasMaximas: 3,
      tipoAccion: "reaccion",
      hechizo: {
        nombre: "Escudo",
        costeCargas: 1,
        cd: 15
      }
    };

    it("renderiza section con divisor ligero cuando mostrarDivisor=true y tarjetas planas sin acordeón", () => {
      const html = renderToStaticMarkup(
        <SeccionHechizosObjetosMagicos
          hechizosObjetosFiltrados={[itemCompendio]}
          mostrarDivisor={true}
          estaBloqueadoPorArmadura={false}
          alLanzar={alLanzar}
        />
      );

      expect(html).toContain("<section");
      expect(html).toContain('aria-label="Hechizos de objetos mágicos"');
      expect(html).toContain("Objetos Mágicos");
      expect(html).not.toContain("aria-expanded=");

      const htmlSinDivisor = renderToStaticMarkup(
        <SeccionHechizosObjetosMagicos
          hechizosObjetosFiltrados={[itemCompendio]}
          mostrarDivisor={false}
          estaBloqueadoPorArmadura={false}
          alLanzar={alLanzar}
        />
      );
      expect(htmlSinDivisor).not.toContain("<section");
      expect(htmlSinDivisor).not.toContain("Objetos Mágicos");
      expect(htmlSinDivisor).toContain("Proyectil Mágico");
    });

    it("muestra botón ficha con título y metadatos del compendio cuando se pasa alAbrirDetalle", () => {
      const html = renderToStaticMarkup(
        <SeccionHechizosObjetosMagicos
          hechizosObjetosFiltrados={[itemCompendio]}
          estaBloqueadoPorArmadura={false}
          alAbrirDetalle={alAbrirDetalle}
          alLanzar={alLanzar}
        />
      );

      expect(html).toContain('title="Ver ficha completa de Proyectil Mágico"');
      expect(html).toContain("Ficha");
      expect(html).toContain("Varita de Proyectiles · Nv. 1 · Evocación · 120 pies");
      expect(html).toContain("3d4+3 Fuerza");
    });

    it("muestra 'A voluntad', badges 'Adicional' y 'Reacción', y estado 'Sin cargas'", () => {
      const html = renderToStaticMarkup(
        <SeccionHechizosObjetosMagicos
          hechizosObjetosFiltrados={[itemVoluntadAdicional, itemSinCargasReaccion]}
          estaBloqueadoPorArmadura={false}
          alLanzar={alLanzar}
        />
      );

      expect(html).toContain("A voluntad");
      expect(html).toContain("Adicional");
      expect(html).toContain("Reacción");
      expect(html).toContain("Sin cargas (0/3)");
    });

    it("muestra 'Bloqueado: Armadura' deshabilitado cuando estaBloqueadoPorArmadura es true", () => {
      const html = renderToStaticMarkup(
        <SeccionHechizosObjetosMagicos
          hechizosObjetosFiltrados={[itemCompendio]}
          estaBloqueadoPorArmadura={true}
          motivoBloqueoArmadura="Sin competencia en armadura pesada"
          alLanzar={alLanzar}
        />
      );

      expect(html).toContain("Bloqueado: Armadura");
      expect(html).toContain('disabled=""');
    });
  });

  describe("SeccionConsumiblesAtaque y TarjetaConsumibleAccion (Flujo Plano A+C)", () => {
    const alUsarConsumible = vi.fn();

    const pocionUltima: ConsumibleAccionCalculado = {
      idInstancia: "pocion-1",
      nombre: "Poción de Curación",
      cantidad: 1,
      tipoAccion: "accionAdicional",
      esPocion: true,
      esCurativo: true,
      formulaCuracion: "2d4+2",
      descripcionUso: "Recupera 2d4+2 PV",
      notas: "Sabor a cereza"
    };

    const pergaminoGenerico: ConsumibleAccionCalculado = {
      idInstancia: "pergamino-1",
      nombre: "Aceite de Filo",
      cantidad: 3,
      tipoAccion: "accion",
      esPocion: false,
      esCurativo: false,
      descripcionUso: "Aumenta el daño del arma",
      notas: "Aplica +1 al ataque y daño durante 1 hora completa"
    };

    it("renderiza section con divisor en vista completa y lista plana sin acordeón al filtrar", () => {
      const html = renderToStaticMarkup(
        <SeccionConsumiblesAtaque
          consumiblesFiltrados={[pocionUltima]}
          mostrarDivisor={true}
          alUsarConsumible={alUsarConsumible}
        />
      );

      expect(html).toContain("<section");
      expect(html).toContain('aria-label="Consumibles y pociones"');
      expect(html).toContain("Consumibles y Pociones");
      expect(html).not.toContain("aria-expanded=");

      const htmlSinDivisor = renderToStaticMarkup(
        <SeccionConsumiblesAtaque
          consumiblesFiltrados={[pocionUltima]}
          mostrarDivisor={false}
          alUsarConsumible={alUsarConsumible}
        />
      );
      expect(htmlSinDivisor).not.toContain("<section");
      expect(htmlSinDivisor).not.toContain("Consumibles y Pociones");
      expect(htmlSinDivisor).toContain("Poción de Curación");
    });

    it("muestra curativo con nota limpia, data-ultima='true' y '×1 · Última' cuando cantidad === 1", () => {
      const html = renderToStaticMarkup(
        <SeccionConsumiblesAtaque
          consumiblesFiltrados={[pocionUltima, pergaminoGenerico]}
          alUsarConsumible={alUsarConsumible}
        />
      );

      expect(html).toContain("×1 · Última");
      expect(html).toContain("×3");
      expect(html).toContain("Recupera 2d4+2 PV");
      expect(html).toContain("Sabor a cereza");
      expect(html).not.toContain("— Sabor a cereza");
      expect(html).toContain("Aplica +1 al ataque y daño durante 1 hora completa");
      expect(html).toContain('data-ultima="true"');
    });
  });
});
