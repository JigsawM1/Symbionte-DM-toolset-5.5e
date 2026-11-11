import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DialogoConversionEspacios } from "./DialogoConversionEspacios";
import { HudRecursosConversion } from "./HudRecursosConversion";
import { TarjetaFlujoConversion } from "./TarjetaFlujoConversion";
import { TarjetaConfirmacionTurno } from "./TarjetaConfirmacionTurno";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { PersonajeJugador } from "@/tipos";

describe("DialogoConversionEspacios y componentes tácticos", () => {
  const personajeDruida: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-druida-resurgimiento",
    nombre: "Halsin",
    clase: "Druida",
    nivel: 5,
    puntosConjuroMaximos: 133,
    puntosConjuroGastados: 0,
    esLanzador: true,
    clases: [{ nombre: "Druida", subclase: "Tierra", nivel: 5 }],
    rasgos: [
      {
        id: "rasgo_cls_druida_forma_salvaje",
        nombre: "Forma salvaje",
        descripcion: "Puedes usar tu acción para transformarte mágicamente en una bestia.",
        tipoAccion: "accion_adicional",
        categoriaMecanica: "consumible",
        tieneUsosLimitados: true,
        usosMaximos: 4,
        usosRestantes: 4,
        recuperacion: "descanso_corto",
        origen: "clase",
        fuente: "Druida (Nivel 2)",
        personalizado: false,
        activo: true,
        notas: ""
      },
      {
        id: "rasgo_cls_druida_resurgimiento_salvaje",
        nombre: "Resurgimiento salvaje",
        descripcion: "Puedes convertir magia en Forma salvaje o viceversa.",
        tipoAccion: "accion_adicional",
        categoriaMecanica: "consumible",
        tieneUsosLimitados: false,
        recuperacion: "descanso_largo",
        limitePorTurnoPropio: true,
        idRasgoRecurso: "rasgo_cls_druida_forma_salvaje",
        recuperarRecursoAgotadoConEspacio: true,
        conversionEspacios: {
          permiteConvertir: true,
          consumirUsoPropio: true,
          tabla: [
            { nivelEspacio: 1, coste: 1, nivelMinimo: 5 }
          ]
        },
        origen: "clase",
        fuente: "Druida (Nivel 5)",
        personalizado: false,
        activo: true,
        notas: ""
      }
    ]
  };

  const rasgoResurgimiento = personajeDruida.rasgos[1];

  it("HudRecursosConversion renderiza contadores y estados de disponibilidad", () => {
    const html = renderToStaticMarkup(
      <HudRecursosConversion
        nombreRecurso="Forma salvaje"
        disponibles={4}
        maximos={4}
        esModoPuntos={true}
        puntosDisponibles={133}
        puntosMaximos={133}
        totalEspaciosDisponibles={0}
      />
    );

    expect(html).toContain("Forma salvaje");
    expect(html).toContain("4");
    expect(html).toContain("/ 4");
    expect(html).toContain("Completo");
    expect(html).toContain("Puntos de conjuro");
    expect(html).toContain("133");
    expect(html).toContain("Máximo");
  });

  it("TarjetaFlujoConversion ilustra el balance de transmutación de recursos", () => {
    const html = renderToStaticMarkup(
      <TarjetaFlujoConversion
        modo="convertir"
        coste={1}
        unidad="usos"
        esModoPuntos={true}
        costePuntosConversion={2}
        nombreRecurso="Forma salvaje"
        puntosGastados={0}
        puntosCreados={2}
        cantidad={1}
        nivel={1}
        agotado={true}
        recuperacion={0}
      />
    );

    expect(html).toContain("Entregas");
    expect(html).toContain("2 pts");
    expect(html).toContain("Puntos de conjuro consumidos");
    expect(html).toContain("Recuperas");
    expect(html).toContain("+1 uso");
    expect(html).toContain("Forma salvaje");
  });

  it("TarjetaConfirmacionTurno renderiza la opción de confirmación de 1 por turno", () => {
    const alConfirmar = vi.fn();
    const html = renderToStaticMarkup(
      <TarjetaConfirmacionTurno turnoConfirmado={false} alConfirmar={alConfirmar} />
    );

    expect(html).toContain("Primer uso en este turno");
    expect(html).toContain("1 vez / turno");
    expect(html).toContain("Confirmo según las reglas de D&amp;D 2024");
  });

  it("DialogoConversionEspacios renderiza la cabecera táctica y el diálogo completo", () => {
    const html = renderToStaticMarkup(
      <DialogoConversionEspacios
        personaje={personajeDruida}
        rasgo={rasgoResurgimiento}
        alCerrar={vi.fn()}
      />
    );

    expect(html).toContain("Resurgimiento salvaje");
    expect(html).toContain("D&amp;D 5.5e");
    expect(html).toContain("Forma salvaje");
    expect(html).toContain("Entregas");
    expect(html).toContain("Recuperas");
  });
});
