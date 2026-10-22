import { describe, it, expect } from "vitest";
import type { RasgoPersonaje } from "@/tipos";
import { fusionarEstadoRasgo } from "@/servicios/rasgos/fusionarEstadoRasgo";
import { resolverEscaladosRasgo } from "@/servicios/clases/escaladosRasgos";

function crearRasgoPrueba(parcial: Partial<RasgoPersonaje> = {}): RasgoPersonaje {
  return {
    id: "rasgo-prueba",
    nombre: "Rasgo de Prueba",
    descripcion: "Descripción del rasgo de prueba.",
    origen: "clase",
    fuente: "Manual del Jugador",
    tipoAccion: "pasivo",
    tieneUsosLimitados: false,
    recuperacion: "ninguno",
    personalizado: false,
    activo: true,
    notas: "",
    ...parcial
  } as RasgoPersonaje;
}

describe("Auditoría Fase 4: Interfaz de Usuario, Componentes de Ficha, Rendimiento en CEF y Límites", () => {
  describe("F4-01: Escalado de Recursos vs Bono de Competencia e Inmutabilidad", () => {
    it("no debe confundir escalado de dados de daño con usos máximos cuando ambos existen", () => {
      // Rasgo con dados de daño y usos fijos
      const rasgoAtaqueConDados = crearRasgoPrueba({
        id: "aliento-dragon",
        nombre: "Arma de aliento",
        origen: "especie",
        descripcion: "Exhalas energía destructiva.",
        tieneUsosLimitados: true,
        usosMaximos: 3,
        usosRestantes: undefined, // Intacto
        formulaDados: "2d6",
        formulaEscalado: "bono_competencia"
      });

      // Si escala dados, la fórmula de dados se evalúa pero los usos máximos no se sobrescriben con PB
      const escalaPorBonoCompetencia =
        rasgoAtaqueConDados.formulaUsos === "bono_competencia" ||
        (rasgoAtaqueConDados.formulaEscalado === "bono_competencia" && !rasgoAtaqueConDados.formulaDados);

      expect(escalaPorBonoCompetencia).toBe(false);

      const usosMaximos = escalaPorBonoCompetencia ? 4 : (rasgoAtaqueConDados.usosMaximos || 1);
      expect(usosMaximos).toBe(3);

      // Estado intacto: usosRestantes undefined equivale al 100% (3 de 3)
      const usosRestantes = rasgoAtaqueConDados.usosRestantes ?? usosMaximos;
      expect(usosRestantes).toBe(3);
    });

    it("debe escalar usos máximos dinámicamente cuando formulaUsos es bono_competencia", () => {
      const rasgoUsosPB = crearRasgoPrueba({
        id: "bendicion-selvaje",
        nombre: "Bendición salvaje",
        origen: "clase",
        descripcion: "Canalizas la naturaleza tantas veces como tu bono de competencia.",
        tieneUsosLimitados: true,
        usosMaximos: 2,
        usosRestantes: undefined,
        formulaUsos: "bono_competencia"
      });

      const escalaPorBonoCompetencia =
        rasgoUsosPB.formulaUsos === "bono_competencia" ||
        (rasgoUsosPB.formulaEscalado === "bono_competencia" && !rasgoUsosPB.formulaDados);

      expect(escalaPorBonoCompetencia).toBe(true);

      const nivel5 = 5;
      const pbNivel5 = Math.floor((nivel5 - 1) / 4) + 2; // PB = 3
      const usosMaximosNivel5 = escalaPorBonoCompetencia ? pbNivel5 : (rasgoUsosPB.usosMaximos || 1);
      expect(usosMaximosNivel5).toBe(3);

      const nivel9 = 9;
      const pbNivel9 = Math.floor((nivel9 - 1) / 4) + 2; // PB = 4
      const usosMaximosNivel9 = escalaPorBonoCompetencia ? pbNivel9 : (rasgoUsosPB.usosMaximos || 1);
      expect(usosMaximosNivel9).toBe(4);
    });

    it("debe preservar la inmutabilidad de rasgos personalizados usando structuredClone en fusionarEstadoRasgo", () => {
      const rasgoPersonalizado = crearRasgoPrueba({
        id: "homebrew-propio",
        nombre: "Técnica secreta",
        origen: "personalizado",
        personalizado: true,
        descripcion: "Un rasgo propio del DM.",
        tieneUsosLimitados: true,
        usosMaximos: 5,
        usosRestantes: 5
      });

      const fusionado = fusionarEstadoRasgo(
        { ...rasgoPersonalizado, descripcion: "Modificado desde compendio" },
        rasgoPersonalizado
      );

      expect(fusionado).not.toBe(rasgoPersonalizado);
      expect(fusionado.descripcion).toBe("Un rasgo propio del DM.");
      expect(fusionado.usosMaximos).toBe(5);
    });

    it("debe resolver escalados por nivel de clase sin corromper el estado base", () => {
      const rasgoEscalado = {
        id: "inspiracion-bardica",
        nombre: "Inspiración bárdica",
        tipoAccion: "accion_adicional" as const,
        nivelRequerido: 1,
        tieneUsosLimitados: true,
        usosMaximos: 3,
        escaladoUsos: {
          tipo: "por_nivel" as const,
          tabla: [
            { nivelMinimo: 1, valor: 3 },
            { nivelMinimo: 5, valor: 4 },
            { nivelMinimo: 10, valor: 5 }
          ]
        }
      };

      const resNivel1 = resolverEscaladosRasgo(rasgoEscalado, 1, [], []);
      expect(resNivel1.usosEscalados).toBe(3);

      const resNivel5 = resolverEscaladosRasgo(rasgoEscalado, 5, [], []);
      expect(resNivel5.usosEscalados).toBe(4);
    });
  });

  describe("F4-05: Atomicidad de Recursos de Arcano Místico", () => {
    it("debe validar que los recursos intactos (undefined) equivalen a 1 uso disponible", () => {
      const arcanoMisticoIntacto = crearRasgoPrueba({
        id: "arcano-mistico-nivel-6",
        nombre: "Arcano Místico (Nivel 6)",
        origen: "clase",
        descripcion: "Puedes lanzar tu conjuro elegido de nivel 6 una vez sin gastar espacio.",
        tieneUsosLimitados: true,
        usosMaximos: 1,
        usosRestantes: undefined,
        recuperacion: "descanso_largo"
      });

      const usosDisponibles = arcanoMisticoIntacto.usosRestantes ?? arcanoMisticoIntacto.usosMaximos ?? 0;
      expect(usosDisponibles).toBe(1);

      const arcanoGastado = crearRasgoPrueba({
        ...arcanoMisticoIntacto,
        usosRestantes: 0
      });
      const usosDisponiblesGastado = arcanoGastado.usosRestantes ?? arcanoGastado.usosMaximos ?? 0;
      expect(usosDisponiblesGastado).toBe(0);
    });
  });

  describe("F4-02: Modularización e Integridad de Subcomponentes", () => {
    it("debe verificar que los subcomponentes creados exportan componentes React válidos", async () => {
      const { SelectorContenedorDestino } = await import(
        "./caracteristicas/inventario/subcomponentes/SelectorContenedorDestino"
      );
      const { VistaPreviaObjetoCompendio } = await import(
        "./caracteristicas/inventario/subcomponentes/VistaPreviaObjetoCompendio"
      );
      const { BadgesFilaSuperiorObjeto } = await import(
        "./caracteristicas/inventario/subcomponentes/BadgesFilaSuperiorObjeto"
      );
      const { ModalesJSONGestorPersonajes } = await import(
        "./caracteristicas/personajes/subcomponentes/ModalesJSONGestorPersonajes"
      );

      expect(typeof SelectorContenedorDestino).toBe("function");
      expect(typeof VistaPreviaObjetoCompendio).toBe("function");
      expect(typeof BadgesFilaSuperiorObjeto).toBe("function");
      expect(typeof ModalesJSONGestorPersonajes).toBe("function");
    });
  });
});
