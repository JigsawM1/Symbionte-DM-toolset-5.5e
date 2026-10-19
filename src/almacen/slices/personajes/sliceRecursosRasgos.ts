import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import { calcularUsosMaximosRasgo, calcularHpTemporalDeEfecto, obtenerEfectoHpTemporalRasgo } from "@/servicios/evaluadorEfectosRasgos";
import { mutarPersonaje } from "../helpers/mutarPersonaje";
import type { SubSliceRasgos } from "./slicePersonajesTipos";
import { resolverIdRasgoObjetivoGasto, coincideCondicionConRasgo } from "./condicionesRasgosHelpers";
import { aplicarHpTemporalPorEvento } from "@/servicios/rasgos/eventosHpTemporal";
import { obtenerNivelEfectivoParaRasgo } from "@/servicios/clases/catalogoClases";
import { esRasgoHabilitadoPorOpcion } from "@/servicios/rasgos/utilidadesRasgos";
import { resolverRasgoRecurso } from "@/servicios/rasgos/utilidadesRasgos";
import { operarRecursoRasgo } from "@/servicios/rasgos/conversionRecursosRasgos";

export const crearSliceRecursosRasgos: StateCreator<EstadoDM, [], [], Pick<SubSliceRasgos, "operarRecursoRasgoPersonaje" | "gastarUsoRasgoPersonaje" | "recuperarUsoRasgoPersonaje" | "establecerUsosRestantesRasgoPersonaje" | "guardarDadosRasgo" | "consumirDadoGuardado" | "recargarRasgoConEspacio" | "recargarUsoRasgoConPacto" | "recargarUsoRasgoConPadre">> = (set, get) => ({
operarRecursoRasgoPersonaje: (idPj, op) => {
    let aplicado = false;
    mutarPersonaje(set, idPj, pj => {
      const nuevo = operarRecursoRasgo(pj, op);
      aplicado = Boolean(nuevo);
      return nuevo ?? pj;
    });
    return aplicado;
  },
recargarUsoRasgoConPadre: (idPj, idRasgo) => {
    mutarPersonaje(set, idPj, pj => {
      const r = pj.rasgos.find(r => r.id === idRasgo);
      if (!r?.recargarUsoConPadre || !r.tieneUsosLimitados || (r.usosRestantes ?? r.usosMaximos ?? 0) >= (r.usosMaximos ?? 1)
        || !esRasgoHabilitadoPorOpcion(r, pj.rasgos) || obtenerNivelEfectivoParaRasgo(pj, r) < (r.nivelRequerido ?? 1)) return pj;
      const padre = resolverRasgoRecurso(r, pj.rasgos);
      const coste = r.costeRecargaPadre ?? 1;
      if (!padre?.tieneUsosLimitados || (padre.usosRestantes ?? padre.usosMaximos ?? 0) < coste) return pj;
      return { ...pj, rasgos: pj.rasgos.map(x => x === r ? { ...x, usosRestantes: (x.usosRestantes ?? 0) + 1 }
        : x === padre ? { ...x, usosRestantes: (x.usosRestantes ?? x.usosMaximos ?? 0) - coste } : x) };
    });
  },
recargarUsoRasgoConPacto: (idPj, idRasgo) => {
    mutarPersonaje(set, idPj, pj => {
      const r = pj.rasgos.find(r => r.id === idRasgo);
      if (!r?.recargarUsoConPacto || !r.tieneUsosLimitados || (r.usosRestantes ?? r.usosMaximos ?? 0) >= (r.usosMaximos ?? 1)
        || pj.espaciosPactoGastados >= pj.espaciosPactoMaximos || !esRasgoHabilitadoPorOpcion(r, pj.rasgos)
        || obtenerNivelEfectivoParaRasgo(pj, r) < (r.nivelRequerido ?? 1)) return pj;
      return { ...pj, espaciosPactoGastados: pj.espaciosPactoGastados + 1,
        rasgos: pj.rasgos.map(x => x === r ? { ...x, usosRestantes: Math.min(x.usosMaximos ?? 1, (x.usosRestantes ?? 0) + 1) } : x) };
    });
  },
gastarUsoRasgoPersonaje: (idPj, idRasgo, cantidad = 1) => {
    const cant = Math.max(1, typeof cantidad === "number" && !isNaN(cantidad) ? cantidad : 1);
    mutarPersonaje(set, idPj, (pj) => {
      const targetTrait = (pj.rasgos || []).find((r) => r.id === idRasgo);
      const idObjetivoGasto = resolverIdRasgoObjetivoGasto(targetTrait, pj.rasgos || []);
      const recurso = (pj.rasgos ?? []).find(r => r.id === idObjetivoGasto);
      if (!targetTrait || !recurso || (recurso.usosRestantes ?? recurso.usosMaximos ?? 0) < cant) return pj;
      if (targetTrait.requiereRasgosActivos?.some(id => !pj.rasgos.some(r => r.id === id && r.activo))) return pj;
      if (targetTrait.ligadoA && !pj.rasgos.some(r => (r.id === targetTrait.ligadoA || r.nombre === targetTrait.ligadoA) && r.activo)) return pj;
      if (!esRasgoHabilitadoPorOpcion(targetTrait, pj.rasgos) || obtenerNivelEfectivoParaRasgo(pj, targetTrait) < (targetTrait.nivelRequerido ?? 1)) return pj;
      const tieneUsoPropioYPadre =
        Boolean(targetTrait && targetTrait.tieneUsosLimitados && targetTrait.gastarDePadre && idObjetivoGasto !== targetTrait.id);

      const rasgosActualizados = (pj.rasgos || []).map((r) => {
        if (tieneUsoPropioYPadre) {
          if (r.id === targetTrait?.id) {
            const maxUsos = r.formulaEscalado ? calcularUsosMaximosRasgo(r, pj) : (r.usosMaximos ?? 1);
            const restantes = r.usosRestantes ?? maxUsos;
            return {
              ...r,
              usosMaximos: maxUsos,
              usosRestantes: Math.max(0, restantes - 1)
            };
          }
          if (r.id === idObjetivoGasto && r.tieneUsosLimitados) {
            const maxUsos = r.formulaEscalado ? calcularUsosMaximosRasgo(r, pj) : (r.usosMaximos ?? 1);
            const restantes = r.usosRestantes ?? maxUsos;
            return {
              ...r,
              usosMaximos: maxUsos,
              usosRestantes: Math.max(0, restantes - cant)
            };
          }
        } else if (r.id === idObjetivoGasto && r.tieneUsosLimitados) {
          const maxUsos = r.formulaEscalado
            ? calcularUsosMaximosRasgo(r, pj)
            : (r.usosMaximos ?? 1);
          const restantes = r.usosRestantes ?? maxUsos;
          return {
            ...r,
            usosMaximos: maxUsos,
            usosRestantes: Math.max(0, restantes - cant)
          };
        }
        return r;
      });
      const recuperados = targetTrait.recuperarPactoAlUsar === "maximo" ? pj.espaciosPactoMaximos
        : targetTrait.recuperarPactoAlUsar === "mitad_maximo" ? Math.ceil(pj.espaciosPactoMaximos / 2) : 0;
      return aplicarHpTemporalPorEvento({ ...pj, rasgos: rasgosActualizados,
        espaciosPactoGastados: Math.max(0, pj.espaciosPactoGastados - recuperados) }, "uso", targetTrait.id);
    });
  },

recuperarUsoRasgoPersonaje: (idPj, idRasgo, cantidad = 1) => {
    const cant = Math.max(1, typeof cantidad === "number" && !isNaN(cantidad) ? cantidad : 1);
    mutarPersonaje(set, idPj, (pj) => {
      const targetTrait = (pj.rasgos || []).find((r) => r.id === idRasgo);
      const idObjetivoGasto = resolverIdRasgoObjetivoGasto(targetTrait, pj.rasgos || []);
      const tieneUsoPropioYPadre =
        Boolean(targetTrait && targetTrait.tieneUsosLimitados && targetTrait.gastarDePadre && idObjetivoGasto !== targetTrait.id);

      const rasgosActualizados = (pj.rasgos || []).map((r) => {
        if (tieneUsoPropioYPadre) {
          if (r.id === targetTrait?.id) {
            const maxUsos = r.formulaEscalado ? calcularUsosMaximosRasgo(r, pj) : (r.usosMaximos ?? 1);
            const restantes = r.usosRestantes ?? 0;
            return {
              ...r,
              usosMaximos: maxUsos,
              usosRestantes: Math.min(maxUsos, restantes + 1)
            };
          }
          if (r.id === idObjetivoGasto && r.tieneUsosLimitados) {
            const maxUsos = r.formulaEscalado ? calcularUsosMaximosRasgo(r, pj) : (r.usosMaximos ?? 1);
            const restantes = r.usosRestantes ?? 0;
            return {
              ...r,
              usosMaximos: maxUsos,
              usosRestantes: Math.min(maxUsos, restantes + cant)
            };
          }
        } else if (r.id === idObjetivoGasto && r.tieneUsosLimitados) {
          const maxUsos = r.formulaEscalado
            ? calcularUsosMaximosRasgo(r, pj)
            : (r.usosMaximos ?? 1);
          const restantes = r.usosRestantes ?? 0;
          return {
            ...r,
            usosMaximos: maxUsos,
            usosRestantes: Math.min(maxUsos, restantes + cant)
          };
        }
        return r;
      });
      return { ...pj, rasgos: rasgosActualizados };
    });
  },

establecerUsosRestantesRasgoPersonaje: (idPj, idRasgo, usos) => {
    mutarPersonaje(set, idPj, (pj) => {
      const rasgosActualizados = (pj.rasgos || []).map((r) => {
        if (r.id === idRasgo && r.tieneUsosLimitados) {
          const maxUsos = r.formulaEscalado
            ? calcularUsosMaximosRasgo(r, pj)
            : (r.usosMaximos ?? 1);
          return {
            ...r,
            usosMaximos: maxUsos,
            usosRestantes: Math.max(0, Math.min(maxUsos, usos))
          };
        }
        return r;
      });
      return { ...pj, rasgos: rasgosActualizados };
    });
  },

guardarDadosRasgo: (idPj, idRasgo, dados) => {
    mutarPersonaje(set, idPj, (pj) => {
      const rasgosActualizados = (pj.rasgos || []).map((r) => {
        if (r.id === idRasgo) {
          return { ...r, dadosGuardados: [...dados] };
        }
        return r;
      });
      return { ...pj, rasgos: rasgosActualizados };
    });
  },

consumirDadoGuardado: (idPj, idRasgo, indiceDado) => {
    mutarPersonaje(set, idPj, (pj) => {
      const rasgosActualizados = (pj.rasgos || []).map((r) => {
        if (r.id === idRasgo && Array.isArray(r.dadosGuardados)) {
          const nuevosDados = r.dadosGuardados.filter((_, idx) => idx !== indiceDado);
          const maxUsos = r.formulaEscalado ? calcularUsosMaximosRasgo(r, pj) : (r.usosMaximos ?? 1);
          const restantes = r.usosRestantes ?? maxUsos;
          return {
            ...r,
            dadosGuardados: nuevosDados,
            usosRestantes: r.tieneUsosLimitados ? Math.max(0, restantes - 1) : r.usosRestantes
          };
        }
        return r;
      });
      return { ...pj, rasgos: rasgosActualizados };
    });
  },

recargarRasgoConEspacio: (idPj, idRasgo, nivelEspacio) => {
    const pj = get().personajes.find((p) => p.id === idPj);
    if (!pj) return;
    const rasgo = (pj.rasgos || []).find((r) => r.id === idRasgo);
    if (!rasgo) return;

    get().gastarEspacioConjuro(idPj, nivelEspacio);

    const mult = rasgo.multiplicadorRecargaEspacio ?? 2;
    const pgRecuperados = nivelEspacio * mult;

    let maxTemp = Infinity;
    const efectoHp = obtenerEfectoHpTemporalRasgo(rasgo);
    if (efectoHp) {
      const valorHp = calcularHpTemporalDeEfecto(efectoHp, pj);
      if (valorHp > 0) {
        maxTemp = valorHp;
      }
    } else if (rasgo.formulaDados) {
      const nivelEfectivo = pj.nivel || 1;
      const modInt = Math.floor(((pj.caracteristicas?.inteligencia || 10) - 10) / 2);
      maxTemp = 2 * nivelEfectivo + modInt;
    }

    const hpTempActual = pj.hpTemporal || 0;
    const nuevoHpTemp = Number.isFinite(maxTemp)
      ? Math.min(maxTemp, hpTempActual + pgRecuperados)
      : hpTempActual + pgRecuperados;

    get().modificarHPTemporalPersonaje(idPj, nuevoHpTemp);

    if (rasgo.condicionAlActivar) {
      const yaTiene = (pj.condicionesActivas || []).some((c) => coincideCondicionConRasgo(c, rasgo));
      if (!yaTiene) {
        get().aplicarCondicionPersonaje(idPj, rasgo.condicionAlActivar);
      }
    }
  }
});
