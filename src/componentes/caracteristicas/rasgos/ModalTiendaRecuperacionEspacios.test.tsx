import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ModalTiendaRecuperacionEspacios } from "./ModalTiendaRecuperacionEspacios";
import { calcularPresupuestoRecuperacion } from "@/servicios/rasgos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";

describe("ModalTiendaRecuperacionEspacios", () => {
  const personajeBase: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-mago-1",
    nombre: "Gale",
    clase: "Mago",
    subclase: "Evocador",
    nivel: 5,
    espaciosConjuroMaximos: { "1": 4, "2": 3, "3": 2 },
    espaciosConjuroGastados: { "1": 2, "2": 2, "3": 1 },
    esLanzador: true,
    clases: [{ nombre: "Mago", subclase: "Evocador", nivel: 5 }],
    clasesLanzadoras: [
      {
        clase: "mago",
        nivel: 5,
        tipoLanzador: "completo",
        habilidadConjuro: "inteligencia",
        modeloConjuros: "grimorio"
      }
    ]
  };

  const rasgoRecuperacion: RasgoPersonaje = {
    id: "rasgo_cls_mago_recuperacion_arcana",
    nombre: "Recuperación arcana",
    descripcion: "Puedes recuperar parte de tu energía mágica estudiando tu libro de conjuros.",
    tipoAccion: "especial",
    categoriaMecanica: "consumible",
    tieneUsosLimitados: true,
    usosMaximos: 1,
    usosRestantes: 1,
    recuperacion: "descanso_largo",
    recuperarEspacios: {
      formulaPresupuesto: "ceil(nivel / 2)",
      nivelMaximoEspacio: 5
    },
    origen: "clase",
    fuente: "Mago (Nivel 1)",
    personalizado: false,
    activo: true,
    notas: ""
  };

  it("calcula correctamente el presupuesto de nivel para Mago nivel 5 (ceil(5/2) = 3)", () => {
    const presupuesto = calcularPresupuestoRecuperacion(rasgoRecuperacion, personajeBase);
    expect(presupuesto).toBe(3);
  });

  it("renderiza el modal con el presupuesto total y los espacios gastados", () => {
    const alCerrar = vi.fn();
    const alConfirmar = vi.fn();

    const html = renderToStaticMarkup(
      <ModalTiendaRecuperacionEspacios
        personaje={personajeBase}
        rasgo={rasgoRecuperacion}
        alCerrar={alCerrar}
        alConfirmar={alConfirmar}
      />
    );

    expect(html).toContain("Recuperación de Magia: Recuperación arcana");
    expect(html).toContain("Presupuesto Total");
    expect(html).toContain("3"); // Presupuesto total
    expect(html).toContain("Espacios de Conjuro Gastados");
    expect(html).toContain("Nivel 1 (Coste: 1)");
    expect(html).toContain("Nivel 2 (Coste: 2)");
    expect(html).toContain("Nivel 3 (Coste: 3)");
  });

  it("renderiza mensaje informativo cuando no hay ranuras gastadas", () => {
    const pjSinGastos: PersonajeJugador = {
      ...personajeBase,
      espaciosConjuroGastados: {}
    };

    const html = renderToStaticMarkup(
      <ModalTiendaRecuperacionEspacios
        personaje={pjSinGastos}
        rasgo={rasgoRecuperacion}
        alCerrar={vi.fn()}
        alConfirmar={vi.fn()}
      />
    );

    expect(html).toContain("No tienes espacios de conjuro gastados");
  });

  it("soporta el modo de Puntos de Conjuro (variante DMG) con equivalencias de nivel", () => {
    const pjConPuntos: PersonajeJugador = {
      ...personajeBase,
      puntosConjuroMaximos: 27,
      puntosConjuroGastados: 10
    };

    const html = renderToStaticMarkup(
      <ModalTiendaRecuperacionEspacios
        personaje={pjConPuntos}
        rasgo={rasgoRecuperacion}
        alCerrar={vi.fn()}
        alConfirmar={vi.fn()}
      />
    );

    expect(html).toContain("Puntos de Conjuro");
    expect(html).toContain("Equivalencias de Puntos de Conjuro");
    expect(html).toContain("Reserva actual:");
    expect(html).toContain("+2 pts"); // Nv 1
    expect(html).toContain("+3 pts"); // Nv 2
    expect(html).toContain("+5 pts"); // Nv 3
  });
});
