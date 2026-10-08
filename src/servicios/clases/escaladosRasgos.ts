import type { EfectoMecanicoRasgo, SelectorRasgo } from "@/tipos";
import { logger } from "@/utiles/logger";
import { evaluarExpresionNumericaSegura } from "@/servicios/evaluadorEfectosRasgos";


/**
 * Evalúa de forma segura fórmulas numéricas o expresiones ternarias de usos máximos
 * procedentes de definiciones TypeScript o catálogos JSON.
 * Ej: "(niv) => (niv >= 17 ? 6 : niv >= 12 ? 5 : niv >= 6 ? 4 : niv >= 3 ? 3 : 2)"
 * Ej: "1", "2", "niv"
 */
export function evaluarFormulaUsos(formula: string | null | undefined, nivel: number): number | undefined {
  if (!formula) return undefined;
  const numDirecto = Number(formula);
  if (!isNaN(numDirecto) && numDirecto > 0) return numDirecto;

  const niv = Math.max(1, Math.min(20, Math.floor(nivel) || 1));

  try {
    const cuerpo = formula.includes("=>") ? formula.split("=>")[1].trim() : formula;
    const cuerpoNormalizado = cuerpo.replace(/\b(nivel|level)\b/g, "niv");
    const regexTernario = /niv\s*(>=|>|<=|<|===|==)\s*(\d+)\s*\?\s*(\d+)/g;
    let match;
    while ((match = regexTernario.exec(cuerpoNormalizado)) !== null) {
      const op = match[1];
      const limite = parseInt(match[2], 10);
      const valor = parseInt(match[3], 10);

      let cumple = false;
      if (op === ">=" && niv >= limite) cumple = true;
      else if (op === ">" && niv > limite) cumple = true;
      else if (op === "<=" && niv <= limite) cumple = true;
      else if (op === "<" && niv < limite) cumple = true;
      else if ((op === "===" || op === "==") && niv === limite) cumple = true;

      if (cumple) return valor;
    }

    const partesDosPuntos = cuerpo.split(":");
    if (partesDosPuntos.length > 1) {
      const ultimo = partesDosPuntos[partesDosPuntos.length - 1].replace(/[()]/g, "").trim();
      const valDefecto = parseInt(ultimo, 10);
      if (!isNaN(valDefecto)) return valDefecto;
    }

    const exprConNivel = cuerpoNormalizado.replace(/\bniv\b/g, "nivel");
    const valorExpr = evaluarExpresionNumericaSegura(exprConNivel, { nivel: niv });
    if (valorExpr > 0) return valorExpr;
  } catch (error) {
    logger.warn(`[gestorClases] Error al evaluar formulaUsos: "${formula}"`, error);
  }

  return undefined;
}

/**
 * Resuelve todos los escalados declarativos de un rasgo según el nivel actual.
 * Esta función es GENÉRICA PURA: no conoce nombres de rasgos ni clases.
 * Reemplaza los bloques condicionales por nombre que existían en el builder.
 */
export function resolverEscaladosRasgo(
  r: {
    formulaDados?: string;
    recuperacion?: string;
    sincronizarEfectosConFormula?: boolean;
    escaladoFormulaDados?: Array<{ nivelMinimo: number; valor: string }>;
    escaladoUsos?: {
      tipo: "por_nivel" | "por_modificador";
      tabla?: Array<{ nivelMinimo: number; valor: number }>;
      modificador?: string;
      minimo?: number;
      formula?: string;
    };
    escaladoRecuperacion?: Array<{ nivelMinimo: number; valor: string }>;
    escaladoEfectos?: Array<{
      tipo: string;
      objetivo?: string;
      escalones: Array<{ nivelMinimo: number; valor: string | number }>;
    }>;
  },
  nivel: number,
  efectosBase: EfectoMecanicoRasgo[],
  selectoresBase: SelectorRasgo[]
): {
  formulaDados: string | undefined;
  usosEscalados: number | undefined;
  recuperacion: string | undefined;
  efectos: EfectoMecanicoRasgo[];
  selectores: SelectorRasgo[];
} {
  let formulaDados = r.formulaDados;
  let usosEscalados: number | undefined;
  let recuperacion = r.recuperacion;
  const efectos: EfectoMecanicoRasgo[] = JSON.parse(JSON.stringify(efectosBase));
  const selectores: SelectorRasgo[] = JSON.parse(JSON.stringify(selectoresBase));

  // 1. Escalado de fórmula de dados
  if (r.escaladoFormulaDados?.length) {
    const entrada = [...r.escaladoFormulaDados]
      .sort((a, b) => b.nivelMinimo - a.nivelMinimo)
      .find((e) => nivel >= e.nivelMinimo);
    if (entrada) formulaDados = entrada.valor;
  }

  // 2. Escalado de usos por tabla de nivel o fórmula semántica
  if (r.escaladoUsos?.tipo === "por_nivel") {
    const minimo = r.escaladoUsos.minimo ?? 1;
    if (r.escaladoUsos.tabla?.length) {
      const entrada = [...r.escaladoUsos.tabla]
        .sort((a, b) => b.nivelMinimo - a.nivelMinimo)
        .find((e) => nivel >= e.nivelMinimo);
      if (entrada) usosEscalados = Math.max(minimo, entrada.valor);
    } else if (r.escaladoUsos.formula) {
      const matchX = r.escaladoUsos.formula.match(/^nivel_x(\d+)$/);
      if (matchX) {
        const mult = parseInt(matchX[1], 10);
        usosEscalados = Math.max(minimo, nivel * mult);
      } else if (r.escaladoUsos.formula === "nivel") {
        usosEscalados = Math.max(minimo, nivel);
      } else if (r.escaladoUsos.formula === "nivel_mas_1") {
        usosEscalados = Math.max(minimo, nivel + 1);
      }
    }
  } else if (r.escaladoUsos?.tipo === "por_modificador") {
    usosEscalados = r.escaladoUsos.minimo ?? 1;
  }

  // 3. Escalado de recuperación
  if (r.escaladoRecuperacion?.length) {
    const entrada = [...r.escaladoRecuperacion]
      .sort((a, b) => b.nivelMinimo - a.nivelMinimo)
      .find((e) => nivel >= e.nivelMinimo);
    if (entrada) recuperacion = entrada.valor;
  }

  // 4. Escalado de efectos mecánicos (ej. Movimiento sin armadura: +10 a +30 ft)
  if (r.escaladoEfectos?.length) {
    for (const escEf of r.escaladoEfectos) {
      const entrada = [...escEf.escalones]
        .sort((a, b) => b.nivelMinimo - a.nivelMinimo)
        .find((e) => nivel >= e.nivelMinimo);
      if (entrada) {
        const ef = efectos.find(
          (e) => e.tipo === escEf.tipo && (!escEf.objetivo || e.objetivo === escEf.objetivo)
        );
        if (ef) {
          ef.valor = entrada.valor;
        }
      }
    }
  }

  // 5. Sincronizar efectos con la fórmula de dados resuelta
  if (r.sincronizarEfectosConFormula && formulaDados) {
    const tiposASincronizar = new Set(["dado_extra_dano", "ataque_desarmado", "bono_dano_fuerza", "dano_secundario"]);
    for (const ef of efectos) {
      if (typeof ef.tipo === "string" && tiposASincronizar.has(ef.tipo)) {
        ef.valor = formulaDados;
      }
    }
  }

  // 5. Selectores: opciones dinámicas y escalado de maxSelecciones
  for (const sel of selectores) {
    const opcionesDinamicas = sel.opcionesDinamicas as Array<{ nivelMinimo: number; opciones: Array<Record<string, unknown>> }> | undefined;
    if (opcionesDinamicas?.length) {
      const opcionesActuales = sel.opciones as Array<{ id: string }>;
      for (const grupo of opcionesDinamicas) {
        if (nivel >= grupo.nivelMinimo) {
          for (const op of grupo.opciones) {
            if (!opcionesActuales.some((o) => o.id === op.id)) {
              opcionesActuales.push(op as { id: string });
            }
          }
        }
      }
    }
    const escaladoMax = sel.escaladoMaxSelecciones as Array<{ nivelMinimo: number; valor: number }> | undefined;
    if (escaladoMax?.length) {
      const entrada = [...escaladoMax]
        .sort((a, b) => b.nivelMinimo - a.nivelMinimo)
        .find((e) => nivel >= e.nivelMinimo);
      if (entrada) {
        sel.maxSelecciones = entrada.valor;
        if (entrada.valor > 1) {
          sel.tipo = "multiple";
        }
      }
    }
    if (sel.etiqueta && /\(Nv\.?\s*1\s*-\s*\d+\)/i.test(sel.etiqueta)) {
      const nivelMaxEspacio = Math.min(9, Math.max(1, Math.ceil(nivel / 2)));
      sel.etiqueta = sel.etiqueta.replace(/\(Nv\.?\s*1\s*-\s*\d+\)/i, `(Nv. 1-${nivelMaxEspacio})`);
    }
  }

  return { formulaDados, usosEscalados, recuperacion, efectos, selectores };
}
