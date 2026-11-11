import { describe, it, expect } from "vitest";
import { obtenerRasgosClaseYSubclase, aplicarBuildClaseAPersonaje } from "./gestorClases";
import { MONSTRUOS_INICIALES } from "@/utiles/datosIniciales";
import { estaRasgoActivo } from "./rasgos/utilidadesRasgos";
import { evaluarEfectosRasgosActivos } from "./rasgos/evaluadorExpresionesRasgos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";

describe("Druida D&D 5.5e (PHB 2024) - Reglas, Mecánicas Canónicas y Bestiario", () => {
  // ── BESTIARIO Y FORMAS SALVAJES (D&D 5.5) ──
  describe("Bestiario: Formas de bestia oficiales de D&D 5.5", () => {
    it("incluye Vaca en el compendio oficial con VD 1/4 y características canónicas", () => {
      const vaca = MONSTRUOS_INICIALES.find((m) => m.id === "m_vaca");
      expect(vaca).toBeDefined();
      expect(vaca?.nombre).toBe("Vaca");
      expect(vaca?.tipo).toBe("Bestia");
      expect(vaca?.desafio).toBe("1/4");
      expect(vaca?.tamaño).toBe("Grande");
      expect(vaca?.caracteristicas.fuerza).toBe(18);
      expect(vaca?.acciones.some((a) => a.nombre === "Cuernos")).toBe(true);
      expect(vaca?.rasgos.some((r) => r.nombre === "Carga")).toBe(true);
    });

    it("incluye Velociraptor en el compendio oficial con VD 1/4 y características canónicas", () => {
      const raptor = MONSTRUOS_INICIALES.find((m) => m.id === "m_velociraptor");
      expect(raptor).toBeDefined();
      expect(raptor?.nombre).toBe("Velociraptor");
      expect(raptor?.tipo).toBe("Bestia");
      expect(raptor?.desafio).toBe("1/4");
      expect(raptor?.tamaño).toBe("Diminuto");
      expect(raptor?.caracteristicas.destreza).toBe(14);
      expect(raptor?.rasgos.some((r) => r.nombre === "Tácticas de manada")).toBe(true);
      expect(raptor?.acciones.some((a) => a.nombre === "Ataque múltiple")).toBe(true);
    });

    it("contiene una rica selección de bestias canónicas para Forma salvaje", () => {
      const bestias = MONSTRUOS_INICIALES.filter((m) => (m.tipo || "").toLowerCase().includes("bestia"));
      expect(bestias.length).toBeGreaterThanOrEqual(98);

      const lobo = bestias.find((b) => b.nombre === "Lobo");
      const arana = bestias.find((b) => b.nombre === "Araña");
      const oso = bestias.find((b) => b.nombre === "Oso pardo");
      expect(lobo).toBeDefined();
      expect(arana).toBeDefined();
      expect(oso).toBeDefined();
    });
  });

  // ── CLASE BASE: NIVEL 1 Y 2 ──
  describe("Nivel 1 y 2: Druídico, Orden primigenio y Forma salvaje", () => {
    it("Druídico es pasivo permanente", () => {
      const rasgosNv1 = obtenerRasgosClaseYSubclase("Druida", 1);
      const druidico = rasgosNv1.find((r) => r.nombre === "Druídico");
      expect(druidico).toBeDefined();
      expect(druidico?.categoriaMecanica).toBe("pasivo_permanente");
      expect(druidico?.tipoAccion).toBe("pasivo");
    });

    it("Orden primigenio se clasifica como selector informativo con opciones Mago y Guardián y rasgos hijos separados", () => {
      const rasgosNv1 = obtenerRasgosClaseYSubclase("Druida", 1);
      const orden = rasgosNv1.find((r) => r.nombre === "Orden primigenio");
      expect(orden).toBeDefined();
      expect(orden?.categoriaMecanica).toBe("selector_informativo");
      expect(orden?.selectores).toBeDefined();
      expect(orden?.selectores?.[0].id).toBe("selector_orden_primigenio");

      const opciones = orden?.selectores?.[0].opciones.map((o) => o.id);
      expect(opciones).toContain("mago");
      expect(opciones).toContain("guardian");

      const guardian = rasgosNv1.find((r) => r.nombre === "Orden primigenio: Guardián");
      expect(guardian).toBeDefined();
      expect(guardian?.ligadoA).toBe("rasgo_cls_druida_orden_primigenio");
      expect(guardian?.requiereOpcion).toBe("guardian");
      expect(guardian?.efectos?.some((e) => e.objetivo === "armas_marciales")).toBe(true);
      expect(guardian?.efectos?.some((e) => e.objetivo === "armaduras_medias")).toBe(true);

      const naturalista = rasgosNv1.find((r) => r.nombre === "Orden primigenio: Naturalista");
      expect(naturalista).toBeDefined();
      expect(naturalista?.ligadoA).toBe("rasgo_cls_druida_orden_primigenio");
      expect(naturalista?.requiereOpcion).toBe("mago");
      expect(naturalista?.efectos?.some((e) => e.tipo === "bono_habilidad" && e.objetivo === "habilidad.arcanos")).toBe(true);
      expect(naturalista?.efectos?.some((e) => e.tipo === "bono_habilidad" && e.objetivo === "habilidad.naturaleza")).toBe(true);
      expect(naturalista?.selectores?.some((s) => s.id === "selector_truco_orden_primigenio")).toBe(true);
    });

    it("Alternar selector de Orden primigenio preserva la reactividad mecánica de Guardián y Naturalista", () => {
      const store = usarAlmacenDM.getState();
      const personaje = aplicarBuildClaseAPersonaje({
        ...structuredClone(PERSONAJE_POR_DEFECTO),
        caracteristicas: { fuerza: 10, destreza: 10, constitucion: 10, inteligencia: 10, sabiduria: 16, carisma: 10 }
      }, "Druida", 1);

      const id = store.crearPersonaje(personaje);
      const idOrden = "rasgo_cls_druida_orden_primigenio";

      // 1. Seleccionar Naturalista (mago)
      store.actualizarSeleccionRasgo(id, idOrden, "selector_orden_primigenio", ["mago"]);
      let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(estaRasgoActivo(pj, "Orden primigenio: Guardián")).toBe(false);
      expect(estaRasgoActivo(pj, "Orden primigenio: Naturalista")).toBe(true);
      let efectos = evaluarEfectosRasgosActivos(pj);
      expect(efectos.some((e) => e.objetivo === "armaduras_medias")).toBe(false);
      expect(efectos.some((e) => e.objetivo === "habilidad.arcanos")).toBe(true);
      expect(efectos.some((e) => e.objetivo === "habilidad.naturaleza")).toBe(true);

      // 2. Conmutar a Guardián
      store.actualizarSeleccionRasgo(id, idOrden, "selector_orden_primigenio", ["guardian"]);
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(estaRasgoActivo(pj, "Orden primigenio: Guardián")).toBe(true);
      expect(estaRasgoActivo(pj, "Orden primigenio: Naturalista")).toBe(false);
      efectos = evaluarEfectosRasgosActivos(pj);
      expect(efectos.some((e) => e.objetivo === "armaduras_medias")).toBe(true);
      expect(efectos.some((e) => e.objetivo === "armas_marciales")).toBe(true);
      expect(efectos.some((e) => e.objetivo === "habilidad.arcanos")).toBe(false);

      // 3. Regresar a Naturalista
      store.actualizarSeleccionRasgo(id, idOrden, "selector_orden_primigenio", ["mago"]);
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(estaRasgoActivo(pj, "Orden primigenio: Guardián")).toBe(false);
      expect(estaRasgoActivo(pj, "Orden primigenio: Naturalista")).toBe(true);
      efectos = evaluarEfectosRasgosActivos(pj);
      expect(efectos.some((e) => e.objetivo === "armaduras_medias")).toBe(false);
      expect(efectos.some((e) => e.objetivo === "habilidad.arcanos")).toBe(true);
    });

    it("Forma salvaje es consumible y activable con recarga dinámica (1 en descanso corto)", () => {
      const rasgosNv2 = obtenerRasgosClaseYSubclase("Druida", 2);
      const formaSalvaje = rasgosNv2.find((r) => r.nombre === "Forma salvaje");
      expect(formaSalvaje).toBeDefined();
      expect(formaSalvaje?.categoriaMecanica).toBe("consumible");
      expect(formaSalvaje?.esActivable).toBe(true);
      expect(formaSalvaje?.condicionAlActivar).toBe("Forma salvaje");
      expect(formaSalvaje?.tieneUsosLimitados).toBe(true);
      expect(formaSalvaje?.usosMaximos).toBe(2);
      expect(formaSalvaje?.recuperacion).toBe("descanso_dinamico");
      expect(formaSalvaje?.recargaDescansoCorto).toBe(1);

      // Escalado de usos por nivel (2 a nv 2, 3 a nv 6, 4 a nv 17)
      const formaNv6 = obtenerRasgosClaseYSubclase("Druida", 6).find((r) => r.nombre === "Forma salvaje");
      expect(formaNv6?.usosMaximos).toBe(3);

      const formaNv17 = obtenerRasgosClaseYSubclase("Druida", 17).find((r) => r.nombre === "Forma salvaje");
      expect(formaNv17?.usosMaximos).toBe(4);
    });

    it("Compañero salvaje concede Encontrar familiar sin una reserva propia", () => {
      const rasgosNv2 = obtenerRasgosClaseYSubclase("Druida", 2);
      const companero = rasgosNv2.find((r) => r.nombre === "Compañero salvaje");
      expect(companero).toMatchObject({ categoriaMecanica: "pasivo_permanente", tipoAccion: "pasivo",
        tieneUsosLimitados: false, conjurosOtorgados: ["h_encontrar-familiar"] });
    });
  });

  // ── CLASE BASE: NIVELES SUPERIORES ──
  describe("Niveles superiores: Resurgimiento salvaje, Furia elemental y Archidruida", () => {
    it("Resurgimiento salvaje (Nv 5) es consumible con límite 1 por descanso largo", () => {
      const rasgosNv5 = obtenerRasgosClaseYSubclase("Druida", 5);
      const resurgimiento = rasgosNv5.find((r) => r.nombre === "Resurgimiento salvaje");
      expect(resurgimiento).toBeDefined();
      expect(resurgimiento?.categoriaMecanica).toBe("consumible");
      expect(resurgimiento?.usosMaximos).toBe(1);
      expect(resurgimiento?.recuperacion).toBe("descanso_largo");
    });

    it("Furia elemental (Nv 7) es selector informativo con Lanzamiento potente y Golpe primordial como rasgos hijos separados", () => {
      const rasgosNv7 = obtenerRasgosClaseYSubclase("Druida", 7);
      const furia = rasgosNv7.find((r) => r.nombre === "Furia elemental");
      expect(furia).toBeDefined();
      expect(furia?.categoriaMecanica).toBe("selector_informativo");
      expect(furia?.selectores).toBeDefined();

      const opciones = furia?.selectores?.[0].opciones.map((o) => o.id);
      expect(opciones).toContain("lanzamiento_potente");
      expect(opciones).toContain("golpe_primordial");

      const potente = rasgosNv7.find((r) => r.nombre === "Furia elemental: Lanzamiento potente");
      expect(potente).toBeDefined();
      expect(potente?.ligadoA).toBe("rasgo_cls_druida_furia_elemental");
      expect(potente?.requiereOpcion).toBe("lanzamiento_potente");
      expect(potente?.efectos?.some((e) => e.tipo === "bono_dano_conjuro")).toBe(true);

      const golpe = rasgosNv7.find((r) => r.nombre === "Furia elemental: Golpe primordial");
      expect(golpe).toBeDefined();
      expect(golpe?.ligadoA).toBe("rasgo_cls_druida_furia_elemental");
      expect(golpe?.requiereOpcion).toBe("golpe_primordial");
      expect(golpe?.formulaDados).toBe("1d8");
      expect(golpe?.resolucionAsistida?.integrarEnDanoDeArma).toBe(true);
    });

    it("Alternar selector de Furia elemental preserva la reactividad mecánica de Golpe primordial y Lanzamiento potente", () => {
      const store = usarAlmacenDM.getState();
      const personaje = aplicarBuildClaseAPersonaje({
        ...structuredClone(PERSONAJE_POR_DEFECTO),
        caracteristicas: { fuerza: 10, destreza: 10, constitucion: 10, inteligencia: 10, sabiduria: 16, carisma: 10 }
      }, "Druida", 7);

      const id = store.crearPersonaje(personaje);
      const idFuria = "rasgo_cls_druida_furia_elemental";

      // 1. Seleccionar Golpe primordial
      store.actualizarSeleccionRasgo(id, idFuria, "selector_furia_elemental", ["golpe_primordial"]);
      let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(estaRasgoActivo(pj, "Furia elemental: Golpe primordial")).toBe(true);
      expect(estaRasgoActivo(pj, "Furia elemental: Lanzamiento potente")).toBe(false);

      // 2. Conmutar a Lanzamiento potente
      store.actualizarSeleccionRasgo(id, idFuria, "selector_furia_elemental", ["lanzamiento_potente"]);
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(estaRasgoActivo(pj, "Furia elemental: Golpe primordial")).toBe(false);
      expect(estaRasgoActivo(pj, "Furia elemental: Lanzamiento potente")).toBe(true);
      const efectos = evaluarEfectosRasgosActivos(pj);
      expect(efectos.some((e) => e.tipo === "bono_dano_conjuro")).toBe(true);

      // 3. Regresar a Golpe primordial
      store.actualizarSeleccionRasgo(id, idFuria, "selector_furia_elemental", ["golpe_primordial"]);
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
      expect(estaRasgoActivo(pj, "Furia elemental: Golpe primordial")).toBe(true);
      expect(estaRasgoActivo(pj, "Furia elemental: Lanzamiento potente")).toBe(false);
    });

    it("Archidruida (Nv 20) es consumible para conversión de espacios y recuperación en iniciativa", () => {
      const rasgosNv20 = obtenerRasgosClaseYSubclase("Druida", 20);
      const archidruida = rasgosNv20.find((r) => r.nombre === "Archidruida");
      expect(archidruida).toBeDefined();
      expect(archidruida?.categoriaMecanica).toBe("consumible");
      expect(archidruida?.recuperacion).toBe("descanso_largo");
    });
  });

  // ── SUBCLASES OFICIALES (PHB 2024) ──
  describe("Subclases oficiales de Druida", () => {
    it("Círculo de la Tierra: bioma como selector_informativo y auxilio_de_la_tierra consumible", () => {
      const rasgosTierra = obtenerRasgosClaseYSubclase("Druida", 3, "Círculo de la Tierra");
      const conjurosTierra = rasgosTierra.find((r) => r.nombre.includes("Conjuros del Círculo de la Tierra"));
      expect(conjurosTierra).toBeDefined();
      expect(conjurosTierra?.categoriaMecanica).toBe("selector_informativo");
      expect(conjurosTierra?.selectores?.[0].opciones.map((o) => o.id)).toEqual([
        "arida",
        "polar",
        "templada",
        "tropical"
      ]);

      const auxilio = rasgosTierra.find((r) => r.nombre.includes("Auxilio de la tierra"));
      expect(auxilio).toBeDefined();
      expect(auxilio?.categoriaMecanica).toBe("consumible");
    });

    it("Círculo del Mar: Ira del mar es consumible y activable", () => {
      const rasgosMar = obtenerRasgosClaseYSubclase("Druida", 6, "Círculo del Mar");
      const iraMar = rasgosMar.find((r) => r.nombre.includes("Ira del mar"));
      expect(iraMar).toBeDefined();
      expect(iraMar?.categoriaMecanica).toBe("consumible");
      expect(iraMar?.esActivable).toBe(true);
      expect(iraMar?.condicionAlActivar).toBe("Ira del mar");
    });

    it("Círculo de las Estrellas: Mapa estelar y Presagio cósmico consumibles, Forma estelar activable con selector", () => {
      const rasgosEstrellas = obtenerRasgosClaseYSubclase("Druida", 6, "Círculo de las Estrellas");
      const mapa = rasgosEstrellas.find((r) => r.nombre.includes("Mapa estelar"));
      expect(mapa).toBeDefined();
      expect(mapa?.categoriaMecanica).toBe("consumible");

      const formaEstelar = rasgosEstrellas.find((r) => r.nombre.includes("Forma estelar"));
      expect(formaEstelar).toBeDefined();
      expect(formaEstelar?.categoriaMecanica).toBe("consumible");
      expect(formaEstelar?.esActivable).toBe(true);
      expect(formaEstelar?.selectores?.[0].id).toBe("selector_constelacion_estelar");

      const presagio = rasgosEstrellas.find((r) => r.nombre.includes("Presagio cósmico"));
      expect(presagio).toBeDefined();
      expect(presagio?.categoriaMecanica).toBe("consumible");
      expect(presagio?.tieneUsosLimitados).toBe(true);
    });
  });
});
