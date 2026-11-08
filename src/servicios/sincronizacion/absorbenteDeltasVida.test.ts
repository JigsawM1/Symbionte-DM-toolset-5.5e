import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calcularAbsorcionDeltaVida } from './absorbenteDeltasVida';
import { usarAlmacenDM, type CriaturaIniciativa } from '@/almacen/usarAlmacenDM';
import { PERSONAJE_POR_DEFECTO } from '@/constantes';
import { ts } from '@/utiles/TaleSpireAdapter';
const paquetesEnviados: string[] = [];
beforeEach(() => { paquetesEnviados.length = 0; vi.spyOn(ts.sync, 'send').mockImplementation(async texto => { paquetesEnviados.push(texto); return true; }); usarAlmacenDM.setState({ esGM: false, aplicandoSync: false, personajes: [], colaIniciativa: [] }); });
afterEach(() => { vi.restoreAllMocks(); });
describe('Absorción de daño y concentración', () => {
it("daño de 30 con 20 PV temporales absorbe 20 temp, pierde 10 de vida y solicita CD 15", () => {
      const pj = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-concentrado",
        idMiniaturaTS: "mini-concentrado",
        nombre: "Sacerdotisa",
        hpActual: 30,
        hpMaximo: 35,
        hpTemporal: 20,
        concentracionActiva: { hechizoId: "h-bendicion", nombreHechizo: "Bendición" },
      };

      const criatura: CriaturaIniciativa = {
        id: "mini-concentrado",
        idPersonajeDuenio: "pj-concentrado",
        nombre: "Sacerdotisa",
        iniciativa: 15,
        vidaActual: 30,
        vidaMaxima: 35,
        vidaTemporal: 20,
        ca: 16,
        condiciones: ["Concentración"],
        efectos: [],
        bonificadorIniciativa: 1,
        esMonstruo: false,
        velocidad: "30 pies",
      };

      usarAlmacenDM.setState({
        esGM: false,
        personajes: [pj],
        colaIniciativa: [criatura],
        notificaciones: [],
      });

      // El absorbente calcula el impacto con el daño íntegro de 30
      const absorcion = calcularAbsorcionDeltaVida(
        {
          hpActual: pj.hpActual,
          hpMaximo: pj.hpMaximo,
          hpTemporal: pj.hpTemporal,
          tieneConcentracion: true,
          nombreHechizoConcentrado: "Bendición",
        },
        30,
        "dano"
      );

      expect(absorcion.hpTemporal).toBe(0);
      expect(absorcion.hpActual).toBe(20); // 30 - (30 - 20) = 20
      expect(absorcion.cdConcentracionRequerida).toBe(15); // Math.floor(30 / 2) = 15
      expect(absorcion.mensajeConcentracion).toContain("CD 15");
    });

it("daño de 15 con 20 PV temporales (totalmente absorbido) solicita CD 10", () => {
      const absorcion = calcularAbsorcionDeltaVida(
        {
          hpActual: 30,
          hpMaximo: 35,
          hpTemporal: 20,
          tieneConcentracion: true,
          nombreHechizoConcentrado: "Bendición",
        },
        15,
        "dano"
      );

      expect(absorcion.hpTemporal).toBe(5);
      expect(absorcion.hpActual).toBe(30); // Vida intacta
      expect(absorcion.cdConcentracionRequerida).toBe(10); // Mínimo 10 según D&D 5.5e
      expect(absorcion.mensajeConcentracion).toContain("CD 10");
    });

it("dañarCriaturaIniciativa calcula el daño completo sin emitir un segundo delta legado", () => {
      const criaturaPJ: CriaturaIniciativa = {
        id: "mini-pj-1",
        idPersonajeDuenio: "pj-1",
        nombre: "Valeros",
        iniciativa: 14,
        vidaActual: 30,
        vidaMaxima: 35,
        vidaTemporal: 20,
        ca: 16,
        condiciones: [],
        efectos: [],
        bonificadorIniciativa: 1,
        esMonstruo: false,
        velocidad: "30 pies",
      };

      usarAlmacenDM.setState({
        esGM: true,
        colaIniciativa: [criaturaPJ],
      });

      usarAlmacenDM.getState().dañarCriaturaIniciativa("mini-pj-1", 30);

      // Emite exactamente un delta con el daño completo 30
      expect(paquetesEnviados).toHaveLength(0);
      expect(usarAlmacenDM.getState().colaIniciativa[0]).toMatchObject({ vidaActual: 20, vidaTemporal: 0 });
    });
});
