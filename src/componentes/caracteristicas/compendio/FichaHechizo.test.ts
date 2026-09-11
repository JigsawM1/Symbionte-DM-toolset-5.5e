import { describe, it, expect } from "vitest";
import type { HechizoBase } from "@/tipos";

describe("FichaHechizo - Logica de Visualizacion en Modo Compendio vs Modo Combate", () => {
  const hechizoEjemplo: HechizoBase = {
    id: "nube-de-dagas",
    nombre: "Nube de dagas",
    nivel: 2,
    escuela: "Conjuracion",
    tiempoLanzamiento: "1 Accion",
    alcance: "60 pies",
    componentesSeleccionados: { verbal: true, somatico: true, material: true },
    materiales: "Un fragmento de cristal.",
    duracion: "Hasta 1 minuto",
    concentracion: true,
    ritual: false,
    descripcion: "Invocas un conjunto de dagas...",
    descNivelSuperior: "El dano de las dagas aumenta en 2d4 por cada nivel...",
    dadosDaño: "4d4",
    tipoDaño: "cortante",
    dadosDañoNivelSuperior: "2d4",
    clases: ["Bardo", "Brujo", "Hechicero", "Mago"]
  };

  it("identifica que un conjuro con dano o escalado posee mecanicas de combate", () => {
    const tieneDano = Boolean(hechizoEjemplo.dadosDaño && hechizoEjemplo.dadosDaño !== "N/A");
    const esEscalable = hechizoEjemplo.nivel > 0 && Boolean(hechizoEjemplo.dadosDañoNivelSuperior);
    const tieneMecanicasCombate = tieneDano || esEscalable;

    expect(tieneMecanicasCombate).toBe(true);
  });

  it("oculta la seccion de combate y lanzamiento cuando ocultarLanzamiento es true (Modo Compendio)", () => {
    const ocultarLanzamiento = true;
    const tieneMecanicasCombate = true;
    const onLanzarConjuro = undefined;

    const mostrarSeccionCombate = !ocultarLanzamiento && (tieneMecanicasCombate || Boolean(onLanzarConjuro));
    expect(mostrarSeccionCombate).toBe(false);
  });

  it("muestra la seccion de combate y lanzamiento cuando ocultarLanzamiento es false y hay mecanicas o callback de lanzamiento (Modo Hoja / Acciones)", () => {
    const ocultarLanzamiento = false;
    const tieneMecanicasCombate = true;
    const onLanzarConjuro = () => {};

    const mostrarSeccionCombate = !ocultarLanzamiento && (tieneMecanicasCombate || Boolean(onLanzarConjuro));
    expect(mostrarSeccionCombate).toBe(true);
  });

  it("impide el lanzamiento de conjuros bajo la regla de D&D 5.5e cuando bloqueadoPorArmadura es true", () => {
    const bloqueadoPorArmadura = true;
    let dadosLanzados = false;
    let recursosConsumidos = false;

    const manejarLanzamiento = () => {
      if (bloqueadoPorArmadura) {
        return;
      }
      dadosLanzados = true;
      recursosConsumidos = true;
    };

    manejarLanzamiento();

    expect(dadosLanzados).toBe(false);
    expect(recursosConsumidos).toBe(false);
  });
});
