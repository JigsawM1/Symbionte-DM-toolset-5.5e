import { describe, it, expect, beforeEach } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { deshidratarPersonaje, hidratarPersonaje, deshidratarRasgo } from "@/servicios/serializadorPersonaje";
import { fusionarEstadoRasgo } from "@/servicios/rasgos/fusionarEstadoRasgo";
import { construirBlobPersistencia } from "@/almacen/persistencia";
import { prepararCargaPersistida } from "@/almacen/cargaPersistida";
import { EsquemaRasgoPersonaje } from "@/tipos/rasgos";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";

describe("Persistencia de Rasgos Ocultos en TaleSpire (Fuente Única de Verdad en Blob)", () => {
  const idPjTest = "pj-talespire-persistencia-test";

  const rasgoAccion1: RasgoPersonaje = EsquemaRasgoPersonaje.parse({
    id: "rasgo-furia-combate",
    nombre: "Furia en Combate",
    descripcion: "Entras en furia destructiva.",
    tipoAccion: "accion_adicional"
  });

  const rasgoAccion2: RasgoPersonaje = EsquemaRasgoPersonaje.parse({
    id: "rasgo-segundo-aliento-combate",
    nombre: "Segundo Aliento",
    descripcion: "Recuperas aliento táctico.",
    tipoAccion: "accion_adicional"
  });

  const crearPersonajePrueba = (): PersonajeJugador => ({
    ...PERSONAJE_POR_DEFECTO,
    id: idPjTest,
    nombre: "Garrick",
    clase: "Guerrero",
    nivel: 3,
    rasgos: [rasgoAccion1, rasgoAccion2]
  });

  beforeEach(() => {
    const pjInicial = crearPersonajePrueba();
    usarAlmacenDM.setState({
      personajes: [pjInicial],
      idPersonajeActivo: idPjTest,
      datosInicialesCargados: true,
      cargandoDatos: false,
      errorCargaDatos: null
    });
  });

  it("permite alternar y conmutar el estado oculto directamente en los rasgos del personaje", () => {
    const store = usarAlmacenDM.getState();

    // 1. Ocultar rasgo 1
    store.alternarOcultarRasgo(idPjTest, rasgoAccion1.id);
    let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === idPjTest);
    expect(pj?.rasgos.find((r) => r.id === rasgoAccion1.id)?.oculto).toBe(true);

    // 2. Ocultar rasgo 2
    store.alternarOcultarRasgo(idPjTest, rasgoAccion2.id);
    pj = usarAlmacenDM.getState().personajes.find((p) => p.id === idPjTest);
    expect(pj?.rasgos.find((r) => r.id === rasgoAccion2.id)?.oculto).toBe(true);

    // 3. Desocultar rasgo 1
    store.alternarOcultarRasgo(idPjTest, rasgoAccion1.id);
    pj = usarAlmacenDM.getState().personajes.find((p) => p.id === idPjTest);
    expect(pj?.rasgos.find((r) => r.id === rasgoAccion1.id)?.oculto).toBe(false);
    expect(pj?.rasgos.find((r) => r.id === rasgoAccion2.id)?.oculto).toBe(true);

    // 4. Desocultar todos los rasgos
    store.desocultarTodosLosRasgos(idPjTest);
    pj = usarAlmacenDM.getState().personajes.find((p) => p.id === idPjTest);
    expect(pj?.rasgos.every((r) => !r.oculto)).toBe(true);
  });

  it("conserva la propiedad oculto en rasgos canónicos durante la deshidratación", () => {
    const rasgoCanonico: RasgoPersonaje = EsquemaRasgoPersonaje.parse({
      id: "rasgo-segundo-aliento-guerrero",
      nombre: "Segundo aliento",
      descripcion: "Recuperas fuerzas en combate.",
      origen: "clase",
      fuente: "Manual del Jugador",
      tipoAccion: "accion_adicional",
      nivelRequerido: 1,
      tieneUsosLimitados: true,
      usosMaximos: 2,
      usosRestantes: 2,
      oculto: true
    });

    const rasgoDeshidratado = deshidratarRasgo(rasgoCanonico);
    expect(rasgoDeshidratado.oculto).toBe(true);
  });

  it("conserva la propiedad oculto al fusionar plantilla limpia de compendio con rasgo del blob", () => {
    const rasgoExistenteDelBlob: RasgoPersonaje = EsquemaRasgoPersonaje.parse({
      id: "rasgo-segundo-aliento-guerrero",
      nombre: "Segundo aliento",
      descripcion: "",
      origen: "clase",
      fuente: "Manual del Jugador",
      tipoAccion: "accion_adicional",
      nivelRequerido: 1,
      tieneUsosLimitados: true,
      usosMaximos: 2,
      usosRestantes: 2,
      oculto: true
    });

    const plantillaLimpiaCompendio: RasgoPersonaje = EsquemaRasgoPersonaje.parse({
      id: "rasgo-segundo-aliento-guerrero",
      nombre: "Segundo aliento",
      descripcion: "Texto canónico del compendio.",
      origen: "clase",
      fuente: "Manual del Jugador",
      tipoAccion: "accion_adicional",
      nivelRequerido: 1,
      tieneUsosLimitados: true,
      usosMaximos: 2,
      usosRestantes: 2
    });

    const fusionado = fusionarEstadoRasgo(plantillaLimpiaCompendio, rasgoExistenteDelBlob);
    expect(fusionado.oculto).toBe(true);
  });

  it("persiste y restaura rasgos canónicos ocultos a través del ciclo completo de blob de TaleSpire", () => {
    const store = usarAlmacenDM.getState();

    // Sincronizar rasgos canónicos de Guerrero en el personaje
    store.sincronizarRasgosPersonaje(idPjTest);

    const pjConRasgos = usarAlmacenDM.getState().personajes.find((p) => p.id === idPjTest)!;
    const rasgoTomarAliento = pjConRasgos.rasgos.find((r) => r.id === "rasgo_cls_guerrero_tomar_aliento");
    expect(rasgoTomarAliento).toBeDefined();

    // Ocultar el rasgo canónico
    store.alternarOcultarRasgo(idPjTest, "rasgo_cls_guerrero_tomar_aliento");

    const pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === idPjTest)!;
    const rasgoEnMemoria = pjActual.rasgos.find((r) => r.id === "rasgo_cls_guerrero_tomar_aliento");
    expect(rasgoEnMemoria?.oculto).toBe(true);

    // Guardar en blob persistente de TaleSpire y serializar a JSON
    const blobGenerado = construirBlobPersistencia(usarAlmacenDM.getState());
    const jsonBlobTaleSpire = JSON.parse(JSON.stringify(blobGenerado));

    // Lectura nativa de TaleSpire
    const estadoRestaurado = prepararCargaPersistida(jsonBlobTaleSpire);
    const pjRestaurado = estadoRestaurado.personajes?.find((p) => p.id === idPjTest);

    expect(pjRestaurado).toBeDefined();
    const rasgoRestaurado = pjRestaurado?.rasgos.find((r) => r.id === "rasgo_cls_guerrero_tomar_aliento");
    expect(rasgoRestaurado).toBeDefined();
    expect(rasgoRestaurado?.oculto).toBe(true);
  });

  it("persiste conjuros ocultos a través del ciclo de deshidratación e hidratación de TaleSpire", () => {
    const store = usarAlmacenDM.getState();
    const hechizoId = "proyectil-magico";

    store.alternarOcultarConjuro(idPjTest, hechizoId);
    let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === idPjTest);
    expect(pj?.conjurosOcultos).toContain(hechizoId);

    // Deshidratar y rehidratar
    const deshidratado = deshidratarPersonaje(pj!);
    expect(deshidratado.conjurosOcultos).toContain(hechizoId);

    const rehidratado = hidratarPersonaje(deshidratado);
    expect(rehidratado.conjurosOcultos).toContain(hechizoId);

    // Desocultar todos los conjuros
    store.desocultarTodosLosConjuros(idPjTest);
    pj = usarAlmacenDM.getState().personajes.find((p) => p.id === idPjTest);
    expect(pj?.conjurosOcultos).toEqual([]);
  });
});
