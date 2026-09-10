import { describe, it, expect } from "vitest";
import {
  obtenerRasgosSugeridosPorEspecie,
  obtenerRasgosSugeridosPorClases,
  obtenerTodasDotesCanonicas,
  sincronizarRasgosAutomaticos
} from "./compendioRasgos";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";

describe("Compendio y Sincronizador de Rasgos D&D 5.5e", () => {
  it("resuelve los rasgos de especie para Elfo", () => {
    const rasgosElfo = obtenerRasgosSugeridosPorEspecie("Elfo", "Alto Elfo");
    expect(rasgosElfo.length).toBeGreaterThan(0);
    const nombres = rasgosElfo.map((r) => r.nombre);
    expect(nombres).toContain("Visión en la oscuridad");
    expect(nombres).toContain("Linaje feérico");
    expect(nombres).toContain("Trance");
  });

  it("resuelve los rasgos de clase para Guerrero de Nivel 3", () => {
    const rasgosGuerrero = obtenerRasgosSugeridosPorClases([
      { nombre: "Guerrero", subclase: "Campeón", nivel: 3 }
    ]);
    expect(rasgosGuerrero.length).toBeGreaterThan(0);
    const nombres = rasgosGuerrero.map((r) => r.nombre);
    expect(nombres).toContain("Estilo de combate");
    expect(nombres).toContain("Tomar aliento");
    expect(nombres).toContain("Maestría con armas");
    expect(nombres).toContain("Acción súbita");
    expect(nombres).toContain("Mente táctica");
    expect(nombres).toContain("Crítico mejorado");
    expect(nombres).toContain("Atleta sobresaliente");

    // No debe incluir rasgos de niveles superiores (ej. Indómito a nivel 9)
    expect(nombres).not.toContain("Indómito");
  });

  it("sincroniza automáticamente los rasgos de un personaje preservando los personalizados", () => {
    const rasgoHomebrew: RasgoPersonaje = {
      id: "rasgo_hb_custom_1",
      nombre: "Bendición de Dragón",
      descripcion: "Otorga alas de fuego temporales.",
      origen: "personalizado",
      fuente: "Homebrew",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      usosMaximos: 3,
      usosRestantes: 2,
      recuperacion: "descanso_corto",
      personalizado: true,
      activo: true,
      notas: "Uso táctico"
    };

    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj_test_1",
      nombre: "Kaelen",
      especie: "Humano",
      clase: "Guerrero",
      nivel: 2,
      rasgos: [rasgoHomebrew]
    };

    const sincronizados = sincronizarRasgosAutomaticos(pj);
    expect(sincronizados.length).toBeGreaterThan(1);

    // Debe conservar el rasgo homebrew intacto
    const encontradoHb = sincronizados.find((r) => r.id === "rasgo_hb_custom_1");
    expect(encontradoHb).toBeDefined();
    expect(encontradoHb?.usosRestantes).toBe(2);

    // Debe haber añadido los rasgos de Humano y Guerrero
    const nombres = sincronizados.map((r) => r.nombre);
    expect(nombres).toContain("Ingenio ingenioso");
    expect(nombres).toContain("Tomar aliento");
    expect(nombres).toContain("Acción súbita");
  });

  it("expone el compendio de dotes canónicas", () => {
    const dotes = obtenerTodasDotesCanonicas();
    expect(dotes.length).toBeGreaterThan(0);
    const nombres = dotes.map((d) => d.nombre);
    expect(nombres).toContain("Alerta");
    expect(nombres).toContain("Afortunado");
    expect(nombres).toContain("Tirador de Primera (Sharpshooter)");
  });
});
