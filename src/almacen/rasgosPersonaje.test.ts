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

  it("dote Afortunado a nivel 9 escala sus usos a 4 (+PB), permite gastar/recuperar hasta 4 y descanso largo lo restaura a 4", () => {
    const store = usarAlmacenDM.getState();
    // Subir personaje a nivel 9 (PB = 4)
    usarAlmacenDM.setState((s) => ({
      personajes: s.personajes.map((p) =>
        p.id === "pj_test_rasgos" ? { ...p, nivel: 9 } : p
      )
    }));

    const doteAfortunado: RasgoPersonaje = {
      id: "dote_afortunado",
      nombre: "Afortunado",
      descripcion: "Puntos de suerte iguales a PB",
      origen: "dote",
      fuente: "PHB 2024",
      tipoAccion: "reaccion",
      tieneUsosLimitados: true,
      usosMaximos: 2, // Plantilla estática base
      formulaEscalado: "bono_competencia",
      recuperacion: "descanso_largo",
      personalizado: false,
      activo: true,
      notas: ""
    };

    // 1. Al agregar en personaje nivel 9, debe arrancar en 4 usos
    store.agregarRasgoPersonaje("pj_test_rasgos", doteAfortunado);
    let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_rasgos");
    let rasgo = pj?.rasgos.find((r) => r.id === "dote_afortunado");
    expect(rasgo?.usosMaximos).toBe(4);
    expect(rasgo?.usosRestantes).toBe(4);

    // 2. Gastar 1 uso -> 3
    store.gastarUsoRasgoPersonaje("pj_test_rasgos", "dote_afortunado");
    pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_rasgos");
    rasgo = pj?.rasgos.find((r) => r.id === "dote_afortunado");
    expect(rasgo?.usosRestantes).toBe(3);

    // 3. Recuperar uso (botón '+') -> Debe permitir subir a 4 y no atascarse en 2
    store.recuperarUsoRasgoPersonaje("pj_test_rasgos", "dote_afortunado");
    pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_rasgos");
    rasgo = pj?.rasgos.find((r) => r.id === "dote_afortunado");
    expect(rasgo?.usosRestantes).toBe(4);

    // Intentar recuperar más allá del PB -> No debe superar 4
    store.recuperarUsoRasgoPersonaje("pj_test_rasgos", "dote_afortunado");
    pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_rasgos");
    rasgo = pj?.rasgos.find((r) => r.id === "dote_afortunado");
    expect(rasgo?.usosRestantes).toBe(4);

    // 4. Vaciar a 0 y descansar -> Descanso largo debe restaurar a 4/4
    store.establecerUsosRestantesRasgoPersonaje("pj_test_rasgos", "dote_afortunado", 0);
    pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_rasgos");
    rasgo = pj?.rasgos.find((r) => r.id === "dote_afortunado");
    expect(rasgo?.usosRestantes).toBe(0);

    const resDescanso = ejecutarDescansoLargo(pj!);
    const rasgoTrasDescanso = resDescanso.personajeActualizado.rasgos.find((r) => r.id === "dote_afortunado");
    expect(rasgoTrasDescanso?.usosMaximos).toBe(4);
    expect(rasgoTrasDescanso?.usosRestantes).toBe(4);
  });

  it("al eliminar una dote mágica (Iniciado en la Magia), se purgan limpiamente sus conjuros y trucos de la ficha", () => {
    const store = usarAlmacenDM.getState();

    const doteMagia: RasgoPersonaje = {
      id: "dote_iniciado_magia_clerigo",
      nombre: "Iniciado en la Magia (Clérigo)",
      descripcion: "Aprendes 2 trucos y 1 conjuro.",
      origen: "dote",
      fuente: "PHB 2024",
      tipoAccion: "pasivo",
      tieneUsosLimitados: true,
      usosMaximos: 1,
      usosRestantes: 1,
      recuperacion: "descanso_largo",
      conjurosOtorgados: ["guia", "bendicion"],
      selectores: [
        {
          id: "selector_truco_1_iniciado_clerigo",
          tipo: "unico",
          etiqueta: "Primer Truco",
          maxSelecciones: 1,
          opciones: [{ id: "guia", nombre: "Guía", descripcion: "Truco de clérigo" }],
          valorActual: ["guia"]
        },
        {
          id: "selector_conjuro_nv1_iniciado_clerigo",
          tipo: "unico",
          etiqueta: "1 Conjuro Nv1",
          maxSelecciones: 1,
          opciones: [{ id: "bendicion", nombre: "Bendición", descripcion: "Conjuro de nivel 1" }],
          valorActual: ["bendicion"]
        }
      ],
      personalizado: false,
      activo: true,
      notas: ""
    };

    store.agregarRasgoPersonaje("pj_test_rasgos", doteMagia);

    // Simular que el selector sincronizó los conjuros en la ficha
    usarAlmacenDM.setState((s) => ({
      personajes: s.personajes.map((p) =>
        p.id === "pj_test_rasgos"
          ? {
              ...p,
              trucosConocidosIds: ["guia", "prestidigitacion"],
              conjurosSiemprePreparadosIds: ["bendicion", "escudo"],
              conjurosPreparadosIds: ["bendicion", "escudo"],
              conjurosConocidosIds: ["bendicion", "escudo"]
            }
          : p
      )
    }));

    // Eliminar el dote
    store.eliminarRasgoPersonaje("pj_test_rasgos", "dote_iniciado_magia_clerigo");

    const pjTrasEliminar = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_test_rasgos");

    // 'guia' y 'bendicion' deben haberse purgado
    expect(pjTrasEliminar?.trucosConocidosIds).not.toContain("guia");
    expect(pjTrasEliminar?.conjurosSiemprePreparadosIds).not.toContain("bendicion");
    expect(pjTrasEliminar?.conjurosPreparadosIds).not.toContain("bendicion");
    expect(pjTrasEliminar?.conjurosConocidosIds).not.toContain("bendicion");

    // Los conjuros ajenos no relacionados deben preservarse intactos
    expect(pjTrasEliminar?.trucosConocidosIds).toContain("prestidigitacion");
    expect(pjTrasEliminar?.conjurosSiemprePreparadosIds).toContain("escudo");
    expect(pjTrasEliminar?.conjurosPreparadosIds).toContain("escudo");
    expect(pjTrasEliminar?.conjurosConocidosIds).toContain("escudo");
  });
});
