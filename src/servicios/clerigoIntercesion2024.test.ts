import { afterEach, describe, expect, it, vi } from "vitest";
import * as lanzadorDados from "@/utiles/lanzadorDados";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { resolverRecuperacionDiferida } from "@/servicios/rasgos/emitirRecuperacionDiferida";
import { logger } from "@/utiles/logger";
import { HECHIZOS_INICIALES } from "@/utiles/datosIniciales";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { aplicarBuildClaseAPersonaje } from "./gestorClases";
import { obtenerConcesionConRecurso } from "./rasgos/lanzamientoRecursoRasgos";
import { consumirRecursoConjuro } from "./consumidorRecursosConjuros";
import { aplicarConfiguracionConjurosRasgos } from "./rasgos/conjurosGratuitosRasgos";
import { prepararLanzamiento, validarLanzamiento, type SolicitudLanzamiento } from "./servicioLanzamientoConjuros";
import { establecerRecuperacionDiferida } from "./rasgos/recuperacionDiferidaRasgos";
import { ejecutarDescansoCorto, ejecutarDescansoLargo } from "./procesadorDescansos";
import { deshidratarPersonaje, hidratarPersonaje } from "./serializadorPersonaje";
import { EsquemaPersonajeJugador } from "@/tipos/personaje";
import { EsquemaDefinicionClaseJSON } from "@/tipos/esquemasCatalogos";
import clerigoJSON from "@/datos/clases/clerigo.json";
import { construirRasgoDesdeBorrador, crearBorradorRasgo } from "./rasgos/borradorRasgo";
import type { PersonajeJugador } from "@/tipos";

const id = "rasgo_cls_clerigo_intercesion_divina";
const crear = (nivel = 20) => aplicarBuildClaseAPersonaje({ ...structuredClone(PERSONAJE_POR_DEFECTO), id: "clerigo", especie: "",
  caracteristicas: { fuerza: 10, destreza: 10, constitucion: 10, inteligencia: 20, sabiduria: 16, carisma: 10 }
}, "Clérigo", nivel);
const r = (p: PersonajeJugador) => p.rasgos.find(r => r.id === id)!;
const hechizo = (id: string) => {
  const h = HECHIZOS_INICIALES.find(h => h.id === id);
  if (!h) throw new Error(`Falta ${id} en el catálogo.`);
  return h;
};
const solicitud = (conjuroId: string): SolicitudLanzamiento => ({ modo: "recursoRasgo", idRasgoOrigen: id, hechizo: hechizo(conjuroId), claseLanzamiento: "Clérigo" });
const consumir = (p: PersonajeJugador, conjuroId: string) => consumirRecursoConjuro(p, { tipo: "recursoRasgo", idRasgo: id, hechizo: hechizo(conjuroId), nivel: hechizo(conjuroId).nivel });
const recargar = (p: PersonajeJugador) => hidratarPersonaje(EsquemaPersonajeJugador.parse(JSON.parse(JSON.stringify(deshidratarPersonaje(p)))), HECHIZOS_INICIALES);

describe("Intercesión divina 2024: catálogo, lanzamiento y recuperación", () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it("un fallo al determinar la espera no repite el conjuro; el reintento concurrente tira una sola vez", async () => {
    const gastado = consumir(crear(), "h_deseo");
    if (!gastado.permitido) throw new Error("La concesión de Deseo debe estar disponible.");
    usarAlmacenDM.setState({ personajes: [gastado.personaje], idPersonajeActivo: gastado.personaje.id });
    const emitir = vi.spyOn(lanzadorDados, "solicitarResultadoTirada").mockRejectedValueOnce(new Error("Emisión fallida simulada"));
    const registrar = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    await resolverRecuperacionDiferida(gastado.personaje.id, id);
    expect(registrar).toHaveBeenCalled();
    const actual = () => usarAlmacenDM.getState().personajes[0];
    expect(r(actual()).usosRestantes).toBe(0);
    expect(r(actual()).recuperacionDiferida?.estado).toBe("pendiente");
    emitir.mockResolvedValue({ rollId: "simulada", origen: "local", totales: [5] });
    await Promise.all([resolverRecuperacionDiferida(actual().id, id), resolverRecuperacionDiferida(actual().id, id)]);
    expect(emitir).toHaveBeenCalledTimes(2);
    expect(r(actual()).recuperacionDiferida).toEqual({ estado: "contando", restantes: 5 });
    await resolverRecuperacionDiferida(actual().id, id);
    expect(emitir).toHaveBeenCalledTimes(2);
    expect(r(actual()).usosRestantes).toBe(0);
  });
  it("propaga el contrato por carga, construcción y editor sin elegir ni aprender un conjuro", () => {
    const c = EsquemaDefinicionClaseJSON.parse(clerigoJSON);
    expect(c.rasgos.find(r => r.id === id)?.lanzamientoConRecurso?.costeFijo).toBe(1);
    const p = crear(10);
    expect(r(p).usosMaximos).toBe(1);
    expect(r(p).formulaDados).toBeUndefined();
    expect(r(p).lanzamientoConRecurso?.adicionales).toBeUndefined();
    expect(construirRasgoDesdeBorrador(crearBorradorRasgo(r(p)), r(p)).lanzamientoConRecurso).toEqual(r(p).lanzamientoConRecurso);
    expect(p.conjurosConocidosIds).not.toContain("h_deseo");
    expect(p.conjurosPreparadosIds).not.toContain("h_revivir");
  });

  it("acepta clérigo 0–5 no preparado y excluye otras listas, niveles, reacciones y solicitudes manipuladas", () => {
    const p = crear(10);
    expect(obtenerConcesionConRecurso(p, id, hechizo("h_taumaturgia"))?.coste).toBe(1);
    const candidato = HECHIZOS_INICIALES.find(h => h.nivel === 5 && h.clases?.includes("Clérigo") && h.tiempoLanzamiento !== "Reacción")!;
    expect(obtenerConcesionConRecurso(p, id, candidato)?.coste).toBe(1);
    expect(obtenerConcesionConRecurso(p, id, hechizo("h_bola-de-fuego"))).toBeUndefined();
    expect(obtenerConcesionConRecurso(p, id, hechizo("h_deseo"))).toBeUndefined();
    expect(obtenerConcesionConRecurso(p, id, { ...hechizo("h_bola-de-fuego"), clases: ["Clérigo"] })).toBeUndefined();
    expect(obtenerConcesionConRecurso(p, id, { ...candidato, nivel: 1 }, 1)).toBeUndefined();
    const reaccion = HECHIZOS_INICIALES.find(h => h.clases?.includes("Clérigo") && h.nivel <= 5 && h.tiempoLanzamiento.toLowerCase().includes("reacción"));
    if (reaccion) expect(obtenerConcesionConRecurso(p, id, reaccion)).toBeUndefined();
    expect(obtenerConcesionConRecurso(crear(9), id, candidato)).toBeUndefined();
    expect(obtenerConcesionConRecurso(p, id, candidato, candidato.nivel + 1)).toBeUndefined();
  });

  it("omite solo materiales, conserva concentración y usa Sabiduría sin gastar espacios, puntos ni concesiones permanentes", () => {
    const p = crear(10);
    const h = HECHIZOS_INICIALES.find(h => h.nivel > 0 && h.nivel <= 5 && h.clases?.includes("Clérigo")
      && h.concentracion && h.componentesSeleccionados.material)!;
    const s = aplicarConfiguracionConjurosRasgos(p, { ...solicitud(h.id), hechizo: h });
    expect(s.modificadorHabilidad).toBe(3);
    expect(s.hechizo.componentesSeleccionados).toEqual({ ...h.componentesSeleccionados, material: false });
    const contexto = { personajeActual: p };
    expect(validarLanzamiento(s, contexto).permitido).toBe(true);
    const preparado = prepararLanzamiento(s, contexto);
    expect(preparado.activarConcentracion).toBe(true);
    const gasto = consumirRecursoConjuro(p, preparado.gasto);
    expect(gasto.permitido).toBe(true);
    if (!gasto.permitido) return;
    expect(r(gasto.personaje).usosRestantes).toBe(0);
    for (const campo of ["espaciosConjuroGastados", "puntosConjuroGastados", "conjurosConocidosIds", "conjurosPreparadosIds"] as const)
      expect(gasto.personaje[campo]).toEqual(p[campo]);
    expect(consumir(gasto.personaje, h.id).permitido).toBe(false);
    expect(r(recargar(aplicarBuildClaseAPersonaje(gasto.personaje, "Clérigo", 10))).usosRestantes).toBe(0);
    expect(r(ejecutarDescansoCorto(gasto.personaje, 0).personajeActualizado).usosRestantes).toBe(0);
    expect(r(ejecutarDescansoLargo(gasto.personaje).personajeActualizado).usosRestantes).toBe(1);
  });

  it("Deseo requiere nivel 20; su espera pendiente y su contador sobreviven a reconstrucción y a cada descanso", () => {
    const p = crear();
    expect(obtenerConcesionConRecurso(p, id, hechizo("h_deseo"))?.formulaDescansos).toBe("2d4");
    const gasto = consumir(p, "h_deseo");
    expect(gasto.permitido).toBe(true);
    if (!gasto.permitido) return;
    let actual = recargar(aplicarBuildClaseAPersonaje(gasto.personaje, "Clérigo", 20));
    expect(r(actual).recuperacionDiferida).toEqual({ estado: "pendiente", formula: "2d4" });
    actual = ejecutarDescansoLargo(actual).personajeActualizado;
    expect(r(actual).usosRestantes).toBe(0);
    expect(establecerRecuperacionDiferida(actual, id, 1)).toBeUndefined();
    expect(establecerRecuperacionDiferida(actual, id, 9)).toBeUndefined();
    actual = establecerRecuperacionDiferida(actual, id, 3)!;
    expect(establecerRecuperacionDiferida(actual, id, 4)).toBeUndefined();
    expect(consumir({ ...actual, rasgos: actual.rasgos.map(r => r.id === id ? { ...r, usosRestantes: 1 } : r) }, "h_taumaturgia").permitido).toBe(false);
    for (const restantes of [2, 1]) {
      actual = recargar(ejecutarDescansoLargo(actual).personajeActualizado);
      expect(r(actual).recuperacionDiferida).toEqual({ estado: "contando", restantes });
      expect(r(actual).usosRestantes).toBe(0);
    }
    actual = ejecutarDescansoLargo(actual).personajeActualizado;
    expect(r(actual).recuperacionDiferida).toBeUndefined();
    expect(r(actual).usosRestantes).toBe(1);
    expect(consumir(actual, "h_taumaturgia").permitido).toBe(true);
  });
});
