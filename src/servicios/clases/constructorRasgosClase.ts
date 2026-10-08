import type { RasgoPersonaje, EfectoMecanicoRasgo, SelectorRasgo, RecuperacionRasgo } from "@/tipos";
import { normalizarTextoClase, esRasgoPlaceholderSubclase, obtenerClasePorNombre, obtenerSubclasePorNombre } from "./catalogoClases";
import { esRasgoMejoraCaracteristica, esRasgoDonEpico, esRasgoEstiloCombate, crearSelectorDoteMejoraCaracteristica, crearSelectorDoteDonEpico, crearSelectorDoteEstiloCombate } from "./dotesClase";
import { evaluarFormulaUsos, resolverEscaladosRasgo } from "./escaladosRasgos";

/**
 * Obtiene los rasgos de clase y subclase correspondientes a un nivel específico.
 * El builder es GENÉRICO PURO: consume metadatos declarativos del catálogo.
 * No contiene bifurcaciones por nombre de rasgo ni de clase.
 */
export function obtenerRasgosClaseYSubclase(
  claseNombre: string,
  nivel: number,
  subclaseNombre?: string
): RasgoPersonaje[] {
  const clase = obtenerClasePorNombre(claseNombre);
  if (!clase) return [];

  const nivelSeguro = Math.max(1, Math.min(20, Math.floor(nivel) || 1));
  const rasgosResultado: RasgoPersonaje[] = [];

  // ── Función auxiliar para construir un RasgoPersonaje desde una plantilla ──
  function construirRasgo(
    r: import("@/constantes/rasgosDND55").PlantillaRasgoClase,
    id: string,
    fuente: string,
    origen: "clase" | "subclase"
  ): RasgoPersonaje {
    let usos: number | undefined = r.usosMaximos;
    if (r.tieneUsosLimitados) {
      if (typeof r.obtenerUsosMaximos === "function") {
        usos = r.obtenerUsosMaximos(nivelSeguro);
      } else if (r.formulaUsos) {
        usos = evaluarFormulaUsos(r.formulaUsos, nivelSeguro);
      }
    }

    const efectosBase: EfectoMecanicoRasgo[] = r.efectos ? [...r.efectos] : [];
    const selectoresBase: SelectorRasgo[] = r.selectores ? [...r.selectores] : [];

    const escalados = resolverEscaladosRasgo(r, nivelSeguro, efectosBase, selectoresBase);

    // Los usos escalados por tabla tienen precedencia sobre obtenerUsosMaximos
    const usosFinales = escalados.usosEscalados ?? usos;

    return {
      id,
      nombre: r.nombre,
      descripcion: r.descripcion,
      origen,
      fuente,
      subclase: r.subclase || (origen === "subclase" ? subclaseNombre : undefined),
      tipoAccion: r.tipoAccion,
      nivelRequerido: r.nivel,
      tieneUsosLimitados: !!r.tieneUsosLimitados,
      usosMaximos: usosFinales,
      usosRestantes: usosFinales,
      formulaEscalado: r.formulaEscalado || (r.formulaUsos ?? undefined),
      recuperacion: (escalados.recuperacion ?? r.recuperacion ?? "ninguno") as RecuperacionRasgo,
      formulaDados: escalados.formulaDados,
      escaladoFormulaDados: r.escaladoFormulaDados,
      escaladoUsos: r.escaladoUsos ? { ...r.escaladoUsos, minimo: r.escaladoUsos.minimo ?? 1 } : undefined,
      escaladoRecuperacion: r.escaladoRecuperacion,
      escaladoEfectos: r.escaladoEfectos ? JSON.parse(JSON.stringify(r.escaladoEfectos)) : undefined,
      sincronizarEfectosConFormula: !!r.sincronizarEfectosConFormula,
      personalizado: false,
      activo: r.esActivable ? false : true,
      esActivable: !!r.esActivable,
      condicionAlActivar: r.condicionAlActivar,
      duracionEfectoAlActivar: r.duracionEfectoAlActivar,
      restaurarUsosAlActivar: r.restaurarUsosAlActivar ? { ...r.restaurarUsosAlActivar } : undefined,
      autoDesactivar: !!r.autoDesactivar,
      autoDesactivarAlTirarDano: !!r.autoDesactivarAlTirarDano,
      dispararAlTirarIniciativa: !!r.dispararAlTirarIniciativa,
      requiereSinMovimiento: !!r.requiereSinMovimiento,
      ligadoA: r.ligadoA,
      requiereOpcion: r.requiereOpcion,
      gastarDePadre: !!r.gastarDePadre,
      heredarDadosPadre: !!r.heredarDadosPadre,
      reducirDadosPadre: !!r.reducirDadosPadre,
      conjurosOtorgados: r.conjurosOtorgados ? [...r.conjurosOtorgados] : [],
      conjuroGratuito: r.conjuroGratuito,
      recuperacionConjuro: r.recuperacionConjuro,
      noGastarAlTirarDados: !!r.noGastarAlTirarDados,
      categoriaMecanica: r.categoriaMecanica,
      costeFijo: r.costeFijo,
      efectos: escalados.efectos,
      selectores: escalados.selectores,
      tablaProgresion: r.tablaProgresion ? JSON.parse(JSON.stringify(r.tablaProgresion)) : undefined,
      recuperarEspacios: r.recuperarEspacios ? { ...r.recuperarEspacios } : undefined,
      dadosGuardados: r.dadosGuardados ? [...r.dadosGuardados] : [],
      guardaDadosTirada: !!r.guardaDadosTirada,
      recargaConEspacio: !!r.recargaConEspacio,
      multiplicadorRecargaEspacio: r.multiplicadorRecargaEspacio,
      recargaDescansoCorto: r.recargaDescansoCorto,
      notas: ""
    };
  }

  function fusionarExtension(
    padre: RasgoPersonaje,
    r: import("@/constantes/rasgosDND55").PlantillaRasgoClase,
    subclaseNombreItem?: string
  ) {
    const nivelesPrevios = padre.notas ? padre.notas.split(",") : [String(padre.nivelRequerido)];
    if (!nivelesPrevios.includes(String(r.nivel))) {
      nivelesPrevios.push(String(r.nivel));
    }
    padre.notas = nivelesPrevios.join(",");
    padre.fuente = subclaseNombreItem
      ? `${clase?.nombre || claseNombre} (${subclaseNombreItem} - Niveles ${nivelesPrevios.join(", ")})`
      : `${clase?.nombre || claseNombre} (Niveles ${nivelesPrevios.join(", ")})`;
    padre.descripcion += `\n\n***${r.nombre} (Nv. ${r.nivel}).*** ${r.descripcion}`;
    if (r.formulaDados) padre.formulaDados = r.formulaDados;
    if (r.guardaDadosTirada) padre.guardaDadosTirada = true;
    if (r.recargaConEspacio) padre.recargaConEspacio = true;
    if (r.multiplicadorRecargaEspacio) padre.multiplicadorRecargaEspacio = r.multiplicadorRecargaEspacio;
    if (r.recuperacion) padre.recuperacion = r.recuperacion as RecuperacionRasgo;
    if (r.recargaDescansoCorto !== undefined) padre.recargaDescansoCorto = r.recargaDescansoCorto;
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
            (s) => s.id === selExt.id || normalizarTextoClase(s.etiqueta) === normalizarTextoClase(selExt.etiqueta)
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

  // 1. Rasgos de Clase Base
  for (const r of clase.rasgos) {
    if (r.nivel <= nivelSeguro) {
      if (esRasgoPlaceholderSubclase(r.nombre)) {
        continue;
      }

      // Consolidación orgánica de rasgos de extensión ligados a otro rasgo (Decorator pattern genérico)
      if (r.categoriaMecanica === "extension" && r.ligadoA) {
        const ligNorm = normalizarTextoClase(r.ligadoA);
        const padre = rasgosResultado.find(
          (x) => normalizarTextoClase(x.id) === ligNorm || normalizarTextoClase(x.nombre) === ligNorm
        );
        if (padre) {
          fusionarExtension(padre, r);
        }
        continue;
      }

      const esMejora = esRasgoMejoraCaracteristica(r.nombre);
      const esDonEpico = esRasgoDonEpico(r.nombre);
      const esEstilo = esRasgoEstiloCombate(r.nombre);
      const id = r.id || (esMejora
        ? `rasgo_cls_${normalizarTextoClase(clase.id)}_mejora_de_caracteristica_nv${r.nivel}`
        : esDonEpico
        ? `rasgo_cls_${normalizarTextoClase(clase.id)}_don_epico_nv${r.nivel}`
        : esEstilo
        ? `rasgo_cls_${normalizarTextoClase(clase.id)}_estilo_de_combate_nv${r.nivel}`
        : `rasgo_cls_${normalizarTextoClase(clase.id)}_${normalizarTextoClase(r.nombre).replace(/\s+/g, "_")}`);
      const fuente = `${clase.nombre} (Nivel ${r.nivel})`;

      const rasgoConstruido = construirRasgo(r, id, fuente, "clase");

      if (esMejora) {
        rasgoConstruido.categoriaMecanica = "selector_informativo";
        if (!rasgoConstruido.selectores || rasgoConstruido.selectores.length === 0) {
          rasgoConstruido.selectores = [crearSelectorDoteMejoraCaracteristica(clase.id, r.nivel)];
        }
      } else if (esDonEpico) {
        rasgoConstruido.categoriaMecanica = "selector_informativo";
        if (!rasgoConstruido.selectores || rasgoConstruido.selectores.length === 0) {
          rasgoConstruido.selectores = [crearSelectorDoteDonEpico(clase.id, r.nivel, r.descripcion)];
        }
      } else if (esEstilo) {
        rasgoConstruido.categoriaMecanica = "selector_informativo";
        if (!rasgoConstruido.selectores || rasgoConstruido.selectores.length === 0) {
          rasgoConstruido.selectores = [crearSelectorDoteEstiloCombate(clase.id, r.nivel)];
        }
      }

      rasgosResultado.push(rasgoConstruido);
    }
  }

  // 2. Rasgos de Subclase
  if (subclaseNombre) {
    const subclase = obtenerSubclasePorNombre(clase.nombre, subclaseNombre);
    if (subclase) {
      for (const r of subclase.rasgos) {
        if (r.nivel <= nivelSeguro) {
          // Consolidación orgánica de rasgos de extensión en subclases (Decorator pattern genérico)
          if (r.categoriaMecanica === "extension" && r.ligadoA) {
            const ligNorm = normalizarTextoClase(r.ligadoA);
            const padre = rasgosResultado.find(
              (x) => normalizarTextoClase(x.id) === ligNorm || normalizarTextoClase(x.nombre) === ligNorm
            );
            if (padre) {
              fusionarExtension(padre, r, subclase.nombre);
            }
            continue;
          }

          const id = r.id || `rasgo_sub_${normalizarTextoClase(subclase.id)}_${normalizarTextoClase(r.nombre).replace(/\s+/g, "_")}`;
          const fuente = `${clase.nombre} (${subclase.nombre} - Nivel ${r.nivel})`;

          rasgosResultado.push(construirRasgo(r, id, fuente, "subclase"));
        }
      }
    }
  }

  // 3. Post-proceso genérico: heredar dados de padre
  for (const r of rasgosResultado) {
    if (r.heredarDadosPadre && r.ligadoA && !r.formulaDados) {
      const ligNorm = normalizarTextoClase(r.ligadoA);
      const padre = rasgosResultado.find(
        (x) => normalizarTextoClase(x.id) === ligNorm || normalizarTextoClase(x.nombre) === ligNorm
      );
      if (padre?.formulaDados) {
        r.formulaDados = padre.formulaDados;
      }
      if (padre?.escaladoFormulaDados) {
        r.escaladoFormulaDados = padre.escaladoFormulaDados;
      }
    }
  }

  return rasgosResultado;
}

/**
 * Obtiene los conjuros siempre preparados y trucos otorgados por una subclase hasta un nivel dado.
 */
export function obtenerConjurosSubclaseBuild(
  claseNombre: string,
  subclaseNombre: string,
  nivel: number,
  varianteSubclase?: string
): { conjuros: string[]; trucos: string[] } {
  const subclase = obtenerSubclasePorNombre(claseNombre, subclaseNombre);
  if (!subclase) {
    return { conjuros: [], trucos: [] };
  }

  const nivelSeguro = Math.max(1, Math.min(20, Math.floor(nivel) || 1));
  const conjurosSet = new Set<string>();
  const trucosSet = new Set<string>();

  let progresion = subclase.progresionConjuros || [];
  if (subclase.variantesConjuros && varianteSubclase) {
    const varNorm = normalizarTextoClase(varianteSubclase);
    for (const [claveVar, progVar] of Object.entries(subclase.variantesConjuros)) {
      if (normalizarTextoClase(claveVar).includes(varNorm) || varNorm.includes(normalizarTextoClase(claveVar))) {
        progresion = progVar;
        break;
      }
    }
  }

  for (const entrada of progresion) {
    if (nivelSeguro >= entrada.nivelClase) {
      (entrada.conjuros || []).forEach((c) => conjurosSet.add(c));
      (entrada.trucos || []).forEach((t) => trucosSet.add(t));
    }
  }

  return {
    conjuros: Array.from(conjurosSet),
    trucos: Array.from(trucosSet)
  };
}
