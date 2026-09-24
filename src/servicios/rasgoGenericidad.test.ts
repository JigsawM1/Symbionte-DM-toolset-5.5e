import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { EsquemaRasgoPersonaje, type RasgoPersonaje } from "@/tipos/rasgos";
import type { PersonajeJugador } from "@/tipos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import { obtenerRasgosClaseYSubclase } from "@/servicios/gestorClases";
import { resolverIdRasgoObjetivoGasto } from "@/servicios/evaluadorEfectosRasgos";
import { obtenerEspeciePorId, aplicarEspecieAPersonaje } from "@/servicios/gestorEspecies";

describe("Genericidad Arquitectónica de Rasgos (D&D 5.5e PHB 2024)", () => {
  describe("Regla 3: Auditoría Estática Anti-Bifurcaciones por Nombre en Servicios", () => {
    it("los archivos principales de servicio no deben contener bifurcaciones por nombre literal de rasgo (r.nombre === '...')", () => {
      const archivosServicio = [
        resolve(process.cwd(), "src/servicios/gestorClases.ts"),
        resolve(process.cwd(), "src/servicios/evaluadorEfectosRasgos.ts"),
        resolve(process.cwd(), "src/servicios/compendioRasgos.ts"),
        resolve(process.cwd(), "src/servicios/gestorEspecies.ts")
      ];

      const patronProhibido = /r\.nombre\s*===?\s*["']/g;

      for (const ruta of archivosServicio) {
        const contenido = readFileSync(ruta, "utf-8");
        // Eliminar comentarios de bloque y de línea para auditar únicamente código ejecutable
        const codigoSinComentarios = contenido.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
        const coincidencias = codigoSinComentarios.match(patronProhibido);
        expect(
          coincidencias,
          `Se encontraron bifurcaciones prohibidas por nombre en ${ruta}: ${JSON.stringify(coincidencias)}`
        ).toBeNull();
      }
    });

    it("gestorClases.ts no debe contener bifurcaciones específicas de Bárbaro ni Bardo", () => {
      const contenido = readFileSync(resolve(process.cwd(), "src/servicios/gestorClases.ts"), "utf-8");

      // No debe haber comprobaciones específicas hardcodeadas
      expect(contenido).not.toMatch(/if\s*\([^)]*===?\s*["']Frenesí["']/i);
      expect(contenido).not.toMatch(/if\s*\([^)]*===?\s*["']Golpe brutal["']/i);
      expect(contenido).not.toMatch(/if\s*\([^)]*===?\s*["']Guerrero de los dioses["']/i);
      expect(contenido).not.toMatch(/if\s*\([^)]*===?\s*["']Furia divina["']/i);
      expect(contenido).not.toMatch(/includes\(["']inspiracion bardica["']\)/i);
    });

    it("gestorEspecies.ts no debe contener bifurcaciones por 'ataque de aliento'", () => {
      const contenido = readFileSync(resolve(process.cwd(), "src/servicios/gestorEspecies.ts"), "utf-8");
      expect(contenido).not.toMatch(/includes\(["']ataque de aliento["']\)/i);
    });

    it("resolverIdRasgoObjetivoGasto no debe contener fallbacks por nombres de rasgos", () => {
      const rutaArchivo = existsSync(resolve(process.cwd(), "src/servicios/rasgos/evaluadorConjurosRasgos.ts"))
        ? resolve(process.cwd(), "src/servicios/rasgos/evaluadorConjurosRasgos.ts")
        : resolve(process.cwd(), "src/servicios/evaluadorEfectosRasgos.ts");
      const contenido = readFileSync(rutaArchivo, "utf-8");
      const fnIdx = contenido.indexOf("function resolverIdRasgoObjetivoGasto");
      expect(fnIdx).toBeGreaterThan(-1);
      const fnCuerpo = contenido.slice(fnIdx, fnIdx + 1200);
      expect(fnCuerpo).not.toMatch(/includes\(["']inspiracion["']\)/i);
      expect(fnCuerpo).not.toMatch(/includes\(["']furia["']\)/i);
      expect(fnCuerpo).not.toMatch(/includes\(["']linaje gigante["']\)/i);
    });
  });

  describe("Comportamiento Genérico Declarativo de Escalados en el Builder", () => {
    it("resuelve escalado de fórmula de dados genérico por nivel para rasgos de catálogo", () => {
      // Bardo nv 1 (1d6) vs nv 5 (1d8) vs nv 10 (1d10) vs nv 15 (1d12)
      const bardoNv1 = obtenerRasgosClaseYSubclase("Bardo", 1);
      const bardoNv5 = obtenerRasgosClaseYSubclase("Bardo", 5);
      const bardoNv10 = obtenerRasgosClaseYSubclase("Bardo", 10);
      const bardoNv15 = obtenerRasgosClaseYSubclase("Bardo", 15);

      const insp1 = bardoNv1.find((r) => r.escaladoFormulaDados && r.escaladoFormulaDados.length > 0);
      const insp5 = bardoNv5.find((r) => r.escaladoFormulaDados && r.escaladoFormulaDados.length > 0);
      const insp10 = bardoNv10.find((r) => r.escaladoFormulaDados && r.escaladoFormulaDados.length > 0);
      const insp15 = bardoNv15.find((r) => r.escaladoFormulaDados && r.escaladoFormulaDados.length > 0);

      expect(insp1?.formulaDados).toBe("1d6");
      expect(insp5?.formulaDados).toBe("1d8");
      expect(insp10?.formulaDados).toBe("1d10");
      expect(insp15?.formulaDados).toBe("1d12");
    });

    it("resuelve escalado de recuperación por nivel genérico (ej. largo a corto en Bardo)", () => {
      const bardoNv1 = obtenerRasgosClaseYSubclase("Bardo", 1);
      const bardoNv5 = obtenerRasgosClaseYSubclase("Bardo", 5);

      const insp1 = bardoNv1.find((r) => r.escaladoRecuperacion && r.escaladoRecuperacion.length > 0);
      const insp5 = bardoNv5.find((r) => r.escaladoRecuperacion && r.escaladoRecuperacion.length > 0);

      expect(insp1?.recuperacion).toBe("descanso_largo");
      expect(insp5?.recuperacion).toBe("descanso_corto");
    });

    it("sincroniza automáticamente los efectos mecánicos con la fórmula escalada si sincronizarEfectosConFormula es true", () => {
      // Berserker nv 3 (2d6) vs nv 9 (3d6) vs nv 16 (4d6)
      const nv3 = obtenerRasgosClaseYSubclase("Bárbaro", 3, "Senda del Berserker");
      const nv9 = obtenerRasgosClaseYSubclase("Bárbaro", 9, "Senda del Berserker");
      const nv16 = obtenerRasgosClaseYSubclase("Bárbaro", 16, "Senda del Berserker");

      const rasgo3 = nv3.find((r) => r.sincronizarEfectosConFormula && r.formulaDados === "2d6");
      const rasgo9 = nv9.find((r) => r.sincronizarEfectosConFormula && r.formulaDados === "3d6");
      const rasgo16 = nv16.find((r) => r.sincronizarEfectosConFormula && r.formulaDados === "4d6");

      expect(rasgo3).toBeDefined();
      expect(rasgo3?.efectos?.[0]?.valor).toBe("2d6");

      expect(rasgo9).toBeDefined();
      expect(rasgo9?.efectos?.[0]?.valor).toBe("3d6");

      expect(rasgo16).toBeDefined();
      expect(rasgo16?.efectos?.[0]?.valor).toBe("4d6");
    });

    it("desbloquea opciones dinámicas y escala maxSelecciones en selectores por nivel", () => {
      // Golpe brutal a nv 9 (1 selección, opciones base) vs nv 13 (opciones dinámicas añadidas) vs nv 17 (2 selecciones)
      const barbaroNv9 = obtenerRasgosClaseYSubclase("Bárbaro", 9);
      const barbaroNv13 = obtenerRasgosClaseYSubclase("Bárbaro", 13);
      const barbaroNv17 = obtenerRasgosClaseYSubclase("Bárbaro", 17);

      const selectorNv9 = barbaroNv9.find((r) => r.id.includes("golpe_brutal"))?.selectores?.[0];
      const selectorNv13 = barbaroNv13.find((r) => r.id.includes("golpe_brutal"))?.selectores?.[0];
      const selectorNv17 = barbaroNv17.find((r) => r.id.includes("golpe_brutal"))?.selectores?.[0];

      expect(selectorNv9?.maxSelecciones).toBe(1);
      expect(selectorNv9?.opciones.length).toBe(2);

      expect(selectorNv13?.maxSelecciones).toBe(1);
      expect(selectorNv13?.opciones.length).toBe(4); // 2 base + 2 dinámicas a nv 13

      expect(selectorNv17?.maxSelecciones).toBe(2);
      expect(selectorNv17?.tipo).toBe("multiple");
      expect(selectorNv17?.opciones.length).toBe(4);
    });

    it("valida correctamente rasgos personalizados homebrew creados según el nuevo esquema declarativo", () => {
      const rasgoHomebrew = {
        id: "rasgo_homebrew_prueba",
        nombre: "Poder Arcano Primigenio",
        descripcion: "Un rasgo personalizado con escalado puro",
        origen: "personalizado",
        fuente: "Homebrew",
        tipoAccion: "accion",
        tieneUsosLimitados: true,
        escaladoFormulaDados: [
          { nivelMinimo: 1, valor: "1d4" },
          { nivelMinimo: 6, valor: "2d4" },
          { nivelMinimo: 11, valor: "3d4" }
        ],
        escaladoUsos: {
          tipo: "por_nivel",
          tabla: [
            { nivelMinimo: 1, valor: 2 },
            { nivelMinimo: 10, valor: 4 }
          ],
          minimo: 2
        },
        escaladoRecuperacion: [
          { nivelMinimo: 1, valor: "descanso_largo" },
          { nivelMinimo: 10, valor: "descanso_corto" }
        ],
        sincronizarEfectosConFormula: true,
        efectos: [
          {
            tipo: "dado_extra_dano",
            objetivo: "ataque_fuerza",
            valor: "1d4",
            descripcion: "Daño arcano escalado"
          }
        ],
        selectores: [
          {
            id: "sel_elemento",
            tipo: "unico",
            etiqueta: "Tipo de Elemento",
            maxSelecciones: 1,
            opciones: [
              { id: "fuego", nombre: "Fuego", descripcion: "Elemento fuego" },
              { id: "hielo", nombre: "Hielo", descripcion: "Elemento hielo" }
            ],
            opcionesDinamicas: [
              {
                nivelMinimo: 5,
                opciones: [
                  { id: "rayo", nombre: "Rayo", descripcion: "Elemento rayo" }
                ]
              }
            ],
            escaladoMaxSelecciones: [
              { nivelMinimo: 1, valor: 1 },
              { nivelMinimo: 10, valor: 2 }
            ]
          }
        ]
      };

      const resultadoValidacion = EsquemaRasgoPersonaje.safeParse(rasgoHomebrew);
      expect(resultadoValidacion.success).toBe(true);
    });
  });

function crearRasgoMock(parcial: Partial<RasgoPersonaje> & { id: string; nombre: string }): RasgoPersonaje {
  return {
    descripcion: "",
    origen: "personalizado",
    fuente: "Homebrew",
    tipoAccion: "pasivo",
    tieneUsosLimitados: false,
    recuperacion: "ninguno",
    personalizado: true,
    activo: true,
    notas: "",
    ...parcial
  };
}

  describe("Resolución Genérica Declarativa Padre-Hijo y Escalados de Especie", () => {
    it("resuelve el rasgo padre en rasgos homebrew mediante ligadoA sin importar el nombre", () => {
      const rasgoPadreHomebrew = crearRasgoMock({
        id: "rasgo_hb_padre_123",
        nombre: "Fuente Cósmica Personalizada",
        descripcion: "Otorga maná cósmico",
        tieneUsosLimitados: true,
        usosMaximos: 5,
        usosRestantes: 5,
        recuperacion: "descanso_largo"
      });

      const rasgoHijoHomebrew = crearRasgoMock({
        id: "rasgo_hb_hijo_456",
        nombre: "Descarga Cósmica",
        descripcion: "Gasta maná cósmico",
        tipoAccion: "accion",
        gastarDePadre: true,
        ligadoA: "rasgo_hb_padre_123"
      });

      const idObjetivo = resolverIdRasgoObjetivoGasto(rasgoHijoHomebrew, [rasgoPadreHomebrew, rasgoHijoHomebrew]);
      expect(idObjetivo).toBe("rasgo_hb_padre_123");
    });

    it("no resuelve por nombres hardcodeados si falta ligadoA y existen múltiples candidatos", () => {
      const rasgo1 = crearRasgoMock({
        id: "rasgo_1",
        nombre: "Inspiración del Abismo",
        tieneUsosLimitados: true,
        usosMaximos: 3
      });

      const rasgo2 = crearRasgoMock({
        id: "rasgo_2",
        nombre: "Furia Espectral",
        tieneUsosLimitados: true,
        usosMaximos: 2
      });

      const rasgoHijoSinLigado = crearRasgoMock({
        id: "rasgo_hijo_huerfano",
        nombre: "Poder Misterioso",
        tipoAccion: "accion",
        gastarDePadre: true
      });

      // Al no haber ligadoA y haber más de 1 candidato con usos en la misma fuente, devuelve su propio ID de forma segura
      const idObjetivo = resolverIdRasgoObjetivoGasto(rasgoHijoSinLigado, [rasgo1, rasgo2, rasgoHijoSinLigado]);
      expect(idObjetivo).toBe("rasgo_hijo_huerfano");
    });

    it("escala Ataque de aliento de dracónido declarativamente a niveles 1, 5, 11 y 17", () => {
      const especieDraconido = obtenerEspeciePorId("draconido");
      expect(especieDraconido).toBeDefined();

      const pjBase: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj_draconido_test",
        nombre: "Dracon Test",
        nivel: 1,
        especie: "draconido",
        subespecie: "draconido_oro",
        rasgos: []
      };

      const config = { especieId: "draconido", subespecieId: "draconido_oro" };

      const pjNv1 = aplicarEspecieAPersonaje({ ...pjBase, nivel: 1 }, config);
      const alientoNv1 = pjNv1.rasgos?.find((r) => r.nombre === "Ataque de aliento");
      expect(alientoNv1?.formulaDados).toBe("1d10");
      expect(alientoNv1?.usosMaximos).toBe(2); // PB nv 1 es 2

      const pjNv5 = aplicarEspecieAPersonaje({ ...pjBase, nivel: 5 }, config);
      const alientoNv5 = pjNv5.rasgos?.find((r) => r.nombre === "Ataque de aliento");
      expect(alientoNv5?.formulaDados).toBe("2d10");
      expect(alientoNv5?.usosMaximos).toBe(3); // PB nv 5 es 3

      const pjNv11 = aplicarEspecieAPersonaje({ ...pjBase, nivel: 11 }, config);
      const alientoNv11 = pjNv11.rasgos?.find((r) => r.nombre === "Ataque de aliento");
      expect(alientoNv11?.formulaDados).toBe("3d10");
      expect(alientoNv11?.usosMaximos).toBe(4); // PB nv 11 es 4

      const pjNv17 = aplicarEspecieAPersonaje({ ...pjBase, nivel: 17 }, config);
      const alientoNv17 = pjNv17.rasgos?.find((r) => r.nombre === "Ataque de aliento");
      expect(alientoNv17?.formulaDados).toBe("4d10");
      expect(alientoNv17?.usosMaximos).toBe(6); // PB nv 17 es 6
    });

    it("los rasgos de subclase del Bardo definen ligadoA apuntando a rasgo_cls_bardo_inspiracion_bardica", () => {
      const bardoGlamourNv3 = obtenerRasgosClaseYSubclase("Bardo", 3, "Colegio del Glamour");
      const manto = bardoGlamourNv3.find((r) => r.nombre === "Manto de inspiración");
      expect(manto).toBeDefined();
      expect(manto?.gastarDePadre).toBe(true);
      expect(manto?.ligadoA).toBe("rasgo_cls_bardo_inspiracion_bardica");

      const bardoConocimientoNv3 = obtenerRasgosClaseYSubclase("Bardo", 3, "Colegio del Conocimiento");
      const palabras = bardoConocimientoNv3.find((r) => r.nombre === "Palabras cortantes");
      expect(palabras).toBeDefined();
      expect(palabras?.gastarDePadre).toBe(true);
      expect(palabras?.ligadoA).toBe("rasgo_cls_bardo_inspiracion_bardica");
    });
  });
});
