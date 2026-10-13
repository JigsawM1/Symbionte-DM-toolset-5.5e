import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { obtenerRasgosClaseYSubclase } from "../gestorClases";
import { deshidratarPersonaje, hidratarPersonaje } from "../serializadorPersonaje";
import { proyectarEstadoCombatePJ } from "../sincronizacion/proyeccionEstadoCombate";
import { proyectarCapacidadesRasgos } from "./sincronizarCapacidadesRasgos";
import { EsquemaWireMensajeSync, serializarEstadoCombatePJ, deserializarEstadoCombatePJ, serializarIniciativaDM, deserializarIniciativaDM } from "@/tipos/sync";
import { BufferFragmentosSync, empaquetarEstadoSync } from "../sincronizacion/transporteSync";

function personaje(subclase: string) {
  return { ...structuredClone(PERSONAJE_POR_DEFECTO), id: "guerrero_sync", clase: "Guerrero", subclase, nivel: 18,
    clases: [{ nombre: "Guerrero", subclase, nivel: 18 }], rasgos: obtenerRasgosClaseYSubclase("Guerrero", 18, subclase) };
}
describe("Persistencia y transporte de las capacidades de rasgos", () => {
  beforeEach(() => usarAlmacenDM.setState({ personajes: [], colaIniciativa: [], timestampsModificacionLocal: {} }));
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
  it("transporta metadatos y usos mediante fragmentos completos, sin opciones canónicas duplicadas", () => {
    const pj = personaje("Maestro del Combate");
    const reserva = pj.rasgos.find(r => r.nombre === "Supremacía en combate")!;
    reserva.usosRestantes = 2;
    const dto = proyectarEstadoCombatePJ(pj);
    expect(dto.capacidadesRasgos!.rasgos.find(r => r.selectores?.some(s => s.ubicacion === "seccion"))!.selectores![0].opciones).toEqual([]);
    const mensaje = { v: 2 as const, s: "prueba_guerrero", t: "PJ" as const, d: { ...serializarEstadoCombatePJ(dto), ts: 1000 } };
    const paquetes = empaquetarEstadoSync(mensaje);
    expect(paquetes.every(p => p.length <= 380)).toBe(true);
    const buffer = new BufferFragmentosSync(vi.fn());
    let completo;
    for (const json of paquetes.reverse()) {
      const parte = EsquemaWireMensajeSync.parse(JSON.parse(json));
      if (parte.t !== "FRAG") throw new Error("La ficha de prueba debe fragmentarse.");
      const resultado = buffer.registrar(parte);
      if (resultado.tipo === "completo") completo = resultado.mensaje;
    }
    buffer.limpiar();
    expect(completo?.t).toBe("PJ");
    if (completo?.t !== "PJ") throw new Error("Falta la ficha reensamblada.");
    usarAlmacenDM.setState({ personajes: [{ ...PERSONAJE_POR_DEFECTO, id: pj.id }] });
    usarAlmacenDM.getState().actualizarPersonajeDesdeSync(deserializarEstadoCombatePJ(completo.d));
    const recibido = usarAlmacenDM.getState().personajes[0];
    expect(recibido.rasgos.find(r => r.nombre === "Supremacía en combate")).toMatchObject({ usosRestantes: 2, formulaDados: "1d12" });
    expect(recibido.rasgos.find(r => r.nombre === "Opciones de maniobras")!.selectores![0].opciones).toHaveLength(20);
  });
  it("aplica capacidades del DM al jugador y respeta una edición pendiente", () => {
    const pj = personaje("Guerrero Psiónico");
    usarAlmacenDM.setState({ personajes: [pj] });
    const dm = personaje("Guerrero Psiónico");
    dm.rasgos.find(r => r.nombre === "Poder psiónico")!.usosRestantes = 3;
    const original = { cola: [], indiceTurnoActivo: 0, rondaActual: 1, mostrarPorcentajeVidaAJugadores: false, metodoVidaMonstruo: "maximo",
      capacidadesRasgos: { [pj.id]: proyectarCapacidadesRasgos(dm) } };
    const parsed = EsquemaWireMensajeSync.parse({ v: 2, s: "dm", t: "DM", d: serializarIniciativaDM(original) });
    if (parsed.t !== "DM") throw new Error("Tipo de mensaje inesperado.");
    usarAlmacenDM.getState().aplicarIniciativaDesdeSync(deserializarIniciativaDM(parsed.d));
    expect(usarAlmacenDM.getState().personajes[0].rasgos.find(r => r.nombre === "Poder psiónico")!.usosRestantes).toBe(3);
    usarAlmacenDM.setState({ personajes: [pj], timestampsModificacionLocal: { [pj.id]: 123 } });
    usarAlmacenDM.getState().aplicarIniciativaDesdeSync(deserializarIniciativaDM(parsed.d));
    expect(usarAlmacenDM.getState().personajes[0].rasgos.find(r => r.nombre === "Poder psiónico")!.usosRestantes).toBe(12);
  });
});
