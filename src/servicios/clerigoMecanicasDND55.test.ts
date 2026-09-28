import { describe, it, expect } from "vitest";
import { obtenerRasgosClaseYSubclase } from "./gestorClases";
import { obtenerBonosHabilidadesRasgos } from "./rasgos/evaluadorSalvacionesRasgos";
import { aplicarModificadoresInvocacionesAHechizo } from "./rasgos/evaluadorCombateRasgos";
import { estaRasgoActivo, esRasgoHabilitadoPorOpcion } from "./rasgos/utilidadesRasgos";
import { evaluarEfectosRasgosActivos } from "./rasgos/evaluadorExpresionesRasgos";
import { resolverRasgosAcciones } from "./calculadorAccionesCombate";
import type { PersonajeJugador } from "@/tipos/personaje";
import { EFECTOS_PREDEFINIDOS } from "@/utiles/datosIniciales";

describe("Clérigo D&D 5.5 (2024) - Reglas y Mecánicas Base", () => {
  it("Nivel 1: Obtiene Lanzamiento de conjuros y Orden divina con rasgos hijos separados y condicionados", () => {
    const rasgosNv1 = obtenerRasgosClaseYSubclase("Clérigo", 1);
    
    const ordenDivina = rasgosNv1.find((r) => r.nombre === "Orden divina");
    expect(ordenDivina).toBeDefined();
    expect(ordenDivina?.selectores).toBeDefined();
    expect(ordenDivina?.selectores?.length).toBe(1);

    const selector = ordenDivina?.selectores?.[0];
    expect(selector?.id).toBe("selector_orden_divina");
    expect(selector?.opciones.length).toBe(2);

    const protector = rasgosNv1.find((r) => r.nombre === "Orden divina: Protector");
    expect(protector).toBeDefined();
    expect(protector?.ligadoA).toBe("Orden divina");
    expect(protector?.requiereOpcion).toBe("protector");
    expect(protector?.efectos?.some((e) => e.objetivo === "armas_marciales")).toBe(true);
    expect(protector?.efectos?.some((e) => e.objetivo === "armaduras_pesadas")).toBe(true);

    const taumaturgo = rasgosNv1.find((r) => r.nombre === "Orden divina: Taumaturgo");
    expect(taumaturgo).toBeDefined();
    expect(taumaturgo?.ligadoA).toBe("Orden divina");
    expect(taumaturgo?.requiereOpcion).toBe("taumaturgo");
    expect(taumaturgo?.efectos?.some((e) => e.tipo === "bono_habilidad" && e.objetivo === "conocimiento_arcano")).toBe(true);
    expect(taumaturgo?.efectos?.some((e) => e.tipo === "bono_habilidad" && e.objetivo === "religion")).toBe(true);
    expect(taumaturgo?.selectores?.some((s) => s.id === "selector_truco_taumaturgo")).toBe(true);
  });

  it("Taumaturgo aplica bono de Sabiduría a Conocimiento Arcano y Religión", () => {
    const personajeMock = {
      estadisticas: {
        fuerza: 10,
        destreza: 10,
        constitucion: 12,
        inteligencia: 10,
        sabiduria: 16, // Modificador +3
        carisma: 10
      },
      rasgos: [
        {
          id: "rasgo_orden_divina",
          nombre: "Orden divina",
          activo: true,
          selectores: [
            {
              id: "selector_orden_divina",
              tipo: "unico" as const,
              etiqueta: "Orden divina",
              valorActual: ["taumaturgo"],
              opciones: [
                {
                  id: "taumaturgo",
                  nombre: "Taumaturgo",
                  descripcion: "Bono de Sabiduría a pruebas de Arcano y Religión",
                  efectos: [
                    {
                      tipo: "bono_habilidad" as const,
                      objetivo: "conocimiento_arcano",
                      valor: "max(1, sabiduria)"
                    },
                    {
                      tipo: "bono_habilidad" as const,
                      objetivo: "religion",
                      valor: "max(1, sabiduria)"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    } as unknown as PersonajeJugador;

    const bonos = obtenerBonosHabilidadesRasgos(personajeMock);
    expect(bonos.arcanos).toBe(3);
    expect(bonos.religion).toBe(3);
    expect(bonos.atletismo).toBeUndefined();
  });

  it("Nivel 2: Canalizar divinidad tiene 2 usos y otorga Chispa divina y Expulsar muertos vivientes vinculados", () => {
    const rasgosNv2 = obtenerRasgosClaseYSubclase("Clérigo", 2);

    const canalizar = rasgosNv2.find((r) => r.nombre === "Canalizar divinidad");
    expect(canalizar).toBeDefined();
    expect(canalizar?.usosMaximos).toBe(2);
    expect(canalizar?.recuperacion).toBe("descanso_corto");

    const chispa = rasgosNv2.find((r) => r.nombre.includes("Chispa divina"));
    expect(chispa).toBeDefined();
    expect(chispa?.ligadoA).toBe("Canalizar divinidad");
    expect(chispa?.gastarDePadre).toBe(true);
    expect(chispa?.formulaDados).toBe("1d8+sabiduria");

    const expulsar = rasgosNv2.find((r) => r.nombre.includes("Expulsar muertos vivientes"));
    expect(expulsar).toBeDefined();
    expect(expulsar?.ligadoA).toBe("Canalizar divinidad");
    expect(expulsar?.gastarDePadre).toBe(true);
  });

  it("Nivel 5: Abrasar muertos vivientes extiende a Expulsar muertos vivientes con max(1, sabiduria)d8", () => {
    const rasgosNv5 = obtenerRasgosClaseYSubclase("Clérigo", 5);

    const expulsar = rasgosNv5.find((r) => r.nombre.includes("Expulsar muertos vivientes"));
    expect(expulsar).toBeDefined();
    expect(expulsar?.formulaDados).toBe("max(1, sabiduria)d8");
    expect(expulsar?.descripcion).toContain("Abrasar muertos vivientes");
  });

  it("Nivel 7: Chispa divina escala a 2d8+sabiduria y Golpes benditos provee opciones independientes", () => {
    const rasgosNv7 = obtenerRasgosClaseYSubclase("Clérigo", 7);

    const chispa = rasgosNv7.find((r) => r.nombre.includes("Chispa divina"));
    expect(chispa?.formulaDados).toBe("2d8+sabiduria");

    const golpes = rasgosNv7.find((r) => r.nombre === "Golpes benditos");
    expect(golpes).toBeDefined();
    expect(golpes?.categoriaMecanica).toBe("selector_informativo");

    const selectorGolpes = golpes?.selectores?.find((s) => s.id === "selector_golpes_benditos");
    expect(selectorGolpes).toBeDefined();
    expect(selectorGolpes?.opciones.some((o) => o.id === "golpe_divino")).toBe(true);
    expect(selectorGolpes?.opciones.some((o) => o.id === "lanzamiento_potente")).toBe(true);

    const golpeDivino = rasgosNv7.find((r) => r.nombre.includes("Golpe divino"));
    expect(golpeDivino).toBeDefined();
    expect(golpeDivino?.ligadoA).toBe("Golpes benditos");
    expect(golpeDivino?.requiereOpcion).toBe("golpe_divino");
    expect(golpeDivino?.esActivable).toBe(true);
    expect(golpeDivino?.autoDesactivarAlTirarDano).toBe(true);
    expect(golpeDivino?.formulaDados).toBe("1d8");
    expect(golpeDivino?.selectores?.some((s) => s.id === "selector_tipo_dano_golpe_divino")).toBe(true);

    const lanzamientoPotente = rasgosNv7.find((r) => r.nombre.includes("Lanzamiento potente"));
    expect(lanzamientoPotente).toBeDefined();
    expect(lanzamientoPotente?.ligadoA).toBe("Golpes benditos");
    expect(lanzamientoPotente?.requiereOpcion).toBe("lanzamiento_potente");
    expect(lanzamientoPotente?.esActivable).toBe(false);
    expect(lanzamientoPotente?.efectos?.some((e) => e.tipo === "bono_dano_conjuro")).toBe(true);
  });

  it("Lanzamiento potente habilita agregar el modificador de Sabiduría al daño de trucos", () => {
    const personajeMock = {
      estadisticas: { sabiduria: 18 },
      rasgos: [
        {
          id: "rasgo_golpes_benditos",
          nombre: "Golpes benditos",
          activo: true,
          selectores: [
            {
              id: "selector_golpes_benditos",
              tipo: "unico" as const,
              etiqueta: "Golpes benditos",
              valorActual: ["lanzamiento_potente"],
              opciones: [
                {
                  id: "lanzamiento_potente",
                  nombre: "Lanzamiento potente",
                  descripcion: "Sumas Sabiduría al daño de trucos",
                  efectos: [
                    {
                      tipo: "bono_dano_conjuro" as const,
                      objetivo: "agregar_modificador_habilidad",
                      valor: "sabiduria"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    } as unknown as PersonajeJugador;

    const hechizoTruco = {
      id: "llama_sagrada",
      nombre: "Llama sagrada",
      nivel: 0,
      esTruco: true,
      dano: "1d8",
      agregarModificadorHabilidad: false
    };

    const modificado = aplicarModificadoresInvocacionesAHechizo(
      hechizoTruco as unknown as Parameters<typeof aplicarModificadoresInvocacionesAHechizo>[0],
      personajeMock
    );
    expect(modificado.agregarModificadorHabilidad).toBe(true);
  });

  it("Nivel 10: Intercesión divina es un consumible con 1 uso por descanso largo", () => {
    const rasgosNv10 = obtenerRasgosClaseYSubclase("Clérigo", 10);

    const intercesion = rasgosNv10.find((r) => r.nombre === "Intercesión divina");
    expect(intercesion).toBeDefined();
    expect(intercesion?.tieneUsosLimitados).toBe(true);
    expect(intercesion?.usosMaximos).toBe(1);
    expect(intercesion?.recuperacion).toBe("descanso_largo");
  });

  it("Nivel 6: Canalizar divinidad escala a 3 usos según la tabla canónica 5.5e", () => {
    const rasgosNv6 = obtenerRasgosClaseYSubclase("Clérigo", 6);

    const canalizar = rasgosNv6.find((r) => r.nombre === "Canalizar divinidad");
    expect(canalizar?.usosMaximos).toBe(3);
  });

  it("Nivel 14: Golpes benditos mejorados extiende Golpe divino (2d8) y Lanzamiento potente (informativo)", () => {
    const rasgosNv14 = obtenerRasgosClaseYSubclase("Clérigo", 14);

    const golpeDivino = rasgosNv14.find((r) => r.nombre.includes("Golpe divino"));
    expect(golpeDivino).toBeDefined();
    expect(golpeDivino?.formulaDados).toBe("2d8");

    const lanzamientoPotente = rasgosNv14.find((r) => r.nombre.includes("Lanzamiento potente"));
    expect(lanzamientoPotente).toBeDefined();
    expect(lanzamientoPotente?.descripcion).toContain("Golpes benditos mejorados (Lanzamiento potente)");
    // Comprobar que no tiene efectos secundarios mecánicos de daño/hp_temporal que alteren los cálculos
    expect(lanzamientoPotente?.efectos?.some((e) => e.tipo === "hp_temporal")).toBe(false);
    expect(lanzamientoPotente?.efectos?.length).toBe(1);
    expect(lanzamientoPotente?.efectos?.[0].tipo).toBe("bono_dano_conjuro");
  });

  it("Nivel 18: Canalizar divinidad escala a 4 usos y Chispa divina a 4d8+sabiduria", () => {
    const rasgosNv18 = obtenerRasgosClaseYSubclase("Clérigo", 18);

    const canalizar = rasgosNv18.find((r) => r.nombre === "Canalizar divinidad");
    expect(canalizar?.usosMaximos).toBe(4);

    const chispa = rasgosNv18.find((r) => r.nombre.includes("Chispa divina"));
    expect(chispa?.formulaDados).toBe("4d8+sabiduria");
  });

  it("Nivel 20: Intercesión divina mayor extiende Intercesión divina con formulaDados 2d4", () => {
    const rasgosNv20 = obtenerRasgosClaseYSubclase("Clérigo", 20);

    const intercesion = rasgosNv20.find((r) => r.nombre === "Intercesión divina");
    expect(intercesion).toBeDefined();
    expect(intercesion?.formulaDados).toBe("2d4");
    expect(intercesion?.descripcion).toContain("Intercesión divina mayor");
  });

  it("Golpe divino declara autoDesactivarAlTirarDano para apagarse tras impacto de arma", () => {
    const rasgosNv7 = obtenerRasgosClaseYSubclase("Clérigo", 7);
    const golpeDivino = rasgosNv7.find((r) => r.nombre.includes("Golpe divino"));
    expect(golpeDivino?.autoDesactivarAlTirarDano).toBe(true);
    expect(golpeDivino?.esActivable).toBe(true);
    expect(golpeDivino?.activo).toBe(false);
  });

  it("Rasgos con requiereOpcion sólo están activos si la opción está seleccionada en el padre", () => {
    const rasgosClerigoNv1 = obtenerRasgosClaseYSubclase("Clérigo", 1);
    const personajeMockProtector = {
      nivel: 1,
      estadisticas: { sabiduria: 16 },
      rasgos: rasgosClerigoNv1.map((r) => {
        if (r.id === "rasgo_cls_clerigo_orden_divina") {
          return {
            ...r,
            selectores: [
              {
                id: "selector_orden_divina",
                tipo: "unico" as const,
                etiqueta: "Orden divina",
                opciones: r.selectores?.[0]?.opciones || [],
                valorActual: ["protector"]
              }
            ]
          };
        }
        return r;
      })
    } as unknown as PersonajeJugador;

    // Con "protector" seleccionado:
    const rasgoProtector = personajeMockProtector.rasgos.find((r) => r.nombre === "Orden divina: Protector")!;
    const rasgoTaumaturgo = personajeMockProtector.rasgos.find((r) => r.nombre === "Orden divina: Taumaturgo")!;
    expect(esRasgoHabilitadoPorOpcion(rasgoProtector, personajeMockProtector.rasgos)).toBe(true);
    expect(esRasgoHabilitadoPorOpcion(rasgoTaumaturgo, personajeMockProtector.rasgos)).toBe(false);
    expect(estaRasgoActivo(personajeMockProtector, "Orden divina: Protector")).toBe(true);
    expect(estaRasgoActivo(personajeMockProtector, "Orden divina: Taumaturgo")).toBe(false);

    const efectosProtector = evaluarEfectosRasgosActivos(personajeMockProtector);
    expect(efectosProtector.some((e) => e.objetivo === "armaduras_pesadas")).toBe(true);
    expect(efectosProtector.some((e) => e.objetivo === "conocimiento_arcano")).toBe(false);

    // Cambiando a "taumaturgo":
    const personajeMockTaumaturgo = {
      ...personajeMockProtector,
      rasgos: personajeMockProtector.rasgos.map((r) => {
        if (r.id === "rasgo_cls_clerigo_orden_divina") {
          return {
            ...r,
            selectores: [
              {
                ...r.selectores![0],
                valorActual: ["taumaturgo"]
              }
            ]
          };
        }
        return r;
      })
    } as unknown as PersonajeJugador;

    expect(estaRasgoActivo(personajeMockTaumaturgo, "Orden divina: Protector")).toBe(false);
    expect(estaRasgoActivo(personajeMockTaumaturgo, "Orden divina: Taumaturgo")).toBe(true);

    const efectosTaumaturgo = evaluarEfectosRasgosActivos(personajeMockTaumaturgo);
    expect(efectosTaumaturgo.some((e) => e.objetivo === "armaduras_pesadas")).toBe(false);
    expect(efectosTaumaturgo.some((e) => e.objetivo === "conocimiento_arcano")).toBe(true);
  });

  describe("Subclase: Dominio de la Vida (D&D 5.5e / PHB 2024)", () => {
    it("Nivel 3: Obtiene rasgos del Dominio de la Vida y Preservar vida gasta de Canalizar divinidad", () => {
      const rasgosVidaNv3 = obtenerRasgosClaseYSubclase("Clérigo", 3, "Dominio de la Vida");

      const conjuros = rasgosVidaNv3.find((r) => r.id === "rasgo_sub_vida_conjuros");
      expect(conjuros).toBeDefined();
      expect(conjuros?.categoriaMecanica).toBe("pasivo_permanente");

      const discipulo = rasgosVidaNv3.find((r) => r.id === "rasgo_sub_vida_discipulo_vida");
      expect(discipulo).toBeDefined();
      expect(discipulo?.categoriaMecanica).toBe("pasivo_permanente");

      const preservarVida = rasgosVidaNv3.find((r) => r.id === "rasgo_sub_vida_preservar_vida");
      expect(preservarVida).toBeDefined();
      expect(preservarVida?.nombre).toBe("Canalizar divinidad: Preservar vida");
      expect(preservarVida?.ligadoA).toBe("Canalizar divinidad");
      expect(preservarVida?.gastarDePadre).toBe(true);
      expect(preservarVida?.categoriaMecanica).toBe("curacion");
      expect(preservarVida?.formulaDados).toBe("5*nivel");
      expect(preservarVida?.tipoAccion).toBe("accion");
    });

    it("Niveles 6 y 17: Desbloquea Sanador bendito y Sanación suprema", () => {
      const rasgosVidaNv6 = obtenerRasgosClaseYSubclase("Clérigo", 6, "Dominio de la Vida");
      const sanador = rasgosVidaNv6.find((r) => r.id === "rasgo_sub_vida_sanador_bendito");
      expect(sanador).toBeDefined();
      expect(sanador?.nombre).toBe("Sanador bendito");

      const rasgosVidaNv17 = obtenerRasgosClaseYSubclase("Clérigo", 17, "Dominio de la Vida");
      const suprema = rasgosVidaNv17.find((r) => r.id === "rasgo_sub_vida_sanacion_suprema");
      expect(suprema).toBeDefined();
      expect(suprema?.nombre).toBe("Sanación suprema");
      expect(suprema?.categoriaMecanica).toBe("pasivo_permanente");
    });
  });

  describe("Subclase: Dominio de la Luz (D&D 5.5e / PHB 2024)", () => {
    it("Nivel 3: Resplandor del alba gasta de Canalizar divinidad y Fulgor protector escala por Sabiduría", () => {
      const rasgosLuzNv3 = obtenerRasgosClaseYSubclase("Clérigo", 3, "Dominio de la Luz");

      const resplandor = rasgosLuzNv3.find((r) => r.id === "rasgo_sub_luz_resplandor_del_alba");
      expect(resplandor).toBeDefined();
      expect(resplandor?.nombre).toBe("Canalizar divinidad: Resplandor del alba");
      expect(resplandor?.ligadoA).toBe("Canalizar divinidad");
      expect(resplandor?.gastarDePadre).toBe(true);
      expect(resplandor?.formulaDados).toBe("2d10+nivel");
      expect(resplandor?.tipoAccion).toBe("accion");

      const fulgor = rasgosLuzNv3.find((r) => r.id === "rasgo_sub_luz_fulgor_protector");
      expect(fulgor).toBeDefined();
      expect(fulgor?.tipoAccion).toBe("reaccion");
      expect(fulgor?.tieneUsosLimitados).toBe(true);
      expect(fulgor?.recuperacion).toBe("descanso_largo");
      expect(fulgor?.escaladoUsos?.tipo).toBe("por_modificador");
      expect(fulgor?.escaladoUsos?.modificador).toBe("sabiduria");
    });

    it("Nivel 6: Fulgor protector mejorado decora orgánicamente a Fulgor protector con descanso corto y 2d6+sabiduria", () => {
      const rasgosLuzNv6 = obtenerRasgosClaseYSubclase("Clérigo", 6, "Dominio de la Luz");

      const fulgor = rasgosLuzNv6.find((r) => r.nombre.includes("Fulgor protector"));
      expect(fulgor).toBeDefined();
      expect(fulgor?.recuperacion).toBe("descanso_corto");
      expect(fulgor?.formulaDados).toBe("2d6+sabiduria");
      expect(fulgor?.descripcion).toContain("Fulgor protector mejorado");
    });

    it("Nivel 17: Corona de luz es consumible de acción que escala por Sabiduría", () => {
      const rasgosLuzNv17 = obtenerRasgosClaseYSubclase("Clérigo", 17, "Dominio de la Luz");

      const corona = rasgosLuzNv17.find((r) => r.id === "rasgo_sub_luz_corona_de_luz");
      expect(corona).toBeDefined();
      expect(corona?.tipoAccion).toBe("accion");
      expect(corona?.tieneUsosLimitados).toBe(true);
      expect(corona?.recuperacion).toBe("descanso_largo");
      expect(corona?.escaladoUsos?.modificador).toBe("sabiduria");
    });
  });

  describe("Subclase: Dominio del Engaño (D&D 5.5e / PHB 2024)", () => {
    it("Nivel 3: Invocar duplicidad es acción adicional que gasta de Canalizar divinidad", () => {
      const rasgosEnganoNv3 = obtenerRasgosClaseYSubclase("Clérigo", 3, "Dominio del Engaño");

      const duplicidad = rasgosEnganoNv3.find((r) => r.id === "rasgo_sub_engano_invocar_duplicidad");
      expect(duplicidad).toBeDefined();
      expect(duplicidad?.nombre).toBe("Canalizar divinidad: Invocar duplicidad");
      expect(duplicidad?.ligadoA).toBe("Canalizar divinidad");
      expect(duplicidad?.gastarDePadre).toBe(true);
      expect(duplicidad?.tipoAccion).toBe("accion_adicional");
      expect(duplicidad?.categoriaMecanica).toBe("activable");

      const bendicion = rasgosEnganoNv3.find((r) => r.id === "rasgo_sub_engano_bendicion_embaucador");
      expect(bendicion).toBeDefined();
      expect(bendicion?.tipoAccion).toBe("accion");
    });

    it("Niveles 6 y 17: Transposición a nivel 6 y Duplicidad mejorada decora Invocar duplicidad a nivel 17", () => {
      const rasgosEnganoNv6 = obtenerRasgosClaseYSubclase("Clérigo", 6, "Dominio del Engaño");
      const transposicion = rasgosEnganoNv6.find((r) => r.id === "rasgo_sub_engano_transposicion_embaucador");
      expect(transposicion).toBeDefined();
      expect(transposicion?.tipoAccion).toBe("accion_adicional");

      const rasgosEnganoNv17 = obtenerRasgosClaseYSubclase("Clérigo", 17, "Dominio del Engaño");
      const duplicidadMejorada = rasgosEnganoNv17.find((r) => r.nombre.includes("Invocar duplicidad"));
      expect(duplicidadMejorada).toBeDefined();
      expect(duplicidadMejorada?.formulaDados).toBe("nivel");
      expect(duplicidadMejorada?.descripcion).toContain("Duplicidad mejorada");
    });
  });

  describe("Subclase: Dominio de la Guerra (D&D 5.5e / PHB 2024)", () => {
    it("Nivel 3: Golpe guiado gasta de Canalizar divinidad y Sacerdote guerrero recupera en descanso corto y escala por Sabiduría", () => {
      const rasgosGuerraNv3 = obtenerRasgosClaseYSubclase("Clérigo", 3, "Dominio de la Guerra");

      const golpeGuiado = rasgosGuerraNv3.find((r) => r.id === "rasgo_sub_guerra_golpe_guiado");
      expect(golpeGuiado).toBeDefined();
      expect(golpeGuiado?.nombre).toBe("Canalizar divinidad: Golpe guiado");
      expect(golpeGuiado?.ligadoA).toBe("Canalizar divinidad");
      expect(golpeGuiado?.gastarDePadre).toBe(true);
      expect(golpeGuiado?.tipoAccion).toBe("reaccion");
      expect(golpeGuiado?.categoriaMecanica).toBe("activable");

      const sacerdote = rasgosGuerraNv3.find((r) => r.id === "rasgo_sub_guerra_sacerdote_guerrero");
      expect(sacerdote).toBeDefined();
      expect(sacerdote?.tipoAccion).toBe("accion_adicional");
      expect(sacerdote?.tieneUsosLimitados).toBe(true);
      expect(sacerdote?.recuperacion).toBe("descanso_corto");
      expect(sacerdote?.escaladoUsos?.tipo).toBe("por_modificador");
      expect(sacerdote?.escaladoUsos?.modificador).toBe("sabiduria");
    });

    it("Niveles 6 y 17: Bendición del dios de la guerra gasta de Canalizar divinidad y Avatar de batalla a nivel 17", () => {
      const rasgosGuerraNv6 = obtenerRasgosClaseYSubclase("Clérigo", 6, "Dominio de la Guerra");
      const bendicion = rasgosGuerraNv6.find((r) => r.id === "rasgo_sub_guerra_bendicion_dios_guerra");
      expect(bendicion).toBeDefined();
      expect(bendicion?.nombre).toBe("Canalizar divinidad: Bendición del dios de la guerra");
      expect(bendicion?.ligadoA).toBe("Canalizar divinidad");
      expect(bendicion?.gastarDePadre).toBe(true);
      expect(bendicion?.categoriaMecanica).toBe("activable");

      const rasgosGuerraNv17 = obtenerRasgosClaseYSubclase("Clérigo", 17, "Dominio de la Guerra");
      const avatar = rasgosGuerraNv17.find((r) => r.id === "rasgo_sub_guerra_avatar_batalla");
      expect(avatar).toBeDefined();
      expect(avatar?.nombre).toBe("Avatar de batalla");
      expect(avatar?.categoriaMecanica).toBe("pasivo_permanente");
    });
  });

  describe("Filtrado de Acciones de Combate por Opciones Seleccionadas (Pestaña Acciones)", () => {
    it("En combate (pestaña Acciones), Golpe divino NO aparece si se ha seleccionado Lanzamiento potente", () => {
      const rasgosNv7 = obtenerRasgosClaseYSubclase("Clérigo", 7);
      const personajeMockLanzamiento = {
        id: "pj-clerigo-7",
        nivel: 7,
        estadisticas: { sabiduria: 16 },
        rasgos: rasgosNv7.map((r) => {
          if (r.id === "rasgo_cls_clerigo_golpes_benditos") {
            return {
              ...r,
              selectores: [
                {
                  id: "selector_golpes_benditos",
                  tipo: "unico" as const,
                  etiqueta: "Opción de Golpes benditos",
                  opciones: r.selectores?.[0]?.opciones || [],
                  valorActual: ["lanzamiento_potente"]
                }
              ]
            };
          }
          return r;
        })
      } as unknown as PersonajeJugador;

      const accionesCombate = resolverRasgosAcciones(personajeMockLanzamiento);
      const golpeDivinoEnAcciones = accionesCombate.find((item) =>
        item.rasgo.nombre.includes("Golpe divino")
      );
      expect(golpeDivinoEnAcciones).toBeUndefined();

      // Al conmutar a golpe_divino en el selector:
      const personajeMockGolpe = {
        ...personajeMockLanzamiento,
        rasgos: personajeMockLanzamiento.rasgos.map((r) => {
          if (r.id === "rasgo_cls_clerigo_golpes_benditos") {
            return {
              ...r,
              selectores: [
                {
                  ...r.selectores![0],
                  valorActual: ["golpe_divino"]
                }
              ]
            };
          }
          return r;
        })
      } as unknown as PersonajeJugador;

      const accionesCombateGolpe = resolverRasgosAcciones(personajeMockGolpe);
      const golpeDivinoHabilitado = accionesCombateGolpe.find((item) =>
        item.rasgo.nombre.includes("Golpe divino")
      );
      expect(golpeDivinoHabilitado).toBeDefined();
      expect(golpeDivinoHabilitado?.esActivable).toBe(true);
      expect(golpeDivinoHabilitado?.categoriasCombate).toContain("activable");
    });
  });

  describe("Tablas de Progresión Declarativas del Clérigo (D&D 5.5e)", () => {
    it("Canalizar divinidad contiene tabla de progresión de usos por nivel (2, 6, 18)", () => {
      const rasgosNv2 = obtenerRasgosClaseYSubclase("Clérigo", 2);
      const canalizar = rasgosNv2.find((r) => r.id === "rasgo_cls_clerigo_canalizar_divinidad");
      expect(canalizar?.tablaProgresion).toBeDefined();
      expect(canalizar?.tablaProgresion?.columnas).toEqual(["Nivel", "Descripción"]);
      expect(canalizar?.tablaProgresion?.notaPie).toBe("Cada nivel reemplaza al anterior");
      expect(canalizar?.tablaProgresion?.filas).toEqual([
        { nivel: 2, valores: ["2/descanso"] },
        { nivel: 6, valores: ["3/descanso"] },
        { nivel: 18, valores: ["4/descanso"] }
      ]);
    });

    it("Chispa divina contiene tabla de progresión de dados por nivel (2, 7, 13, 18)", () => {
      const rasgosNv2 = obtenerRasgosClaseYSubclase("Clérigo", 2);
      const chispa = rasgosNv2.find((r) => r.id === "rasgo_cls_clerigo_chispa_divina");
      expect(chispa?.tablaProgresion).toBeDefined();
      expect(chispa?.tablaProgresion?.columnas).toEqual(["Nivel", "Descripción"]);
      expect(chispa?.tablaProgresion?.notaPie).toBe("Cada nivel reemplaza al anterior");
      expect(chispa?.tablaProgresion?.filas).toEqual([
        { nivel: 2, valores: ["1d8"] },
        { nivel: 7, valores: ["2d8"] },
        { nivel: 13, valores: ["3d8"] },
        { nivel: 18, valores: ["4d8"] }
      ]);
    });

    it("Golpe divino contiene tabla de progresión de dados de daño por nivel (7, 14)", () => {
      const rasgosNv7 = obtenerRasgosClaseYSubclase("Clérigo", 7);
      const golpeDivino = rasgosNv7.find((r) => r.id === "rasgo_cls_clerigo_golpe_divino");
      expect(golpeDivino?.tablaProgresion).toBeDefined();
      expect(golpeDivino?.tablaProgresion?.columnas).toEqual(["Nivel", "Descripción"]);
      expect(golpeDivino?.tablaProgresion?.notaPie).toBe("Cada nivel reemplaza al anterior");
      expect(golpeDivino?.tablaProgresion?.filas).toEqual([
        { nivel: 7, valores: ["1d8"] },
        { nivel: 14, valores: ["2d8"] }
      ]);
    });

    it("Lanzamiento potente contiene tabla de progresión apilable por nivel (7, 14)", () => {
      const rasgosNv7 = obtenerRasgosClaseYSubclase("Clérigo", 7);
      const lanzamiento = rasgosNv7.find((r) => r.id === "rasgo_cls_clerigo_lanzamiento_potente");
      expect(lanzamiento?.tablaProgresion).toBeDefined();
      expect(lanzamiento?.tablaProgresion?.columnas).toEqual(["Nivel", "Descripción"]);
      expect(lanzamiento?.tablaProgresion?.notaPie).toBe("Se apilan los niveles");
      expect(lanzamiento?.tablaProgresion?.filas).toEqual([
        { nivel: 7, valores: ["Trucos + Sabiduría"] },
        { nivel: 14, valores: ["Trucos recuperan PG Temporales"] }
      ]);
    });

    it("Conjuros de dominio de Vida, Luz, Engaño y Guerra contienen tablas con [Nivel de clérigo, Conjuros preparados]", () => {
      const dominios = [
        { nombre: "Dominio de la Vida", id: "rasgo_sub_vida_conjuros", primerConjuro: "Auxilio" },
        { nombre: "Dominio de la Luz", id: "rasgo_sub_luz_conjuros", primerConjuro: "Fuego feérico" },
        { nombre: "Dominio del Engaño", id: "rasgo_sub_engano_conjuros", primerConjuro: "Disfrazarse" },
        { nombre: "Dominio de la Guerra", id: "rasgo_sub_guerra_conjuros", primerConjuro: "Arma espiritual" }
      ];

      for (const d of dominios) {
        const rasgos = obtenerRasgosClaseYSubclase("Clérigo", 9, d.nombre);
        const rConjuros = rasgos.find((r) => r.id === d.id);
        expect(rConjuros, `No encontrado rasgo ${d.id}`).toBeDefined();
        expect(rConjuros?.tablaProgresion?.columnas).toEqual(["Nivel de clérigo", "Conjuros preparados"]);
        expect(rConjuros?.tablaProgresion?.filas.length).toBe(4);
        expect(rConjuros?.tablaProgresion?.filas[0].nivel).toBe(3);
        expect(rConjuros?.tablaProgresion?.filas[0].valores[0]).toContain(d.primerConjuro);
      }
    });

    it("Fulgor protector contiene tabla de progresión apilable a nivel 6", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Clérigo", 3, "Dominio de la Luz");
      const fulgor = rasgos.find((r) => r.id === "rasgo_sub_luz_fulgor_protector");
      expect(fulgor?.tablaProgresion).toBeDefined();
      expect(fulgor?.tablaProgresion?.columnas).toEqual(["Nivel", "Descripción"]);
      expect(fulgor?.tablaProgresion?.notaPie).toBe("Se apilan los niveles");
      expect(fulgor?.tablaProgresion?.filas[0].nivel).toBe(6);
      expect(fulgor?.tablaProgresion?.filas[0].valores[0]).toContain("Recuperas todos los usos de tu Fulgor protector");
    });

    it("Corona de luz (Dominio de la Luz Nv. 17) es un consumible activable de 10 turnos vinculado al efecto predefinido informativo", () => {
      const rasgosNv17 = obtenerRasgosClaseYSubclase("Clérigo", 17, "Dominio de la Luz");
      const corona = rasgosNv17.find((r) => r.id === "rasgo_sub_luz_corona_de_luz");
      expect(corona).toBeDefined();
      expect(corona?.categoriaMecanica).toBe("consumible");
      expect(corona?.esActivable).toBe(true);
      expect(corona?.tieneUsosLimitados).toBe(true);
      expect(corona?.condicionAlActivar).toBe("Corona de luz");
      expect(corona?.duracionEfectoAlActivar).toBe(10);
      expect(corona?.recuperacion).toBe("descanso_largo");
      expect(corona?.escaladoUsos).toEqual({
        tipo: "por_modificador",
        modificador: "sabiduria",
        minimo: 1
      });

      // Validar presencia y duración en el catálogo de efectos predefinidos
      const efectoCorona = EFECTOS_PREDEFINIDOS.find((e) => e.nombre === "Corona de luz");
      expect(efectoCorona).toBeDefined();
      expect(efectoCorona?.duracionEstandar).toBe(10);
      expect(efectoCorona?.aliases).toContain("corona de luz");
    });
  });
});



