import { beforeEach, describe, expect, it } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { MONSTRUOS_INICIALES } from "@/utiles/datosIniciales";
import {
  EsquemaArmadura,
  EsquemaEscudo,
  EsquemaObjetoInventario,
  EsquemaRasgoPersonaje,
  type ObjetoHomebrew,
  type ObjetoInventario,
  type PersonajeJugador,
  type RasgoPersonaje
} from "@/tipos";
import { calcularEstadisticasPersonaje } from "./calculadorEstadisticasPersonaje";

const crearItem = (campos: Partial<ObjetoInventario> & { nombre: string }): ObjetoInventario =>
  EsquemaObjetoInventario.parse({
    idInstancia: `inst_${campos.nombre.toLowerCase().replace(/\s+/g, "_")}`,
    idObjeto: campos.idObjeto ?? `obj_${campos.nombre.toLowerCase().replace(/\s+/g, "_")}`,
    categoria: "equipo-aventurero",
    ...campos
  });

const crearRasgo = (campos: Partial<RasgoPersonaje> & { id: string; nombre: string }): RasgoPersonaje =>
  EsquemaRasgoPersonaje.parse({ origen: "clase", descripcion: "Prueba", ...campos });

describe("calcularEstadisticasPersonaje - Integración completa y caché WeakMap", () => {
  beforeEach(() => {
    usarAlmacenDM.setState({ objetosHomebrew: [], personajes: [], datosInicialesCargados: false });
  });

  it("resuelve Forma Salvaje + Multiclase (Círculo de la Luna + Bárbaro) fusionando o conservando equipo", () => {
    const osoPardo = MONSTRUOS_INICIALES.find((m) => m.id === "m_oso_pardo")!;
    const rasgoLuna = crearRasgo({
      id: "forma_circulo_luna",
      nombre: "Formas del Círculo",
      activo: true,
      formasBestia: { progresion: [{ nivelMinimo: 2, conocidas: 4, vdMaximo: 1, vuelo: false }] },
      ajustesFormaBestia: { divisorNivelVD: 3, baseCaSabiduria: 13, multiplicadorPgTemporales: 3 }
    });
    const pjBase: PersonajeJugador = {
      ...structuredClone(PERSONAJE_POR_DEFECTO),
      id: "pj-druida-barbaro",
      nivel: 9,
      clase: "Druida",
      clases: [
        { nombre: "Druida", subclase: "Círculo de la Luna", nivel: 6 },
        { nombre: "Bárbaro", subclase: "", nivel: 3 }
      ],
      caracteristicas: { fuerza: 10, destreza: 12, constitucion: 14, inteligencia: 12, sabiduria: 20, carisma: 8 },
      competenciasSalvacion: { fuerza: false, destreza: false, constitucion: false, inteligencia: true, sabiduria: true, carisma: false },
      gradosHabilidades: { ...PERSONAJE_POR_DEFECTO.gradosHabilidades, percepcion: "pericia" },
      competenciasArmadurasGrupos: ["ligeras"],
      condicionesActivas: ["Forma salvaje"],
      rasgos: [rasgoLuna],
      inventario: [
        crearItem({ idObjeto: "placas", nombre: "Armadura de Placas", categoria: "armaduras", subcategoria: "Pesada", equipado: true }),
        crearItem({ idObjeto: "esc_3", nombre: "Escudo Bastión", categoria: "escudos", equipado: true, caBase: 3 })
      ],
      formaSalvaje: {
        formaActivaId: osoPardo.id,
        formasConocidasIds: [osoPardo.id],
        sustitucionDisponible: false,
        hpTemporalAlTransformar: 18
      }
    };

    const statsFusionado = calcularEstadisticasPersonaje(pjBase, []);
    // FUE/DES/CON de Oso Pardo, SAB conservada del PJ (+5), CA 13 + SAB(5) = 18
    expect(statsFusionado.puntuacionesEfectivas.fuerza).toBe(osoPardo.caracteristicas.fuerza);
    expect(statsFusionado.puntuacionesEfectivas.sabiduria).toBe(20);
    expect(statsFusionado.salvaciones.sabiduria).toBe(5 + 4);
    expect(statsFusionado.habilidades.percepcion).toBe(5 + 4 * 2);
    expect(statsFusionado.claseArmadura.total).toBe(18);
    expect(statsFusionado.claseArmadura.desglose).toBe("CA 18 (Base de forma 13 + SAB +5)");
    expect(statsFusionado.penalizacionArmadura.sinCompetencia).toBe(false);
    expect(statsFusionado.desventajaSigiloArmadura).toBe(false);

    // Al conservar solo el escudo, suma el escudo (+3) sobre la CA de forma (18 -> 21)
    const pjEscudoConservado: PersonajeJugador = {
      ...pjBase,
      formaSalvaje: { ...pjBase.formaSalvaje!, equipoConservadoIds: ["inst_escudo_bastión"] }
    };
    const statsEscudoConservado = calcularEstadisticasPersonaje(pjEscudoConservado, []);
    expect(statsEscudoConservado.claseArmadura.total).toBe(21);
    expect(statsEscudoConservado.penalizacionArmadura.escudoNoCompetente).toBe("Escudo Bastión");

    // Al conservar armadura de placas + escudo, aplica la armadura y evalúa su competencia
    const pjConservado: PersonajeJugador = {
      ...pjBase,
      formaSalvaje: { ...pjBase.formaSalvaje!, equipoConservadoIds: ["inst_armadura_de_placas", "inst_escudo_bastión"] }
    };
    const statsConservado = calcularEstadisticasPersonaje(pjConservado, []);
    expect(statsConservado.claseArmadura.total).toBe(21);
    expect(statsConservado.penalizacionArmadura.sinCompetencia).toBe(true);
    expect(statsConservado.penalizacionArmadura.armaduraNoCompetente).toBe("Armadura de Placas");
  });

  it("calcula Defensa sin armadura de Monje (anulada con escudo) vs armadura mágica + escudo custom", () => {
    const monje: PersonajeJugador = {
      ...structuredClone(PERSONAJE_POR_DEFECTO),
      id: "pj-monje",
      clase: "Monje",
      caracteristicas: { fuerza: 10, destreza: 18, constitucion: 14, inteligencia: 10, sabiduria: 16, carisma: 10 },
      inventario: []
    };
    expect(calcularEstadisticasPersonaje(monje, []).claseArmadura.total).toBe(17);

    const monjeConEscudo: PersonajeJugador = {
      ...monje,
      inventario: [crearItem({ idObjeto: "esc", nombre: "Escudo", categoria: "escudos", equipado: true })]
    };
    // Al equipar escudo pierde Defensa sin armadura de Monje: 10 + DES(4) + Escudo(2) = 16
    expect(calcularEstadisticasPersonaje(monjeConEscudo, []).claseArmadura.total).toBe(16);

    const armaduraMagica = EsquemaArmadura.parse({ id: "cuero_m", nombre: "Cuero Tachonado +2", caBase: 12, bonoDestreza: "Completo", esMagico: true });
    const escudoCustom = EsquemaEscudo.parse({ id: "esc_c", nombre: "Pavés de Mithril +1", caBase: 3, esMagico: true });
    const guerrero: PersonajeJugador = {
      ...structuredClone(PERSONAJE_POR_DEFECTO),
      id: "pj-guerrero",
      clase: "Guerrero",
      competenciasArmadurasGrupos: ["ligeras", "escudos"],
      caracteristicas: { fuerza: 16, destreza: 16, constitucion: 14, inteligencia: 10, sabiduria: 10, carisma: 10 },
      inventario: [
        crearItem({ idObjeto: armaduraMagica.id, nombre: armaduraMagica.nombre, categoria: "armaduras", equipado: true, esMagico: true }),
        crearItem({ idObjeto: escudoCustom.id, nombre: escudoCustom.nombre, categoria: "escudos", equipado: true, esMagico: true })
      ]
    };
    const statsGuerrero = calcularEstadisticasPersonaje(guerrero, [armaduraMagica, escudoCustom]);
    expect(statsGuerrero.claseArmadura.total).toBe(12 + 3 + 3 + 2);
    expect(statsGuerrero.claseArmadura.bonosMagicos).toBe(2);
    expect(statsGuerrero.penalizacionArmadura.sinCompetencia).toBe(false);
  });

  it("mantiene caché referencial WeakMap y la invalida al cambiar personaje, catálogo explícito o proveedor del store", () => {
    const pj: PersonajeJugador = {
      ...structuredClone(PERSONAJE_POR_DEFECTO),
      id: "pj-cache",
      inventario: [crearItem({ idObjeto: "arm_hb", nombre: "Coraza Rúnica", categoria: "armaduras", equipado: true })]
    };
    const catalogo1: ObjetoHomebrew[] = [EsquemaArmadura.parse({ id: "arm_hb", nombre: "Coraza Rúnica", caBase: 14, bonoDestreza: "Sin Bono" })];
    const catalogo2: ObjetoHomebrew[] = [EsquemaArmadura.parse({ id: "arm_hb", nombre: "Coraza Rúnica", caBase: 17, bonoDestreza: "Sin Bono" })];

    const res1 = calcularEstadisticasPersonaje(pj, catalogo1);
    const res2 = calcularEstadisticasPersonaje(pj, catalogo1);
    expect(res1).toBe(res2);
    expect(res1.claseArmadura.total).toBe(14);

    const resCambioCatalogo = calcularEstadisticasPersonaje(pj, catalogo2);
    expect(resCambioCatalogo).not.toBe(res1);
    expect(resCambioCatalogo.claseArmadura.total).toBe(17);

    const pjClon: PersonajeJugador = { ...pj, nivel: 17 };
    const resCambioPj = calcularEstadisticasPersonaje(pjClon, catalogo2);
    expect(resCambioPj).not.toBe(resCambioCatalogo);
    expect(resCambioPj.bonoCompetencia).toBe(6);

    // Proveedor de respaldo conectado al store (llamada de 1 argumento)
    usarAlmacenDM.setState({ objetosHomebrew: catalogo1 });
    expect(calcularEstadisticasPersonaje(pj).claseArmadura.total).toBe(14);
    usarAlmacenDM.setState({ objetosHomebrew: catalogo2 });
    expect(calcularEstadisticasPersonaje(pj).claseArmadura.total).toBe(17);
  });

  it("soporta de forma segura un personaje parcial sin lanzar errores", () => {
    const stats = calcularEstadisticasPersonaje({} as PersonajeJugador, []);
    expect(stats.bonoCompetencia).toBe(2);
    expect(stats.puntuacionesEfectivas.fuerza).toBe(10);
    expect(stats.claseArmadura.total).toBe(10);
    expect(stats.hpMaximoEfectivo).toBe(10);
  });
});
