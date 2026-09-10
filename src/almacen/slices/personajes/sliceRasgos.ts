import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";
import {
  tieneMedioBonoHabilidades,
  aplicarAprendizDeMuchoAGradosHabilidades
} from "@/servicios/evaluadorEfectosRasgos";
import { aplicarCondicion } from "@/servicios/procesadorCondiciones";
import { mutarPersonaje } from "../helpers/mutarPersonaje";
import type { SubSliceRasgos } from "./slicePersonajesTipos";
import type { TamanoPersonaje } from "@/tipos";
import {
  resolverIdRasgoObjetivoGasto,
  resolverCondicionAsociadaRasgo,
  coincideCondicionConRasgo,
  normalizarTextoSeguro
} from "./condicionesRasgosHelpers";
import { EFECTOS_PREDEFINIDOS } from "@/utiles/datosIniciales";
import { generarId } from "@/utiles/generarId";

export const crearSubSliceRasgos: StateCreator<
  EstadoDM,
  [],
  [],
  SubSliceRasgos
> = (set, get) => ({
  agregarRasgoPersonaje: (idPj, rasgo) => {
    mutarPersonaje(set, idPj, (pj) => {
      const rasgosActuales = pj.rasgos || [];
      return {
        ...pj,
        rasgos: [...rasgosActuales, rasgo]
      };
    });
  },

  actualizarRasgoPersonaje: (idPj, idRasgo, cambios) => {
    mutarPersonaje(set, idPj, (pj) => {
      const rasgosActuales = (pj.rasgos || []).map((r) =>
        r.id === idRasgo ? { ...r, ...cambios } : r
      );
      return {
        ...pj,
        rasgos: rasgosActuales
      };
    });
  },

  eliminarRasgoPersonaje: (idPj, idRasgo) => {
    mutarPersonaje(set, idPj, (pj) => {
      const rasgosFiltrados = (pj.rasgos || []).filter((r) => r.id !== idRasgo);
      return {
        ...pj,
        rasgos: rasgosFiltrados
      };
    });
  },

  gastarUsoRasgoPersonaje: (idPj, idRasgo) => {
    mutarPersonaje(set, idPj, (pj) => {
      const targetTrait = (pj.rasgos || []).find((r) => r.id === idRasgo);
      const idObjetivoGasto = resolverIdRasgoObjetivoGasto(targetTrait, pj.rasgos || []);

      const rasgosActualizados = (pj.rasgos || []).map((r) => {
        if (r.id === idObjetivoGasto && r.tieneUsosLimitados) {
          const maxUsos = r.usosMaximos ?? 1;
          const restantes = r.usosRestantes ?? maxUsos;
          return {
            ...r,
            usosRestantes: Math.max(0, restantes - 1)
          };
        }
        return r;
      });
      return { ...pj, rasgos: rasgosActualizados };
    });
  },

  recuperarUsoRasgoPersonaje: (idPj, idRasgo) => {
    mutarPersonaje(set, idPj, (pj) => {
      const targetTrait = (pj.rasgos || []).find((r) => r.id === idRasgo);
      const idObjetivoGasto = resolverIdRasgoObjetivoGasto(targetTrait, pj.rasgos || []);

      const rasgosActualizados = (pj.rasgos || []).map((r) => {
        if (r.id === idObjetivoGasto && r.tieneUsosLimitados) {
          const maxUsos = r.usosMaximos ?? 1;
          const restantes = r.usosRestantes ?? 0;
          return {
            ...r,
            usosRestantes: Math.min(maxUsos, restantes + 1)
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
          const maxUsos = r.usosMaximos ?? 1;
          return {
            ...r,
            usosRestantes: Math.max(0, Math.min(maxUsos, usos))
          };
        }
        return r;
      });
      return { ...pj, rasgos: rasgosActualizados };
    });
  },

  sincronizarRasgosPersonaje: (idPj) => {
    mutarPersonaje(set, idPj, (pj) => {
      const rasgosSincronizados = sincronizarRasgosAutomaticos(pj);
      const pjConRasgos = { ...pj, rasgos: rasgosSincronizados };
      const tieneAprendiz = tieneMedioBonoHabilidades(pjConRasgos);
      const gradosActualizados = aplicarAprendizDeMuchoAGradosHabilidades(
        pj.gradosHabilidades,
        tieneAprendiz
      );
      return {
        ...pjConRasgos,
        gradosHabilidades: gradosActualizados
      };
    });
  },

  alternarActivoRasgo: (idPj, idRasgo) => {
    mutarPersonaje(set, idPj, (pj) => {
      let condicionesActualizadas = [...(pj.condicionesActivas || [])];

      const targetTrait = (pj.rasgos || []).find((r) => r.id === idRasgo);
      if (!targetTrait) return pj;

      const nuevoActivo = !targetTrait.activo;
      const nomObjetivo = targetTrait ? targetTrait.nombre.toLowerCase().trim() : "";
      const idObjetivo = targetTrait ? targetTrait.id.toLowerCase().trim() : idRasgo.toLowerCase().trim();

      const furiaEstaActiva = (pj.rasgos || []).some(
        (r) => (r.nombre.toLowerCase().trim() === "furia" || r.id.toLowerCase().trim() === "rasgo_cls_barbaro_furia") && r.activo
      ) || (pj.condicionesActivas || []).some(
        (c) => c.toLowerCase().includes("furia (rage)") || (c.toLowerCase().includes("furia") && !c.toLowerCase().includes("furia de los dioses"))
      );

      // Comprobación de rasgo padre requerido (ligadoA)
      const padreKey = targetTrait?.ligadoA ? targetTrait.ligadoA.toLowerCase().trim() : undefined;
      if (nuevoActivo && padreKey) {
        const padreActivo = (pj.rasgos || []).some(
          (r) => (r.id.toLowerCase() === padreKey || r.nombre.toLowerCase().trim() === padreKey || (padreKey.includes("furia") && (r.nombre.toLowerCase().trim() === "furia" || r.id === "rasgo_cls_barbaro_furia"))) && r.activo
        ) || (pj.condicionesActivas || []).some(
          (c) => c.toLowerCase().includes(padreKey)
        );
        if (!padreActivo) {
          return pj; // Bloqueado: rasgo padre requerido no está activo
        }
      }

      const esFuriaDivina = nomObjetivo.includes("furia divina") || idObjetivo.includes("furia_divina");
      const esGolpeBrutal = nomObjetivo.includes("golpe brutal") || idObjetivo.includes("golpe_brutal");
      const esFuriaDeLosDioses = nomObjetivo.includes("furia de los dioses") || idObjetivo.includes("furia_de_los_dioses");

      // Regla canónica: Furia divina, Golpe brutal y Furia de los dioses solo se deben poder activar si Furia está activa
      if (nuevoActivo && (esFuriaDivina || esGolpeBrutal || esFuriaDeLosDioses) && !furiaEstaActiva) {
        return pj;
      }

      const esFuriaPersistente = nomObjetivo.includes("furia persistente") || idObjetivo.includes("furia_persistente");
      const esFuriaBase = (nomObjetivo === "furia" || idObjetivo === "rasgo_cls_barbaro_furia") && !esFuriaDeLosDioses && !esFuriaPersistente;

      // Sincronización de condición asociada (personalizada o canónica)
      const condicionAsociada = resolverCondicionAsociadaRasgo(targetTrait);
      const debeAutoDesactivarTarget = Boolean(nuevoActivo && (targetTrait.autoDesactivar || esFuriaPersistente));

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
          if (efectoDef && efectoDef.duracionEstandar > 0) {
            const nombreLimpioEfecto = efectoDef.nombre.split(" (")[0];
            const yaTieneEfecto = efectosActualizados.some((e) => e.nombre.toLowerCase().trim() === nombreLimpioEfecto.toLowerCase().trim());
            if (!yaTieneEfecto) {
              const rondaActual = get().rondaActual || 1;
              const nuevoEfecto = {
                id: generarId(nombreLimpioEfecto.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20)),
                nombre: nombreLimpioEfecto,
                expiraRonda: rondaActual + efectoDef.duracionEstandar,
                concentracion: efectoDef.esConcentracion
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
        const tId = targetTrait.id.toLowerCase();
        const tNom = targetTrait.nombre.toLowerCase().trim();
        for (const r of (pj.rasgos || [])) {
          if (r.activo && r.ligadoA) {
            const lig = r.ligadoA.toLowerCase().trim();
            if (lig === tId || lig === tNom || (esFuriaBase && lig.includes("furia") && !lig.includes("dioses"))) {
              idsHijosADesactivar.add(r.id);
            }
          }
          if (esFuriaBase && (r.nombre.toLowerCase().includes("furia divina") || r.id.includes("furia_divina") || r.nombre.toLowerCase().includes("golpe brutal") || r.id.includes("golpe_brutal") || r.nombre.toLowerCase().includes("furia de los dioses") || r.id.includes("furia_de_los_dioses"))) {
            idsHijosADesactivar.add(r.id);
          }
        }
      }

      // Restauración de recursos al activar
      const restauracion = targetTrait?.restaurarUsosAlActivar;

      const rasgosActualizados = (pj.rasgos || []).map((r) => {
        const rNom = r.nombre.toLowerCase().trim();
        const rId = r.id.toLowerCase().trim();

        // Apagar en cascada
        if (idsHijosADesactivar.has(r.id)) {
          return { ...r, activo: false };
        }

        // Restauración configurable
        if (nuevoActivo && restauracion && (r.id === restauracion.idRasgoObjetivo || rNom === restauracion.idRasgoObjetivo.toLowerCase().trim())) {
          const max = typeof r.usosMaximos === "number" ? r.usosMaximos : (r.usosRestantes ?? 1);
          const cantidadRestaurar = restauracion.cantidad === "maximo" ? max : Math.min(max, (r.usosRestantes || 0) + restauracion.cantidad);
          return { ...r, usosRestantes: cantidadRestaurar };
        }

        // Furia Persistente canónica
        if (esFuriaPersistente && nuevoActivo && (rNom === "furia" || rId === "rasgo_cls_barbaro_furia")) {
          const max = typeof r.usosMaximos === "number" ? r.usosMaximos : (r.usosRestantes ?? 2);
          return { ...r, usosRestantes: max };
        }

        if (r.id === idRasgo) {
          let usosRest = r.usosRestantes;
          if (nuevoActivo && r.tieneUsosLimitados && typeof r.usosRestantes === "number") {
            usosRest = Math.max(0, r.usosRestantes - 1);
          }
          const debeAutoDesactivar = !!(nuevoActivo && (r.autoDesactivar || esFuriaPersistente));
          return {
            ...r,
            activo: debeAutoDesactivar ? false : nuevoActivo,
            usosRestantes: usosRest
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

      return {
        ...pjPrevio,
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

  actualizarSeleccionRasgo: (idPj, idRasgo, idSelector, valorActual) => {
    mutarPersonaje(set, idPj, (pj) => {
      let tamanoActualizado = pj.tamano;
      const esSelectorTamano =
        idSelector === "selector_tamano_especie" || idSelector.toLowerCase().includes("tamano");

      if (esSelectorTamano && valorActual && valorActual.length > 0) {
        const valNorm = normalizarTextoSeguro(valorActual[0]);
        if (valNorm.startsWith("pequen")) {
          tamanoActualizado = "Pequeño";
        } else if (valNorm.startsWith("median")) {
          tamanoActualizado = "Mediano";
        } else if (valNorm.startsWith("grand")) {
          tamanoActualizado = "Grande";
        } else if (valorActual[0]) {
          tamanoActualizado = valorActual[0] as TamanoPersonaje;
        }
      }

      let rasgoObjetivoActivo = false;
      let esRevelacionCelestial = false;
      let trucoPrevioAltoElfo: string | null = null;
      let nuevoTrucoAltoElfo: string | null = null;

      const rasgosActualizados = (pj.rasgos || []).map((r) => {
        if (r.id === idRasgo && Array.isArray(r.selectores)) {
          if (r.activo) rasgoObjetivoActivo = true;
          const rNom = normalizarTextoSeguro(r.nombre);
          if (rNom.includes("revelacion celestial") || r.id.includes("revelacion_celestial")) {
            esRevelacionCelestial = true;
          }

          if (idSelector === "selector_truco_alto_elfo" && valorActual?.[0]) {
            const selectorPrevio = r.selectores.find((s) => s.id === idSelector);
            trucoPrevioAltoElfo = selectorPrevio?.valorActual?.[0] || null;
            nuevoTrucoAltoElfo = valorActual[0];
          }

          const selectoresActualizados = r.selectores.map((s) =>
            s.id === idSelector ? { ...s, valorActual } : s
          );

          // Si cambió el truco del Alto elfo, sincronizar conjurosOtorgados en el rasgo
          let conjurosOtorgadosActualizados = r.conjurosOtorgados;
          if (nuevoTrucoAltoElfo) {
            conjurosOtorgadosActualizados = [
              nuevoTrucoAltoElfo,
              ...(r.conjurosOtorgados || []).filter((id) => id !== trucoPrevioAltoElfo && id !== nuevoTrucoAltoElfo)
            ];
          }

          return {
            ...r,
            conjurosOtorgados: conjurosOtorgadosActualizados,
            selectores: selectoresActualizados
          };
        }
        return r;
      });

      // Sincronizar trucosConocidosIds del personaje
      let trucosConocidosActualizados = pj.trucosConocidosIds || [];
      if (nuevoTrucoAltoElfo) {
        trucosConocidosActualizados = trucosConocidosActualizados.filter((t) => t !== trucoPrevioAltoElfo);
        if (!trucosConocidosActualizados.includes(nuevoTrucoAltoElfo)) {
          trucosConocidosActualizados = [...trucosConocidosActualizados, nuevoTrucoAltoElfo];
        }
      }

      let efectosActualizados = pj.efectosActivos || [];
      let condicionesActualizadas = pj.condicionesActivas || [];

      // Si se cambia la opción de Revelación celestial mientras está activa, sincronizar los efectos y condiciones
      if (esRevelacionCelestial && rasgoObjetivoActivo && valorActual && valorActual.length > 0) {
        const selVal = normalizarTextoSeguro(valorActual[0]);
        let nuevoNombreEfecto = "Alas Celestiales";
        if (selVal.includes("fulgor")) nuevoNombreEfecto = "Fulgor Interior";
        else if (selVal.includes("mortaja")) nuevoNombreEfecto = "Mortaja Necrótica";

        const efectoPrevio = efectosActualizados.find((e) => {
          const eNorm = normalizarTextoSeguro(e.nombre);
          return (
            eNorm.includes("alas celestiales") ||
            eNorm.includes("fulgor interior") ||
            eNorm.includes("mortaja necrotica")
          );
        });

        const rondaActual = get().rondaActual || 1;
        const expiraRonda =
          efectoPrevio?.expiraRonda && efectoPrevio.expiraRonda > rondaActual
            ? efectoPrevio.expiraRonda
            : rondaActual + 10;

        // Purgar efectos y condiciones previos de revelación
        efectosActualizados = efectosActualizados.filter((e) => {
          const eNorm = normalizarTextoSeguro(e.nombre);
          return (
            !eNorm.includes("alas celestiales") &&
            !eNorm.includes("fulgor interior") &&
            !eNorm.includes("mortaja necrotica")
          );
        });

        condicionesActualizadas = condicionesActualizadas.filter((c) => {
          const cNorm = normalizarTextoSeguro(c);
          return (
            !cNorm.includes("alas celestiales") &&
            !cNorm.includes("fulgor interior") &&
            !cNorm.includes("mortaja necrotica")
          );
        });

        efectosActualizados.push({
          id: generarId(nuevoNombreEfecto.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 20)),
          nombre: nuevoNombreEfecto,
          expiraRonda,
          concentracion: false
        });

        condicionesActualizadas = aplicarCondicion(condicionesActualizadas, nuevoNombreEfecto);
      }

      return {
        ...pj,
        tamano: tamanoActualizado,
        trucosConocidosIds: trucosConocidosActualizados,
        rasgos: rasgosActualizados,
        efectosActivos: efectosActualizados,
        condicionesActivas: condicionesActualizadas
      };
    });

    // Sincronizar cola de iniciativa si cambió revelación celestial
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
  }
});
