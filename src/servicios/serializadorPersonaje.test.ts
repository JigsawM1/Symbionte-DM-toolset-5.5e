import { describe, it, expect } from "vitest";
import {
  esRasgoCanonico,
  deshidratarSelector,
  deshidratarRasgo,
  deshidratarPersonaje,
  hidratarPersonaje
} from "./serializadorPersonaje";
import type { PersonajeJugador, RasgoPersonaje, SelectorRasgo } from "@/tipos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import fs from "fs";
import path from "path";

describe("Módulo de Serialización, Deshidratación e Hidratación de Personajes", () => {
  it("identifica correctamente rasgos canónicos vs personalizados", () => {
    const rasgoClase: RasgoPersonaje = {
      id: "rasgo_cls_guerrero_mente_tactica",
      nombre: "Mente táctica",
      descripcion: "Texto largo...",
      origen: "clase",
      fuente: "Guerrero (Nivel 2)",
      tipoAccion: "especial",
      tieneUsosLimitados: false,
      recuperacion: "ninguno",
      personalizado: false,
      activo: true,
      notas: ""
    };

    const rasgoPersonalizado: RasgoPersonaje = {
      id: "rasgo_custom_alas",
      nombre: "Alas de Fuego",
      descripcion: "Vuela 30 pies",
      origen: "personalizado",
      fuente: "Homebrew",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: false,
      recuperacion: "ninguno",
      personalizado: true,
      activo: true,
      notas: ""
    };

    expect(esRasgoCanonico(rasgoClase)).toBe(true);
    expect(esRasgoCanonico(rasgoPersonalizado)).toBe(false);
  });

  it("deshidrata un selector purgando el compendio de opciones y preservando las selecciones", () => {
    const selectorConOpciones: SelectorRasgo = {
      id: "selector_dote_asi",
      tipo: "unico",
      etiqueta: "Dote elegida",
      maxSelecciones: 1,
      valorActual: ["dote_actor"],
      opciones: [
        { id: "dote_actor", nombre: "Actor", descripcion: "Descripción detallada..." },
        { id: "dote_alerta", nombre: "Alerta", descripcion: "Otra descripción..." }
      ]
    };

    const deshidratado = deshidratarSelector(selectorConOpciones);
    expect(deshidratado.opciones).toEqual([]);
    expect(deshidratado.valorActual).toEqual(["dote_actor"]);
    expect(deshidratado.etiqueta).toBe("Dote elegida");
  });

  it("deshidrata un rasgo canónico eliminando textos estáticos y manteniendo estado mutable", () => {
    const rasgoCanonico: RasgoPersonaje = {
      id: "rasgo_cls_bardo_inspiracion_bardica",
      nombre: "Inspiración bárdica",
      descripcion: "Texto enciclopédico de tres párrafos...",
      origen: "clase",
      fuente: "Bardo (Nivel 1)",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      usosMaximos: 4,
      usosRestantes: 2,
      recuperacion: "descanso_corto",
      personalizado: false,
      activo: true,
      notas: "Usar en combate difícil"
    };

    const deshidratado = deshidratarRasgo(rasgoCanonico);
    expect(deshidratado.descripcion).toBe("");
    expect(deshidratado.usosRestantes).toBe(2);
    expect(deshidratado.usosMaximos).toBe(4);
    expect(deshidratado.activo).toBe(true);
    expect(deshidratado.notas).toBe("Usar en combate difícil");
  });

  it("conserva intactos los campos de un rasgo Homebrew personalizado", () => {
    const rasgoHb: RasgoPersonaje = {
      id: "rasgo_hb_espada_ancestral",
      nombre: "Corte Ancestral",
      descripcion: "Realiza un ataque adicional que inflige 1d10 de daño radiante.",
      origen: "personalizado",
      fuente: "Campaña Sombras",
      tipoAccion: "accion",
      tieneUsosLimitados: false,
      recuperacion: "ninguno",
      formulaDados: "1d10",
      personalizado: true,
      activo: true,
      notas: "Arma legendaria"
    };

    const deshidratado = deshidratarRasgo(rasgoHb);
    expect(deshidratado.descripcion).toBe("Realiza un ataque adicional que inflige 1d10 de daño radiante.");
    expect(deshidratado.formulaDados).toBe("1d10");
    expect(deshidratado.personalizado).toBe(true);
  });

  it("deshidrata e hidrata un personaje reconstruyendo descripciones y efectos desde el compendio", () => {
    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj_prueba_deshidratacion",
      nombre: "Elendir",
      especie: "Elfo",
      subespecie: "Alto elfo",
      clase: "Bardo",
      nivel: 4,
      rasgos: [
        {
          id: "rasgo_cls_bardo_inspiracion_bardica",
          nombre: "Inspiración bárdica",
          descripcion: "Texto estático",
          origen: "clase",
          fuente: "Bardo (Nivel 1)",
          tipoAccion: "accion_adicional",
          tieneUsosLimitados: true,
          usosMaximos: 4,
          usosRestantes: 1,
          recuperacion: "descanso_corto",
          personalizado: false,
          activo: true,
          notas: "Recargar pronto"
        },
        {
          id: "rasgo_cls_bardo_mejora_de_caracteristica_nv4",
          nombre: "Mejora de característica",
          descripcion: "Texto estático",
          origen: "clase",
          fuente: "Bardo (Nivel 4)",
          tipoAccion: "pasivo",
          tieneUsosLimitados: false,
          recuperacion: "ninguno",
          personalizado: false,
          selectores: [
            {
              id: "selector_dote_asi_bardo_nv4",
              tipo: "unico",
              etiqueta: "Dote elegida",
              maxSelecciones: 1,
              valorActual: ["dote_actor"],
              opciones: [{ id: "dote_actor", nombre: "Actor", descripcion: "..." }]
            }
          ],
          activo: true,
          notas: ""
        }
      ]
    };

    // 1. Deshidratar
    const deshidratado = deshidratarPersonaje(pj);
    const rasgoInsp = deshidratado.rasgos.find((r) => r.id === "rasgo_cls_bardo_inspiracion_bardica");
    expect(rasgoInsp?.descripcion).toBe("");
    expect(rasgoInsp?.usosRestantes).toBe(1);

    const rasgoAsi = deshidratado.rasgos.find((r) => r.id === "rasgo_cls_bardo_mejora_de_caracteristica_nv4");
    expect(rasgoAsi?.selectores?.[0].opciones).toEqual([]);
    expect(rasgoAsi?.selectores?.[0].valorActual).toEqual(["dote_actor"]);

    // 2. Hidratar
    const hidratado = hidratarPersonaje(deshidratado);
    const rasgoInspHidratado = hidratado.rasgos.find((r) => r.id === "rasgo_cls_bardo_inspiracion_bardica");
    expect(rasgoInspHidratado?.descripcion.length).toBeGreaterThan(20);
    expect(rasgoInspHidratado?.usosRestantes).toBe(1); // Mantiene los usos consumidos por el jugador
    expect(rasgoInspHidratado?.notas).toBe("Recargar pronto");

    // Debe haber regenerado la dote vinculada en la sección de dotes
    const doteActor = hidratado.rasgos.find((r) => r.id.startsWith("dote_asi_") && r.nombre === "Actor");
    expect(doteActor).toBeDefined();
    expect(doteActor?.descripcion.length).toBeGreaterThan(20);
  });

  it("verifica la reducción drástica de tamaño (>80%) con los datos reales de respaldo.yaml", () => {
    const rutaRespaldo = path.resolve(__dirname, "../../respaldo.yaml");
    if (!fs.existsSync(rutaRespaldo)) return;

    const datosCrudos = JSON.parse(fs.readFileSync(rutaRespaldo, "utf8"));
    const personajesCrudos = datosCrudos.personajes as PersonajeJugador[];
    expect(personajesCrudos.length).toBeGreaterThan(0);

    // Como respaldo.yaml ya contiene personajes deshidratados por la exportación,
    // los hidratamos primero para recrear su estado completo en memoria con selectores y descripciones
    const personajesCompletos = personajesCrudos.map(hidratarPersonaje);
    const pesoOriginal = Buffer.byteLength(JSON.stringify(personajesCompletos));

    const personajesDeshidratados = personajesCompletos.map(deshidratarPersonaje);
    const pesoDeshidratado = Buffer.byteLength(JSON.stringify(personajesDeshidratados));

    const porcentajeReduccion = ((pesoOriginal - pesoDeshidratado) / pesoOriginal) * 100;
    expect(porcentajeReduccion).toBeGreaterThan(80);

    // Rehidratar y comprobar que ningún personaje perdió sus rasgos ni sus selecciones
    for (const pDeshid of personajesDeshidratados) {
      const pHidratado = hidratarPersonaje(pDeshid);
      expect(pHidratado.rasgos.length).toBeGreaterThan(0);
      for (const r of pHidratado.rasgos) {
        if (esRasgoCanonico(r)) {
          expect(r.descripcion.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
