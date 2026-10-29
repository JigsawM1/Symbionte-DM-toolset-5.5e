import { describe, it, expect } from "vitest";
import { construirBuildClase, aplicarBuildClaseAPersonaje } from "./clases/buildClase";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { evaluarEfectosRasgosActivos } from "./rasgos/evaluadorExpresionesRasgos";
import { calcularDefensaSinArmaduraRasgos, evaluarVentajasDeRasgosEnTirada } from "./evaluadorEfectosRasgos";
import { obtenerResumenDefensasRasgos } from "./rasgos/resumenDefensasRasgos";
import { calcularVelocidadPersonaje } from "./rasgos/evaluadorMovilidadRasgos";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import type { EfectoMecanicoRasgo } from "@/tipos/rasgos";
import catalogo from "@/datos/clases/barbaro.json";

interface RasgoCatalogoRaw {
  nombre: string;
  efectos?: EfectoMecanicoRasgo[];
}

interface SubclaseCatalogoRaw {
  nombre: string;
  rasgos?: RasgoCatalogoRaw[];
}

interface CatalogoBarbaroRaw {
  rasgos: RasgoCatalogoRaw[];
  subclases?: SubclaseCatalogoRaw[];
}

interface EfectoEsperado {
  origen: "clase" | "subclase";
  subclase?: string;
  rasgo: string;
  tipo: string;
  objetivo: string;
}

const catalogoTipado = catalogo as unknown as CatalogoBarbaroRaw;
const efectosCatalogo: EfectoEsperado[] = [];

for (const r of catalogoTipado.rasgos) {
  if (r.efectos && r.efectos.length > 0) {
    for (const ef of r.efectos) {
      efectosCatalogo.push({
        origen: "clase",
        rasgo: r.nombre,
        tipo: ef.tipo,
        objetivo: ef.objetivo
      });
    }
  }
}

for (const sub of (catalogoTipado.subclases || [])) {
  for (const r of (sub.rasgos || [])) {
    if (r.efectos && r.efectos.length > 0) {
      for (const ef of r.efectos) {
        efectosCatalogo.push({
          origen: "subclase",
          subclase: sub.nombre,
          rasgo: r.nombre,
          tipo: ef.tipo,
          objetivo: ef.objetivo
        });
      }
    }
  }
}

describe("Verificación exhaustiva del Bárbaro y consumo de efectos en el Builder", () => {
  it("contabiliza exactamente 24 efectos declarados y consolidados en barbaro.json", () => {
    expect(efectosCatalogo).toHaveLength(24);
  });

  const subclases = [
    "Senda del Berserker",
    "Senda del Corazón Salvaje",
    "Senda del Árbol del Mundo",
    "Senda del Fanático"
  ];

  it.each(subclases)("construye y consume todos los efectos para %s", (subNombre) => {
    const build = construirBuildClase("Bárbaro", 20, subNombre);
    expect(build).not.toBeNull();
    if (!build) return;

    expect(build.nivel).toBe(20);
    expect(build.clase.nombre).toBe("Bárbaro");
    expect(build.subclase?.nombre).toBe(subNombre);

    // Todos los efectos de la clase base y de esta subclase
    const esperados = efectosCatalogo.filter((e) => e.origen === "clase" || e.subclase === subNombre);

    // Todos los efectos en los rasgos generados por el builder
    const todosEfectos = build.rasgos.flatMap((r) => r.efectos || []);

    for (const exp of esperados) {
      const existe = todosEfectos.some((ef) => ef.tipo === exp.tipo && ef.objetivo === exp.objetivo);
      expect(existe, `El efecto [${exp.tipo}] obj="${exp.objetivo}" del rasgo "${exp.rasgo}" debe estar presente en build.rasgos`).toBe(true);
    }

    // Efectos activos resueltos
    expect(build.efectosActivosResueltos).toBeDefined();
    expect(build.efectosActivosResueltos!.length).toBeGreaterThan(0);

    // Aplicar a un personaje completo
    const pj = aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", 20, subNombre);
    expect(pj.clase).toBe("Bárbaro");
    expect(pj.nivel).toBe(20);
    expect(pj.subclase).toBe(subNombre);

    const efectosPj = pj.rasgos.flatMap((r) => r.efectos || []);
    for (const exp of esperados) {
      const existeEnPj = efectosPj.some((ef) => ef.tipo === exp.tipo && ef.objetivo === exp.objetivo);
      expect(existeEnPj, `El efecto [${exp.tipo}] obj="${exp.objetivo}" debe estar en pj.rasgos`).toBe(true);
    }
  });

  it("verifica el consumo de los 15 tipos de efectos en los evaluadores del motor", () => {
    // 1. Bono daño fuerza y resistencias con Furia
    const pjBase = aplicarBuildClaseAPersonaje(
      {
        ...PERSONAJE_POR_DEFECTO,
        caracteristicas: { fuerza: 20, destreza: 14, constitucion: 16, inteligencia: 10, sabiduria: 12, carisma: 10 }
      },
      "Bárbaro",
      20,
      "Senda del Berserker"
    );

    const pjFuria = {
      ...pjBase,
      rasgos: pjBase.rasgos.map((r) => (r.nombre === "Furia" ? { ...r, activo: true } : r))
    };

    const efectosActivos = evaluarEfectosRasgosActivos(pjFuria);

    // bono_dano_fuerza
    const bonoFuria = efectosActivos.find((e) => e.tipo === "bono_dano_fuerza");
    expect(bonoFuria).toBeDefined();
    expect(bonoFuria?.valor).toBe(4); // a nivel 20 escala a 4

    // resistencia_dano
    const resumenDef = obtenerResumenDefensasRasgos(pjFuria);
    expect(resumenDef.resistencias).toEqual(expect.arrayContaining(["Contundente", "Cortante", "Perforante"]));

    // restriccion
    expect(efectosActivos.some((e) => e.tipo === "restriccion" && e.objetivo === "conjuros")).toBe(true);
    expect(efectosActivos.some((e) => e.tipo === "restriccion" && e.objetivo === "concentracion")).toBe(true);

    // modificador_ca (Defensa sin armadura)
    const ca = calcularDefensaSinArmaduraRasgos(pjBase, {
      fuerza: 5,
      destreza: 2,
      constitucion: 5,
      inteligencia: 0,
      sabiduria: 1,
      carisma: 0
    });
    expect(ca?.aplica).toBe(true);
    expect(ca?.caracteristicaExtra).toBe("constitucion");

    // modificador_velocidad (Movimiento rápido +10 ft)
    const vel = calcularVelocidadPersonaje(pjBase);
    expect(vel.caminar).toBe(40); // 30 base + 10

    // modificador_stat (Campeón primigenio +4 FUE, +4 CON con tope de 25)
    const stats = calcularEstadisticasPersonaje(pjBase);
    expect(stats.puntuacionesEfectivas.fuerza).toBe(24); // 20 + 4
    expect(stats.puntuacionesEfectivas.constitucion).toBe(20); // 16 + 4

    // ventaja en iniciativa (Instinto salvaje)
    const ventInic = evaluarVentajasDeRasgosEnTirada(pjBase, { tipoTirada: "iniciativa" });
    expect(ventInic.tieneVentaja).toBe(true);

    // ventaja en salvación destreza (Sentido del peligro)
    const ventSalvDes = evaluarVentajasDeRasgosEnTirada(pjBase, { tipoTirada: "salvacion", subtipo: "destreza" });
    expect(ventSalvDes.tieneVentaja).toBe(true);

    // ventaja en prueba y salvación de fuerza bajo furia
    const ventFuerza = evaluarVentajasDeRasgosEnTirada(pjFuria, { tipoTirada: "salvacion", subtipo: "fuerza" });
    expect(ventFuerza.tieneVentaja).toBe(true);

    // habilidad_con_fuerza (Conocimiento primigenio)
    const efHabFuerza = efectosActivos.find((e) => e.tipo === "habilidad_con_fuerza");
    expect(efHabFuerza).toBeDefined();

    // inmunidad_condicion (Furia ciega de Berserker integrada en Furia)
    const furia = pjFuria.rasgos.find((r) => r.nombre === "Furia");
    expect(furia?.efectos?.some((e) => e.tipo === "inmunidad_condicion" && e.objetivo === "Hechizado")).toBe(true);
    expect(furia?.efectos?.some((e) => e.tipo === "inmunidad_condicion" && e.objetivo === "Asustado")).toBe(true);

    // Subclase Fanático nivel 14
    const pjFanatico = aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", 14, "Senda del Fanático");
    const furiaDioses = pjFanatico.rasgos.find((r) => r.nombre === "Furia de los dioses");
    expect(furiaDioses).toBeDefined();
    expect(furiaDioses?.efectos?.some((e) => e.tipo === "movimiento_especial")).toBe(true);
    expect(furiaDioses?.efectos?.some((e) => e.tipo === "resistencia_dano" && e.objetivo.includes("Necrótico"))).toBe(true);

    // Subclase Árbol del Mundo nivel 3
    const pjArbol = aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", 3, "Senda del Árbol del Mundo");
    const vitalidad = pjArbol.rasgos.find((r) => r.nombre === "Vitalidad del Árbol");
    expect(vitalidad?.efectos?.some((e) => e.tipo === "hp_temporal")).toBe(true);
  });
});
