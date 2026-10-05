import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import type { RegistroMovimiento, VelocidadEstructurada } from "@/tipos";
import { MULTIPLICADOR_POR_TERRENO, INFORMACION_TERRENO } from "@/tipos";
import { calcularDistanciaMovimientoTS } from "@/servicios/calculadorDistanciaTS";
import { mutarPersonaje } from "../helpers/mutarPersonaje";
import type { SubSliceAcompanantes } from "./slicePersonajesTipos";

/**
 * Extrae numéricamente la velocidad de caminar en pies de un acompañante.
 */
function extraerVelocidadCaminarAcompanante(vel?: string | VelocidadEstructurada | number): number {
  if (typeof vel === "number") return Math.max(0, vel);
  if (typeof vel === "object" && vel !== null) return Math.max(0, vel.caminar || 30);
  if (typeof vel === "string") {
    const match = vel.match(/(\d+)\s*(?:pies|ft)?/i);
    if (match) return Math.max(0, parseInt(match[1], 10) || 30);
  }
  return 30;
}

/**
 * Sub-slice dedicado a la gestión reactiva de acompañantes y sidekicks vinculados a un personaje.
 */
export const crearSubSliceAcompanantes: StateCreator<
  EstadoDM,
  [],
  [],
  SubSliceAcompanantes
> = (set) => ({
  agregarAcompanantePersonaje: (idPersonaje, acompanante) => {
    mutarPersonaje(set, idPersonaje, (pj) => ({
      ...pj,
      acompanantes: [...(pj.acompanantes || []), acompanante]
    }));
  },

  eliminarAcompanantePersonaje: (idPersonaje, idAcompanante) => {
    mutarPersonaje(set, idPersonaje, (pj) => ({
      ...pj,
      acompanantes: (pj.acompanantes || []).filter((a) => a.id !== idAcompanante)
    }));
  },

  modificarVidaAcompanante: (idPersonaje, idAcompanante, vidaActual, vidaTemporal) => {
    mutarPersonaje(set, idPersonaje, (pj) => ({
      ...pj,
      acompanantes: (pj.acompanantes || []).map((a) => {
        if (a.id !== idAcompanante) return a;
        return {
          ...a,
          vidaActual: Math.max(0, Math.min(a.vidaMaxima, vidaActual)),
          ...(vidaTemporal !== undefined ? { vidaTemporal: Math.max(0, vidaTemporal) } : {})
        };
      })
    }));

    set((state) => {
      if (!state.colaIniciativa || state.colaIniciativa.length === 0) return {};
      let huboCambios = false;
      const nuevaCola = state.colaIniciativa.map((c) => {
        if (c.id === idAcompanante || c.idAcompanante === idAcompanante) {
          huboCambios = true;
          return {
            ...c,
            vidaActual: Math.max(0, Math.min(c.vidaMaxima, vidaActual)),
            ...(vidaTemporal !== undefined ? { vidaTemporal: Math.max(0, vidaTemporal) } : {})
          };
        }
        return c;
      });
      return huboCambios ? { colaIniciativa: nuevaCola } : {};
    });
  },

  actualizarAcompanante: (idPersonaje, idAcompanante, cambios) => {
    mutarPersonaje(set, idPersonaje, (pj) => ({
      ...pj,
      acompanantes: (pj.acompanantes || []).map((a) => {
        if (a.id !== idAcompanante) return a;
        return {
          ...a,
          ...cambios
        };
      })
    }));

    set((state) => {
      if (!state.colaIniciativa || state.colaIniciativa.length === 0) return {};
      let huboCambios = false;
      const acompActual = (state.personajes.find((p) => p.id === idPersonaje)?.acompanantes || []).find(
        (a) => a.id === idAcompanante
      );
      const nuevaCola = state.colaIniciativa.map((c) => {
        const coincideMini = acompActual?.idMiniaturaTS && c.id === acompActual.idMiniaturaTS;
        if (c.id === idAcompanante || c.idAcompanante === idAcompanante || coincideMini) {
          huboCambios = true;
          return {
            ...c,
            nombre: cambios.nombre ?? c.nombre,
            iniciativa: cambios.iniciativa !== undefined ? cambios.iniciativa : c.iniciativa,
            ca: cambios.ca ?? c.ca,
            vidaMaxima: cambios.vidaMaxima ?? c.vidaMaxima,
            vidaActual: cambios.vidaActual ?? c.vidaActual,
            vidaTemporal: cambios.vidaTemporal ?? c.vidaTemporal,
            velocidad: cambios.velocidad
              ? (typeof cambios.velocidad === "string" ? cambios.velocidad : `${cambios.velocidad.caminar || 30} pies`)
              : c.velocidad,
            movimientoGastado: cambios.movimientoGastado ?? c.movimientoGastado,
            movimientoMaximoTemporal:
              cambios.movimientoMaximoTemporal !== undefined
                ? cambios.movimientoMaximoTemporal
                : c.movimientoMaximoTemporal,
          };
        }
        return c;
      });
      return huboCambios ? { colaIniciativa: nuevaCola } : {};
    });
  },

  vincularMiniaturaTSAcompanante: (idPersonaje, idAcompanante, idMiniatura, posicionInicial, boardIdInicial) => {
    mutarPersonaje(set, idPersonaje, (pj) => ({
      ...pj,
      acompanantes: (pj.acompanantes || []).map((a) => {
        if (a.id !== idAcompanante) return a;
        return {
          ...a,
          idMiniaturaTS: idMiniatura,
          ...(posicionInicial && !a.ultimaPosicionTS ? { ultimaPosicionTS: posicionInicial, ultimoBoardIdTS: boardIdInicial ?? null } : {})
        };
      })
    }));
  },

  // =========================================================================
  // GESTIÓN DINÁMICA DE MOVIMIENTO Y TERRENO PARA ACOMPAÑANTES (D&D 5.5e / 3D)
  // =========================================================================

  registrarMovimientoTSAcompanante: (idPersonaje, idAcompanante, nuevaPosicion, boardId, opciones) => {
    mutarPersonaje(set, idPersonaje, (pj) => {
      const acompanantes = (pj.acompanantes || []).map((acomp) => {
        if (acomp.id !== idAcompanante) return acomp;

        // Si aún no tiene posición inicial, la establecemos como punto de partida
        if (!acomp.ultimaPosicionTS) {
          return {
            ...acomp,
            ultimaPosicionTS: nuevaPosicion,
            ultimoBoardIdTS: boardId ?? null
          };
        }

        const estaDerribado = (acomp.condiciones || []).some((c) => {
          const cn = c.toLowerCase().trim();
          return cn.includes("derribad") || cn.includes("prone") || cn === "caido" || cn === "caído";
        });

        const multEfectivo = estaDerribado
          ? Math.max(2, acomp.multiplicadorTerreno || 1)
          : (acomp.multiplicadorTerreno || 1);

        const opcionesFinales = {
          incluirAltura: true,
          multiplicadorTerreno: multEfectivo,
          ...opciones
        };

        const res = calcularDistanciaMovimientoTS(
          acomp.ultimaPosicionTS,
          nuevaPosicion,
          acomp.ultimoBoardIdTS,
          boardId,
          opcionesFinales
        );

        // Si cambió de mapa o subtablero, reubicamos sin restar movimiento
        if (res.esCambioMapaOSubtablero) {
          return {
            ...acomp,
            ultimaPosicionTS: nuevaPosicion,
            ultimoBoardIdTS: boardId ?? null
          };
        }

        if (res.distanciaPies <= 0) {
          return acomp;
        }

        const anteriorGastado = acomp.movimientoGastado || 0;
        const nuevoGastado = Math.round((anteriorGastado + res.distanciaPies) * 10) / 10;

        const entradaHistorial: RegistroMovimiento = {
          id: `mov-acomp-ts-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          tipo: "talespire",
          delta: res.distanciaPies,
          anteriorGastado,
          nuevoGastado,
          posicionPrevia: acomp.ultimaPosicionTS,
          descripcion: `Movimiento TaleSpire: +${res.distanciaPies} ft`
        };

        const historialPrevio = Array.isArray(acomp.historialMovimiento) ? acomp.historialMovimiento : [];

        return {
          ...acomp,
          movimientoGastado: nuevoGastado,
          ultimaPosicionTS: nuevaPosicion,
          ultimoBoardIdTS: boardId ?? null,
          historialMovimiento: [...historialPrevio.slice(-49), entradaHistorial]
        };
      });

      return {
        ...pj,
        acompanantes
      };
    });
  },

  establecerPosicionInicialTSAcompanante: (idPersonaje, idAcompanante, posicion, boardId) => {
    mutarPersonaje(set, idPersonaje, (pj) => ({
      ...pj,
      acompanantes: (pj.acompanantes || []).map((acomp) => {
        if (acomp.id !== idAcompanante) return acomp;
        return {
          ...acomp,
          ultimaPosicionTS: posicion,
          ultimoBoardIdTS: boardId ?? acomp.ultimoBoardIdTS ?? null
        };
      })
    }));
  },

  modificarMovimientoRestanteManualAcompanante: (idPersonaje, idAcompanante, nuevoRestante) => {
    mutarPersonaje(set, idPersonaje, (pj) => ({
      ...pj,
      acompanantes: (pj.acompanantes || []).map((acomp) => {
        if (acomp.id !== idAcompanante) return acomp;

        const velBase = extraerVelocidadCaminarAcompanante(acomp.velocidad);
        const total = acomp.movimientoMaximoTemporal !== null && acomp.movimientoMaximoTemporal !== undefined
          ? acomp.movimientoMaximoTemporal
          : velBase;

        const restanteSeguro = Math.max(0, Math.round(nuevoRestante * 10) / 10);
        const nuevoGastado = Math.max(0, Math.round((total - restanteSeguro) * 10) / 10);
        const anteriorGastado = acomp.movimientoGastado || 0;
        const delta = Math.round((nuevoGastado - anteriorGastado) * 10) / 10;

        if (delta === 0) return acomp;

        const entradaHistorial: RegistroMovimiento = {
          id: `mov-acomp-man-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          tipo: "manual",
          delta,
          anteriorGastado,
          nuevoGastado,
          descripcion: `Ajuste manual a ${restanteSeguro} ft restantes`
        };

        const historialPrevio = Array.isArray(acomp.historialMovimiento) ? acomp.historialMovimiento : [];

        return {
          ...acomp,
          movimientoGastado: nuevoGastado,
          historialMovimiento: [...historialPrevio.slice(-49), entradaHistorial]
        };
      })
    }));
  },

  modificarMovimientoGastadoAcompanante: (idPersonaje, idAcompanante, delta, motivo = "Ajuste manual") => {
    mutarPersonaje(set, idPersonaje, (pj) => ({
      ...pj,
      acompanantes: (pj.acompanantes || []).map((acomp) => {
        if (acomp.id !== idAcompanante) return acomp;

        const anteriorGastado = acomp.movimientoGastado || 0;
        const nuevoGastado = Math.max(0, Math.round((anteriorGastado + delta) * 10) / 10);
        if (anteriorGastado === nuevoGastado) return acomp;

        const deltaRedondeado = Math.round(delta * 10) / 10;
        const entradaHistorial: RegistroMovimiento = {
          id: `mov-acomp-adj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          tipo: "manual",
          delta: deltaRedondeado,
          anteriorGastado,
          nuevoGastado,
          descripcion: `${motivo} (${deltaRedondeado > 0 ? `+${deltaRedondeado}` : `${deltaRedondeado}`} ft)`
        };

        const historialPrevio = Array.isArray(acomp.historialMovimiento) ? acomp.historialMovimiento : [];

        return {
          ...acomp,
          movimientoGastado: nuevoGastado,
          historialMovimiento: [...historialPrevio.slice(-49), entradaHistorial]
        };
      })
    }));
  },

  deshacerUltimoMovimientoAcompanante: (idPersonaje, idAcompanante) => {
    mutarPersonaje(set, idPersonaje, (pj) => ({
      ...pj,
      acompanantes: (pj.acompanantes || []).map((acomp) => {
        if (acomp.id !== idAcompanante) return acomp;

        const historial = Array.isArray(acomp.historialMovimiento) ? acomp.historialMovimiento : [];
        if (historial.length === 0) return acomp;

        const ultimo = historial[historial.length - 1];
        const nuevoHistorial = historial.slice(0, -1);

        return {
          ...acomp,
          movimientoGastado: Math.max(0, ultimo.anteriorGastado),
          movimientoMaximoTemporal: ultimo.tipo === "carrera" ? null : acomp.movimientoMaximoTemporal,
          ultimaPosicionTS: ultimo.posicionPrevia ? ultimo.posicionPrevia : acomp.ultimaPosicionTS,
          historialMovimiento: nuevoHistorial
        };
      })
    }));
  },

  restablecerMovimientoAcompanante: (idPersonaje, idAcompanante) => {
    mutarPersonaje(set, idPersonaje, (pj) => ({
      ...pj,
      acompanantes: (pj.acompanantes || []).map((acomp) => {
        if (acomp.id !== idAcompanante) return acomp;

        const anteriorGastado = acomp.movimientoGastado || 0;
        const teniaCarrera = acomp.movimientoMaximoTemporal !== null;

        if (anteriorGastado === 0 && !teniaCarrera) return acomp;

        const entradaHistorial: RegistroMovimiento = {
          id: `mov-acomp-rst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          tipo: "reinicio",
          delta: -anteriorGastado,
          anteriorGastado,
          nuevoGastado: 0,
          descripcion: "Restablecimiento de turno"
        };

        const historialPrevio = Array.isArray(acomp.historialMovimiento) ? acomp.historialMovimiento : [];

        return {
          ...acomp,
          movimientoGastado: 0,
          movimientoMaximoTemporal: null,
          historialMovimiento: [...historialPrevio.slice(-49), entradaHistorial]
        };
      })
    }));
  },

  alternarAccionCarreraAcompanante: (idPersonaje, idAcompanante) => {
    mutarPersonaje(set, idPersonaje, (pj) => ({
      ...pj,
      acompanantes: (pj.acompanantes || []).map((acomp) => {
        if (acomp.id !== idAcompanante) return acomp;

        const velBase = extraerVelocidadCaminarAcompanante(acomp.velocidad);
        const anteriorGastado = acomp.movimientoGastado || 0;

        // Si ya está activa la carrera, la desactivamos
        if (acomp.movimientoMaximoTemporal !== null && acomp.movimientoMaximoTemporal !== undefined) {
          const entradaHistorial: RegistroMovimiento = {
            id: `mov-acomp-dash-off-${Date.now()}`,
            timestamp: Date.now(),
            tipo: "carrera",
            delta: -velBase,
            anteriorGastado,
            nuevoGastado: anteriorGastado,
            descripcion: "Desactivar Acción Carrera"
          };
          const historialPrevio = Array.isArray(acomp.historialMovimiento) ? acomp.historialMovimiento : [];
          return {
            ...acomp,
            movimientoMaximoTemporal: null,
            historialMovimiento: [...historialPrevio.slice(-49), entradaHistorial]
          };
        }

        // Activamos la carrera (doble de velocidad base)
        const velocidadCarrera = velBase * 2;
        const entradaHistorial: RegistroMovimiento = {
          id: `mov-acomp-dash-on-${Date.now()}`,
          timestamp: Date.now(),
          tipo: "carrera",
          delta: velBase,
          anteriorGastado,
          nuevoGastado: anteriorGastado,
          descripcion: `Acción Carrera activada (+${velBase} ft)`
        };
        const historialPrevio = Array.isArray(acomp.historialMovimiento) ? acomp.historialMovimiento : [];

        return {
          ...acomp,
          movimientoMaximoTemporal: velocidadCarrera,
          historialMovimiento: [...historialPrevio.slice(-49), entradaHistorial]
        };
      })
    }));
  },

  establecerTipoTerrenoAcompanante: (idPersonaje, idAcompanante, tipo) => {
    mutarPersonaje(set, idPersonaje, (pj) => ({
      ...pj,
      acompanantes: (pj.acompanantes || []).map((acomp) => {
        if (acomp.id !== idAcompanante) return acomp;

        const multiplicador = MULTIPLICADOR_POR_TERRENO[tipo] ?? 1;
        if (acomp.tipoTerreno === tipo && acomp.multiplicadorTerreno === multiplicador) {
          return acomp;
        }

        const infoTerreno = INFORMACION_TERRENO[tipo] || { nombre: tipo, costePies: `${multiplicador}x` };
        const entradaHistorial: RegistroMovimiento = {
          id: `mov-acomp-terr-${Date.now()}`,
          timestamp: Date.now(),
          tipo: "terreno",
          delta: 0,
          anteriorGastado: acomp.movimientoGastado || 0,
          nuevoGastado: acomp.movimientoGastado || 0,
          descripcion: `Terreno cambiado a: ${infoTerreno.nombre} (${infoTerreno.costePies})`
        };
        const historialPrevio = Array.isArray(acomp.historialMovimiento) ? acomp.historialMovimiento : [];

        return {
          ...acomp,
          tipoTerreno: tipo,
          multiplicadorTerreno: multiplicador,
          historialMovimiento: [...historialPrevio.slice(-49), entradaHistorial]
        };
      })
    }));
  }
});

