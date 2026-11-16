import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { usarAlmacenDM, type CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { MonstruoBase, PersonajeJugador } from "@/tipos";
import { TarjetaCriaturaIniciativa, type AccionesTarjetaCriaturaIniciativa } from "./TarjetaCriaturaIniciativa";
import { IniciativaJugador } from "./IniciativaJugador";
import { PanelDetalleCriaturaIniciativa } from "./subcomponentes/PanelDetalleCriaturaIniciativa";
import { SeccionSalvacionArea } from "./subcomponentes/SeccionSalvacionArea";

describe("Integración UI de Iniciativa (DM y Jugador)", () => {
  const estadoInicial = usarAlmacenDM.getState();

  beforeEach(() => {
    usarAlmacenDM.setState({
      colaIniciativa: [],
      indiceTurnoActivo: 0,
      rondaActual: 3,
      personajes: [],
      mostrarPorcentajeVidaAJugadores: true
    });
  });

  afterEach(() => {
    usarAlmacenDM.setState(estadoInicial, true);
  });

  it("TarjetaCriaturaIniciativa soporta el contrato agrupado acciones, muestra Desangrándose, rondas restantes y unidad de horda", () => {
    const hordaHerida: CriaturaIniciativa = {
      id: "mini_horda_1",
      nombre: "Zombis del Pantano",
      iniciativa: 9,
      vidaMaxima: 44,
      vidaActual: 18,
      vidaTemporal: 0,
      ca: 8,
      condiciones: ["Envenenado", "Concentración"],
      efectos: [
        { id: "ef_conc", nombre: "Concentración: Nube Apestosa", concentracion: true },
        { id: "ef_mald", nombre: "Maldición", expiraRonda: 6 }
      ],
      bonificadorIniciativa: -2,
      esMonstruo: true,
      velocidad: "20 pies",
      indiceBarraActiva: 1,
      barrasVida: [
        { id: "b1", vidaActual: 0, vidaMaxima: 22 },
        { id: "b2", vidaActual: 18, vidaMaxima: 22, vidaTemporal: 3 }
      ]
    };

    const accionesAgrupadas: AccionesTarjetaCriaturaIniciativa = {
      salud: { onCurar: vi.fn(), onDañar: vi.fn(), onCambiarTempHP: vi.fn(), onEstablecerVidaMaxima: vi.fn() },
      estado: { onAñadirCondicion: vi.fn(), onQuitarCondicion: vi.fn(), onAñadirEfecto: vi.fn(), onQuitarEfecto: vi.fn() },
      combate: {
        onEliminar: vi.fn(),
        onSeleccionar: vi.fn(),
        onLanzarIniciativa: vi.fn(),
        onEstablecerIniciativa: vi.fn(),
        onLanzarAtaqueRapido: vi.fn(),
        obtenerPercepcionPasiva: () => 12,
        onAlternarRol: vi.fn()
      },
      horda: {
        onConfigurarBarrasHorda: vi.fn(),
        onSeleccionarBarraHorda: vi.fn(),
        onAlternarModoDanoHorda: vi.fn()
      }
    };

    const html = renderToStaticMarkup(
      <TarjetaCriaturaIniciativa
        criatura={hordaHerida}
        esTurnoActivo={true}
        estaSeleccionadaEnTS={true}
        plantilla={null}
        rondaActual={3}
        acciones={accionesAgrupadas}
      />
    );

    expect(html).toContain("Zombis del Pantano");
    expect(html).toContain("ACTIVO");
    expect(html).toContain("SEL");
    expect(html).toContain("DESANGRÁNDOSE");
    expect(html).toContain("ENVENENADO");
    expect(html).toContain("[CON] NUBE APESTOSA");
    expect(html).toContain("MALDICIÓN");
    expect(html).toContain("#2 18");
    expect(html).toContain("+3");
    expect(html).toContain("3r");
  });

  it("IniciativaJugador integra resolverPersonajePorCriatura, obtenerCondicionesVisibles e insignias de horda", () => {
    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj_kaila",
      nombre: "Kaila",
      avatarUrl: "https://ejemplo.local/kaila.png",
      hpMaximo: 40,
      hpActual: 30
    };

    usarAlmacenDM.setState({
      personajes: [pj],
      rondaActual: 2,
      indiceTurnoActivo: 0,
      mostrarPorcentajeVidaAJugadores: true,
      colaIniciativa: [
        {
          id: "mini_kaila",
          nombre: "Kaila",
          iniciativa: 18,
          vidaMaxima: 40,
          vidaActual: 30,
          vidaTemporal: 0,
          ca: 17,
          condiciones: ["Concentración", "Bendición"],
          efectos: [{ id: "ef_concentracion", nombre: "Concentración: Luz del Alba", concentracion: true }],
          bonificadorIniciativa: 3,
          esMonstruo: false,
          velocidad: "30 pies",
          idPersonajeDuenio: "pj_kaila"
        },
        {
          id: "mini_bandidos",
          nombre: "Bandidos",
          iniciativa: 11,
          vidaMaxima: 33,
          vidaActual: 11,
          vidaTemporal: 0,
          ca: 12,
          condiciones: [],
          efectos: [],
          bonificadorIniciativa: 1,
          esMonstruo: true,
          velocidad: "30 pies",
          barrasVida: [
            { id: "bh1", vidaActual: 11, vidaMaxima: 11 },
            { id: "bh2", vidaActual: 0, vidaMaxima: 11 },
            { id: "bh3", vidaActual: 0, vidaMaxima: 11 }
          ]
        }
      ]
    });

    const htmlConPorcentaje = renderToStaticMarkup(<IniciativaJugador />);
    expect(htmlConPorcentaje).toContain("https://ejemplo.local/kaila.png");
    expect(htmlConPorcentaje).toContain("75%");
    expect(htmlConPorcentaje).toContain("1 / 3 en pie");
    expect(htmlConPorcentaje).toContain("[CON] LUZ DEL ALBA");
    expect(htmlConPorcentaje).toContain("BENDICIÓN");
    expect(htmlConPorcentaje).not.toContain("<span>CONCENTRACIÓN</span>");

    usarAlmacenDM.setState({ mostrarPorcentajeVidaAJugadores: false });
    const htmlTextoSalud = renderToStaticMarkup(<IniciativaJugador />);
    expect(htmlTextoSalud).toContain("Saludable");
    expect(htmlTextoSalud).toContain("Herido");
  });

  it("PanelDetalleCriaturaIniciativa y SeccionSalvacionArea renderizan vinculador, ficha y resumen de resultados", () => {
    const criatura: CriaturaIniciativa = {
      id: "mini_det_1",
      nombre: "Oso Lechuza",
      iniciativa: 12,
      vidaMaxima: 59,
      vidaActual: 59,
      ca: 13,
      condiciones: [],
      efectos: [],
      bonificadorIniciativa: 1,
      esMonstruo: true,
      velocidad: "40 pies"
    };

    const htmlSinPlantilla = renderToStaticMarkup(
      <PanelDetalleCriaturaIniciativa
        criatura={criatura}
        plantilla={null}
        baseDatosMonstruos={[]}
        baseDatosHechizos={[]}
        onAsociarPlantilla={vi.fn()}
        onSolicitarDesvincular={vi.fn()}
        onCerrar={vi.fn()}
        onHacerClicHechizo={vi.fn()}
        lanzarAtaqueRapido={vi.fn()}
        lanzarTiradaD20Interactiva={vi.fn()}
        obtenerPercepcionPasiva={() => 13}
      />
    );
    expect(htmlSinPlantilla).toContain("OSO LECHUZA");

    const plantilla = {
      id: "mon_oso_lechuza",
      nombre: "Oso Lechuza",
      tipo: "Monstruosidad",
      tamaño: "Grande",
      alineacion: "Sin alineamiento",
      desafio: "3",
      ca: 13,
      vidaMaxima: 59,
      iniciativaBonificador: 1,
      velocidad: "40 pies",
      caracteristicas: { fuerza: 20, destreza: 12, constitucion: 17, inteligencia: 3, sabiduria: 12, carisma: 7 }
    } as unknown as MonstruoBase;

    const htmlConPlantilla = renderToStaticMarkup(
      <PanelDetalleCriaturaIniciativa
        criatura={criatura}
        plantilla={plantilla}
        baseDatosMonstruos={[plantilla]}
        baseDatosHechizos={[]}
        onAsociarPlantilla={vi.fn()}
        onSolicitarDesvincular={vi.fn()}
        onCerrar={vi.fn()}
        onHacerClicHechizo={vi.fn()}
        lanzarAtaqueRapido={vi.fn()}
        lanzarTiradaD20Interactiva={vi.fn()}
        obtenerPercepcionPasiva={() => 13}
      />
    );
    expect(htmlConPlantilla).toContain("PRUEBAS DE CARACTERÍSTICA");

    const htmlSalvacion = renderToStaticMarkup(
      <SeccionSalvacionArea
        cdSalvacion="15"
        onCambiarCd={vi.fn()}
        caracteristicaSalvacion="destreza"
        onCambiarCaracteristica={vi.fn()}
        mitigacionSalvacion="mitad"
        onCambiarMitigacion={vi.fn()}
        menuAbierto={null}
        onAlternarMenu={vi.fn()}
        onCerrarMenus={vi.fn()}
        onEjecutarSalvacion={vi.fn()}
        onCerrarResultado={vi.fn()}
        resultadoSalvacion={{
          caracteristica: "destreza",
          cd: 15,
          resultados: [
            { id: "c1", nombre: "Trasgo", bono: 2, d20: 9, total: 11, exito: false, dañoSufrido: 14, condicionAplicada: true },
            {
              id: "c2",
              nombre: "Horda Esqueletos",
              bono: 2,
              d20: 13,
              total: 15,
              exito: false,
              dañoSufrido: 21,
              detalleHorda: {
                afectados: 4,
                exitos: 2,
                fallos: 2,
                d20Necesario: 13,
                danoTotalAplicado: 21,
                criaturasPorExito: 2,
                danoPorFallo: 7,
                danoPorExito: 3
              }
            }
          ]
        }}
      />
    );
    expect(htmlSalvacion).toContain("SALVACIÓN");
    expect(htmlSalvacion).toContain("CD 15");
    expect(htmlSalvacion).toContain("FALLO");
    expect(htmlSalvacion).toContain("HORDA (4)");
  });
});
