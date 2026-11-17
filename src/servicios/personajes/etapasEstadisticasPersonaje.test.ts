import { describe, expect, it } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import { MONSTRUOS_INICIALES } from "@/utiles/datosIniciales";
import {
  EsquemaArmadura,
  EsquemaEscudo,
  EsquemaObjetoInventario,
  EsquemaRasgoPersonaje,
  type MonstruoBase,
  type ObjetoInventario,
  type PersonajeJugador,
  type RasgoPersonaje
} from "@/tipos";
import { COMPETENCIAS_EXTRA_VACIAS } from "./tiposEstadisticasPersonaje";
import {
  obtenerMapaObjetos,
  resolverInventarioYEfectosPasivos
} from "./resolutorInventarioPasivos";
import { calcularCaracteristicasYModificadores } from "./calculadorCaracteristicas";
import { calcularTiradasSalvacion } from "./calculadorSalvaciones";
import { calcularHabilidadesYPasivas } from "./calculadorHabilidadesPasivas";
import {
  calcularClaseArmaduraYPenalizacion,
  extraerCaDePropiedades
} from "./calculadorClaseArmadura";

const crearPjBase = (cambios: Partial<PersonajeJugador> = {}): PersonajeJugador => ({
  ...structuredClone(PERSONAJE_POR_DEFECTO),
  id: "pj-etapas-test",
  nivel: 5,
  ...cambios
});

const crearItem = (campos: Partial<ObjetoInventario> & { nombre: string }): ObjetoInventario =>
  EsquemaObjetoInventario.parse({
    idInstancia: `inst_${campos.nombre.toLowerCase().replace(/\s+/g, "_")}`,
    idObjeto: campos.idObjeto ?? `obj_${campos.nombre.toLowerCase().replace(/\s+/g, "_")}`,
    categoria: "equipo-aventurero",
    ...campos
  });

const crearRasgo = (campos: Partial<RasgoPersonaje> & { id: string; nombre: string }): RasgoPersonaje =>
  EsquemaRasgoPersonaje.parse({ origen: "clase", descripcion: "Prueba", ...campos });

describe("Etapas puras del calculador de estadísticas", () => {
  it("resolutorInventarioPasivos: indexa O(1), prioriza homebrew, filtra sintonización y acumula refuerzo en una pasada", () => {
    const cotaHomebrew = EsquemaArmadura.parse({
      id: "cota_custom",
      nombre: "Cota de Escamas",
      caBase: 16,
      bonoDestreza: "Máximo 2",
      modificadorAtaqueDano: 1,
      efectosPasivos: [{ tipo: "CA", bono: "CA", valor: 1, descripcion: "Bono" }]
    });
    const catalogo = [cotaHomebrew];
    const mapa1 = obtenerMapaObjetos(catalogo);
    const mapa2 = obtenerMapaObjetos(catalogo);
    expect(mapa1).toBe(mapa2);
    expect(mapa1.get("cota de escamas")?.id).toBe("cota_custom");

    const pj = crearPjBase({
      inventario: [
        crearItem({ idObjeto: "cota_custom", nombre: "Cota de Escamas", categoria: "armaduras", equipado: true }),
        crearItem({ idObjeto: "esc_1", nombre: "Escudo", categoria: "escudos", equipado: true, modificadorAtaqueDano: 2 }),
        crearItem({
          idObjeto: "anillo_sin_sintonizar",
          nombre: "Anillo bloqueado",
          categoria: "objetos-magicos",
          equipado: true,
          sintonizacionRequerida: true,
          sintonizado: false,
          efectosPasivos: [{ tipo: "SALVACIÓN", bono: "Todas", valor: 3, descripcion: "No activo" }]
        }),
        crearItem({
          idObjeto: "espada_con_mod",
          nombre: "Espada +1",
          categoria: "armas",
          equipado: true,
          modificadorAtaqueDano: 1
        })
      ]
    });

    const ctx = resolverInventarioYEfectosPasivos(pj, [cotaHomebrew]);
    expect(ctx.armaduraEquipada?.nombre).toBe("Cota de Escamas");
    expect(ctx.armaduraCatalogo?.id).toBe("cota_custom");
    expect(ctx.escudoEquipado?.nombre).toBe("Escudo");
    expect(ctx.efectosPasivosActivos).toHaveLength(1);
    expect(ctx.bonosModificadorDirectoArmadura).toBe(3);
  });

  it("calculadorCaracteristicas: aplica jerarquía Forma Salvaje, límites máximos (Campeón primigenio) y pasivos >=19 vs sumables", () => {
    const lobo: MonstruoBase = { ...structuredClone(MONSTRUOS_INICIALES[0]), caracteristicas: { fuerza: 14, destreza: 15, constitucion: 12, inteligencia: 3, sabiduria: 12, carisma: 6 } };
    const rasgoCampeon = crearRasgo({
      id: "campeon_primigenio",
      nombre: "Campeón primigenio",
      efectos: [
        { tipo: "modificador_stat", objetivo: "fuerza", valor: 4, limiteMaximo: 25, descripcion: "+4 FUE" },
        { tipo: "modificador_stat", objetivo: "constitucion", valor: 4, limiteMaximo: 25, descripcion: "+4 CON" }
      ]
    });
    const pj = crearPjBase({
      caracteristicas: { fuerza: 20, destreza: 14, constitucion: 18, inteligencia: 16, sabiduria: 12, carisma: 10 },
      overridesFijos: { fuerza: null, destreza: null, constitucion: null, inteligencia: 18, sabiduria: null, carisma: null },
      personalizacionesCaracteristicas: { carisma: { valorFijo: 15, modificadorExtra: 1, bonoSalvacionExtra: 0, notas: "" } },
      rasgos: [rasgoCampeon]
    });

    const normal = calcularCaracteristicasYModificadores(pj, null, [
      { tipo: "CARACTERÍSTICA", bono: "FUE", valor: 19, descripcion: "Piso 19 no reduce 24" },
      { tipo: "atributo", bono: "wis", valor: 2, descripcion: "+2 SAB" }
    ]);
    expect(normal.puntuacionesEfectivas.fuerza).toBe(24);
    expect(normal.puntuacionesEfectivas.constitucion).toBe(22);
    expect(normal.puntuacionesEfectivas.inteligencia).toBe(18);
    expect(normal.puntuacionesEfectivas.sabiduria).toBe(14);
    expect(normal.modificadores.carisma).toBe(3);

    const enBestia = calcularCaracteristicasYModificadores(pj, lobo, []);
    expect(enBestia.puntuacionesEfectivas.fuerza).toBe(14);
    expect(enBestia.puntuacionesEfectivas.inteligencia).toBe(18);
  });

  it("calculadorSalvaciones: aplica competencias, Enfoque fanático sin doble conteo y Forma Salvaje", () => {
    const mods = { fuerza: 4, destreza: 2, constitucion: 3, inteligencia: 0, sabiduria: 1, carisma: -1 };
    const enfoque = crearRasgo({ id: "enfoque_fanatico_1", nombre: "Enfoque fanático", activo: true });
    const pj = crearPjBase({
      clase: "Guerrero",
      clases: [{ nombre: "Guerrero", subclase: "", nivel: 2 }, { nombre: "Bárbaro", subclase: "", nivel: 9 }],
      competenciasSalvacion: { fuerza: true, destreza: false, constitucion: false, inteligencia: false, sabiduria: false, carisma: false },
      personalizacionesCaracteristicas: { destreza: { valorFijo: null, modificadorExtra: 0, bonoSalvacionExtra: 2, notas: "" } },
      rasgos: [enfoque]
    });
    const bestia: MonstruoBase = { ...structuredClone(MONSTRUOS_INICIALES[0]), salvaciones: { sabiduria: 9 } };

    const salv = calcularTiradasSalvacion(
      pj,
      3,
      mods,
      { ...COMPETENCIAS_EXTRA_VACIAS, salvaciones: ["constitucion"] },
      bestia,
      [
        { tipo: "SALVACIÓN", bono: "Todas", valor: 1, descripcion: "Anillo" },
        { tipo: "salvacion", bono: "str", valor: 1, descripcion: "FUE extra" }
      ]
    );
    expect(salv.fuerza).toBe(4 + 3 + 1 + 1 + 3);
    expect(salv.destreza).toBe(2 + 2 + 1 + 3);
    expect(salv.constitucion).toBe(3 + 3 + 1 + 3);
    expect(salv.sabiduria).toBe(9);
  });

  it("calculadorHabilidadesPasivas: resuelve grados (medio/competente/pericia), Fuerza en Furia y pasivas", () => {
    const mods = { fuerza: 4, destreza: 1, constitucion: 2, inteligencia: 0, sabiduria: 2, carisma: -1 };
    const rasgos = [
      crearRasgo({ id: "aprendiz", nombre: "Aprendiz de todo", efectos: [{ tipo: "medio_bono_habilidades", objetivo: "todas", valor: 0.5, descripcion: "Medio bono" }] }),
      crearRasgo({ id: "con_prim", nombre: "Conocimiento primigenio", activo: true, efectos: [{ tipo: "habilidad_con_fuerza", objetivo: "sigilo", valor: "fuerza", descripcion: "Sigilo con FUE" }] })
    ];
    const pj = crearPjBase({
      gradosHabilidades: { ...PERSONAJE_POR_DEFECTO.gradosHabilidades, atletismo: "competente", percepcion: "pericia" },
      personalizacionesHabilidades: { acrobacias: { valorFijo: 11, modificadorExtra: 0, notas: "" } },
      rasgos
    });

    const res = calcularHabilidadesYPasivas(pj, 3, mods, COMPETENCIAS_EXTRA_VACIAS, null, [
      { tipo: "habilidad", bono: "atletismo", valor: 2, descripcion: "Bono atletismo" }
    ]);
    expect(res.gradosHabilidadesEfectivos.atletismo).toBe("competente");
    expect(res.gradosHabilidadesEfectivos.percepcion).toBe("pericia");
    expect(res.gradosHabilidadesEfectivos.sigilo).toBe("medio");
    expect(res.habilidades.atletismo).toBe(4 + 3 + 2);
    expect(res.habilidades.sigilo).toBe(4 + 1);
    expect(res.habilidades.acrobacias).toBe(11);
    expect(res.pasivas).toEqual({ percepcion: 18, investigacion: 11, perspicacia: 13 });
  });

  it("calculadorClaseArmadura: extrae CA textual, Defensa sin armadura, escudos mágicos, sigilo y competencia", () => {
    expect(extraerCaDePropiedades("Escudo, CA +3")).toBe(3);
    expect(extraerCaDePropiedades(["Ligera", "+2 CA"])).toBe(2);
    expect(extraerCaDePropiedades("CA 15")).toBe(15);
    expect(extraerCaDePropiedades(undefined)).toBeNull();

    const mods = { fuerza: 3, destreza: 3, constitucion: 4, inteligencia: 0, sabiduria: 2, carisma: 0 };
    const escudoMágico = EsquemaEscudo.parse({ id: "esc_m", nombre: "Escudo +1", caBase: 2, esMagico: true });
    const pjBarbaro = crearPjBase({
      clase: "Bárbaro",
      competenciasArmadurasGrupos: ["ligeras", "medias"],
      inventario: [crearItem({ idObjeto: "esc_m", nombre: "Escudo +1", categoria: "escudos", equipado: true, esMagico: true })]
    });
    const ctxBarb = resolverInventarioYEfectosPasivos(pjBarbaro, [escudoMágico]);
    const resBarb = calcularClaseArmaduraYPenalizacion(pjBarbaro, mods, COMPETENCIAS_EXTRA_VACIAS, null, ctxBarb);
    expect(resBarb.claseArmadura.total).toBe(10 + 3 + 4 + 2 + 1);
    expect(resBarb.penalizacionArmadura).toEqual({ sinCompetencia: true, armaduraNoCompetente: null, escudoNoCompetente: "Escudo +1" });

    const maestroMedias = crearRasgo({
      id: "maestro_med",
      nombre: "Maestro en Armaduras Medias",
      efectos: [{ tipo: "limite_des_armadura_media", objetivo: "limite_des_armadura_media", valor: 3, descripcion: "+3 DES" }]
    });
    const pjMed = crearPjBase({
      competenciasArmadurasGrupos: ["medias"],
      rasgos: [maestroMedias],
      inventario: [crearItem({ idObjeto: "semiplacas", nombre: "Semiplacas", categoria: "armaduras", subcategoria: "Mediana", equipado: true })]
    });
    const ctxMed = resolverInventarioYEfectosPasivos(pjMed, []);
    const resMed = calcularClaseArmaduraYPenalizacion(pjMed, mods, COMPETENCIAS_EXTRA_VACIAS, null, ctxMed);
    expect(resMed.claseArmadura.total).toBe(15 + 3);
    expect(resMed.desventajaSigiloArmadura).toBe(true);
    expect(resMed.penalizacionArmadura.sinCompetencia).toBe(false);
  });
});
