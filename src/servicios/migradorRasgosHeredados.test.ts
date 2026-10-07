import { describe, expect, it, vi } from "vitest";
import type { RasgoPersonaje, SelectorRasgo } from "@/tipos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { sanearPersonaje } from "@/almacen/sanitizacion";
import { logger } from "@/utiles/logger";
import { migrarMetadatosRasgos } from "./migradorRasgosHeredados";
import { resolverIdRasgoObjetivoGasto, resolverRecursosPadre, tieneMedioBonoHabilidades, obtenerDanosSecundariosAtaque, obtenerConjurosOtorgadosPorRasgos } from "./evaluadorEfectosRasgos";

function rasgo(cambios: Partial<RasgoPersonaje> = {}): RasgoPersonaje {
  return { id: "poder", nombre: "Poder propio", descripcion: "", origen: "personalizado", fuente: "Homebrew",
    tipoAccion: "pasivo", tieneUsosLimitados: false, recuperacion: "ninguno", personalizado: true,
    activo: true, notas: "", ...cambios };
}
function selector(cambios: Partial<SelectorRasgo> = {}): SelectorRasgo {
  return { id: "eleccion", tipo: "unico", etiqueta: "Elección", maxSelecciones: 1,
    valorActual: [], opciones: [], ...cambios };
}

describe("Migración de metadatos de rasgos heredados", () => {
  it("permite que el saneador conserve datos anidados inválidos sin romper su respaldo tolerante", () => {
    const advertencia = vi.spyOn(logger, "warn").mockImplementation(() => {});
    try {
      for (const opciones of ["opciones antiguas", [null, { id: 42 }]]) {
        const pj = sanearPersonaje({ ...PERSONAJE_POR_DEFECTO, rasgos: [{
          ...rasgo(), selectores: [{ ...selector(), opciones }]
        }] });
        expect(pj.rasgos[0].selectores?.[0].opciones).toEqual(opciones);
      }
    } finally {
      advertencia.mockRestore();
    }
  });
  it("convierte selectores antiguos antes de los defaults de Zod y conserva las elecciones y usos", () => {
    const antiguo = rasgo({ usosRestantes: 0, selectores: [selector({
      id: "selector_conjuro_nv1_antiguo", etiqueta: "Conjuro Nivel 1", valorActual: ["h_luz"]
    })] });
    const pj = sanearPersonaje({ ...PERSONAJE_POR_DEFECTO, rasgos: [antiguo] });
    expect(pj.rasgos[0].selectores?.[0]).toMatchObject({ tipoSelector: "conjuro", visualizacion: "lista", valorActual: ["h_luz"] });
    expect(pj.rasgos[0].usosRestantes).toBe(0);
    expect(antiguo.selectores?.[0].tipoSelector).toBeUndefined();
  });

  it("respeta los campos explícitos aunque el ID y la etiqueta sugieran otro comportamiento", () => {
    const original = rasgo({ ligadoA: "mi_padre", condicionAlActivar: "Mi condición", selectores: [selector({
      id: "selector_invocacion_conjuro_nv1", etiqueta: "Dote de Conjuro Nivel 1",
      tipoSelector: "general", visualizacion: "normal", maxSelecciones: 2
    })], efectos: [{ tipo: "dano_secundario", objetivo: "todos_ataques", valor: "1d6", descripcion: "Fuego", tipoDano: "Frío" }] });
    const migrado = migrarMetadatosRasgos([original])[0];
    expect(migrado).toMatchObject(original);
    expect(migrado.selectores?.[0].escaladoMaxSelecciones).toBeUndefined();
    expect(migrarMetadatosRasgos([migrado])).toEqual([migrado]);
  });

  it("resuelve una única reserva heredada una vez y los resolutores comparten su ligadoA", () => {
    const padre = rasgo({ id: "reserva", tieneUsosLimitados: true, usosMaximos: 4, usosRestantes: 0, formulaDados: "1d8" });
    const hijo = rasgo({ id: "consumidor", gastarDePadre: true, heredarDadosPadre: true });
    const migrados = migrarMetadatosRasgos([padre, hijo]);
    const pj = { ...PERSONAJE_POR_DEFECTO, rasgos: migrados };
    expect(migrados[1].ligadoA).toBe("reserva");
    expect(resolverIdRasgoObjetivoGasto(migrados[1], migrados)).toBe("reserva");
    expect(resolverRecursosPadre(pj, migrados[1])).toMatchObject({ usosPadre: { restantes: 0, maximos: 4 }, formulaDadosEfectiva: "1d8" });
    expect(resolverIdRasgoObjetivoGasto(hijo, [padre, hijo])).toBe("consumidor");
  });

  it("no escoge una reserva cuando el dato antiguo tiene varios candidatos", () => {
    const migrados = migrarMetadatosRasgos([
      rasgo({ id: "a", tieneUsosLimitados: true }), rasgo({ id: "b", tieneUsosLimitados: true }),
      rasgo({ id: "hijo", gastarDePadre: true })
    ]);
    expect(migrados[2].ligadoA).toBeUndefined();
    expect(resolverIdRasgoObjetivoGasto(migrados[2], migrados)).toBe("hijo");
  });

  it("recupera condiciones, dependencias y efectos de snapshots antiguos", () => {
    const migrados = migrarMetadatosRasgos([
      rasgo({ id: "furia", nombre: "Furia" }), rasgo({ id: "frenesi", nombre: "Frenesí" }),
      rasgo({ id: "aprendiz", nombre: "Jack of all trades" }), rasgo({ id: "vuelo", nombre: "Vuelo dracónico" })
    ]);
    expect(migrados[0].condicionAlActivar).toBe("Furia");
    expect(migrados[1].ligadoA).toBe("furia");
    expect(migrados[3].condicionAlActivar).toBe("Vuelo dracónico");
    expect(tieneMedioBonoHabilidades({ ...PERSONAJE_POR_DEFECTO, rasgos: [migrados[2]] })).toBe(true);
    expect(tieneMedioBonoHabilidades({ ...PERSONAJE_POR_DEFECTO, rasgos: [rasgo({ nombre: "Aprendiz de mucho" })] })).toBe(false);
  });

  it("migra efectos de opciones y selectores anidados sin volver a inferir daño durante la ejecución", () => {
    const antiguo = rasgo({ selectores: [selector({ valorActual: ["opcion"], opciones: [{
      id: "opcion", nombre: "Opción", descripcion: "", efectos: [{ tipo: "dano_secundario", objetivo: "todos_ataques", valor: "1d6", descripcion: "Daño de fuego" }],
      selectores: [selector({ id: "selector_truco_antiguo" })]
    }] })] });
    const migrado = migrarMetadatosRasgos([antiguo])[0];
    expect(migrado.selectores?.[0].opciones[0].efectos?.[0].tipoDano).toBe("Fuego");
    expect(migrado.selectores?.[0].opciones[0].selectores?.[0].tipoSelector).toBe("conjuro");
    const pj = { ...PERSONAJE_POR_DEFECTO, rasgos: [rasgo({ efectos: [{ tipo: "dano_secundario", objetivo: "todos_ataques", valor: "1d6", descripcion: "Daño de fuego" }] })] };
    expect(obtenerDanosSecundariosAtaque(pj, { tipo: "arma", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false })[0].tipoDano).toBe("Adicional");
  });

  it("declara la progresión antigua de invocaciones sin imponerla a selectores nuevos", () => {
    const [antiguo, nuevo] = migrarMetadatosRasgos([
      rasgo({ id: "antiguo", selectores: [selector({ id: "invocaciones_antiguas" })] }),
      rasgo({ id: "nuevo", selectores: [selector({ id: "invocaciones_propias", tipoSelector: "invocacion", maxSelecciones: 2 })] })
    ]);
    expect(antiguo.selectores?.[0].escaladoMaxSelecciones).toContainEqual({ nivelMinimo: 18, valor: 10 });
    expect(nuevo.selectores?.[0].maxSelecciones).toBe(2);
    expect(nuevo.selectores?.[0].escaladoMaxSelecciones).toBeUndefined();
  });

  it("usa el tipo declarado para conjuros y no trata la aptitud de Lanzador ritual como un conjuro", () => {
    const pj = { ...PERSONAJE_POR_DEFECTO, rasgos: [rasgo({ selectores: [
      selector({ id: "selector_aptitud_lanzador_ritual", tipoSelector: "general", valorActual: ["inteligencia"] }),
      selector({ id: "eleccion_neutra", tipoSelector: "conjuro", valorActual: ["h_luz"] })
    ] })] };
    expect(obtenerConjurosOtorgadosPorRasgos(pj)).toEqual(["h_luz"]);
  });
});
