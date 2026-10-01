import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import type { GradoCompetencia, RegistroMovimiento } from "@/tipos";
import { MULTIPLICADOR_POR_TERRENO, INFORMACION_TERRENO } from "@/tipos";
import { tieneMedioBonoHabilidades, obtenerVelocidadesEfectivas } from "@/servicios/evaluadorEfectosRasgos";
import { calcularDistanciaMovimientoTS } from "@/servicios/calculadorDistanciaTS";
import { mutarPersonaje } from "../helpers/mutarPersonaje";
import type { SubSliceCaracteristicasHabilidades } from "./slicePersonajesTipos";

const ORDEN_CICLO_HABILIDAD: Record<GradoCompetencia, GradoCompetencia> = {
  ninguna: "medio",
  medio: "competente",
  competente: "pericia",
  pericia: "ninguna"
};

export const crearSubSliceCaracteristicasHabilidades: StateCreator<
  EstadoDM,
  [],
  [],
  SubSliceCaracteristicasHabilidades
> = (set) => ({
  modificarCaracteristicaBasePersonaje: (id, carac, valor) => {
    mutarPersonaje(set, id, (pj) => {
      const nuevoValor = Math.max(1, Math.min(30, valor || 10));
      const nuevasCarac = {
        ...pj.caracteristicas,
        [carac]: nuevoValor
      };

      let rasgosActualizados = pj.rasgos;
      // Recalcular usos de rasgos cuyo límite escala con la característica modificada (genérico)
      if (Array.isArray(pj.rasgos)) {
        rasgosActualizados = pj.rasgos.map((r) => {
          const escalaConStat = (
            (r.escaladoUsos?.tipo === "por_modificador" && r.escaladoUsos.modificador === carac) ||
            (carac === "carisma" && (
              (r.formulaEscalado || "").toLowerCase().includes("carisma") ||
              (r.descripcion || "").toLowerCase().includes("modificador por carisma") ||
              (r.nombre || "").toLowerCase().includes("inspiracion bardica")
            ))
          );
          if (r.tieneUsosLimitados && escalaConStat) {
            const score = pj.overridesFijos?.[carac] ?? nuevoValor;
            const mod = Math.floor((score - 10) / 2);
            const minimo = r.escaladoUsos?.minimo ?? 1;
            const usosNuevos = Math.max(minimo, mod);
            const diferencia = usosNuevos - (r.usosMaximos ?? 1);
            const restantes = r.usosRestantes ?? (r.usosMaximos ?? 1);
            return {
              ...r,
              usosMaximos: usosNuevos,
              usosRestantes: Math.max(0, Math.min(usosNuevos, restantes + (diferencia > 0 ? diferencia : 0)))
            };
          }
          return r;
        });
      }



      return {
        ...pj,
        caracteristicas: nuevasCarac,
        rasgos: rasgosActualizados
      };
    });
  },

  alternarSalvacionPersonaje: (id, carac) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      competenciasSalvacion: {
        ...pj.competenciasSalvacion,
        [carac]: !pj.competenciasSalvacion[carac]
      }
    }));
  },

  ciclarGradoHabilidadPersonaje: (id, hab) => {
    mutarPersonaje(set, id, (pj) => {
      const tieneAprendiz = tieneMedioBonoHabilidades(pj);
      const gradoAlmacenado = pj.gradosHabilidades?.[hab] || "ninguna";
      const gradoActual = (gradoAlmacenado === "ninguna" && tieneAprendiz) ? "medio" : gradoAlmacenado;
      const nuevoGrado = ORDEN_CICLO_HABILIDAD[gradoActual] || "ninguna";
      const nuevoGradoFinal = (nuevoGrado === "ninguna" && tieneAprendiz) ? "medio" : nuevoGrado;
      return {
        ...pj,
        gradosHabilidades: {
          ...pj.gradosHabilidades,
          [hab]: nuevoGradoFinal
        }
      };
    });
  },

  establecerGradoHabilidadPersonaje: (id, hab, grado) => {
    mutarPersonaje(set, id, (pj) => {
      const tieneAprendiz = tieneMedioBonoHabilidades(pj);
      const gradoFinal = (grado === "ninguna" && tieneAprendiz) ? "medio" : grado;
      return {
        ...pj,
        gradosHabilidades: {
          ...pj.gradosHabilidades,
          [hab]: gradoFinal
        }
      };
    });
  },

  personalizarHabilidadPersonaje: (id, hab, datos) => {
    mutarPersonaje(set, id, (pj) => {
      const actual = pj.personalizacionesHabilidades?.[hab] || {
        modificadorExtra: 0,
        valorFijo: null,
        notas: ""
      };
      return {
        ...pj,
        personalizacionesHabilidades: {
          ...pj.personalizacionesHabilidades,
          [hab]: { ...actual, ...datos }
        }
      };
    });
  },

  personalizarCaracteristicaPersonaje: (id, carac, datos) => {
    mutarPersonaje(set, id, (pj) => {
      const actual = pj.personalizacionesCaracteristicas?.[carac] || {
        modificadorExtra: 0,
        valorFijo: null,
        bonoSalvacionExtra: 0,
        notas: ""
      };
      const nuevasPersonalizaciones = {
        ...pj.personalizacionesCaracteristicas,
        [carac]: { ...actual, ...datos }
      };

      let rasgosActualizados = pj.rasgos;
      if (carac === "carisma" && Array.isArray(pj.rasgos)) {
        const scoreBase = pj.overridesFijos?.carisma ?? pj.caracteristicas?.carisma ?? 10;
        const modBase = Math.floor((scoreBase - 10) / 2);
        const modEfectivo = datos.valorFijo !== undefined && datos.valorFijo !== null
          ? datos.valorFijo
          : modBase + (datos.modificadorExtra !== undefined ? datos.modificadorExtra : actual.modificadorExtra || 0);
        const usosNuevos = Math.max(1, modEfectivo);

        rasgosActualizados = pj.rasgos.map((r) => {
          const norm = (r.nombre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          if (
            norm.includes("inspiracion bardica") ||
            (r.tieneUsosLimitados && (r.formulaEscalado || "").toLowerCase().includes("carisma")) ||
            (r.tieneUsosLimitados && (r.descripcion || "").toLowerCase().includes("modificador por carisma"))
          ) {
            const diferencia = usosNuevos - (r.usosMaximos ?? 1);
            const restantes = r.usosRestantes ?? (r.usosMaximos ?? 1);
            return {
              ...r,
              usosMaximos: usosNuevos,
              usosRestantes: Math.max(0, Math.min(usosNuevos, restantes + (diferencia > 0 ? diferencia : 0)))
            };
          }
          return r;
        });
      }

      return {
        ...pj,
        personalizacionesCaracteristicas: nuevasPersonalizaciones,
        rasgos: rasgosActualizados
      };
    });
  },

  registrarMovimientoTSPersonaje: (id, nuevaPosicion, boardId, opciones) => {
    mutarPersonaje(set, id, (pj) => {
      // Si aún no tenemos registrada una posición previa, guardamos la actual como origen
      if (!pj.ultimaPosicionTS) {
        return {
          ...pj,
          ultimaPosicionTS: nuevaPosicion,
          ultimoBoardIdTS: boardId ?? null
        };
      }

      const opcionesFinales = {
        incluirAltura: true,
        multiplicadorTerreno: pj.multiplicadorTerreno || 1,
        ...opciones
      };

      const res = calcularDistanciaMovimientoTS(
        pj.ultimaPosicionTS,
        nuevaPosicion,
        pj.ultimoBoardIdTS,
        boardId,
        opcionesFinales
      );

      // Si cambió de subtablero (locId) o de mapa (boardId), no se resta movimiento, solo se reubica
      if (res.esCambioMapaOSubtablero) {
        return {
          ...pj,
          ultimaPosicionTS: nuevaPosicion,
          ultimoBoardIdTS: boardId ?? null
        };
      }

      // Si no hubo distancia (ej. micro-rotación o jitter filtrado)
      if (res.distanciaPies <= 0) {
        return pj;
      }

      const anteriorGastado = pj.movimientoGastado || 0;
      const nuevoGastado = Math.round((anteriorGastado + res.distanciaPies) * 10) / 10;

      const entradaHistorial: RegistroMovimiento = {
        id: `mov-ts-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        tipo: "talespire",
        delta: res.distanciaPies,
        anteriorGastado,
        nuevoGastado,
        posicionPrevia: pj.ultimaPosicionTS,
        descripcion: `Movimiento TaleSpire: +${res.distanciaPies} ft`
      };

      const historialPrevio = Array.isArray(pj.historialMovimiento) ? pj.historialMovimiento : [];

      return {
        ...pj,
        movimientoGastado: nuevoGastado,
        ultimaPosicionTS: nuevaPosicion,
        ultimoBoardIdTS: boardId ?? null,
        historialMovimiento: [...historialPrevio.slice(-49), entradaHistorial]
      };
    });
  },

  establecerPosicionInicialTSPersonaje: (id, posicion, boardId) => {
    mutarPersonaje(set, id, (pj) => {
      if (
        pj.ultimaPosicionTS &&
        pj.ultimaPosicionTS.x === posicion.x &&
        pj.ultimaPosicionTS.y === posicion.y &&
        pj.ultimaPosicionTS.z === posicion.z &&
        pj.ultimaPosicionTS.locId === posicion.locId &&
        pj.ultimoBoardIdTS === (boardId ?? null)
      ) {
        return pj;
      }

      return {
        ...pj,
        ultimaPosicionTS: posicion,
        ultimoBoardIdTS: boardId ?? pj.ultimoBoardIdTS ?? null
      };
    });
  },

  modificarMovimientoRestanteManualPersonaje: (id, nuevoRestante) => {
    mutarPersonaje(set, id, (pj) => {
      const velocidades = obtenerVelocidadesEfectivas(pj);
      const velNormal = velocidades.caminar;
      const total = pj.movimientoMaximoTemporal !== null && pj.movimientoMaximoTemporal !== undefined
        ? pj.movimientoMaximoTemporal
        : velNormal;

      const restanteSeguro = Math.max(0, Math.round(nuevoRestante * 10) / 10);
      const nuevoGastado = Math.max(0, Math.round((total - restanteSeguro) * 10) / 10);
      const anteriorGastado = pj.movimientoGastado || 0;
      const delta = Math.round((nuevoGastado - anteriorGastado) * 10) / 10;

      if (delta === 0) return pj;

      const entradaHistorial: RegistroMovimiento = {
        id: `mov-man-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        tipo: "manual",
        delta,
        anteriorGastado,
        nuevoGastado,
        descripcion: `Ajuste manual a ${restanteSeguro} ft restantes`
      };

      const historialPrevio = Array.isArray(pj.historialMovimiento) ? pj.historialMovimiento : [];

      return {
        ...pj,
        movimientoGastado: nuevoGastado,
        historialMovimiento: [...historialPrevio.slice(-49), entradaHistorial]
      };
    });
  },

  modificarMovimientoGastadoPersonaje: (id, delta, motivo = "Ajuste manual") => {
    mutarPersonaje(set, id, (pj) => {
      const anteriorGastado = pj.movimientoGastado || 0;
      const nuevoGastado = Math.max(0, Math.round((anteriorGastado + delta) * 10) / 10);
      if (anteriorGastado === nuevoGastado) return pj;

      const deltaRedondeado = Math.round(delta * 10) / 10;
      const entradaHistorial: RegistroMovimiento = {
        id: `mov-adj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        tipo: "manual",
        delta: deltaRedondeado,
        anteriorGastado,
        nuevoGastado,
        descripcion: `${motivo} (${deltaRedondeado > 0 ? `+${deltaRedondeado}` : `${deltaRedondeado}`} ft)`
      };

      const historialPrevio = Array.isArray(pj.historialMovimiento) ? pj.historialMovimiento : [];

      return {
        ...pj,
        movimientoGastado: nuevoGastado,
        historialMovimiento: [...historialPrevio.slice(-49), entradaHistorial]
      };
    });
  },

  deshacerUltimoMovimientoPersonaje: (id) => {
    mutarPersonaje(set, id, (pj) => {
      const historial = Array.isArray(pj.historialMovimiento) ? pj.historialMovimiento : [];
      if (historial.length === 0) return pj;

      const ultimo = historial[historial.length - 1];
      const nuevoHistorial = historial.slice(0, -1);

      return {
        ...pj,
        movimientoGastado: Math.max(0, ultimo.anteriorGastado),
        movimientoMaximoTemporal: ultimo.tipo === "carrera" ? null : pj.movimientoMaximoTemporal,
        ultimaPosicionTS: ultimo.posicionPrevia ? ultimo.posicionPrevia : pj.ultimaPosicionTS,
        historialMovimiento: nuevoHistorial
      };
    });
  },

  restablecerMovimientoPersonaje: (id) => {
    mutarPersonaje(set, id, (pj) => {
      const anteriorGastado = pj.movimientoGastado || 0;
      const teniaCarrera = pj.movimientoMaximoTemporal !== null;

      if (anteriorGastado === 0 && !teniaCarrera) return pj;

      const entradaHistorial: RegistroMovimiento = {
        id: `mov-rst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        tipo: "reinicio",
        delta: -anteriorGastado,
        anteriorGastado,
        nuevoGastado: 0,
        descripcion: "Restablecimiento de turno"
      };

      const historialPrevio = Array.isArray(pj.historialMovimiento) ? pj.historialMovimiento : [];

      return {
        ...pj,
        movimientoGastado: 0,
        movimientoMaximoTemporal: null,
        historialMovimiento: [...historialPrevio.slice(-49), entradaHistorial]
      };
    });
  },

  alternarAccionCarreraPersonaje: (id) => {
    mutarPersonaje(set, id, (pj) => {
      const velocidades = obtenerVelocidadesEfectivas(pj);
      const velNormal = velocidades.caminar;
      const anteriorGastado = pj.movimientoGastado || 0;

      // Si ya está activa la carrera, la desactivamos
      if (pj.movimientoMaximoTemporal !== null && pj.movimientoMaximoTemporal !== undefined) {
        const entradaHistorial: RegistroMovimiento = {
          id: `mov-dash-off-${Date.now()}`,
          timestamp: Date.now(),
          tipo: "carrera",
          delta: -velNormal,
          anteriorGastado,
          nuevoGastado: anteriorGastado,
          descripcion: "Desactivar Acción Carrera"
        };
        const historialPrevio = Array.isArray(pj.historialMovimiento) ? pj.historialMovimiento : [];
        return {
          ...pj,
          movimientoMaximoTemporal: null,
          historialMovimiento: [...historialPrevio.slice(-49), entradaHistorial]
        };
      }

      // Activar carrera (duplica la velocidad disponible en el turno)
      const velocidadCarrera = velNormal * 2;
      const entradaHistorial: RegistroMovimiento = {
        id: `mov-dash-on-${Date.now()}`,
        timestamp: Date.now(),
        tipo: "carrera",
        delta: velNormal,
        anteriorGastado,
        nuevoGastado: anteriorGastado,
        descripcion: `Acción Carrera activada (+${velNormal} ft)`
      };
      const historialPrevio = Array.isArray(pj.historialMovimiento) ? pj.historialMovimiento : [];

      return {
        ...pj,
        movimientoMaximoTemporal: velocidadCarrera,
        historialMovimiento: [...historialPrevio.slice(-49), entradaHistorial]
      };
    });
  },

  establecerTipoTerrenoPersonaje: (id, tipo) => {
    mutarPersonaje(set, id, (pj) => {
      const multiplicador = MULTIPLICADOR_POR_TERRENO[tipo] ?? 1;
      if (pj.tipoTerreno === tipo && pj.multiplicadorTerreno === multiplicador) {
        return pj;
      }

      const infoTerreno = INFORMACION_TERRENO[tipo] || { nombre: tipo, costePies: `${multiplicador}x` };
      const entradaHistorial: RegistroMovimiento = {
        id: `mov-terr-${Date.now()}`,
        timestamp: Date.now(),
        tipo: "terreno",
        delta: 0,
        anteriorGastado: pj.movimientoGastado || 0,
        nuevoGastado: pj.movimientoGastado || 0,
        descripcion: `Terreno cambiado a: ${infoTerreno.nombre} (${infoTerreno.costePies})`
      };
      const historialPrevio = Array.isArray(pj.historialMovimiento) ? pj.historialMovimiento : [];

      return {
        ...pj,
        tipoTerreno: tipo,
        multiplicadorTerreno: multiplicador,
        historialMovimiento: [...historialPrevio.slice(-49), entradaHistorial]
      };
    });
  }
});
