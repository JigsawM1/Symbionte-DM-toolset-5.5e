import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { evaluarExpresionNumericaSegura, resolverFormulaDinamica } from "./evaluadorExpresionesRasgos";

const pendientes = new Set<string>();

/** La reserva se gasta una sola vez y solo después de aceptar la tirada. */
export async function emitirCuracionConDados(pj: PersonajeJugador, rasgo: RasgoPersonaje, dados: number,
  emitir: (formula: string, propio: boolean) => Promise<boolean>, consumir: (cantidad: number) => void): Promise<boolean> {
  const cfg = rasgo.tiradaCuracion ?? rasgo.tiradaCuracionManual;
  const caras = rasgo.formulaDados?.match(/^1d(\d+)$/)?.[1];
  const restantes = rasgo.usosRestantes ?? rasgo.usosMaximos ?? 0;
  const maximo = cfg ? evaluarExpresionNumericaSegura(resolverFormulaDinamica(cfg.maxDados, pj, rasgo.fuente, rasgo)) : 0;
  if (!cfg || !caras || !Number.isInteger(dados) || dados < 1 || dados > restantes || dados > maximo || pendientes.has(pj.id)) return false;
  pendientes.add(pj.id);
  try {
    const emitida = await emitir(`${dados}d${caras}`, rasgo.tiradaCuracion?.destino === "propio");
    if (emitida) consumir(dados);
    return emitida;
  } finally { pendientes.delete(pj.id); }
}
