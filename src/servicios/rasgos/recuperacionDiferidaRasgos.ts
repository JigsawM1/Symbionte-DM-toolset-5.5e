import type { PersonajeJugador } from "@/tipos";

/** El resultado se acepta una sola vez y dentro del rango de la fórmula que quedó guardada. */
export function establecerRecuperacionDiferida(pj: PersonajeJugador, idRasgo: string, resultado: number): PersonajeJugador | undefined {
  const r = pj.rasgos.find(r => r.id === idRasgo);
  if (r?.recuperacionDiferida?.estado !== "pendiente") return;
  const dado = r.recuperacionDiferida.formula.match(/^(\d+)d(\d+)$/);
  if (!dado || !Number.isInteger(resultado) || resultado < Number(dado[1]) || resultado > Number(dado[1]) * Number(dado[2])) return;
  return { ...pj, rasgos: pj.rasgos.map(x => x === r ? { ...x,
    recuperacionDiferida: { estado: "contando", restantes: resultado } } : x) };
}
