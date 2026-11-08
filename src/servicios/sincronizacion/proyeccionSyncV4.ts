import type { EstadoDM, CriaturaIniciativa } from '@/almacen/usarAlmacenDM';
import type { PersonajeJugador } from '@/tipos/personaje';
import type { EntidadSyncV4, GruposSyncV4 } from '@/tipos/protocoloSync';
import type { DatosLocalesSyncV4 } from './motorSyncV4';
import { calcularEstadisticasPersonaje } from '@/servicios/personajes/calculadorEstadisticasPersonaje';
import { coincideCondicionConRasgo, resolverCondicionAsociadaRasgo } from '@/almacen/slices/personajes/condicionesRasgosHelpers';
import { esCondicionDerribado } from '@/almacen/slices/iniciativa/sincronizadorMovimientoIniciativa';
import { claveEstado } from '@/servicios/rasgos/estadoCondicionesRasgos';
import { perteneceACampania } from '@/almacen/campaniasPersonajes';

const revisiones = () => ({ vitalidad: 0, estados: 0, datos: 0, acompanantes: 0 });
export const claveMiniSyncV4 = (mini: string): string => mini.toLowerCase();
const clavePJ = (p: PersonajeJugador) => p.idMiniaturaTS ? claveMiniSyncV4(p.idMiniaturaTS) : p.id;
const claveAc = (padre: string, a: PersonajeJugador['acompanantes'][number]) => a.idMiniaturaTS
  ? claveMiniSyncV4(a.idMiniaturaTS) : `${padre}/${a.id}`;
function terrenoSinGastos(condiciones: string[], anteriores: string[], tipo: PersonajeJugador['tipoTerreno'], mult: number) {
  const derribado = condiciones.some(esCondicionDerribado); const antes = anteriores.some(esCondicionDerribado);
  if (derribado && !antes && mult === 1) return { tipoTerreno: 'dificil' as const, multiplicadorTerreno: 2 };
  if (!derribado && antes && mult === 2) return { tipoTerreno: 'normal' as const, multiplicadorTerreno: 1 };
  return { tipoTerreno: tipo, multiplicadorTerreno: mult };
}
/** Los chips derivados de efectos no son una segunda fuente de estado. */
function estadosTransmitidos(e: GruposSyncV4['estados']): GruposSyncV4['estados'] {
  const efectos = new Set(e.efectos.map(ef => claveEstado(ef.nombre)));
  return { ...e, condiciones: e.condiciones.filter(c => !/^concentraci[oó]n$/i.test(c) && !efectos.has(claveEstado(c))) };
}
function condicionesMecanicas(e: GruposSyncV4['estados']): string[] {
  return [...new Set([...e.condiciones, ...e.efectos.map(ef => ef.concentracion ? 'Concentración' : ef.nombre),
    ...(e.concentracion ? ['Concentración'] : [])])];
}

function gruposFila(c: CriaturaIniciativa): GruposSyncV4 {
  return { vitalidad: { actual: Math.max(0, Math.min(c.vidaActual, c.vidaMaxima)), maxima: Math.max(1, c.vidaMaxima), temporal: Math.max(0, c.vidaTemporal ?? 0) },
    estados: estadosTransmitidos({ condiciones: c.condiciones ?? [], efectos: c.efectos ?? [], concentracion: null }),
    datos: { nombre: c.nombre, iniciativa: c.iniciativa, ca: c.ca ?? 10, avatar: c.avatarUrl,
      pasivas: [c.pasivas?.percepcion ?? 10, c.pasivas?.investigacion ?? 10, c.pasivas?.perspicacia ?? 10] }, acompanantes: [] };
}

/** Las filas nunca se asocian a fichas remotas por nombre. */
export function capturarSyncV4(s: EstadoDM, jugador: string, campania = s.contextoTaleSpire?.campania.id): DatosLocalesSyncV4 {
  const entidades = new Map<string, EntidadSyncV4>();
  for (const pj of s.personajes) {
    if (campania ? !perteneceACampania(pj, campania) : !!pj.campaniaTaleSpire) continue;
    const id = clavePJ(pj);
    const fila = s.colaIniciativa.find(c => !c.esMonstruo && !c.esAcompanante &&
      (c.id === pj.id || c.id.toLowerCase() === id || c.idPersonajeDuenio === pj.id));
    const usarFila = s.esGM && !!fila && (fila.idPersonajeDuenio === pj.id || fila.id === pj.id);
    const stats = calcularEstadisticasPersonaje(pj);
    const estados = usarFila && fila ? { condiciones: fila.condiciones, efectos: fila.efectos ?? [] }
      : { condiciones: pj.condicionesActivas, efectos: pj.efectosActivos };
    let concentracion = pj.concentracionActiva ? { origen: pj.concentracionActiva.idRasgoOrigen ? 'rasgo' as const : 'conjuro' as const,
      id: pj.concentracionActiva.idRasgoOrigen ?? pj.concentracionActiva.hechizoId ?? '', nombre: pj.concentracionActiva.nombreHechizo } : null;
    const efectoConc = estados.efectos.find(e => e.concentracion);
    if (usarFila) concentracion = efectoConc ? concentracion ?? { origen: 'conjuro', id: efectoConc.id, nombre: efectoConc.nombre.replace(/^concentraci[oó]n:\s*/i, '') } : null;
    const grupos: GruposSyncV4 = { vitalidad: { actual: usarFila && fila ? fila.vidaActual : pj.hpActual,
      maxima: usarFila && fila ? fila.vidaMaxima : pj.hpMaximo, temporal: usarFila && fila ? fila.vidaTemporal ?? 0 : pj.hpTemporal ?? 0 },
      estados: estadosTransmitidos({ ...estados, concentracion }), datos: { nombre: pj.nombre, avatar: pj.avatarUrl?.startsWith('http') ? pj.avatarUrl : undefined,
        iniciativa: fila?.iniciativa ?? pj.iniciativaBono ?? 0, ca: stats.claseArmadura.total,
        pasivas: [stats.pasivas.percepcion, stats.pasivas.investigacion, stats.pasivas.perspicacia] },
      acompanantes: pj.acompanantes.map(a => ({ id: claveAc(id, a), miniatura: a.idMiniaturaTS ? claveMiniSyncV4(a.idMiniaturaTS) : null })) };
    entidades.set(id, { id, ficha: pj.id, fila: fila?.id ?? pj.idMiniaturaTS ?? pj.id,
      duenio: s.esGM ? 'sin-vincular' : jugador, miniatura: pj.idMiniaturaTS ? id : null, padre: null,
      revision: 0, revisiones: revisiones(), grupos, eliminada: false, monstruo: false });
    for (const a of pj.acompanantes) {
      const clave = claveAc(id, a);
      const filaAc = s.colaIniciativa.find(c => (c.esAcompanante || c.idAcompanante) &&
        (c.id === a.id || c.id.toLowerCase() === clave || c.idAcompanante === a.id));
      const usarFilaAc = s.esGM && filaAc?.idAcompanante === a.id;
      entidades.set(clave, { id: clave, ficha: a.id, fila: filaAc?.id ?? a.idMiniaturaTS ?? a.id,
        duenio: s.esGM ? 'sin-vincular' : jugador, miniatura: a.idMiniaturaTS ? clave : null, padre: id,
        revision: 0, revisiones: revisiones(), eliminada: false, monstruo: false, plantilla: a.idPlantilla,
        grupos: { vitalidad: { actual: usarFilaAc && filaAc ? filaAc.vidaActual : a.vidaActual,
          maxima: usarFilaAc && filaAc ? filaAc.vidaMaxima : a.vidaMaxima, temporal: usarFilaAc && filaAc ? filaAc.vidaTemporal ?? 0 : a.vidaTemporal ?? 0 },
          estados: estadosTransmitidos({ condiciones: usarFilaAc && filaAc ? filaAc.condiciones : a.condiciones,
            efectos: usarFilaAc && filaAc ? filaAc.efectos ?? [] : a.efectos, concentracion: null }),
          datos: { nombre: a.nombre, iniciativa: filaAc?.iniciativa ?? a.iniciativa ?? 0, ca: a.ca ?? 10, pasivas: [10, 10, 10] }, acompanantes: [] } });
    }
  }
  for (const c of s.colaIniciativa) {
    if ([...entidades.values()].some(e => e.fila === c.id)) continue;
    const id = claveMiniSyncV4(c.id);
    entidades.set(id, { id, fila: c.id, duenio: 'sin-vincular', miniatura: c.id.startsWith('c_local_') ? null : id,
      padre: null, revision: 0, revisiones: revisiones(), grupos: gruposFila(c), eliminada: false,
      monstruo: c.esMonstruo, plantilla: c.idPlantillaAsociada });
  }
  return { entidades: [...entidades.values()], meta: { orden: s.colaIniciativa.map(c => c.id),
    activo: s.colaIniciativa[s.indiceTurnoActivo]?.id ?? null, ronda: s.rondaActual, porcentaje: s.mostrarPorcentajeVidaAJugadores } };
}

function filaDesdeEntidad(e: EntidadSyncV4, anterior?: CriaturaIniciativa): CriaturaIniciativa {
  const { vitalidad: v, datos: d, estados: estados } = e.grupos;
  return { ...anterior, id: e.fila ?? e.id, nombre: d.nombre, iniciativa: d.iniciativa,
    vidaActual: v.actual, vidaMaxima: v.maxima, vidaTemporal: v.temporal, ca: d.ca,
    condiciones: estados.condiciones, efectos: estados.efectos.map(ef => ({ ...anterior?.efectos?.find(a => a.id === ef.id), ...ef })),
    esMonstruo: e.monstruo ?? false, esAcompanante: !!e.padre, idAcompanante: e.padre ? e.ficha : undefined,
    idPersonajeDuenio: e.padre ?? e.ficha, avatarUrl: d.avatar, idPlantillaAsociada: e.plantilla,
    pasivas: { percepcion: d.pasivas[0], investigacion: d.pasivas[1], perspicacia: d.pasivas[2] },
    velocidad: anterior?.velocidad ?? '30 pies', bonificadorIniciativa: anterior?.bonificadorIniciativa ?? 0 };
}

/** Aplica valores confirmados/optimistas sin repetir gastos ni disparar acciones de usuario. */
export function proyectarSyncV4(s: EstadoDM, datos: DatosLocalesSyncV4, campania = s.contextoTaleSpire?.campania.id): Partial<EstadoDM> {
  const porId = new Map(datos.entidades.map(e => [e.id, e]));
  const cola = datos.meta.orden.flatMap(id => {
    const e = datos.entidades.find(e => !e.eliminada && (e.fila ?? e.id) === id);
    if (!e) return [];
    const fila = filaDesdeEntidad(e, s.colaIniciativa.find(c => c.id === id));
    if (e.padre) fila.idPersonajeDuenio = porId.get(e.padre)?.ficha ?? e.padre;
    return [fila];
  });
  const personajes = s.personajes.map(p => {
    if (campania ? !perteneceACampania(p, campania) : !!p.campaniaTaleSpire) return p;
    const id = clavePJ(p); const e = porId.get(id);
    if (!e || e.eliminada || e.monstruo || (e.ficha && e.ficha !== p.id)) return p;
    const { vitalidad: v, estados: estados } = e.grupos;
    const conc = estados.concentracion;
    const nombres = [...estados.condiciones, ...estados.efectos.map(ef => ef.nombre)];
    const acompanantes = e.grupos.acompanantes.flatMap(a => {
      const ac = porId.get(a.id); if (!ac || ac.eliminada || ac.padre !== id) return [];
      const previo = p.acompanantes.find(x => x.id === ac.ficha || (x.idMiniaturaTS && claveMiniSyncV4(x.idMiniaturaTS) === a.id));
      const av = ac.grupos.vitalidad;
      return [{ ...previo, id: ac.ficha ?? ac.id, nombre: ac.grupos.datos.nombre, idPlantilla: ac.plantilla ?? previo?.idPlantilla ?? '',
        vidaActual: av.actual, vidaMaxima: av.maxima, vidaTemporal: av.temporal, ca: ac.grupos.datos.ca,
        iniciativa: ac.grupos.datos.iniciativa, idMiniaturaTS: ac.miniatura,
        condiciones: condicionesMecanicas(ac.grupos.estados), efectos: ac.grupos.estados.efectos.map(ef => ({ ...previo?.efectos.find(x => x.id === ef.id), ...ef })),
        velocidad: previo?.velocidad ?? '30 pies', movimientoGastado: previo?.movimientoGastado ?? 0,
        movimientoMaximoTemporal: previo?.movimientoMaximoTemporal ?? null,
        ...terrenoSinGastos(condicionesMecanicas(ac.grupos.estados), previo?.condiciones ?? [], previo?.tipoTerreno ?? 'normal', previo?.multiplicadorTerreno ?? 1),
        historialMovimiento: previo?.historialMovimiento ?? [],
        ultimaPosicionTS: previo?.ultimaPosicionTS ?? null, ultimoBoardIdTS: previo?.ultimoBoardIdTS ?? null }];
    });
    return { ...p, nombre: e.grupos.datos.nombre, avatarUrl: e.grupos.datos.avatar ?? p.avatarUrl,
      hpActual: v.actual, hpMaximo: v.maxima, hpTemporal: v.temporal,
      condicionesActivas: condicionesMecanicas(estados),
      efectosActivos: estados.efectos.map(ef => ({ ...p.efectosActivos.find(x => x.id === ef.id), ...ef })),
      concentracionActiva: conc ? { nombreHechizo: conc.nombre,
        ...(conc.origen === 'rasgo' ? { idRasgoOrigen: conc.id } : { hechizoId: conc.id }) } : null,
      ...terrenoSinGastos(condicionesMecanicas(estados), p.condicionesActivas, p.tipoTerreno, p.multiplicadorTerreno),
      rasgos: p.rasgos.map(r => resolverCondicionAsociadaRasgo(r) || r.lanzamientoConActivacion
        ? { ...r, activo: nombres.some(n => coincideCondicionConRasgo(n, r)) || (conc?.origen === 'rasgo' && conc.id === r.id) } : r),
      acompanantes };
  });
  return { personajes, colaIniciativa: cola, rondaActual: datos.meta.ronda,
    indiceTurnoActivo: Math.max(0, cola.findIndex(c => c.id === datos.meta.activo)), mostrarPorcentajeVidaAJugadores: datos.meta.porcentaje };
}
