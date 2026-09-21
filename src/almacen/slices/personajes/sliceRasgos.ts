import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";
import { obtenerMaxInvocacionesBrujo } from "@/constantes/invocacionesSobrenaturales";
import {
  tieneMedioBonoHabilidades,
  aplicarAprendizDeMuchoAGradosHabilidades,
  calcularBonoHPMaximoRasgos,
  calcularUsosMaximosRasgo
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
      let rasgoAjustado = rasgo;
      if (rasgo.tieneUsosLimitados) {
        const maxUsos = rasgo.formulaEscalado
          ? calcularUsosMaximosRasgo(rasgo, pj)
          : (rasgo.usosMaximos ?? 1);
        rasgoAjustado = {
          ...rasgo,
          usosMaximos: maxUsos,
          usosRestantes: rasgo.usosRestantes !== undefined ? rasgo.usosRestantes : maxUsos
        };
      }
      const rasgosActuales = [...(pj.rasgos || []), rasgoAjustado];
      const pjTemp = { ...pj, rasgos: rasgosActuales };
      const bonoPrevio = calcularBonoHPMaximoRasgos(pj);
      const bonoNuevo = calcularBonoHPMaximoRasgos(pjTemp);
      const deltaBono = bonoNuevo - bonoPrevio;
      const nuevoBase = Math.max(1, (pj.hpMaximoBase || pj.hpMaximo || 10) + deltaBono);
      const nuevoMax = Math.max(1, (pj.hpMaximo || 1) + deltaBono);
      return {
        ...pjTemp,
        hpMaximoBase: nuevoBase,
        hpMaximo: nuevoMax,
        hpActual: Math.min(pj.hpActual + (deltaBono > 0 ? deltaBono : 0), nuevoMax)
      };
    });
  },

  actualizarRasgoPersonaje: (idPj, idRasgo, cambios) => {
    mutarPersonaje(set, idPj, (pj) => {
      const rasgosActuales = (pj.rasgos || []).map((r) =>
        r.id === idRasgo ? { ...r, ...cambios } : r
      );
      const pjTemp = { ...pj, rasgos: rasgosActuales };
      const bonoPrevio = calcularBonoHPMaximoRasgos(pj);
      const bonoNuevo = calcularBonoHPMaximoRasgos(pjTemp);
      const deltaBono = bonoNuevo - bonoPrevio;
      const nuevoBase = Math.max(1, (pj.hpMaximoBase || pj.hpMaximo || 10) + deltaBono);
      const nuevoMax = Math.max(1, (pj.hpMaximo || 1) + deltaBono);
      return {
        ...pjTemp,
        hpMaximoBase: nuevoBase,
        hpMaximo: nuevoMax,
        hpActual: Math.min(pj.hpActual + (deltaBono > 0 ? deltaBono : 0), nuevoMax)
      };
    });
  },

  eliminarRasgoPersonaje: (idPj, idRasgo) => {
    mutarPersonaje(set, idPj, (pj) => {
      const rasgoAEliminar = (pj.rasgos || []).find((r) => r.id === idRasgo);
      const rasgosFiltrados = (pj.rasgos || []).filter((r) => r.id !== idRasgo);
      const pjTemp = { ...pj, rasgos: rasgosFiltrados };

      // Purgar conjuros y trucos que otorgaba exclusivamente este rasgo
      let conjurosSiempre = [...(pj.conjurosSiemprePreparadosIds || [])];
      let conjurosPrep = [...(pj.conjurosPreparadosIds || [])];
      let conjurosConoc = [...(pj.conjurosConocidosIds || [])];
      let trucosConoc = [...(pj.trucosConocidosIds || [])];

      if (rasgoAEliminar) {
        const conjurosDelRasgo = new Set<string>();
        if (Array.isArray(rasgoAEliminar.conjurosOtorgados)) {
          rasgoAEliminar.conjurosOtorgados.forEach((c) => c && conjurosDelRasgo.add(c.toLowerCase().trim()));
        }
        if (Array.isArray(rasgoAEliminar.selectores)) {
          rasgoAEliminar.selectores.forEach((s) => {
            (s.valorActual || []).forEach((v) => v && conjurosDelRasgo.add(v.toLowerCase().trim()));
          });
        }
        if (Array.isArray(rasgoAEliminar.efectos)) {
          rasgoAEliminar.efectos.forEach((ef) => {
            if (ef.tipo === "conjuro_otorgado" || ef.tipo === "conjuro_gratuito") {
              const val = String(ef.objetivo || ef.valor || "").toLowerCase().trim();
              if (val) conjurosDelRasgo.add(val);
            }
          });
        }

        if (conjurosDelRasgo.size > 0) {
          // Verificar qué conjuros siguen otorgados por los rasgos restantes
          const conjurosRestantes = new Set<string>();
          for (const r of rasgosFiltrados) {
            if (Array.isArray(r.conjurosOtorgados)) {
              r.conjurosOtorgados.forEach((c) => c && conjurosRestantes.add(c.toLowerCase().trim()));
            }
            if (Array.isArray(r.selectores)) {
              r.selectores.forEach((s) => {
                (s.valorActual || []).forEach((v) => v && conjurosRestantes.add(v.toLowerCase().trim()));
              });
            }
          }

          const debeEliminarse = (idOTexto: string) => {
            const norm = idOTexto.toLowerCase().trim();
            return conjurosDelRasgo.has(norm) && !conjurosRestantes.has(norm);
          };

          conjurosSiempre = conjurosSiempre.filter((c) => !debeEliminarse(c));
          conjurosPrep = conjurosPrep.filter((c) => !debeEliminarse(c));
          conjurosConoc = conjurosConoc.filter((c) => !debeEliminarse(c));
          trucosConoc = trucosConoc.filter((t) => !debeEliminarse(t));
        }
      }

      const bonoPrevio = calcularBonoHPMaximoRasgos(pj);
      const bonoNuevo = calcularBonoHPMaximoRasgos(pjTemp);
      const deltaBono = bonoNuevo - bonoPrevio;
      const nuevoBase = Math.max(1, (pj.hpMaximoBase || pj.hpMaximo || 10) + deltaBono);
      const nuevoMax = Math.max(1, (pj.hpMaximo || 1) + deltaBono);
      return {
        ...pjTemp,
        hpMaximoBase: nuevoBase,
        hpMaximo: nuevoMax,
        hpActual: Math.min(pj.hpActual, nuevoMax),
        conjurosSiemprePreparadosIds: conjurosSiempre,
        conjurosPreparadosIds: conjurosPrep,
        conjurosConocidosIds: conjurosConoc,
        trucosConocidosIds: trucosConoc
      };
    });
  },

  gastarUsoRasgoPersonaje: (idPj, idRasgo) => {
    mutarPersonaje(set, idPj, (pj) => {
      const targetTrait = (pj.rasgos || []).find((r) => r.id === idRasgo);
      const idObjetivoGasto = resolverIdRasgoObjetivoGasto(targetTrait, pj.rasgos || []);

      const rasgosActualizados = (pj.rasgos || []).map((r) => {
        if (r.id === idObjetivoGasto && r.tieneUsosLimitados) {
          const maxUsos = r.formulaEscalado
            ? calcularUsosMaximosRasgo(r, pj)
            : (r.usosMaximos ?? 1);
          const restantes = r.usosRestantes ?? maxUsos;
          return {
            ...r,
            usosMaximos: maxUsos,
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
          const maxUsos = r.formulaEscalado
            ? calcularUsosMaximosRasgo(r, pj)
            : (r.usosMaximos ?? 1);
          const restantes = r.usosRestantes ?? 0;
          return {
            ...r,
            usosMaximos: maxUsos,
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

  sincronizarRasgosPersonaje: (idPj) => {
    mutarPersonaje(set, idPj, (pj) => {
      const rasgosBase = sincronizarRasgosAutomaticos(pj);
      const rasgosSincronizados = rasgosBase.map((r) => {
        if (r.tieneUsosLimitados && r.formulaEscalado) {
          const maxUsos = calcularUsosMaximosRasgo(r, pj);
          return {
            ...r,
            usosMaximos: maxUsos,
            usosRestantes: r.usosRestantes !== undefined ? Math.min(r.usosRestantes, maxUsos) : maxUsos
          };
        }
        return r;
      });
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

      // Comprobación de rasgo padre requerido (ligadoA, con fallback canónico si el rasgo carece de metadatos)
      const esFuriaDivina = nomObjetivo.includes("furia divina") || idObjetivo.includes("furia_divina");
      const esFrenesi = nomObjetivo.includes("frenesí") || idObjetivo.includes("frenesí");
      const esFuriaDeLosDioses = nomObjetivo.includes("furia de los dioses") || idObjetivo.includes("furia_de_los_dioses");
      const esGolpeBrutal = nomObjetivo.includes("golpe brutal") || idObjetivo.includes("golpe_brutal");

      const padreKey = targetTrait?.ligadoA
        ? targetTrait.ligadoA.toLowerCase().trim()
        : (esFuriaDivina || esFrenesi || esFuriaDeLosDioses
            ? "rasgo_cls_barbaro_furia"
            : (esGolpeBrutal ? "rasgo_cls_barbaro_ataque_temerario" : undefined));

      if (nuevoActivo && padreKey) {
        const padreActivo = (pj.rasgos || []).some(
          (r) => (
            r.id.toLowerCase() === padreKey ||
            r.nombre.toLowerCase().trim() === padreKey ||
            (padreKey.includes("furia") && (r.id === "furia" || r.id === "rasgo_cls_barbaro_furia")) ||
            (padreKey.includes("temerario") && (r.id.includes("temerario") || r.id.includes("reckless")))
          ) && r.activo
        ) || (pj.condicionesActivas || []).some(
          (c) => c.toLowerCase().includes(padreKey) || (padreKey.includes("temerario") && (c.toLowerCase().includes("temerario") || c.toLowerCase().includes("reckless")))
        ) || (pj.efectosActivos || []).some(
          (e) => padreKey.includes("temerario") && (e.id.includes("temerario") || e.id.includes("reckless"))
        );
        if (!padreActivo) {
          return pj; // Bloqueado: rasgo padre requerido no está activo
        }
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
        const tId = targetTrait.id.toLowerCase();
        const tNom = targetTrait.nombre.toLowerCase().trim();
        const esAtaqueTemerarioApagado = tNom.includes("temerario") || tId.includes("temerario") || tNom.includes("reckless") || tId.includes("reckless");
        for (const r of (pj.rasgos || [])) {
          if (r.activo && r.ligadoA) {
            const lig = r.ligadoA.toLowerCase().trim();
            if (
              lig === tId ||
              lig === tNom ||
              (esFuriaBase && lig.includes("furia") && !lig.includes("dioses")) ||
              (esAtaqueTemerarioApagado && (lig.includes("temerario") || lig.includes("reckless")))
            ) {
              idsHijosADesactivar.add(r.id);
            }
          }
          if (esFuriaBase && (r.id.includes("furia_divina") || r.id.includes("furia_de_los_dioses"))) {
            idsHijosADesactivar.add(r.id);
          }
          if (esAtaqueTemerarioApagado && r.id.includes("golpe_brutal")) {
            idsHijosADesactivar.add(r.id);
          }
        }
      }

      // Restauración de recursos al activar (declarativa vía restaurarUsosAlActivar)
      const restauracion = targetTrait?.restaurarUsosAlActivar || (
        esFuriaPersistente ? { idRasgoObjetivo: "rasgo_cls_barbaro_furia", cantidad: "maximo" as const } : undefined
      );

      const rasgosActualizados = (pj.rasgos || []).map((r) => {
        const rNom = r.nombre.toLowerCase().trim();

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

          const selectoresActualizados = r.selectores.map((s) => {
            if (s.id !== idSelector) return s;
            let maxSel = s.maxSelecciones;
            if (s.escaladoMaxSelecciones && pj.nivel) {
              const entrada = [...s.escaladoMaxSelecciones]
                .sort((a, b) => b.nivelMinimo - a.nivelMinimo)
                .find((e) => (pj.nivel || 1) >= e.nivelMinimo);
              if (entrada) maxSel = entrada.valor;
            } else if (s.id.toLowerCase().includes("invocacion") || s.etiqueta.toLowerCase().includes("invocaci")) {
              const claseBrujo = (pj.clases || []).find((c) => normalizarTextoSeguro(c.nombre).includes("brujo"));
              const nivelBrujo = claseBrujo?.nivel || pj.nivel || 1;
              maxSel = obtenerMaxInvocacionesBrujo(nivelBrujo);
            }
            return {
              ...s,
              maxSelecciones: maxSel,
              valorActual
            };
          });

          // Sincronizar reactivamente conjurosOtorgados a partir de los selectores de magia/conjuros
          const esRasgoConMagia =
            r.conjurosOtorgados !== undefined ||
            r.selectores.some((s) => {
              const sid = s.id.toLowerCase();
              return sid.includes("truco") || sid.includes("conjuro") || sid.includes("hechizo");
            });

          let conjurosOtorgadosActualizados = r.conjurosOtorgados ? [...r.conjurosOtorgados] : [];

          if (nuevoTrucoAltoElfo) {
            conjurosOtorgadosActualizados = [
              nuevoTrucoAltoElfo,
              ...conjurosOtorgadosActualizados.filter((id) => id !== trucoPrevioAltoElfo && id !== nuevoTrucoAltoElfo)
            ];
          } else if (esRasgoConMagia) {
            const nuevosMagicos: string[] = [];
            for (const s of selectoresActualizados) {
              const sid = s.id.toLowerCase();
              if (sid.includes("truco") || sid.includes("conjuro") || sid.includes("hechizo")) {
                for (const v of s.valorActual || []) {
                  if (v && !nuevosMagicos.includes(v)) {
                    nuevosMagicos.push(v);
                  }
                }
              }
            }
            conjurosOtorgadosActualizados = nuevosMagicos;
          }

          const usosRestantesActualizados =
            r.tieneUsosLimitados && r.usosRestantes === undefined
              ? (r.usosMaximos ?? 1)
              : r.usosRestantes;

          return {
            ...r,
            conjurosOtorgados: conjurosOtorgadosActualizados,
            usosRestantes: usosRestantesActualizados,
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

      // Sincronizar selectores de trucos y conjuros (ej. Iniciado en la Magia)
      const selectorModificadoLower = idSelector.toLowerCase();
      const esSelectorTruco = selectorModificadoLower.includes("truco") || selectorModificadoLower.includes("cantrip");
      const esSelectorConjuro = selectorModificadoLower.includes("conjuro") || selectorModificadoLower.includes("hechizo") || selectorModificadoLower.includes("spell");

      if (esSelectorTruco && Array.isArray(valorActual)) {
        const rasgoPrevio = (pj.rasgos || []).find((r) => r.id === idRasgo);
        const selectorPrevio = rasgoPrevio?.selectores?.find((s) => s.id === idSelector);
        const valoresViejos = selectorPrevio?.valorActual || [];
        trucosConocidosActualizados = trucosConocidosActualizados.filter((t) => !valoresViejos.includes(t) || valorActual.includes(t));
        valorActual.forEach((v) => {
          if (v && !trucosConocidosActualizados.includes(v)) {
            trucosConocidosActualizados.push(v);
          }
        });
      }

      let conjurosSiempreActualizados = pj.conjurosSiemprePreparadosIds || [];
      let conjurosPreparadosActualizados = pj.conjurosPreparadosIds || [];
      let conjurosConocidosActualizados = pj.conjurosConocidosIds || [];

      if (esSelectorConjuro && !esSelectorTruco && Array.isArray(valorActual)) {
        const rasgoPrevio = (pj.rasgos || []).find((r) => r.id === idRasgo);
        const selectorPrevio = rasgoPrevio?.selectores?.find((s) => s.id === idSelector);
        const valoresViejos = selectorPrevio?.valorActual || [];

        conjurosSiempreActualizados = conjurosSiempreActualizados.filter((c) => !valoresViejos.includes(c) || valorActual.includes(c));
        conjurosPreparadosActualizados = conjurosPreparadosActualizados.filter((c) => !valoresViejos.includes(c) || valorActual.includes(c));
        conjurosConocidosActualizados = conjurosConocidosActualizados.filter((c) => !valoresViejos.includes(c) || valorActual.includes(c));

        valorActual.forEach((v) => {
          if (v) {
            if (!conjurosSiempreActualizados.includes(v)) conjurosSiempreActualizados.push(v);
            if (!conjurosPreparadosActualizados.includes(v)) conjurosPreparadosActualizados.push(v);
            if (!conjurosConocidosActualizados.includes(v)) conjurosConocidosActualizados.push(v);
          }
        });
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
        conjurosSiemprePreparadosIds: conjurosSiempreActualizados,
        conjurosPreparadosIds: conjurosPreparadosActualizados,
        conjurosConocidosIds: conjurosConocidosActualizados,
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
