import { describe, it, expect } from 'vitest';
import { serializarEstadoCombatePJ, deserializarEstadoCombatePJ, type EstadoCombatePJ } from '@/tipos/sync';
describe('Compatibilidad del formato guardado de pasivas', () => {
it("omite las pasivas p cuando incluirPasivas es falso y las incluye cuando es verdadero", () => {
      const dto: EstadoCombatePJ = {
        id: "pj-1",
        nombre: "Clérigo",
        iniciativa: 14,
        hpActual: 20,
        hpMaximo: 25,
        hpTemporal: 0,
        ca: 16,
        condiciones: [],
        efectos: [],
        pasivas: {
          percepcion: 14,
          investigacion: 10,
          perspicacia: 15,
        },
      };

      // 1. Emisión regular durante combate (incluirPasivas = false)
      const wireRegular = serializarEstadoCombatePJ(dto, false);
      expect(wireRegular.p).toBeUndefined();

      // 2. Emisión inicial o completa (incluirPasivas = true)
      const wireConPasivas = serializarEstadoCombatePJ(dto, true);
      expect(wireConPasivas.p).toBeDefined();
      expect(wireConPasivas.p?.[0]).toBe(14);
      expect(wireConPasivas.p?.[1]).toBe(10);
      expect(wireConPasivas.p?.[2]).toBe(15);

      // Deserialización maneja correctamente ambos casos
      const recuperadoRegular = deserializarEstadoCombatePJ(wireRegular);
      expect(recuperadoRegular.pasivas.percepcion).toBe(10); // Valor por defecto seguro

      const recuperadoCompleto = deserializarEstadoCombatePJ(wireConPasivas);
      expect(recuperadoCompleto.pasivas.percepcion).toBe(14);
    });
});
