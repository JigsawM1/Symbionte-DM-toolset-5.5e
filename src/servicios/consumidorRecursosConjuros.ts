import { obtenerConcesionConRecurso } from "./rasgos/lanzamientoRecursoRasgos";
import { buscarRasgoConjuroGratuito, evaluarRecursosLanzamientoGratuito } from "./rasgos/conjurosGratuitosRasgos";
import { obtenerSelectoresArcanos } from "./rasgos/arcanosMisticosRasgos";
import { calcularUsosMaximosRasgo } from "./evaluadorEfectosRasgos";
import type { PersonajeJugador } from '@/tipos';
import type { InstruccionGasto } from './servicioLanzamientoConjuros';
import { consumirLanzamientoEstado } from "./rasgos/lanzamientoEstadoRasgo";
import { registrarAutocuracionConjuro } from "./rasgos/curacionDeclarativa";

export type ResultadoConsumoConjuro = { permitido: true; personaje: PersonajeJugador } | { permitido: false; motivo: string };

/** Valida el estado vigente y devuelve la nueva ficha en una única operación síncrona. */
export function consumirRecursoConjuro(pj: PersonajeJugador, gasto: InstruccionGasto): ResultadoConsumoConjuro {
  const insuficiente = { permitido: false as const, motivo: 'No quedan recursos suficientes para lanzar este conjuro.' };
  let personaje = pj;
  switch (gasto.tipo) {
    case 'estadoRasgo': {
      const nuevo = consumirLanzamientoEstado(pj, gasto.idRasgo, gasto.hechizo, gasto.nivel, gasto.ronda);
      return nuevo ? { permitido: true, personaje: nuevo } : insuficiente;
    }
    case 'recursoRasgo': {
      const cfg = obtenerConcesionConRecurso(pj, gasto.idRasgo, gasto.hechizo, gasto.nivel);
      const disponibles = cfg ? (cfg.recurso.usosRestantes ?? cfg.recurso.usosMaximos ?? calcularUsosMaximosRasgo(cfg.recurso, pj)) : 0;
      if (!cfg || cfg.recurso.recuperacionDiferida || disponibles < cfg.coste) return insuficiente;
      personaje = { ...pj, rasgos: pj.rasgos.map(r => r.id === cfg.recurso.id ? { ...r, usosRestantes: disponibles - cfg.coste,
        recuperacionDiferida: cfg.formulaDescansos ? { estado: "pendiente", formula: cfg.formulaDescansos } : r.recuperacionDiferida } : r) };
      break;
    }
    case 'ninguno': break;
    case 'espacio': {
      const clave = String(gasto.nivel);
      const adicionales = pj.espaciosConjuroAdicionales?.[clave] ?? 0;
      if (adicionales > 0) {
        personaje = { ...pj, espaciosConjuroAdicionales: { ...pj.espaciosConjuroAdicionales, [clave]: adicionales - 1 } };
        break;
      }
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
      if (obtenerSelectoresArcanos(pj).length && !obtenerSelectoresArcanos(pj,true).some(s =>
        s.nivelConjuro === gasto.nivel && s.valorActual.some(id => s.opciones.some(o => o.id === id)))) return insuficiente;
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
      const evaluacion = evaluarRecursosLanzamientoGratuito(pj, rasgo);
      if (!evaluacion.elegible) return insuficiente;
      personaje = {
        ...pj,
        rasgos: pj.rasgos.map(r => {
          if (evaluacion.idRecursoHijo && r.id === evaluacion.idRecursoHijo && evaluacion.disponiblesHijo !== undefined) {
            return { ...r, usosRestantes: Math.max(0, evaluacion.disponiblesHijo - 1) };
          }
          if (evaluacion.idRecursoPadre && r.id === evaluacion.idRecursoPadre && evaluacion.disponiblesPadre !== undefined) {
            return { ...r, usosRestantes: Math.max(0, evaluacion.disponiblesPadre - 1) };
          }
          return r;
        })
      };
      break;
    }
  }
  if (gasto.conjuroCuracion) personaje = registrarAutocuracionConjuro(personaje, gasto.conjuroCuracion,
    gasto.tipo === "espacio" || gasto.tipo === "pacto" ? gasto.nivel : undefined, gasto.aptitudCuracion);
  if (gasto.conjuroId) personaje = { ...personaje, rasgos: personaje.rasgos.map(r => {
    const anteriores = r.conjurosTemporales?.filter(e => e.conjuroId !== gasto.conjuroId);
    const duracion = gasto.tipo === "recursoRasgo" && r.id === gasto.idRasgo ? r.lanzamientoConRecurso?.duracionRondas : undefined;
    return anteriores || duracion ? { ...r, conjurosTemporales: duracion
      ? [...(anteriores ?? []), { conjuroId: gasto.conjuroId!, expiraRonda: (gasto.ronda ?? 1) + duracion }] : anteriores } : r;
  }) };
  return { permitido: true, personaje };
}
