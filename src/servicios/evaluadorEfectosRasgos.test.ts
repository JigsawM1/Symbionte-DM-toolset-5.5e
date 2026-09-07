import { describe, it, expect } from "vitest";
import {
  evaluarEfectosRasgosActivos,
  calcularModificadoresStatsRasgos,
  calcularDefensaSinArmaduraRasgos,
  calcularBonoVelocidadRasgos,
  evaluarVentajasDeRasgosEnTirada,
  obtenerBonoDanoFuria
} from "./evaluadorEfectosRasgos";
import { evaluarFormulaUsos, construirBuildClase, aplicarBuildClaseAPersonaje } from "./gestorClases";
import { sincronizarRasgosAutomaticos } from "./compendioRasgos";
import { PERSONAJE_POR_DEFECTO, esCompetenteConArma } from "@/constantes";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";

function crearRasgoPrueba(parcial: Partial<RasgoPersonaje> & { id: string; nombre: string }): RasgoPersonaje {
  return {
    descripcion: "",
    origen: "clase",
    fuente: "Bárbaro",
    tipoAccion: "pasivo",
    tieneUsosLimitados: false,
    recuperacion: "ninguno",
    personalizado: false,
    activo: true,
    notas: "",
    esActivable: false,
    efectos: [],
    selectores: [],
    ...parcial
  };
}

function crearObjetoInventarioPrueba(
  parcial: Partial<PersonajeJugador["inventario"][number]> & {
    idInstancia: string;
    idObjeto: string;
    nombre: string;
    tipoPrincipal: "Arma" | "Armadura" | "Equipo de Aventuras";
  }
): PersonajeJugador["inventario"][number] {
  return {
    cantidad: 1,
    equipado: false,
    sintonizado: false,
    esMagico: false,
    rareza: "Común",
    equipable: true,
    sintonizacionRequerida: false,
    notas: "",
    pesoLb: 1,
    ...parcial
  };
}

describe("Evaluador de Efectos Mecánicos de Rasgos y Sistema de Builds", () => {
  it("debe evaluar correctamente el escalado del bono de daño de furia", () => {
    expect(obtenerBonoDanoFuria(1)).toBe(2);
    expect(obtenerBonoDanoFuria(8)).toBe(2);
    expect(obtenerBonoDanoFuria(9)).toBe(3);
    expect(obtenerBonoDanoFuria(15)).toBe(3);
    expect(obtenerBonoDanoFuria(16)).toBe(4);
    expect(obtenerBonoDanoFuria(20)).toBe(4);
  });

  it("debe evaluar fórmulas de usos en formato string seguro sin usar eval()", () => {
    const formulaFuria = "nivel < 3 ? 2 : nivel < 6 ? 3 : nivel < 12 ? 4 : nivel < 17 ? 5 : 6";
    expect(evaluarFormulaUsos(formulaFuria, 1)).toBe(2);
    expect(evaluarFormulaUsos(formulaFuria, 2)).toBe(2);
    expect(evaluarFormulaUsos(formulaFuria, 3)).toBe(3);
    expect(evaluarFormulaUsos(formulaFuria, 6)).toBe(4);
    expect(evaluarFormulaUsos(formulaFuria, 12)).toBe(5);
    expect(evaluarFormulaUsos(formulaFuria, 17)).toBe(6);
    expect(evaluarFormulaUsos(formulaFuria, 20)).toBe(6);
  });

  it("debe aplicar bono de Campeón Primigenio (+4 Fuerza y +4 Constitución) a nivel 20", () => {
    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      nivel: 20,
      caracteristicas: {
        fuerza: 20,
        destreza: 14,
        constitucion: 20,
        inteligencia: 10,
        sabiduria: 12,
        carisma: 8
      },
      rasgos: [
        crearRasgoPrueba({
          id: "rasgo_cls_barbaro_campeon_primigenio",
          nombre: "Campeón primigenio",
          descripcion: "Tus puntuaciones de Fuerza y Constitución aumentan en 4 hasta un máximo de 25.",
          nivelRequerido: 20,
          efectos: [
            { tipo: "modificador_stat", objetivo: "fuerza", valor: 4, condicion: null },
            { tipo: "modificador_stat", objetivo: "constitucion", valor: 4, condicion: null }
          ]
        })
      ]
    };

    const mods = calcularModificadoresStatsRasgos(pj);
    expect(mods.bonos.fuerza).toBe(4);
    expect(mods.bonos.constitucion).toBe(4);
    expect(mods.bonos.destreza).toBe(0);
    expect(mods.limitesMaximos.fuerza).toBe(25);
    expect(mods.limitesMaximos.constitucion).toBe(25);
  });

  it("debe calcular correctamente la defensa sin armadura del bárbaro", () => {
    const pjSinArmadura: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      caracteristicas: {
        fuerza: 16,
        destreza: 14,
        constitucion: 16,
        inteligencia: 10,
        sabiduria: 12,
        carisma: 8
      },
      inventario: [],
      rasgos: [
        crearRasgoPrueba({
          id: "rasgo_cls_barbaro_defensa_sin_armadura",
          nombre: "Defensa sin armadura",
          descripcion: "Sin armadura corporal, tu CA base es 10 + DES + CON.",
          efectos: [
            { tipo: "modificador_ca", objetivo: "defensa_sin_armadura", valor: "constitucion", condicion: "sin_armadura" }
          ]
        })
      ]
    };

    const resDefensa = calcularDefensaSinArmaduraRasgos(pjSinArmadura, {
      fuerza: 3,
      destreza: 2,
      constitucion: 3,
      inteligencia: 0,
      sabiduria: 1,
      carisma: -1
    });

    expect(resDefensa?.aplica).toBe(true);
    expect(resDefensa?.caracteristicaExtra).toBe("constitucion");
    expect(resDefensa?.bonoExtra).toBe(3);
  });

  it("debe desactivar la defensa sin armadura si lleva una armadura corporal equipada", () => {
    const pjConCotaMalla: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      caracteristicas: {
        fuerza: 16,
        destreza: 14,
        constitucion: 16,
        inteligencia: 10,
        sabiduria: 12,
        carisma: 8
      },
      inventario: [
        crearObjetoInventarioPrueba({
          idInstancia: "cota_malla_1",
          idObjeto: "cota_malla",
          nombre: "Cota de malla",
          tipoPrincipal: "Armadura",
          equipado: true,
          pesoLb: 55
        })
      ],
      rasgos: [
        crearRasgoPrueba({
          id: "rasgo_cls_barbaro_defensa_sin_armadura",
          nombre: "Defensa sin armadura",
          descripcion: "Sin armadura corporal, tu CA base es 10 + DES + CON.",
          efectos: [
            { tipo: "modificador_ca", objetivo: "defensa_sin_armadura", valor: "constitucion", condicion: "sin_armadura" }
          ]
        })
      ]
    };

    const resDefensa = calcularDefensaSinArmaduraRasgos(pjConCotaMalla, {
      fuerza: 3,
      destreza: 2,
      constitucion: 3,
      inteligencia: 0,
      sabiduria: 1,
      carisma: -1
    });

    expect(resDefensa).toBeNull();
  });

  it("debe calcular el bono de velocidad por movimiento rápido (+10 pies) si no lleva armadura pesada", () => {
    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      inventario: [],
      rasgos: [
        crearRasgoPrueba({
          id: "rasgo_cls_barbaro_movimiento_rapido",
          nombre: "Movimiento rápido",
          descripcion: "Tu velocidad aumenta 10 pies cuando no llevas armadura pesada.",
          efectos: [
            { tipo: "modificador_velocidad", objetivo: "velocidad_caminar", valor: 10, condicion: "sin_armadura_pesada" }
          ]
        })
      ]
    };

    expect(calcularBonoVelocidadRasgos(pj)).toBe(10);

    const pjConArmaduraPesada: PersonajeJugador = {
      ...pj,
      inventario: [
        crearObjetoInventarioPrueba({
          idInstancia: "armadura_placas_1",
          idObjeto: "armadura_placas",
          nombre: "Armadura de placas",
          tipoPrincipal: "Armadura",
          equipado: true,
          pesoLb: 65
        })
      ]
    };

    expect(calcularBonoVelocidadRasgos(pjConArmaduraPesada)).toBe(0);
  });

  it("debe otorgar ventaja en salvaciones de Destreza con Sentido del Peligro y en iniciativa con Instinto Salvaje", () => {
    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      rasgos: [
        crearRasgoPrueba({
          id: "rasgo_cls_barbaro_sentido_del_peligro",
          nombre: "Sentido del peligro",
          descripcion: "Tienes ventaja en las tiradas de salvación de Destreza contra efectos que puedas ver.",
          efectos: [
            { tipo: "ventaja", objetivo: "salvacion.destreza", valor: 1, condicion: null }
          ]
        }),
        crearRasgoPrueba({
          id: "rasgo_cls_barbaro_instinto_salvaje",
          nombre: "Instinto salvaje",
          descripcion: "Tienes ventaja en las tiradas de iniciativa.",
          efectos: [
            { tipo: "ventaja", objetivo: "iniciativa", valor: 1, condicion: null }
          ]
        })
      ]
    };

    const ventajasSalvacionDes = evaluarVentajasDeRasgosEnTirada(pj, {
      tipoTirada: "salvacion",
      subtipo: "destreza"
    });
    expect(ventajasSalvacionDes.tieneVentaja).toBe(true);
    expect(ventajasSalvacionDes.razones[0]).toContain("Sentido del peligro");

    const ventajasIniciativa = evaluarVentajasDeRasgosEnTirada(pj, {
      tipoTirada: "iniciativa"
    });
    expect(ventajasIniciativa.tieneVentaja).toBe(true);
    expect(ventajasIniciativa.razones[0]).toContain("Instinto salvaje");

    const ventajasSalvacionFue = evaluarVentajasDeRasgosEnTirada(pj, {
      tipoTirada: "salvacion",
      subtipo: "fuerza"
    });
    expect(ventajasSalvacionFue.tieneVentaja).toBe(false);
  });

  it("debe respetar la jerarquía de ligadoA (Golpe Brutal requiere Ataque Temerario activo)", () => {
    const rasgoTemerario: RasgoPersonaje = {
      id: "rasgo_cls_barbaro_ataque_temerario",
      nombre: "Ataque temerario",
      descripcion: "Puedes tirar con ventaja en tus ataques con Fuerza.",
      origen: "clase",
      fuente: "Bárbaro (Nivel 2)",
      tipoAccion: "pasivo",
      tieneUsosLimitados: false,
      recuperacion: "ninguno",
      personalizado: false,
      notas: "",
      esActivable: true,
      activo: false
    };

    const rasgoGolpeBrutal: RasgoPersonaje = {
      id: "rasgo_cls_barbaro_golpe_brutal",
      nombre: "Golpe brutal",
      descripcion: "Si usas Ataque Temerario...",
      origen: "clase",
      fuente: "Bárbaro (Nivel 9)",
      tipoAccion: "especial",
      tieneUsosLimitados: false,
      recuperacion: "ninguno",
      personalizado: false,
      notas: "",
      esActivable: true,
      ligadoA: "rasgo_cls_barbaro_ataque_temerario",
      activo: true,
      efectos: [
        { tipo: "dado_extra_dano", objetivo: "ataque_temerario", valor: "1d10", condicion: "ataque_temerario_activo" }
      ]
    };

    const pjInactivo: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      rasgos: [rasgoTemerario, rasgoGolpeBrutal]
    };

    const efectosInactivos = evaluarEfectosRasgosActivos(pjInactivo);
    expect(efectosInactivos.filter((e) => e.tipo === "dado_extra_dano")).toHaveLength(0);

    const pjActivo: PersonajeJugador = {
      ...pjInactivo,
      rasgos: [{ ...rasgoTemerario, activo: true }, rasgoGolpeBrutal]
    };

    const efectosActivos = evaluarEfectosRasgosActivos(pjActivo);
    expect(efectosActivos.filter((e) => e.tipo === "dado_extra_dano")).toHaveLength(1);
  });

  it("debe construir un build completo de Bárbaro nivel 5 propagando efectos, tablas y selectores", () => {
    const build = construirBuildClase("Bárbaro", 5, "Senda del Berserker");
    expect(build).not.toBeNull();
    expect(build?.clase.nombre).toBe("Bárbaro");
    expect(build?.nivel).toBe(5);
    expect(build?.subclase?.nombre).toBe("Senda del Berserker");

    const furia = build?.rasgos.find((r) => r.nombre === "Furia");
    expect(furia).toBeDefined();
    expect(furia?.esActivable).toBe(true);
    expect(furia?.tablaProgresion).toBeDefined();
    expect(furia?.tablaProgresion?.filas.length).toBeGreaterThanOrEqual(8);

    const maestria = build?.rasgos.find((r) => r.nombre === "Maestría con armas");
    expect(maestria).toBeDefined();
    expect(maestria?.selectores).toBeDefined();
    expect(maestria?.selectores?.[0].maxSelecciones).toBe(3);

    const pjActualizado = aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", 5, "Senda del Berserker");
    expect(pjActualizado.clase).toBe("Bárbaro");
    expect(pjActualizado.nivel).toBe(5);
    expect(pjActualizado.subclase).toBe("Senda del Berserker");
    expect(pjActualizado.rasgos.some((r) => r.nombre === "Furia")).toBe(true);
    expect(pjActualizado.rasgos.some((r) => r.nombre === "Frenesí")).toBe(true);
  });

  it("debe cumplir todas las verificaciones del plan para un Bárbaro nivel 9 con Senda del Berserker", () => {
    // 1. Construir y aplicar build de Bárbaro nivel 9 Berserker
    const buildNiv9 = construirBuildClase("Bárbaro", 9, "Senda del Berserker");
    expect(buildNiv9).not.toBeNull();
    expect(buildNiv9?.nivel).toBe(9);
    expect(buildNiv9?.efectosActivosResueltos).toBeDefined();

    let pjNiv9 = aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", 9, "Senda del Berserker");
    pjNiv9 = {
      ...pjNiv9,
      caracteristicas: {
        fuerza: 18,
        destreza: 14,
        constitucion: 16,
        inteligencia: 10,
        sabiduria: 12,
        carisma: 8
      },
      inventario: []
    };

    // 2. Furia muestra botón toggle y escala a +3 daño FUE a nivel 9
    const furia = pjNiv9.rasgos.find((r) => r.nombre === "Furia");
    expect(furia).toBeDefined();
    expect(furia?.esActivable).toBe(true);
    expect(obtenerBonoDanoFuria(pjNiv9.nivel)).toBe(3);

    // 3. Ataque Temerario se puede activar y otorga ventaja en ataques con Fuerza
    const temerario = pjNiv9.rasgos.find((r) => r.nombre === "Ataque temerario");
    expect(temerario).toBeDefined();
    expect(temerario?.esActivable).toBe(true);

    const pjTemerarioActivo = {
      ...pjNiv9,
      rasgos: pjNiv9.rasgos.map((r) => (r.nombre === "Ataque temerario" ? { ...r, activo: true } : r))
    };
    const ventajasAtaque = evaluarVentajasDeRasgosEnTirada(pjTemerarioActivo, {
      tipoTirada: "ataque",
      subtipo: "fuerza"
    });
    expect(ventajasAtaque.tieneVentaja).toBe(true);
    expect(ventajasAtaque.razones[0]).toContain("Ataque temerario");

    // 4. Golpe Brutal está presente a nivel 9, ligado a Ataque Temerario y con selector de golpes
    const golpeBrutal = pjNiv9.rasgos.find((r) => r.nombre === "Golpe brutal");
    expect(golpeBrutal).toBeDefined();
    expect(golpeBrutal?.ligadoA).toBe("rasgo_cls_barbaro_ataque_temerario");
    expect(golpeBrutal?.selectores).toBeDefined();
    expect(golpeBrutal?.selectores?.[0].opciones.length).toBeGreaterThanOrEqual(2);

    // 5. Sentido del Peligro otorga ventaja automática en salvaciones de Destreza
    const ventajasSalDestreza = evaluarVentajasDeRasgosEnTirada(pjNiv9, {
      tipoTirada: "salvacion",
      subtipo: "destreza"
    });
    expect(ventajasSalDestreza.tieneVentaja).toBe(true);
    expect(ventajasSalDestreza.razones[0]).toContain("Sentido del peligro");

    // 6. Defensa sin armadura calcula CA = 10 + DES + CON (10 + 2 + 3 = 15)
    const caRes = calcularDefensaSinArmaduraRasgos(pjNiv9, {
      fuerza: 4,
      destreza: 2,
      constitucion: 3,
      inteligencia: 0,
      sabiduria: 1,
      carisma: -1
    });
    expect(caRes?.aplica).toBe(true);
    expect(caRes?.caracteristicaExtra).toBe("constitucion");
    expect(caRes?.bonoExtra).toBe(3);
  });

  it("debe verificar las 8 propiedades de maestría de armas oficiales D&D 5.5e y su escalado", () => {
    const buildNiv1 = construirBuildClase("Bárbaro", 1);
    const maestriaNiv1 = buildNiv1?.rasgos.find((r) => r.nombre === "Maestría con armas");
    expect(maestriaNiv1).toBeDefined();
    const selector = maestriaNiv1?.selectores?.[0];
    expect(selector).toBeDefined();
    expect(selector?.maxSelecciones).toBe(2);
    expect(selector?.opciones.length).toBe(8);

    const idsEsperados = ["cleave", "graze", "nick", "push", "sap", "slow", "topple", "vex"];
    expect(selector?.opciones.map((o) => o.id)).toEqual(expect.arrayContaining(idsEsperados));

    // Nivel 4 escala a 3 opciones, Nivel 10 escala a 4 opciones
    const buildNiv4 = construirBuildClase("Bárbaro", 4);
    expect(buildNiv4?.rasgos.find((r) => r.nombre === "Maestría con armas")?.selectores?.[0].maxSelecciones).toBe(3);

    const buildNiv10 = construirBuildClase("Bárbaro", 10);
    expect(buildNiv10?.rasgos.find((r) => r.nombre === "Maestría con armas")?.selectores?.[0].maxSelecciones).toBe(4);
  });

  it("debe integrar orgánicamente Golpe Brutal a nivel 13 y 17 y consolidar Mejora de Característica", () => {
    // Bárbaro nivel 13
    const buildNiv13 = construirBuildClase("Bárbaro", 13);
    const golpeBrutal13 = buildNiv13?.rasgos.find((r) => r.nombre === "Golpe brutal");
    expect(golpeBrutal13).toBeDefined();
    const opciones13 = golpeBrutal13?.selectores?.[0].opciones || [];
    expect(opciones13.length).toBe(4);
    expect(opciones13.some((o) => o.id === "golpe_desestabilizador")).toBe(true);
    expect(opciones13.some((o) => o.id === "golpe_desgarrador")).toBe(true);

    // No debe haber tarjeta duplicada 'Golpe brutal mejorado' suelta
    expect(buildNiv13?.rasgos.some((r) => r.nombre === "Golpe brutal mejorado")).toBe(false);

    // Bárbaro nivel 17: formulaDados '2d10', 2 selecciones simultáneas
    const buildNiv17 = construirBuildClase("Bárbaro", 17);
    const golpeBrutal17 = buildNiv17?.rasgos.find((r) => r.nombre === "Golpe brutal");
    expect(golpeBrutal17).toBeDefined();
    expect(golpeBrutal17?.formulaDados).toBe("2d10");
    expect(golpeBrutal17?.selectores?.[0].maxSelecciones).toBe(2);
    expect(golpeBrutal17?.selectores?.[0].tipo).toBe("multiple");

    // Mejora de Característica consolidada
    const mejoras = buildNiv17?.rasgos.filter((r) => r.nombre === "Mejora de característica");
    expect(mejoras?.length).toBe(1);
    expect(mejoras?.[0].fuente).toContain("Niveles 4, 8, 12, 16");
  });

  it("debe escalar dinámicamente el daño de Frenesí y los dados curativos de Guerrero de los Dioses", () => {
    // Berserker nivel 3: Frenesí 2d6 (+2 Furia)
    const berserkerNiv3 = construirBuildClase("Bárbaro", 3, "Senda del Berserker");
    expect(berserkerNiv3?.rasgos.find((r) => r.nombre === "Frenesí")?.formulaDados).toBe("2d6");

    // Berserker nivel 9: Frenesí 3d6 (+3 Furia)
    const berserkerNiv9 = construirBuildClase("Bárbaro", 9, "Senda del Berserker");
    expect(berserkerNiv9?.rasgos.find((r) => r.nombre === "Frenesí")?.formulaDados).toBe("3d6");

    // Berserker nivel 16: Frenesí 4d6 (+4 Furia)
    const berserkerNiv16 = construirBuildClase("Bárbaro", 16, "Senda del Berserker");
    expect(berserkerNiv16?.rasgos.find((r) => r.nombre === "Frenesí")?.formulaDados).toBe("4d6");

    // Fanático: Guerrero de los Dioses (4 d12 a nv 3, 5 a nv 6, 6 a nv 12, 7 a nv 17)
    const fanaticoNiv3 = construirBuildClase("Bárbaro", 3, "Senda del Fanático");
    const gDioses3 = fanaticoNiv3?.rasgos.find((r) => r.nombre === "Guerrero de los dioses");
    expect(gDioses3?.usosMaximos).toBe(4);
    expect(gDioses3?.categoriaMecanica).toBe("curacion");
    expect(gDioses3?.formulaDados).toBe("1d12");

    const fanaticoNiv6 = construirBuildClase("Bárbaro", 6, "Senda del Fanático");
    expect(fanaticoNiv6?.rasgos.find((r) => r.nombre === "Guerrero de los dioses")?.usosMaximos).toBe(5);

    const fanaticoNiv12 = construirBuildClase("Bárbaro", 12, "Senda del Fanático");
    expect(fanaticoNiv12?.rasgos.find((r) => r.nombre === "Guerrero de los dioses")?.usosMaximos).toBe(6);

    const fanaticoNiv17 = construirBuildClase("Bárbaro", 17, "Senda del Fanático");
    expect(fanaticoNiv17?.rasgos.find((r) => r.nombre === "Guerrero de los dioses")?.usosMaximos).toBe(7);
  });

  it("no debe generar marcadores de posición 'Rasgo de subclase' y debe purgar duplicados", () => {
    // 1. Construir Bárbaro nivel 20: no debe contener ningún rasgo con nombre 'Rasgo de subclase'
    const buildNiv20 = construirBuildClase("Bárbaro", 20, "Senda del Berserker");
    const placeholders = buildNiv20?.rasgos.filter((r) => r.nombre.toLowerCase().includes("rasgo de subclase"));
    expect(placeholders?.length).toBe(0);

    // 2. Sincronización automática debe purgar duplicados y placeholders si un personaje los tuviera
    const pjContaminado: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      clase: "Bárbaro",
      subclase: "Senda del Berserker",
      nivel: 20,
      clases: [{ nombre: "Bárbaro", subclase: "Senda del Berserker", nivel: 20 }],
      rasgos: [
        crearRasgoPrueba({
          id: "rasgo_cls_barbaro_rasgo_de_subclase",
          nombre: "Rasgo de subclase",
          descripcion: "Obtienes un rasgo de tu subclase de bárbaro.",
          origen: "clase",
          nivelRequerido: 6
        }),
        crearRasgoPrueba({
          id: "rasgo_cls_barbaro_rasgo_de_subclase",
          nombre: "Rasgo de subclase",
          descripcion: "Obtienes un rasgo de tu subclase de bárbaro.",
          origen: "clase",
          nivelRequerido: 10
        }),
        crearRasgoPrueba({
          id: "rasgo_cls_barbaro_furia",
          nombre: "Furia",
          descripcion: "Furia bárbara",
          origen: "clase",
          nivelRequerido: 1
        })
      ]
    };

    const sincronizados = sincronizarRasgosAutomaticos(pjContaminado);
    expect(sincronizados.some((r) => r.nombre.toLowerCase().includes("rasgo de subclase"))).toBe(false);

    // Todos los IDs en sincronizados deben ser estrictamente únicos
    const ids = sincronizados.map((r) => r.id);
    const idsUnicos = new Set(ids);
    expect(ids.length).toBe(idsUnicos.size);
  });

  it("debe actualizar la descripción y fuente de Golpe Brutal al nivel 13 y 17", () => {
    const buildNiv9 = construirBuildClase("Bárbaro", 9);
    const gb9 = buildNiv9?.rasgos.find((r) => r.nombre === "Golpe brutal");
    expect(gb9?.descripcion).toContain("Golpe contundente");
    expect(gb9?.descripcion).not.toContain("Golpe desestabilizador");

    const buildNiv13 = construirBuildClase("Bárbaro", 13);
    const gb13 = buildNiv13?.rasgos.find((r) => r.nombre === "Golpe brutal");
    expect(gb13?.descripcion).toContain("Golpe desestabilizador");
    expect(gb13?.descripcion).toContain("Golpe desgarrador");
    expect(gb13?.fuente).toContain("Niveles 9, 13");

    const buildNiv17 = construirBuildClase("Bárbaro", 17);
    const gb17 = buildNiv17?.rasgos.find((r) => r.nombre === "Golpe brutal");
    expect(gb17?.descripcion).toContain("Golpe brutal mejorado (II)");
    expect(gb17?.fuente).toContain("Niveles 9, 13, 17");
  });

  it("al aplicar build de Bárbaro debe asignar grupos canónicos de armas y armaduras y poblar la lista", () => {
    const build = construirBuildClase("Bárbaro", 5);
    expect(build).not.toBeNull();

    const pjInicial: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: "pj-comp-test",
      nombre: "Conan",
      competenciasArmasGrupos: [],
      competenciasArmasLista: [],
      competenciasArmadurasGrupos: [],
      competenciasArmadurasLista: []
    };

    const pjActualizado = aplicarBuildClaseAPersonaje(pjInicial, build!, {
      sobrescribirCompetenciasEquipo: true
    });

    expect(pjActualizado.competenciasArmasGrupos).toContain("sencillas");
    expect(pjActualizado.competenciasArmasGrupos).toContain("marciales");
    expect(pjActualizado.competenciasArmasLista.length).toBeGreaterThan(15);
    expect(pjActualizado.competenciasArmasLista).toContain("Hacha a dos manos");
    expect(pjActualizado.competenciasArmasLista).toContain("Daga");

    expect(pjActualizado.competenciasArmadurasGrupos).toContain("ligeras");
    expect(pjActualizado.competenciasArmadurasGrupos).toContain("medias");
    expect(pjActualizado.competenciasArmadurasGrupos).toContain("escudos");

    // Verificar que es competente con Hacha a dos manos y Daga
    const esCompHacha = esCompetenteConArma(
      "Hacha a dos manos",
      "Marcial",
      pjActualizado.competenciasArmasGrupos,
      pjActualizado.competenciasArmasLista
    );
    expect(esCompHacha).toBe(true);

    const esCompDaga = esCompetenteConArma(
      "Daga",
      "Sencilla",
      pjActualizado.competenciasArmasGrupos,
      pjActualizado.competenciasArmasLista
    );
    expect(esCompDaga).toBe(true);
  });

  it("Senda del Fanático debe incluir Enfoque fanático y Furia de los dioses como activables con uso", () => {
    const buildFanatico14 = construirBuildClase("Bárbaro", 14, "Senda del Fanático");
    const enfoque = buildFanatico14?.rasgos.find((r) => r.nombre === "Enfoque fanático");
    expect(enfoque?.esActivable).toBe(true);

    const furiaDioses = buildFanatico14?.rasgos.find((r) => r.nombre === "Furia de los dioses");
    expect(furiaDioses?.esActivable).toBe(true);
    expect(furiaDioses?.tieneUsosLimitados).toBe(true);
    expect(furiaDioses?.usosMaximos).toBe(1);
    expect(furiaDioses?.recuperacion).toBe("descanso_largo");
  });
});
