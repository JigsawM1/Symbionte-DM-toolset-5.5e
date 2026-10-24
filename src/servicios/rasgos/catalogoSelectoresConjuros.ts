import type { HechizoBase, OpcionSelector, RasgoPersonaje, SelectorRasgo } from "@/tipos";

export function opcionesCatalogoConjuros(catalogo: readonly Pick<HechizoBase, "id" | "nombre" | "nivel" | "clases">[]): OpcionSelector[] {
  return catalogo.map(h => ({ id: h.id, nombre: h.nombre, descripcion: `Nivel ${h.nivel}`, datosConjuro: { nivel: h.nivel, clases: h.clases ?? [] } }));
}

/** La fuente declarada puede ampliarse con el catálogo efectivo sin depender del almacén. */
export function hidratarSelectorConjuros(s: SelectorRasgo, catalogo: Parameters<typeof opcionesCatalogoConjuros>[0]): SelectorRasgo {
  return s.claveOpcionesDinamicas === "conjuros_catalogo" ? { ...s, opciones: opcionesCatalogoConjuros(catalogo) } : s;
}

export function hidratarSelectoresConjuros(rasgos: RasgoPersonaje[], catalogo: Parameters<typeof opcionesCatalogoConjuros>[0]): RasgoPersonaje[] {
  return rasgos.map(r => r.selectores?.some(s => s.claveOpcionesDinamicas === "conjuros_catalogo")
    ? { ...r, selectores: r.selectores.map(s => hidratarSelectorConjuros(s, catalogo)) } : r);
}
