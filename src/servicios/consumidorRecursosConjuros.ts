import { buscarRasgoConjuroGratuito } from "./rasgos/conjurosGratuitosRasgos";
import { resolverIdRasgoObjetivoGasto, calcularUsosMaximosRasgo } from "./evaluadorEfectosRasgos";
import type { PersonajeJugador } from '@/tipos';
import type { InstruccionGasto } from './servicioLanzamientoConjuros';

export type ResultadoConsumoConjuro = { permitido: true; personaje: PersonajeJugador } | { permitido: false; motivo: string };
/** Valida el estado vigente y devuelve la nueva ficha en una única operación síncrona. */
export function consumirRecursoConjuro(pj: PersonajeJugador, gasto: InstruccionGasto): ResultadoConsumoConjuro {
  const insuficiente = { permitido: false as const, motivo: 'No quedan recursos suficientes para lanzar este conjuro.' };
  let personaje = pj;
  switch (gasto.tipo) {
    case 'ninguno': break;
    case 'espacio': {
      const clave = String(gasto.nivel);
      const usados = pj.espaciosConjuroGastados[clave] ?? 0;
      if ((pj.espaciosConjuroMaximos[clave] ?? 0) <= usados) return insuficiente;
      personaje = { ...pj, espaciosConjuroGastados: { ...pj.espaciosConjuroGastados, [clave]: usados + 1 } };
      break;
    }
    case 'puntos':
      if (!Number.isFinite(gasto.cantidad) || gasto.cantidad <= 0 || pj.puntosConjuroMaximos - pj.puntosConjuroGastados < gasto.cantidad) return insuficiente;
      personaje = { ...pj, puntosConjuroGastados: pj.puntosConjuroGastados + gasto.cantidad };
      break;
    case 'pacto':
      if (pj.espaciosPactoGastados >= pj.espaciosPactoMaximos) return insuficiente;
      personaje = { ...pj, espaciosPactoGastados: pj.espaciosPactoGastados + 1 };
      break;
    case 'arcanoMistico':
      if (pj.arcanoMisticoGastados.includes(String(gasto.nivel))) return insuficiente;
      personaje = { ...pj, arcanoMisticoGastados: [...pj.arcanoMisticoGastados, String(gasto.nivel)] };
      break;
    case 'cargasObjeto': {
      const objeto = pj.inventario.find(o => o.idInstancia === gasto.objetoInstanciaId);
      const cargas = objeto?.cargasActuales ?? objeto?.cargasMaximas ?? 0;
      if (!objeto || !Number.isFinite(gasto.cantidad) || gasto.cantidad < 0 || cargas < gasto.cantidad) return insuficiente;
      personaje = { ...pj, inventario: pj.inventario.map(o => o === objeto ? { ...o, cargasActuales: cargas - gasto.cantidad } : o) };
      break;
    }
    case 'gratuitoInnato': {
      const rasgo = buscarRasgoConjuroGratuito(pj, gasto.hechizoId);
      if (!rasgo) return insuficiente;
      if (!rasgo.tieneUsosLimitados) break;
      const idRecurso = resolverIdRasgoObjetivoGasto(rasgo, pj.rasgos);
      const recursos = pj.rasgos.filter(r => r.id === idRecurso || (rasgo.gastarDePadre && r.id === rasgo.id));
      if (!recursos.length || recursos.some(r => (r.usosRestantes ?? calcularUsosMaximosRasgo(r, pj)) <= 0)) return insuficiente;
      personaje = { ...pj, rasgos: pj.rasgos.map(r => recursos.includes(r) ? { ...r, usosRestantes: (r.usosRestantes ?? calcularUsosMaximosRasgo(r, pj)) - 1 } : r) };
      break;
    }
  }
  return { permitido: true, personaje };
}
