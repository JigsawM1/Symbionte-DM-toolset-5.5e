import { beforeEach, describe, expect, it } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { obtenerRasgosClaseYSubclase } from "../gestorClases";
import { deshidratarPersonaje, hidratarPersonaje } from "../serializadorPersonaje";
import { proyectarEstadoCombatePJ } from "../sincronizacion/proyeccionEstadoCombate";
import { serializarEstadoCombatePJ, deserializarEstadoCombatePJ } from "@/tipos/sync";

function personaje(subclase: string) {
  return { ...structuredClone(PERSONAJE_POR_DEFECTO), id: "guerrero_sync", clase: "Guerrero", subclase, nivel: 18,
    clases: [{ nombre: "Guerrero", subclase, nivel: 18 }], rasgos: obtenerRasgosClaseYSubclase("Guerrero", 18, subclase) };
}
describe("Persistencia de rasgos y separación del tracker", () => {
  beforeEach(() => usarAlmacenDM.setState({ personajes: [], colaIniciativa: [] }));
  it.each(["Maestro del Combate", "Campeón", "Caballero Arcano", "Guerrero Psiónico"])("rehidrata %s conservando estado y nuevos contratos", subclase => {
    const pj = personaje(subclase);
    const recurso = pj.rasgos.find(r => r.tieneUsosLimitados)!;
    recurso.usosRestantes = 0;
    const original = structuredClone(pj);
    const resultado = hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(pj))));
    expect(resultado.rasgos.find(r => r.id === recurso.id)!.usosRestantes).toBe(0);
    expect(resultado.rasgos.find(r => r.nombre === "Indómito")!.autoDesactivarAlTirarSalvacion).toBe(true);
    if (subclase === "Caballero Arcano") expect(resultado.rasgos.find(r => r.configuracionMagica)!.configuracionMagica?.tipoLanzador).toBe("tercio");
    if (subclase === "Guerrero Psiónico") expect(resultado.rasgos.find(r => r.nombre === "Maestro telequinético")!.aptitudConjuroGratuito).toBe("inteligencia");
    expect(pj).toEqual(original);
  });
  it("el DTO del tracker transmite resultados de combate y excluye las definiciones de rasgos", () => {
    const pj = personaje("Maestro del Combate");
    const reserva = pj.rasgos.find(r => r.nombre === "Supremacía en combate")!;
    reserva.usosRestantes = 2;
    const dto = proyectarEstadoCombatePJ(pj);
    const wire = serializarEstadoCombatePJ(dto);
    expect(wire).toMatchObject({ id: pj.id, va: pj.hpActual, vm: pj.hpMaximo });
    for (const campo of ["rasgos", "clase", "especie", "caracteristicas", "capacidadesRasgos", "cp"]) {
      expect(dto).not.toHaveProperty(campo);
      expect(wire).not.toHaveProperty(campo);
    }
    usarAlmacenDM.setState({ personajes: [pj] });
    usarAlmacenDM.getState().aplicarBorradorCombatePJ(deserializarEstadoCombatePJ({ ...wire, va: 5 }));
    const recibido = usarAlmacenDM.getState().personajes[0];
    expect(recibido.hpActual).toBe(5);
    expect(recibido.rasgos).toEqual(pj.rasgos);
  });
});
