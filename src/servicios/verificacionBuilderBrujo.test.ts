import { describe, it, expect } from "vitest";
import { construirBuildClase, aplicarBuildClaseAPersonaje } from "./clases/buildClase";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import {
  evaluarEfectosRasgosActivos,
  resolverFormulaDinamica,
  evaluarExpresionNumericaSegura
} from "./rasgos/evaluadorExpresionesRasgos";
import { obtenerResumenDefensasRasgos } from "./rasgos/resumenDefensasRasgos";
import { calcularVelocidadPersonaje } from "./rasgos/evaluadorMovilidadRasgos";
import {
  evaluarVentajasDeRasgosEnTirada,
  tieneConjuroGratuitoActivo
} from "./evaluadorEfectosRasgos";
import {
  aplicarModificadoresInvocacionesAHechizo,
  obtenerConfiguracionPactoDelFilo
} from "./rasgos/evaluadorCombateRasgos";
import { construirRasgosDesdeSelectores } from "./rasgos/seleccionesRasgos";
import { EsquemaHechizoBase, type PersonajeJugador, type EfectoMecanicoRasgo } from "@/tipos";
import catalogo from "@/datos/clases/brujo.json";
import HECHIZOS from "@/utiles/compendios/all.json";

interface RasgoCatalogoRaw {
  nombre: string;
  efectos?: EfectoMecanicoRasgo[];
}

interface SubclaseCatalogoRaw {
  nombre: string;
  rasgos?: RasgoCatalogoRaw[];
}

interface CatalogoBrujoRaw {
  nombre: string;
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

const catalogoTipado = catalogo as unknown as CatalogoBrujoRaw;
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

describe("Verificación exhaustiva del Brujo y consumo de efectos en el Builder", () => {
  it("contabiliza exactamente 5 efectos directos declarados en brujo.json", () => {
    // 1 en Archihadas (Defensas fascinantes: inmunidad_condicion hechizado)
    // 2 en Celestial (Alma radiante: resistencia radiante; Resiliencia celestial: hp_temporal)
    // 1 en Infernal (Bendición del Oscuro: hp_temporal)
    // 1 en Gran Primigenio (Escudo de pensamientos: resistencia psíquica)
    expect(efectosCatalogo).toHaveLength(5);
  });

  const subclases = [
    "Patrón de los Archihadas",
    "Patrón Celestial",
    "Patrón Infernal",
    "Patrón del Gran Primigenio"
  ];

  it.each(subclases)("construye y consume todos los rasgos y efectos para %s a nivel 20", (subNombre) => {
    const build = construirBuildClase("Brujo", 20, subNombre);
    expect(build).not.toBeNull();
    if (!build) return;

    expect(build.nivel).toBe(20);
    expect(build.clase.nombre).toBe("Brujo");
    expect(build.subclase?.nombre).toBe(subNombre);
    expect(build.dadoGolpe).toBe("d8");
    expect(build.configuracionMagica?.tipoLanzador).toBe("pacto");

    // Todos los efectos de la clase base y de esta subclase
    const esperados = efectosCatalogo.filter((e) => e.origen === "clase" || e.subclase === subNombre);

    // Todos los efectos en los rasgos generados por el builder
    const todosEfectos = build.rasgos.flatMap((r) => r.efectos || []);

    for (const exp of esperados) {
      const existe = todosEfectos.some((ef) => ef.tipo === exp.tipo && ef.objetivo === exp.objetivo);
      expect(
        existe,
        `El efecto [${exp.tipo}] obj="${exp.objetivo}" del rasgo "${exp.rasgo}" debe estar presente en build.rasgos`
      ).toBe(true);
    }

    // Efectos activos resueltos
    expect(build.efectosActivosResueltos).toBeDefined();
    if (esperados.length > 0) {
      expect(build.efectosActivosResueltos!.length).toBeGreaterThan(0);
    }

    // Aplicar a un personaje completo
    const pj = aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Brujo", 20, subNombre);
    expect(pj.clase).toBe("Brujo");
    expect(pj.nivel).toBe(20);
    expect(pj.subclase).toBe(subNombre);
    expect(pj.espaciosPactoMaximos).toBe(4);
    expect(pj.nivelEspacioPacto).toBe(5);

    const efectosPj = pj.rasgos.flatMap((r) => r.efectos || []);
    for (const exp of esperados) {
      const existeEnPj = efectosPj.some((ef) => ef.tipo === exp.tipo && ef.objetivo === exp.objetivo);
      expect(existeEnPj, `El efecto [${exp.tipo}] obj="${exp.objetivo}" debe estar en pj.rasgos`).toBe(true);
    }
  });

  describe("Consumo de efectos mecánicos por los evaluadores del motor", () => {
    it("consume inmunidad_condicion (Defensas fascinantes en Archihadas)", () => {
      const pjArchihada = aplicarBuildClaseAPersonaje(
        PERSONAJE_POR_DEFECTO,
        "Brujo",
        20,
        "Patrón de los Archihadas"
      );
      const efectosActivos = evaluarEfectosRasgosActivos(pjArchihada);
      const efHechizado = efectosActivos.find(
        (e) => e.tipo === "inmunidad_condicion" && e.objetivo.toLowerCase() === "hechizado"
      );
      expect(efHechizado).toBeDefined();

      const defensas = obtenerResumenDefensasRasgos(pjArchihada);
      expect(defensas.inmunidadesCondiciones.map((c) => c.toLowerCase())).toContain("hechizado");
    });

    it("consume resistencia_dano estática (Alma radiante y Escudo de pensamientos)", () => {
      const pjCelestial = aplicarBuildClaseAPersonaje(
        PERSONAJE_POR_DEFECTO,
        "Brujo",
        20,
        "Patrón Celestial"
      );
      const defensasCelestial = obtenerResumenDefensasRasgos(pjCelestial);
      expect(defensasCelestial.resistencias).toContain("Radiante");

      const pjPrimigenio = aplicarBuildClaseAPersonaje(
        PERSONAJE_POR_DEFECTO,
        "Brujo",
        20,
        "Patrón del Gran Primigenio"
      );
      const defensasPrimigenio = obtenerResumenDefensasRasgos(pjPrimigenio);
      expect(defensasPrimigenio.resistencias).toContain("Psíquico");
    });

    it("consume resistencia_dano dinámica (Resiliencia infernal en Infernal)", () => {
      const pjInfernal = aplicarBuildClaseAPersonaje(
        PERSONAJE_POR_DEFECTO,
        "Brujo",
        20,
        "Patrón Infernal"
      );
      const rasgoRes = pjInfernal.rasgos.find((r) => r.nombre === "Resiliencia infernal");
      expect(rasgoRes).toBeDefined();
      expect(rasgoRes?.selectores).toBeDefined();

      // Al seleccionar Fuego en el selector
      const selector = rasgoRes!.selectores![0];
      const pjConFuego: PersonajeJugador = {
        ...pjInfernal,
        rasgos: pjInfernal.rasgos.map((r) =>
          r.id === rasgoRes!.id
            ? {
                ...r,
                selectores: r.selectores?.map((s) =>
                  s.id === selector.id ? { ...s, valorActual: ["fuego"] } : s
                )
              }
            : r
        )
      };

      const defensas = obtenerResumenDefensasRasgos(pjConFuego);
      expect(defensas.resistencias).toContain("Fuego");
    });

    it("consume fórmulas dinámicas de hp_temporal (Bendición del Oscuro y Resiliencia celestial)", () => {
      const pjInfernal: PersonajeJugador = {
        ...aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Brujo", 10, "Patrón Infernal"),
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, carisma: 18 }
      };
      // Bendición del Oscuro: max(1, carisma + nivel_brujo) = max(1, 4 + 10) = 14
      const efOscuro = pjInfernal.rasgos
        .find((r) => r.nombre === "Bendición del Oscuro")
        ?.efectos?.find((e) => e.tipo === "hp_temporal");
      expect(efOscuro).toBeDefined();
      const valOscuro = evaluarExpresionNumericaSegura(resolverFormulaDinamica(String(efOscuro?.valor), pjInfernal));
      expect(valOscuro).toBe(14);

      const pjCelestial: PersonajeJugador = {
        ...aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Brujo", 10, "Patrón Celestial"),
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, carisma: 18 }
      };
      // Resiliencia celestial: nivel_brujo + carisma = 10 + 4 = 14
      const efCelestial = pjCelestial.rasgos
        .find((r) => r.nombre === "Resiliencia celestial")
        ?.efectos?.find((e) => e.tipo === "hp_temporal");
      expect(efCelestial).toBeDefined();
      const valCelestial = evaluarExpresionNumericaSegura(resolverFormulaDinamica(String(efCelestial?.valor), pjCelestial));
      expect(valCelestial).toBe(14);
    });

    it("consume la extensión de nivel 20 (Maestro sobrenatural fusionado en Astucia mágica)", () => {
      const buildNv20 = construirBuildClase("Brujo", 20);
      expect(buildNv20).not.toBeNull();
      const astucia = buildNv20?.rasgos.find((r) => r.nombre === "Astucia mágica");
      expect(astucia).toBeDefined();
      expect(astucia?.recuperarPactoAlUsar).toBe("maximo");
      expect(astucia?.descripcion).toContain("Maestro sobrenatural (Nv. 20)");

      // No debe existir tarjeta separada
      expect(buildNv20?.rasgos.find((r) => r.nombre === "Maestro sobrenatural")).toBeUndefined();
    });

    it("consume conjuros gratuitos declarados (Contactar con el patrón y Pasos feéricos)", () => {
      const pj = aplicarBuildClaseAPersonaje(
        PERSONAJE_POR_DEFECTO,
        "Brujo",
        9,
        "Patrón de los Archihadas"
      );
      const contactar = pj.rasgos.find((r) => r.nombre === "Contactar con el patrón");
      expect(contactar?.conjuroGratuito).toBe("contactar con otro plano");
      expect(contactar?.conjurosOtorgados).toContain("contactar con otro plano");

      const pasos = pj.rasgos.find((r) => r.nombre === "Pasos feéricos");
      expect(pasos?.conjuroGratuito).toBe("Paso brumoso");
    });

    it("consume y propaga los efectos declarativos de Invocaciones Sobrenaturales", () => {
      // Tomamos un brujo base y le asignamos selecciones de invocaciones
      const pjBase = aplicarBuildClaseAPersonaje(
        {
          ...PERSONAJE_POR_DEFECTO,
          caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, carisma: 18 },
          trucosConocidosIds: ["h_descarga-sobrenatural"]
        },
        "Brujo",
        9
      );

      const rasgoPadre = pjBase.rasgos.find((r) => r.nombre === "Invocaciones sobrenaturales")!;
      expect(rasgoPadre).toBeDefined();

      // Simulamos la elección de:
      // 1. Descarga agónica vinculada al truco Descarga sobrenatural (bono_dano_conjuro)
      // 2. Lanza sobrenatural vinculada a Descarga sobrenatural (modificador_alcance_conjuro)
      // 3. Mente sobrenatural (ventaja en salvaciones de Constitución para concentración)
      // 4. Don de las profundidades (movimiento_especial nado + conjuro_gratuito)
      // 5. Armadura de sombras (conjuro_gratuito)
      const elecciones = [
        "descarga_agonica:h_descarga-sobrenatural",
        "lanza_sobrenatural:h_descarga-sobrenatural",
        "mente_sobrenatural",
        "don_de_las_profundidades",
        "armadura_de_sombras"
      ];

      const pjConInvocaciones: PersonajeJugador = {
        ...pjBase,
        rasgos: pjBase.rasgos.map((r) =>
          r.id === rasgoPadre.id
            ? {
                ...r,
                selectores: r.selectores?.map((s) => ({ ...s, valorActual: elecciones }))
              }
            : r
        )
      };

      // Materializar rasgos de selectores (builder pipeline)
      const rasgosMaterializados = construirRasgosDesdeSelectores(pjConInvocaciones);
      const pjCompleto: PersonajeJugador = {
        ...pjConInvocaciones,
        concentracionActiva: { hechizoId: "h_descarga-sobrenatural", nombreHechizo: "Concentración" },
        rasgos: [...pjConInvocaciones.rasgos, ...rasgosMaterializados]
      };

      // 1. Bono daño conjuro y modificador alcance en hechizo
      const descarga = EsquemaHechizoBase.parse(
        HECHIZOS.find((h) => h.id === "h_descarga-sobrenatural")
      );
      const descargaModificada = aplicarModificadoresInvocacionesAHechizo(descarga, pjCompleto);
      expect(descargaModificada.agregarModificadorHabilidad).toBe(true);
      // Alcance base 120 pies + (30 * 9 = 270) = 390 pies
      expect(descargaModificada.alcance).toBe("390 pies");

      // 2. Ventaja en concentración (Mente sobrenatural)
      const ventConcentracion = evaluarVentajasDeRasgosEnTirada(pjCompleto, {
        tipoTirada: "salvacion",
        subtipo: "constitucion"
      });
      expect(ventConcentracion.tieneVentaja).toBe(true);

      // 3. Movimiento especial (Don de las profundidades)
      const velocidad = calcularVelocidadPersonaje(pjCompleto);
      expect(velocidad.nadar).toBe(30);

      // 4. Conjuros gratuitos
      expect(tieneConjuroGratuitoActivo(pjCompleto, "Armadura de mago")).toBe(true);
      expect(tieneConjuroGratuitoActivo(pjCompleto, "Respirar bajo el agua")).toBe(true);
    });

    it("consume y propaga la configuración de Pacto del filo", () => {
      const pjBase = aplicarBuildClaseAPersonaje(
        {
          ...PERSONAJE_POR_DEFECTO,
          caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, carisma: 18 }
        },
        "Brujo",
        5
      );

      const invPadre = pjBase.rasgos.find((r) => r.nombre === "Invocaciones sobrenaturales")!;
      const pjConFilo: PersonajeJugador = {
        ...pjBase,
        rasgos: pjBase.rasgos.map((r) =>
          r.id === invPadre.id
            ? {
                ...r,
                selectores: r.selectores?.map((s) => ({ ...s, valorActual: ["pacto_del_filo"] }))
              }
            : r
        )
      };

      const rasgosMaterializados = construirRasgosDesdeSelectores(pjConFilo);
      const rasgoFilo = rasgosMaterializados.find((r) => r.nombre === "Pacto del filo")!;
      expect(rasgoFilo).toBeDefined();

      // Vincular un arma con daño radiante
      const rasgoFiloConfigurado = {
        ...rasgoFilo,
        vinculoArma: {
          ...rasgoFilo.vinculoArma!,
          idInstancia: "espada-pacto-1",
          caracteristica: "carisma" as const
        },
        selectores: rasgoFilo.selectores?.map((s) => ({ ...s, valorActual: ["radiante"] }))
      };

      const pjConArma: PersonajeJugador = {
        ...pjConFilo,
        rasgos: [...pjConFilo.rasgos, rasgoFiloConfigurado]
      };

      const cfgFilo = obtenerConfiguracionPactoDelFilo(pjConArma, "espada-pacto-1");
      expect(cfgFilo.activo).toBe(true);
      expect(cfgFilo.caracteristica).toBe("carisma");
      expect(cfgFilo.tipoDano).toBe("radiante");
    });
  });
});
