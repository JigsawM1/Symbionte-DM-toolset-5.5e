import { describe, it, expect, beforeEach, vi } from "vitest";
import { usarAlmacenDM, type CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";

function crearRasgoMock(parcial: Partial<RasgoPersonaje> & { id: string; nombre: string }): RasgoPersonaje {
  return {
    fuente: "General",
    origen: "clase",
    tipoAccion: "pasivo",
    tieneUsosLimitados: false,
    recuperacion: "ninguno",
    personalizado: false,
    activo: false,
    descripcion: "",
    notas: "",
    ...parcial
  };
}

describe("Sincronización Bidireccional de Efectos, Concentración y Condiciones (Master <-> Jugador)", () => {
  const personajeId = "pj-mago-test";
  const criaturaId = "criatura-mago-1";

  beforeEach(() => {
    vi.clearAllMocks();

    const pjInicial: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: personajeId,
      nombre: "Gale de Aguasprofundas",
      clase: "Mago",
      nivel: 5,
      hpMaximo: 35,
      hpActual: 35,
      condicionesActivas: [],
      concentracionActiva: null
    };

    const criaturaInicial: CriaturaIniciativa = {
      id: criaturaId,
      nombre: "Gale de Aguasprofundas",
      iniciativa: 14,
      vidaActual: 35,
      vidaMaxima: 35,
      ca: 15,
      condiciones: [],
      efectos: [],
      bonificadorIniciativa: 2,
      esMonstruo: false,
      velocidad: "30 pies"
    };

    usarAlmacenDM.setState({
      personajes: [pjInicial],
      idPersonajeActivo: personajeId,
      colaIniciativa: [criaturaInicial],
      notificaciones: []
    });
  });

  describe("Concentración del Jugador hacia la Iniciativa del Master (Sin Duplicados)", () => {
    it("al establecer concentración, se inyecta en efectos con nombre de conjuro y NO se duplica en condiciones", () => {
      const state = usarAlmacenDM.getState();
      state.establecerConcentracion(personajeId, "hechizo_escudo_fe", "Escudo de la Fe");

      const pjActualizado = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
      expect(pjActualizado?.concentracionActiva).toEqual({
        hechizoId: "hechizo_escudo_fe",
        nombreHechizo: "Escudo de la Fe"
      });
      // La concentración se registra en condicionesActivas para reglas y en efectosActivos para visualización
      expect(pjActualizado?.condicionesActivas).toContain("Concentración");
      expect(pjActualizado?.efectosActivos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "ef_concentracion",
            nombre: "Concentración: Escudo de la Fe",
            concentracion: true
          })
        ])
      );

      const criatura = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === criaturaId);
      // En la criatura no debe haber chip genérico de concentración duplicado
      expect(criatura?.condiciones).not.toContain("Concentración");
      expect(criatura?.efectos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "ef_concentracion",
            nombre: "Concentración: Escudo de la Fe",
            concentracion: true
          })
        ])
      );
    });

    it("al romper concentración el jugador, se remueve de la ficha y de la criatura en iniciativa", () => {
      const state = usarAlmacenDM.getState();
      state.establecerConcentracion(personajeId, "hechizo_bendicion", "Bendición");
      expect(usarAlmacenDM.getState().colaIniciativa[0].efectos).toHaveLength(1);

      state.romperConcentracion(personajeId);

      const pjActualizado = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
      expect(pjActualizado?.concentracionActiva).toBeNull();
      expect(pjActualizado?.condicionesActivas).not.toContain("Concentración");
      expect(pjActualizado?.efectosActivos).toHaveLength(0);

      const criatura = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === criaturaId);
      expect(criatura?.condiciones).not.toContain("Concentración");
      const efectosCon = (criatura?.efectos || []).filter((e) => e.concentracion);
      expect(efectosCon).toHaveLength(0);
    });
  });

  describe("Efectos aplicados por el Master hacia la Ficha del Jugador con Rondas", () => {
    it("al agregar un efecto normal desde iniciativa, aparece en efectosActivos del jugador con expiraRonda", () => {
      const state = usarAlmacenDM.getState();
      state.agregarEfectoACriatura(criaturaId, "Bendición", 10);

      const criatura = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === criaturaId);
      expect(criatura?.efectos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            nombre: "Bendición",
            expiraRonda: 11
          })
        ])
      );

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
      expect(pj?.efectosActivos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            nombre: "Bendición",
            expiraRonda: 11
          })
        ])
      );
    });

    it("al agregar un efecto de concentración desde el Master, se configura la concentración del jugador sin duplicar", () => {
      const state = usarAlmacenDM.getState();
      state.agregarEfectoACriatura(criaturaId, "Concentración: Muro de Fuego", 10, { concentracion: true });

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
      expect(pj?.condicionesActivas).toContain("Concentración");
      expect(pj?.concentracionActiva).toEqual(
        expect.objectContaining({
          nombreHechizo: "Muro de Fuego"
        })
      );
      expect(pj?.efectosActivos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            nombre: "Concentración: Muro de Fuego",
            concentracion: true
          })
        ])
      );
    });

    it("al retirar el efecto desde el Master, se quita de la ficha del jugador", () => {
      const state = usarAlmacenDM.getState();
      state.agregarEfectoACriatura(criaturaId, "Bendición", 10);
      const criaturaConEfecto = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === criaturaId);
      const efectoId = criaturaConEfecto?.efectos?.[0]?.id;
      expect(efectoId).toBeDefined();

      state.quitarEfectoDeCriatura(criaturaId, efectoId!);

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
      expect(pj?.efectosActivos).toHaveLength(0);
    });

    it("quitarEfectoPersonaje retira el efecto desde la ficha del jugador y lo sincroniza con la iniciativa", () => {
      const state = usarAlmacenDM.getState();
      state.agregarEfectoACriatura(criaturaId, "Escudo de la Fe", 10);
      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
      const efectoId = pj?.efectosActivos?.[0]?.id;
      expect(efectoId).toBeDefined();

      state.quitarEfectoPersonaje(personajeId, efectoId!);

      const pjPost = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
      expect(pjPost?.efectosActivos).toHaveLength(0);

      const criaturaPost = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === criaturaId);
      expect(criaturaPost?.efectos).toHaveLength(0);
    });
  });

  describe("Retirar Concentración o Condiciones desde la Ficha del Jugador", () => {
    it("al quitar la condición 'Concentración' desde la ficha, se limpian los efectos de concentración en la criatura", () => {
      const state = usarAlmacenDM.getState();
      state.establecerConcentracion(personajeId, "hechizo_invisibilidad", "Invisibilidad");

      expect(usarAlmacenDM.getState().colaIniciativa[0].efectos).toHaveLength(1);

      state.quitarCondicionPersonaje(personajeId, "Concentración");

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
      expect(pj?.concentracionActiva).toBeNull();
      expect(pj?.condicionesActivas).not.toContain("Concentración");

      const criatura = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === criaturaId);
      expect(criatura?.condiciones).not.toContain("Concentración");
      expect(criatura?.efectos).toHaveLength(0);
    });
  });

  describe("Operaciones de Área del Master sincronizadas con Jugadores", () => {
    it("aplicarCondicionEnArea propaga la condición a los personajes jugadores coincidentes", () => {
      const state = usarAlmacenDM.getState();
      state.aplicarCondicionEnArea("Derribado", [criaturaId]);

      const criatura = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === criaturaId);
      expect(criatura?.condiciones).toContain("Derribado");

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
      expect(pj?.condicionesActivas).toContain("Derribado");
    });

    it("aplicarEfectoEnArea propaga el efecto a los personajes jugadores coincidentes", () => {
      const state = usarAlmacenDM.getState();
      state.aplicarEfectoEnArea("Luz del Alba", 10, undefined, [criaturaId]);

      const criatura = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === criaturaId);
      expect(criatura?.efectos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            nombre: "Luz del Alba"
          })
        ])
      );

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
      expect(pj?.efectosActivos.some((e) => e.nombre === "Luz del Alba")).toBe(true);
    });
  });

  describe("Sincronización de Furia y Rasgos de Clase (Master <-> Jugador)", () => {
    const barbaroId = "pj-barbaro-test";
    const barbaroCriaturaId = "criatura-barbaro-1";

    beforeEach(() => {
      const barbaroPJ: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: barbaroId,
        nombre: "Conan el Bárbaro",
        clase: "Bárbaro",
        nivel: 3,
        hpMaximo: 40,
        hpActual: 40,
        condicionesActivas: [],
        efectosActivos: [],
        concentracionActiva: null,
        rasgos: [
          crearRasgoMock({
            id: "rasgo_furia",
            nombre: "Furia",
            descripcion: "Entras en furia en combate.",
            origen: "clase",
            esActivable: true,
            activo: false,
            tieneUsosLimitados: true,
            usosMaximos: 3,
            usosRestantes: 3,
            recuperacion: "descanso_largo"
          })
        ]
      };

      const barbaroCriatura: CriaturaIniciativa = {
        id: barbaroCriaturaId,
        nombre: "Conan el Bárbaro",
        iniciativa: 12,
        vidaActual: 40,
        vidaMaxima: 40,
        ca: 14,
        condiciones: [],
        efectos: [],
        bonificadorIniciativa: 1,
        esMonstruo: false,
        velocidad: "30 pies"
      };

      usarAlmacenDM.setState({
        personajes: [barbaroPJ],
        idPersonajeActivo: barbaroId,
        colaIniciativa: [barbaroCriatura],
        rondaActual: 1
      });
    });

    it("al aplicar Furia desde el Master, se activan las condiciones mecánicas y el rasgo del Bárbaro", () => {
      const state = usarAlmacenDM.getState();
      state.agregarEfectoACriatura(barbaroCriaturaId, "Furia", 100);

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === barbaroId);
      expect(pj?.condicionesActivas).toContain("Furia");
      expect(pj?.efectosActivos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            nombre: "Furia",
            expiraRonda: 101
          })
        ])
      );

      // El rasgo en la ficha debe quedar activado y haber consumido 1 uso
      const rasgoFuria = pj?.rasgos?.find((r) => r.nombre === "Furia");
      expect(rasgoFuria?.activo).toBe(true);
      expect(rasgoFuria?.usosRestantes).toBe(2);

      // En la criatura en iniciativa debe estar en efectos y NO duplicado en condiciones
      const criatura = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === barbaroCriaturaId);
      expect(criatura?.efectos?.some((e) => e.nombre === "Furia")).toBe(true);
      expect(criatura?.condiciones).not.toContain("Furia");
    });

    it("al quitar Furia desde el Master, se desactiva el rasgo y se limpia de condiciones del jugador", () => {
      const state = usarAlmacenDM.getState();
      state.agregarEfectoACriatura(barbaroCriaturaId, "Furia", 100);

      const criatura = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === barbaroCriaturaId);
      const efId = criatura?.efectos?.[0]?.id;
      expect(efId).toBeDefined();

      state.quitarEfectoDeCriatura(barbaroCriaturaId, efId!);

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === barbaroId);
      expect(pj?.condicionesActivas).not.toContain("Furia");
      expect(pj?.efectosActivos).toHaveLength(0);

      const rasgoFuria = pj?.rasgos?.find((r) => r.nombre === "Furia");
      expect(rasgoFuria?.activo).toBe(false);

      const criaturaActualizada = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === barbaroCriaturaId);
      expect(criaturaActualizada?.efectos).toHaveLength(0);
    });

    it("al aplicar Furia desde la ficha del Jugador, se convierte en efecto temporal y activa el rasgo", () => {
      const state = usarAlmacenDM.getState();
      state.aplicarCondicionPersonaje(barbaroId, "Furia");

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === barbaroId);
      expect(pj?.condicionesActivas).toContain("Furia");
      expect(pj?.efectosActivos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            nombre: "Furia",
            expiraRonda: 101
          })
        ])
      );

      const rasgoFuria = pj?.rasgos?.find((r) => r.nombre === "Furia");
      expect(rasgoFuria?.activo).toBe(true);

      const criatura = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === barbaroCriaturaId);
      expect(criatura?.efectos?.some((e) => e.nombre === "Furia")).toBe(true);
      expect(criatura?.condiciones).not.toContain("Furia");
    });

    it("al alternar el rasgo Furia desde la ficha, se sincroniza a efectosActivos y a la cola de iniciativa", () => {
      const state = usarAlmacenDM.getState();
      state.alternarActivoRasgo(barbaroId, "rasgo_furia");

      let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === barbaroId);
      expect(pj?.rasgos?.find((r) => r.id === "rasgo_furia")?.activo).toBe(true);
      expect(pj?.condicionesActivas.some((c) => c.includes("Furia"))).toBe(true);
      expect(pj?.efectosActivos?.some((e) => e.nombre.includes("Furia"))).toBe(true);

      let criatura = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === barbaroCriaturaId);
      expect(criatura?.efectos?.some((e) => e.nombre.includes("Furia"))).toBe(true);
      expect(criatura?.condiciones.some((c) => c.includes("Furia"))).toBe(false);

      // Ahora desactivar el rasgo
      state.alternarActivoRasgo(barbaroId, "rasgo_furia");

      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === barbaroId);
      expect(pj?.rasgos?.find((r) => r.id === "rasgo_furia")?.activo).toBe(false);
      expect(pj?.condicionesActivas.some((c) => c.includes("Furia"))).toBe(false);
      expect(pj?.efectosActivos?.some((e) => e.nombre.includes("Furia"))).toBe(false);

      criatura = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === barbaroCriaturaId);
      expect(criatura?.efectos?.some((e) => e.nombre.includes("Furia"))).toBe(false);
    });

    it("al aplicar condiciones con paréntesis como 'Ataque Temerario (Reckless Attack)', se sincroniza como efecto temporal y desduplica", () => {
      const state = usarAlmacenDM.getState();
      state.aplicarCondicionPersonaje(barbaroId, "Ataque Temerario (Reckless Attack)");

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === barbaroId);
      expect(pj?.efectosActivos?.some((e) => e.nombre.toLowerCase().includes("temerario"))).toBe(true);

      const criatura = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === barbaroCriaturaId);
      expect(criatura?.efectos?.some((e) => e.nombre.toLowerCase().includes("temerario"))).toBe(true);
      expect(criatura?.condiciones.some((c) => c.toLowerCase().includes("temerario"))).toBe(false);
    });
  });
});
