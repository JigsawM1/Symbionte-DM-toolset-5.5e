import type { HechizoBase, OpcionSelector, RasgoPersonaje, SelectorRasgo } from "@/tipos";

export function opcionesCatalogoConjuros(catalogo: readonly Pick<HechizoBase, "id" | "nombre" | "nivel" | "clases">[]): OpcionSelector[] {
  return catalogo.map(h => ({ id: h.id, nombre: h.nombre, descripcion: `Nivel ${h.nivel}`, datosConjuro: { nivel: h.nivel, clases: h.clases ?? [] } }));
}

/** La fuente declarada puede ampliarse con el catálogo efectivo sin depender del almacén. */
export function hidratarSelectorConjuros(s: SelectorRasgo, catalogo: Parameters<typeof opcionesCatalogoConjuros>[0]): SelectorRasgo {
  if (s.claveOpcionesDinamicas === "conjuros_catalogo") return { ...s, opciones: opcionesCatalogoConjuros(catalogo) };
  if (!s.opciones.some(o => o.selectores?.length)) return s;
  return { ...s, opciones: s.opciones.map(o => o.selectores?.length
    ? { ...o, selectores: o.selectores.map((anidado: SelectorRasgo) => hidratarSelectorConjuros(anidado, catalogo)) } : o) };
}

export function hidratarSelectoresConjuros(rasgos: RasgoPersonaje[], catalogo: Parameters<typeof opcionesCatalogoConjuros>[0]): RasgoPersonaje[] {
  return rasgos.map(r => {
    const selectores = r.selectores?.map(s => hidratarSelectorConjuros(s, catalogo));
    return selectores?.some((s, i) => s !== r.selectores?.[i]) ? { ...r, selectores } : r;
  });
}
