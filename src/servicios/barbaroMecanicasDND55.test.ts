import { describe, it, expect } from "vitest";
import { obtenerRasgosClaseYSubclase } from "./gestorClases";
import { calcularDefensaSinArmaduraRasgos } from "./evaluadorEfectosRasgos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { PersonajeJugador } from "@/tipos/personaje";

describe("Bárbaro D&D 5.5e (PHB 2024) - Fase 1: Reglas y Mecánicas de la Clase Base", () => {
  // ── NIVEL 1 ──
  describe("Nivel 1: Furia, Defensa sin armadura y Maestría con armas", () => {
    it("Furia se clasifica como consumible y escala sus usos de 2 a 6 por nivel", () => {
      const rasgosNv1 = obtenerRasgosClaseYSubclase("Bárbaro", 1);
      const furiaNv1 = rasgosNv1.find((r) => r.nombre === "Furia");
      expect(furiaNv1).toBeDefined();
      expect(furiaNv1?.categoriaMecanica).toBe("consumible");
      expect(furiaNv1?.tieneUsosLimitados).toBe(true);
      expect(furiaNv1?.usosMaximos).toBe(2);
      expect(furiaNv1?.recuperacion).toBe("descanso_largo");
      expect(furiaNv1?.esActivable).toBe(true);
      expect(furiaNv1?.condicionAlActivar).toBe("Furia (Rage)");

      // Escalados en niveles canónicos: 3 a nv 3, 4 a nv 6, 5 a nv 12, 6 a nv 17
      const furiaNv3 = obtenerRasgosClaseYSubclase("Bárbaro", 3).find((r) => r.nombre === "Furia");
      expect(furiaNv3?.usosMaximos).toBe(3);

      const furiaNv6 = obtenerRasgosClaseYSubclase("Bárbaro", 6).find((r) => r.nombre === "Furia");
      expect(furiaNv6?.usosMaximos).toBe(4);

      const furiaNv12 = obtenerRasgosClaseYSubclase("Bárbaro", 12).find((r) => r.nombre === "Furia");
      expect(furiaNv12?.usosMaximos).toBe(5);

      const furiaNv17 = obtenerRasgosClaseYSubclase("Bárbaro", 17).find((r) => r.nombre === "Furia");
      expect(furiaNv17?.usosMaximos).toBe(6);
    });

    it("Furia otorga efectos declarativos de daño de furia y ventajas en Fuerza", () => {
      const rasgosNv1 = obtenerRasgosClaseYSubclase("Bárbaro", 1);
      const furia = rasgosNv1.find((r) => r.nombre === "Furia");
      expect(furia?.efectos).toBeDefined();

      const efectoDano = furia?.efectos?.find((e) => e.tipo === "bono_dano_fuerza");
      expect(efectoDano).toBeDefined();
      expect(efectoDano?.valor).toBe("dano_furia");
      expect(efectoDano?.condicion).toBe("furia_activa");

      const ventajaPruebas = furia?.efectos?.find((e) => e.objetivo === "prueba.fuerza");
      expect(ventajaPruebas?.tipo).toBe("ventaja");
      expect(ventajaPruebas?.valor).toBe("ventaja");

      const ventajaSalvaciones = furia?.efectos?.find((e) => e.objetivo === "salvacion.fuerza");
      expect(ventajaSalvaciones?.tipo).toBe("ventaja");
      expect(ventajaSalvaciones?.valor).toBe("ventaja");
    });

    it("Defensa sin armadura es pasivo permanente y permite el uso de escudo", () => {
      const rasgosNv1 = obtenerRasgosClaseYSubclase("Bárbaro", 1);
      const defensa = rasgosNv1.find((r) => r.nombre === "Defensa sin armadura");
      expect(defensa).toBeDefined();
      expect(defensa?.categoriaMecanica).toBe("pasivo_permanente");
      expect(defensa?.tipoAccion).toBe("pasivo");

      const efectoCA = defensa?.efectos?.find((e) => e.tipo === "modificador_ca");
      expect(efectoCA).toBeDefined();
      expect(efectoCA?.objetivo).toBe("defensa_sin_armadura");
      expect(efectoCA?.valor).toBe("constitucion");
      expect(efectoCA?.permiteEscudo).toBe(true);

      const pjTest: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Bárbaro",
        nivel: 1,
        rasgos: rasgosNv1
      };
      const resCA = calcularDefensaSinArmaduraRasgos(pjTest, {
        fuerza: 3,
        destreza: 2,
        constitucion: 3,
        inteligencia: 0,
        sabiduria: 0,
        carisma: 0
      });
      expect(resCA?.aplica).toBe(true);
      expect(resCA?.caracteristicaExtra).toBe("constitucion");
      expect(resCA?.bonoExtra).toBe(3);
    });

    it("Maestría con armas es selector informativo con escalado de 2 a 4 armas", () => {
      const rasgosNv1 = obtenerRasgosClaseYSubclase("Bárbaro", 1);
      const maestriaNv1 = rasgosNv1.find((r) => r.nombre === "Maestría con armas");
      expect(maestriaNv1?.categoriaMecanica).toBe("selector_informativo");
      expect(maestriaNv1?.selectores?.[0].maxSelecciones).toBe(2);
      expect(maestriaNv1?.selectores?.[0].opciones.length).toBe(8);

      const maestriaNv4 = obtenerRasgosClaseYSubclase("Bárbaro", 4).find((r) => r.nombre === "Maestría con armas");
      expect(maestriaNv4?.selectores?.[0].maxSelecciones).toBe(3);

      const maestriaNv10 = obtenerRasgosClaseYSubclase("Bárbaro", 10).find((r) => r.nombre === "Maestría con armas");
      expect(maestriaNv10?.selectores?.[0].maxSelecciones).toBe(4);
    });
  });

  // ── NIVEL 2 Y 3 ──
  describe("Niveles 2 y 3: Sentido del peligro, Ataque temerario y Conocimiento primigenio", () => {
    it("Sentido del peligro otorga ventaja permanente en salvaciones de Destreza", () => {
      const rasgosNv2 = obtenerRasgosClaseYSubclase("Bárbaro", 2);
      const sentidoPeligro = rasgosNv2.find((r) => r.nombre === "Sentido del peligro");
      expect(sentidoPeligro?.categoriaMecanica).toBe("pasivo_permanente");
      expect(sentidoPeligro?.efectos?.[0].tipo).toBe("ventaja");
      expect(sentidoPeligro?.efectos?.[0].objetivo).toBe("salvacion.destreza");
      expect(sentidoPeligro?.efectos?.[0].valor).toBe("ventaja");
    });

    it("Ataque temerario es activable y otorga ventaja en tiradas de ataque con Fuerza", () => {
      const rasgosNv2 = obtenerRasgosClaseYSubclase("Bárbaro", 2);
      const temerario = rasgosNv2.find((r) => r.nombre === "Ataque temerario");
      expect(temerario?.categoriaMecanica).toBe("activable");
      expect(temerario?.esActivable).toBe(true);
      expect(temerario?.condicionAlActivar).toBe("Ataque Temerario");
      expect(temerario?.efectos?.[0].tipo).toBe("ventaja");
      expect(temerario?.efectos?.[0].objetivo).toBe("ataque_fuerza");
      expect(temerario?.efectos?.[0].valor).toBe("ventaja");
    });

    it("Conocimiento primigenio es pasivo permanente con habilidad_con_fuerza", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Bárbaro", 3);
      const conocimiento = rasgosNv3.find((r) => r.nombre === "Conocimiento primigenio");
      expect(conocimiento?.categoriaMecanica).toBe("pasivo_permanente");
      expect(conocimiento?.efectos?.[0].tipo).toBe("habilidad_con_fuerza");
      expect(conocimiento?.efectos?.[0].valor).toBe("fuerza");
      expect(conocimiento?.efectos?.[0].condicion).toBe("furia_activa");
    });
  });

  // ── NIVELES 4 A 8 ──
  describe("Niveles 4 a 8: Progresión pasiva, Ataque adicional, Movimiento rápido y Salto instintivo", () => {
    it("Mejora de característica en niveles 4, 8, 12 y 16 es selector informativo", () => {
      for (const nivel of [4, 8, 12, 16]) {
        const rasgos = obtenerRasgosClaseYSubclase("Bárbaro", nivel);
        const mejora = rasgos.find((r) => r.nombre === "Mejora de característica" && r.nivelRequerido === nivel);
        expect(mejora).toBeDefined();
        expect(mejora?.categoriaMecanica).toBe("selector_informativo");
      }
    });

    it("Ataque adicional y Movimiento rápido son pasivos permanentes a nivel 5", () => {
      const rasgosNv5 = obtenerRasgosClaseYSubclase("Bárbaro", 5);
      const ataqueExtra = rasgosNv5.find((r) => r.nombre === "Ataque adicional");
      const movRapido = rasgosNv5.find((r) => r.nombre === "Movimiento rápido");

      expect(ataqueExtra?.categoriaMecanica).toBe("pasivo_permanente");
      expect(movRapido?.categoriaMecanica).toBe("pasivo_permanente");
      expect(movRapido?.efectos?.[0].tipo).toBe("modificador_velocidad");
      expect(movRapido?.efectos?.[0].valor).toBe(10);
      expect(movRapido?.efectos?.[0].condicion).toBe("sin_armadura_pesada");
    });

    it("Instinto salvaje otorga ventaja en iniciativa y Salto instintivo se fusiona como extensión en Furia", () => {
      const rasgosNv7 = obtenerRasgosClaseYSubclase("Bárbaro", 7);
      const instinto = rasgosNv7.find((r) => r.nombre === "Instinto salvaje");
      expect(instinto?.categoriaMecanica).toBe("pasivo_permanente");
      expect(instinto?.efectos?.[0].tipo).toBe("ventaja");
      expect(instinto?.efectos?.[0].objetivo).toBe("iniciativa");

      // Salto instintivo es extension ligada a Furia
      const furiaNv7 = rasgosNv7.find((r) => r.nombre === "Furia");
      expect(furiaNv7?.descripcion).toContain("Salto instintivo");
    });
  });

  // ── NIVELES 9 A 14 ──
  describe("Niveles 9 a 14: Golpe brutal y Furia implacable", () => {
    it("Golpe brutal es activable con dado 1d10 y selector interactivo a nivel 9", () => {
      const rasgosNv9 = obtenerRasgosClaseYSubclase("Bárbaro", 9);
      const golpeBrutal = rasgosNv9.find((r) => r.nombre === "Golpe brutal");

      expect(golpeBrutal?.categoriaMecanica).toBe("activable");
      expect(golpeBrutal?.formulaDados).toBe("1d10");
      expect(golpeBrutal?.selectores?.[0].maxSelecciones).toBe(1);
      expect(golpeBrutal?.selectores?.[0].opciones.length).toBe(2);
    });

    it("Furia implacable es extensión y se fusiona limpiamente en Furia a nivel 11 sin contadores residuales", () => {
      const rasgosNv11 = obtenerRasgosClaseYSubclase("Bárbaro", 11);
      const furiaNv11 = rasgosNv11.find((r) => r.nombre === "Furia");

      expect(furiaNv11?.descripcion).toContain("Furia implacable (Nv. 11)");
      // No debe existir tarjeta independiente de Furia implacable porque es extensión
      const tarjetaHuérfana = rasgosNv11.find((r) => r.nombre === "Furia implacable");
      expect(tarjetaHuérfana).toBeUndefined();
    });

    it("Golpe brutal mejorado se fusiona a nivel 13 incorporando nuevas opciones dinámicas", () => {
      const rasgosNv13 = obtenerRasgosClaseYSubclase("Bárbaro", 13);
      const golpeBrutalNv13 = rasgosNv13.find((r) => r.nombre === "Golpe brutal");

      expect(golpeBrutalNv13?.selectores?.[0].opciones.length).toBe(4);
      expect(golpeBrutalNv13?.selectores?.[0].opciones.some((o) => o.id === "golpe_desestabilizador")).toBe(true);
      expect(golpeBrutalNv13?.selectores?.[0].opciones.some((o) => o.id === "golpe_desgarrador")).toBe(true);
    });
  });

  // ── NIVELES 15 A 20 ──
  describe("Niveles 15 a 20: Furia persistente, Golpe brutal (II), Poderío indómito y Campeón primigenio", () => {
    it("Furia persistente es consumible con 1 uso por descanso largo que recarga Furia", () => {
      const rasgosNv15 = obtenerRasgosClaseYSubclase("Bárbaro", 15);
      const persistente = rasgosNv15.find((r) => r.nombre === "Furia persistente");

      expect(persistente?.categoriaMecanica).toBe("consumible");
      expect(persistente?.tieneUsosLimitados).toBe(true);
      expect(persistente?.usosMaximos).toBe(1);
      expect(persistente?.recuperacion).toBe("descanso_largo");
      expect(persistente?.dispararAlTirarIniciativa).toBe(true);
      expect(persistente?.restaurarUsosAlActivar?.cantidad).toBe("maximo");
    });

    it("Golpe brutal mejorado (II) escala a 2d10 y 2 selecciones a nivel 17", () => {
      const rasgosNv17 = obtenerRasgosClaseYSubclase("Bárbaro", 17);
      const golpeBrutalNv17 = rasgosNv17.find((r) => r.nombre === "Golpe brutal");

      expect(golpeBrutalNv17?.formulaDados).toBe("2d10");
      expect(golpeBrutalNv17?.selectores?.[0].maxSelecciones).toBe(2);
      expect(golpeBrutalNv17?.selectores?.[0].tipo).toBe("multiple");
    });

    it("Poderío indómito es pasivo permanente y Don épico es selector informativo", () => {
      const rasgosNv19 = obtenerRasgosClaseYSubclase("Bárbaro", 19);
      const poderio = rasgosNv19.find((r) => r.nombre === "Poderío indómito");
      const don = rasgosNv19.find((r) => r.nombre === "Don épico");

      expect(poderio?.categoriaMecanica).toBe("pasivo_permanente");
      expect(don?.categoriaMecanica).toBe("selector_informativo");
    });

    it("Campeón primigenio otorga +4 Fuerza y +4 Constitución con límite de 25", () => {
      const rasgosNv20 = obtenerRasgosClaseYSubclase("Bárbaro", 20);
      const campeon = rasgosNv20.find((r) => r.nombre === "Campeón primigenio");

      expect(campeon?.categoriaMecanica).toBe("pasivo_permanente");
      expect(campeon?.efectos?.length).toBe(2);

      const efFuerza = campeon?.efectos?.find((e) => e.objetivo === "fuerza");
      expect(efFuerza?.valor).toBe(4);
      expect(efFuerza?.limiteMaximo).toBe(25);

      const efCon = campeon?.efectos?.find((e) => e.objetivo === "constitucion");
      expect(efCon?.valor).toBe(4);
      expect(efCon?.limiteMaximo).toBe(25);
    });
  });
});

describe("Bárbaro D&D 5.5e (PHB 2024) - Fase 2: Subclases Canónicas", () => {
  // ── SENDA DEL BERSERKER ──
  describe("Subclase: Senda del Berserker", () => {
    it("Frenesí es activable con escalado de daño de furia y auto-desactivación", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Bárbaro", 3, "Senda del Berserker");
      const frenesiNv3 = rasgosNv3.find((r) => r.nombre === "Frenesí");

      expect(frenesiNv3?.categoriaMecanica).toBe("activable");
      expect(frenesiNv3?.formulaDados).toBe("2d6");
      expect(frenesiNv3?.autoDesactivarAlTirarDano).toBe(true);

      const frenesiNv9 = obtenerRasgosClaseYSubclase("Bárbaro", 9, "Senda del Berserker").find((r) => r.nombre === "Frenesí");
      expect(frenesiNv9?.formulaDados).toBe("3d6");

      const frenesiNv16 = obtenerRasgosClaseYSubclase("Bárbaro", 16, "Senda del Berserker").find((r) => r.nombre === "Frenesí");
      expect(frenesiNv16?.formulaDados).toBe("4d6");
    });

    it("Furia ciega es pasivo permanente con inmunidad a hechizado y asustado", () => {
      const rasgosNv6 = obtenerRasgosClaseYSubclase("Bárbaro", 6, "Senda del Berserker");
      const furiaCiega = rasgosNv6.find((r) => r.nombre === "Furia ciega");

      expect(furiaCiega?.categoriaMecanica).toBe("pasivo_permanente");
      expect(furiaCiega?.efectos?.some((e) => e.objetivo === "hechizado" && e.tipo === "inmunidad_condicion")).toBe(true);
      expect(furiaCiega?.efectos?.some((e) => e.objetivo === "asustado" && e.tipo === "inmunidad_condicion")).toBe(true);
    });

    it("Represalia es reacción pasiva y Presencia intimidante es consumible ligado a Furia", () => {
      const rasgosNv14 = obtenerRasgosClaseYSubclase("Bárbaro", 14, "Senda del Berserker");
      const represalia = rasgosNv14.find((r) => r.nombre === "Represalia");
      const presencia = rasgosNv14.find((r) => r.nombre === "Presencia intimidante");

      expect(represalia?.categoriaMecanica).toBe("pasivo_permanente");
      expect(represalia?.tipoAccion).toBe("reaccion");

      expect(presencia?.categoriaMecanica).toBe("consumible");
      expect(presencia?.usosMaximos).toBe(1);
      expect(presencia?.recuperacion).toBe("descanso_largo");
      expect(presencia?.ligadoA).toBe("rasgo_cls_barbaro_furia");
    });
  });

  // ── SENDA DEL CORAZÓN SALVAJE ──
  describe("Subclase: Senda del Corazón Salvaje", () => {
    it("Hablante de los animales y Hablante de la naturaleza otorgan conjuros rituales", () => {
      const rasgosNv10 = obtenerRasgosClaseYSubclase("Bárbaro", 10, "Senda del Corazón Salvaje");
      const hablanteAnimales = rasgosNv10.find((r) => r.nombre === "Hablante de los animales");
      const hablanteNaturaleza = rasgosNv10.find((r) => r.nombre === "Hablante de la naturaleza");

      expect(hablanteAnimales?.categoriaMecanica).toBe("pasivo_permanente");
      expect(hablanteAnimales?.conjurosOtorgados).toContain("Sentidos de la bestia");
      expect(hablanteAnimales?.conjurosOtorgados).toContain("Hablar con los animales");

      expect(hablanteNaturaleza?.categoriaMecanica).toBe("pasivo_permanente");
      expect(hablanteNaturaleza?.conjurosOtorgados).toContain("Comunión con la naturaleza");
    });

    it("Furia de las tierras salvajes, Aspecto y Poder son selectores informativos interactivos", () => {
      const rasgosNv14 = obtenerRasgosClaseYSubclase("Bárbaro", 14, "Senda del Corazón Salvaje");
      const furiaTierras = rasgosNv14.find((r) => r.nombre === "Furia de las tierras salvajes");
      const aspecto = rasgosNv14.find((r) => r.nombre === "Aspecto de las tierras salvajes");
      const poder = rasgosNv14.find((r) => r.nombre === "Poder de las tierras salvajes");

      expect(furiaTierras?.categoriaMecanica).toBe("selector_informativo");
      expect(furiaTierras?.selectores?.[0].opciones.map((o) => o.id)).toEqual(["oso", "aguila", "lobo"]);

      expect(aspecto?.categoriaMecanica).toBe("selector_informativo");
      expect(aspecto?.selectores?.[0].opciones.map((o) => o.id)).toEqual(["buho", "pantera", "salmon"]);

      expect(poder?.categoriaMecanica).toBe("selector_informativo");
      expect(poder?.selectores?.[0].opciones.map((o) => o.id)).toEqual(["halcon", "leon", "carnero"]);
    });
  });

  // ── SENDA DEL ÁRBOL DEL MUNDO ──
  describe("Subclase: Senda del Árbol del Mundo", () => {
    it("Vitalidad del Árbol expone dados 2d6 con escalado para PV temporales de aliados", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Bárbaro", 3, "Senda del Árbol del Mundo");
      const vitalidadNv3 = rasgosNv3.find((r) => r.nombre === "Vitalidad del Árbol");
      expect(vitalidadNv3?.categoriaMecanica).toBe("pasivo_permanente");
      expect(vitalidadNv3?.formulaDados).toBe("2d6");

      const vitalidadNv9 = obtenerRasgosClaseYSubclase("Bárbaro", 9, "Senda del Árbol del Mundo").find((r) => r.nombre === "Vitalidad del Árbol");
      expect(vitalidadNv9?.formulaDados).toBe("3d6");

      const vitalidadNv16 = obtenerRasgosClaseYSubclase("Bárbaro", 16, "Senda del Árbol del Mundo").find((r) => r.nombre === "Vitalidad del Árbol");
      expect(vitalidadNv16?.formulaDados).toBe("4d6");
    });

    it("Ramas del Árbol, Raíces golpeadoras y Viaje por el Árbol tienen sus categorías declarativas", () => {
      const rasgosNv14 = obtenerRasgosClaseYSubclase("Bárbaro", 14, "Senda del Árbol del Mundo");
      const ramas = rasgosNv14.find((r) => r.nombre === "Ramas del Árbol");
      const raices = rasgosNv14.find((r) => r.nombre === "Raíces golpeadoras");
      const viaje = rasgosNv14.find((r) => r.nombre === "Viaje por el Árbol");

      expect(ramas?.categoriaMecanica).toBe("pasivo_permanente");
      expect(ramas?.tipoAccion).toBe("reaccion");

      expect(raices?.categoriaMecanica).toBe("pasivo_permanente");

      expect(viaje?.categoriaMecanica).toBe("activable");
      expect(viaje?.esActivable).toBe(true);
      expect(viaje?.tipoAccion).toBe("accion_adicional");
    });
  });

  // ── SENDA DEL FANÁTICO ──
  describe("Subclase: Senda del Fanático", () => {
    it("Furia divina es activable con daño secundario 1d6 + mitad nivel", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Bárbaro", 3, "Senda del Fanático");
      const furiaDivina = rasgosNv3.find((r) => r.nombre === "Furia divina");

      expect(furiaDivina?.categoriaMecanica).toBe("activable");
      expect(furiaDivina?.esActivable).toBe(true);
      expect(furiaDivina?.formulaDados).toBe("1d6+1");
      expect(furiaDivina?.efectos?.[0].tipo).toBe("dano_secundario");
      expect(furiaDivina?.efectos?.[0].tipoDano).toBe("Radiante o Necrótico");
    });

    it("Guerrero de los dioses es curación con reserva de dados d12 (4 a 7 dados)", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Bárbaro", 3, "Senda del Fanático");
      const guerreroNv3 = rasgosNv3.find((r) => r.nombre === "Guerrero de los dioses");

      expect(guerreroNv3?.categoriaMecanica).toBe("curacion");
      expect(guerreroNv3?.formulaDados).toBe("1d12");
      expect(guerreroNv3?.usosMaximos).toBe(4);

      const guerreroNv6 = obtenerRasgosClaseYSubclase("Bárbaro", 6, "Senda del Fanático").find((r) => r.nombre === "Guerrero de los dioses");
      expect(guerreroNv6?.usosMaximos).toBe(5);

      const guerreroNv12 = obtenerRasgosClaseYSubclase("Bárbaro", 12, "Senda del Fanático").find((r) => r.nombre === "Guerrero de los dioses");
      expect(guerreroNv12?.usosMaximos).toBe(6);

      const guerreroNv17 = obtenerRasgosClaseYSubclase("Bárbaro", 17, "Senda del Fanático").find((r) => r.nombre === "Guerrero de los dioses");
      expect(guerreroNv17?.usosMaximos).toBe(7);
    });

    it("Enfoque fanático, Presencia fervorosa y Furia de los dioses tienen configuración correcta", () => {
      const rasgosNv14 = obtenerRasgosClaseYSubclase("Bárbaro", 14, "Senda del Fanático");
      const enfoque = rasgosNv14.find((r) => r.nombre === "Enfoque fanático");
      const presencia = rasgosNv14.find((r) => r.nombre === "Presencia fervorosa");
      const furiaDioses = rasgosNv14.find((r) => r.nombre === "Furia de los dioses");

      expect(enfoque?.categoriaMecanica).toBe("activable");
      expect(enfoque?.efectos?.[0].tipo).toBe("bono_salvacion");

      expect(presencia?.categoriaMecanica).toBe("consumible");
      expect(presencia?.usosMaximos).toBe(1);

      expect(furiaDioses?.categoriaMecanica).toBe("consumible");
      expect(furiaDioses?.esActivable).toBe(true);
      expect(furiaDioses?.condicionAlActivar).toBe("Furia de los Dioses (Rage of the Gods)");
    });
  });
});
