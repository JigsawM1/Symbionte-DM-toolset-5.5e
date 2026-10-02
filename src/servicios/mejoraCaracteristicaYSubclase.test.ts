import { describe, it, expect } from "vitest";
import {
  obtenerRasgosClaseYSubclase,
  esRasgoPlaceholderSubclase
} from "@/servicios/gestorClases";
import {
  esRasgoVersatil,
  construirDoteDeVersatil,
  obtenerEspeciePorId,
  construirRasgosEspecie
} from "@/servicios/gestorEspecies";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador } from "@/tipos";

describe("Comportamiento Canónico de Rasgos: Subclase y Mejora de Característica (D&D 5.5e)", () => {
  describe("1. Ocultación y filtrado del rasgo marcador de subclase", () => {
    it("esRasgoPlaceholderSubclase reconoce correctamente todas las variantes de nombres de subclase genéricas", () => {
      expect(esRasgoPlaceholderSubclase("Subclase de brujo")).toBe(true);
      expect(esRasgoPlaceholderSubclase("Subclase de bárbaro")).toBe(true);
      expect(esRasgoPlaceholderSubclase("Subclase de clérigo")).toBe(true);
      expect(esRasgoPlaceholderSubclase("Subclase")).toBe(true);
      expect(esRasgoPlaceholderSubclase("Rasgo de subclase")).toBe(true);

      // Rasgos legítimos que no deben ser filtrados
      expect(esRasgoPlaceholderSubclase("Magia del pacto")).toBe(false);
      expect(esRasgoPlaceholderSubclase("Astucia mágica")).toBe(false);
      expect(esRasgoPlaceholderSubclase("Preservar la vida")).toBe(false);
    });

    it("obtenerRasgosClaseYSubclase no incluye el rasgo 'Subclase de brujo' para un Brujo a nivel 3 ni 6", () => {
      const rasgosBrujoNv3 = obtenerRasgosClaseYSubclase("Brujo", 3);
      const tienePlaceholderNv3 = rasgosBrujoNv3.some((r) => esRasgoPlaceholderSubclase(r.nombre));
      expect(tienePlaceholderNv3).toBe(false);

      const rasgosBrujoNv6 = obtenerRasgosClaseYSubclase("Brujo", 6);
      const tienePlaceholderNv6 = rasgosBrujoNv6.some((r) => esRasgoPlaceholderSubclase(r.nombre));
      expect(tienePlaceholderNv6).toBe(false);
    });

    it("sincronizarRasgosAutomaticos purga cualquier marcador de subclase de los rasgos de un personaje", () => {
      const personajeMock: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_test_brujo",
        nombre: "Brujo de Prueba",
        clase: "Brujo",
        subclase: "El Primordial",
        nivel: 6,
        rasgos: [
          {
            id: "rasgo_cls_brujo_subclase_de_brujo",
            nombre: "Subclase de brujo",
            descripcion: "Consigues una subclase de brujo...",
            origen: "clase",
            fuente: "Brujo (Nivel 3)",
            tipoAccion: "pasivo",
            tieneUsosLimitados: false,
            recuperacion: "ninguno",
            personalizado: false,
            activo: true,
            notas: ""
          }
        ]
      };

      const sincronizados = sincronizarRasgosAutomaticos(personajeMock);
      const tieneSubclaseBrujo = sincronizados.some((r) => esRasgoPlaceholderSubclase(r.nombre));
      expect(tieneSubclaseBrujo).toBe(false);
    });
  });

  describe("2. Rasgo Mejora de Característica y Dote Homónima por Defecto", () => {
    it("crea un rasgo individual por cada nivel en que la clase gana Mejora de Característica", () => {
      // Brujo nivel 6: gana el rasgo a nivel 4 (1 rasgo)
      const rasgosBrujoNv6 = obtenerRasgosClaseYSubclase("Brujo", 6);
      const mejorasNv6 = rasgosBrujoNv6.filter((r) => r.nombre === "Mejora de característica");
      expect(mejorasNv6).toHaveLength(1);
      expect(mejorasNv6[0].nivelRequerido).toBe(4);
      expect(mejorasNv6[0].selectores).toBeDefined();
      expect(mejorasNv6[0].selectores?.[0].valorActual).toEqual(["dote_mejora_caracteristica"]);

      // Brujo nivel 8: gana el rasgo a nivel 4 y nivel 8 (2 rasgos individuales)
      const rasgosBrujoNv8 = obtenerRasgosClaseYSubclase("Brujo", 8);
      const mejorasNv8 = rasgosBrujoNv8.filter((r) => r.nombre === "Mejora de característica");
      expect(mejorasNv8).toHaveLength(2);
      expect(mejorasNv8.map((m) => m.nivelRequerido)).toEqual([4, 8]);
      expect(mejorasNv8.every((m) => m.selectores?.[0].valorActual[0] === "dote_mejora_caracteristica")).toBe(true);
    });

    it("sincronizarRasgosAutomaticos añade por defecto la dote con el mismo nombre en la sección de dotes", () => {
      const personajeBrujoNv6: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_brujo_6",
        nombre: "Brujo 6",
        clase: "Brujo",
        nivel: 6,
        clases: [{ nombre: "Brujo", nivel: 6, subclase: "" }],
        rasgos: []
      };

      const rasgosSincronizados = sincronizarRasgosAutomaticos(personajeBrujoNv6);

      // Debe contener el rasgo de clase de nivel 4
      const rasgoClaseMejora = rasgosSincronizados.find(
        (r) => r.origen === "clase" && r.nombre === "Mejora de característica" && r.nivelRequerido === 4
      );
      expect(rasgoClaseMejora).toBeDefined();

      // Debe contener la dote homónima generada por defecto
      const doteGenerada = rasgosSincronizados.find(
        (r) => r.origen === "dote" && r.nombre === "Mejora de Característica" && r.ligadoA === rasgoClaseMejora?.id
      );
      expect(doteGenerada).toBeDefined();
      expect(doteGenerada?.fuente).toContain("Nivel 4");
      expect(doteGenerada?.descripcion).toContain("Aumenta en 2 una puntuación de característica");

      // Debe generarse con origen 'dote' para clasificarse en el bloque de dotes
      expect(doteGenerada?.origen).toBe("dote");
    });

    it("respeta la selección personalizada cuando el jugador cambia la dote en el selector", () => {
      const personajeConDoteCambiada: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_brujo_alerta",
        nombre: "Brujo con Alerta",
        clase: "Brujo",
        nivel: 6,
        clases: [{ nombre: "Brujo", nivel: 6, subclase: "" }],
        rasgos: [
          {
            id: "rasgo_cls_brujo_mejora_de_caracteristica_nv4",
            nombre: "Mejora de característica",
            descripcion: "Obtienes una dote...",
            origen: "clase",
            fuente: "Brujo (Nivel 4)",
            tipoAccion: "pasivo",
            nivelRequerido: 4,
            tieneUsosLimitados: false,
            recuperacion: "ninguno",
            categoriaMecanica: "selector_informativo",
            selectores: [
              {
                id: "selector_dote_asi_brujo_nv4",
                tipo: "unico",
                etiqueta: "Dote elegida",
                maxSelecciones: 1,
                valorActual: ["dote_alerta"],
                opciones: []
              }
            ],
            personalizado: false,
            activo: true,
            notas: ""
          }
        ]
      };

      const sincronizados = sincronizarRasgosAutomaticos(personajeConDoteCambiada);

      // La dote asociada debe ser ahora Alerta
      const doteAlerta = sincronizados.find(
        (r) => r.origen === "dote" && r.nombre === "Alerta" && r.ligadoA === "rasgo_cls_brujo_mejora_de_caracteristica_nv4"
      );
      expect(doteAlerta).toBeDefined();
      expect(doteAlerta?.efectos?.some((e) => e.objetivo === "iniciativa")).toBe(true);

      // Y no debe existir una dote de Mejora de Característica duplicada para ese nivel
      const dotesParaNv4 = sincronizados.filter((r) => r.origen === "dote" && r.ligadoA === "rasgo_cls_brujo_mejora_de_caracteristica_nv4");
      expect(dotesParaNv4).toHaveLength(1);
    });

    it("a nivel 8 un Brujo obtiene dos dotes independientes ligadas a sus respectivos niveles 4 y 8", () => {
      const personajeBrujoNv8: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_brujo_8",
        nombre: "Brujo 8",
        clase: "Brujo",
        nivel: 8,
        clases: [{ nombre: "Brujo", nivel: 8, subclase: "" }],
        rasgos: []
      };

      const sincronizados = sincronizarRasgosAutomaticos(personajeBrujoNv8);

      const dotesASI = sincronizados.filter((r) => r.origen === "dote" && r.id.startsWith("dote_asi_"));
      expect(dotesASI).toHaveLength(2);
      expect(dotesASI.map((d) => d.nivelRequerido)).toEqual([4, 8]);
      expect(dotesASI.every((d) => d.nombre === "Mejora de Característica")).toBe(true);
    });

    it("actualizarSeleccionRasgo en el store Zustand transforma reactivamente la dote vinculada y sus efectos", () => {
      const personajeInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_store_asi",
        nombre: "Brujo Store",
        clase: "Brujo",
        nivel: 4,
        clases: [{ nombre: "Brujo", nivel: 4, subclase: "" }],
        hpMaximoBase: 25,
        hpMaximo: 25,
        hpActual: 25,
        rasgos: []
      };

      const sincronizados = sincronizarRasgosAutomaticos(personajeInicial);

      usarAlmacenDM.setState({
        personajes: [{ ...personajeInicial, rasgos: sincronizados }],
        idPersonajeActivo: "pj_store_asi"
      });

      const store = usarAlmacenDM.getState();
      const rasgoMejora = sincronizados.find((r) => r.origen === "clase" && r.nombre === "Mejora de característica");
      expect(rasgoMejora).toBeDefined();

      const selectorId = rasgoMejora?.selectores?.[0].id || "selector_dote_asi_brujo_nv4";

      // Cambiamos a la dote Alerta
      store.actualizarSeleccionRasgo("pj_store_asi", rasgoMejora!.id, selectorId, ["dote_alerta"]);

      const pjTrasAlerta = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_store_asi");
      const doteAlerta = pjTrasAlerta?.rasgos.find((r) => r.origen === "dote" && r.ligadoA === rasgoMejora!.id);
      expect(doteAlerta?.nombre).toBe("Alerta");
      expect(doteAlerta?.efectos?.some((e) => e.objetivo === "iniciativa")).toBe(true);

      // Cambiamos ahora a la dote Duro (Tough: +2 HP por nivel -> +8 HP)
      store.actualizarSeleccionRasgo("pj_store_asi", rasgoMejora!.id, selectorId, ["dote_duro"]);

      const pjTrasDuro = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_store_asi");
      const doteDuro = pjTrasDuro?.rasgos.find((r) => r.origen === "dote" && r.ligadoA === rasgoMejora!.id);
      expect(doteDuro?.nombre).toBe("Duro");
      expect(doteDuro?.efectos?.some((e) => e.tipo === "modificador_hp_maximo")).toBe(true);
      expect(pjTrasDuro?.hpMaximo).toBe(25 + 4 * 2); // 33 HP
    });
  });

  describe("3. Rasgo Don Épico a Nivel 19 y Priorización de Dones Épicos", () => {
    it("crea el rasgo Don épico a nivel 19 con selector que prioriza Dones Épicos y selecciona el recomendado", () => {
      // Brujo nivel 19
      const rasgosBrujoNv19 = obtenerRasgosClaseYSubclase("Brujo", 19);
      const rasgoDonEpico = rasgosBrujoNv19.find((r) => r.nombre === "Don épico");
      expect(rasgoDonEpico).toBeDefined();
      expect(rasgoDonEpico?.nivelRequerido).toBe(19);
      expect(rasgoDonEpico?.categoriaMecanica).toBe("selector_informativo");

      const selector = rasgoDonEpico?.selectores?.[0];
      expect(selector).toBeDefined();
      expect(selector?.etiqueta).toBe("Don épico elegido");

      // Por defecto para Brujo se recomienda Don del destino
      expect(selector?.valorActual).toEqual(["dote_don_destino"]);

      // Las primeras opciones del selector deben ser Dones Épicos (priorizados)
      const primerasOpciones = selector?.opciones.slice(0, 10) || [];
      expect(primerasOpciones.every((op) => op.id.startsWith("dote_don_"))).toBe(true);
    });

    it("asigna la dote recomendada respectiva por clase (ej. Guerrero -> Don de la pericia en combate, Bárbaro -> Don del ataque imparable)", () => {
      const rasgosGuerreroNv19 = obtenerRasgosClaseYSubclase("Guerrero", 19);
      const donGuerrero = rasgosGuerreroNv19.find((r) => r.nombre === "Don épico");
      expect(donGuerrero?.selectores?.[0].valorActual).toEqual(["dote_don_pericia_combate"]);

      const rasgosBarbaroNv19 = obtenerRasgosClaseYSubclase("Bárbaro", 19);
      const donBarbaro = rasgosBarbaroNv19.find((r) => r.nombre === "Don épico");
      expect(donBarbaro?.selectores?.[0].valorActual).toEqual(["dote_don_ataque_imparable"]);
    });

    it("sincronizarRasgosAutomaticos inyecta la dote de don épico ligada en la sección de dotes", () => {
      const personajeNv19: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_don_19",
        nombre: "Guerrero Épico",
        clase: "Guerrero",
        nivel: 19,
        clases: [{ nombre: "Guerrero", nivel: 19, subclase: "" }],
        rasgos: []
      };

      const rasgosSincronizados = sincronizarRasgosAutomaticos(personajeNv19);
      const rasgoDonEpicoClase = rasgosSincronizados.find(
        (r) => r.origen === "clase" && r.nombre === "Don épico"
      );
      expect(rasgoDonEpicoClase).toBeDefined();

      const doteDonGenerada = rasgosSincronizados.find(
        (r) => r.origen === "dote" && r.id.startsWith("dote_don_") && r.ligadoA === rasgoDonEpicoClase?.id
      );
      expect(doteDonGenerada).toBeDefined();
      expect(doteDonGenerada?.nombre).toBe("Don de la Pericia en Combate");
      expect(doteDonGenerada?.nivelRequerido).toBe(19);
    });

    it("actualizarSeleccionRasgo muta reactivamente la dote de don épico y recalcula efectos como HP máximo", () => {
      const personajeNv19: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_don_reactivo",
        nombre: "Guerrero Reactivo",
        clase: "Guerrero",
        nivel: 19,
        clases: [{ nombre: "Guerrero", nivel: 19, subclase: "" }],
        hpMaximoBase: 150,
        hpMaximo: 150,
        hpActual: 150,
        rasgos: []
      };

      const rasgosSincronizados = sincronizarRasgosAutomaticos(personajeNv19);
      usarAlmacenDM.setState({
        personajes: [{ ...personajeNv19, rasgos: rasgosSincronizados }],
        idPersonajeActivo: "pj_don_reactivo"
      });

      const store = usarAlmacenDM.getState();
      const rasgoDon = rasgosSincronizados.find((r) => r.origen === "clase" && r.nombre === "Don épico");
      expect(rasgoDon).toBeDefined();

      const selectorId = rasgoDon?.selectores?.[0]?.id || "selector_dote_don_epico_guerrero_nv19";

      // Cambiamos a Don de la Fortaleza (+40 HP máximos)
      store.actualizarSeleccionRasgo("pj_don_reactivo", rasgoDon!.id, selectorId, ["dote_don_fortaleza"]);

      const pjActualizado = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_don_reactivo");
      const doteFortaleza = pjActualizado?.rasgos.find((r) => r.origen === "dote" && r.ligadoA === rasgoDon!.id);

      expect(doteFortaleza?.nombre).toBe("Don de la Fortaleza");
      expect(doteFortaleza?.efectos?.some((e) => e.tipo === "modificador_hp_maximo" && e.valor === 40)).toBe(true);
      expect(pjActualizado?.hpMaximo).toBe(150 + 40); // 190 HP
    });
  });

  describe("3. Rasgo Versátil de Humano: Concesión interactiva de Dote de Origen (D&D 5.5e)", () => {
    it("esRasgoVersatil identifica correctamente variantes del rasgo Versátil", () => {
      expect(esRasgoVersatil("Versátil")).toBe(true);
      expect(esRasgoVersatil("versatil")).toBe(true);
      expect(esRasgoVersatil("Humano: Versátil")).toBe(true);
      expect(esRasgoVersatil("Versátil", "especie")).toBe(true);
      expect(esRasgoVersatil("Ingenioso")).toBe(false);
      expect(esRasgoVersatil("Diestro")).toBe(false);
      expect(esRasgoVersatil("Embaucador versátil")).toBe(false);
      expect(esRasgoVersatil("Embaucador versátil", "subclase")).toBe(false);
      expect(esRasgoVersatil("Versátil", "subclase")).toBe(false);
    });

    it("construirDoteDeVersatil genera correctamente la dote sintética de origen ligada", () => {
      const rasgoPadreMock: import("@/tipos").RasgoPersonaje = {
        id: "rasgo_especie_humano_versatil",
        nombre: "Versátil",
        descripcion: "Consigues una dote de origen...",
        origen: "especie",
        fuente: "Especie (Humano)",
        tipoAccion: "pasivo",
        tieneUsosLimitados: false,
        recuperacion: "ninguno",
        personalizado: false,
        activo: true,
        notas: ""
      };

      const doteAlerta = construirDoteDeVersatil(rasgoPadreMock, "dote_alerta");
      expect(doteAlerta.id).toBe("dote_origen_rasgo_especie_humano_versatil");
      expect(doteAlerta.nombre).toBe("Alerta");
      expect(doteAlerta.origen).toBe("dote");
      expect(doteAlerta.ligadoA).toBe("rasgo_especie_humano_versatil");
      expect(doteAlerta.nivelRequerido).toBe(1);

      // Con fallback a dote_alerta si el ID no existe
      const doteFallback = construirDoteDeVersatil(rasgoPadreMock, "id_inexistente");
      expect(doteFallback.nombre).toBe("Alerta");
    });

    it("construirRasgosEspecie para Humano hidrata el selector de Versátil con las 12 dotes de origen canónicas y Alerta por defecto", () => {
      const especieHumano = obtenerEspeciePorId("humano");
      expect(especieHumano).toBeDefined();

      const rasgos = construirRasgosEspecie(especieHumano!, undefined, 1, 2);
      const rasgoVersatil = rasgos.find((r) => esRasgoVersatil(r.nombre));

      expect(rasgoVersatil).toBeDefined();
      expect(rasgoVersatil?.categoriaMecanica).toBe("selector_informativo");
      expect(rasgoVersatil?.selectores).toBeDefined();
      expect(rasgoVersatil?.selectores?.length).toBe(1);

      const selectorDote = rasgoVersatil!.selectores![0];
      expect(selectorDote.id).toBe("selector_dote_origen_humano_versatil");
      expect(selectorDote.maxSelecciones).toBe(1);
      expect(selectorDote.valorActual).toEqual(["dote_alerta"]);

      // Comprobar que contiene las 12 dotes de origen canónicas hidratadas dinámicamente
      expect(selectorDote.opciones.length).toBe(12);
      const idsOpciones = selectorDote.opciones.map((o) => o.id);
      expect(idsOpciones).toContain("dote_alerta");
      expect(idsOpciones).toContain("dote_afortunado");
      expect(idsOpciones).toContain("dote_iniciado_magia_clerigo");
      expect(idsOpciones).toContain("dote_musico");
      expect(idsOpciones).toContain("dote_maton_taberna");
    });

    it("sincronizarRasgosAutomaticos inyecta la dote de origen ligada (Alerta por defecto) en la sección de dotes", () => {
      const pjHumano: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_humano_versatil_test",
        nombre: "Humano Versátil",
        especie: "Humano",
        nivel: 1,
        rasgos: []
      };

      const rasgosSincronizados = sincronizarRasgosAutomaticos(pjHumano);
      const rasgoVersatil = rasgosSincronizados.find((r) => esRasgoVersatil(r.nombre));
      expect(rasgoVersatil).toBeDefined();

      const doteOrigenLigada = rasgosSincronizados.find(
        (r) => r.origen === "dote" && r.id.startsWith("dote_origen_") && r.ligadoA === rasgoVersatil?.id
      );

      expect(doteOrigenLigada).toBeDefined();
      expect(doteOrigenLigada?.nombre).toBe("Alerta");
      expect(doteOrigenLigada?.fuente).toContain("Humano");
      expect(doteOrigenLigada?.nivelRequerido).toBe(1);
    });

    it("actualizarSeleccionRasgo actualiza reactivamente la dote ligada cuando el usuario elige otra dote de origen", () => {
      const pjHumano: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_humano_store_test",
        nombre: "Humano de Almacén",
        especie: "Humano",
        nivel: 1,
        rasgos: []
      };

      const rasgosSincronizados = sincronizarRasgosAutomaticos(pjHumano);
      usarAlmacenDM.setState({
        personajes: [{ ...pjHumano, rasgos: rasgosSincronizados }],
        idPersonajeActivo: "pj_humano_store_test"
      });

      const store = usarAlmacenDM.getState();
      const rasgoVersatil = rasgosSincronizados.find((r) => esRasgoVersatil(r.nombre));
      expect(rasgoVersatil).toBeDefined();

      const selectorId = rasgoVersatil!.selectores![0].id;

      // El usuario selecciona "Afortunado" en vez de "Alerta"
      store.actualizarSeleccionRasgo("pj_humano_store_test", rasgoVersatil!.id, selectorId, ["dote_afortunado"]);

      const pjActualizado = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_humano_store_test");
      const doteAfortunado = pjActualizado?.rasgos.find(
        (r) => r.origen === "dote" && r.ligadoA === rasgoVersatil!.id
      );

      expect(doteAfortunado).toBeDefined();
      expect(doteAfortunado?.nombre).toBe("Afortunado");
      expect(doteAfortunado?.id).toBe(`dote_origen_${rasgoVersatil!.id.toLowerCase()}`);
      expect(doteAfortunado?.tieneUsosLimitados).toBe(true);

      // Comprobar que el selector también guardó la selección
      const rasgoVersatilActualizado = pjActualizado?.rasgos.find((r) => r.id === rasgoVersatil!.id);
      expect(rasgoVersatilActualizado?.selectores?.[0]?.valorActual).toEqual(["dote_afortunado"]);
    });
  });

  describe("5. Rasgo Estilo de Combate y Dote Vinculada en Store Zustand", () => {
    it("genera por defecto la dote vinculada con origen 'dote' y ligadoA para un Guerrero a nivel 1", () => {
      const pjGuerrero: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_guerrero_nv1",
        nombre: "Ragnar",
        clase: "Guerrero",
        nivel: 1,
        clases: [{ nombre: "Guerrero", nivel: 1, subclase: "" }],
        rasgos: []
      };

      const rasgosSincronizados = sincronizarRasgosAutomaticos(pjGuerrero);
      const rasgoEstilo = rasgosSincronizados.find(
        (r) => r.origen === "clase" && (r.nombre === "Estilo de combate" || r.id.includes("estilo_de_combate"))
      );
      expect(rasgoEstilo).toBeDefined();

      const doteDefensa = rasgosSincronizados.find(
        (r) => r.origen === "dote" && r.ligadoA === rasgoEstilo?.id
      );
      expect(doteDefensa).toBeDefined();
      expect(doteDefensa?.nombre).toBe("Defensa");
      expect(doteDefensa?.id).toBe(`dote_estilo_${rasgoEstilo!.id.toLowerCase()}`);
      expect(doteDefensa?.efectos?.some((e) => e.tipo === "modificador_ca")).toBe(true);
    });

    it("actualizarSeleccionRasgo transforma reactivamente la dote vinculada en el store Zustand", () => {
      const pjGuerrero: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_guerrero_store_test",
        nombre: "Sir Galahad",
        clase: "Guerrero",
        nivel: 1,
        clases: [{ nombre: "Guerrero", nivel: 1, subclase: "" }],
        rasgos: []
      };

      const rasgosSincronizados = sincronizarRasgosAutomaticos(pjGuerrero);
      usarAlmacenDM.setState({
        personajes: [{ ...pjGuerrero, rasgos: rasgosSincronizados }],
        idPersonajeActivo: "pj_guerrero_store_test"
      });

      const store = usarAlmacenDM.getState();
      const rasgoEstilo = rasgosSincronizados.find(
        (r) => r.origen === "clase" && (r.nombre === "Estilo de combate" || r.id.includes("estilo_de_combate"))
      );
      expect(rasgoEstilo).toBeDefined();

      const selectorId = rasgoEstilo!.selectores![0].id;

      // El jugador cambia su Estilo de Combate a "Duelo"
      store.actualizarSeleccionRasgo("pj_guerrero_store_test", rasgoEstilo!.id, selectorId, ["dote_estilo_duelo"]);

      const pjActualizado = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_guerrero_store_test");
      const dotesLigadas = pjActualizado?.rasgos.filter(
        (r) => r.origen === "dote" && r.ligadoA === rasgoEstilo!.id
      );

      // Debe existir exactamente 1 dote vinculada y debe ser Duelo
      expect(dotesLigadas).toHaveLength(1);
      const doteDuelo = dotesLigadas![0];
      expect(doteDuelo.nombre).toBe("Duelo");
      expect(doteDuelo.id).toBe(`dote_estilo_${rasgoEstilo!.id.toLowerCase()}`);
      expect(doteDuelo.efectos?.some((e) => e.tipo === "bono_dano_ataque")).toBe(true);

      // Cambiamos a "Combate con dos armas"
      store.actualizarSeleccionRasgo(
        "pj_guerrero_store_test",
        rasgoEstilo!.id,
        selectorId,
        ["dote_estilo_combate_dos_armas"]
      );

      const pjTrasDosArmas = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj_guerrero_store_test");
      const dotesTrasCambio = pjTrasDosArmas?.rasgos.filter(
        (r) => r.origen === "dote" && r.ligadoA === rasgoEstilo!.id
      );

      expect(dotesTrasCambio).toHaveLength(1);
      expect(dotesTrasCambio![0].nombre).toBe("Combate con dos armas");
    });
  });
});

