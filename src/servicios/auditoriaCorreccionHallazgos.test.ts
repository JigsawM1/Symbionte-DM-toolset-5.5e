import { describe, it, expect, beforeEach } from "vitest";
import { consumirRecursoConjuro } from "@/servicios/consumidorRecursosConjuros";

import { obtenerTablaRasgo } from "@/servicios/rasgos/tablasAleatoriasRasgos";
import { resolverExtensionesRasgos } from "@/servicios/rasgos/extensionesRasgos";
import { operarCapacidadRasgo } from "@/servicios/rasgos/operacionesAvanzadasRasgos";
import { sanearPersonaje } from "@/almacen/sanitizacion";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import hechiceroData from "@/datos/clases/hechicero.json";

// Mock de localStorage en caso de entorno Node
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => storageMap.set(key, String(value)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() { return storageMap.size; },
  key: (index: number) => Array.from(storageMap.keys())[index] ?? null
};
if (typeof globalThis.localStorage === "undefined") {
  (globalThis as unknown as { localStorage: typeof localStorageMock }).localStorage = localStorageMock;
}

describe("Auditoría y Corrección de los Siete Hallazgos de Magia Salvaje y Simbionte", () => {
  // --------------------------------------------------------------------------
  // HALLAZGO 6: Una sola fuente de verdad para conjuros ocultos
  // --------------------------------------------------------------------------
  describe("Hallazgo 6: Conjuros ocultos — Fuente única y migración limpia", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("una lista explícita en personaje (incluso vacía []) prevalece y no importa de localStorage", () => {
      localStorage.setItem("ts_conjuros_ocultos_pj_test", JSON.stringify(["h_escudo", "h_proyectil"]));
      
      const rawConListaVacia = {
        id: "pj_test",
        nombre: "Test",
        conjurosOcultos: [],
        rasgos: []
      } as unknown as RasgoPersonaje;

      const sanitizado = sanearPersonaje(rawConListaVacia);
      expect(sanitizado.conjurosOcultos).toEqual([]);
    });

    it("migra desde localStorage únicamente si raw.conjurosOcultos es undefined", () => {
      localStorage.setItem("ts_conjuros_ocultos_pj_migrar", JSON.stringify(["h_escudo", "h_proyectil", "h_escudo"]));
      
      const rawSinCampo = {
        id: "pj_migrar",
        nombre: "Migrar",
        rasgos: []
      } as unknown as RasgoPersonaje;

      const sanitizado = sanearPersonaje(rawSinCampo);
      expect(sanitizado.conjurosOcultos).toEqual(["h_escudo", "h_proyectil"]);
    });
  });

  // --------------------------------------------------------------------------
  // HALLAZGO 7: Consumo atómico de padre e hijo en lanzamiento gratuito
  // --------------------------------------------------------------------------
  describe("Hallazgo 7: Lanzamiento gratuito con recurso hijo y padre (atómico)", () => {
    const crearRasgosPadreHijo = (usosHijo?: number, usosPadre?: number, mismoRecurso = false) => {
      const padre: RasgoPersonaje = {
        id: mismoRecurso ? "rasgo_compartido" : "rasgo_padre_patron",
        nombre: "Reserva del Patrón",
        tieneUsosLimitados: true,
        usosMaximos: 3,
        usosRestantes: usosPadre,
        nivelRequerido: 1,
        origen: "clase",
        descripcion: "Padre",
        conjurosOtorgados: mismoRecurso ? ["h_bruma"] : undefined
      } as unknown as RasgoPersonaje;

      const hijo: RasgoPersonaje = {
        id: mismoRecurso ? "rasgo_compartido" : "rasgo_hijo_concesion",
        nombre: "Don Arcano",
        tieneUsosLimitados: true,
        usosMaximos: 1,
        usosRestantes: usosHijo,
        gastarDePadre: true,
        idRasgoRecurso: mismoRecurso ? undefined : "rasgo_padre_patron",
        conjurosOtorgados: ["h_bruma"],
        nivelRequerido: 1,
        origen: "clase",
        descripcion: "Hijo"
      } as unknown as RasgoPersonaje;

      const pj: PersonajeJugador = {
        id: "pj_brujo",
        nombre: "Brujo",
        rasgos: mismoRecurso ? [padre] : [padre, hijo]
      } as unknown as PersonajeJugador;

      return { pj, padre, hijo };
    };

    it("rechaza el consumo si el hijo está agotado aunque el padre tenga usos (no modifica padre)", () => {
      const { pj } = crearRasgosPadreHijo(0, 3);
      const res = consumirRecursoConjuro(pj, { tipo: "gratuitoInnato", hechizoId: "h_bruma" });
      expect(res.permitido).toBe(false);
      // La ficha original no debe mutar
      const padrePost = pj.rasgos.find(r => r.id === "rasgo_padre_patron");
      expect(padrePost?.usosRestantes).toBe(3);
    });

    it("rechaza el consumo si el padre está agotado aunque el hijo tenga usos (no modifica hijo)", () => {
      const { pj } = crearRasgosPadreHijo(1, 0);
      const res = consumirRecursoConjuro(pj, { tipo: "gratuitoInnato", hechizoId: "h_bruma" });
      expect(res.permitido).toBe(false);
      const hijoPost = pj.rasgos.find(r => r.id === "rasgo_hijo_concesion");
      expect(hijoPost?.usosRestantes).toBe(1);
    });

    it("descuenta atómicamente a padre e hijo cuando ambos están disponibles", () => {
      const { pj } = crearRasgosPadreHijo(1, 3);
      const res = consumirRecursoConjuro(pj, { tipo: "gratuitoInnato", hechizoId: "h_bruma" });
      expect(res.permitido).toBe(true);
      if (res.permitido) {
        const hijoPost = res.personaje.rasgos.find(r => r.id === "rasgo_hijo_concesion");
        const padrePost = res.personaje.rasgos.find(r => r.id === "rasgo_padre_patron");
        expect(hijoPost?.usosRestantes).toBe(0);
        expect(padrePost?.usosRestantes).toBe(2);
      }
    });

    it("interpreta usosRestantes undefined como recurso intacto al máximo", () => {
      const { pj } = crearRasgosPadreHijo(undefined, undefined);
      const res = consumirRecursoConjuro(pj, { tipo: "gratuitoInnato", hechizoId: "h_bruma" });
      expect(res.permitido).toBe(true);
      if (res.permitido) {
        const hijoPost = res.personaje.rasgos.find(r => r.id === "rasgo_hijo_concesion");
        const padrePost = res.personaje.rasgos.find(r => r.id === "rasgo_padre_patron");
        expect(hijoPost?.usosRestantes).toBe(0); // 1 - 1
        expect(padrePost?.usosRestantes).toBe(2); // 3 - 1
      }
    });

    it("no descuenta dos veces cuando padre e hijo resuelven al mismo recurso", () => {
      const { pj } = crearRasgosPadreHijo(undefined, 3, true);
      const res = consumirRecursoConjuro(pj, { tipo: "gratuitoInnato", hechizoId: "h_bruma" });
      expect(res.permitido).toBe(true);
      if (res.permitido) {
        const compartido = res.personaje.rasgos.find(r => r.id === "rasgo_compartido");
        expect(compartido?.usosRestantes).toBe(2); // 3 - 1, NO 3 - 2
      }
    });
  });

  // --------------------------------------------------------------------------
  // HALLAZGO 2: Una sola definición de la tabla canónica (hechicero.json)
  // --------------------------------------------------------------------------
  describe("Hallazgo 2: Catálogo canónico de Magia Salvaje en hechicero.json", () => {
    const rasgoTablaJSON = (hechiceroData.subclases[3].rasgos as unknown as RasgoPersonaje[]).find(
      r => r.id === "rasgo_sub_hechicero_tabla_oleada"
    );

    it("la tabla de hechicero.json contiene las 25 filas cubriendo 1-100", () => {
      expect(rasgoTablaJSON).toBeDefined();
      expect(rasgoTablaJSON?.tablaAleatoria?.filas?.length).toBe(25);
      expect(rasgoTablaJSON?.tablaAleatoria?.dado).toBe(100);

      const cobertura = new Set<number>();
      for (const fila of rasgoTablaJSON!.tablaAleatoria!.filas!) {
        for (let i = fila.desde; i <= fila.hasta; i++) {
          expect(cobertura.has(i)).toBe(false);
          cobertura.add(i);
        }
      }
      expect(cobertura.size).toBe(100);
    });

    it("las filas de hechicero.json incorporan subtiradas estructuradas con sus opciones canónicas", () => {
      const filas = rasgoTablaJSON!.tablaAleatoria!.filas!;
      
      // Fila 5: Invocación de aliado (1d4)
      const fila5 = filas.find(f => f.id === "oleada_5");
      expect(fila5?.subtiradas?.[0].formula).toBe("1d4");

      // Fila 17: Rarezas cosméticas (1d8)
      const fila17 = filas.find(f => f.id === "oleada_17");
      expect(fila17?.subtiradas?.[0].formula).toBe("1d8");

      // Fila 57: Conjuros del caos (1d10)
      const fila57 = filas.find(f => f.id === "oleada_57");
      expect(fila57?.subtiradas?.[0].formula).toBe("1d10");

      // Fila 97: Milagro del caos supremo (1d6 con 2d10)
      const fila97 = filas.find(f => f.id === "oleada_97");
      expect(fila97?.subtiradas?.some(s => s.formula === "1d6")).toBe(true);
      expect(fila97?.subtiradas?.some(s => s.formula === "2d10" && s.siResultado === 1)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // HALLAZGOS 3 Y 5: Caos controlado (nv 14), Oleada domada (nv 18) y Mareas
  // --------------------------------------------------------------------------
  describe("Hallazgos 3 y 5: Reglas canónicas del Hechicero (Niveles 3, 14 y 18)", () => {
    it("a nivel 14+, Caos Controlado proyecta tiradas: 2 en la tabla de oleada", () => {
      const rasgoTabla = { ...(hechiceroData.subclases[3].rasgos as unknown as RasgoPersonaje[]).find(r => r.id === "rasgo_sub_hechicero_tabla_oleada")! };
      const caosControlado = { ...(hechiceroData.subclases[3].rasgos as unknown as RasgoPersonaje[]).find(r => r.id === "rasgo_sub_hechicero_caos_controlado")! };

      const pjNv14: PersonajeJugador = {
        id: "pj_hechicero_14",
        nivel: 14,
        rasgos: [rasgoTabla, caosControlado]
      } as unknown as PersonajeJugador;

      const efectivos = resolverExtensionesRasgos(pjNv14.rasgos, 14);
      const rasgoEfectivo = efectivos.find(r => r.id === "rasgo_sub_hechicero_tabla_oleada")!;
      const cfg = obtenerTablaRasgo(pjNv14, rasgoEfectivo);

      expect(cfg?.tiradas).toBe(2);
    });

    it("Oleada domada a nivel 18 tiene modo 'elegir' y excluye la fila 25", () => {
      const rasgoTabla = { ...(hechiceroData.subclases[3].rasgos as unknown as RasgoPersonaje[]).find(r => r.id === "rasgo_sub_hechicero_tabla_oleada")! };
      const oleadaDomada = { ...(hechiceroData.subclases[3].rasgos as unknown as RasgoPersonaje[]).find(r => r.id === "rasgo_sub_hechiceria_de_magia_salvaje_oleada_domada")! };

      const pjNv18: PersonajeJugador = {
        id: "pj_hechicero_18",
        nivel: 18,
        rasgos: [rasgoTabla, oleadaDomada]
      } as unknown as PersonajeJugador;

      const cfg = obtenerTablaRasgo(pjNv18, oleadaDomada);
      expect(cfg?.modo).toBe("elegir");
      expect(cfg?.excluirUltima).toBe(true);
      expect(cfg?.filas?.length).toBe(24);
      expect(cfg?.filas?.some(f => f.desde === 97)).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // HALLAZGO 4: Persistencia y detalle estructurado de resultadoTabla
  // --------------------------------------------------------------------------
  describe("Hallazgo 4: resultadoTabla persistido, estructurado e histórico", () => {
    it("operarCapacidadRasgo guarda detalles estructurados y respeta estadoEnvio", () => {
      const rasgoTabla: RasgoPersonaje = {
        id: "rasgo_sub_hechicero_tabla_oleada",
        nombre: "Tabla de Oleada",
        tablaAleatoria: {
          dado: 100,
          tiradas: 1,
          modo: "aleatoria",
          filas: [{ id: "oleada_25", desde: 25, hasta: 28, texto: "Destierro astral" }]
        }
      } as RasgoPersonaje;

      const pj: PersonajeJugador = {
        id: "pj_1",
        nombre: "Hechicero",
        rasgos: [rasgoTabla]
      } as unknown as PersonajeJugador;

      const pjGuardado = operarCapacidadRasgo(pj, {
        tipo: "guardarTabla",
        idRasgo: "rasgo_sub_hechicero_tabla_oleada",
        texto: "Destierro astral",
        detalle: {
          id: "res_123",
          tiradaD100: 27,
          idFila: "oleada_25",
          origen: "talespire",
          estadoEnvio: "pendiente",
          fecha: 1700000000
        }
      });

      expect(pjGuardado).toBeDefined();
      const resTabla = pjGuardado!.rasgos[0].resultadoTabla;
      expect(resTabla?.id).toBe("res_123");
      expect(resTabla?.tiradaD100).toBe(27);
      expect(resTabla?.estadoEnvio).toBe("pendiente");
      expect(resTabla?.origen).toBe("talespire");

      // Confirmar envío por idResultado
      const pjEnviado = operarCapacidadRasgo(pjGuardado!, {
        tipo: "enviarTabla",
        idRasgo: "rasgo_sub_hechicero_tabla_oleada",
        idResultado: "res_123"
      });

      expect(pjEnviado?.rasgos[0].resultadoTabla?.enviado).toBe(true);
      expect(pjEnviado?.rasgos[0].resultadoTabla?.estadoEnvio).toBe("enviado");

      // Un idResultado diferente no debe marcarlo
      const pjIntentoViejo = operarCapacidadRasgo(pjGuardado!, {
        tipo: "enviarTabla",
        idRasgo: "rasgo_sub_hechicero_tabla_oleada",
        idResultado: "res_distinto_antiguo"
      });
      expect(pjIntentoViejo).toBeUndefined();
    });
  });
});
