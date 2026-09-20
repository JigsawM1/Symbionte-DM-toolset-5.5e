import { describe, it, expect } from "vitest";
import {
  crearResolutorOrigenConjuros,
  resolverOrigenConjuro
} from "./resolutorOrigenConjuros";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { PersonajeJugador, HechizoBase, RasgoPersonaje } from "@/tipos";

describe("crearResolutorOrigenConjuros - Evaluación Pre-indexada O(1)", () => {
  const dummyHechizo = (id: string, nombre: string, nivel: number = 1): HechizoBase => ({
    id,
    nombre,
    nivel,
    escuela: "Evocacion",
    tiempoLanzamiento: "1 Accion",
    alcance: "60 pies",
    componentesSeleccionados: { verbal: true, somatico: true, material: false },
    duracion: "Instantaneo",
    concentracion: false,
    ritual: false,
    descripcion: "Hechizo de prueba para verificación de origen."
  });

  const crearRasgoPrueba = (parcial: Partial<RasgoPersonaje> & { id: string; nombre: string }): RasgoPersonaje => ({
    descripcion: "",
    origen: "clase",
    fuente: "",
    tipoAccion: "pasivo",
    tieneUsosLimitados: false,
    personalizado: false,
    recuperacion: "ninguno",
    activo: true,
    notas: "",
    ...parcial
  });

  it("retorna null si el personaje es nulo o indefinido", () => {
    const resolutor = crearResolutorOrigenConjuros(null);
    expect(resolutor(dummyHechizo("h-luz", "Luz"))).toBeNull();

    const resolutorUndefined = crearResolutorOrigenConjuros(undefined);
    expect(resolutorUndefined(dummyHechizo("h-luz", "Luz"))).toBeNull();
  });

  it("retorna null si el hechizo es nulo o indefinido", () => {
    const pj: PersonajeJugador = { ...PERSONAJE_POR_DEFECTO };
    const resolutor = crearResolutorOrigenConjuros(pj);
    expect(resolutor(null)).toBeNull();
    expect(resolutor(undefined)).toBeNull();
  });

  it("clasifica un conjuro otorgado por un rasgo activo con origen clase", () => {
    const rasgoClase = crearRasgoPrueba({
      id: "rasgo-magia-divina",
      nombre: "Magia Divina",
      origen: "clase",
      fuente: "Clérigo",
      conjurosOtorgados: ["Bendecir", "Curar heridas"]
    });

    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      rasgos: [rasgoClase]
    };

    const resolutor = crearResolutorOrigenConjuros(pj);
    expect(resolutor(dummyHechizo("h-bendecir", "Bendecir"))).toBe("clase");
    expect(resolutor(dummyHechizo("h-curar-heridas", "Curar Heridas"))).toBe("clase");
    expect(resolutor(dummyHechizo("h-rayo", "Rayo"))).toBeNull();
  });

  it("ignora rasgos inactivos o cuyo nivelRequerido sea mayor al nivel del personaje", () => {
    const rasgoInactivo = crearRasgoPrueba({
      id: "rasgo-inactivo",
      nombre: "Rasgo Inactivo",
      fuente: "Mago",
      activo: false,
      conjurosOtorgados: ["Escudo"]
    });

    const rasgoNivelAlto = crearRasgoPrueba({
      id: "rasgo-nivel-alto",
      nombre: "Rasgo Nivel 15",
      fuente: "Mago",
      nivelRequerido: 15,
      activo: true,
      conjurosOtorgados: ["Desintegrar"]
    });

    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      nivel: 5,
      rasgos: [rasgoInactivo, rasgoNivelAlto]
    };

    const resolutor = crearResolutorOrigenConjuros(pj);
    expect(resolutor(dummyHechizo("h-escudo", "Escudo"))).toBeNull();
    expect(resolutor(dummyHechizo("h-desintegrar", "Desintegrar"))).toBeNull();
  });

  it("clasifica conjuros otorgados por la subclase de forma dinámica", () => {
    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      clase: "Clérigo",
      subclase: "Dominio de la Vida",
      clases: [{ nombre: "Clérigo", subclase: "Dominio de la Vida", nivel: 3 }],
      nivel: 3
    };

    const resolutor = crearResolutorOrigenConjuros(pj);
    const hechizoVida = dummyHechizo("h-bendicion", "Bendición");
    expect(resolutor(hechizoVida)).toBe("subclase");
  });

  it("clasifica conjuros innatos de especie como 'especie' y linaje como 'legado'", () => {
    const pjAasimar: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      especie: "Aasimar",
      nivel: 1
    };
    const resolutorAasimar = crearResolutorOrigenConjuros(pjAasimar);
    const luz = dummyHechizo("h-luz", "Luz", 0);
    expect(resolutorAasimar(luz)).toBe("especie");

    const pjElfo: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      especie: "Elfo",
      subespecie: "Drow",
      nivel: 3
    };
    const resolutorElfo = crearResolutorOrigenConjuros(pjElfo);
    const fuegoFeerico = dummyHechizo("h-fuego-feerico", "Fuego feérico", 1);
    expect(resolutorElfo(fuegoFeerico)).toBe("legado");
  });

  it("clasifica conjuros siempre preparados como 'rasgos'", () => {
    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      conjurosSiemprePreparadosIds: ["h-identificar"]
    };

    const resolutor = crearResolutorOrigenConjuros(pj);
    expect(resolutor(dummyHechizo("h-identificar", "Identificar"))).toBe("rasgos");
  });

  it("otorga origen 'rasgos' a cualquier conjuro con 'palabra de poder' para Bardo nivel 20 con Palabras de creación", () => {
    const rasgoCreacion = crearRasgoPrueba({
      id: "rasgo-palabras_creacion",
      nombre: "Palabras de Creación",
      fuente: "Bardo"
    });

    const pjBardo: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      clase: "Bardo",
      nivel: 20,
      rasgos: [rasgoCreacion]
    };

    const resolutor = crearResolutorOrigenConjuros(pjBardo);
    const palabraPoderMatar = dummyHechizo("h-palabra-de-poder-matar", "Palabra de poder: matar", 9);
    expect(resolutor(palabraPoderMatar)).toBe("rasgos");
  });

  it("mantiene consistencia total con resolverOrigenConjuro para conjuros conocidos", () => {
    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      clase: "Brujo",
      subclase: "El Infernal",
      clases: [{ nombre: "Brujo", subclase: "El Infernal", nivel: 5 }],
      nivel: 5,
      conjurosSiemprePreparadosIds: ["h-maleficio"]
    };

    const resolutor = crearResolutorOrigenConjuros(pj);
    const hechizo1 = dummyHechizo("h-maleficio", "Maleficio");
    const hechizo2 = dummyHechizo("h-bola-de-fuego", "Bola de fuego", 3);
    const hechizo3 = dummyHechizo("h-luz", "Luz", 0);

    expect(resolutor(hechizo1)).toBe(resolverOrigenConjuro(pj, hechizo1));
    expect(resolutor(hechizo2)).toBe(resolverOrigenConjuro(pj, hechizo2));
    expect(resolutor(hechizo3)).toBe(resolverOrigenConjuro(pj, hechizo3));
  });

  it("respeta prioridad: rasgo con fuente subclase NO es sobreescrito por conjurosSiemprePreparadosIds", () => {
    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      clase: "Clérigo",
      subclase: "Dominio de la Vida",
      clases: [{ nombre: "Clérigo", subclase: "Dominio de la Vida", nivel: 3 }],
      nivel: 3,
      rasgos: [
        crearRasgoPrueba({
          id: "dominio-vida-conjuros",
          nombre: "Conjuros de Dominio",
          origen: "subclase",
          fuente: "Subclase: Dominio de la Vida",
          conjurosOtorgados: ["Bendición", "Curar heridas"]
        })
      ],
      conjurosSiemprePreparadosIds: ["h-bendicion", "h-curar-heridas"]
    };

    const resolutor = crearResolutorOrigenConjuros(pj);
    const bendicion = dummyHechizo("h-bendicion", "Bendición");

    // El rasgo registra primero con mayor prioridad que conjurosSiemprePreparadosIds
    const resultado = resolutor(bendicion);
    const resultadoOriginal = resolverOrigenConjuro(pj, bendicion);
    expect(resultado).not.toBeNull();
    // Ambos deben coincidir exactamente
    expect(resultado).toBe(resultadoOriginal);
    expect(resultado).toBe("subclase");
    // No debe caer en "rasgos" del fallback de conjurosSiemprePreparadosIds
    expect(resultado).not.toBe("rasgos");
  });

  it("subclase dinámica tiene precedencia sobre conjurosSiemprePreparadosIds", () => {
    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      clases: [{ nombre: "Clérigo", subclase: "Dominio de la Vida", nivel: 5 }],
      nivel: 5,
      // En la ficha, el slice de magia suele guardar estos mismos en conjurosSiemprePreparadosIds
      conjurosSiemprePreparadosIds: ["h-auxilio", "h-revivir", "h-curar-heridas"]
    };

    const resolutor = crearResolutorOrigenConjuros(pj);
    const auxilio = dummyHechizo("h-auxilio", "Auxilio", 2);
    const revivir = dummyHechizo("h_revivir", "Revivir", 3);

    expect(resolutor(auxilio)).toBe("subclase");
    expect(resolutor(revivir)).toBe("subclase");
    expect(resolverOrigenConjuro(pj, auxilio)).toBe("subclase");
    expect(resolverOrigenConjuro(pj, revivir)).toBe("subclase");
  });

  it("especie y legado tienen precedencia sobre conjurosSiemprePreparadosIds", () => {
    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      especie: "Elfo",
      subespecie: "Drow",
      nivel: 5,
      conjurosSiemprePreparadosIds: ["fuego_feerico", "oscuridad", "luces_danzantes"]
    };

    const resolutor = crearResolutorOrigenConjuros(pj);
    const fuegoFeerico = dummyHechizo("h-fuego-feerico", "Fuego feérico", 1);
    const oscuridad = dummyHechizo("oscuridad", "Oscuridad", 2);

    expect(resolutor(fuegoFeerico)).toBe("legado");
    expect(resolutor(oscuridad)).toBe("legado");
    expect(resolutor(fuegoFeerico)).toBe(resolverOrigenConjuro(pj, fuegoFeerico));
    expect(resolutor(oscuridad)).toBe(resolverOrigenConjuro(pj, oscuridad));
  });

  it("resuelve orígenes correctamente cuando los conjuros otorgados usan prefijos heterogéneos (h_, h- o nombres)", () => {
    const rasgoMagia = crearRasgoPrueba({
      id: "rasgo-mistico",
      nombre: "Místico",
      origen: "dote",
      fuente: "Iniciado en la Magia",
      conjurosOtorgados: ["h_bendicion", "h-detectar-magia", "Curación rápida"]
    });

    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      rasgos: [rasgoMagia]
    };

    const resolutor = crearResolutorOrigenConjuros(pj);

    // Consulta con nombre legible
    expect(resolutor(dummyHechizo("h-bendicion", "Bendición"))).toBe("rasgos");
    // Consulta con slug guion bajo
    expect(resolutor(dummyHechizo("h_detectar-magia", "Detectar Magia"))).toBe("rasgos");
    // Consulta con slug guion medio
    expect(resolutor(dummyHechizo("h-curacion-rapida", "Curación Rápida"))).toBe("rasgos");
  });
});
