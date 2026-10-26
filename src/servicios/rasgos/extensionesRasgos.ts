import type { RasgoPersonaje, RecuperacionRasgo } from "@/tipos";
import { normalizar, resolverRasgoPadre } from "./utilidadesRasgos";

export function fusionarExtensionRasgo(
    padre: RasgoPersonaje,
    r: import("@/constantes/rasgosDND55").PlantillaRasgoClase,
    claseNombre: string,
    subclaseNombreItem?: string
  ) {
    const nivelesPrevios = padre.notas ? padre.notas.split(",") : [String(padre.nivelRequerido)];
    if (!nivelesPrevios.includes(String(r.nivel))) {
      nivelesPrevios.push(String(r.nivel));
    }
    padre.notas = nivelesPrevios.join(",");
    padre.fuente = padre.origen === "subclase" && subclaseNombreItem
      ? `${claseNombre} (${subclaseNombreItem} - Niveles ${nivelesPrevios.join(", ")})`
      : `${claseNombre} (Niveles ${nivelesPrevios.join(", ")})`;
    padre.descripcion += `\n\n***${r.nombre} (Nv. ${r.nivel}).*** ${r.descripcion}`;
    if (r.conjurosOtorgados) padre.conjurosOtorgados = [...new Set([...(padre.conjurosOtorgados ?? []), ...r.conjurosOtorgados])];
    if (r.tablaAleatoria) padre.tablaAleatoria = { ...padre.tablaAleatoria, ...r.tablaAleatoria };
    if (r.formulaDados) padre.formulaDados = r.formulaDados;
    if (r.lanzamientoConRecurso) padre.lanzamientoConRecurso = structuredClone(r.lanzamientoConRecurso);
    if (r.resolucionAsistida) padre.resolucionAsistida = { ...padre.resolucionAsistida, ...structuredClone(r.resolucionAsistida) };
    if (r.curacionAlFinalizar) padre.curacionAlFinalizar = structuredClone(r.curacionAlFinalizar);
    if (r.curacionConjuros) padre.curacionConjuros = { ...padre.curacionConjuros, ...r.curacionConjuros };
    if (padre.sincronizarEfectosConFormula && padre.formulaDados) {
      padre.efectos = padre.efectos?.map(e => ["dado_extra_dano", "dano_secundario", "ataque_desarmado", "bono_dano_fuerza"].includes(e.tipo)
        ? { ...e, valor: padre.formulaDados! } : e);
    }
    if (r.activacionAlternativa) padre.activacionAlternativa = { ...r.activacionAlternativa };
    if (r.recuperarPactoAlUsar) padre.recuperarPactoAlUsar = r.recuperarPactoAlUsar;
    if (r.guardaDadosTirada) padre.guardaDadosTirada = true;
    if (r.recargaConEspacio) padre.recargaConEspacio = true;
    if (r.recuperarUsosConEspacio !== undefined) padre.recuperarUsosConEspacio = r.recuperarUsosConEspacio;
    if (r.nivelMinimoRecuperarUsosConEspacio !== undefined) padre.nivelMinimoRecuperarUsosConEspacio = r.nivelMinimoRecuperarUsosConEspacio;
    if (r.multiplicadorRecargaEspacio) padre.multiplicadorRecargaEspacio = r.multiplicadorRecargaEspacio;
    if (r.recuperacion) padre.recuperacion = r.recuperacion as RecuperacionRasgo;
    if (r.recargaDescansoCorto !== undefined) padre.recargaDescansoCorto = r.recargaDescansoCorto;
    if (r.desactivarConCondiciones !== undefined) padre.desactivarConCondiciones = [...r.desactivarConCondiciones];
    if (r.desactivarConArmaduraPesada !== undefined) padre.desactivarConArmaduraPesada = r.desactivarConArmaduraPesada;
    if (r.eliminarCondicionesAlActivar) padre.eliminarCondicionesAlActivar = [...new Set([...(padre.eliminarCondicionesAlActivar ?? []), ...r.eliminarCondicionesAlActivar])];
    if (r.tipoAccion && r.tipoAccion !== "pasivo") padre.tipoAccion = r.tipoAccion;
    if (Array.isArray(r.efectos) && r.efectos.length > 0) {
      padre.efectos = [...(padre.efectos || []), ...JSON.parse(JSON.stringify(r.efectos))];
    }
    if (Array.isArray(r.selectores) && r.selectores.length > 0) {
      if (!Array.isArray(padre.selectores) || padre.selectores.length === 0) {
        padre.selectores = JSON.parse(JSON.stringify(r.selectores));
      } else {
        for (const selExt of r.selectores) {
          const selPadre = padre.selectores.find(
            (s) => s.id === selExt.id || normalizar(s.etiqueta) === normalizar(selExt.etiqueta)
          );
          if (selPadre) {
            if (Array.isArray(selExt.opciones)) {
              const idsExistentes = new Set((selPadre.opciones || []).map((o) => o.id));
              for (const op of selExt.opciones) {
                if (!idsExistentes.has(op.id)) {
                  idsExistentes.add(op.id);
                  selPadre.opciones.push(JSON.parse(JSON.stringify(op)));
                }
              }
            }
            if (selExt.maxSelecciones && selExt.maxSelecciones > (selPadre.maxSelecciones || 1)) {
              selPadre.maxSelecciones = selExt.maxSelecciones;
              if (selExt.maxSelecciones > 1) {
                selPadre.tipo = "multiple";
              }
            }
          } else {
            padre.selectores.push(JSON.parse(JSON.stringify(selExt)));
          }
        }
      }
    }
  }


/** Proyección efectiva; conserva las declaraciones y el estado original para poder editarlos. */
export function resolverExtensionesRasgos(rasgos: RasgoPersonaje[], nivel: number): RasgoPersonaje[] {
  const resultado = rasgos.filter(r => r.categoriaMecanica !== "extension");
  const copiados = new Set<RasgoPersonaje>();
  const extensiones = rasgos.filter(r => r.categoriaMecanica === "extension" && r.activo !== false && (r.nivelRequerido ?? 1) <= nivel)
    .sort((a, b) => (a.nivelRequerido ?? 1) - (b.nivelRequerido ?? 1));
  for (const r of extensiones) {
    let padre = resolverRasgoPadre(r, resultado);
    if (!padre) continue;
    // Solo la fusión escribe en el padre. El resto de la proyección es de lectura.
    if (!copiados.has(padre)) {
      const indice = resultado.indexOf(padre);
      padre = structuredClone(padre);
      resultado[indice] = padre;
      copiados.add(padre);
    }
    fusionarExtensionRasgo(padre, { ...r, nivel: r.nivelRequerido ?? 1, recuperacion: r.recuperacion === "ninguno" ? undefined : r.recuperacion }, padre.fuente, padre.subclase);
  }
  return resultado;
}
