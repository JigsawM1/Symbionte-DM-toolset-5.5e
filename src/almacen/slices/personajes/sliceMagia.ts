import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import {
  calcularTodosRecursosMagicos,
  obtenerConjurosSubclasePersonaje
} from "@/servicios/calculadorMagia";
import { coincideHechizoId } from "@/servicios/comparadorHechizos";
import { sincronizarConjurosSubclaseHelper } from "@/servicios/sincronizadorConjurosSubclase";
import { mutarPersonaje } from "../helpers/mutarPersonaje";
import type { SubSliceMagia } from "./slicePersonajesTipos";

export const crearSubSliceMagia: StateCreator<
  EstadoDM,
  [],
  [],
  SubSliceMagia
> = (set, get) => ({
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
      const condiciones = pj.condicionesActivas || [];
      const tieneCondicion = condiciones.some((c) => c.toLowerCase().includes("concentra"));
      const nuevasCondiciones = tieneCondicion ? condiciones : [...condiciones, "Concentración"];

      return {
        ...pj,
        concentracionActiva: { hechizoId, nombreHechizo },
        condicionesActivas: nuevasCondiciones
      };
    });
  },

  romperConcentracion: (id) => {
    mutarPersonaje(set, id, (pj) => {
      const nuevasCondiciones = (pj.condicionesActivas || []).filter(
        (c) => !c.toLowerCase().includes("concentra")
      );
      return {
        ...pj,
        concentracionActiva: null,
        condicionesActivas: nuevasCondiciones
      };
    });
  },

  agregarTrucoConocido: (id, hechizoId) => {
    mutarPersonaje(set, id, (pj) => {
      const listaActual = pj.trucosConocidosIds || [];
      if (listaActual.some((hId) => coincideHechizoId(hId, hechizoId))) return pj;
      return { ...pj, trucosConocidosIds: [...listaActual, hechizoId] };
    });
  },

  quitarTrucoConocido: (id, hechizoId) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      trucosConocidosIds: (pj.trucosConocidosIds || []).filter((hId) => !coincideHechizoId(hId, hechizoId))
    }));
  },

  agregarConjuroConocido: (id, hechizoId) => {
    mutarPersonaje(set, id, (pj) => {
      const listaActual = pj.conjurosConocidosIds || [];
      if (listaActual.some((hId) => coincideHechizoId(hId, hechizoId))) return pj;
      return { ...pj, conjurosConocidosIds: [...listaActual, hechizoId] };
    });
  },

  quitarConjuroConocido: (id, hechizoId) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      conjurosConocidosIds: (pj.conjurosConocidosIds || []).filter((hId) => !coincideHechizoId(hId, hechizoId)),
      conjurosPreparadosIds: (pj.conjurosPreparadosIds || []).filter((hId) => !coincideHechizoId(hId, hechizoId))
    }));
  },

  alternarConjuroPreparado: (id, hechizoId) => {
    mutarPersonaje(set, id, (pj) => {
      const preparados = pj.conjurosPreparadosIds || [];
      const estaPreparado = preparados.some((hId) => coincideHechizoId(hId, hechizoId));
      const nuevaLista = estaPreparado
        ? preparados.filter((hId) => !coincideHechizoId(hId, hechizoId))
        : [...preparados, hechizoId];

      return { ...pj, conjurosPreparadosIds: nuevaLista };
    });
  },

  desprepararConjuroPersonaje: (id, hechizoId) => {
    mutarPersonaje(set, id, (pj) => {
      const preparados = pj.conjurosPreparadosIds || [];
      const nuevaLista = preparados.filter((hId) => !coincideHechizoId(hId, hechizoId));
      return { ...pj, conjurosPreparadosIds: nuevaLista };
    });
  },

  gastarEspacioConjuro: (id, nivel) => {
    const nivelClave = String(nivel);
    mutarPersonaje(set, id, (pj) => {
      const max = pj.espaciosConjuroMaximos?.[nivelClave] || 0;
      const gastados = pj.espaciosConjuroGastados?.[nivelClave] || 0;
      if (gastados >= max) return pj;

      return {
        ...pj,
        espaciosConjuroGastados: {
          ...pj.espaciosConjuroGastados,
          [nivelClave]: gastados + 1
        }
      };
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

  recuperarEspaciosPacto: (id) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      espaciosPactoGastados: 0
    }));
  },

  modificarPuntosHechiceria: (id, delta) => {
    mutarPersonaje(set, id, (pj) => {
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
      const anteriores = (pj.arcanoMisticoIds || []).filter(
        (item) => !item.startsWith(`${nivelClave}:`) && item !== hechizoId
      );
      return {
        ...pj,
        arcanoMisticoIds: [...anteriores, entrada]
      };
    });
  },

  quitarArcanoMistico: (id, nivel) => {
    const nivelClave = String(nivel);
    mutarPersonaje(set, id, (pj) => {
      const filtrados = (pj.arcanoMisticoIds || []).filter(
        (item) => !item.startsWith(`${nivelClave}:`)
      );
      return { ...pj, arcanoMisticoIds: filtrados };
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
