import { describe, it, expect } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { aplicarBuildClaseAPersonaje } from "@/servicios/clases/buildClase";
import type { AtaquePersonajeCalculado, PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { obtenerRasgosConEleccionEfectoEnDano, obtenerRasgosPreguntablesEnAtaque } from "./consultaAtaqueRasgos";
import { prepararDanoIntegrado } from "./resolucionAsistidaRasgos";

function crearAtaque(cambios: Partial<AtaquePersonajeCalculado> = {}): AtaquePersonajeCalculado {
  return {
    id: "atk-hacha",
    nombre: "Gran hacha",
    tipo: "Arma",
    tipoAccion: "accion",
    caracteristicaUsada: "fuerza",
    bonoAtaque: 7,
    dadoDano: "1d12+4",
    dadoDanoBase: "1d12",
    modificadorDano: 4,
    esDanoFijo: false,
    tipoDano: "Cortante",
    propiedades: [],
    tieneTiradaAtaque: true,
    ...cambios
  };
}

function barbaroNivel9(): PersonajeJugador {
  return aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", 9, "Senda del Berserker");
}

function activarRasgo(pj: PersonajeJugador, nombre: string): PersonajeJugador {
  return {
    ...pj,
    rasgos: pj.rasgos.map((r) => (r.nombre === nombre ? { ...r, activo: true } : r))
  };
}

describe("obtenerRasgosPreguntablesEnAtaque", () => {
  it("filtra por caracteristica y soloArmaODesarmado (arma/desarmado sí; conjuro o destreza no)", () => {
    const pj = barbaroNivel9();
    expect(obtenerRasgosPreguntablesEnAtaque(pj, crearAtaque({ tipo: "Arma", caracteristicaUsada: "fuerza" })).map((r) => r.nombre)).toEqual(["Ataque temerario"]);
    expect(obtenerRasgosPreguntablesEnAtaque(pj, crearAtaque({ tipo: "Desarmado", caracteristicaUsada: "fuerza" })).map((r) => r.nombre)).toEqual(["Ataque temerario"]);
    expect(obtenerRasgosPreguntablesEnAtaque(pj, crearAtaque({ tipo: "Arma", caracteristicaUsada: "destreza" }))).toEqual([]);
    expect(obtenerRasgosPreguntablesEnAtaque(pj, crearAtaque({ tipo: "Conjuro", caracteristicaUsada: "fuerza" }))).toEqual([]);
  });

  it("no vuelve a ofrecer un rasgo ya activo y encadena ligadoA (Golpe brutal tras activar Ataque temerario)", () => {
    const pjInactivo = barbaroNivel9();
    expect(obtenerRasgosPreguntablesEnAtaque(pjInactivo, crearAtaque()).map((r) => r.nombre)).toEqual(["Ataque temerario"]);

    const pjTemerario = activarRasgo(pjInactivo, "Ataque temerario");
    expect(obtenerRasgosPreguntablesEnAtaque(pjTemerario, crearAtaque()).map((r) => r.nombre)).toEqual(["Golpe brutal"]);

    const pjAmbos = activarRasgo(pjTemerario, "Golpe brutal");
    expect(obtenerRasgosPreguntablesEnAtaque(pjAmbos, crearAtaque())).toEqual([]);
  });

  it("oculta rasgos con renunciar_ventaja cuando el ataque tiene desventaja manual o por condición", () => {
    const pjTemerario = activarRasgo(barbaroNivel9(), "Ataque temerario");
    expect(obtenerRasgosPreguntablesEnAtaque(pjTemerario, crearAtaque(), { tipoTiradaManual: "desventaja" })).toEqual([]);

    const pjEnvenenado: PersonajeJugador = { ...pjTemerario, condicionesActivas: ["Envenenado"] };
    expect(obtenerRasgosPreguntablesEnAtaque(pjEnvenenado, crearAtaque())).toEqual([]);
  });
});

describe("prepararDanoIntegrado con herencia de tipo de daño y filtro de característica", () => {
  const rasgoHeredado: RasgoPersonaje = {
    id: "rasgo_dano_heredado",
    nombre: "Frenesí de prueba",
    descripcion: "",
    origen: "clase",
    fuente: "Bárbaro",
    tipoAccion: "especial",
    tieneUsosLimitados: false,
    recuperacion: "ninguno",
    formulaDados: "2d6",
    activo: true,
    esActivable: false,
    personalizado: false,
    notas: "",
    resolucionAsistida: {
      integrarEnDanoDeArma: true,
      caracteristicaAtaque: "fuerza",
      opciones: [{ id: "heredado", etiqueta: "Heredado", tipo: "dano", heredarTipoDanoArma: true }]
    }
  };

  it("hereda tipoDanoArma y respeta caracteristicaAtaque", () => {
    const pj: PersonajeJugador = { ...PERSONAJE_POR_DEFECTO, rasgos: [rasgoHeredado] };
    const solicitud = { idRasgo: rasgoHeredado.id, idOpcion: "heredado", confirmado: true, incluirDados: true, propio: false };

    expect(prepararDanoIntegrado(pj, solicitud, "Contundente", "fuerza")).toEqual({ formula: "2d6", tipoDano: "Contundente" });
    expect(prepararDanoIntegrado(pj, solicitud, "Perforante", "destreza")).toBeUndefined();
    expect(prepararDanoIntegrado(pj, solicitud, undefined, "fuerza")).toBeUndefined();
  });
});

describe("obtenerRasgosConEleccionEfectoEnDano", () => {
  it("resuelve Golpe brutal en niveles 9, 13 y 17 con sus extensiones cuando está activo en ataque de Fuerza", () => {
    const ataqueFuerza = crearAtaque({ tipo: "Arma", caracteristicaUsada: "fuerza" });
    const ataqueDestreza = crearAtaque({ tipo: "Arma", caracteristicaUsada: "destreza" });

    const pj9 = aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", 9, "Senda del Berserker");
    expect(obtenerRasgosConEleccionEfectoEnDano(pj9, ataqueFuerza)).toEqual([]);

    const pj9Activo = activarRasgo(activarRasgo(pj9, "Ataque temerario"), "Golpe brutal");
    expect(obtenerRasgosConEleccionEfectoEnDano(pj9Activo, ataqueDestreza)).toEqual([]);
    const res9 = obtenerRasgosConEleccionEfectoEnDano(pj9Activo, ataqueFuerza);
    expect(res9).toHaveLength(1);
    expect(res9[0].eleccionEfectoEnTirada?.maxElecciones).toBe(1);
    expect(res9[0].eleccionEfectoEnTirada?.opciones?.map((o) => o.id)).toEqual(["contundente", "inmovilizador"]);

    const pj13 = activarRasgo(
      activarRasgo(aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", 13, "Senda del Berserker"), "Ataque temerario"),
      "Golpe brutal"
    );
    const res13 = obtenerRasgosConEleccionEfectoEnDano(pj13, ataqueFuerza);
    expect(res13[0].eleccionEfectoEnTirada?.maxElecciones).toBe(1);
    expect(res13[0].eleccionEfectoEnTirada?.opciones?.map((o) => o.id)).toEqual([
      "contundente", "inmovilizador", "desestabilizador", "desgarrador"
    ]);

    const pj17 = activarRasgo(
      activarRasgo(aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", 17, "Senda del Berserker"), "Ataque temerario"),
      "Golpe brutal"
    );
    const res17 = obtenerRasgosConEleccionEfectoEnDano(pj17, ataqueFuerza);
    expect(res17[0].eleccionEfectoEnTirada?.maxElecciones).toBe(2);
    expect(res17[0].eleccionEfectoEnTirada?.opciones).toHaveLength(4);
  });
});
