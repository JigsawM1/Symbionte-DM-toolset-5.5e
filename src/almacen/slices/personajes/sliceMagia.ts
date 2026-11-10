import { consumirRecursoConjuro } from "@/servicios/consumidorRecursosConjuros";
import { elegirConjuroClase, clasesPropietariasConjuro, retirarEleccionConjuro, conjuroElegidoPorClase, conjuroFueraDeListas, esConjuroIndependiente } from "@/servicios/rasgos/listasConjurosRasgos";
import { reconciliarConjurosRasgos } from "@/servicios/rasgos/reconciliarConjurosRasgos";
import { obtenerSelectoresArcanos } from "@/servicios/rasgos/arcanosMisticosRasgos";
import type { StateCreator } from "zustand";
import type { EstadoDM, EfectoActivo } from "@/almacen/usarAlmacenDM";
import {
  calcularTodosRecursosMagicos,
  obtenerConjurosSubclasePersonaje
} from "@/servicios/calculadorMagia";
import { coincideHechizoId } from "@/servicios/comparadorHechizos";
import { sincronizarConjurosSubclaseHelper } from "@/servicios/sincronizadorConjurosSubclase";
import { mutarPersonaje } from "../helpers/mutarPersonaje";
import type { SubSliceMagia } from "./slicePersonajesTipos";

function sincronizarConcentracionEnIniciativa(
  set: (fn: (state: EstadoDM) => Partial<EstadoDM>) => void,
  idPj: string,
  nombreHechizo: string | null
): void {
  set((state) => {
    if (!state.colaIniciativa || state.colaIniciativa.length === 0) return {};
    const pj = state.personajes.find((p) => p.id === idPj);
    if (!pj) return {};
    const nombreNorm = (pj.nombre || "").trim().toLowerCase();

    let huboCambio = false;
    const nuevaCola = state.colaIniciativa.map((c) => {
      const coincide =
        c.id === idPj ||
        (pj.idMiniaturaTS && c.id === pj.idMiniaturaTS) ||
        (nombreNorm && c.nombre.trim().toLowerCase() === nombreNorm);

      if (!coincide) return c;
      huboCambio = true;

      // La concentración es un efecto de conjuro, se limpia de condiciones para evitar duplicación
      const nuevasCondiciones = (c.condiciones || []).filter(
        (cond) => !cond.toLowerCase().includes("concentra")
      );
      const efectosSinConcentracion = (c.efectos || []).filter(
        (e) => !e.concentracion && e.id !== "ef_concentracion" && !e.nombre.toLowerCase().startsWith("concentra")
      );

      if (nombreHechizo) {
        const nuevoEfecto: EfectoActivo = {
          id: "ef_concentracion",
          nombre: `Concentración: ${nombreHechizo}`,
          concentracion: true
        };

        return {
          ...c,
          condiciones: nuevasCondiciones,
          efectos: [...efectosSinConcentracion, nuevoEfecto]
        };
      } else {
        return {
          ...c,
          condiciones: nuevasCondiciones,
          efectos: efectosSinConcentracion
        };
      }
    });

    return huboCambio ? { colaIniciativa: nuevaCola } : {};
  });
}

export const crearSubSliceMagia: StateCreator<
  EstadoDM,
  [],
  [],
  SubSliceMagia
> = (set, get) => ({
  consumirRecursoConjuro: (id, gasto) => {
    let resultado: { permitido: boolean; motivo?: string } = { permitido: false, motivo: 'Personaje no encontrado.' };
    set(state => {
      const pj = state.personajes.find(p => p.id === id);
      if (!pj) return state;
      const consumo = consumirRecursoConjuro(pj, gasto);
      resultado = consumo;
      return consumo.permitido && consumo.personaje !== pj
        ? { personajes: state.personajes.map(p => p === pj ? consumo.personaje : p) } : state;
    });
    return resultado;
  },

  recalcularRecursosMagicos: (id) => {
    set((state) => ({
      personajes: state.personajes.map((pj) => {
        if (pj.id !== id) return pj;

        const resultadoSubclase = obtenerConjurosSubclasePersonaje(
          pj.clases,
          pj.clase,
          pj.subclase,
          pj.nivel
        );

        const siemprePreparadosNuevos = Array.from(
          new Set([...(resultadoSubclase.conjuros || [])])
        );

        const preparadosActuales = new Set(pj.conjurosPreparadosIds || []);
        siemprePreparadosNuevos.forEach((c) => preparadosActuales.add(c));

        const trucosActuales = new Set(pj.trucosConocidosIds || []);
        (resultadoSubclase.trucos || []).forEach((t) => trucosActuales.add(t));

        if (!pj.esLanzador || pj.clasesLanzadoras.length === 0) {
          return {
            ...pj,
            conjurosSiemprePreparadosIds: siemprePreparadosNuevos,
            conjurosPreparadosIds: Array.from(preparadosActuales),
            trucosConocidosIds: Array.from(trucosActuales),
            espaciosConjuroMaximos: pj.overrideEspaciosConjuro || {},
            puntosConjuroMaximos: pj.overridePuntosConjuro || 0,
            nivelConjuroMaximo: 0,
            espaciosPactoMaximos: 0,
            nivelEspacioPacto: 0
          };
        }

        const recursos = calcularTodosRecursosMagicos(
          pj.clasesLanzadoras,
          pj.overrideEspaciosConjuro,
          pj.overridePuntosConjuro
        );

        return {
          ...pj,
          conjurosSiemprePreparadosIds: siemprePreparadosNuevos,
          conjurosPreparadosIds: Array.from(preparadosActuales),
          trucosConocidosIds: Array.from(trucosActuales),
          espaciosConjuroMaximos: recursos.espaciosConjuroMaximos,
          puntosConjuroMaximos: recursos.puntosConjuroMaximos,
          nivelConjuroMaximo: recursos.nivelConjuroMaximo,
          espaciosPactoMaximos: recursos.espaciosPactoMaximos,
          nivelEspacioPacto: recursos.nivelEspacioPacto
        };
      })
    }));
  },

  configurarLanzadorConjuros: (id, config) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      esLanzador: config.esLanzador,
      clasesLanzadoras: config.clasesLanzadoras
    }));
    get().recalcularRecursosMagicos(id);
  },

  establecerConcentracion: (id, hechizoId, nombreHechizo) => {
    mutarPersonaje(set, id, (pj) => {
      const condiciones = (pj.condicionesActivas || []).includes("Concentración")
        ? pj.condicionesActivas
        : [...(pj.condicionesActivas || []), "Concentración"];
      const otrosEfectos = (pj.efectosActivos || []).filter(
        (e) => !e.concentracion && e.id !== "ef_concentracion" && !e.nombre.toLowerCase().startsWith("concentra")
      );
      const nuevoEfecto = {
        id: "ef_concentracion",
        nombre: `Concentración: ${nombreHechizo}`,
        concentracion: true
      };

      return {
        ...pj,
        concentracionActiva: { hechizoId, nombreHechizo },
        condicionesActivas: condiciones,
        efectosActivos: [...otrosEfectos, nuevoEfecto]
      };
    });
    sincronizarConcentracionEnIniciativa(set, id, nombreHechizo);
  },

  romperConcentracion: (id) => {
    mutarPersonaje(set, id, (pj) => {
      const nuevasCondiciones = (pj.condicionesActivas || []).filter(
        (c) => !c.toLowerCase().includes("concentra")
      );
      const nuevosEfectos = (pj.efectosActivos || []).filter(
        (e) => !e.concentracion && e.id !== "ef_concentracion" && !e.nombre.toLowerCase().startsWith("concentra")
      );
      return {
        ...pj,
        concentracionActiva: null,
        condicionesActivas: nuevasCondiciones,
        efectosActivos: nuevosEfectos
      };
    });
    sincronizarConcentracionEnIniciativa(set, id, null);
  },

  alternarConjuroIndependiente: (id, hechizoId) => {
    mutarPersonaje(set, id, (pj) => {
      const h = get().baseDatosHechizos.find(h => coincideHechizoId(h.id, hechizoId));
      if (!h) return pj;
      const quitar = esConjuroIndependiente(pj, h);
      if (!quitar && !conjuroFueraDeListas(pj, h)) return pj;
      const aprendizajes = pj.aprendizajesConjurosIndependientes ?? { trucos: [], conjuros: [] };
      const tipo = h.nivel === 0 ? "trucos" : "conjuros";
      const coincide = (otro: string) => coincideHechizoId(otro, h.id);
      const otorgado = tipo === "trucos"
        ? obtenerConjurosSubclasePersonaje(pj.clases, pj.clase, pj.subclase, pj.nivel).trucos.some(coincide)
        : pj.conjurosSiemprePreparadosIds.some(coincide);
      const clases = clasesPropietariasConjuro(pj, h.id);
      const actualizar = (lista: string[], conservar = false) => quitar
        ? conservar ? lista : lista.filter(v => !coincide(v))
        : lista.some(coincide) ? lista : [...lista, h.id];
      const origen = { ...aprendizajes, [tipo]: actualizar(aprendizajes[tipo]) };
      const actual = tipo === "trucos"
        ? { ...pj, aprendizajesConjurosIndependientes: origen, trucosConocidosIds: actualizar(pj.trucosConocidosIds, otorgado || clases.length > 0) }
        : { ...pj, aprendizajesConjurosIndependientes: origen,
            conjurosConocidosIds: actualizar(pj.conjurosConocidosIds, otorgado || clases.length > 0),
            conjurosPreparadosIds: actualizar(pj.conjurosPreparadosIds, otorgado || clases.some(c => conjuroElegidoPorClase(pj, h.id, c, "preparados"))) };
      return quitar ? { ...actual, ...reconciliarConjurosRasgos(pj, actual.rasgos, actual) } : actual;
    });
  },

  agregarTrucoConocido: (id, hechizoId, clase) => {
    mutarPersonaje(set, id, (pj) => {
      const elegida = elegirConjuroClase(pj, hechizoId, "trucos", clase, get().baseDatosHechizos);
      if (!elegida) return pj;
      pj = elegida;
      const listaActual = pj.trucosConocidosIds || [];
      const aprendizajes = pj.aprendizajesConjurosIndependientes ?? { trucos: [], conjuros: [] };
      return { ...pj, trucosConocidosIds: listaActual.some(hId => coincideHechizoId(hId, hechizoId)) ? listaActual : [...listaActual, hechizoId],
        aprendizajesConjurosIndependientes: clasesPropietariasConjuro(pj, hechizoId).length ? pj.aprendizajesConjurosIndependientes : { ...aprendizajes, trucos: Array.from(new Set([...aprendizajes.trucos, hechizoId])) } };
    });
  },

  quitarTrucoConocido: (id, hechizoId, clase) => {
    mutarPersonaje(set, id, (pj) => {
      const actualizado = retirarEleccionConjuro(pj, hechizoId, clase, "trucos");
      const independientes = pj.aprendizajesConjurosIndependientes && { ...pj.aprendizajesConjurosIndependientes,
        trucos: clase ? pj.aprendizajesConjurosIndependientes.trucos : pj.aprendizajesConjurosIndependientes.trucos.filter(v => !coincideHechizoId(v, hechizoId)) };
      const conservar = clasesPropietariasConjuro(actualizado, hechizoId).length || independientes?.trucos.some(v => coincideHechizoId(v, hechizoId));
      return { ...actualizado, aprendizajesConjurosIndependientes: independientes,
        trucosConocidosIds: conservar ? pj.trucosConocidosIds : pj.trucosConocidosIds.filter(v => !coincideHechizoId(v, hechizoId)) };
    });
  },

  agregarConjuroConocido: (id, hechizoId, clase) => {
    mutarPersonaje(set, id, (pj) => {
      const elegida = elegirConjuroClase(pj, hechizoId, "conjuros", clase, get().baseDatosHechizos);
      if (!elegida) return pj;
      pj = elegida;
      const listaActual = pj.conjurosConocidosIds || [];
      const aprendizajes = pj.aprendizajesConjurosIndependientes ?? { trucos: [], conjuros: [] };
      return { ...pj, conjurosConocidosIds: listaActual.some(hId => coincideHechizoId(hId, hechizoId)) ? listaActual : [...listaActual, hechizoId],
        aprendizajesConjurosIndependientes: clasesPropietariasConjuro(pj, hechizoId).length ? pj.aprendizajesConjurosIndependientes : { ...aprendizajes, conjuros: Array.from(new Set([...aprendizajes.conjuros, hechizoId])) } };
    });
  },

  quitarConjuroConocido: (id, hechizoId, clase) => {
    mutarPersonaje(set, id, (pj) => {
      const actualizado = retirarEleccionConjuro(pj, hechizoId, clase, "conjuros");
      const independientes = pj.aprendizajesConjurosIndependientes && { ...pj.aprendizajesConjurosIndependientes,
        conjuros: clase ? pj.aprendizajesConjurosIndependientes.conjuros : pj.aprendizajesConjurosIndependientes.conjuros.filter(v => !coincideHechizoId(v, hechizoId)) };
      const siempre = pj.conjurosSiemprePreparadosIds.some(v => coincideHechizoId(v, hechizoId));
      const conservar = siempre || clasesPropietariasConjuro(actualizado, hechizoId).length || independientes?.conjuros.some(v => coincideHechizoId(v, hechizoId));
      const preparado = siempre || Object.keys(actualizado.eleccionesConjurosClase ?? {}).some(c => conjuroElegidoPorClase(actualizado, hechizoId, c, "preparados"));
      return { ...actualizado, aprendizajesConjurosIndependientes: independientes,
        conjurosConocidosIds: conservar ? pj.conjurosConocidosIds : pj.conjurosConocidosIds.filter(v => !coincideHechizoId(v, hechizoId)),
        conjurosPreparadosIds: preparado ? pj.conjurosPreparadosIds : pj.conjurosPreparadosIds.filter(v => !coincideHechizoId(v, hechizoId)) };
    });
  },

  alternarConjuroPreparado: (id, hechizoId, clase) => {
    mutarPersonaje(set, id, (pj) => {
      const preparados = pj.conjurosPreparadosIds || [];
      if (!clase && esConjuroIndependiente(pj, { id: hechizoId, nivel: 1 })) {
        const coincide = (otro: string) => coincideHechizoId(otro, hechizoId);
        if (pj.conjurosSiemprePreparadosIds.some(coincide)
          || clasesPropietariasConjuro(pj, hechizoId).some(c => conjuroElegidoPorClase(pj, hechizoId, c, "preparados"))) return pj;
        return { ...pj, conjurosPreparadosIds: preparados.some(coincide) ? preparados.filter(v => !coincide(v)) : [...preparados, hechizoId] };
      }
      const estaPreparado = clase ? conjuroElegidoPorClase(pj, hechizoId, clase, "preparados") : preparados.some((hId) => coincideHechizoId(hId, hechizoId));
      const elegida = estaPreparado ? retirarEleccionConjuro(pj, hechizoId, clase, "preparados") : elegirConjuroClase(pj, hechizoId, "preparados", clase, get().baseDatosHechizos);
      if (!elegida) return pj;
      pj = elegida;
      const otraProcedencia = Object.keys(pj.eleccionesConjurosClase ?? {}).some(c => conjuroElegidoPorClase(pj, hechizoId, c, "preparados"))
        || pj.conjurosSiemprePreparadosIds.some(v => coincideHechizoId(v, hechizoId));
      const nuevaLista = estaPreparado && !otraProcedencia
        ? preparados.filter((hId) => !coincideHechizoId(hId, hechizoId))
        : preparados.some(v => coincideHechizoId(v, hechizoId)) ? preparados : [...preparados, hechizoId];

      return { ...pj, conjurosPreparadosIds: nuevaLista };
    });
  },

  desprepararConjuroPersonaje: (id, hechizoId) => {
    mutarPersonaje(set, id, (pj) => {
      pj = retirarEleccionConjuro(pj, hechizoId, undefined, "preparados");
      const preparados = pj.conjurosPreparadosIds || [];
      const nuevaLista = preparados.filter((hId) => !coincideHechizoId(hId, hechizoId));
      return { ...pj, conjurosPreparadosIds: nuevaLista };
    });
  },

  gastarEspacioConjuro: (id, nivel) => {
    mutarPersonaje(set, id, pj => {
      const resultado = consumirRecursoConjuro(pj, { tipo: "espacio", nivel });
      return resultado.permitido ? resultado.personaje : pj;
    });
  },

  recuperarEspacioConjuro: (id, nivel) => {
    const nivelClave = String(nivel);
    mutarPersonaje(set, id, (pj) => {
      const gastados = pj.espaciosConjuroGastados?.[nivelClave] || 0;
      if (gastados <= 0) return pj;

      return {
        ...pj,
        espaciosConjuroGastados: {
          ...pj.espaciosConjuroGastados,
          [nivelClave]: gastados - 1
        }
      };
    });
  },

  recuperarTodosEspaciosConjuro: (id) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      espaciosConjuroGastados: {}
    }));
  },

  gastarPuntosConjuro: (id, cantidad) => {
    if (cantidad <= 0) return;
    mutarPersonaje(set, id, (pj) => {
      const max = pj.puntosConjuroMaximos || 0;
      const gastados = pj.puntosConjuroGastados || 0;
      const nuevosGastados = Math.min(max, gastados + cantidad);
      return { ...pj, puntosConjuroGastados: nuevosGastados };
    });
  },

  recuperarPuntosConjuro: (id, cantidad) => {
    if (cantidad <= 0) return;
    mutarPersonaje(set, id, (pj) => {
      const gastados = pj.puntosConjuroGastados || 0;
      const nuevosGastados = Math.max(0, gastados - cantidad);
      return { ...pj, puntosConjuroGastados: nuevosGastados };
    });
  },

  recuperarTodosPuntosConjuro: (id) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      puntosConjuroGastados: 0
    }));
  },

  gastarEspacioPacto: (id) => {
    mutarPersonaje(set, id, (pj) => {
      const max = pj.espaciosPactoMaximos || 0;
      const gastados = pj.espaciosPactoGastados || 0;
      if (gastados >= max) return pj;
      return { ...pj, espaciosPactoGastados: gastados + 1 };
    });
  },

  recuperarEspacioPacto: (id) => {
    mutarPersonaje(set, id, (pj) => {
      const gastados = pj.espaciosPactoGastados || 0;
      if (gastados <= 0) return pj;
      return { ...pj, espaciosPactoGastados: gastados - 1 };
    });
  },

  recuperarEspaciosPacto: (id) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      espaciosPactoGastados: 0
    }));
  },

  modificarPuntosHechiceria: (id, delta) => {
    mutarPersonaje(set, id, (pj) => {
      const recurso = pj.rasgos.find(r => r.recursoLegado === "puntos_hechiceria");
      if (recurso) return { ...pj, rasgos: pj.rasgos.map(r => r === recurso ? { ...r,
        usosRestantes: Math.max(0, Math.min(r.usosMaximos ?? 0, (r.usosRestantes ?? r.usosMaximos ?? 0) + delta)) } : r) };
      const max = pj.puntosHechiceriaMaximos || 0;
      const actual = pj.puntosHechiceriaActuales ?? max;
      const nuevo = Math.max(0, Math.min(max, actual + delta));
      return { ...pj, puntosHechiceriaActuales: nuevo };
    });
  },

  asignarArcanoMistico: (id, nivel, hechizoId) => {
    const nivelClave = String(nivel);
    const entrada = `${nivelClave}:${hechizoId}`;
    mutarPersonaje(set, id, (pj) => {
        const declarados = obtenerSelectoresArcanos(pj);
        if (declarados.length && !obtenerSelectoresArcanos(pj,true).some(s => s.nivelConjuro === nivel
          && s.opciones.some(o => o.id === hechizoId))) return pj;
        const anteriores = (pj.arcanoMisticoIds || []).filter(
        (item) => !item.startsWith(`${nivelClave}:`) && item !== hechizoId
      );
      return {
        ...pj,
        arcanoMisticoIds: [...anteriores, entrada],
        rasgos: pj.rasgos.map(r => ({ ...r, selectores: r.selectores?.map(s => s.destinoConjuros === "arcano_mistico" && s.nivelConjuro === nivel ? { ...s, valorActual: [hechizoId] } : s) }))
      };
    });
  },

  quitarArcanoMistico: (id, nivel) => {
    const nivelClave = String(nivel);
    mutarPersonaje(set, id, (pj) => {
      const filtrados = (pj.arcanoMisticoIds || []).filter(
        (item) => !item.startsWith(`${nivelClave}:`)
      );
      return { ...pj, arcanoMisticoIds: filtrados,
        rasgos: pj.rasgos.map(r => ({ ...r, selectores: r.selectores?.map(s => s.destinoConjuros === "arcano_mistico" && s.nivelConjuro === nivel ? { ...s, valorActual: [] } : s) })) };
    });
  },

  gastarArcanoMistico: (id, nivel) => {
    const nivelClave = String(nivel);
    mutarPersonaje(set, id, (pj) => {
      const gastados = pj.arcanoMisticoGastados || [];
      if (gastados.includes(nivelClave)) return pj;
      return { ...pj, arcanoMisticoGastados: [...gastados, nivelClave] };
    });
  },

  recuperarArcanoMistico: (id, nivel) => {
    const nivelClave = String(nivel);
    mutarPersonaje(set, id, (pj) => {
      const gastados = pj.arcanoMisticoGastados || [];
      return { ...pj, arcanoMisticoGastados: gastados.filter((n) => n !== nivelClave) };
    });
  },

  sincronizarConjurosSubclase: (id) => {
    mutarPersonaje(set, id, (pj) => sincronizarConjurosSubclaseHelper(pj));
  },

  establecerOverridesMagia: (id, overrides) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      overrideEspaciosConjuro:
        overrides.overrideEspacios !== undefined ? overrides.overrideEspacios : pj.overrideEspaciosConjuro,
      overridePuntosConjuro:
        overrides.overridePuntos !== undefined ? overrides.overridePuntos : pj.overridePuntosConjuro
    }));
    get().recalcularRecursosMagicos(id);
  },

  establecerOverrideEspacios: (id, overrides) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      overrideEspaciosConjuro: overrides
    }));
    get().recalcularRecursosMagicos(id);
  },

  establecerOverridePuntos: (id, override) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      overridePuntosConjuro: override
    }));
    get().recalcularRecursosMagicos(id);
  }
});
