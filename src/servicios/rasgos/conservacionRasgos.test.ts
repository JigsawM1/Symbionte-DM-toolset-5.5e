import { describe, expect, it } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { sincronizarRasgosAutomaticos } from "../compendioRasgos";
import { deshidratarPersonaje, hidratarPersonaje } from "../serializadorPersonaje";
import { evaluarEfectosRasgosActivos } from "./evaluadorExpresionesRasgos";
import { tieneConjuroGratuitoActivo } from "./evaluadorConjurosRasgos";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";

const crearPersonaje = (cambios: Partial<PersonajeJugador> = {}): PersonajeJugador => ({
  ...PERSONAJE_POR_DEFECTO, id: "auditoria", nombre: "Auditoría",
  clase: "Guerrero", nivel: 4, especie: "Orco", clases: [], rasgos: [], ...cambios
});

const crearRasgo = (cambios: Partial<RasgoPersonaje> = {}): RasgoPersonaje => ({
  id: "rasgo_hb_auditoria", nombre: "Don arcano", descripcion: "",
  origen: "personalizado", fuente: "Homebrew", tipoAccion: "pasivo",
  tieneUsosLimitados: false, recuperacion: "ninguno", personalizado: true,
  activo: true, notas: "", ...cambios
});

describe("Conservación de rasgos entre construcción y persistencia", () => {
  it.each(["personalizado", "dote"] as const)("conserva opciones y efectos de selectores de origen %s", (origen) => {
    const rasgo = crearRasgo({ origen, selectores: [{
      id: "eleccion", tipoSelector: "general", etiqueta: "Elección", tipo: "unico",
      maxSelecciones: 1, valorActual: ["op_a"], opciones: [{
        id: "op_a", nombre: "Opción A", descripcion: "",
        efectos: [{ tipo: "bono_ataque", objetivo: "todos_ataques", valor: 2 }]
      }]
    }] });
    const personaje = crearPersonaje({ rasgos: [rasgo] });
    const restaurado = hidratarPersonaje(deshidratarPersonaje(personaje));
    const rasgoRestaurado = restaurado.rasgos.find((r) => r.id === rasgo.id)!;
    expect(rasgoRestaurado.selectores?.[0].opciones).toEqual(rasgo.selectores?.[0].opciones);
    expect(rasgoRestaurado.selectores?.[0].valorActual).toEqual(["op_a"]);
    expect(evaluarEfectosRasgosActivos({ ...restaurado, rasgos: [rasgoRestaurado] }))
      .toEqual(evaluarEfectosRasgosActivos(personaje));
  });

  it("conserva la elección interna de una dote al resincronizar y recargar", () => {
    const personaje = crearPersonaje();
    personaje.rasgos = sincronizarRasgosAutomaticos(personaje);
    const mejora = personaje.rasgos.find((r) => r.selectores?.some((s) => s.id.includes("dote_asi")))!;
    mejora.selectores![0].valorActual = ["dote_iniciado_magia_mago"];
    personaje.rasgos = sincronizarRasgosAutomaticos(personaje);
    const dote = personaje.rasgos.find((r) => r.id.startsWith("dote_asi_"))!;
    const selector = dote.selectores![0];
    selector.valorActual = [selector.opciones[0].id];
    for (const rasgos of [sincronizarRasgosAutomaticos(personaje), hidratarPersonaje(deshidratarPersonaje(personaje)).rasgos]) {
      expect(rasgos.find((r) => r.id === dote.id)?.selectores?.[0].valorActual).toEqual(selector.valorActual);
    }
  });

  it("conserva una selección vacía intencional sin reponer el valor predeterminado", () => {
    const personaje = crearPersonaje();
    personaje.rasgos = sincronizarRasgosAutomaticos(personaje);
    const mejora = personaje.rasgos.find((r) => r.selectores?.some((s) => s.id.includes("dote_asi")))!;
    mejora.selectores![0].valorActual = [];
    expect(sincronizarRasgosAutomaticos(personaje).find((r) => r.id === mejora.id)?.selectores?.[0].valorActual).toEqual([]);
  });

  it("conserva dados guardados de Portento y es estable al repetir la resincronización", () => {
    const personaje = crearPersonaje({ clase: "Mago", subclase: "Adivino", nivel: 6 });
    personaje.rasgos = sincronizarRasgosAutomaticos(personaje);
    const portento = personaje.rasgos.find((r) => r.guardaDadosTirada)!;
    portento.dadosGuardados = [4, 18];
    const antes = structuredClone(personaje);
    const restaurado = hidratarPersonaje(deshidratarPersonaje(personaje));
    expect(restaurado.rasgos.find((r) => r.id === portento.id)?.dadosGuardados).toEqual([4, 18]);
    expect(sincronizarRasgosAutomaticos(restaurado)).toEqual(restaurado.rasgos);
    expect(personaje).toEqual(antes);
  });

  it.each([
    { objetivo: "conjuro", valor: "orden_imperiosa" },
    { objetivo: "orden_imperiosa", valor: "sin_espacio" }
  ])("interpreta conjuros gratuitos tanto del editor como del catálogo: %j", (campos) => {
    const personaje = crearPersonaje({ rasgos: [crearRasgo({ efectos: [{ tipo: "conjuro_gratuito", ...campos }] })] });
    expect(tieneConjuroGratuitoActivo(personaje, "orden_imperiosa")).toBe(true);
  });
});
