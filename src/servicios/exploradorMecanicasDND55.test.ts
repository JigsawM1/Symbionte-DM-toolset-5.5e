import { describe, it, expect } from "vitest";
import {
  obtenerClasePorNombre,
  obtenerRasgosClaseYSubclase,
  crearSelectorDoteEstiloCombate,
  aplicarBuildClaseAPersonaje
} from "./gestorClases";
import {
  obtenerVelocidadesEfectivas,
  evaluarReduccionCansancioDescansoCorto,
  calcularBonoIniciativaRasgos,
  calcularSentidosPersonaje,
  obtenerCompetenciasExtraRasgos
} from "./evaluadorEfectosRasgos";
import { obtenerBonosHabilidadesRasgos } from "./rasgos/evaluadorSalvacionesRasgos";
import { obtenerDadosExtraAtaque, type ContextoAtaquePersonaje } from "./rasgos/evaluadorCombateRasgos";
import { esRasgoHabilitadoPorOpcion } from "./rasgos/utilidadesRasgos";
import { ejecutarDescansoCorto } from "./procesadorDescansos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { TODAS_SUBCLASES_DND55 } from "@/constantes/clasesDND55";
import type { PersonajeJugador } from "@/tipos";

describe("Mecánicas D&D 5.5e (2024) - Explorador (Ranger) - Fase 1: Clase Base", () => {
  const crearPersonajeExplorador = (nivel: number, sab: number = 16, des: number = 14): PersonajeJugador => {
    const claseObj = obtenerClasePorNombre("explorador");
    const rasgos = obtenerRasgosClaseYSubclase("explorador", nivel);

    return {
      ...PERSONAJE_POR_DEFECTO,
      id: `pj_explorador_nv${nivel}`,
      nombre: `Explorador Nivel ${nivel}`,
      clase: "explorador",
      nivel,
      especie: "Humano",
      hpActual: 10 + (nivel - 1) * 7,
      hpMaximo: 10 + (nivel - 1) * 7,
      hpTemporal: 0,
      dadosGolpeTotal: nivel,
      dadosGolpeRestantes: nivel,
      tipoDadoGolpe: claseObj?.dadoGolpe || "d10",
      cansancio: 0,
      velocidad: { caminar: 30, nadar: 0, escalar: 0, volar: 0, planea: false },
      competenciasSalvacion: {
        fuerza: true,
        destreza: true,
        constitucion: false,
        inteligencia: false,
        sabiduria: false,
        carisma: false
      },
      caracteristicas: {
        fuerza: 12,
        destreza: des,
        constitucion: 14,
        inteligencia: 10,
        sabiduria: sab,
        carisma: 10
      },
      rasgos,
      inventario: [],
      condicionesActivas: [],
      efectosActivos: []
    };
  };

  describe("Nivel 1: Lanzamiento de conjuros, Enemigo predilecto y Maestría con armas", () => {
    it("Lanzamiento de conjuros es pasivo permanente para lanzador medio con Sabiduría", () => {
      const clase = obtenerClasePorNombre("explorador");
      expect(clase?.configuracionMagica?.tipoLanzador).toBe("medio");
      expect(clase?.configuracionMagica?.habilidadConjuro).toBe("sabiduria");

      const rasgosNv1 = obtenerRasgosClaseYSubclase("explorador", 1);
      const lanzamiento = rasgosNv1.find((r) => r.nombre === "Lanzamiento de conjuros");
      expect(lanzamiento).toBeDefined();
      expect(lanzamiento?.categoriaMecanica).toBe("pasivo_permanente");
      expect(lanzamiento?.tieneUsosLimitados).toBeFalsy();
    });

    it("Enemigo predilecto es consumible que otorga Marca del cazador gratis con 2 usos iniciales", () => {
      const rasgosNv1 = obtenerRasgosClaseYSubclase("explorador", 1);
      const enemigo = rasgosNv1.find((r) => r.nombre === "Enemigo predilecto");
      expect(enemigo).toBeDefined();
      expect(enemigo?.categoriaMecanica).toBe("consumible");
      expect(enemigo?.recuperacion).toBe("descanso_largo");
      expect(enemigo?.usosMaximos).toBe(2);
      expect(enemigo?.usosRestantes).toBe(2);
      expect(enemigo?.conjurosOtorgados).toContain("Marca del cazador");
    });

    it("Maestría con armas es selector informativo interactivo con 2 selecciones de entre las 8 oficiales", () => {
      const rasgosNv1 = obtenerRasgosClaseYSubclase("explorador", 1);
      const maestria = rasgosNv1.find((r) => r.nombre === "Maestría con armas");
      expect(maestria).toBeDefined();
      expect(maestria?.categoriaMecanica).toBe("selector_informativo");
      expect(maestria?.selectores).toHaveLength(1);

      const sel = maestria?.selectores?.[0];
      expect(sel?.tipo).toBe("multiple");
      expect(sel?.maxSelecciones).toBe(2);
      expect(sel?.opciones).toHaveLength(8);

      const idsOpciones = sel?.opciones.map((o) => o.id);
      expect(idsOpciones).toEqual(
        expect.arrayContaining(["cleave", "graze", "nick", "push", "sap", "slow", "topple", "vex"])
      );
    });
  });

  describe("Nivel 2: Explorador diestro & Estilo de combate", () => {
    it("Explorador diestro es pasivo permanente informativo sin selectores interactivos", () => {
      const rasgosNv2 = obtenerRasgosClaseYSubclase("explorador", 2);
      const diestro = rasgosNv2.find((r) => r.nombre === "Explorador diestro");
      expect(diestro).toBeDefined();
      expect(diestro?.categoriaMecanica).toBe("pasivo_permanente");
      expect(diestro?.selectores || []).toHaveLength(0);
    });

    it("Estilo de combate inyecta dote exclusiva Guerrero druídico como opción priorizada por defecto", () => {
      const rasgosNv2 = obtenerRasgosClaseYSubclase("explorador", 2);
      const estilo = rasgosNv2.find((r) => r.nombre === "Estilo de combate");
      expect(estilo).toBeDefined();
      expect(estilo?.categoriaMecanica).toBe("selector_informativo");

      const selectorEstilo = estilo?.selectores?.[0];
      expect(selectorEstilo).toBeDefined();
      expect(selectorEstilo?.valorActual).toContain("dote_estilo_guerrero_druidico");
      expect(selectorEstilo?.opciones[0].id).toBe("dote_estilo_guerrero_druidico");
    });

    it("crearSelectorDoteEstiloCombate asigna Guerrero druídico por defecto a la clase explorador", () => {
      const selector = crearSelectorDoteEstiloCombate("explorador", 2);
      expect(selector.valorActual).toContain("dote_estilo_guerrero_druidico");
      expect(selector.opciones.some((o) => o.id === "dote_estilo_guerrero_druidico")).toBe(true);
    });
  });

  describe("Nivel 5: Ataque adicional y escalado de Enemigo predilecto", () => {
    it("Enemigo predilecto escala a 3 usos máximos en nivel 5", () => {
      const rasgosNv5 = obtenerRasgosClaseYSubclase("explorador", 5);
      const enemigo = rasgosNv5.find((r) => r.nombre === "Enemigo predilecto");
      expect(enemigo?.usosMaximos).toBe(3);
      expect(enemigo?.usosRestantes).toBe(3);
    });

    it("Ataque adicional está presente como pasivo permanente de acción", () => {
      const rasgosNv5 = obtenerRasgosClaseYSubclase("explorador", 5);
      const ataqueAdicional = rasgosNv5.find((r) => r.nombre === "Ataque adicional");
      expect(ataqueAdicional).toBeDefined();
      expect(ataqueAdicional?.categoriaMecanica).toBe("pasivo_permanente");
      expect(ataqueAdicional?.tipoAccion).toBe("accion");
    });
  });

  describe("Nivel 6: Trotamundos (+10 pies sin armadura pesada y natación/escalada)", () => {
    it("Trotamundos otorga +10 pies a velocidad caminando sin armadura pesada", () => {
      const pj = crearPersonajeExplorador(6);
      const vels = obtenerVelocidadesEfectivas(pj);
      expect(vels.caminar).toBe(40);
      expect(vels.nadar).toBe(40);
      expect(vels.escalar).toBe(40);
    });

    it("Trotamundos no otorga +10 pies si lleva armadura pesada equipada", () => {
      const pj = crearPersonajeExplorador(6);
      const cotaMalla: PersonajeJugador["inventario"][number] = {
        idInstancia: "inst_cota_malla",
        idObjeto: "item_cota_malla",
        nombre: "Cota de malla",
        categoria: "armaduras",
        subcategoria: "Pesada",
        cantidad: 1,
        equipado: true,
        sintonizado: false,
        esMagico: false,
        rareza: "Común",
        equipable: true,
        sintonizacionRequerida: false,
        esConsumible: false,
        notas: "",
        pesoLb: 55
      };
      pj.inventario.push(cotaMalla);

      const vels = obtenerVelocidadesEfectivas(pj);
      expect(vels.caminar).toBe(30);
      expect(vels.nadar).toBe(30);
      expect(vels.escalar).toBe(30);
    });
  });

  describe("Nivel 9 & 10: Pericia e Incansable (PV temporales y reducción de agotamiento)", () => {
    it("Pericia a nivel 9 es pasivo permanente informativo", () => {
      const rasgosNv9 = obtenerRasgosClaseYSubclase("explorador", 9);
      const pericia = rasgosNv9.find((r) => r.nombre === "Pericia");
      expect(pericia).toBeDefined();
      expect(pericia?.categoriaMecanica).toBe("pasivo_permanente");
    });

    it("Enemigo predilecto escala a 4 usos a nivel 9", () => {
      const rasgosNv9 = obtenerRasgosClaseYSubclase("explorador", 9);
      const enemigo = rasgosNv9.find((r) => r.nombre === "Enemigo predilecto");
      expect(enemigo?.usosMaximos).toBe(4);
    });

    it("Incansable a nivel 10 es consumible con dados 1d8 + Sabiduría y usos por Sabiduría", () => {
      const rasgosNv10 = obtenerRasgosClaseYSubclase("explorador", 10);
      const incansable = rasgosNv10.find((r) => r.nombre === "Incansable");
      expect(incansable).toBeDefined();
      expect(incansable?.categoriaMecanica).toBe("consumible");
      expect(incansable?.formulaDados).toBe("1d8 + sabiduria");
      expect(incansable?.recuperacion).toBe("descanso_largo");
      expect(incansable?.efectos?.some((e) => e.tipo === "hp_temporal")).toBe(true);
      expect(incansable?.efectos?.some((e) => e.objetivo === "reducir_cansancio_descanso_corto")).toBe(true);
    });

    it("evaluarReduccionCansancioDescansoCorto detecta el rasgo Incansable y devuelve 1", () => {
      const pj = crearPersonajeExplorador(10);
      const reduccion = evaluarReduccionCansancioDescansoCorto(pj);
      expect(reduccion).toBe(1);
    });

    it("ejecutarDescansoCorto reduce en 1 nivel el cansancio del personaje con Incansable", () => {
      const pj = crearPersonajeExplorador(10);
      pj.cansancio = 2;

      const resultado = ejecutarDescansoCorto(pj, 0);
      expect(resultado.personajeActualizado.cansancio).toBe(1);

      const accionCansancio = resultado.acciones.find((a) => a.tipo === "cansancio");
      expect(accionCansancio).toBeDefined();
      expect(accionCansancio?.cambio).toBe(-1);
    });
  });

  describe("Niveles 13 a 20: Cazador implacable, Velo de la naturaleza, Don épico y Asesino de enemigos", () => {
    it("Nivel 13: Cazador implacable es pasivo permanente y Enemigo predilecto tiene 5 usos", () => {
      const rasgosNv13 = obtenerRasgosClaseYSubclase("explorador", 13);
      expect(rasgosNv13.find((r) => r.nombre === "Cazador implacable")?.categoriaMecanica).toBe("pasivo_permanente");
      expect(rasgosNv13.find((r) => r.nombre === "Enemigo predilecto")?.usosMaximos).toBe(5);
    });

    it("Nivel 14: Velo de la naturaleza es consumible por acción adicional con usos por Sabiduría", () => {
      const rasgosNv14 = obtenerRasgosClaseYSubclase("explorador", 14);
      const velo = rasgosNv14.find((r) => r.nombre === "Velo de la naturaleza");
      expect(velo).toBeDefined();
      expect(velo?.categoriaMecanica).toBe("consumible");
      expect(velo?.tipoAccion).toBe("accion_adicional");
      expect(velo?.recuperacion).toBe("descanso_largo");
      expect(velo?.formulaEscalado).toBe("sabiduria");
    });

    it("Nivel 17: Enemigo predilecto escala a 6 usos y Cazador preciso está activo", () => {
      const rasgosNv17 = obtenerRasgosClaseYSubclase("explorador", 17);
      expect(rasgosNv17.find((r) => r.nombre === "Enemigo predilecto")?.usosMaximos).toBe(6);
      expect(rasgosNv17.find((r) => r.nombre === "Cazador preciso")?.categoriaMecanica).toBe("pasivo_permanente");
    });

    it("Nivel 18: Sentidos salvajes otorga vista ciega de 30 pies", () => {
      const rasgosNv18 = obtenerRasgosClaseYSubclase("explorador", 18);
      const sentidos = rasgosNv18.find((r) => r.nombre === "Sentidos salvajes");
      expect(sentidos).toBeDefined();
      expect(sentidos?.efectos?.[0].objetivo).toBe("vision_ciega");
      expect(sentidos?.efectos?.[0].valor).toBe(30);
    });

    it("Nivel 19 y 20: Don épico es selector informativo y Asesino de enemigos es pasivo permanente", () => {
      const rasgosNv20 = obtenerRasgosClaseYSubclase("explorador", 20);
      const don = rasgosNv20.find((r) => r.nombre === "Don épico");
      expect(don?.categoriaMecanica).toBe("selector_informativo");

      const asesino = rasgosNv20.find((r) => r.nombre === "Asesino de enemigos");
      expect(asesino?.categoriaMecanica).toBe("pasivo_permanente");
    });
  });

  describe("Subclase Señor de las Bestias (Beast Master - PHB 2024)", () => {
    it("Nivel 3: Compañero primigenio es pasivo permanente informativo sin consumibles artificiales", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("explorador", 3, "Señor de las Bestias");
      const companero = rasgosNv3.find((r) => r.nombre === "Compañero primigenio");
      expect(companero).toBeDefined();
      expect(companero?.categoriaMecanica).toBe("pasivo_permanente");
      expect(companero?.subclase).toBe("Señor de las Bestias");
      expect(companero?.tieneUsosLimitados).toBeFalsy();
    });

    it("Nivel 7: Entrenamiento excepcional se adquiere como rasgo pasivo permanente", () => {
      const rasgosNv7 = obtenerRasgosClaseYSubclase("explorador", 7, "Señor de las Bestias");
      const entrenamiento = rasgosNv7.find((r) => r.nombre === "Entrenamiento excepcional");
      expect(entrenamiento).toBeDefined();
      expect(entrenamiento?.categoriaMecanica).toBe("pasivo_permanente");
      expect(entrenamiento?.nivelRequerido).toBe(7);
    });

    it("Nivel 11: Furia bestial se adquiere como rasgo pasivo permanente", () => {
      const rasgosNv11 = obtenerRasgosClaseYSubclase("explorador", 11, "Señor de las Bestias");
      const furia = rasgosNv11.find((r) => r.nombre === "Furia bestial");
      expect(furia).toBeDefined();
      expect(furia?.categoriaMecanica).toBe("pasivo_permanente");
      expect(furia?.nivelRequerido).toBe(11);
    });

    it("Nivel 15: Compartir conjuros se adquiere y todos los 4 rasgos de la subclase están presentes", () => {
      const rasgosNv15 = obtenerRasgosClaseYSubclase("explorador", 15, "Señor de las Bestias");
      const compartir = rasgosNv15.find((r) => r.nombre === "Compartir conjuros");
      expect(compartir).toBeDefined();
      expect(compartir?.categoriaMecanica).toBe("pasivo_permanente");
      expect(compartir?.nivelRequerido).toBe(15);

      const nombresSubclase = rasgosNv15.filter((r) => r.subclase === "Señor de las Bestias").map((r) => r.nombre);
      expect(nombresSubclase).toEqual([
        "Compañero primigenio",
        "Entrenamiento excepcional",
        "Furia bestial",
        "Compartir conjuros"
      ]);
    });

    it("aplicarBuildClaseAPersonaje asigna correctamente Señor de las Bestias en la ficha", () => {
      const pjBase = crearPersonajeExplorador(15);
      const pjConSubclase = aplicarBuildClaseAPersonaje(pjBase, "explorador", 15, "Señor de las Bestias");

      expect(pjConSubclase.subclase).toBe("Señor de las Bestias");
      const rasgosBestia = pjConSubclase.rasgos.filter((r) => r.subclase === "Señor de las Bestias");
      expect(rasgosBestia.length).toBe(4);
      expect(rasgosBestia.every((r) => r.categoriaMecanica === "pasivo_permanente")).toBe(true);
    });
  });

  describe("Subclase Errante Feérico (Fey Wanderer - PHB 2024)", () => {
    it("Nivel 3: Golpes terroríficos es activable con 1d4 psíquico y escala a 1d6 a Nivel 11", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("explorador", 3, "Errante Feérico");
      const golpesNv3 = rasgosNv3.find((r) => r.nombre === "Golpes terroríficos");
      expect(golpesNv3).toBeDefined();
      expect(golpesNv3?.categoriaMecanica).toBe("activable");
      expect(golpesNv3?.esActivable).toBe(true);
      expect(golpesNv3?.formulaDados).toBe("1d4");
      expect(golpesNv3?.efectos?.[0].tipo).toBe("dado_extra_dano");
      expect(golpesNv3?.efectos?.[0].valor).toBe("1d4");
      expect(golpesNv3?.efectos?.[0].tipoDano).toBe("Psíquico");

      const rasgosNv11 = obtenerRasgosClaseYSubclase("explorador", 11, "Errante Feérico");
      const golpesNv11 = rasgosNv11.find((r) => r.nombre === "Golpes terroríficos");
      expect(golpesNv11?.formulaDados).toBe("1d6");
      expect(golpesNv11?.efectos?.[0].valor).toBe("1d6");
    });

    it("Nivel 3: Glamur de otro mundo suma modificador de Sabiduría (mín +1) a todas las habilidades de Carisma", () => {
      const pjBase = crearPersonajeExplorador(3, 16, 14); // Sabiduría 16 (+3)
      const pjErrante = aplicarBuildClaseAPersonaje(pjBase, "explorador", 3, "Errante Feérico");

      const bonos = obtenerBonosHabilidadesRasgos(pjErrante);
      expect(bonos.engaño).toBe(3);
      expect(bonos.interpretacion).toBe(3);
      expect(bonos.intimidacion).toBe(3);
      expect(bonos.persuasion).toBe(3);

      // Si la Sabiduría fuese 10 (+0), el mínimo es +1
      const pjBajaSab = {
        ...pjErrante,
        caracteristicas: { ...pjErrante.caracteristicas, sabiduria: 10 }
      };
      const bonosBajaSab = obtenerBonosHabilidadesRasgos(pjBajaSab);
      expect(bonosBajaSab.engaño).toBe(1);
      expect(bonosBajaSab.interpretacion).toBe(1);
      expect(bonosBajaSab.intimidacion).toBe(1);
      expect(bonosBajaSab.persuasion).toBe(1);
    });

    it("Nivel 3: Dones de los Parajes Feéricos es un selector informativo con 6 opciones", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("explorador", 3, "Errante Feérico");
      const dones = rasgosNv3.find((r) => r.nombre === "Dones de los Parajes Feéricos");
      expect(dones).toBeDefined();
      expect(dones?.categoriaMecanica).toBe("selector_informativo");
      expect(dones?.selectores?.[0].opciones?.length).toBe(6);
      expect(dones?.selectores?.[0].opciones?.[0].nombre).toBe("Mariposas ilusorias");
    });

    it("Nivel 3 a 17: Progresión de conjuros siempre preparados otorga los conjuros canónicos", () => {
      const pjBase = crearPersonajeExplorador(17);
      const pjErrante = aplicarBuildClaseAPersonaje(pjBase, "explorador", 17, "Errante Feérico");

      const conjurosPreparados = pjErrante.conjurosSiemprePreparadosIds || [];
      expect(conjurosPreparados).toContain("Hechizar persona");
      expect(conjurosPreparados).toContain("Paso brumoso");
      expect(conjurosPreparados).toContain("Invocar feérico");
      expect(conjurosPreparados).toContain("Puerta dimensional");
      expect(conjurosPreparados).toContain("Desorientar");
    });

    it("Nivel 7: Giro seductor otorga ventaja en tiradas de salvación contra hechizado y asustado", () => {
      const rasgosNv7 = obtenerRasgosClaseYSubclase("explorador", 7, "Errante Feérico");
      const giro = rasgosNv7.find((r) => r.nombre === "Giro seductor");
      expect(giro).toBeDefined();
      expect(giro?.categoriaMecanica).toBe("pasivo_permanente");
      expect(giro?.efectos?.some((e) => e.tipo === "ventaja" && e.objetivo === "salvacion.hechizado")).toBe(true);
      expect(giro?.efectos?.some((e) => e.tipo === "ventaja" && e.objetivo === "salvacion.asustado")).toBe(true);
    });

    it("Nivel 11 y 15: Refuerzos feéricos y Errante brumoso son consumibles con conjuros otorgados", () => {
      const rasgosNv15 = obtenerRasgosClaseYSubclase("explorador", 15, "Errante Feérico");

      const refuerzos = rasgosNv15.find((r) => r.nombre === "Refuerzos feéricos");
      expect(refuerzos).toBeDefined();
      expect(refuerzos?.categoriaMecanica).toBe("consumible");
      expect(refuerzos?.usosMaximos).toBe(1);
      expect(refuerzos?.recuperacion).toBe("descanso_largo");
      expect(refuerzos?.conjurosOtorgados).toEqual(["Invocar feérico"]);

      const erranteBrumoso = rasgosNv15.find((r) => r.nombre === "Errante brumoso");
      expect(erranteBrumoso).toBeDefined();
      expect(erranteBrumoso?.categoriaMecanica).toBe("consumible");
      expect(erranteBrumoso?.tipoAccion).toBe("accion_adicional");
      expect(erranteBrumoso?.recuperacion).toBe("descanso_largo");
      expect(erranteBrumoso?.formulaEscalado).toBe("sabiduria");
      expect(erranteBrumoso?.conjurosOtorgados).toEqual(["Paso brumoso"]);
    });
  });

  describe("Subclase Acechador en la Penumbra (Gloom Stalker - PHB 2024)", () => {
    it("Nivel 3: Emboscador terrorífico suma modificador de Sabiduría a la iniciativa", () => {
      const pjBase = {
        ...crearPersonajeExplorador(3, 16, 14),
        especie: "Personalizado" // Sin dote Alerta automática de humano
      };
      const pjAcechador = aplicarBuildClaseAPersonaje(pjBase, "explorador", 3, "Acechador en la Penumbra");

      const bonoInic = calcularBonoIniciativaRasgos(pjAcechador);
      expect(bonoInic).toBe(3); // +3 por Sabiduría 16
    });

    it("Nivel 3: Golpe terrorífico es consumible separado con 2d6 psíquico y escala a 2d8 a Nivel 11", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("explorador", 3, "Acechador en la Penumbra");
      const golpeNv3 = rasgosNv3.find((r) => r.nombre === "Golpe terrorífico");
      expect(golpeNv3).toBeDefined();
      expect(golpeNv3?.categoriaMecanica).toBe("consumible");
      expect(golpeNv3?.formulaDados).toBe("2d6");
      expect(golpeNv3?.formulaEscalado).toBe("sabiduria");
      expect(golpeNv3?.efectos?.[0].tipo).toBe("dado_extra_dano");
      expect(golpeNv3?.efectos?.[0].valor).toBe("2d6");

      const rasgosNv11 = obtenerRasgosClaseYSubclase("explorador", 11, "Acechador en la Penumbra");
      const golpeNv11 = rasgosNv11.find((r) => r.nombre === "Golpe terrorífico");
      expect(golpeNv11?.formulaDados).toBe("2d8");
      expect(golpeNv11?.efectos?.[0].valor).toBe("2d8");
    });

    it("Nivel 3: Visión en la penumbra otorga +60 pies de visión en la oscuridad acumulable", () => {
      const pjBaseHumano = crearPersonajeExplorador(3);
      const pjAcechadorHumano = aplicarBuildClaseAPersonaje(pjBaseHumano, "explorador", 3, "Acechador en la Penumbra");
      expect(calcularSentidosPersonaje(pjAcechadorHumano).visionOscuridad).toBe(60);

      // Con visión base previa (ej. elfo con 60 pies)
      const pjConVisionPrevia: PersonajeJugador = {
        ...pjBaseHumano,
        sentidos: { percepcionPasiva: 10, visionOscuridad: 60 }
      };
      const pjAcechadorElfo = aplicarBuildClaseAPersonaje(pjConVisionPrevia, "explorador", 3, "Acechador en la Penumbra");
      expect(calcularSentidosPersonaje(pjAcechadorElfo).visionOscuridad).toBe(120);
    });

    it("Nivel 3 a 17: Progresión de conjuros siempre preparados otorga los conjuros canónicos", () => {
      const pjBase = crearPersonajeExplorador(17);
      const pjAcechador = aplicarBuildClaseAPersonaje(pjBase, "explorador", 17, "Acechador en la Penumbra");

      const conjurosPreparados = pjAcechador.conjurosSiemprePreparadosIds || [];
      expect(conjurosPreparados).toContain("Disfrazarse");
      expect(conjurosPreparados).toContain("Truco de la cuerda");
      expect(conjurosPreparados).toContain("Miedo");
      expect(conjurosPreparados).toContain("Invisibilidad mayor");
      expect(conjurosPreparados).toContain("Apariencia");
    });

    it("Nivel 7: Mente de hierro otorga competencia en tiradas de salvación de Sabiduría", () => {
      const pjBase = crearPersonajeExplorador(7);
      const pjAcechador = aplicarBuildClaseAPersonaje(pjBase, "explorador", 7, "Acechador en la Penumbra");

      const competenciasExtra = obtenerCompetenciasExtraRasgos(pjAcechador);
      expect(competenciasExtra.salvaciones).toContain("sabiduria");
    });

    it("Nivel 11 y 15: Aluvión del acechador es extensión fusionada y Esquiva sombría es reacción", () => {
      // 1. Declaración en el catálogo declarativo de la subclase
      const subclase = TODAS_SUBCLASES_DND55.find((s) => s.id === "acechador_en_la_penumbra");
      const aluvionDef = subclase?.rasgos.find((r) => r.nombre === "Aluvión del acechador");
      expect(aluvionDef).toBeDefined();
      expect(aluvionDef?.categoriaMecanica).toBe("extension");
      expect(aluvionDef?.ligadoA).toBe("Golpe terrorífico");
      expect(aluvionDef?.formulaDados).toBe("2d8");

      // 2. Fusión orgánica en el rasgo padre (Golpe terrorífico)
      const rasgosNv15 = obtenerRasgosClaseYSubclase("explorador", 15, "Acechador en la Penumbra");
      const golpeTerrorifico = rasgosNv15.find((r) => r.nombre === "Golpe terrorífico");
      expect(golpeTerrorifico).toBeDefined();
      expect(golpeTerrorifico?.formulaDados).toBe("2d8");
      expect(golpeTerrorifico?.descripcion).toContain("Aluvión del acechador");

      // 3. Esquiva sombría como reacción pasiva
      const esquiva = rasgosNv15.find((r) => r.nombre === "Esquiva sombría");
      expect(esquiva).toBeDefined();
      expect(esquiva?.categoriaMecanica).toBe("pasivo_permanente");
      expect(esquiva?.tipoAccion).toBe("reaccion");
    });
  });

  describe("Subclase Cazador (Hunter - PHB 2024)", () => {
    const ctxArma: ContextoAtaquePersonaje = {
      tipo: "arma",
      caracteristica: "destreza",
      esCuerpoACuerpo: true,
      esDistancia: false
    };

    it("Nivel 3: Desbloqueo de rasgos de Cazador con selector de Presa del cazador y opciones vinculadas", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("explorador", 3, "Cazador");

      const presaCazador = rasgosNv3.find((r) => r.nombre === "Presa del cazador");
      expect(presaCazador).toBeDefined();
      expect(presaCazador?.categoriaMecanica).toBe("selector_informativo");
      const selPresa = presaCazador?.selectores?.find((s) => s.id === "selector_presa_cazador");
      expect(selPresa).toBeDefined();
      expect(selPresa?.opciones).toHaveLength(2);
      expect(selPresa?.opciones?.map((o) => o.id)).toContain("asesino_colosos");
      expect(selPresa?.opciones?.map((o) => o.id)).toContain("rompehordas");
      expect(selPresa?.valorActual).toEqual(["asesino_colosos"]);

      const rasgoAsesino = rasgosNv3.find((r) => r.nombre === "Presa del cazador: Asesino de colosos");
      expect(rasgoAsesino).toBeDefined();
      expect(rasgoAsesino?.categoriaMecanica).toBe("activable");
      expect(rasgoAsesino?.esActivable).toBe(true);
      expect(rasgoAsesino?.autoDesactivarAlTirarDano).toBe(true);
      expect(rasgoAsesino?.formulaDados).toBe("1d8");
      expect(rasgoAsesino?.ligadoA).toBe("Presa del cazador");
      expect(rasgoAsesino?.requiereOpcion).toBe("asesino_colosos");

      const rasgoRompehordas = rasgosNv3.find((r) => r.nombre === "Presa del cazador: Rompehordas");
      expect(rasgoRompehordas).toBeDefined();
      expect(rasgoRompehordas?.categoriaMecanica).toBe("pasivo_permanente");
      expect(rasgoRompehordas?.ligadoA).toBe("Presa del cazador");
      expect(rasgoRompehordas?.requiereOpcion).toBe("rompehordas");

      const sabiduriaCazador = rasgosNv3.find((r) => r.nombre === "Sabiduría del cazador");
      expect(sabiduriaCazador).toBeDefined();
      expect(sabiduriaCazador?.categoriaMecanica).toBe("pasivo_permanente");
    });

    it("Nivel 3: Asesino de colosos añade 1d8 de daño extra a armas al activarse", () => {
      const pjBase = crearPersonajeExplorador(3);
      const pjCazador = aplicarBuildClaseAPersonaje(pjBase, "explorador", 3, "Cazador");

      // Por defecto está inactivo (esActivable: true)
      const dadosInactivo = obtenerDadosExtraAtaque(pjCazador, ctxArma);
      expect(dadosInactivo).toHaveLength(0);

      // Al activarse el rasgo en combate
      const pjAsesinoActivo: PersonajeJugador = {
        ...pjCazador,
        rasgos: pjCazador.rasgos.map((r) =>
          r.nombre.includes("Asesino de colosos") ? { ...r, activo: true } : r
        )
      };

      const dadosActivo = obtenerDadosExtraAtaque(pjAsesinoActivo, ctxArma);
      expect(dadosActivo).toHaveLength(1);
      expect(dadosActivo[0].dados).toBe("1d8");
      expect(dadosActivo[0].origen).toContain("Asesino de colosos");
    });

    it("Nivel 3: Al seleccionar Rompehordas, Asesino de colosos se deshabilita automáticamente", () => {
      const pjBase = crearPersonajeExplorador(3);
      const pjCazador = aplicarBuildClaseAPersonaje(pjBase, "explorador", 3, "Cazador");

      // Cambiar la selección a Rompehordas
      const pjConRompehordas: PersonajeJugador = {
        ...pjCazador,
        rasgos: pjCazador.rasgos.map((r) => {
          if (r.nombre === "Presa del cazador" && r.selectores) {
            return {
              ...r,
              selectores: r.selectores.map((s) =>
                s.id === "selector_presa_cazador" ? { ...s, valorActual: ["rompehordas"] } : s
              )
            };
          }
          if (r.nombre.includes("Asesino de colosos")) {
            return { ...r, activo: true }; // Aunque intente estar activo
          }
          return r;
        })
      };

      const rasgoAsesino = pjConRompehordas.rasgos.find((r) => r.nombre.includes("Asesino de colosos"))!;
      const rasgoRompehordas = pjConRompehordas.rasgos.find((r) => r.nombre.includes("Rompehordas"))!;

      expect(esRasgoHabilitadoPorOpcion(rasgoAsesino, pjConRompehordas.rasgos)).toBe(false);
      expect(esRasgoHabilitadoPorOpcion(rasgoRompehordas, pjConRompehordas.rasgos)).toBe(true);

      // No debe sumar dados extra porque la opción no está seleccionada
      const dadosExtra = obtenerDadosExtraAtaque(pjConRompehordas, ctxArma);
      expect(dadosExtra).toHaveLength(0);
    });

    it("Nivel 7: Tácticas defensivas es selector_informativo con Escapar de la horda y Defensa contra ataques múltiples", () => {
      const pjBase = crearPersonajeExplorador(7);
      const pjCazador = aplicarBuildClaseAPersonaje(pjBase, "explorador", 7, "Cazador");

      const tacticas = pjCazador.rasgos.find((r) => r.nombre === "Tácticas defensivas");
      expect(tacticas).toBeDefined();
      expect(tacticas?.categoriaMecanica).toBe("selector_informativo");

      const selTacticas = tacticas?.selectores?.find((s) => s.id === "selector_tacticas_defensivas");
      expect(selTacticas).toBeDefined();
      expect(selTacticas?.opciones).toHaveLength(2);
      expect(selTacticas?.opciones?.map((o) => o.id)).toContain("escapar_horda");
      expect(selTacticas?.opciones?.map((o) => o.id)).toContain("defensa_ataques_multiples");
      expect(selTacticas?.valorActual).toEqual(["escapar_horda"]);
    });

    it("Nivel 11: Presa del cazador superior está presente como pasivo permanente", () => {
      const pjBase = crearPersonajeExplorador(11);
      const pjCazador = aplicarBuildClaseAPersonaje(pjBase, "explorador", 11, "Cazador");

      const presaSuperior = pjCazador.rasgos.find((r) => r.nombre === "Presa del cazador superior");
      expect(presaSuperior).toBeDefined();
      expect(presaSuperior?.categoriaMecanica).toBe("pasivo_permanente");
    });

    it("Nivel 15: Defensa del cazador superior está presente como reacción pasiva permanente", () => {
      const pjBase = crearPersonajeExplorador(15);
      const pjCazador = aplicarBuildClaseAPersonaje(pjBase, "explorador", 15, "Cazador");

      const defensaSuperior = pjCazador.rasgos.find((r) => r.nombre === "Defensa del cazador superior");
      expect(defensaSuperior).toBeDefined();
      expect(defensaSuperior?.categoriaMecanica).toBe("pasivo_permanente");
      expect(defensaSuperior?.tipoAccion).toBe("reaccion");
    });
  });

  describe("Tablas canónicas de progresión en rasgos de Explorador (tablaProgresion)", () => {
    it("Enemigo predilecto incluye tablaProgresion con 5 filas y nota al pie", () => {
      const rasgosNv1 = obtenerRasgosClaseYSubclase("explorador", 1);
      const enemigo = rasgosNv1.find((r) => r.nombre === "Enemigo predilecto");

      expect(enemigo?.tablaProgresion).toBeDefined();
      expect(enemigo?.tablaProgresion?.columnas).toEqual(["Nivel", "Descripción"]);
      expect(enemigo?.tablaProgresion?.notaPie).toBe("Cada nivel reemplaza al anterior");
      expect(enemigo?.tablaProgresion?.filas).toEqual([
        { nivel: 1, valores: ["2/descanso largo"] },
        { nivel: 5, valores: ["3/descanso largo"] },
        { nivel: 9, valores: ["4/descanso largo"] },
        { nivel: 13, valores: ["5/descanso largo"] },
        { nivel: 17, valores: ["6/descanso largo"] }
      ]);
    });

    it("Conjuros del Acechador en la Penumbra incluye tablaProgresion con 5 filas de conjuros", () => {
      const rasgos = obtenerRasgosClaseYSubclase("explorador", 3, "Acechador en la Penumbra");
      const conjuros = rasgos.find((r) => r.nombre === "Conjuros del Acechador en la Penumbra");

      expect(conjuros?.tablaProgresion).toBeDefined();
      expect(conjuros?.tablaProgresion?.columnas).toEqual(["Nivel de explorador", "Conjuros"]);
      expect(conjuros?.tablaProgresion?.filas).toEqual([
        { nivel: 3, valores: ["Disfrazarse"] },
        { nivel: 5, valores: ["Truco de la cuerda"] },
        { nivel: 9, valores: ["Terror"] },
        { nivel: 13, valores: ["Invisibilidad mejorada"] },
        { nivel: 17, valores: ["Apariencia"] }
      ]);
    });

    it("Dones de los Parajes Feéricos incluye tablaProgresion con 1d6 y 6 dádivas", () => {
      const rasgos = obtenerRasgosClaseYSubclase("explorador", 3, "Errante Feérico");
      const dones = rasgos.find((r) => r.nombre === "Dones de los Parajes Feéricos");

      expect(dones?.tablaProgresion).toBeDefined();
      expect(dones?.tablaProgresion?.columnas).toEqual(["1d6", "Dádiva"]);
      expect(dones?.tablaProgresion?.filas).toHaveLength(6);
      expect(dones?.tablaProgresion?.filas[0]).toEqual({
        nivel: 1,
        valores: ["Unas mariposas ilusorias revolotean a tu alrededor mientras haces un descanso corto o largo."]
      });
      expect(dones?.tablaProgresion?.filas[5]).toEqual({
        nivel: 6,
        valores: ["Tu piel y tu cabello cambian de color cada amanecer."]
      });
    });

    it("Conjuros del Errante Feérico incluye tablaProgresion con 5 filas de conjuros", () => {
      const rasgos = obtenerRasgosClaseYSubclase("explorador", 3, "Errante Feérico");
      const conjuros = rasgos.find((r) => r.nombre === "Conjuros del Errante Feérico");

      expect(conjuros?.tablaProgresion).toBeDefined();
      expect(conjuros?.tablaProgresion?.columnas).toEqual(["Nivel de explorador", "Conjuro"]);
      expect(conjuros?.tablaProgresion?.filas).toEqual([
        { nivel: 3, valores: ["Hechizar persona"] },
        { nivel: 5, valores: ["Paso brumoso"] },
        { nivel: 9, valores: ["Invocar feérico"] },
        { nivel: 13, valores: ["Puerta dimensional"] },
        { nivel: 17, valores: ["Engañar"] }
      ]);
    });
  });
});



