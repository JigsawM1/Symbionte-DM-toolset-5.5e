import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { CabeceraAtaquesJugador } from "./CabeceraAtaquesJugador";

describe("CabeceraAtaquesJugador — Filtros Tácticos Planos A + C", () => {
  it("renderiza las 5 píldoras directas del flujo plano sin Expandir/Contraer ni Activables/Otros", () => {
    const html = renderToStaticMarkup(
      <CabeceraAtaquesJugador
        conteoTotal={11}
        conteoAccion={5}
        conteoAccionAdicional={2}
        conteoReaccion={1}
        conteoConsumibles={3}
        filtro="todas"
        alCambiarFiltro={vi.fn()}
        statsCalculadas={null}
      />
    );

    expect(html).toContain("Acciones de Combate");
    expect(html).toContain("Todas");
    expect(html).toContain("Acción");
    expect(html).toContain("Adicional");
    expect(html).toContain("Reacción");
    expect(html).toContain("Consumibles");

    expect(html).not.toContain("Activables");
    expect(html).not.toContain("Otros...");
    expect(html).not.toContain("Expandir");
    expect(html).not.toContain("Contraer");
  });

  it("expone aria-pressed=\"true\" en el filtro activo y \"false\" en los 4 restantes", () => {
    const html = renderToStaticMarkup(
      <CabeceraAtaquesJugador
        conteoTotal={9}
        conteoAccion={4}
        conteoAccionAdicional={2}
        conteoReaccion={1}
        conteoConsumibles={2}
        filtro="accionAdicional"
        alCambiarFiltro={vi.fn()}
        statsCalculadas={null}
      />
    );

    const coincidenciasTrue = html.match(/aria-pressed="true"/g) || [];
    const coincidenciasFalse = html.match(/aria-pressed="false"/g) || [];
    expect(coincidenciasTrue).toHaveLength(1);
    expect(coincidenciasFalse).toHaveLength(4);
    expect(html).toContain('aria-pressed="true"');
  });

  it("expone role=\"status\" en el banner de penalización por armadura sin competencia", () => {
    const statsConPenalizacion = {
      penalizacionArmadura: {
        sinCompetencia: true,
        armaduraNoCompetente: "Cota de mallas"
      }
    } as unknown as EstadisticasCalculadasPersonaje;

    const html = renderToStaticMarkup(
      <CabeceraAtaquesJugador
        conteoTotal={3}
        conteoAccion={3}
        conteoAccionAdicional={0}
        conteoReaccion={0}
        conteoConsumibles={0}
        filtro="todas"
        alCambiarFiltro={vi.fn()}
        statsCalculadas={statsConPenalizacion}
      />
    );

    expect(html).toContain('role="status"');
    expect(html).toContain("Penalización por Armadura sin Competencia:");
  });
});
