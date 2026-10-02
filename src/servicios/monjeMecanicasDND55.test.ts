import { describe, it, expect } from "vitest";
import { obtenerRasgosClaseYSubclase, obtenerClasePorNombre } from "./gestorClases";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { PersonajeJugador } from "@/tipos/personaje";
import {
  obtenerCompetenciasExtraRasgos,
  obtenerCompetenciasEfectivasTexto
} from "./rasgos/evaluadorSalvacionesRasgos";

describe("Monje D&D 5.5e (2024) - Reglas y Mecánicas", () => {
  describe("Fase 1: Clase Base Monje (Niveles 1 a 20)", () => {
    it("Artes marciales es una acción adicional y escala sus dados a 1d6, 1d8, 1d10 y 1d12", () => {
      const rasgosNv1 = obtenerRasgosClaseYSubclase("Monje", 1);
      const artesNv1 = rasgosNv1.find((r) => r.nombre === "Artes marciales");
      expect(artesNv1).toBeDefined();
      expect(artesNv1?.tipoAccion).toBe("accion_adicional");
      expect(artesNv1?.formulaDados).toBe("1d6");

      const rasgosNv5 = obtenerRasgosClaseYSubclase("Monje", 5);
      const artesNv5 = rasgosNv5.find((r) => r.nombre === "Artes marciales");
      expect(artesNv5?.formulaDados).toBe("1d8");

      const rasgosNv11 = obtenerRasgosClaseYSubclase("Monje", 11);
      const artesNv11 = rasgosNv11.find((r) => r.nombre === "Artes marciales");
      expect(artesNv11?.formulaDados).toBe("1d10");

      const rasgosNv17 = obtenerRasgosClaseYSubclase("Monje", 17);
      const artesNv17 = rasgosNv17.find((r) => r.nombre === "Artes marciales");
      expect(artesNv17?.formulaDados).toBe("1d12");
    });

    it("Defensa sin armadura es pasivo permanente con modificador por Sabiduría", () => {
      const rasgosNv1 = obtenerRasgosClaseYSubclase("Monje", 1);
      const defSinArm = rasgosNv1.find((r) => r.nombre === "Defensa sin armadura");
      expect(defSinArm?.categoriaMecanica).toBe("pasivo_permanente");
      expect(defSinArm?.efectos?.[0].tipo).toBe("modificador_ca");
      expect(defSinArm?.efectos?.[0].valor).toBe("sabiduria");
    });

    it("Concentración es consumible con usos por nivel y recuperación en descanso corto", () => {
      const rasgosNv2 = obtenerRasgosClaseYSubclase("Monje", 2);
      const concentracionNv2 = rasgosNv2.find((r) => r.nombre === "Concentración");
      expect(concentracionNv2?.categoriaMecanica).toBe("consumible");
      expect(concentracionNv2?.tieneUsosLimitados).toBe(true);
      expect(concentracionNv2?.usosMaximos).toBe(2);
      expect(concentracionNv2?.recuperacion).toBe("descanso_corto");

      const rasgosNv10 = obtenerRasgosClaseYSubclase("Monje", 10);
      const concentracionNv10 = rasgosNv10.find((r) => r.nombre === "Concentración");
      expect(concentracionNv10?.usosMaximos).toBe(10);

      const rasgosNv20 = obtenerRasgosClaseYSubclase("Monje", 20);
      const concentracionNv20 = rasgosNv20.find((r) => r.nombre === "Concentración");
      expect(concentracionNv20?.usosMaximos).toBe(20);
    });

    it("Ráfaga de golpes, Defensa paciente y Paso del viento son consumibles de acción adicional que gastan de Concentración", () => {
      const rasgosNv2 = obtenerRasgosClaseYSubclase("Monje", 2);
      const rafaga = rasgosNv2.find((r) => r.nombre === "Ráfaga de golpes");
      const defPaciente = rasgosNv2.find((r) => r.nombre === "Defensa paciente");
      const pasoViento = rasgosNv2.find((r) => r.nombre === "Paso del viento");

      expect(rafaga).toBeDefined();
      expect(rafaga?.tipoAccion).toBe("accion_adicional");
      expect(rafaga?.categoriaMecanica).toBe("consumible");
      expect(rafaga?.gastarDePadre).toBe(true);
      expect(rafaga?.ligadoA).toBe("Concentración");

      expect(defPaciente?.tipoAccion).toBe("accion_adicional");
      expect(defPaciente?.categoriaMecanica).toBe("consumible");
      expect(defPaciente?.gastarDePadre).toBe(true);

      expect(pasoViento?.tipoAccion).toBe("accion_adicional");
      expect(pasoViento?.categoriaMecanica).toBe("consumible");
      expect(pasoViento?.gastarDePadre).toBe(true);
    });

    it("Metabolismo asombroso es únicamente curación con 1 uso por descanso largo y tira dado de artes marciales + nivel", () => {
      const rasgosNv2 = obtenerRasgosClaseYSubclase("Monje", 2);
      const metabolismoNv2 = rasgosNv2.find((r) => r.nombre === "Metabolismo asombroso");

      expect(metabolismoNv2).toBeDefined();
      expect(metabolismoNv2?.categoriaMecanica).toBe("curacion");
      expect(metabolismoNv2?.esActivable).toBeFalsy();
      expect(metabolismoNv2?.tieneUsosLimitados).toBe(true);
      expect(metabolismoNv2?.recuperacion).toBe("descanso_largo");
      expect(metabolismoNv2?.formulaDados).toBe("1d6 + nivel");

      const rasgosNv5 = obtenerRasgosClaseYSubclase("Monje", 5);
      const metabolismoNv5 = rasgosNv5.find((r) => r.nombre === "Metabolismo asombroso");
      expect(metabolismoNv5?.formulaDados).toBe("1d8 + nivel");

      const rasgosNv11 = obtenerRasgosClaseYSubclase("Monje", 11);
      const metabolismoNv11 = rasgosNv11.find((r) => r.nombre === "Metabolismo asombroso");
      expect(metabolismoNv11?.formulaDados).toBe("1d10 + nivel");

      const rasgosNv17 = obtenerRasgosClaseYSubclase("Monje", 17);
      const metabolismoNv17 = rasgosNv17.find((r) => r.nombre === "Metabolismo asombroso");
      expect(metabolismoNv17?.formulaDados).toBe("1d12 + nivel");
    });

    it("Movimiento sin armadura escala la velocidad según el nivel del monje (+10 a +30)", () => {
      const rasgosNv2 = obtenerRasgosClaseYSubclase("Monje", 2);
      const movNv2 = rasgosNv2.find((r) => r.nombre === "Movimiento sin armadura");
      expect(movNv2?.efectos?.[0].valor).toBe(10);

      const rasgosNv6 = obtenerRasgosClaseYSubclase("Monje", 6);
      const movNv6 = rasgosNv6.find((r) => r.nombre === "Movimiento sin armadura");
      expect(movNv6?.efectos?.[0].valor).toBe(15);

      const rasgosNv10 = obtenerRasgosClaseYSubclase("Monje", 10);
      const movNv10 = rasgosNv10.find((r) => r.nombre === "Movimiento sin armadura");
      expect(movNv10?.efectos?.[0].valor).toBe(20);

      const rasgosNv14 = obtenerRasgosClaseYSubclase("Monje", 14);
      const movNv14 = rasgosNv14.find((r) => r.nombre === "Movimiento sin armadura");
      expect(movNv14?.efectos?.[0].valor).toBe(25);

      const rasgosNv18 = obtenerRasgosClaseYSubclase("Monje", 18);
      const movNv18 = rasgosNv18.find((r) => r.nombre === "Movimiento sin armadura");
      expect(movNv18?.efectos?.[0].valor).toBe(30);
    });

    it("Desviar ataques tiene fórmula 1d10 + destreza + nivel, gasta de Concentración y declara noGastarAlTirarDados", () => {
      const rasgosNv3 = obtenerRasgosClaseYSubclase("Monje", 3);
      const desviar = rasgosNv3.find((r) => r.nombre === "Desviar ataques");

      expect(desviar).toBeDefined();
      expect(desviar?.tipoAccion).toBe("reaccion");
      expect(desviar?.categoriaMecanica).toBe("consumible");
      expect(desviar?.formulaDados).toBe("1d10 + destreza + nivel");
      expect(desviar?.gastarDePadre).toBe(true);
      expect(desviar?.ligadoA).toBe("Concentración");
      expect(desviar?.noGastarAlTirarDados).toBe(true);
    });

    it("Golpe aturdidor es consumible y gasta de Concentración", () => {
      const rasgosNv5 = obtenerRasgosClaseYSubclase("Monje", 5);
      const aturdidor = rasgosNv5.find((r) => r.nombre === "Golpe aturdidor");

      expect(aturdidor).toBeDefined();
      expect(aturdidor?.categoriaMecanica).toBe("consumible");
      expect(aturdidor?.gastarDePadre).toBe(true);
      expect(aturdidor?.ligadoA).toBe("Concentración");
    });

    it("Concentración agudizada es extensión de Concentración", () => {
      const clase = obtenerClasePorNombre("Monje");
      const agudizadaDef = clase?.rasgos.find((r) => r.nombre === "Concentración agudizada");
      expect(agudizadaDef?.categoriaMecanica).toBe("extension");
      expect(agudizadaDef?.ligadoA).toBe("Concentración");

      const rasgosNv10 = obtenerRasgosClaseYSubclase("Monje", 10);
      const concentracion = rasgosNv10.find((r) => r.nombre === "Concentración");
      expect(concentracion?.descripcion).toContain("Concentración agudizada (Nv. 10)");
    });

    it("Superviviente disciplinado otorga competencia en todas las tiradas de salvación", () => {
      const rasgosNv14 = obtenerRasgosClaseYSubclase("Monje", 14);
      const superviviente = rasgosNv14.find((r) => r.nombre === "Superviviente disciplinado");

      expect(superviviente).toBeDefined();
      expect(superviviente?.categoriaMecanica).toBe("consumible");
      expect(superviviente?.gastarDePadre).toBe(true);
      expect(superviviente?.efectos?.length).toBe(6);

      const competencias = superviviente?.efectos?.map((e) => e.objetivo);
      expect(competencias).toContain("salvacion.fuerza");
      expect(competencias).toContain("salvacion.destreza");
      expect(competencias).toContain("salvacion.constitucion");
      expect(competencias).toContain("salvacion.inteligencia");
      expect(competencias).toContain("salvacion.sabiduria");
      expect(competencias).toContain("salvacion.carisma");
    });

    it("Concentración perfecta declara restauración condicional en iniciativa", () => {
      const rasgosNv15 = obtenerRasgosClaseYSubclase("Monje", 15);
      const perfecta = rasgosNv15.find((r) => r.nombre === "Concentración perfecta");

      expect(perfecta).toBeDefined();
      expect(perfecta?.dispararAlTirarIniciativa).toBe(true);
      expect(perfecta?.restaurarUsosAlActivar).toEqual({
        idRasgoObjetivo: "Concentración",
        hastaCantidad: 4,
        soloSiMenorOIgual: 3
      });
    });

    it("Defensa superior cuesta 3 puntos de concentración y gasta de Concentración", () => {
      const rasgosNv18 = obtenerRasgosClaseYSubclase("Monje", 18);
      const defSup = rasgosNv18.find((r) => r.nombre === "Defensa superior");

      expect(defSup).toBeDefined();
      expect(defSup?.categoriaMecanica).toBe("consumible");
      expect(defSup?.costeFijo).toBe(3);
      expect(defSup?.gastarDePadre).toBe(true);
      expect(defSup?.ligadoA).toBe("Concentración");
    });

    it("Cuerpo y mente otorga +4 Destreza y +4 Sabiduría", () => {
      const rasgosNv20 = obtenerRasgosClaseYSubclase("Monje", 20);
      const cuerpo = rasgosNv20.find((r) => r.nombre === "Cuerpo y mente");
      expect(cuerpo?.categoriaMecanica).toBe("pasivo_permanente");
      expect(cuerpo?.efectos?.length).toBe(2);
      expect(cuerpo?.efectos?.[0].valor).toBe(4);
      expect(cuerpo?.efectos?.[1].valor).toBe(4);
    });
  });

  describe("Fase 2: Guerrero de la Misericordia", () => {
    it("Mano del daño es consumible activable con daño secundario necrótico que se auto-desactiva al tirar daño", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Monje", 3, "Camino de la misericordia");
      const manoDano = rasgos.find((r) => r.nombre === "Mano del daño");

      expect(manoDano).toBeDefined();
      expect(manoDano?.categoriaMecanica).toBe("consumible");
      expect(manoDano?.esActivable).toBe(true);
      expect(manoDano?.autoDesactivarAlTirarDano).toBe(true);
      expect(manoDano?.gastarDePadre).toBe(true);
      expect(manoDano?.ligadoA).toBe("Concentración");
      expect(manoDano?.formulaDados).toBe("1d6 + sabiduria");
      expect(manoDano?.efectos?.[0].tipo).toBe("dano_secundario");
      expect(manoDano?.efectos?.[0].tipoDano).toBe("Necrótico");
      expect(manoDano?.efectos?.[0].valor).toBe("1d6 + sabiduria");

      const rasgosNv11 = obtenerRasgosClaseYSubclase("Monje", 11, "Camino de la misericordia");
      const manoDanoNv11 = rasgosNv11.find((r) => r.nombre === "Mano del daño");
      expect(manoDanoNv11?.formulaDados).toBe("1d10 + sabiduria");
      expect(manoDanoNv11?.efectos?.[0].valor).toBe("1d10 + sabiduria");
    });

    it("Mano curativa es curación y gasta de Concentración", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Monje", 3, "Camino de la misericordia");
      const manoCurativa = rasgos.find((r) => r.nombre === "Mano curativa");

      expect(manoCurativa).toBeDefined();
      expect(manoCurativa?.categoriaMecanica).toBe("curacion");
      expect(manoCurativa?.gastarDePadre).toBe(true);
      expect(manoCurativa?.ligadoA).toBe("Concentración");
      expect(manoCurativa?.formulaDados).toBe("1d6 + sabiduria");
    });

    it("Toque del médico es un rasgo pasivo permanente independiente con su propia tarjeta", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Monje", 6, "Camino de la misericordia");
      const toque = rasgos.find((r) => r.nombre === "Toque del médico");
      expect(toque).toBeDefined();
      expect(toque?.categoriaMecanica).toBe("pasivo_permanente");
      expect(toque?.subclase).toBe("Camino de la misericordia");

      const manoDano = rasgos.find((r) => r.nombre === "Mano del daño");
      expect(manoDano?.descripcion).not.toContain("Toque del médico");
    });

    it("Ráfaga de curación y daño es consumible escalado por modificador de Sabiduría", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Monje", 11, "Camino de la misericordia");
      const rafaga = rasgos.find((r) => r.nombre === "Ráfaga de curación y daño");

      expect(rafaga).toBeDefined();
      expect(rafaga?.categoriaMecanica).toBe("consumible");
      expect(rafaga?.tieneUsosLimitados).toBe(true);
      expect(rafaga?.escaladoUsos?.tipo).toBe("por_modificador");
      expect(rafaga?.escaladoUsos?.modificador).toBe("sabiduria");
      expect(rafaga?.recuperacion).toBe("descanso_largo");
    });

    it("Implementos de misericordia otorga competencias en Medicina, Perspicacia y Útiles de herborista", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Monje", 3, "Camino de la misericordia");
      const implementos = rasgos.find((r) => r.nombre === "Implementos de misericordia");

      expect(implementos).toBeDefined();
      expect(implementos?.categoriaMecanica).toBe("pasivo_permanente");
      expect(implementos?.efectos?.length).toBe(3);

      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_monje_misericordia_3",
        nombre: "Hermano Lucas",
        clases: [{ nombre: "Monje", subclase: "Camino de la misericordia", nivel: 3 }],
        nivel: 3,
        rasgos
      };

      const compExtra = obtenerCompetenciasExtraRasgos(pj);
      expect(compExtra.habilidades).toContain("medicina");
      expect(compExtra.habilidades).toContain("perspicacia");
      expect(compExtra.herramientas).toContain("Útiles de herborista");

      const compTotales = obtenerCompetenciasEfectivasTexto(pj);
      expect(compTotales.herramientasLista).toContain("Útiles de herborista");
    });

    it("Mano de la misericordia definitiva es consumible de 1 uso, tira 4d10 y cuesta 5 puntos de concentración", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Monje", 17, "Camino de la misericordia");
      const def = rasgos.find((r) => r.nombre === "Mano de la misericordia definitiva");

      expect(def).toBeDefined();
      expect(def?.categoriaMecanica).toBe("consumible");
      expect(def?.usosMaximos).toBe(1);
      expect(def?.formulaDados).toBe("4d10");
      expect(def?.costeFijo).toBe(5);
      expect(def?.gastarDePadre).toBe(true);
      expect(def?.ligadoA).toBe("Concentración");
    });

    it("Mano de la misericordia definitiva gasta y recupera simultáneamente su propio uso y 5 puntos de Concentración", () => {
      const rasgosMisericordia = obtenerRasgosClaseYSubclase("Monje", 17, "Camino de la misericordia");
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_monje_misericordia_dual",
        nombre: "Sanador Supremo",
        clases: [{ nombre: "Monje", subclase: "Camino de la misericordia", nivel: 17 }],
        nivel: 17,
        rasgos: rasgosMisericordia.map((r) => {
          if (r.nombre === "Concentración") {
            return { ...r, usosRestantes: 20, usosMaximos: 20 };
          }
          if (r.nombre === "Mano de la misericordia definitiva") {
            return { ...r, usosRestantes: 1, usosMaximos: 1 };
          }
          return r;
        })
      };

      usarAlmacenDM.setState({
        personajes: [pj]
      });

      const manoDef = pj.rasgos.find((r) => r.nombre === "Mano de la misericordia definitiva");
      expect(manoDef).toBeDefined();

      // Gastar rasgo
      usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj.id, manoDef!.id, 5);

      let estado = usarAlmacenDM.getState().personajes.find((p) => p.id === pj.id);
      let rasgoActualizado = estado?.rasgos.find((r) => r.id === manoDef!.id);
      let concentracion = estado?.rasgos.find((r) => r.nombre === "Concentración");

      // Debe haber consumido su uso propio (1 -> 0) y 5 de Concentración (20 -> 15)
      expect(rasgoActualizado?.usosRestantes).toBe(0);
      expect(concentracion?.usosRestantes).toBe(15);

      // Recuperar uso propio y puntos de concentración
      usarAlmacenDM.getState().recuperarUsoRasgoPersonaje(pj.id, manoDef!.id, 5);

      estado = usarAlmacenDM.getState().personajes.find((p) => p.id === pj.id);
      rasgoActualizado = estado?.rasgos.find((r) => r.id === manoDef!.id);
      concentracion = estado?.rasgos.find((r) => r.nombre === "Concentración");

      expect(rasgoActualizado?.usosRestantes).toBe(1);
      expect(concentracion?.usosRestantes).toBe(20);
    });
  });

  describe("Fase 3: Guerrero de la Sombra", () => {
    it("Artes de la sombra - Oscuridad es consumible que gasta de Concentración y otorga Oscuridad", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Monje", 3, "Camino de la sombra");
      const artes = rasgos.find((r) => r.nombre === "Artes de la sombra - Oscuridad");

      expect(artes).toBeDefined();
      expect(artes?.categoriaMecanica).toBe("consumible");
      expect(artes?.gastarDePadre).toBe(true);
      expect(artes?.ligadoA).toBe("Concentración");
      expect(artes?.conjurosOtorgados).toContain("Oscuridad");
    });

    it("Paso de la sombra es activable y otorga ventaja en ataque", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Monje", 6, "Camino de la sombra");
      const paso = rasgos.find((r) => r.nombre === "Paso de la sombra");

      expect(paso).toBeDefined();
      expect(paso?.tipoAccion).toBe("accion_adicional");
      expect(paso?.categoriaMecanica).toBe("activable");
      expect(paso?.esActivable).toBe(true);
      expect(paso?.autoDesactivarAlTirarDano).toBe(true);
      expect(paso?.efectos?.[0].tipo).toBe("ventaja");
    });

    it("Paso de la sombra mejorado es extensión de Paso de la sombra que añade gasto de concentración", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Monje", 11, "Camino de la sombra");
      const paso = rasgos.find((r) => r.nombre === "Paso de la sombra");
      expect(paso?.descripcion).toContain("Paso de la sombra mejorado (Nv. 11)");
    });

    it("Manto de sombras es consumible, cuesta 3 puntos de concentración y gasta de Concentración", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Monje", 17, "Camino de la sombra");
      const manto = rasgos.find((r) => r.nombre === "Manto de sombras");

      expect(manto).toBeDefined();
      expect(manto?.categoriaMecanica).toBe("consumible");
      expect(manto?.costeFijo).toBe(3);
      expect(manto?.gastarDePadre).toBe(true);
      expect(manto?.ligadoA).toBe("Concentración");
    });
  });

  describe("Fase 4: Guerrero de los Elementos", () => {
    it("Sintonía elemental es consumible activable que gasta de Concentración", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Monje", 3, "Camino de los elementos");
      const sintonia = rasgos.find((r) => r.nombre === "Sintonía elemental");

      expect(sintonia).toBeDefined();
      expect(sintonia?.categoriaMecanica).toBe("consumible");
      expect(sintonia?.esActivable).toBe(true);
      expect(sintonia?.condicionAlActivar).toBe("Sintonía elemental");
      expect(sintonia?.gastarDePadre).toBe(true);
      expect(sintonia?.ligadoA).toBe("Concentración");
    });

    it("Estallido elemental es consumible de coste 2 que gasta de Concentración y escala en 3 dados de artes marciales", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Monje", 6, "Camino de los elementos");
      const estallido = rasgos.find((r) => r.nombre === "Estallido elemental");

      expect(estallido).toBeDefined();
      expect(estallido?.categoriaMecanica).toBe("consumible");
      expect(estallido?.costeFijo).toBe(2);
      expect(estallido?.gastarDePadre).toBe(true);
      expect(estallido?.ligadoA).toBe("Concentración");
      expect(estallido?.formulaDados).toBe("3d8");

      const rasgosNv11 = obtenerRasgosClaseYSubclase("Monje", 11, "Camino de los elementos");
      const estallidoNv11 = rasgosNv11.find((r) => r.nombre === "Estallido elemental");
      expect(estallidoNv11?.formulaDados).toBe("3d10");
    });

    it("Epítome elemental es extensión de Sintonía elemental", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Monje", 17, "Camino de los elementos");
      const sintonia = rasgos.find((r) => r.nombre === "Sintonía elemental");
      expect(sintonia?.descripcion).toContain("Epítome elemental (Nv. 17)");
    });
  });

  describe("Fase 5: Guerrero de la Mano Abierta", () => {
    it("Técnica de la mano abierta es selector informativo con opciones Confundir, Empujar y Derribar", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Monje", 3, "Camino de la mano abierta");
      const tecnica = rasgos.find((r) => r.nombre === "Técnica de la mano abierta");

      expect(tecnica).toBeDefined();
      expect(tecnica?.categoriaMecanica).toBe("selector_informativo");
      const opciones = tecnica?.selectores?.[0].opciones;
      expect(opciones?.some((o) => o.id === "confundir")).toBe(true);
      expect(opciones?.some((o) => o.id === "empujar")).toBe(true);
      expect(opciones?.some((o) => o.id === "derribar")).toBe(true);
    });

    it("Plenitud corporal es curación con usos por Sabiduría y escala con dado de artes marciales", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Monje", 6, "Camino de la mano abierta");
      const plenitud = rasgos.find((r) => r.nombre === "Plenitud corporal");

      expect(plenitud).toBeDefined();
      expect(plenitud?.categoriaMecanica).toBe("curacion");
      expect(plenitud?.tieneUsosLimitados).toBe(true);
      expect(plenitud?.escaladoUsos?.tipo).toBe("por_modificador");
      expect(plenitud?.escaladoUsos?.modificador).toBe("sabiduria");
      expect(plenitud?.formulaDados).toBe("1d8 + sabiduria");

      const rasgosNv17 = obtenerRasgosClaseYSubclase("Monje", 17, "Camino de la mano abierta");
      const plenitudNv17 = rasgosNv17.find((r) => r.nombre === "Plenitud corporal");
      expect(plenitudNv17?.formulaDados).toBe("1d12 + sabiduria");
    });

    it("Palma trémula cuesta 4 puntos de concentración, gasta de Concentración y tira 10d12", () => {
      const rasgos = obtenerRasgosClaseYSubclase("Monje", 17, "Camino de la mano abierta");
      const palma = rasgos.find((r) => r.nombre === "Palma trémula");

      expect(palma).toBeDefined();
      expect(palma?.categoriaMecanica).toBe("consumible");
      expect(palma?.costeFijo).toBe(4);
      expect(palma?.gastarDePadre).toBe(true);
      expect(palma?.ligadoA).toBe("Concentración");
      expect(palma?.formulaDados).toBe("10d12");
    });
  });

  describe("Comportamiento reactivo en el Store de Zustand", () => {
    it("Concentración perfecta restaura hasta 4 puntos si tenía 3 o menos al tirar iniciativa", () => {
      const rasgosMonje = obtenerRasgosClaseYSubclase("Monje", 15);
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_monje_test_2",
        nombre: "Maestro Wu",
        clases: [{ nombre: "Monje", subclase: "", nivel: 15 }],
        nivel: 15,
        rasgos: rasgosMonje.map((r) => {
          if (r.nombre === "Concentración") {
            return { ...r, usosRestantes: 1 };
          }
          return r;
        })
      };

      usarAlmacenDM.setState({
        personajes: [pj]
      });

      usarAlmacenDM.getState().dispararRasgosIniciativaPersonaje(pj.id);

      const pjActualizado = usarAlmacenDM.getState().personajes.find((p) => p.id === pj.id);
      const concentracion = pjActualizado?.rasgos.find((r) => r.nombre === "Concentración");

      expect(concentracion?.usosRestantes).toBe(4);
    });

    it("Concentración perfecta NO restaura si el monje ya tenía 4 o más puntos de concentración", () => {
      const rasgosMonje = obtenerRasgosClaseYSubclase("Monje", 15);
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_monje_test_3",
        nombre: "Maestro Wu Con 6 Puntos",
        clases: [{ nombre: "Monje", subclase: "", nivel: 15 }],
        nivel: 15,
        rasgos: rasgosMonje.map((r) => {
          if (r.nombre === "Concentración") {
            return { ...r, usosRestantes: 6 };
          }
          return r;
        })
      };

      usarAlmacenDM.setState({
        personajes: [pj]
      });

      usarAlmacenDM.getState().dispararRasgosIniciativaPersonaje(pj.id);

      const pjActualizado = usarAlmacenDM.getState().personajes.find((p) => p.id === pj.id);
      const concentracion = pjActualizado?.rasgos.find((r) => r.nombre === "Concentración");

      // Debe permanecer intacto en 6
      expect(concentracion?.usosRestantes).toBe(6);
    });

    it("Gasto de múltiples puntos de concentración deduce correctamente de Concentración", () => {
      const rasgosMonje = obtenerRasgosClaseYSubclase("Monje", 20, "Camino de la mano abierta");
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_monje_test_gasto_multiple",
        nombre: "Maestro de la Mano Abierta",
        clases: [{ nombre: "Monje", subclase: "Camino de la mano abierta", nivel: 20 }],
        nivel: 20,
        rasgos: rasgosMonje.map((r) => {
          if (r.nombre === "Concentración") {
            return { ...r, usosRestantes: 20, usosMaximos: 20 };
          }
          return r;
        })
      };

      usarAlmacenDM.setState({
        personajes: [pj]
      });

      const palmaTremula = pj.rasgos.find((r) => r.nombre === "Palma trémula");
      const defensaSuperior = pj.rasgos.find((r) => r.nombre === "Defensa superior");
      const rafagaGolpes = pj.rasgos.find((r) => r.nombre === "Ráfaga de golpes");

      expect(palmaTremula?.costeFijo).toBe(4);
      expect(palmaTremula?.gastarDePadre).toBe(true);

      expect(defensaSuperior?.costeFijo).toBe(3);
      expect(defensaSuperior?.gastarDePadre).toBe(true);

      // 1. Gastar 4 puntos con Palma trémula (20 -> 16)
      usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj.id, palmaTremula!.id, palmaTremula!.costeFijo);
      let estado = usarAlmacenDM.getState().personajes.find((p) => p.id === pj.id);
      let concentracion = estado?.rasgos.find((r) => r.nombre === "Concentración");
      expect(concentracion?.usosRestantes).toBe(16);

      // 2. Gastar 3 puntos con Defensa superior (16 -> 13)
      usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj.id, defensaSuperior!.id, defensaSuperior!.costeFijo);
      estado = usarAlmacenDM.getState().personajes.find((p) => p.id === pj.id);
      concentracion = estado?.rasgos.find((r) => r.nombre === "Concentración");
      expect(concentracion?.usosRestantes).toBe(13);

      // 3. Gastar 1 punto con Ráfaga de golpes (13 -> 12)
      usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj.id, rafagaGolpes!.id, 1);
      estado = usarAlmacenDM.getState().personajes.find((p) => p.id === pj.id);
      concentracion = estado?.rasgos.find((r) => r.nombre === "Concentración");
      expect(concentracion?.usosRestantes).toBe(12);

      // 4. Recuperar 4 puntos (12 -> 16)
      usarAlmacenDM.getState().recuperarUsoRasgoPersonaje(pj.id, palmaTremula!.id, 4);
      estado = usarAlmacenDM.getState().personajes.find((p) => p.id === pj.id);
      concentracion = estado?.rasgos.find((r) => r.nombre === "Concentración");
      expect(concentracion?.usosRestantes).toBe(16);
    });

    it("Gasto de múltiples puntos en Camino de los elementos (Estallido elemental: 2) y Misericordia (Mano definitiva: 5)", () => {
      const rasgosElementos = obtenerRasgosClaseYSubclase("Monje", 17, "Camino de los elementos");
      const rasgosMisericordia = obtenerRasgosClaseYSubclase("Monje", 17, "Camino de la misericordia");

      const estallido = rasgosElementos.find((r) => r.nombre === "Estallido elemental");
      expect(estallido?.costeFijo).toBe(2);
      expect(estallido?.gastarDePadre).toBe(true);

      const manoDefinitiva = rasgosMisericordia.find((r) => r.nombre === "Mano de la misericordia definitiva");
      expect(manoDefinitiva?.costeFijo).toBe(5);
      expect(manoDefinitiva?.gastarDePadre).toBe(true);
    });
  });
});
