import type { RasgoPersonaje, SelectorRasgo } from "@/tipos";

/** Conserva elecciones de selectores compatibles, incluidas las vacías intencionales. */
function fusionarSelector(nuevo: SelectorRasgo, existente?: SelectorRasgo): SelectorRasgo {
  const seleccion = existente?.valorActual ?? nuevo.valorActual ?? [];
  const contiene = (selector: SelectorRasgo, valor: string) => {
    const base = valor.split(/:|__/)[0];
    return selector.opciones.some((o) => o.id === valor || o.id === base);
  };
  // También reconoce opciones futuras declaradas cuando el guardado anterior está deshidratado.
  const valorActual = seleccion.filter((valor) => {
    if (nuevo.claveOpcionesDinamicas === "conjuros_catalogo") return true;
    const base = valor.split(/:|__/)[0];
    const futura = nuevo.opcionesDinamicas?.some(g => g.opciones.some(o => o.id === base));
    return contiene(nuevo, valor) || (!futura && (!existente || !contiene(existente, valor)));
  });
  return {
    ...nuevo,
    cambioDisponible: existente?.cambioDisponible ?? nuevo.cambioDisponible,
    valorActual: valorActual.slice(0, nuevo.maxSelecciones),
    opciones: [...nuevo.opciones, ...(nuevo.claveOpcionesDinamicas === "conjuros_catalogo"
      ? existente?.opciones.filter(o => valorActual.includes(o.id) && !nuevo.opciones.some(n => n.id === o.id)) ?? [] : [])].map((opcion) => {
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
  if (existente?.personalizado) return structuredClone(existente);
  // Solo ajustar por progresión cuando el máximo anterior pertenece a la tabla declarada.
  // Los contadores heredados arbitrarios mantienen su valor disponible, limitado al máximo actual.
  const maximoAnteriorValido =
    (nuevo.escaladoUsos?.tipo === "por_modificador" && (nuevo.usosMaximos ?? 0) > (existente?.usosMaximos ?? 0)) ||
    (nuevo.escaladoUsos?.tipo === "por_nivel" && nuevo.escaladoUsos.tabla?.some(f => f.valor === existente?.usosMaximos)) ||
    (Boolean(nuevo.escaladoUsos?.formula || nuevo.formulaEscalado) && (nuevo.usosMaximos ?? 0) > (existente?.usosMaximos ?? 0));
  const disponibles = existente?.usosRestantes !== undefined && maximoAnteriorValido && nuevo.usosMaximos !== undefined
    ? nuevo.usosMaximos - Math.max(0, (existente?.usosMaximos ?? nuevo.usosMaximos) - existente.usosRestantes)
    : existente?.usosRestantes;
  return {
    ...nuevo,
    dadosReserva: existente?.dadosReserva,
    resultadoTabla: existente?.resultadoTabla,
    resultadosTablaPendientes: existente?.resultadosTablaPendientes,
    recuperacionDescansoDisponible: existente?.recuperacionDescansoDisponible,
    selectores: nuevo.selectores?.map((s) => fusionarSelector(s, existente?.selectores?.find((a) => a.id === s.id))),
    vinculoArma: nuevo.vinculoArma ? { ...nuevo.vinculoArma, idInstancia: existente?.vinculoArma?.idInstancia } : undefined,
    condicionAlActivar: nuevo.condicionAlActivar ?? existente?.condicionAlActivar,
    restaurarUsosAlActivar: nuevo.restaurarUsosAlActivar ?? existente?.restaurarUsosAlActivar,
    usosRestantes: typeof disponibles === "number" && nuevo.usosMaximos !== undefined
      ? Math.max(0, Math.min(disponibles, nuevo.usosMaximos)) : nuevo.usosRestantes,
    activo: Boolean(nuevo.esActivable) === Boolean(existente?.esActivable)
      ? existente?.activo ?? nuevo.activo ?? !nuevo.esActivable : !nuevo.esActivable,
    dadosGuardados: existente?.dadosGuardados ? [...existente.dadosGuardados] : nuevo.dadosGuardados,
    oculto: existente?.oculto ?? nuevo.oculto ?? false,
    notas: existente?.notas ?? nuevo.notas
  };
}
