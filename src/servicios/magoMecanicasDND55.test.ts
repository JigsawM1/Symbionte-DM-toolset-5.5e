import { describe, it, expect } from "vitest";
import { CATALOGO_CLASES_DND55 } from "@/servicios/hidratadorClases";
import { aplicarBuildClaseAPersonaje } from "@/servicios/gestorClases";
import {
  obtenerNombresConjurosGratuitosActivos,
  tieneConjuroGratuitoActivo,
  obtenerConjurosOtorgadosPorRasgos
} from "@/servicios/rasgos/evaluadorConjurosRasgos";
import { ejecutarDescansoCorto } from "@/servicios/procesadorDescansos";
import { calcularPresupuestoRecuperacion } from "@/servicios/rasgos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { PersonajeJugador } from "@/tipos";

function crearMagoBase(nivel: number = 1): PersonajeJugador {
  const magoDef = CATALOGO_CLASES_DND55.find((c) => c.id === "mago")!;
  const pjBase: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: `mago-test-${nivel}`,
    nombre: "Elminster",
    clase: "Mago",
    subclase: "Evocador",
    nivel,
    experiencia: 0,
    alineacion: "Neutral",
    especie: "Humano",
    tipoDadoGolpe: "d6",
    dadosGolpeTotal: nivel,
    dadosGolpeRestantes: nivel,
    hpMaximoBase: 6 + (nivel - 1) * 4,
    hpMaximo: 6 + (nivel - 1) * 4,
    hpActual: 6 + (nivel - 1) * 4,
    hpTemporal: 0,
    caracteristicas: {
      fuerza: 8,
      destreza: 14,
      constitucion: 14,
      inteligencia: 18,
      sabiduria: 12,
      carisma: 10
    },
    competenciasSalvacion: {
      ...PERSONAJE_POR_DEFECTO.competenciasSalvacion,
      inteligencia: true,
      sabiduria: true
    },
    competenciasArmas: "Armas Sencillas",
    competenciasArmaduras: "",
    herramientas: "",
    idiomas: "Común",
    iniciativaBono: 2,
    velocidad: "30 pies",
    ca: 12,
    espaciosConjuroMaximos: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 3, "6": 2, "7": 2, "8": 1, "9": 1 },
    espaciosConjuroGastados: {},
    esLanzador: true,
    clasesLanzadoras: [
      {
        clase: "mago",
        nivel,
        tipoLanzador: "completo",
        habilidadConjuro: "inteligencia",
        modeloConjuros: "grimorio"
      }
    ]
  };

  return aplicarBuildClaseAPersonaje(pjBase, magoDef.nombre, nivel, "Evocador");
}

describe("Mago D&D 5.5e (2024) - Catálogo, Builder y Mecánicas Canónicas", () => {
  const magoDef = CATALOGO_CLASES_DND55.find((c) => c.id === "mago");

  it("el catálogo maestro contiene la clase Mago con sus 4 subclases oficiales", () => {
    expect(magoDef).toBeDefined();
    expect(magoDef?.nombre).toBe("Mago");
    expect(magoDef?.subclases).toHaveLength(4);
    const nombresSubclases = magoDef?.subclases.map((s) => s.nombre);
    expect(nombresSubclases).toContain("Abjurador");
    expect(nombresSubclases).toContain("Adivino");
    expect(nombresSubclases).toContain("Evocador");
    expect(nombresSubclases).toContain("Ilusionista");
  });

  describe("Recuperación arcana (Nivel 1)", () => {
    it("posee configuración declarativa de consumible con recuperarEspacios", () => {
      const rasgo = magoDef?.rasgos.find((r) => r.nombre === "Recuperación arcana");
      expect(rasgo).toBeDefined();
      expect(rasgo?.categoriaMecanica).toBe("consumible");
      expect(rasgo?.tieneUsosLimitados).toBe(true);
      expect(rasgo?.usosMaximos).toBe(1);
      expect(rasgo?.recuperacion).toBe("descanso_largo");
      expect(rasgo?.recuperarEspacios).toBeDefined();
      expect(rasgo?.recuperarEspacios?.formulaPresupuesto).toBe("ceil(nivel / 2)");
      expect(rasgo?.recuperarEspacios?.nivelMaximoEspacio).toBe(5);
    });

    it("calcularPresupuestoRecuperacion escala correctamente según el nivel de mago", () => {
      const pjNv1 = crearMagoBase(1);
      const rasgo1 = (pjNv1.rasgos || []).find((r) => r.nombre === "Recuperación arcana");
      expect(rasgo1).toBeDefined();
      if (rasgo1) expect(calcularPresupuestoRecuperacion(rasgo1, pjNv1)).toBe(1);

      const pjNv2 = crearMagoBase(2);
      const rasgo2 = (pjNv2.rasgos || []).find((r) => r.nombre === "Recuperación arcana");
      expect(rasgo2).toBeDefined();
      if (rasgo2) expect(calcularPresupuestoRecuperacion(rasgo2, pjNv2)).toBe(1);

      const pjNv3 = crearMagoBase(3);
      const rasgo3 = (pjNv3.rasgos || []).find((r) => r.nombre === "Recuperación arcana");
      expect(rasgo3).toBeDefined();
      if (rasgo3) expect(calcularPresupuestoRecuperacion(rasgo3, pjNv3)).toBe(2);

      const pjNv4 = crearMagoBase(4);
      const rasgo4 = (pjNv4.rasgos || []).find((r) => r.nombre === "Recuperación arcana");
      expect(rasgo4).toBeDefined();
      if (rasgo4) expect(calcularPresupuestoRecuperacion(rasgo4, pjNv4)).toBe(2);

      const pjNv5 = crearMagoBase(5);
      const rasgo5 = (pjNv5.rasgos || []).find((r) => r.nombre === "Recuperación arcana");
      expect(rasgo5).toBeDefined();
      if (rasgo5) expect(calcularPresupuestoRecuperacion(rasgo5, pjNv5)).toBe(3);

      const pjNv9 = crearMagoBase(9);
      const rasgo9 = (pjNv9.rasgos || []).find((r) => r.nombre === "Recuperación arcana");
      expect(rasgo9).toBeDefined();
      if (rasgo9) expect(calcularPresupuestoRecuperacion(rasgo9, pjNv9)).toBe(5);

      const pjNv20 = crearMagoBase(20);
      const rasgo20 = (pjNv20.rasgos || []).find((r) => r.nombre === "Recuperación arcana");
      expect(rasgo20).toBeDefined();
      if (rasgo20) expect(calcularPresupuestoRecuperacion(rasgo20, pjNv20)).toBe(10);
    });

    it("el builder traslada recuperarEspacios al rasgo instanciado en el personaje", () => {
      const pj = crearMagoBase(5);
      const rasgoPj = (pj.rasgos || []).find((r) => r.nombre === "Recuperación arcana");
      expect(rasgoPj).toBeDefined();
      expect(rasgoPj?.recuperarEspacios).toBeDefined();
      expect(rasgoPj?.recuperarEspacios?.nivelMaximoEspacio).toBe(5);
      expect(rasgoPj?.recuperarEspacios?.permitePuntosConjuro).toBe(true);
      expect(rasgoPj?.usosMaximos).toBe(1);
    });
  });

  describe("Maestría en conjuros (Nivel 18)", () => {
    it("posee categoría selector_informativo con 2 selectores de conjuro gratuitos a voluntad", () => {
      const rasgo = magoDef?.rasgos.find((r) => r.nombre === "Maestría en conjuros");
      expect(rasgo).toBeDefined();
      expect(rasgo?.categoriaMecanica).toBe("selector_informativo");
      expect(rasgo?.selectores).toHaveLength(2);

      const selNv1 = rasgo?.selectores?.[0];
      expect(selNv1?.id).toBe("selector_maestria_conjuro_nv1");
      expect(selNv1?.tipo).toBe("unico");
      expect(selNv1?.tipoSelector).toBe("conjuro");
      expect(selNv1?.esConjuroGratuito).toBe(true);
      expect(selNv1?.maxSelecciones).toBe(1);
      expect(selNv1?.claveOpcionesDinamicas).toBe("conjuros1_accion_mago");
      expect(selNv1?.opciones.length).toBeGreaterThan(0);

      const selNv2 = rasgo?.selectores?.[1];
      expect(selNv2?.id).toBe("selector_maestria_conjuro_nv2");
      expect(selNv2?.tipo).toBe("unico");
      expect(selNv2?.tipoSelector).toBe("conjuro");
      expect(selNv2?.esConjuroGratuito).toBe(true);
      expect(selNv2?.maxSelecciones).toBe(1);
      expect(selNv2?.claveOpcionesDinamicas).toBe("conjuros2_accion_mago");
      expect(selNv2?.opciones.length).toBeGreaterThan(0);
    });

    it("todas las opciones dinámicas de Maestría en conjuros tienen tiempo de lanzamiento de 1 acción", () => {
      const rasgo = magoDef?.rasgos.find((r) => r.nombre === "Maestría en conjuros");
      const selNv1 = rasgo?.selectores?.[0];
      const selNv2 = rasgo?.selectores?.[1];

      // Verificamos que ninguna opción contenga acción adicional o tiempos prolongados
      for (const op of [...(selNv1?.opciones || []), ...(selNv2?.opciones || [])]) {
        expect(op.descripcion?.toLowerCase()).not.toContain("adicional");
        expect(op.descripcion?.toLowerCase()).not.toContain("reacción");
        expect(op.descripcion?.toLowerCase()).not.toContain("minuto");
      }
    });

    it("los conjuros seleccionados en Maestría en conjuros son detectados como gratuitos permanentes (a voluntad)", () => {
      const pj = crearMagoBase(18);
      const rasgoMaestria = pj.rasgos?.find((r) => r.nombre === "Maestría en conjuros");
      expect(rasgoMaestria).toBeDefined();

      if (rasgoMaestria?.selectores) {
        // Seleccionamos "Escudo" (o "Proyectil mágico") en Nv 1 e "Imagen múltiple" en Nv 2
        rasgoMaestria.selectores[0].valorActual = ["Proyectil mágico"];
        rasgoMaestria.selectores[1].valorActual = ["Imagen múltiple"];
      }

      const gratuitos = obtenerNombresConjurosGratuitosActivos(pj);
      expect(gratuitos).toContain("Proyectil mágico");
      expect(gratuitos).toContain("Imagen múltiple");

      expect(tieneConjuroGratuitoActivo(pj, "Proyectil mágico")).toBe(true);
      expect(tieneConjuroGratuitoActivo(pj, "Imagen múltiple")).toBe(true);
      expect(tieneConjuroGratuitoActivo(pj, "Bola de fuego")).toBe(false);

      // Verificamos que también se reportan como otorgados / preparados
      const otorgados = obtenerConjurosOtorgadosPorRasgos(pj);
      expect(otorgados).toContain("Proyectil mágico");
      expect(otorgados).toContain("Imagen múltiple");
    });
  });

  describe("Conjuros predilectos (Nivel 20)", () => {
    it("posee categoría consumible (2 usos / descanso corto) y selector de 2 conjuros", () => {
      const rasgo = magoDef?.rasgos.find((r) => r.nombre === "Conjuros predilectos");
      expect(rasgo).toBeDefined();
      expect(rasgo?.categoriaMecanica).toBe("consumible");
      expect(rasgo?.tieneUsosLimitados).toBe(true);
      expect(rasgo?.usosMaximos).toBe(2);
      expect(rasgo?.recuperacion).toBe("descanso_corto");

      const selector = rasgo?.selectores?.[0];
      expect(selector).toBeDefined();
      expect(selector?.id).toBe("selector_conjuros_predilectos_mago");
      expect(selector?.tipo).toBe("multiple");
      expect(selector?.tipoSelector).toBe("conjuro");
      expect(selector?.esConjuroGratuito).toBe(true);
      expect(selector?.maxSelecciones).toBe(2);
      expect(selector?.claveOpcionesDinamicas).toBe("conjuros3_mago");
      expect(selector?.opciones.length).toBeGreaterThan(0);
    });

    it("los conjuros predilectos son gratuitos mientras queden usos y pierden gratuidad al agotarse", () => {
      const pj = crearMagoBase(20);
      const rasgoPredilectos = pj.rasgos?.find((r) => r.nombre === "Conjuros predilectos");
      expect(rasgoPredilectos).toBeDefined();

      if (rasgoPredilectos?.selectores) {
        rasgoPredilectos.selectores[0].valorActual = ["Bola de fuego", "Contrahechizo"];
      }

      // Con 2 usos disponibles: ambos son gratuitos
      rasgoPredilectos!.usosRestantes = 2;
      expect(tieneConjuroGratuitoActivo(pj, "Bola de fuego")).toBe(true);
      expect(tieneConjuroGratuitoActivo(pj, "Contrahechizo")).toBe(true);

      // Con 1 uso restante: siguen siendo gratuitos
      rasgoPredilectos!.usosRestantes = 1;
      expect(tieneConjuroGratuitoActivo(pj, "Bola de fuego")).toBe(true);
      expect(tieneConjuroGratuitoActivo(pj, "Contrahechizo")).toBe(true);

      // Con 0 usos restantes: ya no son gratuitos
      rasgoPredilectos!.usosRestantes = 0;
      expect(tieneConjuroGratuitoActivo(pj, "Bola de fuego")).toBe(false);
      expect(tieneConjuroGratuitoActivo(pj, "Contrahechizo")).toBe(false);
    });

    it("un descanso corto restaura automáticamente los 2 usos de Conjuros predilectos", () => {
      const pj = crearMagoBase(20);
      const rasgoPredilectos = pj.rasgos?.find((r) => r.nombre === "Conjuros predilectos");
      expect(rasgoPredilectos).toBeDefined();
      rasgoPredilectos!.usosRestantes = 0;

      const resultado = ejecutarDescansoCorto(pj, 0);
      const rasgoActualizado = resultado.personajeActualizado.rasgos?.find(
        (r) => r.nombre === "Conjuros predilectos"
      );
      expect(rasgoActualizado?.usosRestantes).toBe(2);
    });
  });
});
