import { describe, it, expect, beforeEach } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { ejecutarDescansoCorto, ejecutarDescansoLargo } from "@/servicios/procesadorDescansos";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";

describe("Gestión de Rasgos en el Store Zustand y Descansos", () => {
  beforeEach(() => {
    usarAlmacenDM.setState({
      personajes: [{
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_test_rasgos",
        nombre: "Valeroso",
        especie: "Humano",
        clase: "Guerrero",
        nivel: 3,
        rasgos: []
      }],
      idPersonajeActivo: "pj_test_rasgos"
    });
  });

  it("permite agregar, actualizar y eliminar rasgos", () => {
    const store = usarAlmacenDM.getState();
    const rasgoNuevo: RasgoPersonaje = {
      id: "rasgo_1",
      nombre: "Furia del Norte",
      descripcion: "Añade daño adicional.",
      origen: "personalizado",
      fuente: "Homebrew",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      usosMaximos: 3,
      usosRestantes: 3,
      recuperacion: "descanso_largo",
      personalizado: true,
      activo: true,
      notas: ""
    };

    // Agregar
    store.agregarRasgoPersonaje("pj_test_rasgos", rasgoNuevo);
    let pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_rasgos");
    expect(pjActual?.rasgos.length).toBe(1);
    expect(pjActual?.rasgos[0].nombre).toBe("Furia del Norte");

    // Actualizar
    store.actualizarRasgoPersonaje("pj_test_rasgos", "rasgo_1", {
      nombre: "Furia del Norte Mejorada",
      usosMaximos: 4
    });
    pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_rasgos");
    expect(pjActual?.rasgos[0].nombre).toBe("Furia del Norte Mejorada");
    expect(pjActual?.rasgos[0].usosMaximos).toBe(4);

    // Eliminar
    store.eliminarRasgoPersonaje("pj_test_rasgos", "rasgo_1");
    pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_rasgos");
    expect(pjActual?.rasgos.length).toBe(0);
  });

  it("gasta y recupera usos de rasgos controladamente", () => {
    const store = usarAlmacenDM.getState();
    const rasgoConUsos: RasgoPersonaje = {
      id: "rasgo_usos",
      nombre: "Tomar aliento",
      descripcion: "Cura 1d10+nivel.",
      origen: "clase",
      fuente: "Guerrero Nivel 1",
      tipoAccion: "accion_adicional",
      tieneUsosLimitados: true,
      usosMaximos: 2,
      usosRestantes: 2,
      recuperacion: "descanso_corto",
      personalizado: false,
      activo: true,
      notas: ""
    };

    store.agregarRasgoPersonaje("pj_test_rasgos", rasgoConUsos);

    // Gastar 1 uso
    store.gastarUsoRasgoPersonaje("pj_test_rasgos", "rasgo_usos");
    let pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_rasgos");
    expect(pjActual?.rasgos[0].usosRestantes).toBe(1);

    // Gastar otro uso (0 restantes)
    store.gastarUsoRasgoPersonaje("pj_test_rasgos", "rasgo_usos");
    pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_rasgos");
    expect(pjActual?.rasgos[0].usosRestantes).toBe(0);

    // Intentar gastar por debajo de 0 no debe ser negativo
    store.gastarUsoRasgoPersonaje("pj_test_rasgos", "rasgo_usos");
    pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_rasgos");
    expect(pjActual?.rasgos[0].usosRestantes).toBe(0);

    // Recuperar 1 uso
    store.recuperarUsoRasgoPersonaje("pj_test_rasgos", "rasgo_usos");
    pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_rasgos");
    expect(pjActual?.rasgos[0].usosRestantes).toBe(1);
  });

  it("recupera usos de rasgos correctamente durante descansos cortos y largos", () => {
    const rasgoCorto: RasgoPersonaje = {
      id: "rasgo_corto",
      nombre: "Acción súbita",
      descripcion: "Acción adicional extra.",
      origen: "clase",
      fuente: "Guerrero Nivel 2",
      tipoAccion: "especial",
      tieneUsosLimitados: true,
      usosMaximos: 1,
      usosRestantes: 0,
      recuperacion: "descanso_corto",
      personalizado: false,
      activo: true,
      notas: ""
    };

    const rasgoLargo: RasgoPersonaje = {
      id: "rasgo_largo",
      nombre: "Indómito",
      descripcion: "Repite salvación.",
      origen: "clase",
      fuente: "Guerrero Nivel 9",
      tipoAccion: "reaccion",
      tieneUsosLimitados: true,
      usosMaximos: 1,
      usosRestantes: 0,
      recuperacion: "descanso_largo",
      personalizado: false,
      activo: true,
      notas: ""
    };

    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj_descansos",
      nombre: "Guerrero de Élite",
      rasgos: [rasgoCorto, rasgoLargo]
    };

    // 1. Descanso Corto -> Debe recargar rasgoCorto pero NO rasgoLargo
    const resCorto = ejecutarDescansoCorto(pj, 0);
    const rCortoDespues = resCorto.personajeActualizado.rasgos.find((r) => r.id === "rasgo_corto");
    const rLargoDespues = resCorto.personajeActualizado.rasgos.find((r) => r.id === "rasgo_largo");

    expect(rCortoDespues?.usosRestantes).toBe(1);
    expect(rLargoDespues?.usosRestantes).toBe(0);

    // 2. Descanso Largo -> Debe recargar ambos rasgos
    const resLargo = ejecutarDescansoLargo(resCorto.personajeActualizado);
    const rCortoLargo = resLargo.personajeActualizado.rasgos.find((r) => r.id === "rasgo_corto");
    const rLargoLargo = resLargo.personajeActualizado.rasgos.find((r) => r.id === "rasgo_largo");

    expect(rCortoLargo?.usosRestantes).toBe(1);
    expect(rLargoLargo?.usosRestantes).toBe(1);
  });
});
