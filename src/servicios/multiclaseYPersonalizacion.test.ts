import { describe, it, expect } from "vitest";
import {
  obtenerExperienciaMinimaPorNivel,
  obtenerExperienciaMaximaPorNivel,
  obtenerRangoExperienciaPorNivel,
  obtenerNivelPorExperiencia,
  CLASES_DND,
  PERSONAJE_POR_DEFECTO
} from "@/constantes";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import {
  detectarTipoLanzador,
  calcularTodosRecursosMagicos,
  obtenerOpcionesLanzamientoConjuro,
  gastarRecursoLanzamientoConjuro
} from "@/servicios/calculadorMagia";
import type { PersonajeJugador, ClasePersonaje } from "@/tipos";

describe("Multiclase, Experiencia y Personalización de Características", () => {
  it("contiene las 13 clases oficiales en CLASES_DND", () => {
    expect(CLASES_DND).toContain("Bárbaro");
    expect(CLASES_DND).toContain("Guerrero");
    expect(CLASES_DND).toContain("Monje");
    expect(CLASES_DND).toContain("Pícaro");
    expect(CLASES_DND).toContain("Mago");
    expect(CLASES_DND).toContain("Clérigo");
    expect(CLASES_DND).toContain("Artífice");
    expect(CLASES_DND.length).toBe(13);
  });

  it("calcula correctamente los rangos de experiencia bidireccionales por nivel", () => {
    expect(obtenerExperienciaMinimaPorNivel(1)).toBe(0);
    expect(obtenerExperienciaMaximaPorNivel(1)).toBe(299);
    expect(obtenerNivelPorExperiencia(0)).toBe(1);
    expect(obtenerNivelPorExperiencia(299)).toBe(1);
    expect(obtenerNivelPorExperiencia(300)).toBe(2);
    expect(obtenerNivelPorExperiencia(899)).toBe(2);
    expect(obtenerNivelPorExperiencia(900)).toBe(3);
    expect(obtenerNivelPorExperiencia(355000)).toBe(20);
    expect(obtenerExperienciaMaximaPorNivel(20)).toBe(Infinity);

    const rangoNv5 = obtenerRangoExperienciaPorNivel(5);
    expect(rangoNv5.min).toBe(6500);
    expect(rangoNv5.max).toBe(13999);
    expect(rangoNv5.texto).toContain("6.500 - 13.999 PX");
  });

  it("calcula estadísticas efectivas incluyendo personalizaciones de características", () => {
    const pj: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      nivel: 5,
      caracteristicas: {
        fuerza: 14,
        destreza: 12,
        constitucion: 16,
        inteligencia: 10,
        sabiduria: 8,
        carisma: 18
      },
      competenciasSalvacion: {
        fuerza: false,
        destreza: false,
        constitucion: true,
        inteligencia: false,
        sabiduria: false,
        carisma: true
      },
      personalizacionesCaracteristicas: {
        fuerza: {
          valorFijo: 19, // Guanteletes de fuerza de ogro
          modificadorExtra: 1, // Bono extra especial
          bonoSalvacionExtra: 2, // Salvación extra
          notas: "Objeto mágico sintonizado"
        }
      }
    };

    const stats = calcularEstadisticasPersonaje(pj);

    // Fuerza base 14 sobreescrita por valorFijo 19
    expect(stats.puntuacionesEfectivas.fuerza).toBe(19);
    // Modificador base de 19 es +4, con modExtra 1 da +5
    expect(stats.modificadores.fuerza).toBe(5);
    // Salvación de fuerza: mod(+5) + no competente(+0) + bonoSalvacionExtra(+2) = 7
    expect(stats.salvaciones.fuerza).toBe(7);

    // Carisma base 18 -> mod +4. PB nivel 5 es +3. Competente -> salvación +7
    expect(stats.modificadores.carisma).toBe(4);
    expect(stats.salvaciones.carisma).toBe(7);
  });

  it("calcula recursos mágicos de multiclase correctamente", () => {
    const clases: ClasePersonaje[] = [
      { nombre: "Mago", subclase: "Evocación", nivel: 3 },
      { nombre: "Clérigo", subclase: "Vida", nivel: 2 }
    ];

    const clasesLanzadoras = clases
      .map((c) => {
        const info = detectarTipoLanzador(c.nombre, c.subclase);
        if (!info) return null;
        return {
          clase: c.nombre,
          nivel: c.nivel,
          tipoLanzador: info.tipo,
          habilidadConjuro: info.habilidad,
          modeloConjuros: info.modelo
        };
      })
      .filter(Boolean) as import("@/tipos").ClaseLanzadora[];

    // Mago 3 + Clérigo 2 = Nivel de lanzador combinado 5
    const recursos = calcularTodosRecursosMagicos(clasesLanzadoras);
    expect(recursos.espaciosConjuroMaximos["1"]).toBe(4);
    expect(recursos.espaciosConjuroMaximos["2"]).toBe(3);
    expect(recursos.espaciosConjuroMaximos["3"]).toBe(2);
    expect(recursos.nivelConjuroMaximo).toBe(3);
  });

  describe("Validaciones de Upcasting y Magia de Brujo (D&D 5.5e)", () => {
    it("1. Limita el Upcasting a los niveles reales que el personaje puede lanzar", () => {
      // Mago nivel 3: tiene ranuras de Nivel 1 (4) y Nivel 2 (2). NO tiene ranuras de 3 a 9.
      const optsNv1 = obtenerOpcionesLanzamientoConjuro({
        nivelHechizo: 1,
        espaciosConjuroMaximos: { "1": 4, "2": 2 },
        sistemaMagia: "espacios"
      });

      // Solo debe poder elegir Nivel 1 y Nivel 2 (NO 3..9)
      expect(optsNv1.map((o) => o.nivel)).toEqual([1, 2]);
      expect(optsNv1[0].etiqueta).toBe("Nv. 1");
      expect(optsNv1[1].etiqueta).toBe("Nv. 2 ↑");

      // Hechizo de nivel 2: solo opción nivel 2
      const optsNv2 = obtenerOpcionesLanzamientoConjuro({
        nivelHechizo: 2,
        espaciosConjuroMaximos: { "1": 4, "2": 2 },
        sistemaMagia: "espacios"
      });
      expect(optsNv2.map((o) => o.nivel)).toEqual([2]);
      expect(optsNv2[0].etiqueta).toBe("Nv. 2");
    });

    it("2. Brujo puro NO puede seleccionar upcasting libre: siempre lanza con su espacio fijo de pacto", () => {
      // Brujo nivel 5: solo tiene 2 ranuras de pacto de Nivel 3
      const optsBrujo = obtenerOpcionesLanzamientoConjuro({
        nivelHechizo: 1,
        esLanzadorPacto: true,
        nivelEspacioPacto: 3,
        espaciosPactoMaximos: 2,
        espaciosConjuroMaximos: {},
        sistemaMagia: "espacios"
      });

      // Debe retornar exactamente 1 opción fija de nivel 3 de pacto
      expect(optsBrujo.length).toBe(1);
      expect(optsBrujo[0].nivel).toBe(3);
      expect(optsBrujo[0].tipo).toBe("pacto");
      expect(optsBrujo[0].etiqueta).toBe("Pacto Nv. 3");
    });

    it("3. Multiclase de Brujo con otra lanzadora: opciones combinadas y delegación de recursos", () => {
      // Multiclase Mago 3 (espacios nv 1 y 2) / Brujo 5 (pacto nv 3)
      const opcionesMulticlase = obtenerOpcionesLanzamientoConjuro({
        nivelHechizo: 1,
        espaciosConjuroMaximos: { "1": 4, "2": 2 },
        esLanzadorPacto: true,
        nivelEspacioPacto: 3,
        espaciosPactoMaximos: 2,
        sistemaMagia: "espacios"
      });

      // Debe ofrecer niveles 1, 2 y 3 (Pacto)
      expect(opcionesMulticlase.map((o) => o.nivel)).toEqual([1, 2, 3]);
      expect(opcionesMulticlase[2].etiqueta).toContain("Pacto");

      // Lanzamiento a nivel 1: DELEGA a la otra clase lanzadora (espacio estándar)
      let gastoEspacioNivel = 0;
      let gastoPactoEjecutado = false;

      const resultadoNivel1 = gastarRecursoLanzamientoConjuro({
        nivelLanzamiento: 1,
        esLanzadorPacto: true,
        nivelEspacioPacto: 3,
        espaciosPactoMaximos: 2,
        espaciosPactoGastados: 0,
        espaciosConjuroMaximos: { "1": 4, "2": 2 },
        sistemaMagia: "espacios",
        alGastarEspacio: (niv) => { gastoEspacioNivel = niv; },
        alGastarEspacioPacto: () => { gastoPactoEjecutado = true; }
      });

      expect(resultadoNivel1.recursoGastado).toBe("espacio");
      expect(gastoEspacioNivel).toBe(1);
      expect(gastoPactoEjecutado).toBe(false);

      // Lanzamiento a nivel 3 (nivel de pacto): gasta espacio de pacto
      const resultadoNivel3 = gastarRecursoLanzamientoConjuro({
        nivelLanzamiento: 3,
        esLanzadorPacto: true,
        nivelEspacioPacto: 3,
        espaciosPactoMaximos: 2,
        espaciosPactoGastados: 0,
        espaciosConjuroMaximos: { "1": 4, "2": 2 },
        sistemaMagia: "espacios",
        alGastarEspacio: (niv) => { gastoEspacioNivel = niv; },
        alGastarEspacioPacto: () => { gastoPactoEjecutado = true; }
      });

      expect(resultadoNivel3.recursoGastado).toBe("pacto");
      expect(gastoPactoEjecutado).toBe(true);
    });
  });
});

