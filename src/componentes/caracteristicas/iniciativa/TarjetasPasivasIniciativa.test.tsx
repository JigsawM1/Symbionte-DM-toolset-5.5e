import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InsigniasPasivasJugador } from "./InsigniasPasivasJugador";
import { TarjetaCriaturaIniciativa } from "./TarjetaCriaturaIniciativa";
import { obtenerPasivasCriatura } from "@/servicios/resolutorCriaturas";
import { crearIndiceMonstruos } from "@/servicios/indiceMonstruos";
import type { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador } from "@/tipos/personaje";
import type { ColaIniciativaTS } from "@/tipos/talespire";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { sincronizarConEstadoLocal } from "@/servicios/sincronizacionIniciativa";

describe("Visualización de Pasivas de Jugador en Tracker de Iniciativa", () => {
  const pasivasMock = {
    percepcion: 14,
    investigacion: 12,
    perspicacia: 16,
  };

  const criaturaJugadorBase: CriaturaIniciativa = {
    id: "mini_pj_01",
    nombre: "Valeros",
    iniciativa: 15,
    vidaMaxima: 45,
    vidaActual: 40,
    vidaTemporal: 5,
    ca: 18,
    condiciones: [],
    efectos: [],
    bonificadorIniciativa: 2,
    esMonstruo: false,
    velocidad: "30 pies",
    movimientoGastado: 0,
    idPersonajeDuenio: "pj_valeros_id",
    pasivas: pasivasMock,
  };

  const criaturaMonstruoBase: CriaturaIniciativa = {
    id: "mini_monstruo_01",
    nombre: "Goblin Arquero",
    iniciativa: 12,
    vidaMaxima: 15,
    vidaActual: 15,
    vidaTemporal: 0,
    ca: 13,
    condiciones: [],
    efectos: [],
    bonificadorIniciativa: 2,
    esMonstruo: true,
    velocidad: "30 pies",
    movimientoGastado: 0,
  };

  const mockCallbacks = {
    onEliminar: vi.fn(),
    onSeleccionar: vi.fn(),
    onCurar: vi.fn(),
    onDañar: vi.fn(),
    onCambiarTempHP: vi.fn(),
    onAñadirCondicion: vi.fn(),
    onQuitarCondicion: vi.fn(),
    onAñadirEfecto: vi.fn(),
    onQuitarEfecto: vi.fn(),
    onLanzarIniciativa: vi.fn(),
    onEstablecerIniciativa: vi.fn(),
    onLanzarAtaqueRapido: vi.fn(),
    obtenerPercepcionPasiva: vi.fn().mockReturnValue(11),
  };

  describe("Subcomponente InsigniasPasivasJugador", () => {
    it("debe renderizar las 3 insignias con etiquetas PP, INV y PERS y sus valores numéricos", () => {
      const html = renderToStaticMarkup(<InsigniasPasivasJugador pasivas={pasivasMock} />);

      expect(html).toContain("PP");
      expect(html).toContain("14");
      expect(html).toContain("INV");
      expect(html).toContain("12");
      expect(html).toContain("PERS");
      expect(html).toContain("16");

      // Verificación de títulos accesibles
      expect(html).toContain('title="Percepción Pasiva"');
      expect(html).toContain('title="Investigación Pasiva"');
      expect(html).toContain('title="Perspicacia Pasiva"');
    });

    it("debe usar valores por defecto seguros (10) ante datos indefinidos", () => {
      const html = renderToStaticMarkup(<InsigniasPasivasJugador pasivas={{}} />);

      expect(html).toContain("PP");
      expect(html).toContain("10");
      expect(html).toContain("INV");
      expect(html).toContain("10");
      expect(html).toContain("PERS");
      expect(html).toContain("10");
    });
  });

  describe("TarjetaCriaturaIniciativa para Jugadores", () => {
    it("debe renderizar las pasivas en la columna central y en el subtítulo para un Personaje Jugador", () => {
      const html = renderToStaticMarkup(
        <TarjetaCriaturaIniciativa
          criatura={criaturaJugadorBase}
          esTurnoActivo={false}
          plantilla={null}
          pasivasJugador={pasivasMock}
          {...mockCallbacks}
        />
      );

      // Subtítulo con las 3 pasivas
      expect(html).toContain("Percepción Pasiva");
      expect(html).toContain("Investigación Pasiva");
      expect(html).toContain("Perspicacia Pasiva");
      expect(html).toContain("PP:");
      expect(html).toContain("Inv:");
      expect(html).toContain("Pers:");

      // Insignias tácticas en la columna central (sustituyendo el texto inerte)
      expect(html).toContain("PP");
      expect(html).toContain("14");
      expect(html).toContain("INV");
      expect(html).toContain("12");
      expect(html).toContain("PERS");
      expect(html).toContain("16");
    });

    it("no debe renderizar las pasivas de jugador cuando la criatura es un monstruo", () => {
      const html = renderToStaticMarkup(
        <TarjetaCriaturaIniciativa
          criatura={criaturaMonstruoBase}
          esTurnoActivo={false}
          plantilla={null}
          {...mockCallbacks}
        />
      );

      expect(html).not.toContain("Inv:");
      expect(html).not.toContain("Pers:");
      expect(html).not.toContain("Percepción Pasiva: 14");
    });
  });

  describe("Servicio resolutorCriaturas - obtenerPasivasCriatura", () => {
    const personajeCompleto: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj_valeros_id",
      nombre: "Valeros",
      caracteristicas: {
        fuerza: 16,
        destreza: 14,
        constitucion: 14,
        inteligencia: 10,
        sabiduria: 12,
        carisma: 8,
      },
      gradosHabilidades: {
        ...PERSONAJE_POR_DEFECTO.gradosHabilidades,
        percepcion: "competente",
        investigacion: "ninguna",
        perspicacia: "pericia",
      },
    };

    it("debe retornar pasivas cacheadas directamente si la criatura ya las contiene", () => {
      const pasivas = obtenerPasivasCriatura(criaturaJugadorBase, [personajeCompleto]);
      expect(pasivas).toEqual(pasivasMock);
    });

    it("debe resolver el personaje y calcular pasivas si criatura.pasivas es undefined", () => {
      const criaturaSinPasivas: CriaturaIniciativa = {
        ...criaturaJugadorBase,
        pasivas: undefined,
      };

      const pasivas = obtenerPasivasCriatura(criaturaSinPasivas, [personajeCompleto]);
      expect(pasivas).toBeDefined();
      expect(pasivas?.percepcion).toBeGreaterThanOrEqual(10);
      expect(pasivas?.investigacion).toBeGreaterThanOrEqual(10);
      expect(pasivas?.perspicacia).toBeGreaterThanOrEqual(10);
    });

    it("debe retornar null cuando la criatura es un monstruo", () => {
      const pasivas = obtenerPasivasCriatura(criaturaMonstruoBase, [personajeCompleto]);
      expect(pasivas).toBeNull();
    });
  });

  describe("Sincronización TaleSpire - Proyección de Pasivas", () => {
    const personajeValeros: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj_valeros_id",
      nombre: "Valeros",
      idMiniaturaTS: "mini_valeros_ts",
    };

    it("debe asignar pasivas a CriaturaIniciativa al sincronizar desde TaleSpire", () => {
      const colaTS: ColaIniciativaTS = {
        activeItemIndex: 0,
        items: [
          {
            id: "mini_valeros_ts",
            name: "Valeros",
            kind: "creature",
          },
        ],
      };

      const resultado = sincronizarConEstadoLocal({
        colaTS,
        colaLocal: [],
        personajes: [personajeValeros],
        asociacionesFichas: {},
        indiceMonstruos: crearIndiceMonstruos([]),
        metodoVidaMonstruo: "estandar",
        indiceTurnoActivo: 0,
        rondaActual: 1,
      });

      expect(resultado.colaIniciativa).toHaveLength(1);
      const criaturaSincronizada = resultado.colaIniciativa[0];
      expect(criaturaSincronizada.pasivas).toBeDefined();
      expect(criaturaSincronizada.pasivas?.percepcion).toBeGreaterThanOrEqual(10);
      expect(criaturaSincronizada.pasivas?.investigacion).toBeGreaterThanOrEqual(10);
      expect(criaturaSincronizada.pasivas?.perspicacia).toBeGreaterThanOrEqual(10);
    });
  });
});
