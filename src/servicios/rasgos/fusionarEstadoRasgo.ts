import type { RasgoPersonaje, SelectorRasgo } from "@/tipos";

/** Conserva elecciones de selectores compatibles, incluidas las vacías intencionales. */
function fusionarSelector(nuevo: SelectorRasgo, existente?: SelectorRasgo): SelectorRasgo {
  const seleccion = existente?.valorActual ?? nuevo.valorActual ?? [];
  const contiene = (selector: SelectorRasgo, valor: string) => {
    const base = valor.split(/:|__/)[0];
    return selector.opciones.some((o) => o.id === valor || o.id === base);
  };
  // Solo se retiran opciones que el catálogo anterior reconocía y el nuevo eliminó.
  const valorActual = seleccion.filter((valor) => !existente || !contiene(existente, valor) || contiene(nuevo, valor));
  return {
    ...nuevo,
    valorActual: [...valorActual],
    opciones: nuevo.opciones.map((opcion) => {
      const anterior = existente?.opciones.find((o) => o.id === opcion.id);
      return {
        ...opcion,
        selectores: opcion.selectores?.map((selector) =>
          fusionarSelector(selector, anterior?.selectores?.find((s) => s.id === selector.id)))
      };
    })
  };
}

/** La plantilla aporta reglas; el personaje conserva exclusivamente su estado mutable. */
export function fusionarEstadoRasgo(nuevo: RasgoPersonaje, existente?: RasgoPersonaje): RasgoPersonaje {
  return {
    ...nuevo,
    selectores: nuevo.selectores?.map((s) => fusionarSelector(s, existente?.selectores?.find((a) => a.id === s.id))),
    condicionAlActivar: nuevo.condicionAlActivar ?? existente?.condicionAlActivar,
    restaurarUsosAlActivar: nuevo.restaurarUsosAlActivar ?? existente?.restaurarUsosAlActivar,
    usosRestantes: typeof existente?.usosRestantes === "number" && nuevo.usosMaximos !== undefined
      ? Math.max(0, Math.min(existente.usosRestantes, nuevo.usosMaximos)) : nuevo.usosRestantes,
    activo: existente?.activo ?? nuevo.activo ?? !nuevo.esActivable,
    dadosGuardados: existente?.dadosGuardados ? [...existente.dadosGuardados] : nuevo.dadosGuardados,
    notas: existente?.notas ?? nuevo.notas
  };
}
