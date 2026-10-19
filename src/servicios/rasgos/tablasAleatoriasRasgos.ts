import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";

type ConfiguracionTabla = NonNullable<RasgoPersonaje["tablaAleatoria"]>;
export type FilaTablaRasgo = NonNullable<ConfiguracionTabla["filas"]>[number];

export function obtenerTablaRasgo(pj: PersonajeJugador, r: RasgoPersonaje) {
  const cfg = r.tablaAleatoria;
  if (!cfg) return;
  const base = cfg.idRasgoTabla ? pj.rasgos.find(x => x.id === cfg.idRasgoTabla)?.tablaAleatoria : cfg;
  if (!base?.filas?.length) return;
  const filas = cfg.excluirUltima ? base.filas.slice(0, -1) : base.filas;
  return { ...cfg, tiradas: cfg.idRasgoTabla && cfg.modo !== "elegir" ? base.tiradas : cfg.tiradas, filas };
}

/** Azar inyectable: las subtiradas solo se resuelven después de elegir la fila definitiva. */
export function tirarFilasTabla(cfg: ConfiguracionTabla, azar = Math.random): { tirada: number; fila: FilaTablaRasgo }[] {
  return Array.from({ length: cfg.tiradas }, () => {
    const tirada = 1 + Math.floor(azar() * cfg.dado);
    const fila = cfg.filas?.find(f => tirada >= f.desde && tirada <= f.hasta);
    if (!fila) throw new Error("La tabla no cubre el resultado obtenido.");
    return { tirada, fila };
  });
}

export function resolverFilaTabla(fila: FilaTablaRasgo, azar = Math.random): string {
  let primero: number | undefined;
  const resultados: string[] = [];
  for (const s of fila.subtiradas ?? []) {
    if (s.siResultado !== undefined && s.siResultado !== primero) continue;
    const [cantidad, caras] = s.formula.split("d").map(Number);
    if (cantidad < 1 || cantidad > 100 || caras < 2 || caras > 100) throw new Error("Fórmula de subtirada inválida.");
    const valores = Array.from({ length: cantidad }, () => 1 + Math.floor(azar() * caras));
    const total = valores.reduce((a, b) => a + b, 0);
    primero ??= total;
    resultados.push(`${s.formula}: ${valores.join(" + ")} = ${total}`);
  }
  return `${fila.desde}–${fila.hasta}: ${fila.texto}${resultados.length ? `\nSubtiradas: ${resultados.join("; ")}` : ""}`;
}
