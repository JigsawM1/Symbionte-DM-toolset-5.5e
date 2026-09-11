import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { EsquemaRasgoPersonaje } from "@/tipos/rasgos";
import { obtenerRasgosClaseYSubclase } from "@/servicios/gestorClases";

describe("Genericidad Arquitectónica de Rasgos (D&D 5.5e PHB 2024)", () => {
  describe("Regla 3: Auditoría Estática Anti-Bifurcaciones por Nombre en Servicios", () => {
    it("los archivos principales de servicio no deben contener bifurcaciones por nombre literal de rasgo (r.nombre === '...')", () => {
      const archivosServicio = [
        resolve(process.cwd(), "src/servicios/gestorClases.ts"),
        resolve(process.cwd(), "src/servicios/evaluadorEfectosRasgos.ts"),
        resolve(process.cwd(), "src/servicios/compendioRasgos.ts")
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
});
