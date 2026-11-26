import { describe, it, expect } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { EsquemaPersonajeJugador, EsquemaRasgoPersonaje } from "@/tipos";
import { fusionarEstadoRasgo } from "./fusionarEstadoRasgo";
import { deshidratarRasgo } from "../serializadorPersonaje";
import {
  aplicarValorPredefinido,
  obtenerGruposPredefiniblesRasgo,
  resolverSolicitudUnClic,
  resumenRespuestaPredefinida,
  valorPredefinido
} from "./respuestasPredefinidasRasgos";

describe("respuestasPredefinidasRasgos", () => {
  it("ofrece activar y omitir en preguntarAlAtacar sin coste, y solo omitir cuando consume usos", () => {
    const sinCoste = EsquemaRasgoPersonaje.parse({
      id: "ataque_temerario",
      nombre: "Ataque temerario",
      esActivable: true,
      activo: false,
      preguntarAlAtacar: { soloArmaODesarmado: true, caracteristica: "fuerza" }
    });
    const gruposSinCoste = obtenerGruposPredefiniblesRasgo(sinCoste);
    expect(gruposSinCoste).toHaveLength(1);
    expect(gruposSinCoste[0].flujo).toBe("alAtacar");
    expect(gruposSinCoste[0].opciones.map(o => o.valor)).toEqual(["preguntar", "omitir", "activar"]);

    const conCoste = EsquemaRasgoPersonaje.parse({
      id: "golpe_especial",
      nombre: "Golpe especial",
      esActivable: true,
      activo: false,
      tieneUsosLimitados: true,
      usosMaximos: 3,
      usosRestantes: 3,
      preguntarAlAtacar: { soloArmaODesarmado: true }
    });
    const gruposConCoste = obtenerGruposPredefiniblesRasgo(conCoste);
    expect(gruposConCoste).toHaveLength(1);
    expect(gruposConCoste[0].opciones.map(o => o.valor)).toEqual(["preguntar", "omitir"]);
  });

  it("construye grupos de danoIntegrado y efectosTirada con maxMultiple", () => {
    const furiaDivina = EsquemaRasgoPersonaje.parse({
      id: "furia_divina",
      nombre: "Furia divina",
      resolucionAsistida: {
        integrarEnDanoDeArma: true,
        opciones: [
          { id: "radiante", etiqueta: "Radiante", tipo: "dano", tipoDano: "Radiante", formula: "1d6" },
          { id: "necrotico", etiqueta: "Necrótico", tipo: "dano", tipoDano: "Necrótico", formula: "1d6" }
        ]
      }
    });
    const gruposDano = obtenerGruposPredefiniblesRasgo(furiaDivina);
    expect(gruposDano).toHaveLength(1);
    expect(gruposDano[0].flujo).toBe("danoIntegrado");
    expect(gruposDano[0].opciones.map(o => o.valor)).toEqual(["preguntar", "omitir", "auto:radiante", "auto:necrotico"]);

    const golpeBrutal = EsquemaRasgoPersonaje.parse({
      id: "golpe_brutal",
      nombre: "Golpe brutal",
      esActivable: true,
      activo: false,
      preguntarAlAtacar: { soloArmaODesarmado: true, caracteristica: "fuerza" },
      eleccionEfectoEnTirada: {
        momento: "dano",
        maxElecciones: 2,
        opciones: [
          { id: "contundente", nombre: "Golpe contundente" },
          { id: "inmovilizador", nombre: "Golpe inmovilizador" }
        ]
      }
    });
    const gruposBrutal = obtenerGruposPredefiniblesRasgo(golpeBrutal);
    expect(gruposBrutal.map(g => g.flujo)).toEqual(["alAtacar", "efectosTirada"]);
    expect(gruposBrutal[1].maxMultiple).toBe(2);
    expect(gruposBrutal[1].opciones.map(o => o.valor)).toEqual(["preguntar", "contundente", "inmovilizador"]);
  });

  it("aplica valores predefinidos puramente, borra la clave con 'preguntar' y devuelve undefined si queda vacío", () => {
    const paso1 = aplicarValorPredefinido(undefined, "alAtacar", "activar");
    expect(paso1).toEqual({ alAtacar: "activar" });

    const paso2 = aplicarValorPredefinido(paso1, "efectosTirada", ["contundente", "inmovilizador"]);
    expect(paso2).toEqual({ alAtacar: "activar", efectosTirada: ["contundente", "inmovilizador"] });

    const paso3 = aplicarValorPredefinido(paso2, "alAtacar", "preguntar");
    expect(paso3).toEqual({ efectosTirada: ["contundente", "inmovilizador"] });

    const paso4 = aplicarValorPredefinido(paso3, "efectosTirada", []);
    expect(paso4).toBeUndefined();
  });

  it("resuelve en 1 clic solo cuando no tiene coste, ni ataqueConjuro, ni modificador_tirada sin tabla (ignora confirmacion)", () => {
    const rasgoBase = EsquemaRasgoPersonaje.parse({
      id: "asistida_libre",
      nombre: "Aura protectora",
      resolucionAsistida: {
        permitePropio: true,
        opciones: [{ id: "temp", etiqueta: "PG temporales", tipo: "hp_temporal", formula: "5" }]
      },
      respuestaPredefinida: {
        resolucion: { idOpcion: "temp", incluirDados: false, propio: true }
      }
    });
    const pj = EsquemaPersonajeJugador.parse({ ...PERSONAJE_POR_DEFECTO, id: "pj1", rasgos: [rasgoBase] });

    expect(resolverSolicitudUnClic(pj, rasgoBase)).toEqual({
      idRasgo: "asistida_libre",
      idOpcion: "temp",
      incluirDados: false,
      propio: true,
      confirmado: true,
      cantidadPropia: 0,
      tiradaOriginal: 0
    });

    const conCoste = EsquemaRasgoPersonaje.parse({
      ...rasgoBase,
      tieneUsosLimitados: true,
      usosMaximos: 2,
      usosRestantes: 2
    });
    expect(resolverSolicitudUnClic({ ...pj, rasgos: [conCoste] }, conCoste)).toBeUndefined();

    const conConfirmacion = EsquemaRasgoPersonaje.parse({
      ...rasgoBase,
      resolucionAsistida: { ...rasgoBase.resolucionAsistida!, confirmacion: "Requiere estar herido" }
    });
    expect(resolverSolicitudUnClic({ ...pj, rasgos: [conConfirmacion] }, conConfirmacion)?.confirmado).toBe(true);

    const conAtaque = EsquemaRasgoPersonaje.parse({
      ...rasgoBase,
      resolucionAsistida: { ...rasgoBase.resolucionAsistida!, ataqueConjuro: "sabiduria" }
    });
    expect(resolverSolicitudUnClic({ ...pj, rasgos: [conAtaque] }, conAtaque)).toBeUndefined();

    const modificadorTirada = EsquemaRasgoPersonaje.parse({
      id: "mod_tirada",
      nombre: "Golpe guiado",
      resolucionAsistida: {
        opciones: [{ id: "sumar", etiqueta: "+10 al ataque", tipo: "modificador_tirada", formula: "10" }]
      },
      respuestaPredefinida: { resolucion: { idOpcion: "sumar" } }
    });
    expect(resolverSolicitudUnClic({ ...pj, rasgos: [modificadorTirada] }, modificadorTirada)).toBeUndefined();
  });

  it("conserva respuestaPredefinida en fusionarEstadoRasgo y deshidratarRasgo y resume en texto corto", () => {
    const nuevo = EsquemaRasgoPersonaje.parse({
      id: "rasgo_cls_barbaro_furia_divina",
      nombre: "Furia divina",
      origen: "subclase",
      resolucionAsistida: {
        integrarEnDanoDeArma: true,
        opciones: [{ id: "radiante", etiqueta: "Radiante", tipo: "dano", tipoDano: "Radiante", formula: "1d6" }]
      }
    });
    const existente = EsquemaRasgoPersonaje.parse({
      ...nuevo,
      respuestaPredefinida: { danoIntegrado: { modo: "automatico", idOpcion: "radiante" } }
    });

    const fusionado = fusionarEstadoRasgo(nuevo, existente);
    expect(fusionado.respuestaPredefinida).toEqual(existente.respuestaPredefinida);
    expect(valorPredefinido(fusionado, "danoIntegrado")).toBe("auto:radiante");
    expect(resumenRespuestaPredefinida(fusionado)).toBe("Auto: Radiante");

    const deshidratado = deshidratarRasgo(fusionado);
    expect(deshidratado.respuestaPredefinida).toEqual(existente.respuestaPredefinida);
  });
});
