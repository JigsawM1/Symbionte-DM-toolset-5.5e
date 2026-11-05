import type {
  PersonajeJugador,
  RasgoPersonaje,
  ResultadoSubtirada
} from "@/tipos";
import { ts } from "@/utiles/TaleSpireAdapter";
import { solicitarResultadoTirada } from "@/utiles/lanzadorDados";
import { obtenerRasgosVinculadosTabla, type FilaTablaRasgo } from "@/servicios/rasgos/tablasAleatoriasRasgos";

export type EntradaMagiaSalvaje = FilaTablaRasgo & {
  titulo: string;
  badge: string;
};

export function obtenerEntradasMagiaSalvaje(filas: readonly FilaTablaRasgo[]): EntradaMagiaSalvaje[] {
  return filas.map(f => ({ ...f, titulo: f.titulo ?? f.id, badge: f.badge ?? "" }));
}

export function buscarEntradaPorTirada(tirada: number, entradas: readonly EntradaMagiaSalvaje[]): EntradaMagiaSalvaje | undefined {
  if (tirada < 1 || tirada > 100) return undefined;
  return entradas.find((e) => tirada >= e.desde && tirada <= e.hasta);
}

/** El 10 del d10 representa cero unidades; 00 y 10 representan el percentil 100. */
export function combinarPercentil(decenas: number, unidades: number): number {
  if (!Number.isInteger(decenas) || decenas < 0 || decenas > 100 || decenas % 10 !== 0
    || !Number.isInteger(unidades) || unidades < 1 || unidades > 10) {
    throw new Error("Resultado de dados percentiles inválido.");
  }
  return (decenas % 100 + unidades % 10) || 100;
}

export async function solicitarPercentiles(cantidad: 1 | 2, signal?: AbortSignal, azar = Math.random) {
  const nativo = ts.estaDisponible;
  const res = await solicitarResultadoTirada({
    etiqueta: cantidad === 2 ? "Caos controlado" : "Oleada de magia salvaje",
    grupos: Array.from({ length: cantidad }, (_, i) => [
      { nombre: `Percentil ${i + 1} · decenas`, formula: nativo ? "1d100" : "1d10" },
      { nombre: `Percentil ${i + 1} · unidades`, formula: "1d10" }
    ]).flat(),
    signal,
    azarLocal: azar
  });
  if (res.totales.length !== cantidad * 2) throw new Error("Faltan resultados de los dados percentiles.");
  return {
    origen: res.origen,
    tiradas: Array.from({ length: cantidad }, (_, i) => combinarPercentil(
      res.origen === "local" ? (res.totales[i * 2] - 1) * 10 : res.totales[i * 2],
      res.totales[i * 2 + 1]
    ))
  };
}

export function obtenerUltimoResultadoMagiaSalvaje(pj: PersonajeJugador, idTabla: string) {
  return obtenerRasgosVinculadosTabla(pj, idTabla).filter(r => r.resultadoTabla).reduce<RasgoPersonaje | undefined>(
    (ultimo, r) => !ultimo || Number(r.resultadoTabla?.fecha ?? 0) >= Number(ultimo.resultadoTabla?.fecha ?? 0) ? r : ultimo,
    undefined
  );
}

export function obtenerEnviosPendientesMagiaSalvaje(pj: PersonajeJugador, idTabla: string) {
  return obtenerRasgosVinculadosTabla(pj, idTabla).flatMap(r =>
    (r.resultadosTablaPendientes ?? []).map(resultado => ({ idRasgo: r.id, resultado })));
}

export function formatearSobrecargaParaChat(
  personajeNombre: string,
  tiradaExacta: number | undefined,
  entrada: EntradaMagiaSalvaje,
  subtiradas: ResultadoSubtirada[] = []
): string {
  const rango = `${entrada.desde.toString().padStart(2, "0")}-${entrada.hasta === 100 ? "00" : entrada.hasta.toString().padStart(2, "0")}`;
  let texto = ` SOBRECARGA DE MAGIA SALVAJE · ${personajeNombre}\n`;
  texto += `${tiradaExacta === undefined ? "Elección de fila" : `Percentil: ${tiradaExacta}`} (${rango}) → ${entrada.titulo}\n`;
  texto += `${entrada.texto}\n`;

  for (const sub of subtiradas) {
    texto += sub.opcionElegida ? ` ${sub.formula}: [${sub.total}] → ${sub.opcionElegida}\n`
      : ` ${sub.formula}: Total ${sub.total}\n`;
  }

  if (entrada.duracion) {
    texto += `⏳ Duración: ${entrada.duracion}`;
  }
  return texto.trim();
}

/** Resuelve las subtiradas declaradas de una fila de forma asíncrona mediante dados físicos o locales. */
export async function resolverSubtiradasDeFila(
  entrada: EntradaMagiaSalvaje,
  signal?: AbortSignal,
  azar = Math.random
): Promise<ResultadoSubtirada[]> {
  const resultados: ResultadoSubtirada[] = [];

  let valorPrimerResultado: number | undefined;

  for (const sub of entrada.subtiradas ?? []) {
    // Si la subtirada depende de un resultado anterior condicional (ej. fila 97)
    if (sub.siResultado !== undefined && sub.siResultado !== valorPrimerResultado) {
      continue;
    }

    const res = await solicitarResultadoTirada({
      etiqueta: sub.titulo ?? `Subtirada ${sub.formula}`,
      grupos: [{ nombre: sub.titulo ?? "Subtirada", formula: sub.formula }],
      signal,
      azarLocal: azar
    });

    const total = res.totales[0] ?? 1;
    valorPrimerResultado ??= total;

    const opcionElegida = sub.opciones?.find((o) => o.numero === total)?.texto;

    resultados.push({
      formula: sub.formula,
      total,
      proposito: sub.proposito,
      opcionElegida
    });
  }

  return resultados;
}
