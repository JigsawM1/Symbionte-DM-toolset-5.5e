import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import { tieneMedioBonoHabilidades, aplicarAprendizDeMuchoAGradosHabilidades, calcularBonoHPMaximoRasgos, calcularUsosMaximosRasgo, esRasgoHabilitadoPorOpcion } from "@/servicios/evaluadorEfectosRasgos";
import { normalizar, resolverRasgoPadre } from "@/servicios/rasgos/utilidadesRasgos";
import { aplicarCondicion } from "@/servicios/procesadorCondiciones";
import { mutarPersonaje } from "../helpers/mutarPersonaje";
import type { SubSliceRasgos } from "./slicePersonajesTipos";
import { resolverIdRasgoObjetivoGasto, resolverCondicionAsociadaRasgo, coincideCondicionConRasgo } from "./condicionesRasgosHelpers";
import { EFECTOS_PREDEFINIDOS } from "@/utiles/datosIniciales";
import { generarId } from "@/utiles/generarId";

export const crearSliceActivacionRasgos: StateCreator<EstadoDM, [], [], Pick<SubSliceRasgos, "alternarActivoRasgo" | "dispararRasgosIniciativaPersonaje">> = (set, get) => ({
alternarActivoRasgo: (idPj, idRasgo) => {
    mutarPersonaje(set, idPj, (pj) => {
      let condicionesActualizadas = [...(pj.condicionesActivas || [])];

      const targetTrait = (pj.rasgos || []).find((r) => r.id === idRasgo);
      if (!targetTrait) return pj;

      const nuevoActivo = !targetTrait.activo;
      if (nuevoActivo && targetTrait.ligadoA) {
        const padre = resolverRasgoPadre(targetTrait, pj.rasgos || []);
        const padreActivo = padre && (
          (padre.esActivable ? padre.activo === true : padre.activo !== false) ||
          (pj.condicionesActivas || []).some((c) => coincideCondicionConRasgo(c, padre)) ||
          (pj.efectosActivos || []).some((e) => coincideCondicionConRasgo(e.nombre, padre))
        );
        if (!padreActivo) {
          return pj; // Bloqueado: rasgo padre requerido no está activo
        }
      }

      if (nuevoActivo && targetTrait.requiereOpcion && !esRasgoHabilitadoPorOpcion(targetTrait, pj.rasgos || [])) {
        return pj; // Bloqueado: opción requerida en rasgo padre no está seleccionada
      }

      if (nuevoActivo && targetTrait.requiereSinMovimiento && (pj.movimientoGastado || 0) > 0) {
        return pj; // Bloqueado: requiere no haberse movido durante este turno
      }

      // Si el rasgo gasta usos del padre al activarse, comprobar si el padre tiene usos disponibles
      const idObjetivoGasto = targetTrait.gastarDePadre ? resolverIdRasgoObjetivoGasto(targetTrait, pj.rasgos || []) : undefined;
      if (nuevoActivo && targetTrait.gastarDePadre && idObjetivoGasto) {
        const rasgoPadre = (pj.rasgos || []).find((r) => r.id === idObjetivoGasto);
        if (rasgoPadre && rasgoPadre.tieneUsosLimitados) {
          const maxUsos = rasgoPadre.usosMaximos ?? 1;
          const restantes = rasgoPadre.usosRestantes ?? maxUsos;
          if (restantes <= 0) {
            return pj; // Bloqueado: sin usos del recurso padre disponible
          }
        }
      }


      // Sincronización de condición asociada (personalizada o canónica)
      const condicionAsociada = resolverCondicionAsociadaRasgo(targetTrait);
      const debeAutoDesactivarTarget = Boolean(nuevoActivo && targetTrait.autoDesactivar);

      let efectosActualizados = pj.efectosActivos || [];
      if (condicionAsociada && !debeAutoDesactivarTarget) {
        const efectoDef = EFECTOS_PREDEFINIDOS.find((ep) => {
          const epNorm = ep.nombre.toLowerCase().trim();
          const epBase = ep.nombre.split(" (")[0].toLowerCase().trim();
          const asocNorm = condicionAsociada.toLowerCase().trim();
          const asocBase = condicionAsociada.split(" (")[0].toLowerCase().trim();
          return epNorm === asocNorm || epBase === asocBase || epNorm.includes(asocBase) || asocNorm.includes(epBase);
        });

        if (nuevoActivo) {
          const yaTieneCond = condicionesActualizadas.some((c) => coincideCondicionConRasgo(c, targetTrait));
          if (!yaTieneCond) {
            condicionesActualizadas = aplicarCondicion(condicionesActualizadas, condicionAsociada);
          }
          const duracionRondas = targetTrait.duracionEfectoAlActivar || efectoDef?.duracionEstandar || 0;
          if (duracionRondas > 0) {
            const nombreLimpioEfecto = efectoDef ? efectoDef.nombre.split(" (")[0] : condicionAsociada.split(" (")[0];
            const yaTieneEfecto = efectosActualizados.some((e) => e.nombre.toLowerCase().trim() === nombreLimpioEfecto.toLowerCase().trim());
            if (!yaTieneEfecto) {
              const rondaActual = get().rondaActual || 1;
              const nuevoEfecto = {
                id: generarId(nombreLimpioEfecto.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20)),
                nombre: nombreLimpioEfecto,
                expiraRonda: rondaActual + duracionRondas,
                duracion: duracionRondas,
                concentracion: efectoDef?.esConcentracion ?? false
              };
              efectosActualizados = [...efectosActualizados, nuevoEfecto];
            }
          }
        } else {
          condicionesActualizadas = condicionesActualizadas.filter((c) => !coincideCondicionConRasgo(c, targetTrait));
          const asocBase = condicionAsociada.split(" (")[0].toLowerCase().trim();
          efectosActualizados = efectosActualizados.filter((e) => {
            const eBase = e.nombre.split(" (")[0].toLowerCase().trim();
            return eBase !== asocBase && !coincideCondicionConRasgo(e.nombre, targetTrait);
          });
        }
      }

      // Desactivación en cascada para rasgos hijos si apagamos el rasgo
      const idsHijosADesactivar = new Set<string>();
      if (!nuevoActivo && targetTrait) {
        const tId = normalizar(targetTrait.id);
        const tNom = normalizar(targetTrait.nombre);
        for (const r of (pj.rasgos || [])) {
          if (r.activo && r.ligadoA) {
            const lig = normalizar(r.ligadoA);
            if (lig === tId || lig === tNom) {
              idsHijosADesactivar.add(r.id);
            }
          }
        }
      }

      // Si el rasgo se dispara al tirar iniciativa, no debe restaurar ni auto-desactivarse en este toggle manual
      const esDiferidoAIniciativa = Boolean(targetTrait.dispararAlTirarIniciativa);
      const restauracion = !esDiferidoAIniciativa ? targetTrait?.restaurarUsosAlActivar : undefined;

      const rasgosActualizados = (pj.rasgos || []).map((r) => {
        const rNom = r.nombre.toLowerCase().trim();

        // Apagar en cascada
        if (idsHijosADesactivar.has(r.id)) {
          return { ...r, activo: false };
        }

        // Restauración configurable
        if (nuevoActivo && restauracion && (r.id === restauracion.idRasgoObjetivo || rNom === restauracion.idRasgoObjetivo.toLowerCase().trim())) {
          const max = typeof r.usosMaximos === "number" ? r.usosMaximos : (r.usosRestantes ?? 1);
          let cantidadRestaurar: number;
          if (typeof restauracion.hastaCantidad === "number") {
            cantidadRestaurar = Math.min(max, Math.max(r.usosRestantes || 0, restauracion.hastaCantidad));
          } else if (restauracion.cantidad === "maximo") {
            cantidadRestaurar = max;
          } else {
            cantidadRestaurar = Math.min(max, (r.usosRestantes || 0) + (restauracion.cantidad || 0));
          }
          return { ...r, usosRestantes: cantidadRestaurar };
        }

        if (r.id === idRasgo) {
          let usosRest = r.usosRestantes;
          if (nuevoActivo && !esDiferidoAIniciativa && r.tieneUsosLimitados && typeof r.usosRestantes === "number") {
            usosRest = Math.max(0, r.usosRestantes - 1);
          }
          const debeAutoDesactivar = !!(nuevoActivo && !esDiferidoAIniciativa && r.autoDesactivar);
          return {
            ...r,
            activo: debeAutoDesactivar ? false : nuevoActivo,
            usosRestantes: usosRest
          };
        }

        // Si este elemento es el rasgo padre del activado, descontar 1 uso al activar
        if (nuevoActivo && targetTrait.gastarDePadre && idObjetivoGasto && r.id === idObjetivoGasto && r.tieneUsosLimitados) {
          const maxUsos = r.formulaEscalado ? calcularUsosMaximosRasgo(r, pj) : (r.usosMaximos ?? 1);
          const restantes = r.usosRestantes ?? maxUsos;
          return {
            ...r,
            usosRestantes: Math.max(0, restantes - 1)
          };
        }

        return r;
      });

      const pjPrevio = {
        ...pj,
        rasgos: rasgosActualizados,
        condicionesActivas: condicionesActualizadas,
        efectosActivos: efectosActualizados
      };
      const tieneAprendiz = tieneMedioBonoHabilidades(pjPrevio);
      const gradosActualizados = aplicarAprendizDeMuchoAGradosHabilidades(
        pj.gradosHabilidades,
        tieneAprendiz
      );

      const tieneEfectoHP = (targetTrait.efectos || []).some((e) => e.tipo === "modificador_hp_maximo");
      let hpMaximo = pj.hpMaximo;
      let hpActual = pj.hpActual;
      let hpMaximoBase = pj.hpMaximoBase;
      if (tieneEfectoHP) {
        const bonoPrevio = calcularBonoHPMaximoRasgos(pj);
        const bonoNuevo = calcularBonoHPMaximoRasgos(pjPrevio);
        const deltaBono = bonoNuevo - bonoPrevio;
        hpMaximoBase = Math.max(1, (pj.hpMaximoBase || pj.hpMaximo || 10) + deltaBono);
        hpMaximo = Math.max(1, (pj.hpMaximo || 1) + deltaBono);
        hpActual = Math.min(hpActual + (deltaBono > 0 ? deltaBono : 0), hpMaximo);
      }

      return {
        ...pjPrevio,
        hpMaximoBase,
        hpMaximo,
        hpActual,
        gradosHabilidades: gradosActualizados
      };
    });

    const state = get();
    if (state.colaIniciativa && state.colaIniciativa.length > 0) {
      const pjActualizado = state.personajes.find((p) => p.id === idPj);
      if (pjActualizado) {
        const nombreNorm = (pjActualizado.nombre || "").trim().toLowerCase();
        const nuevaCola = state.colaIniciativa.map((c) => {
          const coincide =
            c.id === pjActualizado.id ||
            (pjActualizado.idMiniaturaTS && c.id === pjActualizado.idMiniaturaTS) ||
            (nombreNorm && c.nombre.trim().toLowerCase() === nombreNorm);
          if (!coincide) return c;

          const efectosPj = pjActualizado.efectosActivos || [];
          const nombresEfectos = new Set(efectosPj.map((e) => e.nombre.toLowerCase().trim()));
          const tieneEfectoConcentracion = efectosPj.some(
            (ef) => ef.concentracion || ef.nombre.toLowerCase().startsWith("concentra")
          );
          const condicionesSinDuplicados = (pjActualizado.condicionesActivas || []).filter((cond) => {
            const cNorm = cond.toLowerCase().trim();
            const cBase = cond.split(" (")[0].toLowerCase().trim();
            if (tieneEfectoConcentracion && cNorm.includes("concentra")) return false;
            if (nombresEfectos.has(cNorm) || nombresEfectos.has(cBase)) return false;
            return true;
          });

          return { ...c, condiciones: condicionesSinDuplicados, efectos: efectosPj };
        });
        set({ colaIniciativa: nuevaCola });
      }
    }
  },

dispararRasgosIniciativaPersonaje: (idPj: string) => {
    mutarPersonaje(set, idPj, (pj) => {
      if (!Array.isArray(pj.rasgos) || pj.rasgos.length === 0) return pj;

      let huboCambios = false;
      const rasgosActualizados = pj.rasgos.map((r) => {
        if (!r.dispararAlTirarIniciativa) {
          return r;
        }

        // Si es activable, solo se dispara si está actualmente activo
        const estaHabilitado = r.esActivable ? r.activo : true;
        const tieneUsos = !r.tieneUsosLimitados || (typeof r.usosRestantes === "number" && r.usosRestantes > 0);

        if (!estaHabilitado || !tieneUsos) {
          return r;
        }

        huboCambios = true;

        let usosRest = r.usosRestantes;
        if (r.tieneUsosLimitados && typeof r.usosRestantes === "number") {
          usosRest = Math.max(0, r.usosRestantes - 1);
        }

        const debeAutoDesactivar = Boolean(r.autoDesactivar || r.esActivable);

        return {
          ...r,
          activo: debeAutoDesactivar ? false : r.activo,
          usosRestantes: usosRest
        };
      });

      if (!huboCambios) return pj;

      // Aplicar restauraciones declarativas de recursos para los rasgos que se dispararon
      const rasgosDisparados = pj.rasgos.filter((r) => {
        if (!r.dispararAlTirarIniciativa) return false;
        const estaHabilitado = r.esActivable ? r.activo : true;
        const tieneUsos = !r.tieneUsosLimitados || (typeof r.usosRestantes === "number" && r.usosRestantes > 0);
        return estaHabilitado && tieneUsos && r.restaurarUsosAlActivar;
      });

      for (const rd of rasgosDisparados) {
        if (rd.restaurarUsosAlActivar) {
          const cfg = rd.restaurarUsosAlActivar;
          if (cfg.siNoDisparado) {
            const siNoNorm = cfg.siNoDisparado.toLowerCase().trim();
            const otroDisparado = rasgosDisparados.some(
              (x) => x.id.toLowerCase().trim() === siNoNorm || x.nombre.toLowerCase().trim() === siNoNorm
            );
            if (otroDisparado) {
              continue;
            }
          }

          const targetId = cfg.idRasgoObjetivo.toLowerCase().trim();
          for (let i = 0; i < rasgosActualizados.length; i++) {
            const tr = rasgosActualizados[i];
            if (tr.id.toLowerCase().trim() === targetId || tr.nombre.toLowerCase().trim() === targetId) {
              if (typeof cfg.soloSiMenorOIgual === "number" && (tr.usosRestantes || 0) > cfg.soloSiMenorOIgual) {
                continue;
              }
              const max = typeof tr.usosMaximos === "number" ? tr.usosMaximos : (tr.usosRestantes ?? 1);
              let cantRestaurar: number;
              if (typeof cfg.hastaCantidad === "number") {
                cantRestaurar = Math.min(max, Math.max(tr.usosRestantes || 0, cfg.hastaCantidad));
              } else if (cfg.cantidad === "maximo") {
                cantRestaurar = max;
              } else {
                cantRestaurar = Math.min(max, (tr.usosRestantes || 0) + (cfg.cantidad || 0));
              }
              rasgosActualizados[i] = {
                ...tr,
                usosRestantes: cantRestaurar
              };
            }
          }
        }
      }

      return {
        ...pj,
        rasgos: rasgosActualizados
      };
    });
  }
});
