import type { ColaIniciativaTS } from '@/tipos/talespire';

export interface ReferenciaIniciativaFisica { orden: string[]; activo: string | null; inferirRonda: boolean }
export function seguirIniciativaFisica(cola: ColaIniciativaTS, anterior: ReferenciaIniciativaFisica | null,
  activoLocal: string | null, ronda: number, supervivientes: Set<string>) {
  const orden = cola.items.map(c => c.id);
  const activo = Number.isInteger(cola.activeItemIndex) ? orden[cola.activeItemIndex] : undefined;
  if (!activo) return { activo: activoLocal, ronda, referencia: null };
  const estructura = !anterior || JSON.stringify(orden) !== JSON.stringify(anterior.orden);
  const cambio = !anterior || activo !== anterior.activo;
  let nuevaRonda = ronda;
  if (anterior?.inferirRonda && !estructura && cambio && orden.length > 1) {
    const previo = orden.indexOf(anterior.activo ?? ''); const siguiente = orden.indexOf(activo);
    if (previo === orden.length - 1 && siguiente === 0) nuevaRonda++;
    else if (orden.length > 2 && previo === 0 && siguiente === orden.length - 1) nuevaRonda = Math.max(1, ronda - 1);
  }
  const elegido = !anterior ? activo : estructura
    ? activoLocal && supervivientes.has(activoLocal) ? activoLocal : activo
    : cambio ? activo : activoLocal;
  return { activo: elegido, ronda: nuevaRonda, referencia: { orden, activo,
    inferirRonda: !(anterior?.inferirRonda === false && !estructura && !cambio) } };
}
